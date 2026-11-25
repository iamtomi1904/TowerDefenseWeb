import {createRng, Noise2D, smoothstep} from './noise.ts';
import type {PropKind, PropRule} from './presets';

export interface PropTerrain {
  heightAt(x: number, z: number): number;
  slopeAt(x: number, z: number): number;
}

export interface GeneratedProp {
  id: string;
  kind: PropKind;
  x: number; y: number; z: number;
  scale: number; rotY: number; priority: number; spacing: number;
}

function hashText(text: string): number {
  let hash = 2166136261;
  for (const ch of text) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  return hash;
}

/** Independent smooth world-coordinate fields: no chunk-local reseeding or edge seams. */
export class WorldDistribution {
  private vegetation: Noise2D;
  private minerals: Noise2D;
  constructor(seed: number) {
    this.vegetation = new Noise2D(seed ^ 0x35a71f);
    this.minerals = new Noise2D(seed ^ 0x76d249);
  }
  sample(x: number, z: number): {forest: number; stone: number} {
    return {
      forest: smoothstep(0.3, 0.67, 0.5 + this.vegetation.fbm(x * 0.018 + 13.7, z * 0.018 - 9.3, 3) * 0.7),
      stone: smoothstep(0.32, 0.68, 0.5 + this.minerals.fbm(x * 0.03 - 7.9, z * 0.03 + 19.2, 3) * 0.7)
    };
  }
  labelAt(x: number, z: number): string {
    const {forest, stone} = this.sample(x, z);
    return forest > 0.62 ? 'Rừng rậm' : stone > 0.65 ? 'Vùng khoáng thạch' : 'Đồng cỏ thưa';
  }
  probability(kind: PropKind, x: number, z: number): number {
    const {forest, stone} = this.sample(x, z);
    if (kind === 'boulder' || kind === 'ruin_pillar') return 0.12 + stone * 0.85;
    if (kind === 'mushroom' || kind === 'fallen_log' || kind === 'stump') return 0.1 + forest * 0.8;
    if (kind === 'flower_patch') return 0.75 - forest * 0.55;
    if (kind === 'blue_slime') return 0.3 + forest * 0.25;
    return 0.1 + forest * 0.88;
  }
}

/** Deterministic global candidate cells, with spacing resolved across chunk borders. */
export class WorldPropGenerator {
  readonly distribution: WorldDistribution;
  private cache = new Map<string, GeneratedProp | null>();
  private seed: number;
  private terrain: PropTerrain;
  private rules: readonly PropRule[];
  constructor(seed: number, terrain: PropTerrain, rules: readonly PropRule[]) {
    this.seed = seed;
    this.terrain = terrain;
    this.rules = rules;
    this.distribution = new WorldDistribution(seed);
  }
  private cellSize(rule: PropRule): number {
    return Math.max(rule.minSpacing, Math.sqrt(0.65 / Math.max(rule.density, 1e-8)));
  }
  private candidate(rule: PropRule, gx: number, gz: number): GeneratedProp | null {
    const id = `${rule.kind}:${gx}:${gz}`;
    if (this.cache.has(id)) return this.cache.get(id)!;
    const rng = createRng(this.seed ^ hashText(id));
    const size = this.cellSize(rule);
    const x = (gx + 0.15 + rng() * 0.7) * size;
    const z = (gz + 0.15 + rng() * 0.7) * size;
    const chance = rng();
    const scale = rule.scaleRange[0] + (rule.scaleRange[1] - rule.scaleRange[0]) * rng();
    const rotY = rng() * Math.PI * 2;
    const priority = rng();
    let result: GeneratedProp | null = null;
    if (rule.density > 0 && Math.hypot(x, z) >= 5.5 &&
        !((Math.abs(x) < 2.2 && Math.abs(z) < 10.5) || (Math.abs(z) < 2.2 && Math.abs(x) < 10.5)) &&
        chance < this.distribution.probability(rule.kind, x, z)) {
      const y = this.terrain.heightAt(x, z);
      if (y >= rule.minHeight && y <= rule.maxHeight && this.terrain.slopeAt(x, z) <= rule.maxSlope) {
        result = {id, kind: rule.kind, x, y: y - 0.04, z, scale, rotY, priority,
          spacing: Math.max(rule.minSpacing, rule.colliderRadius * scale * 2)};
      }
    }
    if (this.cache.size >= 40000) this.cache.clear();
    this.cache.set(id, result);
    return result;
  }
  private neighbors(rule: PropRule, x: number, z: number, radius: number): GeneratedProp[] {
    if (rule.density <= 0) return [];
    const size = this.cellSize(rule);
    const out: GeneratedProp[] = [];
    for (let gz = Math.floor((z - radius) / size); gz <= Math.floor((z + radius) / size); gz++) {
      for (let gx = Math.floor((x - radius) / size); gx <= Math.floor((x + radius) / size); gx++) {
        const candidate = this.candidate(rule, gx, gz);
        if (candidate) out.push(candidate);
      }
    }
    return out;
  }
  generateChunk(cx: number, cz: number, chunkSize: number): GeneratedProp[] {
    const minX = cx * chunkSize, minZ = cz * chunkSize;
    const out: GeneratedProp[] = [];
    for (const rule of this.rules) {
      const candidates = this.neighbors(rule, minX + chunkSize / 2, minZ + chunkSize / 2, chunkSize / 2);
      for (const item of candidates) {
        if (item.x < minX || item.x >= minX + chunkSize || item.z < minZ || item.z >= minZ + chunkSize) continue;
        let blocked = false;
        for (const otherRule of this.rules) {
          const radius = Math.max(item.spacing, otherRule.minSpacing, otherRule.colliderRadius * otherRule.scaleRange[1] * 2);
          for (const other of this.neighbors(otherRule, item.x, item.z, radius)) {
            if (other.id === item.id) continue;
            const wins = other.priority < item.priority || (other.priority === item.priority && other.id < item.id);
            if (wins && Math.hypot(other.x - item.x, other.z - item.z) < Math.max(item.spacing, other.spacing)) {
              blocked = true; break;
            }
          }
          if (blocked) break;
        }
        if (!blocked) out.push(item);
      }
    }
    return out;
  }
}

export function planChunkWindow(x: number, z: number, chunkSize: number, radius: number): {cx: number; cz: number; key: string}[] {
  const cx = Math.floor(x / chunkSize), cz = Math.floor(z / chunkSize);
  const chunks: {cx: number; cz: number; key: string}[] = [];
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    chunks.push({cx: cx + dx, cz: cz + dz, key: `${cx + dx},${cz + dz}`});
  }
  return chunks.sort((a, b) => {
    const distance = (c: typeof a) => (c.cx - cx) ** 2 + (c.cz - cz) ** 2;
    return distance(a) - distance(b) || a.cz - b.cz || a.cx - b.cx;
  });
}
