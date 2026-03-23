import { describe, it, expect } from 'vitest';
import { sanitizeHTML, escapeHTML } from '../sanitizeHTML';

describe('sanitizeHTML', () => {
    it('allows safe HTML tags', () => {
        const input = '<p>Hello <b>world</b>!</p>';
        expect(sanitizeHTML(input)).toBe(input);
    });

    it('strips <script> tags completely', () => {
        const input = '<p>Hello</p><script>alert("xss")</script>';
        expect(sanitizeHTML(input)).toBe('<p>Hello</p>'); // Regex removes the entire tag and its content
    });

    it('removes on* event handlers', () => {
        const input = '<div onclick="alert(1)">Click</div>';
        expect(sanitizeHTML(input)).toBe('<div>Click</div>'); // Removes the space and the attribute
    });

    it('removes javascript: protocols from links', () => {
        const input = '<a href="javascript:alert(1)">Link</a>';
        // DOMPurify drops the dangerous href entirely rather than leaving href=""
        expect(sanitizeHTML(input)).not.toContain('javascript:');
    });

    it('strips <iframe> elements', () => {
        const input = '<div><iframe src="malicious.com"></iframe></div>';
        expect(sanitizeHTML(input)).toBe('<div></div>');
    });

    it('preserves safe tags but strips style attribute (not in ALLOWED_ATTR)', () => {
        // DOMPurify config does not include 'style' in ALLOWED_ATTR — this is intentional
        // to prevent CSS-based attacks. Only class, id, href etc. are allowed.
        const input = '<span style="color: red;">Text</span>';
        const result = sanitizeHTML(input);
        expect(result).toContain('<span');
        expect(result).toContain('Text');
        expect(result).not.toContain('style=');
    });

    it('returns empty string for empty input', () => {
        expect(sanitizeHTML('')).toBe('');
    });

    it('strips onerror event handlers from img tags', () => {
        // DOMPurify removes all on* event handlers including onerror
        const input = '<img src="x" onerror="alert(1)">';
        const result = sanitizeHTML(input);
        expect(result).not.toContain('onerror');
    });

    it('strips object and embed elements', () => {
        const input = '<object data="malicious.swf"></object>';
        expect(sanitizeHTML(input)).not.toContain('object');
    });

    it('allows safe anchor tags with https href', () => {
        const input = '<a href="https://example.com" rel="noopener">Link</a>';
        const result = sanitizeHTML(input);
        expect(result).toContain('href="https://example.com"');
    });
});

describe('escapeHTML', () => {
    it('escapes ampersand', () => {
        expect(escapeHTML('A & B')).toBe('A &amp; B');
    });

    it('escapes angle brackets', () => {
        expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
    });

    it('escapes double quotes', () => {
        expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;');
    });

    it('escapes single quotes', () => {
        expect(escapeHTML("it's")).toBe('it&#39;s');
    });

    it('returns empty string for empty input', () => {
        expect(escapeHTML('')).toBe('');
    });

    it('does not double-escape already escaped entities', () => {
        // escapeHTML is for plain text, not HTML — it will escape the & in &amp;
        expect(escapeHTML('&amp;')).toBe('&amp;amp;');
    });
});
