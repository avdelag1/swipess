from PIL import Image
import sys

def black_to_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    for item in datas:
        # If it's very dark, make it transparent
        # item is (R, G, B, A)
        avg = (item[0] + item[1] + item[2]) / 3
        if avg < 30: # Threshold for black
            newData.append((0, 0, 0, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")

if __name__ == "__main__":
    black_to_transparent(sys.argv[1], sys.argv[2])
