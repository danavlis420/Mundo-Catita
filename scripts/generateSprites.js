// scripts/generateSprites.js
// Ejecutar con Node para generar data/sprites.json
// Analiza los nombres de archivos de sprites para extraer su tamaño y altura 3D

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuración de carpetas
// ---------------------------------------------------------------------------
const rootDir = path.join(__dirname, '../assets/sprites');
const outputDir = path.join(__dirname, '../data');
const outputFile = path.join(outputDir, 'sprites.json');

// ---------------------------------------------------------------------------
// Crear carpeta data si no existe
// ---------------------------------------------------------------------------
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

// ---------------------------------------------------------------------------
// Función principal
// ---------------------------------------------------------------------------
function generateSprites() {
  const categories = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name);

  const allSprites = [];

  for (const category of categories) {
    const folderPath = path.join(rootDir, category);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png'));

    for (const file of files) {
      // Ejemplo: paredBase_1x1_3.png
      const match = file.match(/(.+?)_(\d+)x(\d+)_(\d+)\.png$/);
      if (!match) {
        console.warn(`❌ Nombre no reconocido: ${file}`);
        continue;
      }

      const [, baseName, width, height, depth] = match;
      allSprites.push({
        id: `${category}_${baseName}_${width}x${height}_${depth}`,
        name: baseName,
        category,
        path: `assets/sprites/${category}/${file}`,
        width: Number(width),
        height: Number(height),
        depth: Number(depth)
      });
    }
  }

  // Guardar el JSON final
  fs.writeFileSync(outputFile, JSON.stringify(allSprites, null, 2));
  console.log(`✅ Archivo generado: ${outputFile}`);
}

// ---------------------------------------------------------------------------
generateSprites();
