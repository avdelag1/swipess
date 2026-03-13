

# Fix Logo Transparency Issue

## Problem
The current `fire-s-logo.png` has a white/checkered background baked into it instead of true transparency. This makes it look terrible on the dark app background — showing a white rectangle around the S.

## Solution
Copy the user's uploaded `image-80.jpg` (the clean Fire S on transparent-checkered background) to the project, then use AI image editing to generate a proper transparent PNG version of just the flame S letter with no background.

## Steps

1. **Generate a clean transparent PNG** using AI image generation — take the uploaded `image-80.jpg` as input and instruct the model to output just the red-orange gradient flame S on a fully transparent background
2. **Save to `public/icons/fire-s-logo.png`** — overwriting the current broken version
3. **Bump cache version** in `index.html` manifest link to force browsers to pick up the new icon

## Files to Change
| File | Change |
|------|--------|
| `public/icons/fire-s-logo.png` | Replace with properly transparent PNG generated from AI image edit |
| `index.html` | Bump manifest cache version query string |

