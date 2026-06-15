from PIL import Image

def create_logo():
    # Load the wordmark
    try:
        wordmark = Image.open('public/icons/Swipess-wordmark-white.png').convert("RGBA")
    except Exception as e:
        print(f"Error loading wordmark: {e}")
        return

    # Calculate new size with padding (e.g., 20% padding)
    width, height = wordmark.size
    bg_width = int(width * 1.4)
    bg_height = int(height * 2.5)

    # Create a solid black background
    bg = Image.new('RGB', (bg_width, bg_height), (0, 0, 0))

    # Calculate position to center the wordmark
    x = (bg_width - width) // 2
    y = (bg_height - height) // 2

    # Paste the wordmark onto the background using the wordmark's alpha channel as a mask
    bg.paste(wordmark, (x, y), wordmark)

    # Save to artifacts directory
    output_path = '/Users/estelaselvamistica/.gemini/antigravity/brain/745b0031-6599-420b-8f3b-cdf33d4b7dcd/Swipess_Main_Logo.png'
    bg.save(output_path)
    print(f"Successfully generated logo at {output_path}")

create_logo()
