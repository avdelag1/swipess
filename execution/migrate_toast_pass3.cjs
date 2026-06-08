/**
 * Pass 3: Clean up remaining toast. calls in files that were partially migrated.
 *
 * Strategy:
 * 1. Find files with `toast.METHOD(` calls (not property access like toast.id)
 * 2. Replace ALL toast.METHOD(...) calls with appToast.METHOD(...)
 * 3. Strip the 2nd argument (options object) from toast calls
 * 4. Handle edge cases: toast.loading → appToast.info, toast.dismiss → remove
 * 5. Clean up duplicate/multiple appToast imports
 *
 * Usage: node execution/migrate_toast_pass3.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const TOAST_METHODS = ['success', 'error', 'info', 'warning', 'message', 'like', 'match'];

function globFiles(dir) {
  const result = [];
  try {
    const out = execSync(`dir /s /b "${dir}\\*.ts" "${dir}\\*.tsx"`, { cwd: ROOT, encoding: 'utf8', shell: 'cmd.exe' });
    for (const line of out.split('\n')) {
      const f = line.trim();
      if (f) result.push(f);
    }
  } catch { }
  return result;
}

function removeDupAppToastImports(content) {
  // If appToast is imported more than once, keep only the first
  const lines = content.split('\n');
  let found = false;
  const filtered = lines.filter(line => {
    if ((line.includes("from '@/utils/appNotification'") || line.includes('from "@/utils/appNotification"')) && found) {
      return false; // skip duplicate
    }
    if (line.includes("from '@/utils/appNotification'") || line.includes('from "@/utils/appNotification"')) {
      found = true;
    }
    return true;
  });
  return filtered.join('\n');
}

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig = content;
  const rel = path.relative(ROOT, filePath);

  // Skip files that are part of the sonner system
  if (/sonner\.tsx$/.test(filePath)) return false;
  if (/use-toast\.ts$/.test(filePath) || /ui\\use-toast\.ts$/.test(filePath)) return false;

  // Check if file has any toast. calls at all (excluding property access like toast.id, toast.displayName)
  const hasToastCall = TOAST_METHODS.some(m => new RegExp(`toast\\.${m}\\(`).test(content));
  const hasToastLoading = /toast\.loading\(/.test(content);
  const hasToastDismiss = /toast\.dismiss\(/.test(content);
  const hasToastObject = /toast\(\s*\{/.test(content);
  const hasToastMessage = /toast\.message\(/.test(content);

  if (!hasToastCall && !hasToastLoading && !hasToastDismiss && !hasToastObject && !hasToastMessage) return false;

  // Import handling: if file has sonner import but not appToast
  if ((content.includes("from 'sonner'") || content.includes('from "sonner"') ||
       content.includes("from '@/components/ui/sonner'") || content.includes('from "@/components/ui/sonner"')) &&
      !content.includes("from '@/utils/appNotification'") && !content.includes('from "@/utils/appNotification"')) {
    // Replace sonner import with appToast import
    content = content.replace(
      /import\s*\{([^}]*)\btoast\b([^}]*)\}\s*from\s*['"](sonner|@\/components\/ui\/sonner)['"]\s*;?\s*\n?/g,
      (match, before, after) => {
        const names = (before + after).split(',').map(s => s.trim()).filter(Boolean);
        if (names.length > 0) {
          return `import { ${names.join(', ')} } from "sonner";\nimport { appToast } from '@/utils/appNotification';\n`;
        }
        return `import { appToast } from '@/utils/appNotification';\n`;
      }
    );
    // Also handle the simpler pattern: import { toast } from '@/components/ui/sonner'
    if (content.includes("toast") && (content.includes("from '@/components/ui/sonner'") || content.includes('from "@/components/ui/sonner"'))) {
      content = content.replace(
        /import\s*\{\s*toast\s*\}\s*from\s*['"]@\/components\/ui\/sonner['"]\s*;?\s*\n?/g,
        `import { appToast } from '@/utils/appNotification';\n`
      );
    }
  }

  // Now replace all toast.method() calls
  const methodPattern = new RegExp(
    `toast\\.(${TOAST_METHODS.join('|')}|loading)\\s*\\(`,
    'g'
  );

  // We need to be smarter - match the full toast.method(...) call
  // Simple approach: find toast.method( and capture until balanced parens
  let result = '';
  let remaining = content;
  let pos = 0;

  while (pos < remaining.length) {
    // Find next toast.method(
    let matchFound = null;
    let bestPos = remaining.length;

    for (const method of [...TOAST_METHODS, 'loading']) {
      const idx = remaining.indexOf(`toast.${method}(`, pos);
      if (idx !== -1 && idx < bestPos) {
        bestPos = idx;
        matchFound = method;
      }
    }

    // Also check for toast({  (object form)
    const toastObjIdx = remaining.indexOf(`toast(`, pos);
    if (toastObjIdx !== -1 && toastObjIdx < bestPos) {
      // Make sure it's toast({ not toast.something or a variable ending in toast
      // Check char before 'toast': must be non-alphanumeric or start of string
      const charBefore = toastObjIdx > 0 ? remaining[toastObjIdx - 1] : ' ';
      if (/[^a-zA-Z0-9_]/.test(charBefore)) {
        bestPos = toastObjIdx;
        matchFound = 'object';
      }
    }

    // Also check for toast.dismiss(
    const dismissIdx = remaining.indexOf(`toast.dismiss(`, pos);
    if (dismissIdx !== -1 && dismissIdx < bestPos) {
      const charBefore = dismissIdx > 0 ? remaining[dismissIdx - 1] : ' ';
      if (/[^a-zA-Z0-9_]/.test(charBefore)) {
        bestPos = dismissIdx;
        matchFound = 'dismiss';
      }
    }

    if (!matchFound || bestPos >= remaining.length) {
      result += remaining.slice(pos);
      break;
    }

    // Add text before match
    result += remaining.slice(pos, bestPos);

    if (matchFound === 'dismiss') {
      // toast.dismiss(...) - skip until balanced parens
      const start = bestPos + 'toast.dismiss'.length;
      let depth = 0;
      let i = start;
      while (i < remaining.length) {
        if (remaining[i] === '(') depth++;
        else if (remaining[i] === ')') {
          if (depth === 0) break;
          depth--;
        }
        i++;
      }
      // Skip over the parenthesized args + closing paren
      pos = i + 1;
      result = result.replace(/toast\.dismiss$/, ''); // remove the 'toast.dismiss' we added
      continue;
    }

    if (matchFound === 'object') {
      // toast({ ... }) - extract title, description, variant
      const start = bestPos + 'toast'.length;
      let depth = 0;
      let i = start;
      while (i < remaining.length) {
        if (remaining[i] === '(') depth++;
        else if (remaining[i] === ')') {
          if (depth === 0) break;
          depth--;
        }
        i++;
      }
      const fullCall = remaining.slice(bestPos, i + 1);
      const inner = fullCall.slice('toast('.length, -1).trim();

      // Parse the object-ish inner
      let titleVal = null, descVal = null, isDestructive = false;

      // Simple regex-based extraction
      const titleMatch = inner.match(/\btitle\s*:\s*((['"`])(?:(?!\2)[^\\]|\\.)*?\2|[a-zA-Z_$]\w*)/);
      const descMatch = inner.match(/\bdescription\s*:\s*((['"`])(?:(?!\2)[^\\]|\\.)*?\2|[a-zA-Z_$]\w*)/);
      const variantDestructive = /\bvariant\s*:\s*['"]destructive['"]/.test(inner);

      if (titleMatch) titleVal = titleMatch[1];
      if (descMatch) descVal = descMatch[1];

      if (variantDestructive) {
        if (descVal) result += `appToast.error(${titleVal}, ${descVal})`;
        else result += `appToast.error(${titleVal})`;
      } else {
        if (descVal) result += `appToast.info(${titleVal}, ${descVal})`;
        else result += `appToast.info(${titleVal})`;
      }

      pos = i + 1;
      continue;
    }

    // toast.method( ... )
    const method = matchFound;
    const prefix = `toast.${method}(`;
    const start = bestPos + prefix.length - 1; // point to the opening paren

    const isLoading = method === 'loading';
    const targetMethod = isLoading ? 'info' : method;

    // Extract the arguments, respecting balanced parens
    let depth = 0;
    let i = start;
    while (i < remaining.length) {
      if (remaining[i] === '(') depth++;
      else if (remaining[i] === ')') {
        if (depth === 0) break;
        depth--;
      }
      i++;
    }

    const fullCall = remaining.slice(bestPos, i + 1);
    // Parse args: toast.method(arg1, arg2)
    // The args are inside the parens
    const argsStr = fullCall.slice(prefix.length, -1).trim();

    // Extract first argument (the title/message)
    let firstArg = '';
    // Match string literal (single, double, template), or identifier chain, or expression
    const firstMatch = argsStr.match(/^\s*((['"`])(?:(?!\2)[^\\]|\\.)*?\2|(?:[a-zA-Z_$][\w$.]*\([^)]*\))|(?:[a-zA-Z_$][\w$.]*(?:\s*\?\s*[^:]+?\s*:\s*[^,]+?)?)|(?:[a-zA-Z_$][\w$.]*))\s*/);
    if (firstMatch) {
      firstArg = firstMatch[1].trim();
    } else {
      // Fallback: just use the whole args as a string
      firstArg = argsStr;
    }

    result += `appToast.${targetMethod}(${firstArg})`;
    pos = i + 1;
  }

  if (result) {
    content = result;
  }

  // Clean up duplicate empty newlines
  content = content.replace(/\n{3,}/g, '\n\n');

  // Remove duplicate appToast imports
  content = removeDupAppToastImports(content);

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// ---- main ----

const allFiles = globFiles(ROOT + '/src');

let changed = 0;

for (const filePath of allFiles) {
  if (filePath.includes('node_modules') || filePath.includes('\\dist\\') || filePath.includes('/dist/')) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  // Skip files that are clearly not relevant
  if (!content.includes('toast.')) continue;

  const rel = path.relative(ROOT, filePath);
  const didChange = transformFile(filePath);
  if (didChange) {
    console.log(`  OK   ${rel}`);
    changed++;
  } else {
    const remaining = fs.readFileSync(filePath, 'utf8');
    if (remaining.includes('toast.') && !remaining.includes('toast.displayName') && !remaining.includes('toast.id') && !remaining.includes('toast,') && !remaining.includes('//')) {
      // Check for actual toast. calls not in comments
      for (const m of [...TOAST_METHODS, 'loading']) {
        if (new RegExp(`toast\\.${m}\\(`).test(remaining)) {
          console.log(`  ?    ${rel} (unmatched toast.${m}())`);
          break;
        }
      }
    }
  }
}

console.log(`\nDone. ${changed} files fixed.`);
