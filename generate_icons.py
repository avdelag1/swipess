from PIL import Image
import os

source_image_path = "resources/icon.png"
if not os.path.exists(source_image_path):
    print("Source image not found.")
    exit(1)

img = Image.open(source_image_path)
img = img.convert("RGBA")

# Create a solid black background
bg = Image.new("RGBA", img.size, (0, 0, 0, 255))
# Paste the image on top, using its alpha channel as a mask
bg.paste(img, (0, 0), img)
img = bg.convert("RGB")

icons = [
    ("AppIcon-20x20@2x.png", 40),
    ("AppIcon-20x20@2x-1.png", 40),
    ("AppIcon-20x20@3x.png", 60),
    ("AppIcon-29x29@2x.png", 58),
    ("AppIcon-29x29@2x-1.png", 58),
    ("AppIcon-29x29@3x.png", 87),
    ("AppIcon-38x38@2x.png", 76),
    ("AppIcon-38x38@3x.png", 114),
    ("AppIcon-40x40@2x.png", 80),
    ("AppIcon-40x40@2x-1.png", 80),
    ("AppIcon-40x40@3x.png", 120),
    ("AppIcon-60x60@2x.png", 120),
    ("AppIcon-60x60@3x.png", 180),
    ("AppIcon-64x64@2x.png", 128),
    ("AppIcon-64x64@3x.png", 192),
    ("AppIcon-68x68@2x.png", 136),
    ("AppIcon-76x76@2x.png", 152),
    ("AppIcon-83.5x83.5@2x.png", 167),
    ("AppIcon-1024x1024@1x.png", 1024),
]

output_dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
os.makedirs(output_dir, exist_ok=True)

for name, size in icons:
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(os.path.join(output_dir, name))
    print(f"Generated {name}")

print("Done!")
