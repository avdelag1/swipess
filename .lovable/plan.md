I found the main break: the AI Listing flow publishes directly to `listings` but does not send required backend fields like `user_id` and `location`, so the save can fail even after the AI extracts the text. It also redirects to the public listing page instead of taking the owner back to the main listings page.

Plan:

1. Fix AI Listing creation

- Make AI Listing require only one photo plus natural text, as requested.
- Send the correct required listing fields to the backend: `user_id`, `owner_id`, `location`, `title`, `description`, `price`, `category`, `status`, `is_active`, and `images`.
- Keep the AI extractor call, but strengthen its system instructions so it fills the right fields for property, motorcycle, bicycle, or worker/service listings.
- If the AI response is incomplete, still publish using the user’s words instead of failing silently.
- After publishing, invalidate listing queries and navigate to `/owner/properties`, not the public listing preview or edit flow.

2. Make the “Create Listing” action feel real and reliable

- Keep the large publish button as the AI action button.
- Add keyboard submit support from the details step where appropriate, while preserving normal multiline typing on mobile.
- Show clear progress states: uploading photo, AI polishing, publishing, done.
- Replace the legacy Sonner calls in this flow with the app’s unified notification system.

3. Guarantee user listings appear before mock data

- Update listing fetching so real user-created listings always sort first on both client and owner-side decks.
- Normalize older rows where `owner_id` is missing by falling back to `user_id`.
- Keep mock/seed rows after real listings only.
- Make the ordering consistent across `useListings`, `useSmartListingMatching`, and owner listings.

4. Seed mock data for all quick filters

- Add backend seed data for every client-side quick filter:
  - Property
  - Motorcycle
  - Bicycle
  - Services/Worker
- Add owner-side client discovery mock data for:
  - All clients
  - Buyers
  - Renters
  - Hire/service seekers
- Make mock data clearly backend-backed, active, and swipe-ready, but always sorted after real users’ posts.

5. Add event photos and backend events

- Create or update events for the event categories used by the app:
  - Beach
  - Jungle
  - Music
  - Food/Restaurants
  - Promo/Deals
- Add two photos per event type.
- Store the photos in the `event-images` bucket and save their public URLs into the events data (`image_url` plus `image_urls`).
- Update the events feed query to fetch `image_urls` so event detail and cards can use the full gallery.

6. Validate the backend and app behavior

- Check listing counts by category after seeding.
- Check event counts and confirm each category has two photos.
- Test the AI Listing edge function with a realistic prompt.
- Verify the owner listings page shows the newly created listing first, then seed/mock data after it. And the mini radio make the icons buttons black on white filter color bc I open and it was impossible to know what those empty white circles do 