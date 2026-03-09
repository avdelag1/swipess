

# Round 6: Deep App Audit — Video Optimization, Liked Pages Enhancement & Photo Reordering

## 🎬 1. Video Upload Optimization — Strip Audio & Reduce Quality

**Current state:** `VideoCropper.tsx` uses `captureStream()` which captures both video AND audio tracks. Videos are uploaded in full resolution.

**Changes:**
- **Strip audio tracks** before recording to eliminate audio data entirely (~30-50% file size reduction)
- **Reduce video resolution** to 720p max for listing videos (sufficient for mobile viewing)
- **Lower bitrate** in MediaRecorder to further compress output

**File:** `src/components/video/VideoCropper.tsx`
```typescript
// After getting stream, remove audio tracks:
const videoOnlyTracks = stream.getVideoTracks();
const videoOnlyStream = new MediaStream(videoOnlyTracks);

// Use lower bitrate in MediaRecorder:
mediaRecorderRef.current = new MediaRecorder(videoOnlyStream, { 
  mimeType, 
  videoBitsPerSecond: 1_500_000 // 1.5 Mbps cap
});
```

---

## 📋 2. Liked Pages — Drag-to-Reorder Cards

**Current state:** Liked pages (`ClientLikedProperties`, `LikedClients`, `OwnerInterestedClients`, `ClientWhoLikedYou`) display cards in a static grid with no reorder capability.

**Changes:**
- Wrap card grids with framer-motion `Reorder.Group` for touch/mouse drag support
- Store custom order in localStorage (keyed by user ID) so reordering persists across sessions
- Cards can be dragged vertically within columns on mobile, or horizontally in grid on desktop

**Files to modify:**
| File | Type |
|------|------|
| `src/pages/ClientLikedProperties.tsx` | Client liked listings |
| `src/components/LikedClients.tsx` | Owner liked profiles |
| `src/pages/OwnerInterestedClients.tsx` | Clients who liked owner's listings |
| `src/pages/ClientWhoLikedYou.tsx` | Owners who liked client profile |

**Implementation pattern:**
```tsx
import { Reorder } from 'framer-motion';

// State: sorted list based on localStorage order
const [orderedItems, setOrderedItems] = useState<typeof items>([]);

// Sync with localStorage
useEffect(() => {
  const savedOrder = localStorage.getItem(`liked-order-${user.id}-${type}`);
  // Apply saved order or use default chronological
}, [items, user?.id]);

// Reorder handler
const handleReorder = (newOrder: typeof items) => {
  setOrderedItems(newOrder);
  localStorage.setItem(`liked-order-${user.id}-${type}`, JSON.stringify(newOrder.map(i => i.id)));
};

// Render
<Reorder.Group axis="y" values={orderedItems} onReorder={handleReorder} className="grid...">
  {orderedItems.map(item => (
    <Reorder.Item key={item.id} value={item}>
      <PremiumLikedCard ... />
    </Reorder.Item>
  ))}
</Reorder.Group>
```

---

## 🔍 3. Owner Liked Pages — Add Category Filters

**Current state:** 
- `ClientLikedProperties.tsx` has category filter tabs (All, Homes, Motos, Bikes, Services) ✅
- `LikedClients.tsx` (owner liked profiles) has NO category filters ❌
- `OwnerInterestedClients.tsx` (who liked owner) has NO category filters ❌

**Changes:**
Add filter tabs to owner pages for filtering by:
- **Type of client**: All / Job Seekers / Renters / Buyers
- **Which listing they liked** (for OwnerInterestedClients)

**File:** `src/components/LikedClients.tsx`
```tsx
const clientCategories = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'renter', label: 'Renters', icon: Home },
  { id: 'worker', label: 'Workers', icon: Briefcase },
  { id: 'buyer', label: 'Buyers', icon: DollarSign },
];

// Filter bar UI (same pattern as ClientLikedProperties)
<div className="flex gap-3 mb-10 overflow-x-auto scrollbar-hide">
  {clientCategories.map(({ id, label, icon: Icon }) => (
    <motion.button onClick={() => setSelectedCategory(id)} ... />
  ))}
</div>
```

**File:** `src/pages/OwnerInterestedClients.tsx`
Add filter dropdown to filter by which listing they liked (useful when owner has multiple listings).

---

## 📸 4. Profile Photo Drag-and-Drop Touch Support

**Current state:**
- `PhotoUploadManager.tsx` uses `Reorder.Group` with `axis="x"` ✅
- `ImageUpload.tsx` uses `Reorder.Group` with `axis="x"` ✅

Both already support drag-to-reorder. Need to verify:
- Touch gestures work smoothly on mobile (they should with framer-motion Reorder)
- Visual feedback is clear (drag handle icon visible on mobile)

**Minor enhancement:** Make drag handle always visible on mobile (currently `sm:opacity-0 sm:group-hover:opacity-100`).

**File:** `src/components/PhotoUploadManager.tsx` (line 227)
```tsx
// Change from:
<div className="absolute top-1 right-9 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">

// To (always visible):
<div className="absolute top-1 right-9 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
```

---

## 🧹 5. Additional Cleanup Found During Audit

| Issue | File | Fix |
|-------|------|-----|
| Dead `backdrop-blur-sm` in drag handle | `PhotoUploadManager.tsx:228` | Replace with solid `bg-black/70` |
| Hardcoded `bg-zinc-900` in empty states | `OwnerInterestedClients.tsx:157,173` | Use `bg-muted` for theme consistency |
| Hardcoded dark colors in delete dialog | `OwnerInterestedClients.tsx:182-188` | Use theme-aware `bg-card border-border` |

---

## Summary

| Target | Impact |
|--------|--------|
| Video audio stripping + compression | ~40-60% smaller video files |
| Drag-to-reorder on 4 liked pages | UX improvement for organizing favorites |
| Owner-side category filters | Match client-side UX, easier to find specific liked profiles |
| Photo drag handle always visible on mobile | Better touch UX for reordering |
| Theme fixes in OwnerInterestedClients | Light mode compatibility |

**Files to modify:** 6 files
**New features:** Drag reorder + category filters
**Performance:** Significantly lighter video uploads

