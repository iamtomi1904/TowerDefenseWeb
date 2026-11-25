import sharp from 'sharp';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'assets/openworld/v2');
const output = resolve(root, 'public/openworld-art/v2');
await mkdir(output, {recursive: true});

async function pixels(name) {
  const {data, info} = await sharp(resolve(source, name)).ensureAlpha().raw().toBuffer({resolveWithObject: true});
  return {data, width: info.width, height: info.height};
}
function bands(projection, threshold = 8) {
  const result = []; let start = -1;
  for (let i = 0; i <= projection.length; i++) {
    if (projection[i] > threshold && start < 0) start = i;
    if (!(projection[i] > threshold) && start >= 0) {
      if (i - start > 8) result.push([start, i - 1]);
      start = -1;
    }
  }
  return result;
}
function opaque(image, x, y) {
  return x >= 0 && y >= 0 && x < image.width && y < image.height && image.data[(y * image.width + x) * 4 + 3] > 160;
}
function normalPixels(data, width, height, tree = false, cell = 64) {
  const result = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    const localX = tree ? x : x % cell, localY = tree ? y : y % cell;
    const center = tree ? width / 2 : cell / 2;
    let nx = 0, ny = 0;
    if (data[i + 3] > 0) {
      const bark = tree && data[i] > data[i + 1] * 1.12;
      if (tree && !bark) {
        const tier = localY < 29 ? [18, 15] : localY < 45 ? [35, 21] : localY < 64 ? [52, 27] : [71, 29];
        nx = Math.max(-0.8, Math.min(0.8, (localX - center) / tier[1] * 0.7));
        ny = Math.max(-0.35, Math.min(0.65, (tier[0] - localY) / 14));
        // Leaf clusters retain a small local facet without converting albedo shading to height.
        nx += Math.sin(localX * 0.85) * 0.07;
      } else {
        const radius = tree ? 12 : localY < 33 ? 16 : 14;
        nx = Math.max(-0.75, Math.min(0.75, (localX - center) / radius * 0.65));
        ny = tree ? 0 : localY < 33 ? Math.max(-0.25, Math.min(0.6, (22 - localY) / 18)) : 0.1;
      }
      nx = Math.round(nx * 8) / 8; ny = Math.round(ny * 8) / 8;
    }
    const nz = Math.sqrt(Math.max(0.08, 1 - nx * nx - ny * ny));
    const length = Math.hypot(nx, ny, nz);
    result[i] = Math.round((nx / length * 0.5 + 0.5) * 255);
    result[i + 1] = Math.round((ny / length * 0.5 + 0.5) * 255);
    result[i + 2] = Math.round((nz / length * 0.5 + 0.5) * 255);
    result[i + 3] = 255;
  }
  return result;
}
async function savePair(name, data, width, height, tree = false) {
  const albedoPath = resolve(output, `${name}.png`);
  await sharp(data, {raw: {width, height, channels: 4}}).png({palette: true, colours: 32, dither: 0}).toFile(albedoPath);
  await sharp(normalPixels(data, width, height, tree), {raw: {width, height, channels: 4}}).png().toFile(resolve(output, `${name}-normal.png`));
}

const manifest = {version: 2, frameSize: 64, columns: 4, footPivot: [32, 54],
  directions: ['front', 'side', 'back'], animations: {walk: [0, 1, 2], attack: [3, 4, 5], hit: [6, 7, 8]}, sources: {}};

async function character(name, input, rowCount) {
  const image = await pixels(input);
  const rows = Array(image.height).fill(0);
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) if (opaque(image, x, y)) rows[y]++;
  const rowBands = bands(rows);
  if (rowBands.length !== rowCount) throw new Error(`${input}: expected ${rowCount} occupied rows, got ${rowBands.length}`);
  const columns = Array(image.width).fill(0);
  for (let y = rowBands[0][0]; y <= rowBands[0][1]; y++) for (let x = 0; x < image.width; x++) if (opaque(image, x, y)) columns[x]++;
  const columnBands = bands(columns, 3);
  if (columnBands.length !== 4) throw new Error(`${input}: expected 4 occupied columns, got ${columnBands.length}`);
  const centerX = columnBands.map(band => (band[0] + band[1]) / 2);
  const boundaries = [0, ...centerX.slice(1).map((x, i) => Math.round((x + centerX[i]) / 2)), image.width];
  const rowBounds = [0, ...rowBands.slice(1).map((band, i) => Math.round((rowBands[i][1] + band[0]) / 2)), image.height];
  const scale = 42 / (rowBands[0][1] - rowBands[0][0] + 1);
  const result = Buffer.alloc(256 * rowCount * 64 * 4);
  const registrations = [];
  for (let row = 0; row < rowCount; row++) for (let col = 0; col < 4; col++) {
    const left = boundaries[col], right = boundaries[col + 1], top = rowBounds[row], bottom = rowBounds[row + 1];
    const anchorX = centerX[col];
    let foot = rowBands[row][1];
    const halfFootWidth = (columnBands[col][1] - columnBands[col][0]) * 0.2;
    findFoot: for (let y = rowBands[row][1]; y >= rowBands[row][0]; y--) {
      for (let x = Math.round(anchorX - halfFootWidth); x <= anchorX + halfFootWidth; x++) {
        if (opaque(image, x, y)) {foot = y; break findFoot;}
      }
    }
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const sx = Math.round(anchorX + (x - 32) / scale), sy = Math.round(foot + (y - 54) / scale);
      if (sx < left || sx >= right || sy < top || sy >= bottom || !opaque(image, sx, sy)) continue;
      const from = (sy * image.width + sx) * 4, to = ((row * 64 + y) * 256 + col * 64 + x) * 4;
      result[to] = image.data[from]; result[to + 1] = image.data[from + 1]; result[to + 2] = image.data[from + 2]; result[to + 3] = 255;
    }
    registrations.push({row, col, anchorX, foot});
  }
  await savePair(name, result, 256, rowCount * 64);
  manifest.sources[name] = {input, width: image.width, height: image.height, rowBands, columnBands, scale, registrations};
}

const tree = await pixels('pine-source.png');
let minX = tree.width, minY = tree.height, maxX = 0, maxY = 0;
for (let y = 0; y < tree.height; y++) for (let x = 0; x < tree.width; x++) if (opaque(tree, x, y)) {
  minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
}
const treeScale = Math.min(60 / (maxX - minX + 1), 92 / (maxY - minY + 1));
const treePixels = Buffer.alloc(64 * 96 * 4);
for (let y = 0; y < 96; y++) for (let x = 0; x < 64; x++) {
  const sx = Math.round((minX + maxX) / 2 + (x - 32) / treeScale), sy = Math.round(maxY + (y - 94) / treeScale);
  if (!opaque(tree, sx, sy)) continue;
  const from = (sy * tree.width + sx) * 4, to = (y * 64 + x) * 4;
  treePixels[to] = tree.data[from]; treePixels[to + 1] = tree.data[from + 1]; treePixels[to + 2] = tree.data[from + 2]; treePixels[to + 3] = 255;
}
await savePair('pine', treePixels, 64, 96, true);
for (const [name, rows] of [['hooded', 9], ['human', 9], ['hooded-run', 3], ['human-run', 3]]) await character(name, `${name}-source.png`, rows);
await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Built pine + two characters (48 frames each), matching normal maps and registration manifest.');
