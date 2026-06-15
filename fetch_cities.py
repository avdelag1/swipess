import urllib.request
import re
import json

cities = [
    'miami', 'tulum', 'cancun', 'cabo', 'cartagena', 'dubai', 'marrakech',
    'paris', 'london', 'rome', 'barcelona', 'ibiza', 'mykonos', 'santorini',
    'monaco', 'new-york', 'los-angeles', 'las-vegas', 'tokyo', 'seoul',
    'bali', 'singapore', 'bangkok', 'sydney', 'rio', 'punta-cana', 'medellin'
]

results = {}

for city in cities:
    try:
        url = f"https://unsplash.com/s/photos/{city}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        match = re.search(r'images\.unsplash\.com/photo-([a-zA-Z0-9\-]+)\?', html)
        if match:
            results[city] = match.group(1)
            print(f"{city}: {match.group(1)}")
        else:
            print(f"{city}: NOT FOUND")
    except Exception as e:
        print(f"{city}: ERROR {e}")

with open('valid_unsplash_ids.json', 'w') as f:
    json.dump(results, f)
