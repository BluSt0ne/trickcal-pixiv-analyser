"""
Dataset loader for Trickcal character images.

Expected directory structure:
  data/
    train/
      에르핀/  (one folder per character, folder name = class label)
        img001.jpg
        img002.png
        ...
      네르/
        ...
    val/
      에르핀/
        ...
"""
import json
import os
from pathlib import Path

from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms

TRAIN_TRANSFORMS = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.RandomRotation(15),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

VAL_TRANSFORMS = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225]),
])

INFER_TRANSFORMS = VAL_TRANSFORMS


class CharacterDataset(Dataset):
    def __init__(self, root: str, transform=None):
        import torch
        self.root = Path(root)
        self.transform = transform
        
        # Load classes from classes.json to guarantee consistency
        classes_json_path = Path('ml/classes.json')
        if classes_json_path.exists():
            with open(classes_json_path, encoding='utf-8') as f:
                self.classes = json.load(f)
        else:
            # Fallback to scanning root folders (excluding special folders like 'multilabel')
            self.classes = sorted([
                d.name for d in self.root.iterdir() if d.is_dir() and d.name != 'multilabel'
            ])
            
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}

        self.samples = []
        
        # 1. Scan single-label folders (backward compatibility)
        for cls in self.classes:
            cls_dir = self.root / cls
            if cls_dir.exists():
                for img_path in cls_dir.iterdir():
                    if img_path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                        # For single-label, build a multi-hot vector with just this class active
                        label_vec = [0.0] * len(self.classes)
                        label_vec[self.class_to_idx[cls]] = 1.0
                        self.samples.append((img_path, label_vec))
                        
        # 2. Load multi-label JSON metadata
        metadata_path = Path('ml/dataset_multilabel.json')
        if metadata_path.exists():
            try:
                with open(metadata_path, encoding='utf-8') as f:
                    metadata = json.load(f)
                for rel_path, tags in metadata.items():
                    # Check if the file actually exists
                    img_path = Path(rel_path)
                    if img_path.exists():
                        label_vec = [0.0] * len(self.classes)
                        # Mark all active tags
                        has_active_tag = False
                        for tag in tags:
                            if tag in self.class_to_idx:
                                label_vec[self.class_to_idx[tag]] = 1.0
                                has_active_tag = True
                        
                        # Only add if it contains at least one class we care about
                        if has_active_tag:
                            self.samples.append((img_path, label_vec))
            except Exception as e:
                print(f"Warning: Failed to load multi-label metadata: {e}")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        import torch
        path, label_vec = self.samples[idx]
        img = Image.open(path).convert('RGB')
        if self.transform:
            img = self.transform(img)
        return img, torch.tensor(label_vec, dtype=torch.float32)


def save_classes(classes: list[str], out_path: str = 'ml/classes.json'):
    """Persist the class list so the inference server can load it."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(classes, f, ensure_ascii=False, indent=2)


def load_classes(path: str = 'ml/classes.json') -> list[str]:
    with open(path, encoding='utf-8') as f:
        return json.load(f)
