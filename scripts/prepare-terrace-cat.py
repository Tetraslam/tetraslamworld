"""Build the cat atlas and masked clean plate from the approved source images.

Usage: uv run --with pillow scripts/prepare-terrace-cat.py CLEAN.png POSES.png
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parents[1]
destination = root / "public" / "terrace"
destination.mkdir(exist_ok=True)

original = Image.open(root / "public" / "terrace.webp").convert("RGB")
patch = Image.open(sys.argv[1]).convert("RGB").resize((400, 280), Image.Resampling.LANCZOS)
mask = Image.new("L", (400, 280))
ImageDraw.Draw(mask).polygon(
    [(69, 94), (92, 76), (139, 77), (185, 83), (240, 85),
     (268, 125), (258, 158), (143, 144), (113, 145), (103, 180),
     (76, 184), (64, 156)],
    fill=255,
)
mask = mask.filter(ImageFilter.GaussianBlur(3))
original.paste(patch, (160, 650), mask)
original.save(destination / "clean.webp", quality=94)

sheet = Image.open(sys.argv[2]).convert("RGBA")
atlas = Image.new("RGBA", (384 * 4, 384 * 3))
for index in range(12):
    col, row = index % 4, index // 4
    cell = sheet.crop((round(col * sheet.width / 4), round(row * sheet.height / 3),
                       round((col + 1) * sheet.width / 4), round((row + 1) * sheet.height / 3)))
    pixels = []
    for r, g, b, a in cell.getdata():
        # Remove chroma spill and isolated saturated matte artifacts, retaining fur.
        if (g > r * 1.15 and g > b * 1.3) or (r > 210 and g < 75 and b < 75) or (r > 190 and g > 190 and b < 70):
            a = 0
        pixels.append((r, g, b, a))
    cell.putdata(pixels)
    alpha = cell.getchannel("A")
    solid = alpha.point(lambda a: 255 if a > 100 else 0)
    solid = solid.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    bounds = solid.getbbox()
    if bounds is None:
        raise ValueError(f"Empty cat pose {index}")
    cell = cell.crop(bounds)
    # All poses share a contact baseline. Do not resize each silhouette to a
    # common height: standing and stretching must retain their natural height.
    if cell.width > 368:
        cell = cell.resize((368, round(cell.height * 368 / cell.width)), Image.Resampling.LANCZOS)
    atlas.alpha_composite(cell, (col * 384 + (384 - cell.width) // 2, row * 384 + 326 - cell.height))

atlas.save(destination / "cat.webp", lossless=True)
print("Built clean.webp and cat.webp")
