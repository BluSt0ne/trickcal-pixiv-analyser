import json
import os
import sys
import io
import time
import requests
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms

def check_character_match(tag, char_name, ja_names):
    tag_lower = tag.lower()
    ko_lower = char_name.lower()
    if tag_lower == ko_lower or tag_lower.startswith(ko_lower + "(") or tag_lower.startswith(ko_lower + " ("):
        return True
    for ja_name in ja_names:
        ja_lower = ja_name.lower()
        if tag_lower == ja_lower or tag_lower.startswith(ja_lower + "(") or tag_lower.startswith(ja_lower + " ("):
            return True
    return False

def main():
    # Force UTF-8 output to avoid Windows console errors
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except Exception:
        pass

    print("====================================================", flush=True)
    print("AI Character Classifier: Real-world Pixiv Evaluation", flush=True)
    print("====================================================", flush=True)

    # 1. Load classes, japanese names map, and download history
    classes_path = 'ml/classes.json'
    jnames_path = 'public/japanese_names.json'
    history_path = 'ml/download_history.json'

    if not os.path.exists(classes_path) or not os.path.exists(jnames_path) or not os.path.exists(history_path):
        print("Error: Missing dataset configuration files.", flush=True)
        return

    with open(classes_path, encoding='utf-8') as f:
        classes = json.load(f)
    with open(jnames_path, encoding='utf-8') as f:
        ja_map = json.load(f)
    with open(history_path, encoding='utf-8') as f:
        download_history = json.load(f)

    # Map Japanese names back to Korean class names
    # (Removed because we use the check_character_match function)

    # Create a set of all processed IDs (downloaded or deleted in any class)
    processed_ids = set()
    for ko_name, history in download_history.items():
        for art_id in history.keys():
            processed_ids.add(str(art_id))

    # 2. Build model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loading ResNet50 model on device: {device}...", flush=True)
    net = models.resnet50()
    in_features = net.fc.in_features
    net.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 512),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(512, len(classes)),
    )
    net.load_state_dict(torch.load('trickcal_model.pth', map_location=device)['model'])
    net = net.to(device)
    net.eval()

    t = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    # 3. Query Pixiv search pages sequentially
    target_count = 200
    evaluated = 0
    correct = 0
    page = 1
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }

    # Load cookie if available
    cookie = os.environ.get('PIXIV_COOKIE', '')
    if not cookie:
        from dotenv import load_dotenv
        load_dotenv()
        cookie = os.getenv('PIXIV_COOKIE', '')
    if cookie:
        headers['Cookie'] = cookie
        print("Using PIXIV_COOKIE for download verification.", flush=True)

    queries = ["트릭컬", "トリッカル", "trickcal"]
    attempted_ids = set(processed_ids)
    current_query_idx = 0

    while evaluated < target_count and current_query_idx < len(queries):
        q = queries[current_query_idx]
        print(f"\nSearching page {page} of Pixiv artworks for query '{q}'...", flush=True)
        quoted_q = requests.utils.quote(q)
        # Use s_mode=s_tag for partial matching to expand results
        url = f"https://www.pixiv.net/ajax/search/artworks/{quoted_q}?word={quoted_q}&s_mode=s_tag&p={page}"
        
        try:
            r = requests.get(url, headers=headers, timeout=15)
            r.raise_for_status()
            data = r.json()
            artworks = data.get('body', {}).get('illustManga', {}).get('data', [])
        except Exception as e:
            print(f"Error querying query '{q}' page {page}: {e}", flush=True)
            artworks = []
            
        time.sleep(2.0) # Rate limiting delay between search pages

        if not artworks:
            print(f"No more artworks found for query '{q}' on page {page}. Switching to next query.", flush=True)
            current_query_idx += 1
            page = 1
            continue

        for art in artworks:
            if evaluated >= target_count:
                break
                
            art_id = str(art.get('id'))
            if art_id in attempted_ids:
                continue
            attempted_ids.add(art_id)

            title = art.get('title')
            ai_type = art.get('aiType')
            
            # Skip AI-generated
            if ai_type == 2:
                continue

            # Query detailed illust info to inspect tags
            info_url = f"https://www.pixiv.net/ajax/illust/{art_id}"
            try:
                ir = requests.get(info_url, headers=headers, timeout=10)
                ir.raise_for_status()
                idata = ir.json()
            except Exception:
                time.sleep(0.5)
                continue
            time.sleep(0.5) # Sleep between detail page fetches

            body = idata.get('body', {})
            tags_list = body.get('tags', {}).get('tags', [])
            tags = [t.get('tag', '').lower() for t in tags_list]
            
            # Skip animated/ugoira
            if '우고이라' in tags or 'ugoira' in tags:
                continue

            # Detect character name from tags using the check_character_match helper
            detected_chars = set()
            for t_val in tags:
                for ko_name in classes:
                    ja_list = ja_map.get(ko_name, [])
                    if check_character_match(t_val, ko_name, ja_list):
                        detected_chars.add(ko_name)

            # We need EXACTLY ONE unambiguous character name to determine the ground truth
            if len(detected_chars) != 1:
                continue

            ground_truth = list(detected_chars)[0]

            # Get image URL
            img_url = body.get('urls', {}).get('regular') or body.get('urls', {}).get('original')
            if not img_url:
                continue

            # Convert to master1200
            idx = img_url.find('img-master/')
            if idx != -1:
                path_part = img_url[idx:]
                path_part = path_part.replace('_square1200', '_master1200')
                img_url = f"https://i.pximg.net/{path_part}"

            # Download and run inference
            try:
                img_res = requests.get(img_url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pixiv.net/'}, timeout=15)
                img_res.raise_for_status()
                img = Image.open(io.BytesIO(img_res.content)).convert('RGB')
                
                tensor = t(img).unsqueeze(0).to(device)
                with torch.no_grad():
                    out = net(tensor)
                    probs = torch.nn.functional.softmax(out[0], dim=0)
                    top_prob, top_idx = probs.topk(1)
                
                pred_class = classes[top_idx[0].item()]
                prob_pct = top_prob[0].item() * 100
                
                is_correct = pred_class == ground_truth
                evaluated += 1
                if is_correct:
                    correct += 1
                    status_str = "  [PASS]   "
                else:
                    status_str = "❌ [FAIL]   "

                print(f"[{evaluated:03d}/{target_count}] {status_str} "
                      f"ID: {art_id.ljust(10)} | "
                      f"GT: {ground_truth.ljust(10)} | "
                      f"Pred: {pred_class.ljust(10)} ({prob_pct:5.2f}%) | "
                      f"Title: {title}", flush=True)
                
                time.sleep(1.0) # Rate limiting delay between downloads
                      
            except Exception as e:
                continue

        page += 1

    # Print final results
    if evaluated > 0:
        accuracy = (correct / evaluated) * 100
        print("\n" + "="*50, flush=True)
        print("Evaluation Finished!", flush=True)
        print(f"Total Evaluated: {evaluated} images", flush=True)
        print(f"Correct Predictions: {correct} images", flush=True)
        print(f"AI Accuracy: {accuracy:.2f}%", flush=True)
        print("="*50, flush=True)
    else:
        print("No test images were evaluated.", flush=True)

if __name__ == "__main__":
    main()
