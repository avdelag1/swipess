// Test regex matching
const fs = require('fs');
const path = require('path');

// Test case from useOwnerClientPreferences.ts
const text = `      toast({
        title: 'Error',
        description: \`Failed to save preferences: \${error.message}\`,
        variant: 'destructive',
      });`;

// The regex from phase2 script
const re = new RegExp("toast\\(\\s*\\{\\s*title\\s*:\\s*('[^']*')\\s*,\\s*description\\s*:\\s*(`[^`]*`)\\s*,\\s*variant\\s*:\\s*['\"]destructive['\"][^}]*\\}\\s*\\)", 'g');

console.log('Input text:');
console.log(text);
console.log('\nRegex:', re);
const match = text.match(re);
console.log('\nMatch result:', match);
