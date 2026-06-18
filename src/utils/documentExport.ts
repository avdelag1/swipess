import { appToast } from './appNotification';

const DOC_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 12pt;
    line-height: 1.65;
    color: #111;
    background: #fff;
    margin: 0;
    padding: 0;
  }
  h1 { font-size: 18pt; font-weight: bold; text-align: center; margin: 0 0 14pt; }
  h2 { font-size: 13pt; font-weight: bold; margin: 14pt 0 5pt; padding-bottom: 3pt; border-bottom: 1pt solid #ddd; }
  h3 { font-size: 12pt; font-weight: bold; margin: 10pt 0 4pt; }
  p { margin: 5pt 0; }
  u { text-decoration: underline; }
  ul, ol { margin: 4pt 0 4pt 20pt; }
  li { margin: 2pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; }
  td, th { border: 1pt solid #aaa; padding: 4pt 7pt; font-size: 11pt; vertical-align: top; }
  hr { border: none; border-top: 1pt solid #ccc; margin: 14pt 0; }
  strong { font-weight: bold; }
  em { font-style: italic; }
  br { display: block; margin: 2pt 0; }
`;

export function downloadAsPDF(htmlContent: string, title: string): void {
  const printHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { margin: 1in; size: letter portrait; }
    ${DOC_STYLES}
    @media print { body { margin: 0; } }
  </style>
</head>
<body>${htmlContent}</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    appToast.error('PDF unavailable', 'Use your browser\'s Ctrl+P / ⌘+P to print to PDF.');
    return;
  }

  doc.open();
  doc.write(printHTML);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      appToast.success('Print dialog opened', 'Choose "Save as PDF" to download your document.');
    } catch {
      appToast.error('Print blocked', 'Use your browser\'s built-in Ctrl+P / ⌘+P instead.');
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 10000);
  }, 500);
}

export function downloadAsWord(htmlContent: string, title: string): void {
  const wordHTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <meta name=ProgId content=Word.Document>
  <meta name=Generator content="Microsoft Word 15">
  <title>${title}</title>
  <style>
    body { font-family: "Times New Roman", Times, serif; margin: 1in; font-size: 12pt; line-height: 1.5; }
    h1 { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 12pt; }
    h2 { font-size: 14pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; }
    h3 { font-size: 12pt; font-weight: bold; margin-top: 10pt; margin-bottom: 2pt; }
    p { margin: 5pt 0; }
    u { text-decoration: underline; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #999; padding: 4pt 8pt; vertical-align: top; }
    ul, ol { margin-left: 20pt; }
    li { margin: 2pt 0; }
    hr { border: 1px solid #ccc; margin: 12pt 0; }
    strong { font-weight: bold; }
    em { font-style: italic; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

  const blob = new Blob(['﻿', wordHTML], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = title.replace(/[^\w\s-]/g, '').trim() || 'contract';
  a.download = `${safeName}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
  appToast.success('Word file downloading…', 'Open with Microsoft Word, Google Docs, or Pages.');
}
