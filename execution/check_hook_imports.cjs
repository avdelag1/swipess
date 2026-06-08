const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'src');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '.tmp') {
      walk(p);
    } else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) {
      const content = fs.readFileSync(p, 'utf-8');
      const hooks = ['useMemo','useCallback','useEffect','useState','useRef','useId','useTransition','useDeferredValue','useImperativeHandle'];

      // Find hooks used WITHOUT React. prefix
      const bareHookPattern = new RegExp('\\b(' + hooks.join('|') + ')\\(', 'g');
      const matches = content.matchAll(bareHookPattern);
      const usedBare = new Set();
      for (const m of matches) {
        const hook = m[1];
        // Check it's not preceded by 'React.'
        const idx = m.index;
        const before = content.slice(Math.max(0, idx - 7), idx);
        if (!before.includes('React.')) {
          usedBare.add(hook);
        }
      }
      if (usedBare.size === 0) continue;

      // Get all imports from 'react'
      const importedHooks = new Set();
      const reactImports = content.matchAll(/import\s+(?:React\s*,)?\s*\{([^}]+)\}\s+from\s+['"]react['"]/g);
      for (const imp of reactImports) {
        for (const name of imp[1].split(',')) {
          importedHooks.add(name.trim());
        }
      }

      for (const hook of usedBare) {
        if (!importedHooks.has(hook)) {
          console.log(path.relative(root, p) + ': ' + hook + ' used without React. prefix but NOT in import');
        }
      }
    }
  }
}
walk(root);
