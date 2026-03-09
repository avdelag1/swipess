

# Neighborhood Heat Map & Document Vault — Already Built

Both features were fully implemented in the previous approved build. Here's what's already live:

## Neighborhood Heat Map (`/explore/zones`)
- Fetches all Tulum zones from `neighborhood_data` table (seeded with Aldea Zama, La Veleta, Region 15, etc.)
- Color-coded zone cards with density scores, listing counts, avg rent prices
- Tap to expand: shows description, vibe tags (#yoga, #nightlife, etc.), avg rent vs sale comparison
- "Browse listings in [Zone]" button navigates to the swipe deck
- Lazy-loaded, framer-motion stagger animations

## Document Vault (`/documents`)
- Upload documents to `legal-documents` private storage bucket
- Category tabs: All, Contracts, IDs, Fideicomiso, Other
- Search across document names
- Download via signed URLs, delete with storage cleanup
- Digital contracts from `digital_contracts` table integrated inline
- File size validation (10MB max)

## What I Can Do Now

Since both features exist but could be **visually elevated** and **functionally enhanced**, here are upgrade options:

### Option A: Visual & UX Polish (recommended)
1. **Heat Map**: Add a density bar visualization per zone (not just a label), add a gradient background glow matching each zone's `color_hex`, improve the expanded state with a mini price comparison chart
2. **Document Vault**: Add drag-and-drop upload, document type auto-detection from filename, upload progress indicator, confirmation dialog before delete

### Option B: Functional Enhancements
1. **Heat Map → Swipe Deck Filter**: When tapping "Browse listings," pass the neighborhood as a filter parameter so the swipe deck only shows listings from that zone
2. **Document Vault**: Add document type picker during upload (instead of defaulting to "other"), add bulk download, show document preview thumbnails for images/PDFs

### Option C: Both A + B combined

No database changes needed — all tables and data are already in place.

### Implementation scope
- Modify `src/pages/NeighborhoodMap.tsx` — visual upgrade + filter pass-through
- Modify `src/pages/DocumentVault.tsx` — upload UX improvements + type picker
- ~2 files modified, no new tables or migrations

