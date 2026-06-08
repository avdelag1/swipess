const fs = require('fs');
const content = fs.readFileSync('src/hooks/useOwnerClientPreferences.ts', 'utf8');

// Check if toast({ pattern exists
const hasToastObj = /toast\(\s*\{/.test(content);
console.log('hasToastObj:', hasToastObj);

// Try the phase2 regex
const re1 = /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*,\s*description\s*:\s*(`[^`]*`)\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g;
const matches = [...content.matchAll(re1)];
console.log('re1 matches:', matches.length, matches);

// Try with [\s\S] instead for multiline
const re2 = /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*,\s*description\s*:\s*(`[^`]*`)\s*,\s*variant\s*:\s*['"]destructive['"][\s\S]*?\}\s*\)/g;
const matches2 = [...content.matchAll(re2)];
console.log('re2 matches:', matches2.length, matches2);

// Try with single quote variant
const re3 = /toast\(\s*\{\s*title\s*:\s*'[^']*'\s*,\s*description\s*:\s*`[^`]*`\s*,\s*variant\s*:\s*'destructive'[^}]*\}\s*\)/g;
const matches3 = [...content.matchAll(re3)];
console.log('re3 matches:', matches3.length, matches3);

// Print relevant lines
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('toast')) {
    console.log(`Line ${i + 1}:`, JSON.stringify(lines[i]));
  }
}
