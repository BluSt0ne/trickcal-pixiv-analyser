"""
FastAPI inference server for Trickcal character classification.

Start with:
  uvicorn ml.server:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
  POST /classify/url   { "image_url": "https://..." }  -> predictions
  POST /classify/file  multipart image upload          -> predictions
  GET  /health                                         -> status
"""
import io
import json
import os
from pathlib import Path
from typing import Optional

import requests
import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel

from dataset import INFER_TRANSFORMS, load_classes
from model import build_model

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CHECKPOINT_PATH = os.environ.get('CKPT_PATH', 'trickcal_model.pth')
CLASSES_PATH = os.environ.get('CLASSES_PATH', 'ml/classes.json')
TOP_K = int(os.environ.get('TOP_K', '5'))
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

app = FastAPI(title='Trickcal Character Classifier')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# ---------------------------------------------------------------------------
# Model loading (lazy, on first request)
# ---------------------------------------------------------------------------
_model: Optional[torch.nn.Module] = None
_classes: Optional[list[str]] = None


def get_model():
    global _model, _classes
    if _model is not None:
        return _model, _classes

    if not Path(CHECKPOINT_PATH).exists():
        raise RuntimeError(
            f'Checkpoint not found at {CHECKPOINT_PATH}. '
            'Run ml/train.py first to create a trained model.'
        )

    ckpt = torch.load(CHECKPOINT_PATH, map_location='cpu')
    _classes = ckpt.get('classes') or load_classes(CLASSES_PATH)
    _model = build_model(num_classes=len(_classes), pretrained=False)
    _model.load_state_dict(ckpt['model'])
    _model.eval().to(DEVICE)
    print(f'Model loaded. Classes: {_classes}')
    return _model, _classes


# ---------------------------------------------------------------------------
# Inference helper
# ---------------------------------------------------------------------------
def _classify_pil(img: Image.Image) -> list[dict]:
    model, classes = get_model()
    tensor = INFER_TRANSFORMS(img.convert('RGB')).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits = model(tensor)
        probs = F.softmax(logits, dim=1)[0]

    top_k = min(TOP_K, len(classes))
    top_probs, top_idx = probs.topk(top_k)
    return [
        {'character': classes[i], 'probability': round(float(p), 4)}
        for p, i in zip(top_probs.tolist(), top_idx.tolist())
    ]


def _download_image(url: str) -> Image.Image:
    """Download image with Pixiv-compatible headers."""
    headers = {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://www.pixiv.net/',
    }
    try:
        r = requests.get(url, headers=headers, timeout=15, stream=True)
        r.raise_for_status()
        return Image.open(io.BytesIO(r.content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Failed to download image: {e}')


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
class UrlRequest(BaseModel):
    image_url: str


@app.get('/health')
def health():
    ckpt_exists = Path(CHECKPOINT_PATH).exists()
    return {
        'status': 'ok',
        'model_ready': ckpt_exists,
        'checkpoint': CHECKPOINT_PATH,
        'device': str(DEVICE),
    }


@app.post('/classify/url')
def classify_url(req: UrlRequest):
    img = _download_image(req.image_url)
    predictions = _classify_pil(img)
    return {'predictions': predictions}


@app.post('/classify/file')
async def classify_file(file: UploadFile = File(...)):
    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail='Invalid image file')
    predictions = _classify_pil(img)
    return {'predictions': predictions}
