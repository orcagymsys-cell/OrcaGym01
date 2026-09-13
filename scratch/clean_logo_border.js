const fs = require('fs');
const { PNG } = require('pngjs');

function cleanLogoBorders(filePath) {
  if (!fs.existsSync(filePath)) return;
  const buffer = fs.readFileSync(filePath);

  new PNG({ filterType: -1 }).parse(buffer, (error, png) => {
    if (error) {
      console.error('PNG error:', error.message);
      return;
    }

    // Process every pixel: keep only dark blue logo lines (R < 60, G < 80, B < 150)
    // All other background/whitish/grayish edge halo pixels become 100% transparent (alpha = 0)
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        const r = png.data[idx];
        const g = png.data[idx + 1];
        const b = png.data[idx + 2];

        // Dark navy logo stroke check
        const isDarkNavy = (r < 70 && g < 90 && b < 160);

        if (!isDarkNavy) {
          // Completely transparent
          png.data[idx + 3] = 0;
        } else {
          // Solid opaque logo stroke
          png.data[idx + 3] = 255;
        }
      }
    }

    const outputBuffer = PNG.sync.write(png);
    fs.writeFileSync(filePath, outputBuffer);
    console.log(`Successfully cleaned logo borders for ${filePath}!`);
  });
}

cleanLogoBorders('public/images/orca_logo.png');
cleanLogoBorders('images/orca_logo.png');
