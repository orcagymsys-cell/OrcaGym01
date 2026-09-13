const fs = require('fs');
const { PNG } = require('pngjs');

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buffer = fs.readFileSync(filePath);
  
  new PNG({ filterType: -1 }).parse(buffer, (error, png) => {
    if (error) {
      console.error('PNG error:', error.message);
      return;
    }

    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];

        // If pixel is white or light background (RGB > 210)
        if (r > 210 && g > 210 && b > 210) {
          png.data[idx + 3] = 0; // Alpha = 0 (Transparent)
        }
      }
    }

    const outputBuffer = PNG.sync.write(png);
    fs.writeFileSync(filePath, outputBuffer);
    console.log(`Successfully made ${filePath} background 100% transparent!`);
  });
}

processFile('public/images/orca_logo.png');
processFile('images/orca_logo.png');
