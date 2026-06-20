export const DOCUMENT_FONTS = [
  { id: 'times', label: 'Times', css: "'Times New Roman', Times, serif" },
  { id: 'arial', label: 'Arial', css: 'Arial, Helvetica, sans-serif' },
  { id: 'georgia', label: 'Georgia', css: 'Georgia, serif' },
  { id: 'courier', label: 'Courier', css: "'Courier New', Courier, monospace" },
] as const;

export type DocumentFontId = (typeof DOCUMENT_FONTS)[number]['id'];

export function getFontCss(family: DocumentFontId): string {
  return DOCUMENT_FONTS.find((f) => f.id === family)?.css ?? DOCUMENT_FONTS[0].css;
}
