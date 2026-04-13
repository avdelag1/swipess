

## Photo Vibrancy & General Polish Plan

### Root Cause Analysis

The "gray filter" effect comes from multiple overlapping opacity/overlay layers that compound to wash out photos:

1. **Poker category cards** (`PokerCategoryCard.tsx`): Bottom gradient is `from-black/90 via-black/30` covering 60% of the card height — very heavy.
2. **Owner swipe cards** (`SimpleOwnerSwipeCard.tsx`): Bottom gradient is `from-black/85 via-black/40` covering 60% — also heavy. The "next card preview" renders at `opacity-40` making it look ghosted.
3. **Client swipe cards** (`SimpleSwipeCard.tsx`): Bottom gradient is `from-black/80 via-black/30` covering 50% — slightly better but still dims photos.
4. **SwipeCardPeek** (`SwipeCardPeek.tsx`): Has a flat `bg-black/20` overlay on top of the entire card image — unnecessary dimming.
5. **Stacked cards** in `PokerCategoryCard.tsx` apply `brightness(stackBrightness)` which dims background cards further.
6. **`photo-swim` animation** on `CardImage.tsx` has no color boost — pure scale only.

### Plan

#### 1. Reduce gradient overlays on all card types

**PokerCategoryCard.tsx** (quick filter cards):
- Change bottom gradient from `from-black/90 via-black/30` to `from-black/70 via-black/15` — still readable text but photos pop more
- Reduce gradient height from `h-[60%]` to `h-[45%]` — shows more of the photo

**SimpleSwipeCard.tsx** (client swipe deck):
- Reduce gradient from `rgba(0,0,0,0.8)` to `rgba(0,0,0,0.6)` and mid-stop from `0.3` to `0.15`
- This preserves text legibility while letting the photo colors breathe

**SimpleOwnerSwipeCard.tsx** (owner swipe deck):
- Reduce gradient from `rgba(0,0,0,0.85)` to `rgba(0,0,0,0.65)` and mid-stop from `0.4` to `0.2`
- The "next card preview" opacity from `opacity-40` to `opacity-60` so it looks less ghosted

#### 2. Remove the flat black overlay on SwipeCardPeek

- Remove the `bg-black/20` div that sits on top of every peeked card — it serves no purpose other than dulling the image

#### 3. Add subtle color vibrancy boost to CardImage

- Add `filter: saturate(1.08) contrast(1.03)` to the loaded `<img>` in `CardImage.tsx`
- This gives a subtle but noticeable color pop without looking unnatural — similar to how iOS Photos auto-enhances

#### 4. Increase stacked card brightness

- In `PokerCategoryCard.tsx`, increase `stackBrightness` for non-top cards (e.g. from 0.6 to 0.75) so background cards in the fan don't look muddy

#### 5. General scan for other issues

- Verify build passes after changes
- Check no other overlapping overlays or filters remain

---

### Files to modify

| File | Change |
|------|--------|
| `src/components/swipe/PokerCategoryCard.tsx` | Lighter gradient, smaller height, brighter stack |
| `src/components/SimpleSwipeCard.tsx` | Lighter bottom gradient |
| `src/components/SimpleOwnerSwipeCard.tsx` | Lighter gradient, brighter next-card preview |
| `src/components/swipe/SwipeCardPeek.tsx` | Remove `bg-black/20` overlay |
| `src/components/CardImage.tsx` | Add `saturate(1.08) contrast(1.03)` to loaded img |

