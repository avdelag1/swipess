import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '../sanitizeHTML';

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
        expect(sanitizeHTML(input)).toBe('<a href="">Link</a>'); // Replaces with empty href
    });

    it('strips <iframe> elements', () => {
        const input = '<div><iframe src="malicious.com"></iframe></div>';
        expect(sanitizeHTML(input)).toBe('<div></div>');
    });

    it('preserves formatting tags and styles', () => {
        const input = '<span style="color: red; font-size: 16px;">Text</span>';
        expect(sanitizeHTML(input)).toBe(input);
    });
});
