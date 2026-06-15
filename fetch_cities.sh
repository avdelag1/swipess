#!/bin/bash
cities=("miami" "tulum" "cancun" "cabo" "cartagena" "dubai" "marrakech" "paris" "london" "rome" "barcelona" "ibiza" "mykonos" "santorini" "monaco" "new-york" "los-angeles" "las-vegas" "tokyo" "seoul" "bali" "singapore" "bangkok" "sydney" "rio" "punta-cana" "medellin")

for city in "${cities[@]}"; do
    img=$(curl -k -s "https://unsplash.com/s/photos/$city" | grep -o 'images.unsplash.com/photo-[a-zA-Z0-9-]*' | head -n 1)
    echo "$city: $img"
done
