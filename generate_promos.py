import os
from PIL import Image, ImageDraw, ImageFont

packages = [
    {"name": "STARTER", "duration": "1 WEEK PROMO", "price": "$4.99", "ppt": "/ week", "color": (20, 184, 166), "filename": "event_starter.png"},
    {"name": "GROWTH", "duration": "1 MONTH PROMO", "price": "$79.99", "ppt": "/ 1 month", "color": (99, 102, 241), "filename": "event_growth.png"},
    {"name": "WAVE", "duration": "6 MONTHS PROMO", "price": "$199.99", "ppt": "/ 6 months", "color": (168, 85, 247), "filename": "event_wave.png"},
]

width, height = 1284, 2778
center_x = width // 2

try:
    font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 100)
    font_med = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
    font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 140)
except:
    font_large = ImageFont.load_default()
    font_med = ImageFont.load_default()
    font_small = ImageFont.load_default()
    font_title = ImageFont.load_default()

for pkg in packages:
    img = Image.new('RGB', (width, height), color=(17, 17, 17))
    d = ImageDraw.Draw(img)

    # SWIPESS
    d.text((center_x, 300), "S W I P E S S   E V E N T S", fill=(255, 255, 255), font=font_med, anchor="mm")
    
    # Title
    d.text((center_x, 500), pkg["name"], fill=(255, 255, 255), font=font_title, anchor="mm")
    d.text((center_x, 650), pkg["duration"], fill=(200, 200, 200), font=font_med, anchor="mm")
    
    # Card
    card_y = 800
    card_h = 1000
    card_w = 1000
    card_x1 = (width - card_w) // 2
    card_y1 = card_y
    card_x2 = card_x1 + card_w
    card_y2 = card_y + card_h
    
    # Draw border
    d.rounded_rectangle([card_x1, card_y1, card_x2, card_y2], radius=60, outline=pkg["color"], width=10)
    
    # Inner elements
    d.text((center_x, card_y1 + 200), pkg["price"] + " USD", fill=(255, 255, 255), font=font_title, anchor="mm")
    d.text((center_x, card_y1 + 350), pkg["ppt"], fill=(200, 200, 200), font=font_med, anchor="mm")
    
    d.line([(card_x1 + 100, card_y1 + 450), (card_x2 - 100, card_y1 + 450)], fill=(50, 50, 50), width=4)
    
    d.text((center_x, card_y1 + 550), "Boost your event visibility", fill=(255, 255, 255), font=font_med, anchor="mm")
    
    # Button
    btn_y1 = card_y1 + 700
    btn_y2 = btn_y1 + 120
    btn_x1 = card_x1 + 100
    btn_x2 = card_x2 - 100
    d.rounded_rectangle([btn_x1, btn_y1, btn_x2, btn_y2], radius=60, outline=(255, 255, 255), width=4)
    d.text((center_x, (btn_y1 + btn_y2)//2), "G E T  O F F E R", fill=(255, 255, 255), font=font_small, anchor="mm")
    
    # Footer
    d.text((center_x, card_y2 + 200), "Promotions are subject to admin approval.", fill=(150, 150, 150), font=font_small, anchor="mm")
    d.text((center_x, card_y2 + 260), "You will not be charged if your event is rejected.", fill=(150, 150, 150), font=font_small, anchor="mm")
    
    out_path = f"/Users/estelaselvamistica/.gemini/antigravity/brain/745b0031-6599-420b-8f3b-cdf33d4b7dcd/{pkg['filename']}"
    img.save(out_path)
    print("Saved", out_path)
