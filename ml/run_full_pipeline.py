"""
run_full_pipeline.py — 스크래핑 → 재학습 원클릭 파이프라인

사용법:
  py ml/run_full_pipeline.py [목표장수=200]
"""
import subprocess
import sys
import os
import time

TARGET = sys.argv[1] if len(sys.argv) > 1 else '200'


def run_cmd(cmd, cwd=None):
    print(f"\n>>> {' '.join(str(c) for c in cmd)}", flush=True)
    t0 = time.time()
    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, bufsize=1, cwd=cwd,
        encoding='utf-8', errors='replace'
    )
    for line in process.stdout:
        print(line, end='', flush=True)
    process.wait()
    elapsed = time.time() - t0
    print(f"  (소요: {elapsed/60:.1f}분)", flush=True)
    if process.returncode != 0:
        print(f"  ERROR: exit code {process.returncode}", flush=True)
        sys.exit(process.returncode)
    return elapsed


def main():
    print("=" * 60)
    print(f"Trickcal Full Pipeline: Scraping + Retrain")
    print(f"Target per character: {TARGET} images")
    print("=" * 60)

    # --- Step 1: Fast Scraping ---
    print("\n[1/3] Scraping started...")
    t_scrape = run_cmd(['node', 'ml/scrape_fast.js', TARGET])

    # --- Step 2: Stage 1 Training ---
    print("\n[2/3] Stage 1 training (Frozen backbone, 5 epochs)...")
    ckpt1 = 'ml/checkpoints/best_stage1.pt'
    if os.path.exists(ckpt1):
        os.remove(ckpt1)
        print(f"  -> Removed old {ckpt1} (fresh training)")

    t_s1 = run_cmd([sys.executable, '-u', 'ml/train.py', '--stage', '1', '--epochs', '5'])

    # --- Step 3: Stage 2 Training ---
    print("\n[3/3] Stage 2 training (Unfrozen tail, 10 epochs)...")
    if not os.path.exists(ckpt1):
        print(f"  ERROR: Stage 1 checkpoint missing: {ckpt1}")
        sys.exit(1)

    t_s2 = run_cmd([sys.executable, '-u', 'ml/train.py', '--stage', '2', '--epochs', '10', '--ckpt', ckpt1])

    total = t_scrape + t_s1 + t_s2
    print("\n" + "=" * 60)
    print(f"Pipeline complete!")
    print(f"  Scraping:  {t_scrape/60:.1f}m")
    print(f"  Stage 1:   {t_s1/60:.1f}m")
    print(f"  Stage 2:   {t_s2/60:.1f}m")
    print(f"  Total:     {total/60:.1f}m")
    print("=" * 60)
    print("Restart server: py -m uvicorn server:app --app-dir ml --host 0.0.0.0 --port 8000")


if __name__ == '__main__':
    main()
