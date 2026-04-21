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
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
const missing = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let hasIsLightUsage = false;
    let hasIsLightDecl = false;

    // Very simple check: does the string 'isLight' appear?
    if (content.includes('isLight')) {
        lines.forEach((line, i) => {
            // Check for usage in JSX or expressions
            // Avoid comments
            const cleanLine = line.split('//')[0];
            
            if (cleanLine.includes('isLight')) {
                // Is it a declaration?
                if (cleanLine.includes('const isLight') || 
                    cleanLine.includes('let isLight') || 
                    cleanLine.includes('var isLight') ||
                    cleanLine.includes('isLight =') || // Assignment
                    cleanLine.includes('isLight:') || // Prop definition in type/interface
                    cleanLine.includes('isLight?') || // Optional prop
                    cleanLine.includes('{ theme, isLight }') || // Destructuring
                    cleanLine.includes('{ isLight }') || // Destructuring
                    cleanLine.includes('isLight,') || // Prop in destructuring
                    cleanLine.includes('isLight }') // End of destructuring
                ) {
                    hasIsLightDecl = true;
                } else {
                    hasIsLightUsage = true;
                }
            }
        });

        if (hasIsLightUsage && !hasIsLightDecl) {
            missing.push(file);
        }
    }
});

console.log('Files with isLight usage but maybe missing declaration:');
missing.forEach(f => console.log(f));
