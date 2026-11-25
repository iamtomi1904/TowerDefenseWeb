import * as THREE from 'three';
import {getPixelSpriteTexture, getPixelSpriteNormalTexture} from './pixel-sprites';
import {createLitSpriteMaterial, createSpriteShadowMaterial} from './sprite-lighting';
import {createRng} from './noise';
import type {PropKind, PropRule} from './presets';
import type {TerrainField} from './terrain';

export interface Collider {
  x: number;
  z: number;
  radius: number;
}

interface PropPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  outline?: boolean;
  isOutline?: boolean;
  billboard?: boolean;
  groundShadow?: boolean;
}

interface PropTemplate {
  parts: PropPart[];
}

let sharedToonGradient: THREE.DataTexture | null = null;
function getToonGradient(): THREE.DataTexture {
  if (sharedToonGradient) return sharedToonGradient;
  // Crisp 3-tone cel-shading ramp for stylized 3D look
  const data = new Uint8Array([
    92, 92, 92, 255,
    178, 178, 178, 255,
    255, 255, 255, 255
  ]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  sharedToonGradient = tex;
  return tex;
}

const outlineMat = new THREE.MeshBasicMaterial({
  color: '#172219',
  side: THREE.BackSide
});
outlineMat.userData.shared = true;

function toonMat(color: string, opts: {emissive?: string; emissiveIntensity?: number} = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonGradient(),
    ...opts
  });
}

function makeOutlineGeo(geo: THREE.BufferGeometry, thickness = 0.055): THREE.BufferGeometry {
  const clone = geo.clone();
  const pos = clone.attributes.position as THREE.BufferAttribute;
  const norm = clone.attributes.normal as THREE.BufferAttribute;
  if (norm) {
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        pos.getX(i) + norm.getX(i) * thickness,
        pos.getY(i) + norm.getY(i) * thickness,
        pos.getZ(i) + norm.getZ(i) * thickness
      );
    }
  }
  return clone;
}

function mergeNonIndexed(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const list = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let totalVerts = 0;
  for (const g of list) totalVerts += g.attributes.position.count;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  let offset = 0;

  for (const g of list) {
    const pos = g.attributes.position as THREE.BufferAttribute;
    const norm = g.attributes.normal as THREE.BufferAttribute;
    positions.set(pos.array as Float32Array, offset * 3);
    if (norm) normals.set(norm.array as Float32Array, offset * 3);
    offset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return merged;
}

function withOutlines(parts: PropPart[], thickness = 0.055): PropTemplate {
  const out: PropPart[] = [...parts];
  for (const p of parts) {
    if (p.outline === false) continue;
    out.push({
      geometry: makeOutlineGeo(p.geometry, thickness),
      material: outlineMat,
      outline: false,
      isOutline: true
    });
  }
  return {parts: out};
}

function createHedgeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const g = c.getContext('2d')!;
  g.fillStyle = '#57b83f';
  g.fillRect(0, 0, 16, 16);
  g.fillStyle = '#7be053';
  for (let i = 0; i < 20; i++) g.fillRect((i * 5) % 15, (i * 3) % 15, 2, 2);
  g.fillStyle = '#2f6e27';
  for (let i = 0; i < 16; i++) g.fillRect((i * 7 + 1) % 15, (i * 5 + 2) % 15, 2, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildPropTemplate(kind: PropKind, rule: PropRule): PropTemplate {
  const spriteSizes: Partial<Record<PropKind, [number, number]>> = {
    pine_tree: [2.7, 3.9], oak_tree: [3.1, 3.9], boulder: [1.9, 1.4],
    stump: [1.5, 1.0], fallen_log: [2.8, 0.9], mushroom: [0.9, 0.8], blue_slime: [1.3, 0.85],
    bush: [1.8, 1.4], flower_patch: [1.1, 0.85], hedge_block: [2.2, 1.7]
  };
  const size = spriteSizes[kind];
  if (size) {
    const textureKey = kind === 'hedge_block' ? 'bush' : kind;
    const geometry = new THREE.PlaneGeometry(size[0], size[1]);
    geometry.translate(0, size[1] / 2, 0);
    const map = getPixelSpriteTexture(textureKey);
    return {parts: [
      {geometry, billboard: true, material: createLitSpriteMaterial(map, getPixelSpriteNormalTexture(textureKey),
        kind === 'blue_slime' ? 2 : ['pine_tree', 'oak_tree', 'bush', 'hedge_block', 'flower_patch'].includes(kind) ? 1 : 0)},
      {geometry, groundShadow: true, material: createSpriteShadowMaterial(map)}
    ]};
  }
  const foliageColor = rule.foliageColor ?? '#429638';
  const trunkColor = rule.trunkColor ?? '#704429';
  const stoneColor = rule.stoneColor ?? '#9297a6';

  if (kind === 'pine_tree') {
    // Trunk + 4 flared roots
    const trunkParts: THREE.BufferGeometry[] = [];
    const mainTrunk = new THREE.CylinderGeometry(0.22, 0.34, 1.15, 7);
    mainTrunk.translate(0, 0.58, 0);
    trunkParts.push(mainTrunk);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.35;
      const root = new THREE.BoxGeometry(0.22, 0.28, 0.48);
      root.rotateY(a);
      root.translate(Math.sin(a) * 0.32, 0.14, Math.cos(a) * 0.32);
      trunkParts.push(root);
    }

    // Small green grass tufts around base
    const tuftParts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.8;
      const tuft = new THREE.ConeGeometry(0.18, 0.32, 5);
      tuft.translate(Math.sin(a) * 0.46, 0.16, Math.cos(a) * 0.46);
      tuftParts.push(tuft);
    }

    // 4 scalloped lobe tiers with distinct dark-to-bright green gradient
    const makeLobeTier = (radius: number, y: number, lobeCount: number, lobeR: number) => {
      const geos: THREE.BufferGeometry[] = [];
      const core = new THREE.ConeGeometry(radius * 0.92, lobeR * 2.2, 8);
      core.translate(0, y + lobeR * 0.3, 0);
      geos.push(core);
      for (let i = 0; i < lobeCount; i++) {
        const a = (i / lobeCount) * Math.PI * 2 + y * 0.7;
        const lobe = new THREE.IcosahedronGeometry(lobeR, 1);
        lobe.scale(0.95, 1.15, 0.95);
        lobe.translate(Math.sin(a) * radius * 0.72, y, Math.cos(a) * radius * 0.72);
        geos.push(lobe);
      }
      return mergeNonIndexed(geos);
    };

    const tier1 = makeLobeTier(1.08, 1.25, 8, 0.42); // Darkest bottom skirt
    const tier2 = makeLobeTier(0.86, 1.88, 7, 0.38); // Deep forest green
    const tier3 = makeLobeTier(0.62, 2.48, 6, 0.34); // Mid green
    const tip = new THREE.ConeGeometry(0.52, 0.95, 8);
    tip.translate(0, 3.15, 0);

    return withOutlines([
      {geometry: mergeNonIndexed(trunkParts), material: toonMat(trunkColor)},
      {geometry: mergeNonIndexed(tuftParts), material: toonMat('#5ec443'), outline: false},
      {geometry: tier1, material: toonMat('#224a2b')},
      {geometry: tier2, material: toonMat('#317033')},
      {geometry: tier3, material: toonMat('#489c3b')},
      {geometry: tip, material: toonMat('#69cf44')}
    ], 0.05);
  }

  if (kind === 'oak_tree') {
    // Taller visible trunk + flared roots
    const trunkParts: THREE.BufferGeometry[] = [];
    const mainTrunk = new THREE.CylinderGeometry(0.2, 0.34, 1.55, 7);
    mainTrunk.translate(0, 0.78, 0);
    trunkParts.push(mainTrunk);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const root = new THREE.BoxGeometry(0.2, 0.24, 0.44);
      root.rotateY(a);
      root.translate(Math.sin(a) * 0.3, 0.12, Math.cos(a) * 0.3);
      trunkParts.push(root);
    }

    // Bright spring-green upright oval crown (distinct from dark pine)
    const botCrown = new THREE.IcosahedronGeometry(0.95, 1);
    botCrown.scale(1.05, 0.85, 1.05);
    botCrown.translate(0, 1.95, 0);

    const midCrown = new THREE.IcosahedronGeometry(0.92, 1);
    midCrown.scale(0.96, 1.05, 0.96);
    midCrown.translate(0, 2.55, 0);

    const topCrown = new THREE.IcosahedronGeometry(0.68, 1);
    topCrown.translate(0, 3.15, 0);

    return withOutlines([
      {geometry: mergeNonIndexed(trunkParts), material: toonMat(trunkColor)},
      {geometry: botCrown, material: toonMat('#429435')},
      {geometry: mergeNonIndexed([midCrown, topCrown]), material: toonMat('#72db46')}
    ], 0.05);
  }

  if (kind === 'hedge_block') {
    const box = new THREE.BoxGeometry(1.75, 1.12, 1.75);
    box.translate(0, 0.56, 0);
    return withOutlines([
      {
        geometry: box,
        material: new THREE.MeshToonMaterial({map: createHedgeTexture(), gradientMap: getToonGradient()})
      }
    ], 0.045);
  }

  if (kind === 'stump') {
    const bark = new THREE.CylinderGeometry(0.32, 0.48, 0.62, 8);
    bark.translate(0, 0.31, 0);
    const ring = new THREE.CylinderGeometry(0.26, 0.26, 0.06, 8);
    ring.translate(0, 0.63, 0);
    return withOutlines([
      {geometry: bark, material: toonMat(trunkColor)},
      {geometry: ring, material: toonMat('#d6a974'), outline: false}
    ], 0.045);
  }

  if (kind === 'fallen_log') {
    const log = new THREE.CylinderGeometry(0.32, 0.36, 2.2, 8);
    log.rotateZ(Math.PI / 2);
    log.translate(0, 0.32, 0);
    const twig = new THREE.CylinderGeometry(0.08, 0.12, 0.5, 6);
    twig.rotateZ(-0.6);
    twig.translate(0.35, 0.55, 0.15);
    const hollow = new THREE.CylinderGeometry(0.22, 0.22, 2.24, 8);
    hollow.rotateZ(Math.PI / 2);
    hollow.translate(0, 0.32, 0);
    return withOutlines([
      {geometry: mergeNonIndexed([log, twig]), material: toonMat(trunkColor)},
      {geometry: hollow, material: new THREE.MeshBasicMaterial({color: '#24160e'}), outline: false}
    ], 0.045);
  }

  if (kind === 'mushroom') {
    const stem = new THREE.CylinderGeometry(0.11, 0.14, 0.32, 6);
    stem.translate(0, 0.16, 0);
    const cap = new THREE.SphereGeometry(0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58);
    cap.translate(0, 0.28, 0);
    const s1 = new THREE.SphereGeometry(0.06, 5, 4);
    s1.translate(0.14, 0.42, 0.12);
    const s2 = new THREE.SphereGeometry(0.05, 5, 4);
    s2.translate(-0.14, 0.4, -0.1);
    return withOutlines([
      {geometry: mergeNonIndexed([stem, s1, s2]), material: toonMat('#f5ebd8')},
      {geometry: cap, material: toonMat('#e03b3b')}
    ], 0.035);
  }

  if (kind === 'blue_slime') {
    const blob = new THREE.SphereGeometry(0.46, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.65);
    blob.scale(1.15, 0.9, 1.1);
    blob.translate(0, 0.14, 0);
    return withOutlines([
      {geometry: blob, material: toonMat('#3ec2ff', {emissive: '#14628c', emissiveIntensity: 0.2})}
    ], 0.045);
  }

  if (kind === 'boulder') {
    const g1 = new THREE.DodecahedronGeometry(0.76, 0);
    g1.scale(1.15, 0.78, 1.0);
    g1.translate(0, 0.42, 0);
    const g2 = new THREE.DodecahedronGeometry(0.46, 0);
    g2.translate(0.5, 0.26, 0.24);
    return withOutlines([
      {geometry: mergeNonIndexed([g1, g2]), material: toonMat(stoneColor)}
    ], 0.05);
  }

  if (kind === 'ruin_pillar') {
    const base = new THREE.BoxGeometry(1.2, 0.4, 1.2);
    base.translate(0, 0.2, 0);
    const col = new THREE.CylinderGeometry(0.38, 0.42, 2.8, 8);
    col.translate(0, 1.8, 0);
    const cap = new THREE.BoxGeometry(1.05, 0.34, 1.05);
    cap.translate(0, 3.3, 0);
    return withOutlines([
      {geometry: mergeNonIndexed([base, col, cap]), material: toonMat(stoneColor)}
    ], 0.05);
  }

  const b1 = new THREE.IcosahedronGeometry(0.5, 0);
  b1.translate(0, 0.35, 0);
  return withOutlines([{geometry: b1, material: toonMat(foliageColor)}], 0.045);
}

export interface ScatteredProps {
  group: THREE.Group;
  colliders: Collider[];
}

export function scatterWorldProps(field: TerrainField, rules: PropRule[]): ScatteredProps {
  const rng = createRng(field.seed + 9001);
  const group = new THREE.Group();
  group.name = 'cel-3d-props';
  const colliders: Collider[] = [{x: 0, z: 0, radius: 1.35}];

  const playableHalf = field.preset.size * 0.46;
  const area = (playableHalf * 2) ** 2;
  const placedPositions: {x: number; z: number; r: number}[] = [{x: 0, z: 0, r: 5.5}];
  const dummy = new THREE.Object3D();

  for (const rule of rules) {
    const targetCount = Math.floor(area * rule.density);
    const maxAttempts = targetCount * 6;
    const transforms: THREE.Matrix4[] = [];

    for (let attempt = 0; attempt < maxAttempts && transforms.length < targetCount; attempt++) {
      const x = (rng() * 2 - 1) * playableHalf;
      const z = (rng() * 2 - 1) * playableHalf;
      const y = field.heightAt(x, z);

      if ((Math.abs(x) < 2.2 && Math.abs(z) < 10.5) || (Math.abs(z) < 2.2 && Math.abs(x) < 10.5)) {
        continue;
      }

      if (y < rule.minHeight || y > rule.maxHeight) continue;
      if (field.slopeAt(x, z) > rule.maxSlope) continue;

      let tooClose = false;
      for (const p of placedPositions) {
        const minD = Math.max(rule.minSpacing, p.r);
        const dx = x - p.x;
        const dz = z - p.z;
        if (dx * dx + dz * dz < minD * minD) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      const scale = THREE.MathUtils.lerp(rule.scaleRange[0], rule.scaleRange[1], rng());
      dummy.position.set(x, y - 0.04, z);
      dummy.rotation.set(0, rule.kind === 'hedge_block' ? 0 : rng() * Math.PI * 2, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      transforms.push(dummy.matrix.clone());

      placedPositions.push({x, z, r: rule.minSpacing * 0.55});
      if (rule.colliderRadius > 0) {
        colliders.push({x, z, radius: rule.colliderRadius * scale});
      }
    }

    if (transforms.length === 0) continue;

    const template = buildPropTemplate(rule.kind, rule);
    for (const part of template.parts) {
      const inst = new THREE.InstancedMesh(part.geometry, part.material, transforms.length);
      const isOutline = part.material === outlineMat;
      inst.castShadow = !isOutline && rule.kind !== 'mushroom';
      inst.receiveShadow = !isOutline;
      for (let i = 0; i < transforms.length; i++) {
        inst.setMatrixAt(i, transforms[i]);
      }
      inst.instanceMatrix.needsUpdate = true;
      group.add(inst);
    }
  }

  return {group, colliders};
}
