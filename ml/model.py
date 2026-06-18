"""
ResNet50-based character classifier with fine-tuning support.
The final FC layer is replaced to match the number of Trickcal characters.
"""
import torch
import torch.nn as nn
from torchvision import models


def build_model(num_classes: int, pretrained: bool = True) -> nn.Module:
    """Return a ResNet50 with a replaced classification head."""
    weights = models.ResNet50_Weights.DEFAULT if pretrained else None
    model = models.resnet50(weights=weights)

    # Freeze backbone, only train the new head initially
    for param in model.parameters():
        param.requires_grad = False

    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(512, num_classes),
    )
    return model


def unfreeze_backbone(model: nn.Module, layers_from_end: int = 2):
    """Gradually unfreeze the last N layer groups for fine-tuning stage 2."""
    children = list(model.children())
    for child in children[-layers_from_end:]:
        for param in child.parameters():
            param.requires_grad = True
