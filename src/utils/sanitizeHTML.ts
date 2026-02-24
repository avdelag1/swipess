/**
 * Simple HTML sanitizer to strip dangerous tags/attributes from HTML strings.
 * Used for contentEditable editors to prevent XSS when rendering user or template content.
 */

// Tags that are never allowed in content
const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'link', 'meta', 'base'];

// Attributes that could execute code
const DANGEROUS_ATTRS = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onchange', 'oninput', 'onkeydown', 'onkeyup', 'onkeypress', 'onmousedown', 'onmouseup', 'oncontextmenu', 'ondblclick'];

/**
 * Sanitize an HTML string by removing dangerous tags and event handler attributes.
 * Preserves formatting tags (b, i, u, p, div, span, table, etc.) for rich text editing.
 */
export function sanitizeHTML(html: string): string {
    if (!html) return '';

    let sanitized = html;

    // Remove dangerous tags and their content
    for (const tag of DANGEROUS_TAGS) {
        const regex = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
        sanitized = sanitized.replace(regex, '');
        // Also remove self-closing versions
        const selfClosingRegex = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
        sanitized = sanitized.replace(selfClosingRegex, '');
    }

    // Remove dangerous attributes (event handlers)
    for (const attr of DANGEROUS_ATTRS) {
        const regex = new RegExp(`\\s${attr}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]*)`, 'gi');
        sanitized = sanitized.replace(regex, '');
    }

    // Remove javascript: URLs
    sanitized = sanitized.replace(/href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'href=""');
    sanitized = sanitized.replace(/src\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, 'src=""');

    return sanitized;
}
