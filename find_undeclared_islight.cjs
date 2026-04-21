const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk('./src');
const problematicFiles = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Skip if isLight is not used at all
    if (!content.includes('isLight')) return;

    const lines = content.split('\n');
    let hasDeclaration = false;
    let occurrences = [];

    // Check for declarations
    const declRegex = /\b(const|let|var|function)\b.*\bisLight\b/;
    const destructureRegex = /\{\s*([^}]*,)?\s*isLight\s*([^}]*)?\}\s*=/;
    const propRegex = /\bisLight\s*:|isLight\s*\?/;
    
    lines.forEach((line, i) => {
        const cleanLine = line.split('//')[0].split('/*')[0];
        
        if (declRegex.test(cleanLine) || destructureRegex.test(cleanLine) || propRegex.test(cleanLine)) {
            hasDeclaration = true;
        }

        if (cleanLine.includes('isLight')) {
            // Check if it's just a variable usage
            // Exclude common declaration patterns we might have missed
            if (!declRegex.test(cleanLine) && !destructureRegex.test(cleanLine) && !propRegex.test(cleanLine)) {
                occurrences.push({ line: i + 1, text: line.trim() });
            }
        }
    });

    if (occurrences.length > 0 && !hasDeclaration) {
        problematicFiles.push({ file, occurrences });
    }
});

console.log(JSON.stringify(problematicFiles, null, 2));
