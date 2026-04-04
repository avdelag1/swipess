

## Plan: Remove Tulum Branding, Rebrand AI Chat to "Swipess AI", Improve Chat UI

### What's Changing

**1. Remove all Tulum-specific branding from UI text** (keep mock data like event locations untouched)

Files with hardcoded "Tulum" branding to clean:
- `src/components/ConciergeChat.tsx` — line 65: default `initialCity = 'Tulum'` → remove city display from header (line 219: `AI Concierge · {initialCity}`) 
- `src/components/ConciergeChat.tsx` — line 159: quick suggestion mentions "Tulum tonight" → make generic
- `src/components/AISearchDialog.tsx` — line 103: welcome message "your sharp, market-savvy guide to Tulum" → generic
- `src/hooks/useConciergeAI.ts` — line 154: default city fallback `'Tulum'` → remove or use empty
- `src/pages/RoommateMatching.tsx` — line 234: hardcoded "Tulum" label in header → remove
- `src/pages/RoommateMatching.tsx` — line 293: `t('roommates.tulumVibesOnly')` → change translation key
- `src/i18n/locales/en.json` — line 288: `"tulumVibesOnly": "Tulum Vibes Only"` → `"No More Matches"`
- `src/i18n/locales/es.json` — line 235: same → `"Sin Más Matches"`
- `src/pages/VideoTours.tsx` — line 82: "their Tulum spaces" → "their spaces"
- `src/components/ButlerProactive.tsx` — line 22: "The ultimate Tulum vibe" → "The ultimate vibe"
- `src/pages/AdvertisePage.tsx` — lines 199, 420, 434, 768: "Tulum" mentions → generic or "your city"
- `src/components/ConversationalListingCreator.tsx` — line 268: "Expert help for your Tulum marketplace" → generic
- `src/components/WorkerListingForm.tsx` — line 310: placeholder "e.g., Tulum" → "e.g., Your City"

**2. Rebrand "Vibe" → "Swipess AI" everywhere**

- `src/components/ConciergeChat.tsx` line 56: `"Vibe is Thinking..."` → `"Swipess AI is thinking..."`
- `src/components/ConciergeChat.tsx` line 204: header title `"Vibe"` → `"Swipess AI"`
- `src/components/ConciergeChat.tsx` line 219: `"AI Concierge · {initialCity}"` → `"Your AI Concierge"`
- `src/components/AISearchDialog.tsx` line 325: `'Concierge'` → `'Swipess AI'`
- `src/components/AISearchDialog.tsx` line 497: `"Concierge is thinking..."` → `"Swipess AI is thinking..."`
- `src/components/BottomNavigation.tsx` lines 100, 112: label `'Concierge'` → `'Swipess AI'`
- `src/hooks/useConciergeAI.ts` line 32: storage key prefix stays (internal, no UI impact)

**3. Improve ConciergeChat UI design** — make it look premium

- Redesign the quick suggestion buttons: larger, bolder, with gradient borders and icon emphasis
- Improve the input area: stronger contrast, bigger send button with glow effect
- Make the header more striking with the Swipess logo instead of JarvisAura
- Better message bubbles: slightly larger text, more breathing room, premium shadow on AI messages

### Files to Edit

| File | Change |
|---|---|
| `src/components/ConciergeChat.tsx` | Rebrand Vibe → Swipess AI, remove city, upgrade UI |
| `src/components/AISearchDialog.tsx` | Rebrand Concierge → Swipess AI, remove Tulum from welcome |
| `src/components/BottomNavigation.tsx` | Label change |
| `src/hooks/useConciergeAI.ts` | Remove Tulum default city |
| `src/pages/RoommateMatching.tsx` | Remove "Tulum" header label, fix empty state text |
| `src/pages/VideoTours.tsx` | Remove "Tulum" from description |
| `src/pages/AdvertisePage.tsx` | Generic branding (remove Tulum specifics) |
| `src/components/ButlerProactive.tsx` | Remove "Tulum vibe" |
| `src/components/ConversationalListingCreator.tsx` | Remove "Tulum marketplace" |
| `src/components/WorkerListingForm.tsx` | Generic placeholder |
| `src/i18n/locales/en.json` | Update `tulumVibesOnly` translation |
| `src/i18n/locales/es.json` | Update `tulumVibesOnly` translation |

