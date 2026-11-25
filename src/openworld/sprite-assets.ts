import * as THREE from 'three';

export type AvatarId = 'hooded' | 'human';
export type SpriteAction = 'walk' | 'run' | 'attack' | 'hit';
export interface SpriteFrame {map: THREE.Texture; normalMap: THREE.Texture}
const packs = new Map<string, SpriteFrame[][]>();
let pine: SpriteFrame | null = null;
const base = '/openworld-art/v2/';

async function texture(name: string, normal = false): Promise<THREE.Texture> {
  const map = await new THREE.TextureLoader().loadAsync(base + name + '.png');
  map.colorSpace = normal ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  map.magFilter = map.minFilter = THREE.NearestFilter;
  map.generateMipmaps = false;
  return map;
}
function frame(texture: THREE.Texture, col: number, row: number, normal = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(texture.image as CanvasImageSource, col * 64, row * 64, 64, 64, 0, 0, 64, 64);
  const result = new THREE.CanvasTexture(canvas);
  result.colorSpace = normal ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  result.magFilter = result.minFilter = THREE.NearestFilter;
  result.generateMipmaps = false;
  return result;
}
async function avatar(id: AvatarId): Promise<void> {
  const [map, normal, run, runNormal] = await Promise.all([
    texture(id), texture(id + '-normal', true), texture(id + '-run'), texture(id + '-run-normal', true)
  ]);
  for (const [action, firstRow] of [['walk', 0], ['attack', 3], ['hit', 6]] as const) {
    packs.set(`${id}:${action}`, [0, 1, 2].map(direction => [0, 1, 2, 3].map(col => ({
      map: frame(map, col, firstRow + direction), normalMap: frame(normal, col, firstRow + direction, true)
    }))));
  }
  packs.set(`${id}:run`, [0, 1, 2].map(direction => [0, 1, 2, 3].map(col => ({
    map: frame(run, col, direction), normalMap: frame(runNormal, col, direction, true)
  }))));
  // Atlas GPU textures are not rendered. Frame canvases retain their own pixel data.
  map.dispose(); normal.dispose(); run.dispose(); runNormal.dispose();
}
export async function loadSpriteAssets(): Promise<void> {
  const [map, normalMap] = await Promise.all([texture('pine'), texture('pine-normal', true), avatar('hooded'), avatar('human')]);
  pine = {map, normalMap};
}
export function redrawnPine(): SpriteFrame | null {return pine;}
export function avatarFrames(id: AvatarId, action: SpriteAction): SpriteFrame[][] | null {
  const frames = packs.get(`${id}:${action}`);
  if (!frames) return null;
  // Per-player texture objects can be disposed when switching avatars without destroying the library.
  return frames.map(direction => direction.map(source => {
    const map = source.map.clone(), normalMap = source.normalMap.clone();
    map.needsUpdate = normalMap.needsUpdate = true;
    return {map, normalMap};
  }));
}
