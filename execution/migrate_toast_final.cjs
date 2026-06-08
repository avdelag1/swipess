/**
 * Final sonner→appToast migration.
 * Uses simple safe regex only — no state machine, no character-by-character parsing.
 *
 * Usage: node execution/migrate_toast_final.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const METHODS = ['success', 'error', 'info', 'warning', 'message', 'like', 'match'];
const ALL_METHODS = [...METHODS, 'loading'];

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

function hasSonnerImport(content) {
  return /from\s*['"](sonner|@\/components\/ui\/sonner)['"]/.test(content);
}

function isSonnerSystemFile(filePath) {
  const base = path.basename(filePath);
  return base === 'sonner.tsx' || base === 'use-toast.ts';
}

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig = content;

  // Step 1: Replace import line
  // Pattern: import { toast } from 'sonner' or from '@/components/ui/sonner'
  content = content.replace(
    /import\s*\{([^}]*)\btoast\b([^}]*)\}\s*from\s*['"](sonner|@\/components\/ui\/sonner)['"]\s*;?\s*\n?/g,
    (match, before, after) => {
      const names = (before + after).split(',').map(s => s.trim()).filter(n => n.length > 0 && n !== 'toast');
      const newImport = names.length > 0
        ? `import { ${names.join(', ')} } from "sonner";\n`
        : '';
      return `${newImport}import { appToast } from '@/utils/appNotification';\n`;
    }
  );

  // Step 2: Transform specific simple call patterns
  // toast.METHOD('text', { ... }) → appToast.METHOD('text')
  // Handles single-quoted, double-quoted, and template literal titles
  for (const m of ALL_METHODS) {
    const target = m === 'loading' ? 'info' : m;
    // Simple: 'text' or "text" or `text`
    // Match toast.method('text', { anything up to matching closing brace })
    // Safe regex: uses [\s\S] to match across lines, and \{[\s\S]*?\} for the options object
    // BUT \{[\s\S]*?\} is non-greedy and stops at the FIRST } which may be inside template literals
    
    // First: toast.method('text') - no options (single/double quotes)
    const reSimpleSingle = new RegExp('toast\\.' + m + '\\(\\s*(\'[^\']*\')\\s*\\)', 'g');
    content = content.replace(reSimpleSingle, 'appToast.' + target + '($1)');
    
    const reSimpleDouble = new RegExp('toast\\.' + m + '\\(\\s*("[^"]*")\\s*\\)', 'g');
    content = content.replace(reSimpleDouble, 'appToast.' + target + '($1)');

    // Second: toast.method('text', { ...options }) - strip the options object
    const reOptsSingle = new RegExp('toast\\.' + m + '\\(\\s*(\'[^\']*\')\\s*,\\s*\\{[\\s\\S]*?\\}\\s*\\)', 'g');
    content = content.replace(reOptsSingle, 'appToast.' + target + '($1)');
    
    const reOptsDouble = new RegExp('toast\\.' + m + '\\(\\s*("[^"]*")\\s*,\\s*\\{[\\s\\S]*?\\}\\s*\\)', 'g');
    content = content.replace(reOptsDouble, 'appToast.' + target + '($1)');

    // Third: toast.method(msgVariableName) - variable as arg
    const reVar = new RegExp('toast\\.' + m + '\\(\\s*([a-zA-Z_$][\\w$.]*)\\s*\\)', 'g');
    content = content.replace(reVar, 'appToast.' + target + '($1)');

    // Third: toast.method(msgVariableName) - variable as arg
    content = content.replace(
      new RegExp(`toast\\.${m}\\(\\s*([a-zA-Z_$][\\w$.]*)\\s*\\)`, 'g'),
      `appToast.${target}($1)`
    );
  }

  // Step 3: Transform toast({ title, description, variant }) object form
  // toast({ title: 'x', description: 'y', variant: 'destructive' })
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*('[^']*')\s*,\s*description\s*:\s*('[^']*')\s*,\s*variant\s*:\s*'destructive'[^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*("[^"]*")\s*,\s*description\s*:\s*("[^"]*")\s*,\s*variant\s*:\s*"destructive"[^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );

  // toast({ title: 'x', description: 'y' }) - no variant
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*('[^']*')\s*,\s*description\s*:\s*('[^']*')[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*("[^"]*")\s*,\s*description\s*:\s*("[^"]*")[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );

  // toast({ title: 'x' }) - title only
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*('[^']*')[^}]*\}\s*\)/g,
    'appToast.info($1)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*("[^"]*")[^}]*\}\s*\)/g,
    'appToast.info($1)'
  );

  // Handle template literals in object form
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(\`[^`]*\`)\s*,\s*description\s*:\s*(\`[^`]*\`)\s*,\s*variant\s*:\s*'destructive'[^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(\`[^`]*\`)\s*,\s*description\s*:\s*(\`[^`]*\`)[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(\`[^`]*\`)[^}]*\}\s*\)/g,
    'appToast.info($1)'
  );

  // Handle variable args in object form: toast({ title: error.message, description: ... })
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

  // Handle toast({ description: 'x', ... }) with description first
  content = content.replace(
    /toast\(\s*\{\s*description\s*:\s*('[^']*')\s*,\s*title\s*:\s*('[^']*')\s*,\s*variant\s*:\s*'destructive'[^}]*\}\s*\)/g,
    'appToast.error($2, $1)'
  );
  content = content.replace(
    /toast\(\s*\{\s*description\s*:\s*('[^']*')\s*,\s*title\s*:\s*('[^']*')[^}]*\}\s*\)/g,
    'appToast.info($2, $1)'
  );

  // Step 4: Remove toast.dismiss() calls
  content = content.replace(/toast\.dismiss\s*\([^)]*\)\s*;?\s*/g, '');

  // Step 5: Remove duplicate blank lines
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
  if (isSonnerSystemFile(filePath)) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  if (!hasSonnerImport(content)) continue;

  const rel = path.relative(ROOT, filePath);
  const didChange = transformFile(filePath);
  if (didChange) {
    console.log(`  OK   ${rel}`);
    changed++;
  }
}

console.log(`\n${changed} files migrated.`);

// Check for remaining toast. calls
console.log('\nChecking for remaining toast. calls...');
const warnings = [];
for (const filePath of allFiles) {
  if (filePath.includes('node_modules') || filePath.includes('\\dist\\') || filePath.includes('/dist/')) continue;
  if (isSonnerSystemFile(filePath)) continue;
  const c = fs.readFileSync(filePath, 'utf8');
  for (const m of ALL_METHODS) {
    const re = new RegExp(`\\btoast\\.${m}\\(`, 'g');
    if (re.test(c)) {
      warnings.push(`  WARN: ${path.relative(ROOT, filePath)} has toast.${m}()`);
      break;
    }
  }
  // Also check for toast({ object form
  if (/toast\(\s*\{/.test(c)) {
    warnings.push(`  WARN: ${path.relative(ROOT, filePath)} has toast({ object form)`);
  }
}

if (warnings.length === 0) {
  console.log('  All clear! No remaining toast. calls.');
} else {
  for (const w of warnings) console.log(w);
}
