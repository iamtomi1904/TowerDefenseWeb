import * as THREE from 'three';
import {createSpriteNormalTexture} from './sprite-lighting';
import {detailedPropGrid, explorerGrid} from './pixel-art';
import {avatarFrames, redrawnPine, type AvatarId, type SpriteAction} from './sprite-assets';

export interface PixelSpriteFrame {map: THREE.Texture; normalMap: THREE.Texture}

type PixelGrid = string[];

const PALETTE: Record<string, string> = {
  '.': 'transparent',
  '#': '#151e17', // Crisp dark outline
  // Pine & Oak greens
  'h': '#254b38',
  'g': '#347b45', // Deep shadow green
  'G': '#55a34a', // Mid green
  'l': '#80c453', // Bright green
  'L': '#a9de64', // Top highlight green
  // Bark / wood
  'b': '#422819', // Dark bark
  'B': '#6b4228', // Mid bark
  'w': '#9e6b43', // Light wood / inner ring
  'W': '#c99c6b', // Pale wood highlight
  // Stone
  's': '#4e545e', // Dark stone
  'S': '#79828f', // Mid stone
  'c': '#a3acb8', // Light stone
  'C': '#cfd6e0', // Stone highlight
  // Mushroom
  'r': '#a82424', // Dark red
  'R': '#e03c3c', // Bright red
  'm': '#e8dec8', // Stem
  'M': '#ffffff', // White spots
  // Slime
  'u': '#1b6ca8', // Dark blue
  'U': '#2ca3e6', // Mid blue
  'a': '#6be0ff', // Highlight cyan
  // Explorer character
  'k': '#171920', // Cloak dark
  'K': '#2a2e3b', // Cloak mid
  'f': '#8c7d6b', // Face visor
  'F': '#b8a894', // Face highlight
  't': '#8db8a2', 'd': '#192e37', 'Y': '#f4bf60', 'O': '#bf7443',
  'v': '#9165aa', 'V': '#d4a3d9',
  'e': '#fff3d0'  // Eyes
};

function gridToTexture(grid: PixelGrid, palette = PALETTE): THREE.CanvasTexture {
  const h = grid.length;
  const w = Math.max(...grid.map(row => row.length));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  for (let y = 0; y < h; y++) {
    const row = grid[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      const color = palette[ch];
      if (!color || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Frames are drawn in texture space; the world quad stays anchored at its feet.
export function createExplorerFrames(colors: {cloak: string; skin: string; tunic: string; boots: string}, action: SpriteAction = 'walk', avatar: AvatarId = 'hooded'): PixelSpriteFrame[][] {
  const painted = avatarFrames(avatar, action);
  if (painted) return painted;
  const attacking = action === 'attack';
  const mix = (base: string, highlight: string, amount: number) => new THREE.Color(base).lerp(new THREE.Color(highlight), amount).getStyle();
  const palette = {...PALETTE,
    K: mix(colors.tunic, '#518582', 0.7), k: mix(colors.cloak, '#315d65', 0.65),
    f: mix(colors.skin, '#d5ac83', 0.5), F: '#f0d2a0', b: colors.boots
  };
  return (['front', 'side', 'back'] as const).map(direction =>
    [0, 1, 2, 3].map(frame => {
      const rows = explorerGrid(direction, frame, attacking);
      return {map: gridToTexture(rows, palette), normalMap: createSpriteNormalTexture(rows)};
    })
  );
}

const PINE_TREE_GRID: PixelGrid = [
  '..........##..........',
  '.........#LL#.........',
  '........#LllG#........',
  '........#lGGG#........',
  '.......#LlGGGg#.......',
  '......##lGGGGg##......',
  '.....#LLlGGGGgg#......',
  '.....#LlGGGGggg#......',
  '....#LllGGGGgg#.......',
  '....#lGGGGggg#........',
  '...##lGGGGgg###.......',
  '..#LLlGGGGgggG#.......',
  '..#LlGGGGggggg#.......',
  '.#LllGGGGggg#g#.......',
  '.#lGGGGggggg#.........',
  '.#gGGGggggg#..........',
  '..###g#Bbw#g#.........',
  '......#Bbw#...........',
  '......#bBw#...........',
  '......#bBw#...........',
  '.....#bBBbw#..........',
  '.....#######..........'
];

const OAK_TREE_GRID: PixelGrid = [
  '.......######.........',
  '.....##LLllGG##.......',
  '....#LLllGGGGgG#......',
  '...#LLllGGGGgggg#.....',
  '..#LllGGGGGGggGGG#....',
  '..#lGGGGGGGGgGGGGg#...',
  '.#LlGGGGGGGGGGGGgg#...',
  '.#lGGGGGGGGGGGGggg#...',
  '.#GGGGGGGGGGGGgggg#...',
  '.#gGGGGGGGGGGggggg#...',
  '..#gGGGGGGGGggggg#....',
  '..#ggGGGGGGggggg#.....',
  '...###gg#Bbw#gg##.....',
  '........#Bbw#.........',
  '........#bBw#.........',
  '........#bBw#.........',
  '.......#bBBbw#........',
  '.......#######........'
];

const STUMP_GRID: PixelGrid = [
  '....######....',
  '...#WWWWwB#...',
  '..#WwwWWwwB#..',
  '..#bBBBBBBb#..',
  '..#bBBwBBBb#..',
  '..#bBBwBBBb#..',
  '.#bbBBwBBBbb#.',
  '#bBBBBBBBBBBb#',
  '.############.'
];

const FALLEN_LOG_GRID: PixelGrid = [
  '......##############....',
  '....##BbwBBBBBBBBBBb#...',
  '...#Bb##wBBBBBBBBBBBb#..',
  '..#Bbw##WBBBBBBBBBBBBb#.',
  '..#Bbw##WBBBBBBBBBBBBb#.',
  '...#b###BBBBBBBBBBBBb#..',
  '....#################...'
];

const BOULDER_GRID: PixelGrid = [
  '.....######.......',
  '....#CCccSS#......',
  '...#CcccSSSS#.....',
  '..#CccSSSSssS#....',
  '.#ccSSSSsssssS##..',
  '.#SSSSssssss#ccS#.',
  '.#sssSSSSsss#SSs#.',
  '..###############.'
];

const MUSHROOM_GRID: PixelGrid = [
  '...######...',
  '..#RRMRRMR#.',
  '.#RMRRRRRRr#',
  '.#RRRRMRRRr#',
  '..###mm###..',
  '....#mm#....',
  '....#mm#....',
  '....####....'
];

const SLIME_GRID: PixelGrid = [
  '....######....',
  '..##aaUUUU##..',
  '.#aaUUUUUUUU#.',
  '.#aUUeUUeUUu#.',
  '#UUUUUUUUUUuu#',
  '#UUuuuuuuuuuu#',
  '.############.'
];

const EXPLORER_GRID: PixelGrid = [
  '....######....',
  '...#KKKKKK#...',
  '..#KKkkkkKK#..',
  '..#k#fFFf#k#..',
  '..#k#feef#k#..',
  '..#k######k#..',
  '..#KKKKKKKK#..',
  '.#kKKKKKKKKk#.',
  '.#k#KKKKKK#k#.',
  '..##kk##kk##..',
  '...#kk..kk#...',
  '...###..###...'
];

const textureCache = new Map<string, THREE.CanvasTexture>();
const normalCache = new Map<string, THREE.DataTexture>();

const detailedGridCache = new Map<string, PixelGrid>();
function spriteGrid(key: string): PixelGrid {
  let detail = detailedGridCache.get(key);
  if (!detail) {
    const painted = detailedPropGrid(key);
    if (painted) {detail = painted; detailedGridCache.set(key, painted);}
  }
  if (detail) return detail;
  const grids: Record<string, PixelGrid> = {
    pine_tree: PINE_TREE_GRID, oak_tree: OAK_TREE_GRID, stump: STUMP_GRID,
    fallen_log: FALLEN_LOG_GRID, boulder: BOULDER_GRID, mushroom: MUSHROOM_GRID,
    blue_slime: SLIME_GRID, explorer: EXPLORER_GRID
  };
  return grids[key] ?? BOULDER_GRID;
}

export function getPixelSpriteNormalTexture(key: string): THREE.Texture {
  const painted = redrawnPine();
  if (painted && (key === 'pine_tree' || key === 'oak_tree')) return painted.normalMap;
  let texture = normalCache.get(key);
  if (!texture) {
    texture = createSpriteNormalTexture(spriteGrid(key));
    normalCache.set(key, texture);
  }
  return texture;
}

export function getPixelSpriteTexture(key: string): THREE.Texture {
  const painted = redrawnPine();
  if (painted && (key === 'pine_tree' || key === 'oak_tree')) return painted.map;
  const existing = textureCache.get(key);
  if (existing) return existing;

  const grid = spriteGrid(key);
  const tex = gridToTexture(grid);
  textureCache.set(key, tex);
  return tex;
}
