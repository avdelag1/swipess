# Sound Files for Swipe Feature

This directory contains sound effect files for the customizable swipe sound themes.

## Required Sound Files

Place the following MP3 files in this directory:

### Book Theme
- `page-turned-84574.mp3` - Right swipe (page turn forward)
- `book-closing-466850.mp3` - Left swipe (book close)
- `turnpage-99756.mp3` - Alternative page turn sound

### Water Theme
- `water-splash-46402.mp3` - Left swipe (splash)
- `water-droplet-sfx-417690.mp3` - Right swipe (droplet)

### Funny Theme
- `funny-short-comedy-fart-sound-effect-318912.mp3` - Left swipe
- `ding-sfx-472366.mp3` - Right swipe (ding)
- `achievement-unlocked-463070.mp3` - Alternative right swipe

### Calm/Meditation Theme
- `deep-meditation-bell-hit-heart-chakra-4-186970.mp3` - Right swipe
- `deep-meditation-bell-hit-third-eye-chakra-6-186972.mp3` - Left swipe
- `bells-2-31725.mp3` - For random zen
- `bell-a-99888.mp3` - For random zen
- `large-gong-2-232438.mp3` - For random zen

## File Sources

These sound files should be free to use or properly licensed. Recommended sources:
- Freesound.org
- Zapsplat.com
- Pixabay Sound Effects
- Free Music Archive

## Adding New Sounds

1. Place the MP3 file in this directory
2. Update the sound mappings in `src/utils/sounds.ts`
3. Ensure files are reasonably sized (< 100KB recommended for quick loading)
4. Test on both mobile and desktop browsers
