from PIL import Image
import os

def resize_icon(input_path, output_dir, size):
    img = Image.open(input_path)
    # Create a square canvas
    canvas_size = max(size, img.width, img.height)
    if size > 0:
        canvas_size = size
    
    # Simple resize for now - keep aspect ratio
    ratio = min(canvas_size / img.width, canvas_size / img.height)
    new_size = (int(img.width * ratio), int(img.height * ratio))
    resized = img.resize(new_size, Image.Resampling.LANCZOS)
    
    # Paste onto transparent background
    new_img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    new_img.paste(resized, ((canvas_size - new_size[0]) // 2, (canvas_size - new_size[1]) // 2))
    
    output_path = os.path.join(output_dir, f"icon-{size}.png")
    new_img.save(output_path, "PNG")
    print(f"Saved {output_path}")

if __name__ == "__main__":
    for s in [192, 512]:
        resize_icon("public/icons/swipess-logo-transparent.png", "public/icons", s)
