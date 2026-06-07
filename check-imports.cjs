const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf-8');
  if (content.includes('<AnimatePresence')) {
    const importMatch = content.match(/import\s+{([^}]+)}\s+from\s+['"]framer-motion['"]/);
    if (importMatch) {
      if (!importMatch[1].includes('AnimatePresence')) {
        console.log('Missing AnimatePresence in import:', f);
      }
    } else {
      console.log('No framer-motion import but uses AnimatePresence:', f);
    }
  }
});
