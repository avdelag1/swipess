/**
 * One-time migration: sonner toast → appNotification appToast
 *
 * Transforms:
 *   import { toast } from 'sonner'            → import { appToast } from '@/utils/appNotification'
 *   toast.success('x', { description: 'y' })  → appToast.success('x', 'y')
 *   toast.error('x', { description: 'y' })    → appToast.error('x', 'y')
 *   toast.info('x', { description: 'y' })     → appToast.info('x', 'y')
 *   toast.warning('x', { description: 'y' })  → appToast.warning('x', 'y')
 *   toast.message('x', { description: 'y' })  → appToast.message('x', 'y')
 *   toast.success('x')                        → appToast.success('x')
 *   toast.error('x')                          → appToast.error('x')
 *   toast.info('x')                           → appToast.info('x')
 *   toast.warning('x')                        → appToast.warning('x')
 *   toast.message('x')                        → appToast.message('x')
 *   toast({ title, description, variant:'destructive' }) → appToast.error(title, description)
 *   toast({ title, description })             → appToast.info(title, description)
 *   toast({ title })                          → appToast.info(title)
 *   toast.loading(...)                        → appToast.info(...) (best-effort)
 *   toast.dismiss()                           → removed (appToast auto-dismisses)
 *   toast.dismiss(id)                         → removed
 *
 * Usage: node execution/migrate_toast.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// ---- helpers ----

function globFiles(dir) {
  const result = [];
  try {
    const out = execSync(`dir /s /b "${dir}\\*.ts" "${dir}\\*.tsx"`, { cwd: ROOT, encoding: 'utf8', shell: 'cmd.exe' });
    for (const line of out.split('\n')) {
      const f = line.trim();
      if (f) result.push(f);
    }
  } catch { /* no files */ }
  return result;
}

function hasSonnerImport(content) {
  return content.includes("from 'sonner'") || content.includes('from "sonner"') || content.includes("require('sonner')") || content.includes('require("sonner")');
}

// ---- single-file transform ----

function transformFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const orig = content;

  // 1. Replace import line
  content = content.replace(
    /import\s*\{[^}]*\btoast\b[^}]*\}\s*from\s*['"]sonner['"]\s*;?\s*\n?/g,
    (match) => {
      // Check if appToast is already imported
      if (content.includes("from '@/utils/appNotification'") || content.includes('from "@/utils/appNotification"')) {
        // Already imported, just remove the sonner import
        return '';
      }
      // Check if other named exports were imported from sonner (like Toaster)
      const extracted = match.match(/\{([^}]+)\}/);
      if (extracted) {
        const names = extracted[1].split(',').map(s => s.trim());
        const nonToastNames = names.filter(n => n !== 'toast' && !n.startsWith('toast as'));
        if (nonToastNames.length > 0) {
          // Keep the sonner import with remaining names, add appToast import
          const keptNames = names.filter(n => n !== 'toast').join(', ');
          let replaceWith;
          if (keptNames.includes('Toaster') && keptNames.includes('sonnerToast')) {
            // Special case: components/ui/sonner.tsx style
            replaceWith = `import { ${keptNames} } from "sonner"\n`;
          } else {
            replaceWith = `import { ${keptNames} } from "sonner"\n`;
          }
          replaceWith += `import { appToast } from '@/utils/appNotification';\n`;
          return replaceWith;
        }
      }
      // Simple toast-only import
      return `import { appToast } from '@/utils/appNotification';\n`;
    }
  );

  // If the import wasn't replaced (wrong format), try harder
  if (content === orig && hasSonnerImport(content)) {
    content = content.replace(
      /import\s*\{[^}]*\btoast\b[^}]*\}\s*from\s*['"]sonner['"]\s*;?\s*(\r?\n)?/,
      (match) => {
        const extracted = match.match(/\{([^}]+)\}/);
        if (extracted) {
          const names = extracted[1].split(',').map(s => s.trim());
          const nonToastNames = names.filter(n => n !== 'toast');
          if (nonToastNames.length > 0) {
            return `import { ${nonToastNames.join(', ')} } from "sonner";\nimport { appToast } from '@/utils/appNotification';\n`;
          }
        }
        return `import { appToast } from '@/utils/appNotification';\n`;
      }
    );
  }

  // Handle require() style
  content = content.replace(
    /(?:const|let|var)\s+\{[^}]*\btoast\b[^}]*\}\s*=\s*require\(['"]sonner['"]\)\s*;?\s*(\r?\n)?/g,
    `const { appToast } = require('@/utils/appNotification');\n`
  );

  // If we can't find any import pattern but sonner is still there, add import manually
  if (content.includes('sonner') && !content.includes('appNotification')) {
    console.log(`  [WARN] Could not fully transform import in ${filePath}`);
  }

  // 2. Transform toast.method('title', { description: 'desc' }) patterns
  // These need to be done carefully to not double-process

  // toast.method('title', { description: 'desc' })
  // toast.method("title", { description: "desc" })
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\(['"]([^'"]*)['"]\s*,\s*\{[^}]*\bdescription\b\s*:\s*['"]([^'"]*)['"][^}]*\}\s*\)/g,
    (match, method, title, desc) => {
      return `appToast.${method}('${title.replace(/'/g, "\\'")}', '${desc.replace(/'/g, "\\'")}')`;
    }
  );

  // toast.method('title', { description: "desc" }) with double-quoted desc
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\(['"]([^'"]*)['"]\s*,\s*\{[^}]*\bdescription\b\s*:\s*["]([^"]*)["][^}]*\}\s*\)/g,
    (match, method, title, desc) => {
      return `appToast.${method}('${title.replace(/'/g, "\\'")}', '${desc.replace(/'/g, "\\'")}')`;
    }
  );

  // toast.method('title') - simple string
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\((['"][^'"]*['"])\)/g,
    'appToast.$1($2)'
  );

  // toast.method(`template`) - template literals (rare)
  content = content.replace(
    /toast\.(success|error|info|warning|message|like|match)\((`[^`]*`)\)/g,
    'appToast.$1($2)'
  );

  // 3. Transform toast({ title, description, variant: 'destructive' }) → appToast.error(title, description)
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*['"]([^'"]*)['"]\s*,\s*description\s*:\s*['"]([^'"]*)['"]\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    (match, title, desc) => `appToast.error('${title.replace(/'/g, "\\'")}', '${desc.replace(/'/g, "\\'")}')`
  );

  // toast({ title: "x", description: "y", variant: "destructive" })
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*["]([^"]*)["]\s*,\s*description\s*:\s*["]([^"]*)["]\s*,\s*variant\s*:\s*["]destructive["][^}]*\}\s*\)/g,
    (match, title, desc) => `appToast.error('${title.replace(/'/g, "\\'")}', '${desc.replace(/'/g, "\\'")}')`
  );

  // toast({ title: 'x', description: 'y' }) → appToast.info('x', 'y')
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*['"]([^'"]*)['"]\s*,\s*description\s*:\s*['"]([^'"]*)['"][^}]*\}\s*\)/g,
    (match, title, desc) => `appToast.info('${title.replace(/'/g, "\\'")}', '${desc.replace(/'/g, "\\'")}')`
  );

  // toast({ title: 'x' }) → appToast.info('x')
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*['"]([^'"]*)['"]\s*\}\s*\)/g,
    (match, title) => `appToast.info('${title.replace(/'/g, "\\'")}')`
  );

  // toast({ title: "x" }) → appToast.info("x")
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*["]([^"]*)["]\s*\}\s*\)/g,
    (match, title) => `appToast.info('${title.replace(/'/g, "\\'")}')`
  );

  // Handle template literals in toast({ title: `...`, description: `...` })
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*,\s*description\s*:\s*(`[^`]*`)\s*,\s*variant\s*:\s*['"]destructive['"][^}]*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*,\s*description\s*:\s*(`[^`]*`)[^}]*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(`[^`]*`)\s*\}\s*\)/g,
    'appToast.info($1)'
  );

  // Handle toast({ title: variable, description: variable, variant: 'destructive' })
  // These use variable names, not string literals
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(\w+)\s*,\s*description\s*:\s*(\w+)\s*,\s*variant\s*:\s*['"]destructive['"]\s*\}\s*\)/g,
    'appToast.error($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(\w+)\s*,\s*description\s*:\s*(\w+)\s*\}\s*\)/g,
    'appToast.info($1, $2)'
  );
  content = content.replace(
    /toast\(\s*\{\s*title\s*:\s*(\w+)\s*\}\s*\)/g,
    'appToast.info($1)'
  );

  // 4. Handle toast.loading(...) → appToast.info(...) (load not supported by appToast)
  content = content.replace(
    /toast\.loading\((['"`][^'"`]*['"`])\)/g,
    'appToast.info($1)'
  );

  // 5. Remove toast.dismiss() calls (not needed with appToast)
  content = content.replace(
    /toast\.dismiss\s*\([^)]*\)\s*;?\s*/g,
    ''
  );

  // 6. toast.promise(...) - This is complex. Replace with a comment + first arg.
  // toast.promise(promise, { loading, success, error }) → createAppNotification equivalents
  // For now, just replace with appToast.info for the success message
  content = content.replace(
    /toast\.promise\(\s*(\w+)\s*,\s*\{[^}]*success\s*:\s*['"]([^'"]*)['"][^}]*\}\s*\)/g,
    (match, promise, successMsg) => {
      // Return just the promise call and add an info toast
      return `${promise}; appToast.info('${successMsg.replace(/'/g, "\\'")}')`;
    }
  );

  // 7. toast.custom(...) → not supported, replace with info
  content = content.replace(
    /toast\.custom\([^)]+\)/g,
    "appToast.info('Action completed')"
  );

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// ---- main ----

const allFiles = globFiles(ROOT + '/src');

let changed = 0;
let unchanged = 0;

for (const filePath of allFiles) {
  // Skip node_modules and dist
  if (filePath.includes('node_modules') || filePath.includes('\\dist\\') || filePath.includes('/dist/')) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  if (!hasSonnerImport(content)) continue;

  // Skip the sonner UI component itself (it provides sonner, doesn't use our appToast)
  const rel = path.relative(ROOT, filePath);
  if (rel.includes('components\\ui\\sonner.tsx') || rel.includes('components/ui/sonner.tsx')) {
    console.log(`  SKIP ${rel} (sonner UI component)`);
    continue;
  }

  const didChange = transformFile(filePath);
  if (didChange) {
    console.log(`  OK   ${rel}`);
    changed++;
  } else {
    console.log(`  ?    ${rel} (no transform applied)`);
    unchanged++;
  }
}

console.log(`\nDone. ${changed} files migrated, ${unchanged} unchanged.`);
