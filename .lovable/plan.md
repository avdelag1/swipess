

## Landscape ID Card Redesign

The current card is portrait (340px wide, vertical layout). Redesigning to landscape orientation with a completely new layout.

### New Layout

```text
+----------------------------------------------------------+
| ▬▬▬▬▬▬▬▬ accent gradient bar ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ |
|                                                          |
|  LOCAL RESIDENT              SW-XXXXXXXX    [QR CODE]    |
|                                              68x68       |
|  Name (large)                                            |
|  Occupation (cyan)                         Scan to       |
|  📍 Location                               verify        |
|  🌐 Nationality · Xyr local                             |
|                                                          |
|  ┌─ bio box ──────────────────────────────────────────┐  |
|  │ Short description about the user...                │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
|  [tag] [tag] [tag] [tag]     Speaks: [EN] [ES]           |
|                                                          |
|  ┌──────────┐  📞 WhatsApp number                        |
|  │  PHOTO   │                                            |
|  │  80x100  │                        swipess.app         |
|  └──────────┘                                            |
+----------------------------------------------------------+
```

### Changes (single file: `VapIdCardModal.tsx`)

1. **Card container**: Change from `w-[340px]` portrait to `w-[92vw] max-w-[560px]` landscape orientation
2. **Top section**: Header row with "LOCAL RESIDENT" badge on left, ID number center-right, QR code pinned top-right corner
3. **Middle section**: Name, occupation, location, nationality, bio, and tags fill the main area
4. **Bottom section**: Profile photo bottom-left corner (80x100 rounded), WhatsApp link bottom-right area, "swipess.app" footer centered
5. **Scrollable**: Add `max-h-[85vh] overflow-y-auto` so on small screens it scrolls
6. **Close button**: Keep floating above the card

The card fills more screen space horizontally, feels like a real physical landscape ID card.

