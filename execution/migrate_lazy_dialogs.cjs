/**
 * Migrate eager dialog/modal imports to lazyWithRetry for all 18 consumer files.
 *
 * For each file:
 *   1. Replace `import { X } from 'path/X'` → `const X = lazyWithRetry(() => import('path/X').then(m => ({ default: m.X })));`
 *   2. Wrap every `<X ... />` usage in `<Suspense fallback={null}>`
 *   3. Add `lazyWithRetry` / `Suspense` imports if missing
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'D:/swipess';

// ── migration map ──────────────────────────────────────────────────────────
const MIGRATIONS = [
  // src/components/
  { file: 'src/components/MessagingInterface.tsx', comps: [
    ['SwipeInsightsModal', '@/components/SwipeInsightsModal'],
    ['RatingSubmissionDialog', '@/components/RatingSubmissionDialog'],
    ['ShareDialog', '@/components/ShareDialog'],
  ]},
  { file: 'src/components/PropertyManagement.tsx', comps: [
    ['ListingPreviewDialog', '@/components/ListingPreviewDialog'],
    ['CategorySelectionDialog', '@/components/CategorySelectionDialog'],
    ['ShareDialog', '@/components/ShareDialog'],
  ]},
  { file: 'src/components/LikedClients.tsx', comps: [
    ['SwipeInsightsModal', '@/components/SwipeInsightsModal'],
  ]},
  { file: 'src/components/SwipessSwipeContainer.tsx', comps: [
    ['OwnerClientFilterDialog', './OwnerClientFilterDialog'],
    ['ClientPreferencesDialog', './ClientPreferencesDialog'],
    ['MessageConfirmationDialog', './MessageConfirmationDialog'],
    ['DirectMessageDialog', './DirectMessageDialog'],
    ['ReportDialog', './ReportDialog'],
    ['SwipeInsightsModal', './SwipeInsightsModal'],
    ['ShareDialog', './ShareDialog'],
  ]},
  { file: 'src/components/VapIdCardModal.tsx', comps: [
    ['VapIdEditModal', './VapIdEditModal'],
  ]},
  { file: 'src/components/GlobalDialogs.tsx', comps: [
    ['TokensModal', './TokensModal'],
  ]},

  // sub-directories under components/
  { file: 'src/components/swipe/SwipeAllDashboard.tsx', comps: [
    ['VapIdCardModal', '@/components/VapIdCardModal'],
  ]},
  { file: 'src/components/perks/PerksDashboard.tsx', comps: [
    ['ResidentQRModal', '@/components/perks/ResidentQRModal'],
  ]},

  // src/pages/
  { file: 'src/pages/PublicListingPreview.tsx', comps: [
    ['DirectMessageDialog', '@/components/DirectMessageDialog'],
    ['ShareDialog', '@/components/ShareDialog'],
  ]},
  { file: 'src/pages/ProfileDetailPage.tsx', comps: [
    ['ReportDialog', '@/components/ReportDialog'],
    ['ShareDialog', '@/components/ShareDialog'],
    ['SwipeInsightsModal', '@/components/SwipeInsightsModal'],
  ]},
  { file: 'src/pages/ListingDetailPage.tsx', comps: [
    ['ReportDialog', '@/components/ReportDialog'],
    ['ShareDialog', '@/components/ShareDialog'],
    ['SwipeInsightsModal', '@/components/SwipeInsightsModal'],
  ]},
  { file: 'src/pages/PublicProfilePreview.tsx', comps: [
    ['ShareDialog', '@/components/ShareDialog'],
  ]},
  { file: 'src/pages/ClientProfile.tsx', comps: [
    ['ClientProfileDialog', '@/components/ClientProfileDialog'],
    ['VapIdCardModal', '@/components/VapIdCardModal'],
    ['VapIdEditModal', '@/components/VapIdEditModal'],
  ]},
  { file: 'src/pages/ClientProfileNew.tsx', comps: [
    ['ClientProfileDialog', '@/components/ClientProfileDialog'],
    ['ShareDialog', '@/components/ShareDialog'],
  ]},
  { file: 'src/pages/OwnerSavedSearches.tsx', comps: [
    ['OwnerClientFilterDialog', '@/components/OwnerClientFilterDialog'],
  ]},
  { file: 'src/pages/RoommateMatching.tsx', comps: [
    ['MessageConfirmationDialog', '@/components/MessageConfirmationDialog'],
  ]},
  { file: 'src/pages/OwnerNewListing.tsx', comps: [
    ['CategorySelectionDialog', '@/components/CategorySelectionDialog'],
  ]},
  { file: 'src/pages/EventosFeed.tsx', comps: [
    ['ShareModal', '@/components/events/ShareModal'],
  ]},
];

// ── helpers ─────────────────────────────────────────────────────────────────

function hasImport(code, name) {
  return new RegExp(`import\\s*\\{?[^}]*\\b${name}\\b[^}]*\\}?\\s*from`).test(code);
}

function hasLazyWithRetry(code) {
  return code.includes("import { lazyWithRetry } from '@/utils/lazyRetry'") ||
         code.includes('import { lazyWithRetry } from "@/utils/lazyRetry"');
}

function hasSuspense(code) {
  return /\bSuspense\b/.test(code);
}

/**
 * Replace `import { X } from 'path/X';`
 * with `const X = lazyWithRetry(() => import('path/X').then(m => ({ default: m.X })));`
 */
function replaceImport(code, comp, importPath) {
  // Match variations: single quotes, double quotes, trailing semicolon or not
  const escaped = importPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `import\\s*\\{\\s*${comp}\\s*\\}\\s*from\\s*['"]${escaped}['"]\\s*;?\\s*`,
    ''
  );
  const replacement = `const ${comp} = lazyWithRetry(() => import('${importPath}').then(m => ({ default: m.${comp} })));\n`;
  if (!re.test(code)) {
    // Try alternative: import { X, Y } from 'path' where X is one of many
    const re2 = new RegExp(
      `(import\\s*\\{)([^}]*)\\b(${comp})\\b([^}]*)\\}\\s*from\\s*['"]${escaped}['"]\\s*;?\\s*`,
      ''
    );
    const match = code.match(re2);
    if (match) {
      const before = match[1];
      const middle1 = match[2].trim();
      const middle2 = match[4].trim();
      const remaining = [middle1, middle2].filter(s => s).join(', ');
      if (remaining) {
        // There are other imports alongside this one
        const newImport = `${before} ${remaining} } from '${importPath}';\n`;
        return code.replace(re2, newImport + replacement);
      } else {
        // Only this import, remove it entirely
        return code.replace(re2, replacement);
      }
    }
    console.warn(`  ⚠  Could not find import for ${comp} from ${importPath}`);
    return code;
  }
  return code.replace(re, replacement);
}

/**
 * Wrap each `<CompName .../>` usage in `<Suspense fallback={null}>...</Suspense>`.
 * Handles multi-line self-closing JSX tags.
 */
function wrapJsx(code, comp) {
  const re = new RegExp(`<${comp}\\b[^>]*\\/>`, 'gs');
  return code.replace(re, (match) => {
    // Determine indentation from the match
    const lines = match.split('\n');
    const lastLine = lines[lines.length - 1];
    const indent = lastLine.match(/^\s*/)?.[0] || '';
    return `<Suspense fallback={null}>${match}</Suspense>`;
  });
}

/**
 * Ensure `lazyWithRetry` is imported.
 */
function ensureLazyWithRetry(code) {
  if (hasLazyWithRetry(code)) return code;
  // Add after last react import or at top
  const reactImportMatch = code.match(/^import\s+.*?from\s+['"]react['"]\s*;?\s*$/m);
  if (reactImportMatch) {
    const idx = reactImportMatch.index + reactImportMatch[0].length;
    return code.slice(0, idx) + '\nimport { lazyWithRetry } from \'@/utils/lazyRetry\';' + code.slice(idx);
  }
  // Fallback: add after first import line
  const firstImport = code.match(/^import\s.*;?\s*$/m);
  if (firstImport) {
    const idx = firstImport.index + firstImport[0].length;
    return code.slice(0, idx) + '\nimport { lazyWithRetry } from \'@/utils/lazyRetry\';' + code.slice(idx);
  }
  return 'import { lazyWithRetry } from \'@/utils/lazyRetry\';\n' + code;
}

/**
 * Ensure `Suspense` is imported from 'react'.
 */
function ensureSuspense(code) {
  if (hasSuspense(code)) return code;
  const reactImport = code.match(/^(import\s*\{)([^}]*)(\}\s*from\s*['"]react['"]\s*;?\s*)$/m);
  if (reactImport) {
    const existing = reactImport[2];
    const updated = `${reactImport[1]} Suspense,${existing}${reactImport[3]}`;
    return code.replace(reactImport[0], updated);
  }
  return code;
}

// ── main ────────────────────────────────────────────────────────────────────

let modifiedCount = 0;
let errorCount = 0;

for (const migration of MIGRATIONS) {
  const fullPath = path.join(ROOT, migration.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ❌ File not found: ${migration.file}`);
    errorCount++;
    continue;
  }

  let code = fs.readFileSync(fullPath, 'utf-8');
  let needsLazyImport = false;
  let needsSuspense = false;

  for (const [comp, importPath] of migration.comps) {
    if (!hasImport(code, comp)) {
      console.warn(`  ⚠  ${migration.file}: no import for ${comp}, skipping`);
      continue;
    }
    // Step 1: replace import
    const beforeImport = code;
    code = replaceImport(code, comp, importPath);
    if (code !== beforeImport) {
      console.log(`  ✓ ${migration.file}: replaced import for ${comp}`);
      needsLazyImport = true;
    }

    // Step 2: wrap JSX in Suspense
    const beforeJsx = code;
    code = wrapJsx(code, comp);
    if (code !== beforeJsx) {
      console.log(`  ✓ ${migration.file}: wrapped ${comp} in Suspense`);
      needsSuspense = true;
    }
  }

  if (needsLazyImport) {
    code = ensureLazyWithRetry(code);
  }
  if (needsSuspense) {
    code = ensureSuspense(code);
  }

  if (needsLazyImport || needsSuspense) {
    fs.writeFileSync(fullPath, code, 'utf-8');
    modifiedCount++;
    console.log(`  ✅ Wrote ${migration.file}`);
  } else {
    console.log(`  – ${migration.file}: no changes needed`);
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Modified: ${modifiedCount} files, Errors: ${errorCount}`);
