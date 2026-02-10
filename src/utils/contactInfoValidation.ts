/**
 * Validates that input doesn't contain contact information
 * Returns error message if contact info detected, null if valid
 */
export function validateNoContactInfo(text: string): string | null {
  if (!text) return null;

  // Phone number patterns
  const phonePatterns = [
    /\+\d[\d\s\-()]{6,}\d/,  // International: must start with +digit, end with digit
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,  // US format: 123-456-7890
    /\d{10,}/,  // 10+ consecutive digits
  ];

  // Email pattern
  const emailPattern = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/;

  // Social media patterns
  const socialPatterns = [
    /@[A-Za-z0-9._]+/,  // @username
    /instagram\.com|insta\.com/i,
    /facebook\.com|fb\.com/i,
    /twitter\.com|x\.com/i,
    /whatsapp|wa\.me/i,
    /telegram|t\.me/i,
    /snapchat|snap\.com/i,
    /tiktok\.com/i,
    /linkedin\.com/i,
  ];

  // URL patterns
  const urlPattern = /(https?:\/\/|www\.)[^\s]+/i;

  // Check for phone numbers
  for (const pattern of phonePatterns) {
    if (pattern.test(text)) {
      return "Phone numbers are not allowed. Please use our messaging system to share contact details after connection.";
    }
  }

  // Check for emails
  if (emailPattern.test(text)) {
    return "Email addresses are not allowed. Please use our messaging system to share contact details after connection.";
  }

  // Check for social media
  for (const pattern of socialPatterns) {
    if (pattern.test(text)) {
      return "Social media handles/links are not allowed. Please use our messaging system to share contact details after connection.";
    }
  }

  // Check for URLs
  if (urlPattern.test(text)) {
    return "URLs are not allowed. Please use our messaging system to share contact details after connection.";
  }

  return null;
}
