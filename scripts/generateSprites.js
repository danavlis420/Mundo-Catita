// node scripts/generateSprites.js

const fs = require('fs');
const path = require('path');

const spriteFolders = [
  { dir: './assets/sprites/floor', category: 'floor' },
  { dir: './assets/sprites/wall', category: 'wall' },
  { dir: './assets/sprites/object', category: 'object' }
];

const sprites = [];

spriteFolders.forEach(folder => {
  const files = fs.readdirSync(folder.dir);
  files.forEach(file => {
    const match = file.match(/(.+?)_(\d+)x(\d+)_\d+\.png$/);
    if (match) {
      const [_, name, width, height] = match;
      sprites.push({
        path: path.join(folder.dir, file).replace(/\\/g, '/'),
        name,
        category: folder.category,
        width: Number(width),
        height: Number(height)
      });
    }
  });
});

fs.writeFileSync('./assets/sprites.json', JSON.stringify(sprites, null, 2));
console.log('sprites.json generado correctamente');
