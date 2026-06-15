from PIL import Image

def generate_splash_images():
    try:
        # Load the original white wordmark (which has a transparent background)
        wordmark = Image.open('public/icons/Swipess-wordmark-white.png').convert("RGBA")
        
        # We will create 3 sizes for the splash screen (1x, 2x, 3x)
        # Using standard widths for a center logo: 300px, 600px, 900px
        sizes = {
            '1x': 300,
            '2x': 600,
            '3x': 900
        }
        
        base_path = '/Users/estelaselvamistica/.gemini/antigravity/brain/745b0031-6599-420b-8f3b-cdf33d4b7dcd/'
        
        for scale, target_width in sizes.items():
            # Calculate height to maintain aspect ratio
            w_percent = (target_width / float(wordmark.size[0]))
            target_height = int((float(wordmark.size[1]) * float(w_percent)))
            
            # Resize
            resized = wordmark.resize((target_width, target_height), Image.Resampling.LANCZOS)
            
            # Save
            out_path = f"{base_path}Swipess_Splash_{scale}.png"
            resized.save(out_path, "PNG")
            print(f"Generated {scale}: {out_path}")
            
    except Exception as e:
        print(f"Error: {e}")

generate_splash_images()
