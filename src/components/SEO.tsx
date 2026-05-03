import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
}

/**
 * 🛸 NEXUS SEO ENGINE
 * Dynamically updates document metadata for premium social sharing previews.
 */
export function SEO({
  title = 'Swipess — Immersive Discovery',
  description = 'Elite marketplace and discovery engine for properties, vehicles, and services.',
  image = 'https://swipess.app/og-image-nexus.png',
  url = 'https://swipess.app',
  type = 'website'
}: SEOProps) {
  const siteTitle = 'Swipess';
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* App Specifics */}
      <meta name="apple-itunes-app" content="app-id=swipess-app-id" />
    </Helmet>
  );
}
