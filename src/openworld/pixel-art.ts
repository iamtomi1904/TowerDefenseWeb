/** Hand-authored pixel shapes. Palette symbols also drive the matching normal maps. */
class PixelArt {
  readonly pixels: string[][];
  constructor(readonly width: number, readonly height: number) {
    this.pixels = Array.from({length: height}, () => Array(width).fill('.'));
  }
  dot(x: number, y: number, color: string): void {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) this.pixels[y][x] = color;
  }
  rect(x: number, y: number, w: number, h: number, color: string): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.dot(i, j, color);
  }
  polygon(points: [number, number][], color: string): void {
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i], b = points[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
      }
      if (inside) this.dot(x, y, color);
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.dot(x, y, color);
    }
  }
  outline(): void {
    const rows = this.pixels.map(row => [...row]);
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      if (rows[y][x] === '.') continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (rows[y + dy]?.[x + dx] === '.') this.dot(x + dx, y + dy, '#');
      }
    }
  }
  rows(): string[] {return this.pixels.map(row => row.join(''));}
}

function foliageTier(art: PixelArt, cx: number, cy: number, rx: number, ry: number, tier: number): void {
  const mask = new Set<string>();
  for (let y = Math.floor(cy - ry); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
    const nx = (x - cx) / rx;
    const ny = (y - cy) / ry;
    let inside = nx * nx + ny * ny < 1 && ny < 0.42;
    for (let lobe = -2; lobe <= 2; lobe++) {
      const lx = cx + lobe * rx * 0.34, ly = cy + ry * (0.35 - Math.abs(lobe) * 0.06);
      if (((x - lx) / (rx * 0.28)) ** 2 + ((y - ly) / (ry * 0.62)) ** 2 < 1) inside = true;
    }
    if (inside) mask.add(`${x},${y}`);
  }
  for (const key of mask) {
    const [x, y] = key.split(',').map(Number);
    const edge = !mask.has(`${x},${y + 1}`) || !mask.has(`${x - 1},${y}`) || !mask.has(`${x + 1},${y}`);
    const value = (cx - x) / rx * 0.28 + (cy - y) / ry * 0.42 + tier * 0.14;
    const color = edge && y > cy ? 'h' : value > 0.62 ? 'L' : value > 0.2 ? 'l' : value > -0.2 ? 'G' : 'g';
    art.dot(x, y, color);
  }
  // Small leaf clusters, kept as shapes rather than single-pixel noise.
  for (const [dx, dy] of [[-0.4, -0.35], [0.22, -0.15], [-0.12, 0.25]]) {
    const x = Math.round(cx + rx * dx), y = Math.round(cy + ry * dy);
    if (mask.has(`${x},${y}`)) {art.dot(x, y, tier >= 2 ? 'L' : 'l'); art.dot(x + 1, y, 'l');}
  }
}

function tree(oak: boolean): string[] {
  const art = new PixelArt(oak ? 40 : 34, 48);
  const cx = oak ? 20 : 17;
  art.polygon([[cx - 2, 29], [cx + 3, 29], [cx + 3, 40], [cx + 7, 44], [cx + 4, 45], [cx, 42], [cx - 5, 45], [cx - 7, 43], [cx - 2, 39]], 'b');
  art.rect(cx - 1, 31, 3, 12, 'B'); art.rect(cx, 32, 1, 9, 'w');
  art.polygon([[cx, 36], [cx - 7, 31], [cx - 6, 28], [cx + 1, 33]], 'B');
  art.polygon([[cx + 1, 38], [cx + 7, 33], [cx + 8, 30], [cx + 3, 34]], 'b');
  if (oak) {
    foliageTier(art, 20, 29, 16, 8, 0);
    foliageTier(art, 20, 22, 13, 8, 1);
    foliageTier(art, 20, 15, 10, 7, 2);
    foliageTier(art, 20, 8, 6, 5, 3);
  } else {
    foliageTier(art, 17, 29, 14, 8, 0);
    foliageTier(art, 17, 22, 12, 8, 1);
    foliageTier(art, 17, 15, 9, 7, 2);
    foliageTier(art, 17, 8, 5, 5, 3);
  }
  for (const dx of [-7, 5]) {
    art.polygon([[cx + dx, 45], [cx + dx - 2, 41], [cx + dx, 42], [cx + dx + 2, 40], [cx + dx + 3, 44]], 'G');
    art.dot(cx + dx + 1, 42, 'l');
  }
  art.outline();
  return art.rows();
}

function stone(): string[] {
  const art = new PixelArt(30, 23);
  art.polygon([[3, 13], [8, 4], [18, 2], [26, 8], [28, 18], [21, 21], [7, 20]], 'S');
  art.polygon([[8, 4], [18, 2], [22, 8], [16, 13], [4, 13]], 'C');
  art.polygon([[4, 13], [16, 13], [20, 20], [7, 20]], 'c');
  art.polygon([[22, 8], [26, 8], [28, 18], [21, 21], [16, 13]], 's');
  art.polygon([[10, 5], [17, 4], [18, 6], [10, 8]], 'C');
  art.rect(8, 17, 3, 1, 'S'); art.rect(24, 16, 2, 1, 'S');
  art.polygon([[4, 18], [7, 17], [9, 19], [13, 19], [12, 21], [6, 20]], 'g');
  art.dot(7, 18, 'l'); art.outline();
  return art.rows();
}

function bush(flowers: boolean): string[] {
  const art = new PixelArt(26, 20);
  foliageTier(art, 13, 12, 11, 5, 0);
  foliageTier(art, 9, 8, 6, 5, 1);
  foliageTier(art, 16, 7, 6, 5, 2);
  if (flowers) {
    for (const [x, y] of [[7, 7], [17, 9], [12, 4]]) {
      art.rect(x - 1, y, 3, 1, 'v'); art.rect(x, y - 1, 1, 3, 'V'); art.dot(x, y, 'Y');
    }
  }
  art.outline(); return art.rows();
}

function mushroom(): string[] {
  const art = new PixelArt(20, 22);
  art.rect(9, 10, 4, 9, 'm'); art.rect(12, 11, 2, 8, 'w');
  art.ellipse(10, 9, 8, 6, 'r'); art.ellipse(9, 7, 6, 4, 'R');
  art.rect(5, 7, 3, 2, 'M'); art.rect(12, 5, 2, 2, 'M'); art.rect(12, 10, 3, 2, 'm');
  art.ellipse(10, 14, 6, 1, 'b'); art.rect(9, 15, 3, 4, 'm');
  art.outline(); return art.rows();
}

function slime(): string[] {
  const art = new PixelArt(26, 21);
  art.ellipse(13, 13, 11, 6, 'u'); art.ellipse(12, 10, 10, 7, 'U');
  art.ellipse(9, 7, 4, 2, 'a'); art.rect(6, 7, 2, 2, 'e');
  art.rect(9, 11, 2, 3, '#'); art.rect(17, 11, 2, 3, '#');
  art.dot(9, 11, 'M'); art.dot(17, 11, 'M'); art.rect(12, 15, 3, 1, 'u');
  art.outline(); return art.rows();
}

export function detailedPropGrid(key: string): string[] | null {
  if (key === 'pine_tree') return tree(false);
  if (key === 'oak_tree') return tree(true);
  if (key === 'boulder') return stone();
  if (key === 'bush' || key === 'flower_patch') return bush(key === 'flower_patch');
  if (key === 'mushroom') return mushroom();
  if (key === 'blue_slime') return slime();
  return null;
}

export function explorerGrid(direction: 'front' | 'side' | 'back', frame: number, attacking = false): string[] {
  const art = new PixelArt(24, 34);
  const step = frame === 1 ? -1 : frame === 3 ? 1 : 0;
  art.rect(7 + step, 26, 4, 6, 'b'); art.rect(14 - step, 26, 4, 6, 'b');
  art.rect(7 + step, 30, 5, 2, 'B'); art.rect(14 - step, 30, 5, 2, 'B');
  art.polygon([[7, 15], [17, 15], [20, 26], [17, 29], [6, 28], [4, 25]], 'k');
  art.polygon([[7, 15], [12, 17], [12, 26], [7, 27], [5, 24]], 'K');
  art.rect(7, 16, 2, 8, 't'); art.rect(15, 17, 2, 9, 'd');
  art.polygon([[6, 16], [3, 20 + step], [3, 25 + step], [6, 25 + step], [8, 18]], 'K');
  art.polygon([[17, 16], [20, 19 - step], [21, 24 - step], [18, 25 - step], [16, 18]], 'k');
  art.rect(3, 24 + step, 3, 2, 'f'); art.rect(18, 24 - step, 3, 2, 'f');
  art.polygon([[5, 9], [8, 3], [14, 2], [18, 6], [19, 13], [16, 17], [7, 16]], 'k');
  art.polygon([[5, 9], [8, 3], [14, 2], [16, 4], [9, 6], [7, 12]], 'K');
  art.rect(8, 4, 6, 1, 't');
  if (direction !== 'back') {
    const x = direction === 'side' ? 13 : 8;
    art.rect(x, 9, direction === 'side' ? 5 : 8, 6, 'd');
    art.rect(x + 1, 10, direction === 'side' ? 4 : 6, 4, 'f');
    art.rect(x + 1, 10, direction === 'side' ? 3 : 5, 1, 'F');
    art.dot(x + 2, 12, 'e'); if (direction === 'front') art.dot(x + 5, 12, 'e');
    art.rect(8, 16, 9, 2, 'Y'); art.rect(7, 18, 3, 5, 'O');
    art.rect(8, 24, 8, 2, 'b'); art.rect(11, 24, 2, 2, 'Y');
  } else {
    art.polygon([[9, 9], [16, 8], [16, 14], [12, 16], [9, 13]], 'K');
    art.rect(9, 19, 7, 7, 'B'); art.rect(10, 20, 5, 4, 'w'); art.rect(12, 18, 2, 9, 'b');
  }
  if (attacking) {
    const [tx, ty] = [[7, 5], [19, 11], [20, 21], [18, 23]][frame];
    art.polygon([[16, 20], [tx, ty + 4], [tx + 1, ty + 4], [18, 21]], 'w');
    art.polygon([[tx - 3, ty], [tx + 2, ty - 1], [tx + 3, ty + 3], [tx - 1, ty + 4]], 'S');
    art.rect(tx - 2, ty, 3, 2, 'C'); art.dot(tx + 2, ty + 2, 'c');
    art.rect(17, 18, 3, 3, 'f');
  }
  art.outline(); return art.rows();
}
