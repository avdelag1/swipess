I found the actual blocker: the WhatsApp link is being sent to `/s/listing/...`, but the production rewrite is forwarding crawlers to a backend function URL where `link-preview` is currently returning `NOT_FOUND`. That means WhatsApp/Instagram/TikTok never receive the photo metadata, so they only show plain text.

Plan:

1. Fix the production preview route
   - Make `/s/listing/:id`, `/s/profile/:id`, and `/s/event/:id` reliably serve crawler-readable HTML with Open Graph/Twitter metadata.
   - Ensure the route points to the correct backend project/function that contains the app data and deployed `link-preview` function.

2. Make previews work for all major chat/social crawlers
   - Support WhatsApp, Instagram, TikTok, Facebook/Messenger, iMessage, Telegram, X/Twitter, Discord, Slack, LinkedIn, Pinterest, Reddit, Skype, Google, Bing, Applebot, and generic unfurl bots.
   - Add bot-friendly headers and avoid relying on client-side React metadata for external previews.

3. Guarantee a real share image
   - For listings: use the first available listing photo from `images`, `image_url`, or other known image fields.
   - For profiles/roommates: use `profile_images` first, then avatar fallback.
   - For events: use `image_url` or first image from `image_urls`.
   - If an uploaded photo is private, malformed, or missing, return a polished Swipess fallback image instead of blank metadata.

4. Make the image URL crawler-safe
   - Ensure `og:image` is an absolute HTTPS URL.
   - Normalize storage URLs so WhatsApp and other apps can fetch the image directly without app login.
   - Add `og:image:secure_url`, dimensions, alt text, and image type.

5. Keep normal users going to the app
   - Crawlers receive the metadata page.
   - Real people tapping the same link are redirected into the right Swipess page: listing, profile, roommate/profile, or event.

6. Verify with real crawler-style requests
   - Test the exact screenshot URL with WhatsApp-style user agent.
   - Confirm the HTML response includes the listing title and a non-fallback `og:image` when the listing has a photo.
   - Also test Facebook/Twitter/iMessage-style user agents.

Technical notes:
- This requires updating the share-preview backend function and the production rewrite target.
- The current `vercel.json` points `/s/...` traffic to a backend ref where the function is missing, which is why external apps show no photo.
- The in-app preview works because React can load the listing inside the app; external chat apps cannot run that app logic, so they need server-rendered Open Graph tags.