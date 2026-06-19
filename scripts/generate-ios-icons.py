#!/usr/bin/env python3
"""
Generate the full iOS AppIcon set for Swipess.

Produces fully OPAQUE, full-bleed PNGs (no alpha channel) so the App Store
accepts them — Apple rejects marketing/app icons that contain transparency
(error ITMS-90717) and flags empty/placeholder icons (guideline 2.3.8).

Design: brand wordmark monogram "S" (heavy italic, matching the SWIPESS
wordmark) on a warm diagonal brand gradient (violet -> coral -> orange).

Run:  python3 scripts/generate-ios-icons.py
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "ios", "App", "App",
                   "Assets.xcassets", "AppIcon.appiconset")
FONT_PATH = "/usr/share/fonts/truetype/freefont/FreeSansBoldOblique.ttf"

MASTER = 1024

# filename -> pixel size (mirrors AppIcon.appiconset/Contents.json)
TARGETS = {
    "Swipess_AppStore_Icon_1024.png": 1024,
    "Swipess_Icon_iphone_20x20@2x.png": 40,
    "Swipess_Icon_iphone_20x20@3x.png": 60,
    "Swipess_Icon_iphone_29x29@2x.png": 58,
    "Swipess_Icon_iphone_29x29@3x.png": 87,
    "Swipess_Icon_iphone_40x40@2x.png": 80,
    "Swipess_Icon_iphone_40x40@3x.png": 120,
    "Swipess_Icon_iphone_60x60@2x.png": 120,
    "Swipess_Icon_iphone_60x60@3x.png": 180,
    "Swipess_Icon_ipad_20x20.png": 20,
    "Swipess_Icon_ipad_20x20@2x.png": 40,
    "Swipess_Icon_ipad_29x29.png": 29,
    "Swipess_Icon_ipad_29x29@2x.png": 58,
    "Swipess_Icon_ipad_40x40.png": 40,
    "Swipess_Icon_ipad_40x40@2x.png": 80,
    "Swipess_Icon_ipad_76x76.png": 76,
    "Swipess_Icon_ipad_76x76@2x.png": 152,
    "Swipess_Icon_ipad_83_5x83_5@2x.png": 167,
}

# Brand gradient stops (top-left -> mid -> bottom-right)
C0 = np.array([74, 21, 117], dtype=float)    # deep violet  #4A1575
C1 = np.array([224, 64, 122], dtype=float)   # coral        #E0407A
C2 = np.array([255, 158, 50], dtype=float)   # warm orange  #FF9E32
MID = 0.55  # position of the coral stop along the diagonal


def gradient(size: int) -> Image.Image:
    yy, xx = np.mgrid[0:size, 0:size].astype(float)
    t = (xx + yy) / (2 * (size - 1))            # 0 (top-left) .. 1 (bottom-right)
    a = np.clip(t / MID, 0, 1)[..., None]
    b = np.clip((t - MID) / (1 - MID), 0, 1)[..., None]
    lower = C0 * (1 - a) + C1 * a
    upper = C1 * (1 - b) + C2 * b
    rgb = np.where(t[..., None] < MID, lower, upper)

    # subtle radial highlight for depth (lighten toward center)
    cx = cy = (size - 1) / 2
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (size / 2)
    glow = np.clip(1 - r, 0, 1)[..., None] ** 2 * 26.0
    rgb = np.clip(rgb + glow, 0, 255)
    return Image.fromarray(rgb.astype("uint8"), "RGB")


def make_master() -> Image.Image:
    # supersample 2x for crisp glyph edges, then downscale
    ss = MASTER * 2
    bg = gradient(ss)

    layer = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    font = ImageFont.truetype(FONT_PATH, int(ss * 0.74))
    text = "S"
    # measure & center using the glyph bounding box
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (ss - tw) / 2 - bbox[0]
    y = (ss - th) / 2 - bbox[1]
    d.text((x, y), text, font=font, fill=(255, 255, 255, 255))

    # soft drop shadow under the glyph
    shadow = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    ds = ImageDraw.Draw(shadow)
    ds.text((x, y + ss * 0.012), text, font=font, fill=(40, 8, 60, 150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(ss * 0.012))

    comp = Image.alpha_composite(bg.convert("RGBA"), shadow)
    comp = Image.alpha_composite(comp, layer)
    master = comp.convert("RGB").resize((MASTER, MASTER), Image.LANCZOS)
    return master


def main() -> None:
    master = make_master()
    os.makedirs(OUT, exist_ok=True)
    for name, size in TARGETS.items():
        img = master if size == MASTER else master.resize((size, size), Image.LANCZOS)
        # force RGB (no alpha) so Apple does not reject for transparency
        img.convert("RGB").save(os.path.join(OUT, name), "PNG", optimize=True)
        print(f"  wrote {name} ({size}x{size})")
    print("Done. All icons are opaque RGB (no alpha channel).")


if __name__ == "__main__":
    main()
