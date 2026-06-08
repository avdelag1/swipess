/**
 * Phase 2: Handle remaining toast. calls:
 * 1. Template literal titles: toast.method(`title`, { ... })
 * 2. Files using const { toast } = useToast()
 * 3. toast({ title, description, variant }) object form
 * 4. toast.method(`title`) (no options)
 *
 * Usage: node execution/migrate_toast_phase2.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const METHODS = ['success', 'error', 'info', 'warning', 'message', 'like', 'match', 'loading'];

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

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig = content;
  const rel = path.relative(ROOT, filePath);

  // Find if file has remaining toast. calls or useToast pattern
  const hasToastMethod = METHODS.some(m => new RegExp('\\btoast\\.' + m + '\\(').test(content));
  const hasToastObj = /toast\(\s*\{/.test(content);
  const usesUseToast = content.includes('useToast');

  if (!hasToastMethod && !hasToastObj && !usesUseToast) return false;

  // Ensure appToast is imported
  const hasAppToastImport = content.includes("from '@/utils/appNotification'") || content.includes('from "@/utils/appNotification"');
  if (!hasAppToastImport) {
    // Insert import at top (after existing imports or at beginning)
    const lastImport = content.lastIndexOf('import ');
    const semiPos = content.indexOf(';', lastImport);
    const insertPos = semiPos !== -1 ? semiPos + 2 : 0; // after last import's semicolon + newline
    if (insertPos > 0) {
      content = content.slice(0, insertPos) + "\nimport { appToast } from '@/utils/appNotification';\n" + content.slice(insertPos);
    } else {
      content = "import { appToast } from '@/utils/appNotification';\n" + content;
    }
  }

  // Remove import { useToast } from '...' and const { toast } = useToast()
  content = content.replace(/import\s*\{\s*useToast\s*\}\s*from\s*['"][^'"]*['"]\s*;?\s*\n?/g, '');
  content = content.replace(/(?:const|let|var)\s*\{\s*toast\s*\}\s*=\s*useToast\s*\(\s*\)\s*;?\s*\n?/g, '');

  // Handle toast.METHOD(`template`, { ... }) - with options
  for (const m of METHODS) {
    const target = m === 'loading' ? 'info' : m;
    // toast.method(`template`, { ... })
    const re1 = new RegExp('toast\\.' + m + '\\(\\s*(`[^`]*`)\\s*,\\s*\\{[\\s\\S]*?\\}\\s*\\)', 'g');
    content = content.replace(re1, 'appToast.' + target + '($1)');
    // toast.method(`template`) - no options
    const re2 = new RegExp('toast\\.' + m + '\\(\\s*(`[^`]*`)\\s*\\)', 'g');
    content = content.replace(re2, 'appToast.' + target + '($1)');
  }

  // Handle toast({ title: `template`, description: `template`, variant: 'destructive' })
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*,\s*description\s*:\s*(`[^`]*`)\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*,\s*description\s*:\s*(`[^`]*`)[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)[^}]*\}\s*\)/g,
    'appToast.info($1)'
  );

  // Handle toast({ title: 'x', description: 'y', variant: 'destructive' })
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*('[^']*')\s*,\s*description\s*:\s*('[^']*')\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*("[^"]*")\s*,\s*description\s*:\s*("[^"]*")\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*('[^']*')\s*,\s*description\s*:\s*('[^']*')[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*("[^"]*")\s*,\s*description\s*:\s*("[^"]*")[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*('[^']*')[^}]*\}\s*\)/g,
    'appToast.info($1)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*("[^"]*")[^}]*\}\s*\)/g,
    'appToast.info($1)'
  );

  // Handle variable args: toast({ title: someVar, description: someVar2, variant: 'destructive' })
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*([a-zA-Z_$][\w$.]*)\s*,\s*description\s*:\s*([a-zA-Z_$][\w$.]*)\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*([a-zA-Z_$][\w$.]*)\s*,\s*description\s*:\s*([a-zA-Z_$][\w$.]*)[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*([a-zA-Z_$][\w$.]*)[^}]*\}\s*\)/g,
    'appToast.info($1)'
  );

  // Handle description before title order
  content = content.replace(
    /toast\(\s*\{\s*description\s*:\s*('[^']*')\s*,\s*title\s*:\s*('[^']*')\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($2, $1)'
  );
  content = content.replace(
    /toast\(\s*\{\s*description\s*:\s*('[^']*')\s*,\s*title\s*:\s*('[^']*')[^}]*\}\s*\)/g,
    'appToast.info($2, $1)'
  );

  // Handle toast with template literals that might have ${} in description
  // Match toast({ title: `...`, description: `...${}...` })
  // Since template literals with ${} can't be easily matched, handle the common case
  // where description has a dot-path expression
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*,\s*description\s*:\s*([a-zA-Z_$][\w$.]*)\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*,\s*description\s*:\s*([a-zA-Z_$][\w$.]*)[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );

  // Handle toast({ title: '...', description: variable })
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*('[^']*')\s*,\s*description\s*:\s*([a-zA-Z_$][\w$.]*)\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*('[^']*')\s*,\s*description\s*:\s*([a-zA-Z_$][\w$.]*)[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*("[^"]*")\s*,\s*description\s*:\s*([a-zA-Z_$][\w$.]*)\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*("[^"]*")\s*,\s*description\s*:\s*([a-zA-Z_$][\w$.]*)[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );

  // Remove any empty lines left by import removal
  content = content.replace(/\n{3,}/g, '\n\n');

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

  const c = fs.readFileSync(filePath, 'utf8');
  const hasToastM = METHODS.some(m => new RegExp('\\btoast\\.' + m + '\\(').test(c));
  const hasToastObj = /toast\(\s*\{/.test(c);
  const usesUseToast = c.includes('useToast');
  if (!hasToastM && !hasToastObj && !usesUseToast) continue;

  const rel = path.relative(ROOT, filePath);
  const didChange = fixFile(filePath);
  if (didChange) {
    console.log('  OK   ' + rel);
    changed++;
  } else {
    console.log('  ?    ' + rel + ' (unchanged)');
  }
}

console.log('\n' + changed + ' files fixed.');

// Final check
console.log('\nFinal check for remaining toast. calls...');
const warnings = [];
for (const filePath of allFiles) {
  if (filePath.includes('node_modules') || filePath.includes('\\dist\\')) continue;
  const base = path.basename(filePath);
  if (base === 'sonner.tsx' || base === 'use-toast.ts') continue;
  const c = fs.readFileSync(filePath, 'utf8');
  for (const m of METHODS) {
    const re = new RegExp('\\btoast\\.' + m + '\\(', 'g');
    if (re.test(c)) {
      warnings.push('  ' + path.relative(ROOT, filePath) + ' has toast.' + m + '()');
      break;
    }
  }
  if (/toast\(\s*\{/.test(c)) {
    warnings.push('  ' + path.relative(ROOT, filePath) + ' has toast({ object form)');
  }
}
if (warnings.length === 0) {
  console.log('  All clear! No remaining toast. calls in src/');
} else {
  for (const w of warnings) console.log(w);
}
