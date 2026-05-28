const fs = require('fs');
const { execSync } = require('child_process');
const files = execSync('dir /s /b src\\*.ts src\\*.tsx').toString().split('\r\n').filter(Boolean);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('Scale') && content.includes('lucide-react')) {
    content = content.replace(/\bScale\b(?=\s*[,}])/g, 'Scale as ScaleIcon');
    content = content.replace(/icon:\s*Scale\b/g, 'icon: ScaleIcon');
    content = content.replace(/<Scale\b/g, '<ScaleIcon');
    content = content.replace(/ScaleIcon as ScaleIcon/g, 'ScaleIcon');
    fs.writeFileSync(file, content, 'utf8');
  }
}
