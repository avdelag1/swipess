from PIL import Image
import sys

def check_transparency(path):
    img = Image.open(path)
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        print(f"{path} has transparency (mode: {img.mode})")
        # Check if alpha channel is all 255
        if img.mode == 'RGBA':
            extrema = img.getextrema()
            if extrema[3][0] < 255:
                print("Actually contains transparent pixels.")
            else:
                print("Alpha channel is solid (no transparency).")
    else:
        print(f"{path} does not have transparency (mode: {img.mode})")

if __name__ == "__main__":
    check_transparency(sys.argv[1])
