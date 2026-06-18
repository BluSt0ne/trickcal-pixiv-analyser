import os
import sys
import io
import json
import time
import requests
from PIL import Image

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
    # Force UTF-8 stdout
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except Exception:
        pass

    print("====================================================", flush=True)
    print("Pixiv Fast Multi-Label Character Image Scraper", flush=True)
    print("====================================================", flush=True)

    # 1. Load configuration and classes
    classes_path = 'ml/classes.json'
    jnames_path = 'public/japanese_names.json'
    metadata_path = 'ml/dataset_multilabel.json'

    if not os.path.exists(classes_path) or not os.path.exists(jnames_path):
        print("Error: Missing dataset configuration files.", flush=True)
        return

    with open(classes_path, encoding='utf-8') as f:
        classes = json.load(f)
    with open(jnames_path, encoding='utf-8') as f:
        ja_map = json.load(f)

    # Load existing metadata if it exists
    metadata = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, encoding='utf-8') as f:
                metadata = json.load(f)
            print(f"Loaded existing metadata with {len(metadata)} images.", flush=True)
        except Exception as e:
            print(f"Warning: Failed to load existing metadata, starting fresh: {e}", flush=True)

    # Create target directory for multi-label images
    multilabel_dir = 'dataset/multilabel'
    os.makedirs(multilabel_dir, exist_ok=True)

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

    # We also keep track of downloaded/attempted IDs in this session to prevent duplicate processing
    attempted_ids = set()
    for path_key in metadata.keys():
        base = os.path.basename(path_key)
        art_id = os.path.splitext(base)[0]
        attempted_ids.add(art_id)

    # Pixiv search parameters
    queries = ["트릭컬", "トリッカル", "trickcal"]
    target_downloads = 200
    downloaded = 0
    current_query_idx = 0
    page = 1

    while downloaded < target_downloads and current_query_idx < len(queries):
        q = queries[current_query_idx]
        print(f"\nSearching page {page} of Pixiv artworks for query '{q}'...", flush=True)
        quoted_q = requests.utils.quote(q)
        url = f"https://www.pixiv.net/ajax/search/artworks/{quoted_q}?word={quoted_q}&s_mode=s_tag&p={page}"
        
        try:
            r = requests.get(url, headers=headers, timeout=15)
            r.raise_for_status()
            data = r.json()
            artworks = data.get('body', {}).get('illustManga', {}).get('data', [])
        except Exception as e:
            print(f"Error querying query '{q}' page {page}: {e}", flush=True)
            artworks = []
            
        time.sleep(2.0) # Polite delay between search requests

        if not artworks:
            print(f"No more artworks found for query '{q}' on page {page}. Switching to next query.", flush=True)
            current_query_idx += 1
            page = 1
            continue

        for art in artworks:
            if downloaded >= target_downloads:
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

            # Read tags directly from the search result item
            tags = art.get('tags', [])
            tags = [t.lower() for t in tags]
            
            # Skip animated/ugoira
            if '우고이라' in tags or 'ugoira' in tags:
                continue

            # Detect character names from tags using the check_character_match helper
            detected_chars = set()
            for t_val in tags:
                for ko_name in classes:
                    ja_list = ja_map.get(ko_name, [])
                    if check_character_match(t_val, ko_name, ja_list):
                        detected_chars.add(ko_name)

            # We need AT LEAST TWO matching characters to consider this a multi-label image
            if len(detected_chars) < 2:
                continue

            detected_list = sorted(list(detected_chars))
            print(f"Found multi-character image: ID {art_id} | Characters: {detected_list} | Title: {title}", flush=True)

            # Get image URL directly from search result item
            img_url = art.get('url')
            if not img_url:
                continue

            # Convert to master1200
            idx = img_url.find('img-master/')
            if idx != -1:
                path_part = img_url[idx:]
                path_part = path_part.replace('_square1200', '_master1200')
                img_url = f"https://i.pximg.net/{path_part}"

            # Download image
            try:
                img_res = requests.get(img_url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pixiv.net/'}, timeout=15)
                img_res.raise_for_status()
                
                # Check if it's a valid image
                img = Image.open(io.BytesIO(img_res.content)).convert('RGB')
                
                # Save image
                ext = os.path.splitext(img_url)[1] or '.jpg'
                dest_path = f"{multilabel_dir}/{art_id}{ext}"
                with open(dest_path, 'wb') as f:
                    f.write(img_res.content)
                
                # Record to metadata JSON
                dest_path_key = dest_path.replace('\\', '/')
                metadata[dest_path_key] = detected_list
                with open(metadata_path, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, ensure_ascii=False, indent=2)
                
                downloaded += 1
                print(f"  -> Successfully downloaded to {dest_path_key} [{downloaded}/{target_downloads}]", flush=True)
                time.sleep(1.5) # Polite delay after download
                
            except Exception as e:
                print(f"  -> Error downloading image: {e}", flush=True)
                continue

        page += 1

    print("\n====================================================", flush=True)
    print(f"Scraping Finished! Downloaded {downloaded} multi-character images.", flush=True)
    print("====================================================", flush=True)

if __name__ == '__main__':
    main()
