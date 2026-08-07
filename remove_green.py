import sys
from PIL import Image

def remove_green_screen(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is bright green (high G, low R and B)
        r, g, b, a = item
        # Typical green screen is #00FF00. Let's use a threshold.
        # If green is dominant
        if g > 150 and r < 100 and b < 100:
            # Replace with transparent
            new_data.append((255, 255, 255, 0))
        elif g > r + 30 and g > b + 30: # softer green threshold
            # Soft blending or just make it transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_green_screen(sys.argv[1], sys.argv[2])
