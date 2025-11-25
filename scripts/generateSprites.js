// scripts/generateSprites.js
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '../assets/sprites');
const outputDir = path.join(__dirname, '../data');
const outputFile = path.join(outputDir, 'sprites.json');

// Mapeo de Carpetas a Categorías (Internas y UI)
const FOLDER_TO_CAT = {
  'floor': 'Piso',
  'wall': 'Pared',
  'obj': 'Objeto',
  'sims': 'Personaje'
};

// Configuración de validación
const MAX_DIM = 20; // Aumentado por seguridad si usas estructuras grandes

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

/**
 * Parsea el nombre del archivo para extraer dimensiones y anchor.
 * * Formatos aceptados:
 * 1. Nombre_WxH.png             -> Z=1, Anchor=Automático (Centro)
 * 2. Nombre_WxH_Z.png           -> Z=Definido, Anchor=Automático (Centro)
 * 3. Nombre_WxH_Z_axXay.png     -> Z=Definido, Anchor=Manual
 */
function parseSpriteName(filename) {
  // Regex actualizada:
  // Grupo 1: Nombre base
  // Grupo 2,3: Width x Height
  // Grupo 4 (Opcional): Depth (Z). Si no está, undefined.
  // Grupo 5,6 (Opcional): Anchor explícito. Si no está, undefined.
  
  // Nota: Para usar anchor manual, DEBES especificar Z primero.
  const regex = /^(.+?)_(\d+)x(\d+)(?:_(\d+))?(?:_(\d+)x(\d+))?\.png$/;
  const match = filename.match(regex);

  if (!match) return { error: 'Formato inválido. Use: Nombre_WxH[_Z][_axXay].png' };

  const [_, name, wStr, hStr, zStr, axStr, ayStr] = match;
  const width = parseInt(wStr, 10);
  const height = parseInt(hStr, 10);
  
  // Si zStr es undefined, asumimos 1 (Piso/Suelo)
  const depth = zStr ? parseInt(zStr, 10) : 1;

  // Validaciones de rango
  if (width < 1 || width > MAX_DIM || height < 1 || height > MAX_DIM) {
    return { error: `Dimensiones ${width}x${height} fuera de rango` };
  }

  // Lógica de Anchor
  let anchor = { x: 0, y: 0 };
  
  if (axStr !== undefined && ayStr !== undefined) {
    // --- CASO 1: Anchor Manual ---
    anchor.x = parseInt(axStr, 10);
    anchor.y = parseInt(ayStr, 10);
  } else {
    // --- CASO 2: Anchor Automático (Cálculo del Centro) ---
    // Buscamos el tile más cercano al centro.
    // Ejemplos Math.floor(size / 2):
    // 1x1 -> floor(0.5) = 0. (Anchor: 0,0)
    // 2x2 -> floor(1.0) = 1. (Anchor: 1,1) -> Esquina inferior derecha del cuadrante superior.
    // 3x3 -> floor(1.5) = 1. (Anchor: 1,1) -> Centro exacto.
    // 4x4 -> floor(2.0) = 2. (Anchor: 2,2)
    
    anchor.x = Math.floor(width / 2);
    anchor.y = Math.floor(height / 2);
    
    // Ajuste fino para pares: 
    // Si prefieres que el anchor de un 2x2 sea 0,0 (arriba izq), quita el comentario abajo.
    // Por defecto, floor(2/2) da 1, que suele ser mejor para pivotar objetos desde su base.
  }

  // Corrección de tolerancia (si el usuario pone anchor manual igual al tamaño)
  // Ej: 2x2 con anchor 2x2 -> Corregir a 1x1 (índice base 0)
  if (anchor.x === width && width > 0) anchor.x = width - 1;
  if (anchor.y === height && height > 0) anchor.y = height - 1;

  // Validar anchor dentro de bounds
  if (anchor.x < 0 || anchor.x >= width || anchor.y < 0 || anchor.y >= height) {
    return { error: `Anchor (${anchor.x},${anchor.y}) fuera de dimensiones del sprite (${width}x${height})` };
  }

  return { name, width, height, depth, anchor };
}

function generateSprites() {
  const categories = fs.readdirSync(rootDir, { withFileTypes: true })
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name);

  const allSprites = [];
  let errors = 0;

  console.log("Iniciando generación de sprites...");

  for (const folder of categories) {
    const folderPath = path.join(rootDir, folder);
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.png'));
    const mappedCategory = FOLDER_TO_CAT[folder] || 'Objeto';

    for (const file of files) {
      const parsed = parseSpriteName(file);

      if (parsed.error) {
        console.error(`❌ Error en [${folder}/${file}]: ${parsed.error}`);
        errors++;
        continue;
      }

      // Identificador único
      const id = `${folder}_${parsed.name}_${parsed.width}x${parsed.height}_${parsed.depth}`;

      allSprites.push({
        id: id,
        name: parsed.name,
        category: mappedCategory,
        sourceFolder: folder,
        path: `assets/sprites/${folder}/${file}`,
        width: parsed.width,
        height: parsed.height,
        depth: parsed.depth,
        anchor: parsed.anchor
      });
    }
  }

  fs.writeFileSync(outputFile, JSON.stringify(allSprites, null, 2));
  console.log(`\n✅ Proceso finalizado.`);
  console.log(`   Sprites procesados: ${allSprites.length}`);
  console.log(`   Errores: ${errors}`);
  console.log(`   Archivo guardado en: ${outputFile}`);
}

if (require.main === module) {
  generateSprites();
} else {
  module.exports = { parseSpriteName };
}