"""
Extract high-quality raster images from The Rise brochure PDF.
Renders selected pages at high zoom, then auto-crops the surrounding
page-canvas border (sampled from the corner pixel, works for both
white-bordered and dark-green-bordered slides) so we get a clean
photo/diagram crop suitable for a website.
"""
import fitz  # PyMuPDF
from PIL import Image, ImageChops
import os

PDF_PATH = r"C:\Users\MSI\Downloads\reports(1)\The Rise_Client PPT.pdf"
OUT_DIR = r"C:\Users\MSI\Desktop\Ruchira site\public\images"
os.makedirs(OUT_DIR, exist_ok=True)

ZOOM = 3.0

# page_number (1-indexed) -> output filename (without ext)
PAGES = {
    7:  "hero-tower-exterior",
    9:  "entrance-signage",
    12: "sky-bridge-garden",
    14: "rooftop-deck-lounge",
    17: "kids-play-garden",
    18: "ground-floor-master-plan",
    19: "sky-bridge-walkway",
    20: "unique-tower-plan",
    21: "sports-court-aerial",
    23: "floorplan-2bhk",
    24: "floorplan-3bhk-a",
    25: "floorplan-3bhk-b",
    26: "floorplan-3bhk-c",
    27: "floorplan-3bhk-d",
    28: "floorplan-3-5bhk",
    29: "floorplan-4bhk",
    30: "plaza-fountain",
    32: "kids-splash-pool",
    33: "pool-aerial",
}

def trim_border(img: Image.Image, tolerance=18, pad=10):
    """Crop away a uniform border by diffing against the corner pixel color."""
    rgb = img.convert("RGB")
    corner = rgb.getpixel((2, 2))
    bg = Image.new("RGB", rgb.size, corner)
    diff = ImageChops.difference(rgb, bg)
    diff = ImageChops.add(diff, diff, 2.0, -tolerance)
    bbox = diff.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(img.width, r + pad)
    b = min(img.height, b + pad)
    # guard against over-aggressive crop on near-uniform photos
    if (r - l) < img.width * 0.3 or (b - t) < img.height * 0.3:
        return img
    return img.crop((l, t, r, b))

def main():
    doc = fitz.open(PDF_PATH)
    mat = fitz.Matrix(ZOOM, ZOOM)
    for page_num, name in PAGES.items():
        page = doc[page_num - 1]
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
        img = trim_border(img)
        out_path = os.path.join(OUT_DIR, f"{name}.jpg")
        img.save(out_path, "JPEG", quality=90, optimize=True)
        print(f"page {page_num:>2} -> {name:<28} {img.width}x{img.height}")
    doc.close()

if __name__ == "__main__":
    main()
