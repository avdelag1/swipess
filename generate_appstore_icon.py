from PIL import Image

def create_app_store_icon():
    # App Store requires exactly 1024x1024
    icon_size = 1024
    
    # Create a solid black background
    bg = Image.new('RGB', (icon_size, icon_size), (0, 0, 0))
    
    try:
        # Load the wordmark
        wordmark = Image.open('public/icons/Swipess-wordmark-white.png').convert("RGBA")
        
        # We want the wordmark to fit nicely inside the 1024x1024 square.
        # Let's scale it so it takes up about 80% of the width (819 pixels).
        target_width = int(icon_size * 0.8)
        w_percent = (target_width / float(wordmark.size[0]))
        target_height = int((float(wordmark.size[1]) * float(w_percent)))
        
        wordmark_resized = wordmark.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        # Calculate center position
        x = (icon_size - target_width) // 2
        y = (icon_size - target_height) // 2
        
        # Paste using the wordmark's alpha channel as a mask
        bg.paste(wordmark_resized, (x, y), wordmark_resized)
        
    except Exception as e:
        print(f"Error loading wordmark: {e}")
        return

    # Save to artifacts directory (must be PNG with no transparency for App Store Connect)
    output_path = '/Users/estelaselvamistica/.gemini/antigravity/brain/745b0031-6599-420b-8f3b-cdf33d4b7dcd/Swipess_AppStore_Icon_1024.png'
    bg.save(output_path, "PNG")
    print(f"Successfully generated App Store icon at {output_path}")

create_app_store_icon()
