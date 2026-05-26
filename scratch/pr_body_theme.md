# Fix Theme Contrast and Card Swipe Blinking

This PR addresses contrast and visual consistency issues across themes and improves the card swiping animation smoothness.

## Changes:
1. **Button contrast**: Updated the `glassLight` button variant in `button.tsx` to explicitly use `text-black` and `dark:text-black` to guarantee legibility on light/white backgrounds in both dark and light modes.
2. **Semantic colors**: Updated `getSemanticColor` utility in `colors.ts` to dynamically inspect the DOM class list for the `.light` theme if `isDarkTheme` is not explicitly passed.
3. **Card transitions**: Speeded up card carousel opacity transition (from 0.9s to 0.6s) and scale transition (from 6s to 0.8s with a spring curve) in `PokerCategoryCard.tsx` to eliminate lagging and blinking effects.
4. **Theme-aware loading placeholder**: Switched the `fallbackGradient` in `PokerCategoryCard.tsx` to use a light color scheme when the light theme is active.
5. **Card layout transitions**: Cleaned up the global `.swipe-card-container` style in `index.css` by removing the base `transition: none !important;` rule, ensuring it only overrides transitions during active dragging (`:active` state).
6. **Cascade Filter Button**: Refactored hardcoded `theme === 'light'` JS ternary checks in `CascadeFilterButton.tsx` to use standard Tailwind CSS `dark:` variant classes.
