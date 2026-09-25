"""Prepare motion-compensated in-betweens, not a runtime video.

uv run --with pillow --with opencv-python-headless scripts/interpolate-terrace-cat.py
"""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1]
atlas = Image.open(root / "public/terrace/cat.webp").convert("RGBA")
sequence = [0, 1, 2, 3, 2, 4, 5, 6, 7, 8, 7, 6, 9, 10, 11, 0]
size, count = 192, 9
result = Image.new("RGBA", (size * count, size * len(sequence)))
flow_engine = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
y, x = np.mgrid[0:size, 0:size].astype(np.float32)


def pose(index):
    col, row = index % 4, index // 4
    return np.array(atlas.crop((col * 384, row * 384, (col + 1) * 384, (row + 1) * 384))
                    .resize((size, size), Image.Resampling.LANCZOS), dtype=np.float32) / 255


def gray(rgba):
    rgb = rgba[:, :, :3] * rgba[:, :, 3:4] + 0.85 * (1 - rgba[:, :, 3:4])
    return cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)


for row, target in enumerate(sequence):
    a = pose(sequence[max(0, row - 1)])
    b = pose(target)
    forward = flow_engine.calc(gray(a), gray(b), None)
    backward = flow_engine.calc(gray(b), gray(a), None)
    # Work in premultiplied colour to avoid dark/coloured transparent fringes.
    a[:, :, :3] *= a[:, :, 3:4]
    b[:, :, :3] *= b[:, :, 3:4]
    for col in range(count):
        t = col / (count - 1)
        wa = cv2.remap(a, x - t * forward[:, :, 0], y - t * forward[:, :, 1], cv2.INTER_LINEAR)
        wb = cv2.remap(b, x - (1 - t) * backward[:, :, 0], y - (1 - t) * backward[:, :, 1], cv2.INTER_LINEAR)
        image = wa * (1 - t) + wb * t
        image[:, :, :3] /= np.maximum(image[:, :, 3:4], 1 / 255)
        rgba = (np.clip(image, 0, 1) * 255).astype(np.uint8)
        result.paste(Image.fromarray(rgba), (col * size, row * size))

result.save(root / "public/terrace/cat-motion.webp", quality=94)
print(f"Built {len(sequence) * count} independently addressable motion frames")
