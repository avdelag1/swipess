import DOMPurify from 'dompurify';

/**
 * Escape a plain-text string for safe embedding in HTML.
 */
export function escapeHTML(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitize an HTML string using DOMPurify.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'u', 's', 'strong', 'em', 'mark', 'small', 'del', 'ins',
      'p', 'br', 'hr', 'div', 'span', 'blockquote', 'pre', 'code',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'target', 'rel',
      'colspan', 'rowspan',
    ],
    FORCE_BODY: false,
    ALLOW_DATA_ATTR: false,
  });
}


