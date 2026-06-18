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

    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch, shuffle=False, num_workers=2)

    # Model
    model = build_model(num_classes=len(classes))
    if args.ckpt and os.path.exists(args.ckpt):
        state = torch.load(args.ckpt, map_location='cpu')
        model.load_state_dict(state['model'])
        print(f'Loaded checkpoint: {args.ckpt}')

    if args.stage == 2:
        unfreeze_backbone(model, layers_from_end=2)

    model = model.to(device)

    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr, weight_decay=1e-4
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    os.makedirs(args.out, exist_ok=True)
    best_acc = 0.0

    for epoch in range(1, args.epochs + 1):
        # --- Train ---
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            logits = model(imgs)
            loss = criterion(logits, labels)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(imgs)
            correct += (logits.argmax(1) == labels).sum().item()
            total += len(imgs)
        train_acc = correct / total
        scheduler.step()

        # --- Validate ---
        model.eval()
        val_correct, val_total = 0, 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                preds = model(imgs).argmax(1)
                val_correct += (preds == labels).sum().item()
                val_total += len(imgs)
        val_acc = val_correct / val_total if val_total else 0

        print(f'Epoch {epoch:3d}/{args.epochs}  '
              f'loss={total_loss/total:.4f}  '
              f'train_acc={train_acc:.3f}  val_acc={val_acc:.3f}')

        ckpt = {
            'epoch': epoch,
            'model': model.state_dict(),
            'classes': classes,
            'val_acc': val_acc,
        }
        torch.save(ckpt, os.path.join(args.out, f'stage{args.stage}_epoch{epoch:03d}.pt'))

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(ckpt, os.path.join(args.out, f'best_stage{args.stage}.pt'))
            torch.save(ckpt, 'trickcal_model.pth')
            print(f'  -> best model saved to trickcal_model.pth (val_acc={val_acc:.3f})')

    print(f'\nTraining complete. Best val_acc={best_acc:.3f}')


if __name__ == '__main__':
    train(parse_args())
