import * as THREE from 'three';
import {createRng, Noise2D, smoothstep} from './noise';
import type {TerrainPreset} from './presets';

export interface StairCell {
  gx: number;
  gz: number;
  dir: 'px' | 'nx' | 'pz' | 'nz';
  baseY: number;
  topY: number;
}

/**
 * Infinite deterministic 3D stepped-terrain field (ISO-CORE style).
 * Supports chunk-based streaming at any (gx, gz) world grid coordinate.
 */
export class TerrainField {
  readonly preset: TerrainPreset;
  readonly seed: number;
  private noise: Noise2D;
  private levelCache = new Map<string, number>();
  private stairCache = new Map<string, StairCell | null>();

  constructor(preset: TerrainPreset, seed: number) {
    this.preset = preset;
    this.seed = seed;
    this.noise = new Noise2D(seed);
  }

  private rawHeight(x: number, z: number): number {
    const p = this.preset;
    const nx = x * p.noiseScale;
    const nz = z * p.noiseScale;

    const baseFbm = this.noise.fbm(nx, nz, p.octaves, 2.05, 0.5);
    const ridge = this.noise.ridge(nx * 0.85, nz * 0.85, 3);
    const blended = (baseFbm * 0.5 + 0.5) * (1 - p.ridgeWeight) + ridge * p.ridgeWeight;

    let h = (blended - 0.42) * p.maxHeight;

    // Flatten spawn plaza around (0, 0)
    const distCenter = Math.hypot(x, z);
    const flatBlend = 1 - smoothstep(p.spawnFlatRadius * 0.55, p.spawnFlatRadius * 1.2, distCenter);
    h = THREE.MathUtils.lerp(h, p.spawnHeight, flatBlend);

    // Winding sunken river channels
    if (p.hasRiver) {
      const riverCenterX = 20 + Math.sin(z * 0.08 + 0.5) * 6.5 + this.noise.sample(z * 0.04, 1.7) * 4.0;
      const distRiver = Math.abs(x - riverCenterX);
      if (distRiver < 3.6 && distCenter > p.spawnFlatRadius * 0.7) {
        return p.waterLevel - 0.65;
      }
    }

    return h;
  }

  worldToGrid(x: number, z: number): {gx: number; gz: number; fx: number; fz: number} {
    const ts = this.preset.tileSize;
    const gxFloat = x / ts;
    const gzFloat = z / ts;
    const gx = Math.floor(gxFloat);
    const gz = Math.floor(gzFloat);
    return {gx, gz, fx: gxFloat - gx, fz: gzFloat - gz};
  }

  levelAtGrid(gx: number, gz: number): number {
    const key = `${gx},${gz}`;
    const cached = this.levelCache.get(key);
    if (cached !== undefined) return cached;

    const ts = this.preset.tileSize;
    const wx = (gx + 0.5) * ts;
    const wz = (gz + 0.5) * ts;
    const lvl = Math.round(this.rawHeight(wx, wz) / this.preset.stepHeight);
    if (this.levelCache.size > 40000) this.levelCache.clear();
    this.levelCache.set(key, lvl);
    return lvl;
  }

  stairAtGrid(gx: number, gz: number): StairCell | null {
    // Null stair results are cached too; keep long exploration sessions bounded.
    if (this.stairCache.size >= 40000) this.stairCache.clear();
    const key = `${gx},${gz}`;
    if (this.stairCache.has(key)) return this.stairCache.get(key)!;

    const sh = this.preset.stepHeight;
    const lvl = this.levelAtGrid(gx, gz);
    if (lvl * sh < this.preset.waterLevel + 0.05) {
      this.stairCache.set(key, null);
      return null;
    }

    const wx = (gx + 0.5) * this.preset.tileSize;
    const wz = (gz + 0.5) * this.preset.tileSize;
    if (Math.hypot(wx, wz) < this.preset.spawnFlatRadius * 0.65) {
      this.stairCache.set(key, null);
      return null;
    }

    // Deterministic hash per cell
    const hash = Math.abs(Math.sin(gx * 12.9898 + gz * 78.233 + this.seed) * 43758.5453) % 1;
    if (hash > 0.18) {
      this.stairCache.set(key, null);
      return null;
    }

    const dirs: {dx: number; dz: number; dir: StairCell['dir']}[] = [
      {dx: 1, dz: 0, dir: 'px'},
      {dx: -1, dz: 0, dir: 'nx'},
      {dx: 0, dz: 1, dir: 'pz'},
      {dx: 0, dz: -1, dir: 'nz'}
    ];

    for (const d of dirs) {
      const upLvl = this.levelAtGrid(gx + d.dx, gz + d.dz);
      const backLvl = this.levelAtGrid(gx - d.dx, gz - d.dz);
      if (upLvl === lvl + 1 && backLvl === lvl) {
        const cell: StairCell = {
          gx,
          gz,
          dir: d.dir,
          baseY: lvl * sh,
          topY: upLvl * sh
        };
        if (this.stairCache.size > 40000) this.stairCache.clear();
        this.stairCache.set(key, cell);
        return cell;
      }
    }

    this.stairCache.set(key, null);
    return null;
  }

  heightAt(x: number, z: number): number {
    const {gx, gz, fx, fz} = this.worldToGrid(x, z);
    const stair = this.stairAtGrid(gx, gz);
    if (stair) {
      let t = 0;
      if (stair.dir === 'px') t = fx;
      else if (stair.dir === 'nx') t = 1 - fx;
      else if (stair.dir === 'pz') t = fz;
      else t = 1 - fz;
      return THREE.MathUtils.lerp(stair.baseY, stair.topY, THREE.MathUtils.clamp(t, 0, 1));
    }
    return this.levelAtGrid(gx, gz) * this.preset.stepHeight;
  }

  slopeAt(x: number, z: number): number {
    const {gx, gz} = this.worldToGrid(x, z);
    if (this.stairAtGrid(gx, gz)) return 0.25;
    const c = this.levelAtGrid(gx, gz);
    const maxDiff = Math.max(
      Math.abs(c - this.levelAtGrid(gx + 1, gz)),
      Math.abs(c - this.levelAtGrid(gx - 1, gz)),
      Math.abs(c - this.levelAtGrid(gx, gz + 1)),
      Math.abs(c - this.levelAtGrid(gx, gz - 1))
    );
    return maxDiff >= 1 ? 0.55 : 0.0;
  }

  biomeLabelAt(x: number, z: number): string {
    const h = this.heightAt(x, z);
    if (Math.hypot(x, z) < this.preset.spawnFlatRadius * 0.65) return 'Quảng Trường Pha Lê';
    if (h < this.preset.waterLevel - 0.1) return 'Sông Xanh';
    if (h > this.preset.maxHeight * 0.52) return 'Đồi Cao';
    return 'Thảo Nguyên Vô Tận';
  }
}

/** Sixteen coordinated grass tiles; atlas selection is hashed in world coordinates. */
export function createIsoGrassTopTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  for (let tile = 0; tile < 16; tile++) {
    const ox = (tile % 4) * 32, oy = Math.floor(tile / 4) * 32;
    const rng = createRng(1481 + tile * 719);
    g.fillStyle = '#ffffff'; g.fillRect(ox, oy, 32, 32);
    g.strokeStyle = 'rgba(20,40,25,0.19)'; g.lineWidth = 1;
    g.strokeRect(ox + 0.5, oy + 0.5, 31, 31);
    g.fillStyle = 'rgba(34,62,30,0.07)';
    for (let i = 0; i < 5; i++) g.fillRect(ox + 3 + Math.floor(rng() * 23), oy + 3 + Math.floor(rng() * 23), 3, 2);
    const tufts = tile % 5;
    for (let i = 0; i < tufts; i++) {
      const x = ox + 5 + Math.floor(rng() * 22), y = oy + 8 + Math.floor(rng() * 18);
      g.fillStyle = 'rgba(31,70,28,0.34)';
      g.fillRect(x, y - 3, 1, 4); g.fillRect(x - 2, y - 2, 1, 2); g.fillRect(x + 2, y - 2, 1, 2);
      g.fillStyle = 'rgba(241,255,179,0.48)'; g.fillRect(x + 1, y - 4, 1, 3);
    }
    if (tile === 3 || tile === 11) {
      g.fillStyle = '#e9e4a5'; g.fillRect(ox + 12, oy + 13, 2, 2);
      g.fillStyle = '#a7c781'; g.fillRect(ox + 12, oy + 15, 1, 2);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createStoneTopTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d')!;
  g.fillStyle = '#e5e6df'; g.fillRect(0, 0, 32, 32);
  for (const [x, y, w, h] of [[1, 1, 14, 14], [17, 1, 14, 14], [1, 17, 14, 14], [17, 17, 14, 14]]) {
    g.fillStyle = '#faf9ef'; g.fillRect(x, y, w, h);
    g.fillStyle = '#d3d5cc'; g.fillRect(x, y + h - 2, w, 2); g.fillRect(x + w - 1, y, 1, h);
    g.fillStyle = '#ffffff'; g.fillRect(x + 1, y + 1, w - 3, 1);
  }
  g.fillStyle = '#c5cdbb'; g.fillRect(2, 14, 3, 1); g.fillRect(25, 30, 4, 1);
  g.fillStyle = '#b8beb3'; g.fillRect(10, 8, 2, 1); g.fillRect(22, 23, 3, 1);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createIsoCliffTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = '#dedede';
  g.fillRect(0, 0, 16, 16);

  g.fillStyle = 'rgba(0, 0, 0, 0.28)';
  g.fillRect(0, 0, 16, 3);
  g.fillStyle = 'rgba(0, 0, 0, 0.14)';
  g.fillRect(2, 6, 5, 2);
  g.fillRect(9, 10, 5, 2);
  g.fillStyle = 'rgba(225, 252, 255, 0.78)';
  g.fillRect(0, 14, 16, 2);

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWaterTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 32, 32);

  g.fillStyle = 'rgba(180, 245, 255, 0.55)';
  g.fillRect(4, 6, 8, 2);
  g.fillRect(18, 14, 9, 2);
  g.fillRect(8, 24, 7, 2);
  g.fillStyle = 'rgba(0, 80, 130, 0.18)';
  g.fillRect(14, 4, 5, 2);
  g.fillRect(2, 18, 6, 2);

  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(34, 34);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Builds a single 16x16 stepped-terrain chunk at chunk coordinates (cx, cz). */
export function buildChunkTerrainMesh(
  field: TerrainField,
  cx: number,
  cz: number,
  chunkCols: number,
  topMat: THREE.Material,
  sideMat: THREE.Material,
  stairMat: THREE.Material
): THREE.Group {
  const p = field.preset;
  const ts = p.tileSize;
  const sh = p.stepHeight;
  const group = new THREE.Group();

  const cDeep = new THREE.Color(p.palette.deepWater);
  const cSand = new THREE.Color(p.palette.shallowSand);
  const cGrassLow = new THREE.Color(p.palette.grassLow);
  const cGrassHigh = new THREE.Color(p.palette.grassHigh);
  const cCliff = new THREE.Color(p.palette.cliffRock);
  const cPeak = new THREE.Color(p.palette.peakSnow);
  const stoneTileA = new THREE.Color('#c9c2ae');
  const stoneTileB = new THREE.Color('#bdbba7');

  const plazaPos: number[] = [], plazaNorm: number[] = [], plazaUv: number[] = [], plazaCol: number[] = [], plazaIdx: number[] = [];
  const topPos: number[] = [];
  const topNorm: number[] = [];
  const topUv: number[] = [];
  const topCol: number[] = [];
  const topIdx: number[] = [];

  const sidePos: number[] = [];
  const sideNorm: number[] = [];
  const sideUv: number[] = [];
  const sideCol: number[] = [];
  const sideIdx: number[] = [];

  const pushQuad = (
    posArr: number[],
    normArr: number[],
    uvArr: number[],
    colArr: number[],
    idxArr: number[],
    v0: [number, number, number],
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    n: [number, number, number],
    color: THREE.Color,
    uRepeat = 1,
    vRepeat = 1
  ) => {
    const base = posArr.length / 3;
    posArr.push(...v0, ...v1, ...v2, ...v3);
    for (let k = 0; k < 4; k++) {
      normArr.push(...n);
      colArr.push(color.r, color.g, color.b);
    }
    uvArr.push(0, 0, uRepeat, 0, uRepeat, vRepeat, 0, vRepeat);
    idxArr.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  const tmp = new THREE.Color();
  const sideBaseCol = new THREE.Color(cCliff);
  const stairsInChunk: StairCell[] = [];

  const startGx = cx * chunkCols;
  const startGz = cz * chunkCols;

  for (let lz = 0; lz < chunkCols; lz++) {
    for (let lx = 0; lx < chunkCols; lx++) {
      const gx = startGx + lx;
      const gz = startGz + lz;
      const lvl = field.levelAtGrid(gx, gz);
      const yTop = lvl * sh;
      const x0 = gx * ts;
      const x1 = x0 + ts;
      const z0 = gz * ts;
      const z1 = z0 + ts;
      const wx = x0 + ts * 0.5;
      const wz = z0 + ts * 0.5;

      const stair = field.stairAtGrid(gx, gz);
      if (stair) stairsInChunk.push(stair);

      const isCrossPlaza =
        (Math.abs(wx) <= 3.2 && Math.abs(wz) <= 3.2) ||
        (Math.abs(wx) <= 1.5 && Math.abs(wz) <= 9.5) ||
        (Math.abs(wz) <= 1.5 && Math.abs(wx) <= 9.5);

      const paved = isCrossPlaza && Math.abs(yTop - p.spawnHeight) < 0.2;
      if (yTop < p.waterLevel - 0.1) {
        tmp.copy(cDeep);
      } else if (paved) {
        tmp.copy((gx + gz) % 2 === 0 ? stoneTileA : stoneTileB);
      } else if (yTop > p.maxHeight * 0.58) {
        tmp.copy(cPeak);
      } else {
        const elevT = smoothstep(p.waterLevel, p.maxHeight * 0.55, yTop);
        tmp.copy(cGrassLow).lerp(cGrassHigh, elevT);
        const variation = ((Math.imul(gx, 73856093) ^ Math.imul(gz, 19349663) ^ field.seed) >>> 0) % 101 / 100;
        tmp.offsetHSL((variation - 0.5) * 0.012, 0, (variation - 0.5) * 0.045);
      }

      pushQuad(
        paved ? plazaPos : topPos, paved ? plazaNorm : topNorm, paved ? plazaUv : topUv,
        paved ? plazaCol : topCol, paved ? plazaIdx : topIdx,
        [x0, yTop, z1], [x1, yTop, z1], [x1, yTop, z0], [x0, yTop, z0],
        [0, 1, 0], tmp, paved ? 1 : 0.25, paved ? 1 : 0.25
      );
      if (!paved) {
        const tileHash = (Math.imul(gx, 374761393) ^ Math.imul(gz, 668265263) ^ field.seed) >>> 0;
        const u = (tileHash % 4) / 4, v = ((tileHash >>> 3) % 4) / 4;
        for (let i = topUv.length - 8; i < topUv.length; i += 2) {topUv[i] += u; topUv[i + 1] += v;}
      }

      const nRight = field.levelAtGrid(gx + 1, gz);
      if (nRight < lvl) {
        const yBot = nRight * sh;
        pushQuad(
          sidePos, sideNorm, sideUv, sideCol, sideIdx,
          [x1, yBot, z1], [x1, yBot, z0], [x1, yTop, z0], [x1, yTop, z1],
          [1, 0, 0], yBot < p.waterLevel ? cSand : sideBaseCol, 1, Math.max(1, lvl - nRight)
        );
      }

      const nLeft = field.levelAtGrid(gx - 1, gz);
      if (nLeft < lvl) {
        const yBot = nLeft * sh;
        pushQuad(
          sidePos, sideNorm, sideUv, sideCol, sideIdx,
          [x0, yBot, z0], [x0, yBot, z1], [x0, yTop, z1], [x0, yTop, z0],
          [-1, 0, 0], yBot < p.waterLevel ? cSand : sideBaseCol, 1, Math.max(1, lvl - nLeft)
        );
      }

      const nFront = field.levelAtGrid(gx, gz + 1);
      if (nFront < lvl) {
        const yBot = nFront * sh;
        pushQuad(
          sidePos, sideNorm, sideUv, sideCol, sideIdx,
          [x0, yBot, z1], [x1, yBot, z1], [x1, yTop, z1], [x0, yTop, z1],
          [0, 0, 1], yBot < p.waterLevel ? cSand : sideBaseCol, 1, Math.max(1, lvl - nFront)
        );
      }

      const nBack = field.levelAtGrid(gx, gz - 1);
      if (nBack < lvl) {
        const yBot = nBack * sh;
        pushQuad(
          sidePos, sideNorm, sideUv, sideCol, sideIdx,
          [x1, yBot, z0], [x0, yBot, z0], [x0, yTop, z0], [x1, yTop, z0],
          [0, 0, -1], yBot < p.waterLevel ? cSand : sideBaseCol, 1, Math.max(1, lvl - nBack)
        );
      }
    }
  }

  const topGeo = new THREE.BufferGeometry();
  topGeo.setAttribute('position', new THREE.Float32BufferAttribute(topPos, 3));
  topGeo.setAttribute('normal', new THREE.Float32BufferAttribute(topNorm, 3));
  topGeo.setAttribute('uv', new THREE.Float32BufferAttribute(topUv, 2));
  topGeo.setAttribute('color', new THREE.Float32BufferAttribute(topCol, 3));
  topGeo.setIndex(topIdx);
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.receiveShadow = true;
  topMesh.castShadow = true;
  group.add(topMesh);

  if (plazaPos.length) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(plazaPos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(plazaNorm, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(plazaUv, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(plazaCol, 3));
    geometry.setIndex(plazaIdx);
    const mesh = new THREE.Mesh(geometry, stairMat);
    mesh.receiveShadow = true; mesh.castShadow = true;
    group.add(mesh);
  }

  if (sidePos.length > 0) {
    const sideGeo = new THREE.BufferGeometry();
    sideGeo.setAttribute('position', new THREE.Float32BufferAttribute(sidePos, 3));
    sideGeo.setAttribute('normal', new THREE.Float32BufferAttribute(sideNorm, 3));
    sideGeo.setAttribute('uv', new THREE.Float32BufferAttribute(sideUv, 2));
    sideGeo.setAttribute('color', new THREE.Float32BufferAttribute(sideCol, 3));
    sideGeo.setIndex(sideIdx);
    const sideMesh = new THREE.Mesh(sideGeo, sideMat);
    sideMesh.receiveShadow = true;
    sideMesh.castShadow = true;
    group.add(sideMesh);
  }

  if (stairsInChunk.length > 0) {
    const stepCount = 4;
    const stepGeo = new THREE.BoxGeometry(ts * 0.92, sh / stepCount, ts / stepCount);
    stepGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(stepGeo.attributes.position.count * 3).fill(1), 3));
    const stairInst = new THREE.InstancedMesh(stepGeo, stairMat, stairsInChunk.length * stepCount);
    stairInst.castShadow = true;
    stairInst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let idx = 0;
    for (const st of stairsInChunk) {
      const stX = (st.gx + 0.5) * ts;
      const stZ = (st.gz + 0.5) * ts;
      for (let i = 0; i < stepCount; i++) {
        const frac = (i + 0.5) / stepCount - 0.5;
        const sy = st.baseY + ((i + 0.5) / stepCount) * sh;
        let sx = stX;
        let sz = stZ;
        let rotY = 0;
        if (st.dir === 'px') { sx += frac * ts; rotY = Math.PI / 2; }
        else if (st.dir === 'nx') { sx -= frac * ts; rotY = Math.PI / 2; }
        else if (st.dir === 'pz') { sz += frac * ts; rotY = 0; }
        else { sz -= frac * ts; rotY = 0; }
        dummy.position.set(sx, sy, sz);
        dummy.rotation.set(0, rotY, 0);
        dummy.updateMatrix();
        stairInst.setMatrixAt(idx++, dummy.matrix);
      }
    }
    stairInst.instanceMatrix.needsUpdate = true;
    group.add(stairInst);
  }

  return group;
}

export interface MonumentObjects {
  group: THREE.Group;
  crystalMesh: THREE.Mesh;
  crystalCapMesh: THREE.Mesh;
  crystalLight: THREE.PointLight;
  crystalGlow: THREE.Sprite;
}

export function buildCenterMonument(field: TerrainField): MonumentObjects {
  const plazaY = field.heightAt(0, 0);
  const group = new THREE.Group();
  group.position.set(0, plazaY, 0);

  const pedMat = new THREE.MeshStandardMaterial({color: '#d9cfc7', roughness: 0.82, flatShading: true});
  const pedDarkMat = new THREE.MeshStandardMaterial({color: '#9e928a', roughness: 0.86, flatShading: true});

  const pedStep1 = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.35, 2.3), pedDarkMat);
  pedStep1.position.y = 0.175;
  pedStep1.castShadow = true;
  pedStep1.receiveShadow = true;
  group.add(pedStep1);

  const pedStep2 = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.38, 1.55), pedMat);
  pedStep2.position.y = 0.54;
  pedStep2.castShadow = true;
  pedStep2.receiveShadow = true;
  group.add(pedStep2);

  const crystalGeo = new THREE.OctahedronGeometry(0.55, 0);
  const crystalMesh = new THREE.Mesh(
    crystalGeo,
    new THREE.MeshStandardMaterial({
      color: '#ff9d2e',
      emissive: '#ff7b00',
      emissiveIntensity: 0.85,
      roughness: 0.2,
      flatShading: true
    })
  );
  crystalMesh.scale.set(0.75, 1.45, 0.75);
  crystalMesh.position.y = 1.65;
  crystalMesh.castShadow = true;
  const crystalOutline = new THREE.Mesh(
    crystalGeo,
    new THREE.MeshBasicMaterial({color: '#291506', side: THREE.BackSide})
  );
  crystalOutline.scale.setScalar(1.1);
  crystalMesh.add(crystalOutline);
  group.add(crystalMesh);

  const capGeo = new THREE.DodecahedronGeometry(0.8, 0);
  capGeo.scale(1.05, 0.52, 1.05);
  const crystalCapMesh = new THREE.Mesh(capGeo, pedMat);
  crystalCapMesh.position.y = 3.2;
  crystalCapMesh.castShadow = true;
  const capOutline = new THREE.Mesh(
    capGeo,
    new THREE.MeshBasicMaterial({color: '#22242a', side: THREE.BackSide})
  );
  capOutline.scale.setScalar(1.06);
  crystalCapMesh.add(capOutline);
  group.add(crystalCapMesh);

  const crystalLight = new THREE.PointLight('#ff9e36', 4.2, 14, 1.5);
  crystalLight.position.set(0, 1.75, 0);
  group.add(crystalLight);

  const haloCanvas = document.createElement('canvas'); haloCanvas.width = haloCanvas.height = 32;
  const haloContext = haloCanvas.getContext('2d')!;
  const haloGradient = haloContext.createRadialGradient(16, 16, 1, 16, 16, 16);
  haloGradient.addColorStop(0, 'rgba(255,230,150,0.8)');
  haloGradient.addColorStop(0.28, 'rgba(255,160,45,0.3)');
  haloGradient.addColorStop(1, 'rgba(255,110,20,0)');
  haloContext.fillStyle = haloGradient; haloContext.fillRect(0, 0, 32, 32);
  const haloTexture = new THREE.CanvasTexture(haloCanvas);
  const crystalGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTexture, blending: THREE.AdditiveBlending, transparent: true,
    opacity: 0.55, depthWrite: false, toneMapped: false
  }));
  crystalGlow.position.set(0, 1.65, 0); crystalGlow.scale.set(4, 4, 1);
  group.add(crystalGlow);
  return {group, crystalMesh, crystalCapMesh, crystalLight, crystalGlow};
}
