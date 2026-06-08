/**
 * Fix remaining toast. calls by scanning files character by character
 * and replacing toast(...) with appToast.xxx(...).
 * Only processes files that already have appToast imported.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function globFiles(dir) {
  const result = [];
  try {
    const out = execSync('dir /s /b "' + dir + '\\*.ts" "' + dir + '\\*.tsx"', { cwd: ROOT, encoding: 'utf8', shell: 'cmd.exe' });
    for (const line of out.split('\n')) {
      const f = line.trim();
      if (f) result.push(f);
    }
  } catch { }
  return result;
}

function findMatchingParen(text, start) {
  let depth = 0;
  let inSingle = false, inDouble = false, inBacktick = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    const prev = i > 0 ? text[i - 1] : '';

    // String literal state machine
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') { inSingle = !inSingle; continue; }
    if (c === '"' && !inSingle && !inBacktick && prev !== '\\') { inDouble = !inDouble; continue; }
    if (c === '`' && !inSingle && !inDouble && prev !== '\\') { inBacktick = !inBacktick; continue; }
    if (inSingle || inDouble || inBacktick) continue;

    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth <= 0) return i; }
  }
  return -1;
}

function findMatchingBrace(text, start) {
  let depth = 0;
  let inSingle = false, inDouble = false, inBacktick = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    if (c === "'" && !inDouble && !inBacktick && prev !== '\\') { inSingle = !inSingle; continue; }
    if (c === '"' && !inSingle && !inBacktick && prev !== '\\') { inDouble = !inDouble; continue; }
    if (c === '`' && !inSingle && !inDouble && prev !== '\\') { inBacktick = !inBacktick; continue; }
    if (inSingle || inDouble || inBacktick) continue;
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth <= 0) return i; }
  }
  return -1;
}

function extractObjectValue(text, start) {
  // Extract value after a key in an object literal
  // Returns { value: string, end: number } or null
  let i = start;
  while (i < text.length && /\s/.test(text[i])) i++;
  if (i >= text.length) return null;

  const c = text[i];
  if (c === "'" || c === '"' || c === '`') {
    const quote = c;
    let j = i + 1;
    while (j < text.length) {
      if (text[j] === '\\') { j += 2; continue; }
      if (text[j] === quote) break;
      j++;
    }
    return { value: text.slice(i, j + 1), end: j + 1 };
  }
  // Variable or expression (no spaces)
  let j = i;
  while (j < text.length && /[a-zA-Z_$0-9.\[\]]/.test(text[j])) j++;
  if (j > i) return { value: text.slice(i, j), end: j };
  return null;
}

function transformToastObject(content) {
  let result = '';
  let i = 0;

  while (i < content.length) {
    // Look for toast( at a word boundary
    const idx = content.indexOf('toast(', i);
    if (idx === -1) {
      result += content.slice(i);
      break;
    }

    // Check word boundary
    if (idx > 0 && /[a-zA-Z0-9_]/.test(content[idx - 1])) {
      result += content.slice(i, idx + 5);
      i = idx + 5;
      continue;
    }

    // Check if next char after toast( is { (object form)
    let j = idx + 6; // skip 'toast('
    while (j < content.length && /\s/.test(content[j])) j++;
    if (j >= content.length || content[j] !== '{') {
      result += content.slice(i, idx + 6);
      i = idx + 6;
      continue;
    }

    // Find matching ) for toast(
    const closeParen = findMatchingParen(content, idx + 5);
    if (closeParen === -1) {
      result += content.slice(i, idx + 6);
      i = idx + 6;
      continue;
    }

    // Extract the object between { and matching }
    const objStart = j;
    const objEnd = findMatchingBrace(content, objStart);
    if (objEnd === -1) {
      result += content.slice(i, idx + 6);
      i = idx + 6;
      continue;
    }

    const objStr = content.slice(objStart + 1, objEnd);

    // Extract title, description, variant
    let title = '', description = '', isDestructive = false;
    const titleMatch = objStr.match(/\btitle\s*:\s*(['"`])((?:(?!\1)[^\\]|\\.)*?)\1/);
    const descMatch = objStr.match(/\bdescription\s*:\s*((['"`])(?:(?!\2)[^\\]|\\.)*?\2|[a-zA-Z_$][\w$.\[\]]*)/);
    const variantDestructive = /\bvariant\s*:\s*['"]destructive['"]/.test(objStr);

    if (titleMatch) title = titleMatch[0].replace(/^title\s*:\s*/, '');
    if (descMatch) description = descMatch[1];
    isDestructive = variantDestructive;

    const method = isDestructive ? 'error' : 'info';
    const replacement = description
      ? `appToast.${method}(${title}, ${description})`
      : `appToast.${method}(${title})`;

    // Add text before the match and the replacement
    result += content.slice(i, idx) + replacement;
    i = closeParen + 1;
  }

  return result;
}

// Process all files
const allFiles = globFiles(ROOT + '/src');
let changed = 0;

for (const filePath of allFiles) {
  if (filePath.includes('node_modules') || filePath.includes('\\dist\\')) continue;
  const base = path.basename(filePath);
  if (base === 'sonner.tsx' || base === 'use-toast.ts') continue;

  let content = fs.readFileSync(filePath, 'utf8');
  const orig = content;

  // Only process files that have toast. calls (not appToast. or sonnerToast.)
  const remainingMethods = ['success', 'error', 'info', 'warning', 'message', 'like', 'match', 'loading', 'dismiss', 'promise'];
  const hasRemaining = remainingMethods.some(m => {
    const re = new RegExp('\\btoast\\.' + m + '\\(');
    return re.test(content);
  });
  const hasToastObj = /[^a-zA-Z]toast\(\s*\{/.test(content);

  if (!hasRemaining && !hasToastObj) continue;

  const rel = path.relative(ROOT, filePath);

  // Step 1: Handle toast.METHOD(complex_expression) calls
  // Uses character-based matching to handle any expression (ternary, concat, ||, etc.)
  let result = '';
  let pos = 0;
  while (pos < content.length) {
    let bestMatch = null;
    let bestPos = content.length;

    // Find next toast.METHOD( pattern
    for (const m of remainingMethods) {
      if (m === 'dismiss') {
        const idx = content.indexOf('toast.dismiss(', pos);
        if (idx !== -1 && idx < bestPos) {
          const charBefore = idx > 0 ? content[idx - 1] : ' ';
          if (/[^a-zA-Z0-9_]/.test(charBefore)) {
            bestPos = idx;
            bestMatch = 'dismiss';
          }
        }
        continue;
      }
      const idx = content.indexOf('toast.' + m + '(', pos);
      if (idx !== -1 && idx < bestPos) {
        const charBefore = idx > 0 ? content[idx - 1] : ' ';
        if (/[^a-zA-Z0-9_]/.test(charBefore)) {
          bestPos = idx;
          bestMatch = m;
        }
      }
    }

    if (!bestMatch) {
      result += content.slice(pos);
      break;
    }

    // Add text before match
    result += content.slice(pos, bestPos);

    if (bestMatch === 'dismiss') {
      // Skip the entire toast.dismiss(...) call
      const closeParen = findMatchingParen(content, bestPos + 'toast.dismiss'.length);
      if (closeParen !== -1) {
        pos = closeParen + 1;
      } else {
        result += 'toast.dismiss(';
        pos = bestPos + 'toast.dismiss('.length;
      }
      continue;
    }

    // toast.METHOD(...)
    const target = bestMatch === 'loading' ? 'info' : bestMatch;
    const prefix = 'toast.' + bestMatch + '(';
    const closeParen = findMatchingParen(content, bestPos + prefix.length - 1);
    if (closeParen === -1) {
      result += prefix;
      pos = bestPos + prefix.length;
      continue;
    }

    const innerContent = content.slice(bestPos + prefix.length, closeParen);
    
    // Check if this has the form ('string', { ...options }) - strip options
    const simpleStrMatch = innerContent.match(/^\s*('[^']*')\s*,\s*\{/);
    const doubleStrMatch = innerContent.match(/^\s*("[^"]*")\s*,\s*\{/);
    const tmplStrMatch = innerContent.match(/^\s*(`[^`]*`)\s*,\s*\{/);
    
    if (simpleStrMatch) {
      result += 'appToast.' + target + '(' + simpleStrMatch[1] + ')';
    } else if (doubleStrMatch) {
      result += 'appToast.' + target + '(' + doubleStrMatch[1] + ')';
    } else if (tmplStrMatch) {
      result += 'appToast.' + target + '(' + tmplStrMatch[1] + ')';
    } else {
      // Complex expression or simple call - just replace the method name
      result += 'appToast.' + target + '(' + innerContent + ')';
    }
    pos = closeParen + 1;
  }
  content = result;

  // Step 2: Handle toast({ ... }) object form with our smart walker
  content = transformToastObject(content);

  // Clean up empty lines
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('  OK   ' + rel);
    changed++;
  }
}

console.log('\n' + changed + ' files fixed.');

// Final verification
console.log('\n=== Final verification ===');
const methods = ['success', 'error', 'info', 'warning', 'message', 'like', 'match', 'loading', 'dismiss', 'promise'];
let remaining = false;
for (const filePath of allFiles) {
  if (filePath.includes('node_modules') || filePath.includes('\\dist\\')) continue;
  const base = path.basename(filePath);
  if (base === 'sonner.tsx' || base === 'use-toast.ts') continue;
  const c = fs.readFileSync(filePath, 'utf8');
  for (const m of methods) {
    const re = new RegExp('\\btoast\\.' + m + '\\(', 'g');
    const matches = c.match(re);
    if (matches) {
      const rel = path.relative(ROOT, filePath);
      console.log('  REMAINING: ' + rel + ' has ' + matches.length + ' toast.' + m + '() calls');
      remaining = true;
      break;
    }
  }
  // Check toast({ object form without appToast
  const toastObjMatches = c.match(/[^a-zA-Z]toast\(\s*\{/g);
  if (toastObjMatches && !c.includes('useToast')) {
    // Make sure it's not in a comment
    const cleanLines = c.split('\n').filter(l => !l.trim().startsWith('//'));
    const hasObj = cleanLines.some(l => l.match(/[^a-zA-Z]toast\(\s*\{/));
    if (hasObj) {
      const rel = path.relative(ROOT, filePath);
      console.log('  REMAINING: ' + rel + ' has toast({ object form)');
      remaining = true;
    }
  }
}
if (!remaining) console.log('  ALL CLEAR! No remaining toast. calls.');
