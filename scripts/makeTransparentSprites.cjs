const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const fighters = [
  { id: 'ren_cruz', src: 'src/assets/images/fighter_ren_cruz_1792582265294.jpg', out: 'public/assets/sprites/fighter_ren_cruz.png' },
  { id: 'elena_rostova', src: 'src/assets/images/fighter_elena_rostova_1792582282404.jpg', out: 'public/assets/sprites/fighter_elena_rostova.png' },
  { id: 'marcus_vance', src: 'src/assets/images/fighter_marcus_vance_1792582303227.jpg', out: 'public/assets/sprites/fighter_marcus_vance.png' },
  { id: 'dmitri_sterling', src: 'src/assets/images/fighter_dmitri_sterling_1792582317994.jpg', out: 'public/assets/sprites/fighter_dmitri_sterling.png' },
  { id: 'julian_montfort', src: 'src/assets/images/fighter_julian_montfort_1792582332189.jpg', out: 'public/assets/sprites/fighter_julian_montfort.png' },
  { id: 'valerie_chevalier', src: 'src/assets/images/fighter_valerie_chevalier_1792582345718.jpg', out: 'public/assets/sprites/fighter_valerie_chevalier.png' },
  { id: 'mateo_valencia', src: 'src/assets/images/fighter_mateo_valencia_1792582357508.jpg', out: 'public/assets/sprites/fighter_mateo_valencia.png' },
];

fs.mkdirSync('public/assets/sprites', { recursive: true });

function processFighter(f) {
  console.log(`Processing ${f.id}...`);
  const jpegData = fs.readFileSync(f.src);
  const raw = jpeg.decode(jpegData, { useTArray: true });
  const { width, height, data } = raw;

  const png = new PNG({ width, height });

  // Flood fill / connected component from the outside edges
  // Any pixel that is near-white or matches background and is connected to the outer border is transparent.
  const isBg = new Uint8Array(width * height);
  const queue = [];

  function isWhiteOrLight(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    // Bright white background threshold
    return r > 230 && g > 230 && b > 230;
  }

  // Push all border pixels to queue if they are light background
  for (let x = 0; x < width; x++) {
    const topIdx = x * 4;
    const botIdx = ((height - 1) * width + x) * 4;
    if (isWhiteOrLight(topIdx)) { isBg[x] = 1; queue.push(x, 0); }
    if (isWhiteOrLight(botIdx)) { isBg[(height - 1) * width + x] = 1; queue.push(x, height - 1); }
  }
  for (let y = 0; y < height; y++) {
    const leftIdx = (y * width) * 4;
    const rightIdx = (y * width + (width - 1)) * 4;
    if (isWhiteOrLight(leftIdx)) { isBg[y * width] = 1; queue.push(0, y); }
    if (isWhiteOrLight(rightIdx)) { isBg[y * width + (width - 1)] = 1; queue.push(width - 1, y); }
  }

  // Also Elena has slight gradient in upper corners or text banner in bottom right
  if (f.id === 'elena_rostova') {
    // Top corners may have slight soft vignette
    for (let y = 0; y < 150; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        // If it is smooth neutral gray/white
        if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 160 && (x < 220 || x > 650)) {
          if (!isBg[y * width + x]) {
            isBg[y * width + x] = 1;
            queue.push(x, y);
          }
        }
      }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];

    const neighbors = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIndex = ny * width + nx;
        if (!isBg[nIndex]) {
          const idx = nIndex * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Check if this pixel is background
          let match = false;
          if (r > 225 && g > 225 && b > 225) {
            match = true;
          } else if (f.id === 'elena_rostova') {
            // Soft background gradient in Elena image
            if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && r > 165 && (nx < 240 || nx > 680 || ny > 800 || ny < 200)) {
              match = true;
            }
          }

          if (match) {
            isBg[nIndex] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Copy data to PNG and apply alpha
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = y * width + x;
      const dIdx = pIdx * 4;

      // Filter out bottom-right text watermark on Elena if present
      if (f.id === 'elena_rostova' && y > 750 && x > 550) {
        // Clear text banner
        const r = data[dIdx], g = data[dIdx + 1], b = data[dIdx + 2];
        if (y > 780 || (r > 200 && g > 200 && b > 200)) {
          png.data[dIdx] = 0;
          png.data[dIdx + 1] = 0;
          png.data[dIdx + 2] = 0;
          png.data[dIdx + 3] = 0;
          continue;
        }
      }

      if (isBg[pIdx]) {
        png.data[dIdx] = 0;
        png.data[dIdx + 1] = 0;
        png.data[dIdx + 2] = 0;
        png.data[dIdx + 3] = 0;
      } else {
        // Soft edge anti-aliasing
        let bgNeighbors = 0;
        if (x > 0 && isBg[pIdx - 1]) bgNeighbors++;
        if (x < width - 1 && isBg[pIdx + 1]) bgNeighbors++;
        if (y > 0 && isBg[pIdx - width]) bgNeighbors++;
        if (y < height - 1 && isBg[pIdx + width]) bgNeighbors++;

        let alpha = 255;
        if (bgNeighbors > 0) {
          // Soft edge blending
          const brightness = (data[dIdx] + data[dIdx + 1] + data[dIdx + 2]) / 3;
          if (brightness > 210) {
            alpha = Math.max(0, Math.min(255, Math.floor((255 - brightness) * 4.5)));
          }
        }

        png.data[dIdx] = data[dIdx];
        png.data[dIdx + 1] = data[dIdx + 1];
        png.data[dIdx + 2] = data[dIdx + 2];
        png.data[dIdx + 3] = alpha;
      }
    }
  }

  // Trim transparent bounding box
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = png.data[(y * width + x) * 4 + 3];
      if (a > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`  Trim bounds for ${f.id}: x=${minX}..${maxX}, y=${minY}..${maxY}`);
  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);

  const cropped = new PNG({ width: cropW, height: cropH });
  for (let cy = 0; cy < cropH; cy++) {
    for (let cx = 0; cx < cropW; cx++) {
      const srcIdx = ((minY + cy) * width + (minX + cx)) * 4;
      const dstIdx = (cy * cropW + cx) * 4;
      cropped.data[dstIdx] = png.data[srcIdx];
      cropped.data[dstIdx + 1] = png.data[srcIdx + 1];
      cropped.data[dstIdx + 2] = png.data[srcIdx + 2];
      cropped.data[dstIdx + 3] = png.data[srcIdx + 3];
    }
  }

  const outBuffer = PNG.sync.write(cropped);
  fs.writeFileSync(f.out, outBuffer);
  console.log(`  Saved ${f.out} (${cropW}x${cropH}, ${outBuffer.length} bytes)`);
}

for (const f of fighters) {
  processFighter(f);
}
console.log('All 7 transparent fighter sprites generated successfully!');
