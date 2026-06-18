"""
Fine-tuning script for the Trickcal character classifier.

Usage:
  # Stage 1 - train only the new head (fast, ~10 epochs)
  python ml/train.py --data ml/data --epochs 10 --stage 1

  # Stage 2 - unfreeze last 2 ResNet layer groups and fine-tune
  python ml/train.py --data ml/data --epochs 20 --stage 2 --ckpt ml/checkpoints/best_stage1.pt
"""
import argparse
import json
import os
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split

from dataset import CharacterDataset, TRAIN_TRANSFORMS, VAL_TRANSFORMS, save_classes
from model import build_model, unfreeze_backbone


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('--data', default='dataset', help='Path to training images root')
    p.add_argument('--val', default='', help='Path to validation images (auto-split if empty)')
    p.add_argument('--epochs', type=int, default=15)
    p.add_argument('--batch', type=int, default=32)
    p.add_argument('--lr', type=float, default=1e-3)
    p.add_argument('--stage', type=int, default=1, choices=[1, 2],
                   help='1=head only, 2=unfreeze backbone tail')
    p.add_argument('--ckpt', default='', help='Checkpoint to resume from')
    p.add_argument('--out', default='ml/checkpoints', help='Output directory for checkpoints')
    p.add_argument('--classes', default='ml/classes.json')
    return p.parse_args()


def train(args):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')

    # Dataset
    full_ds = CharacterDataset(args.data, transform=TRAIN_TRANSFORMS)
    classes = full_ds.classes
    save_classes(classes, args.classes)
    print(f'Classes ({len(classes)}): {classes}')

    if args.val:
        train_ds = full_ds
        val_ds = CharacterDataset(args.val, transform=VAL_TRANSFORMS)
    else:
        val_size = max(1, int(len(full_ds) * 0.15))
        train_size = len(full_ds) - val_size
        train_ds, val_ds = random_split(full_ds, [train_size, val_size])
        val_ds.dataset.transform = VAL_TRANSFORMS

    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True, num_workers=0, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch, shuffle=False, num_workers=0)

    # Model loading (check if we can load trickcal_model.pth or custom checkpoint offline)
    ckpt_to_load = args.ckpt if args.ckpt else ('trickcal_model.pth' if os.path.exists('trickcal_model.pth') else '')
    pretrained = not bool(ckpt_to_load)
    
    print(f"Building model (pretrained={pretrained})...", flush=True)
    model = build_model(num_classes=len(classes), pretrained=pretrained)
    
    if ckpt_to_load and os.path.exists(ckpt_to_load):
        state = torch.load(ckpt_to_load, map_location='cpu')
        model.load_state_dict(state['model'])
        print(f'Loaded checkpoint: {ckpt_to_load}', flush=True)

    if args.stage == 2:
        unfreeze_backbone(model, layers_from_end=2)

    model = model.to(device)

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr, weight_decay=1e-4
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    criterion = nn.BCEWithLogitsLoss()

    os.makedirs(args.out, exist_ok=True)
    best_f1 = 0.0

    for epoch in range(1, args.epochs + 1):
        # --- Train ---
        model.train()
        total_loss, total = 0.0, 0
        train_correct_elements, train_total_elements = 0, 0
        train_tp, train_fp, train_fn = 0, 0, 0
        
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item() * len(imgs)
            total += len(imgs)
            
            preds = (torch.sigmoid(logits) > 0.5).float()
            train_correct_elements += (preds == labels).sum().item()
            train_total_elements += labels.numel()
            
            train_tp += ((preds == 1.0) & (labels == 1.0)).sum().item()
            train_fp += ((preds == 1.0) & (labels == 0.0)).sum().item()
            train_fn += ((preds == 0.0) & (labels == 1.0)).sum().item()
            
        train_precision = train_tp / (train_tp + train_fp + 1e-8)
        train_recall = train_tp / (train_tp + train_fn + 1e-8)
        train_f1 = 2 * train_precision * train_recall / (train_precision + train_recall + 1e-8)
        train_acc = train_correct_elements / train_total_elements
        scheduler.step()

        # --- Validate ---
        model.eval()
        val_loss, val_total_samples = 0.0, 0
        val_correct_elements, val_total_elements = 0, 0
        val_tp, val_fp, val_fn = 0, 0, 0
        
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                logits = model(imgs)
                loss = criterion(logits, labels)
                
                val_loss += loss.item() * len(imgs)
                val_total_samples += len(imgs)
                
                preds = (torch.sigmoid(logits) > 0.5).float()
                val_correct_elements += (preds == labels).sum().item()
                val_total_elements += labels.numel()
                
                val_tp += ((preds == 1.0) & (labels == 1.0)).sum().item()
                val_fp += ((preds == 1.0) & (labels == 0.0)).sum().item()
                val_fn += ((preds == 0.0) & (labels == 1.0)).sum().item()
                
        val_precision = val_tp / (val_tp + val_fp + 1e-8)
        val_recall = val_tp / (val_tp + val_fn + 1e-8)
        val_f1 = 2 * val_precision * val_recall / (val_precision + val_recall + 1e-8)
        val_acc = val_correct_elements / val_total_elements
        val_loss_avg = val_loss / val_total_samples if val_total_samples else 0.0

        print(f'Epoch {epoch:3d}/{args.epochs}  '
              f'loss={total_loss/total:.4f}  '
              f'train_f1={train_f1:.3f}  '
              f'val_loss={val_loss_avg:.4f}  '
              f'val_f1={val_f1:.3f}  val_acc={val_acc:.3f}')

        ckpt = {
            'epoch': epoch,
            'model': model.state_dict(),
            'classes': classes,
            'val_f1': val_f1,
            'val_acc': val_acc,
        }
        torch.save(ckpt, os.path.join(args.out, f'stage{args.stage}_epoch{epoch:03d}.pt'))

        if val_f1 > best_f1:
            best_f1 = val_f1
            torch.save(ckpt, os.path.join(args.out, f'best_stage{args.stage}.pt'))
            torch.save(ckpt, 'trickcal_model.pth')
            print(f'  -> best model saved to trickcal_model.pth (val_f1={val_f1:.3f})')

    print(f'\nTraining complete. Best val_f1={best_f1:.3f}')


if __name__ == '__main__':
    train(parse_args())
