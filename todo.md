## Anotar siguientes pasos del proyecto






## Próximos pasos sugeridos

Agregar un mapa de tiles reales:
Crear una matriz bidimensional que contenga IDs de tipo de terreno (pasto, piedra, agua, etc.) y dibujarlos con sprites.

Incorporar objetos y construcción:
Permitir que el jugador coloque y quite objetos (paredes, muebles, árboles, etc.) en las casillas.

Animaciones y sprites del personaje:
Reemplazar el placeholder por un sprite animado (idle, caminar, construir).

Sistema de cámara mejorado:
Permitir desplazamiento con el mouse o con las teclas.

Audio y ambientación:
Cargar música y efectos desde /assets/audio.

Separar la lógica:
Mover partes del código (movimiento, renderizado, objetos, colisiones, etc.) a scripts modulares dentro de /scripts.

Notas y siguientes pasos recomendados:
- Añadir un mapa de tiles (array con IDs) para poder construir casas/objetos y dibujarlos con sprites.
- Crear una capa de objetos (muebles, paredes) que desenboca sobre las losetas.
- Implementar un sistema de snapping para colocar objetos en las casillas con el mouse.
- Añadir animaciones y estados al personaje (idle, walk) y controlar interpolación entre casillas.
- Cargar audio desde /assets/audio y separar la lógica de juego en /scripts.

## Mundo Catita Proyecto Base

Mundo Catita es un juego sandbox isométrico 2D en desarrollo, hecho con HTML, CSS y JavaScript puro.
Esta versión inicial genera una grilla isométrica configurable, un personaje de prueba, y un sistema de cámara básica que sigue al jugador.

## Estructura de carpetas
Mundo Catita/
├── index.html
├── styles.css
├── script.js
├── /assets
│   ├── /sprites
│   │   └── player.png          ← sprite de prueba del personaje
│   └── /audio                  ← sonidos y música
└── /scripts                    ← para scripts adicionales del juego

#  Archivos principales

## index.html

Contiene la estructura principal de la página.

Carga styles.css y script.js.

Incluye el canvas donde se dibuja la grilla y un pequeño HUD informativo.

## styles.css

Acomoda el canvas para ocupar toda la pantalla sin márgenes.

Define colores base, HUD y estilos responsivos.

Ideal para mantener el estilo visual y efectos globales del juego.

## script.js

Es el núcleo del juego.

Contiene:

Configuración de parámetros globales (filas, columnas, tamaño de tile, escala, etc.).

Funciones de conversión tile → coordenadas isométricas.

Renderizado de la grilla.

Carga y dibujo del personaje.

Cámara que sigue al jugador.

Controles de movimiento (WASD o flechas).

Todo el código está comentado para extenderlo fácilmente.

## Cómo usarlo

Abrí la carpeta Mundo Catita con tu editor (VS Code, por ejemplo).

Si tenés un servidor local, ejecutalo ahí (por ejemplo, con la extensión “Live Server” de VS Code).

Si abrís el archivo index.html directamente, también funciona, pero no cargará sprites externos si tu navegador bloquea rutas locales.

Asegurate de tener un archivo de sprite del jugador en:

/assets/sprites/player.png


Si no lo tenés, el script dibuja un placeholder circular para probar.

Usá WASD o flechas para mover el personaje por la grilla.

Redimensioná la ventana: el canvas se ajusta automáticamente al tamaño de pantalla.

## Variables configurables (en script.js)

Podés modificar fácilmente estos valores en el objeto CONFIG al inicio del script:

const CONFIG = {
  cols: 20,              // cantidad de columnas
  rows: 20,              // cantidad de filas
  tileWidth: 64,         // ancho del tile en px
  tileHeight: 32,        // alto del tile en px
  scale: 1.0,            // escala global
  backgroundColor: '#2b3440',
  playerSpritePath: 'assets/sprites/player.png',
  initialPlayer: { x: 10, y: 10 },
  cameraLag: 0.12        // suavizado de cámara (0 = instantáneo)
};

# Tiles

🎮 CONCEPTO GENERAL

Tu juego usa:

Grilla isométrica para el suelo (rombos)

Personajes y objetos dibujados de frente, anclados por los pies o la base al tile.

Esto es una vista teatral o pseudo-isométrica frontal, como si vieras un escenario desde adelante con el suelo extendiéndose en profundidad.

🧱 1. EL SUELO (tiles)
Forma y tamaño

Cada tile debe ser un rombo isométrico.

Tamaño recomendado: 64×32 px o 128×64 px (si querés más detalle).

Cuanto más grande el tile, más alto podrás dibujar muebles y personajes.

Construcción

Dibujá un rectángulo de 64×32 px.

Con una herramienta de deformación, transformalo en rombo (ángulos de 30° y 150° aprox).

El centro del tile (donde se cruzan las diagonales) será el punto donde se apoya el personaje u objeto.

Guía de color o textura

El borde superior del rombo puede ser más claro, y el inferior más oscuro, para simular la profundidad.

Si vas a usar texturas (pasto, baldosa, madera), repetí el patrón dentro del rombo sin salirse de los bordes.

Fondo transparente, no blanco.

📍 Nombre sugerido:
suelo_pasto.png, suelo_madera.png, suelo_baldosa.png
→ Guardalos en /assets/tiles/

🧍‍♀️ 2. PERSONAJES
Orientación

Frontal, mirando hacia la pantalla.

No deben tener ángulo lateral ni vista cenital.

Evitá dibujar el piso debajo de los pies: el tile lo hará por vos.

Tamaño sugerido

Entre 64×96 px y 64×128 px, según la escala del entorno.

Los pies deben estar justo en el borde inferior de la imagen.

El centro del cuerpo debe coincidir con el centro horizontal del PNG.

Guía práctica

Imaginá que el personaje está de pie sobre el centro de un rombo.
El motor dibuja así:

Calcula la posición del tile.

Dibuja el personaje centrado en X, apoyado abajo en Y.

Esto significa que:

Si el personaje mide 96 px, unos 16–24 px superiores se verán por encima de los muebles cercanos.

El cuerpo nunca debe tener sombra fuera de la base (a menos que la dibujes separada en otro sprite).

📍 Nombre sugerido:
player_idle.png, player_walk.png
→ Guardalos en /assets/sprites/

🪑 3. MUEBLES Y OBJETOS
Escala

Diseñalos en proporción al personaje.
Por ejemplo, una mesa puede medir 64×64 px (ocupa un tile),
una cama 128×96 px (dos tiles),
una pared 64×128 px (alta, ocupa un tile de ancho).

Orientación

También de frente, sin perspectiva angular.

Dibujá la base (patas, borde inferior) para que quede alineada con el centro del tile.

Los objetos más grandes (como una estantería) pueden ocupar más de un tile pero deben estar anclados por el centro de su base.

📍 Consejo:
Usá una capa guía en tu editor de imágenes con el rombo del tile en gris semitransparente.
Dibujá el mueble encima para que su base coincida con el centro.

🧱 4. PAREDES Y DECORACIONES

Las paredes pueden seguir el mismo principio:

Si querés construir habitaciones:

Cada pared vertical se puede dibujar como un bloque 64 px de ancho (el mismo ancho que un tile)

y 128 px o más de alto, según la escala.

Se anclan al borde inferior del tile en el que están apoyadas.

Si las dibujás como piezas modulares (por ejemplo “pared izquierda”, “pared derecha”, “esquina”), podés colocarlas encima de los tiles del mapa.

☀️ 5. ILUMINACIÓN Y SOMBRAS

En este estilo, la luz suele venir desde arriba (suave) o desde el frente superior.

Sombra del personaje: un óvalo gris semitransparente debajo (no integrado en el sprite).
Ejemplo: 16 px de ancho, 6 px de alto, desenfocado.

🧭 6. ESCALA VISUAL COHERENTE
Elemento	Ejemplo de tamaño	Observación
Suelo (tile)	64×32 px	define proporción base
Personaje	64×96 px	pies apoyan en el centro del tile
Mesa	64×64 px	ocupa 1 tile
Cama	128×96 px	ocupa 2×1 tiles
Pared	64×128 px	se apoya en borde trasero del tile
🧩 7. CAPAS (layers)

Cuando dibujes:

Suelo (tiles)

Objetos del piso (alfombras, mesas)

Personajes

Objetos verticales (paredes, cuadros)

Así el personaje podrá pasar delante de una mesa pero detrás de una pared, manteniendo coherencia visual.

✅ En resumen

Todo PNG con fondo transparente.

Pies o base apoyados exactamente en el borde inferior.

Centro del sprite alineado con el centro del tile.

Objetos de frente, sin ángulo ni vista cenital.

Tiles en forma de rombo (64×32 px).

Guardá todo separado por carpetas (/sprites, /tiles, /objects, /walls).