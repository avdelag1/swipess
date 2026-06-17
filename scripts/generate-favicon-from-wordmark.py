#!/usr/bin/env python3
"""Regenerate favicon + PWA icons from the official Swipess wordmark (main page logo)."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "public" / "icons"
SOURCE = ICONS / "Swipess-wordmark-white.png"
BG = (0, 0, 0, 255)

SIZES = [
    16, 32, 48, 57, 60, 72, 76, 96, 114, 120, 144, 152, 167, 180, 192, 512, 1024,
]


def render_icon(size: int, *, maskable: bool = False) -> Image.Image:
    wordmark = Image.open(SOURCE).convert("RGBA")
    canvas = Image.new("RGBA", (size, size), BG)

    # Maskable icons need extra safe-zone padding (~20%)
    pad_ratio = 0.22 if maskable else 0.12
    max_w = int(size * (1 - pad_ratio * 2))
    max_h = int(size * (1 - pad_ratio * 2))
    ratio = min(max_w / wordmark.width, max_h / wordmark.height)
    new_size = (max(1, int(wordmark.width * ratio)), max(1, int(wordmark.height * ratio)))
    resized = wordmark.resize(new_size, Image.Resampling.LANCZOS)

    x = (size - new_size[0]) // 2
    y = (size - new_size[1]) // 2
    canvas.paste(resized, (x, y), resized)
    return canvas


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"  {path.relative_to(ROOT)}")


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source wordmark: {SOURCE}")

    print(f"Source: {SOURCE.name}")
    print("Generating icons…")

    rendered: dict[int, Image.Image] = {}
    for size in SIZES:
        rendered[size] = render_icon(size)
        save_png(rendered[size], ICONS / f"icon-{size}.png")
        save_png(rendered[size], ICONS / f"apple-touch-icon-{size}x{size}.png")
        if size in (57, 60, 72, 76, 114, 120, 144, 152, 167, 180):
            save_png(rendered[size], ICONS / f"apple-touch-icon-{size}.png")

    save_png(rendered[180], ICONS / "apple-touch-icon.png")
    save_png(rendered[192], ICONS / "maskable-192.png")
    save_png(render_icon(512, maskable=True), ICONS / "maskable-512.png")

    for size in (64, 128, 256):
        if size not in rendered:
            rendered[size] = render_icon(size)

    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_master = rendered[48].convert("RGBA")
    for ico_path in (ROOT / "public" / "favicon.ico", ICONS / "favicon.ico"):
        ico_path.parent.mkdir(parents=True, exist_ok=True)
        ico_master.save(ico_path, format="ICO", sizes=ico_sizes)
        print(f"  {ico_path.relative_to(ROOT)}")

    save_png(rendered[32], ROOT / "public" / "favicon.png")
    save_png(rendered[32], ICONS / "favicon.png")
    save_png(rendered[512], ROOT / "public" / "icons" / "icon-512.png")

    print("Done.")


if __name__ == "__main__":
    main()