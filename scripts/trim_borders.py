"""
Trim the thin white letterbox strips (top/bottom, occasionally left/right)
left over from the brochure page renders. Scans rows/columns from each edge
inward until it finds genuine photo content (not near-white), then crops.
"""
from PIL import Image
import os
import numpy as np

IMG_DIR = r"C:\Users\MSI\Desktop\Ruchira site\public\images"

# Photographic/graphic images that may still carry a white top/bottom strip.
TARGETS = [
    "hero-tower-exterior.jpg",
    "entrance-signage.jpg",
    "sky-bridge-garden.jpg",
    "rooftop-deck-lounge.jpg",
    "kids-play-garden.jpg",
    "sky-bridge-walkway.jpg",
    "sports-court-aerial.jpg",
    "plaza-fountain.jpg",
    "kids-splash-pool.jpg",
    "pool-aerial.jpg",
    "ground-floor-master-plan.jpg",
    "unique-tower-plan.jpg",
    "floorplan-2bhk.jpg",
    "floorplan-3bhk-a.jpg",
    "floorplan-3bhk-b.jpg",
    "floorplan-3bhk-c.jpg",
    "floorplan-3bhk-d.jpg",
    "floorplan-3-5bhk.jpg",
    "floorplan-4bhk.jpg",
]

WHITE_THRESHOLD = 247  # mean channel value above which a row/col counts as "white"
STD_THRESHOLD = 6      # and must also be low-variance (flat) to avoid cropping bright photo content


def is_blank(line: np.ndarray) -> bool:
    return line.mean() >= WHITE_THRESHOLD and line.std() <= STD_THRESHOLD


def trim(img: Image.Image, pad=2) -> Image.Image:
    arr = np.asarray(img.convert("RGB")).astype(np.float32)
    h, w, _ = arr.shape

    top = 0
    while top < h // 2 and is_blank(arr[top]):
        top += 1
    bottom = h - 1
    while bottom > h // 2 and is_blank(arr[bottom]):
        bottom -= 1
    left = 0
    while left < w // 2 and is_blank(arr[:, left]):
        left += 1
    right = w - 1
    while right > w // 2 and is_blank(arr[:, right]):
        right -= 1

    top = max(0, top - pad)
    left = max(0, left - pad)
    bottom = min(h - 1, bottom + pad)
    right = min(w - 1, right + pad)

    return img.crop((left, top, right + 1, bottom + 1))


def main():
    for name in TARGETS:
        path = os.path.join(IMG_DIR, name)
        if not os.path.exists(path):
            print(f"skip (missing): {name}")
            continue
        img = Image.open(path)
        before = img.size
        cropped = trim(img)
        after = cropped.size
        if after != before:
            cropped.save(path, "JPEG", quality=92, optimize=True)
            print(f"{name}: {before} -> {after}")
        else:
            print(f"{name}: no change ({before})")


if __name__ == "__main__":
    main()
