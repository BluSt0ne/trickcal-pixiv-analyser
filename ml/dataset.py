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
        self.root = Path(root)
        self.transform = transform
        self.classes = sorted([
            d.name for d in self.root.iterdir() if d.is_dir()
        ])
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}

        self.samples: list[tuple[Path, int]] = []
        for cls in self.classes:
            for img_path in (self.root / cls).iterdir():
                if img_path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
                    self.samples.append((img_path, self.class_to_idx[cls]))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert('RGB')
        if self.transform:
            img = self.transform(img)
        return img, label


def save_classes(classes: list[str], out_path: str = 'ml/classes.json'):
    """Persist the class list so the inference server can load it."""
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(classes, f, ensure_ascii=False, indent=2)


def load_classes(path: str = 'ml/classes.json') -> list[str]:
    with open(path, encoding='utf-8') as f:
        return json.load(f)
