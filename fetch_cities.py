import urllib.request
import urllib.parse
import os
import time

cities = [
    "miami", "medellin", "tulum", "cancun", "cabo san lucas", "cartagena", "dubai", "marrakech",
    "paris", "london", "rome", "barcelona", "ibiza", "mykonos", "santorini", "monaco",
    "new york", "los angeles", "las vegas", "tokyo", "seoul", "bali", "singapore", "bangkok",
    "sydney", "rio de janeiro", "punta cana"
]

os.makedirs("public/cities", exist_ok=True)

for city in cities:
    prompt = f"Breathtaking high quality luxury travel photography shot of {city} cityscape, vibrant sunset, 4k, cinematic, very aesthetic, perfect location cover"
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=400&height=400&nologo=true"
    filename = f"public/cities/{city.replace(' ', '_')}.jpg"
    
    if not os.path.exists(filename):
        print(f"Downloading {city}...")
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(filename, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Saved {filename}")
        except Exception as e:
            print(f"Failed to download {city}: {e}")
        time.sleep(0.5) # rate limit

print("Done!")
