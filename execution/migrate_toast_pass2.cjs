/**
 * Pass 2: Handle files importing from '@/components/ui/sonner'
 * and transform remaining toast.method() calls with arbitrary option objects.
 *
 * Usage: node execution/migrate_toast_pass2.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

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

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig = content;
  const rel = path.relative(ROOT, filePath);

  // Skip sonner UI component and hooks that are part of the sonner system
  if (rel.includes('components\\ui\\sonner.tsx') || rel.includes('components/ui/sonner.tsx')) return false;
  if (rel.includes('components\\ui\\use-toast.ts') || rel.includes('components/ui/use-toast.ts')) return false;
  if (rel.includes('hooks\\use-toast.ts') || rel.includes('hooks/use-toast.ts')) return false;
  if (rel.includes('hooks\\useAuth.tsx') || rel.includes('hooks/useAuth.tsx')) return false; // comment-only mention

  const hasSonnerImport = content.includes("from 'sonner'") || content.includes('from "sonner"');
  const hasUiSonnerImport = content.includes("from '@/components/ui/sonner'") || content.includes('from "@/components/ui/sonner"');

  if (!hasSonnerImport && !hasUiSonnerImport) return false;

  // Replace import statements
  // Pattern 1: import { toast, ... } from 'sonner' (or with remaining names)
  content = content.replace(
    /import\s*\{([^}]*)\btoast\b([^}]*)\}\s*from\s*['"](sonner|@\/components\/ui\/sonner)['"]\s*;?\s*\n?/g,
    (match, before, after, _source) => {
      const names = (before + after).split(',').map(s => s.trim()).filter(Boolean);
      if (names.length > 0) {
        // Other named exports exist
        return `import { ${names.join(', ')} } from "sonner";\nimport { appToast } from '@/utils/appNotification';\n`;
      }
      // toast-only import
      return `import { appToast } from '@/utils/appNotification';\n`;
    }
  );

  // Pattern 2: import { toast } from '@/components/ui/sonner' without other names
  content = content.replace(
    /import\s*\{\s*toast\s*\}\s*from\s*['"]@\/components\/ui\/sonner['"]\s*;?\s*\n?/g,
    `import { appToast } from '@/utils/appNotification';\n`
  );

  // Pattern 3: const { toast } = require(...)
  content = content.replace(
    /(?:const|let|var)\s*\{\s*([^}]*)\btoast\b([^}]*)\}\s*=\s*require\(['"](sonner|@\/components\/ui\/sonner)['"]\)\s*;?\s*\n?/g,
    (match, before, after) => {
      const names = (before + after).split(',').map(s => s.trim()).filter(Boolean);
      if (names.length > 0) {
        return `const { ${names.join(', ')} } = require("sonner");\nconst { appToast } = require('@/utils/appNotification');\n`;
      }
      return `const { appToast } = require('@/utils/appNotification');\n`;
    }
  );

  // Transform toast.method() calls
  // Handle multiline patterns first (where options object spans multiple lines)
  // toast.method('title', { ... })
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\(\s*((['"`])(?:(?!\3)[^\\]|\\.)*?\3)\s*,\s*\{[^}]*\}\s*\)/gs,
    (match, method, titleArg) => {
      return `appToast.${method}(${titleArg})`;
    }
  );

  // toast.method(variable) - no string literal, no options
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\(\s*(\w+(?:\.\w+)*)\s*\)/g,
    'appToast.$1($2)'
  );

  // toast.method('simple')
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\(\s*((['"`])(?:(?!\3)[^\\]|\\.)*?\3)\s*\)/g,
    'appToast.$1($2)'
  );

  // toast.method(`template`, { ... })
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\(\s*(`[^`]*`)\s*,\s*\{[^}]*\}\s*\)/g,
    'appToast.$1($2)'
  );

  // toast.method(`template`)
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\(\s*(`[^`]*`)\s*\)/g,
    'appToast.$1($2)'
  );

  // toast.loading(...) → appToast.info(...)
  content = content.replace(
    /toast\.loading\(\s*((['"`])(?:(?!\2)[^\\]|\\.)*?\2)\s*(?:,\s*\{[^}]*\})?\s*\)/g,
    'appToast.info($1)'
  );
  content = content.replace(
    /toast\.loading\(\s*(\w+(?:\.\w+)*)\s*(?:,\s*\{[^}]*\})?\s*\)/g,
    'appToast.info($1)'
  );
  content = content.replace(
    /toast\.loading\(\s*(`[^`]*`)\s*(?:,\s*\{[^}]*\})?\s*\)/g,
    'appToast.info($1)'
  );

  // Remove toast.dismiss(...)
  content = content.replace(
    /toast\.dismiss\s*\([^)]*\)\s*;?\s*/g,
    ''
  );

  // Handle toast({ title, description, variant }) object form
  content = content.replace(
    /toast\(\s*\{\s*(?:[^}]*\btitle\b\s*:\s*((['"`])(?:(?!\2)[^\\]|\\.)*?\2|[a-zA-Z_$]\w*)\s*(?:,\s*[^}]*\bdescription\b\s*:\s*((['"`])(?:(?!\4)[^\\]|\\.)*?\4|[a-zA-Z_$]\w*))?[^}]*\bvariant\b[^}]*\b(destructive|default)\b[^}]*)\s*\}\)/g,
    (match, titleArg, _tq, descArg, _dq, _variant) => {
      if (descArg && _variant === 'destructive') {
        return `appToast.error(${titleArg}, ${descArg})`;
      }
      if (descArg) {
        return `appToast.info(${titleArg}, ${descArg})`;
      }
      return `appToast.info(${titleArg})`;
    }
  );

  // toast({ title, description }) without variant
  content = content.replace(
    /toast\(\s*\{\s*(?:[^}]*\btitle\b\s*:\s*((['"`])(?:(?!\2)[^\\]|\\.)*?\2|[a-zA-Z_$]\w*)\s*(?:,\s*[^}]*\bdescription\b\s*:\s*((['"`])(?:(?!\4)[^\\]|\\.)*?\4|[a-zA-Z_$]\w*))?[^}]*)\s*\}\)/g,
    (match, titleArg, _tq, descArg) => {
      if (descArg) return `appToast.info(${titleArg}, ${descArg})`;
      return `appToast.info(${titleArg})`;
    }
  );

  // toast({ title }) simple form
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*((['"`])(?:(?!\2)[^\\]|\\.)*?\2|[a-zA-Z_$]\w*)\s*\}\s*\)/g,
    'appToast.info($1)'
  );

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return content.includes('toast.') && content.includes('appToast') ? 'unchanged-calls' : false;
}

// ---- main ----

const allFiles = globFiles(ROOT + '/src');

let changed = 0;
let skipped = 0;

for (const filePath of allFiles) {
  if (filePath.includes('node_modules') || filePath.includes('\\dist\\') || filePath.includes('/dist/')) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('from \'sonner\'') && !content.includes('from "sonner"') &&
      !content.includes("from '@/components/ui/sonner'") && !content.includes('from "@/components/ui/sonner"') &&
      !content.includes("require('sonner')") && !content.includes('require("sonner")')) continue;

  const rel = path.relative(ROOT, filePath);
  const result = transformFile(filePath);
  if (result === true) {
    console.log(`  OK   ${rel}`);
    changed++;
  } else if (result === 'unchanged-calls') {
    console.log(`  ?    ${rel} (toast. calls remain)`);
    skipped++;
  } else {
    console.log(`  -    ${rel} (skipped)`);
  }
}

console.log(`\nDone. ${changed} files migrated, ${skipped} with remaining calls.`);
