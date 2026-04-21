/**
 * Contact Information Validation & Content Moderation
 * Detects phone numbers, emails, social media handles, URLs, and evasion attempts.
 * Returns categorized results with severity levels for admin flagging.
 */

export type FlagReason = 'phone' | 'email' | 'social_media' | 'url' | 'whatsapp';
export type FlagSeverity = 'block' | 'flag';

export interface ValidationResult {
  isClean: boolean;
  reason: FlagReason | null;
  severity: FlagSeverity;
  message: string | null;
}

/** Strip zero-width characters and normalize text for detection */
function sanitize(text: string): string {
  return text
    // Remove zero-width chars (eslint flags \u200D as a "joining" char but each is matched individually here)
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/gu, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize evasion tricks: "d o t" → ".", "a t" → "@", etc. */
function normalizeEvasion(text: string): string {
  let t = text.toLowerCase();
  // Common word substitutions
  t = t.replace(/\b(dot|d\.o\.t|d-o-t|punto)\b/gi, '.');
  t = t.replace(/\b(at|arr?oba)\b/gi, '@');
  t = t.replace(/\bcom\b/gi, '.com');
  // Remove spaces between single digits: "5 5 5 1 2 3 4 5 6 7" → "5551234567"
  t = t.replace(/(\d)\s+(?=\d)/g, '$1');
  return t;
}

const BLOCK_MESSAGE = "Contact information is not allowed. Please use our messaging system to share details after connecting.";

export function validateNoContactInfo(text: string): string | null {
  const result = validateContent(text);
  return result.message;
}

export function validateContent(text: string): ValidationResult {
  const clean: ValidationResult = { isClean: true, reason: null, severity: 'block', message: null };
  if (!text) return clean;

  const sanitized = sanitize(text);
  const normalized = normalizeEvasion(sanitized);

  // === PHONE NUMBER PATTERNS ===
  const phonePatterns = [
    /\+\d[\d\s\-()]{6,}\d/,           // International: +52 55 1234 5678
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,  // US: 123-456-7890
    /\d{10,}/,                          // 10+ consecutive digits
    /\(\d{2,4}\)\s*\d{3,}/,           // (55) 12345678
  ];
  for (const p of phonePatterns) {
    if (p.test(normalized)) {
      return { isClean: false, reason: 'phone', severity: 'block', message: BLOCK_MESSAGE };
    }
  }

  // === EMAIL PATTERNS ===
  const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  if (emailPattern.test(normalized)) {
    return { isClean: false, reason: 'email', severity: 'block', message: BLOCK_MESSAGE };
  }

  // === WHATSAPP PATTERNS ===
  const whatsappPatterns = [
    /whats\s*app/i,
    /\bwsp\b/i,
    /\bwa\.me\b/i,
    /\bw\.a\b/i,
    /my\s*whats/i,
    /write\s*me\s*(on|at|in)\s*whats/i,
    /mand[ae]\s*(me\s*)?(un\s*)?whats/i,
  ];
  for (const p of whatsappPatterns) {
    if (p.test(sanitized)) {
      return { isClean: false, reason: 'whatsapp', severity: 'block', message: BLOCK_MESSAGE };
    }
  }

  // === SOCIAL MEDIA PATTERNS ===
  const socialPatterns = [
    /@[A-Za-z0-9._]{2,}/,              // @username
    /instagram\.com|insta\.com|ig:/i,
    /facebook\.com|fb\.com|fb\.me/i,
    /twitter\.com|x\.com/i,
    /telegram|t\.me/i,
    /snapchat|snap\.com/i,
    /tiktok\.com|tik\s*tok/i,
    /linkedin\.com/i,
    /\bmi\s*insta\b/i,                  // "mi insta" (Spanish)
    /\bmy\s*ig\b/i,
    /\bmy\s*snap\b/i,
    /\bsígueme\s*en\b/i,               // "sígueme en" (follow me on)
    /\bfollow\s*me\s*(on|at)\b/i,
  ];
  for (const p of socialPatterns) {
    if (p.test(sanitized)) {
      return { isClean: false, reason: 'social_media', severity: 'block', message: BLOCK_MESSAGE };
    }
  }

  // === URL PATTERNS ===
  const urlPattern = /(https?:\/\/|www\.)[^\s]+/i;
  if (urlPattern.test(sanitized)) {
    return { isClean: false, reason: 'url', severity: 'block', message: BLOCK_MESSAGE };
  }

  return clean;
}


