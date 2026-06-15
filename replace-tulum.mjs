import fs from 'fs';
import path from 'path';

const files = [
  'src/components/SavedSearchesDialog.tsx',
  'src/components/SeekerAdSection.tsx',
  'src/components/HolographicIDCard.tsx',
  'src/components/ExploreFeatureLinks.tsx',
  'src/components/ConciergeChat.tsx',
  'src/components/VapIdEditModal.tsx',
  'src/components/events/PromoteCTACard.tsx',
  'src/components/events/ShareModal.tsx',
  'src/components/AIProfileWizard.tsx',
  'src/components/ClientPreferencesDialog.tsx'
];

for (const file of files) {
  const fullPath = path.resolve(file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/Tulum/g, 'Miami');
    content = content.replace(/tulum/g, 'miami');
    content = content.replace(/Centro Miami/g, 'Downtown Miami');
    fs.writeFileSync(fullPath, content);
  }
}
console.log('Done replacing Tulum with Miami in specific files.');
