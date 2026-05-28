const fs = require('fs');
const path = require('path');

const cardsDir = path.join(__dirname, 'public', 'cards');
const files = fs.readdirSync(cardsDir).sort();

console.log(`Всього файлів: ${files.length}`);
console.log(files.join('\n'));