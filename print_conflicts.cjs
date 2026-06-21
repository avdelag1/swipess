const fs = require('fs');
const execSync = require('child_process').execSync;

const status = execSync('git status --porcelain').toString();
const conflictFiles = status.split('\n')
  .filter(line => line.startsWith('UU ') || line.startsWith('AA '))
  .map(line => line.substring(3).trim())
  .filter(file => file !== 'package-lock.json' && file !== 'package.json');

for (const file of conflictFiles) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`\n=== CONFLICTS IN ${file} ===`);
  const lines = content.split('\n');
  let inConflict = false;
  for (let i=0; i<lines.length; i++) {
    if (lines[i].startsWith('<<<<<<<')) {
      inConflict = true;
      console.log(`[Line ${i+1}] ${lines[i]}`);
    } else if (lines[i].startsWith('=======')) {
      console.log(`[Line ${i+1}] ${lines[i]}`);
    } else if (lines[i].startsWith('>>>>>>>')) {
      console.log(`[Line ${i+1}] ${lines[i]}`);
      inConflict = false;
    } else if (inConflict) {
      console.log(lines[i]);
    }
  }
}
