// Public edge function that serves crawler-friendly HTML for shared links.
// Real users (browsers) get a fast redirect to the SPA route.
// Crawlers (WhatsApp, iMessage, Telegram, FB, Twitter, Slack, Discord) read
// the OG tags including the listing's real hero photo.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Hard-pin source-of-truth Supabase project (matches src/integrations/supabase/client.ts)
const SUPABASE_URL = "https://vplgtcguxujxwrgguxqq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGd0Y2d1eHVqeHdyZ2d1eHFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDI5MDIsImV4cCI6MjA2MzU3ODkwMn0.-TzSQ-nDho4J6TftVF4RNjbhr5cKbknQxxUT-AaSIJU";
const APP_ORIGIN = "https://swipess.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isCrawler(ua: string): boolean {
  if (!ua) return false;
  const u = ua.toLowerCase();
  return /whatsapp|telegrambot|facebookexternalhit|facebot|twitterbot|slackbot|discordbot|linkedinbot|skypeuripreview|applebot|googlebot|bingbot|embedly|redditbot|pinterest|vkshare|tumblr|w3c_validator|yahoo|duckduckbot|imessagepreview/i.test(
    u,
  );
}

function renderHtml(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  redirect: boolean;
}): string {
  const { title, description, image, url, redirect } = opts;
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(image);
  const u = escapeHtml(url);
  const redirectTags = redirect
    ? `<meta http-equiv="refresh" content="0; url=${u}" />
<script>window.location.replace(${JSON.stringify(url)});</script>`
    : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${t}</title>
<meta name="description" content="${d}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Swipess" />
<meta property="og:title" content="${t}" />
<meta property="og:description" content="${d}" />
<meta property="og:image" content="${i}" />
<meta property="og:image:secure_url" content="${i}" />
<meta property="og:image:alt" content="${t}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${u}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${t}" />
<meta name="twitter:description" content="${d}" />
<meta name="twitter:image" content="${i}" />

<link rel="canonical" href="${u}" />
${redirectTags}
</head>
<body style="margin:0;background:#000;color:#fff;font-family:-apple-system,system-ui,sans-serif;">
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px;text-align:center;gap:16px;">
<img src="${i}" alt="${t}" style="max-width:100%;max-height:60vh;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.5);" />
<h1 style="font-size:20px;font-weight:900;margin:0;">${t}</h1>
<p style="opacity:0.7;font-size:14px;margin:0;">${d}</p>
<a href="${u}" style="margin-top:8px;padding:14px 28px;border-radius:32px;background:linear-gradient(180deg,#FF4D4D,#E01E2A);color:#fff;font-weight:900;text-decoration:none;letter-spacing:0.15em;text-transform:uppercase;font-size:12px;">Open in Swipess</a>
</div>
</body>
</html>`;
}

function pickFirstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  for (const v of images) {
    if (typeof v === "string" && v.trim()) return v;
    if (v && typeof v === "object" && typeof (v as any).url === "string" && (v as any).url.trim()) {
      return (v as any).url;
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // ["link-preview", "<kind>", "<id>"]
  const kind = parts[1];
  const id = parts[2];

  const fallbackImage = `${APP_ORIGIN}/og-image-nexus.png`;
  const fallbackTitle = "Swipess | Find Your Best Deal";
  const fallbackDesc =
    "Swipe through luxury villas, vehicles, and premium services. The future of discovery.";

  let title = fallbackTitle;
  let description = fallbackDesc;
  let image = fallbackImage;
  let canonical = APP_ORIGIN;

  try {
    if (!id) throw new Error("missing id");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (kind === "listing") {
      canonical = `${APP_ORIGIN}/listing/${id}`;
      const { data } = await supabase
        .from("listings")
        .select("title, city, neighborhood, price, beds, baths, images, category, listing_type")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        const first = pickFirstImage((data as any).images);
        if (first) image = first;
        title = (data as any).title || fallbackTitle;
        const loc = [(data as any).neighborhood, (data as any).city].filter(Boolean).join(", ");
        const price = (data as any).price ? `$${Number((data as any).price).toLocaleString()}` : "";
        description = [
          (data as any).beds ? `${(data as any).beds} Beds` : null,
          (data as any).baths ? `${(data as any).baths} Baths` : null,
          loc || null,
          price ? `— ${price}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || fallbackDesc;
      }
    } else if (kind === "profile") {
      canonical = `${APP_ORIGIN}/profile/${id}`;
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, bio, avatar_url, user_id")
        .eq("user_id", id)
        .maybeSingle();
      if (prof) {
        const name = (prof as any).full_name;
        title = name ? `${name} on Swipess` : fallbackTitle;
        description = (prof as any).bio || "Discover this profile on Swipess.";
        if ((prof as any).avatar_url) image = (prof as any).avatar_url;
      }
      const { data: pi } = await supabase
        .from("profile_images")
        .select("image_url")
        .eq("user_id", id)
        .order("position", { ascending: true })
        .limit(1);
      if (pi && pi[0]?.image_url) image = pi[0].image_url;
    } else if (kind === "event") {
      canonical = `${APP_ORIGIN}/explore/eventos/${id}`;
      const { data } = await supabase
        .from("events")
        .select("title, description, image_url, cover_url")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        title = (data as any).title || fallbackTitle;
        description = (data as any).description || fallbackDesc;
        image = (data as any).cover_url || (data as any).image_url || fallbackImage;
      }
    }
  } catch (_e) {
    // fall through with defaults
  }

  const qs = url.searchParams.toString();
  if (qs) canonical += (canonical.includes("?") ? "&" : "?") + qs;

  const ua = req.headers.get("user-agent") || "";
  const crawler = isCrawler(ua);

  const html = renderHtml({ title, description, image, url: canonical, redirect: !crawler });
  return new Response(html, {
    headers: {
      ...corsHeaders,
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
});
