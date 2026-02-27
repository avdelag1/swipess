/**
 * HTML sanitizer using DOMPurify to strip dangerous tags/attributes.
 * Used for contentEditable editors to prevent XSS when rendering user or template content.
 */
import * as DOMPurify from 'dompurify';

/**
 * Sanitize an HTML string using DOMPurify.
 * Preserves safe formatting tags (b, i, u, p, div, span, table, etc.) for rich text editing.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Allow common rich-text formatting tags
    ALLOWED_TAGS: [
      'b', 'i', 'u', 's', 'strong', 'em', 'mark', 'small', 'del', 'ins',
      'p', 'br', 'hr', 'div', 'span', 'blockquote', 'pre', 'code',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'img',
    ],
    // Allow safe attributes only
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'target', 'rel',
      'colspan', 'rowspan',
    ],
    // Force all links to be safe
    FORCE_BODY: false,
    ALLOW_DATA_ATTR: false,
  });
}
