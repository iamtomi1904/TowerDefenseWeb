import * as THREE from 'three';
import {faceInstancesToCamera} from './billboard';
import {ActionClock} from './actions';
import {withinHarvestReach} from './impact-feedback';
import {SPRITE_LIGHT_LAYER, projectSpriteShadow} from './sprite-lighting';
import {WorldPropGenerator, planChunkWindow} from './world-generation';
import type {PropKind, PropRule} from './presets';
import {buildChunkTerrainMesh, createIsoCliffTexture, createIsoGrassTopTexture, createStoneTopTexture, type TerrainField} from './terrain';

export interface Collider {
  x: number;
  z: number;
  radius: number;
}

export interface HarvestableProp {
  id: string;
  kind: PropKind;
  x: number;
  z: number;
  radius: number;
  instMesh: THREE.InstancedMesh[];
  instanceIndex: number;
  harvested: boolean;
}

export interface HarvestFeedback {id: string; kind: PropKind; x: number; y: number; z: number; rewardText: string}
interface HarvestAction {prop: HarvestableProp; bases: THREE.Matrix4[]}
interface ChunkData {
  key: string;
  cx: number;
  cz: number;
  group: THREE.Group;
  colliders: Collider[];
  harvestables: HarvestableProp[];
}

export class ChunkManager {
  readonly chunkCols = 14;
  readonly viewRadius = 2; // 5x5 chunks = 70x70 tiles active around player
  readonly root = new THREE.Group();

  private field: TerrainField;
  private rules: PropRule[];
  private buildTemplate: (kind: PropKind, rule: PropRule) => {parts: {geometry: THREE.BufferGeometry; material: THREE.Material; isOutline?: boolean; billboard?: boolean; groundShadow?: boolean}[]};
  private billboardRotation = new THREE.Quaternion();
  readonly removed = new Set<string>();
  readonly generator: WorldPropGenerator;
  private pending = 0;
  private actions = new ActionClock<HarvestAction>(0.22);
  private chunks = new Map<string, ChunkData>();
  private exclude: (x: number, z: number) => boolean;

  private topMat: THREE.MeshStandardMaterial;
  private sideMat: THREE.MeshStandardMaterial;
  private stairMat: THREE.MeshStandardMaterial;

  constructor(
    field: TerrainField,
    rules: PropRule[],
    buildTemplate: (kind: PropKind, rule: PropRule) => {parts: {geometry: THREE.BufferGeometry; material: THREE.Material; isOutline?: boolean; billboard?: boolean; groundShadow?: boolean}[]},
    exclude: (x: number, z: number) => boolean = () => false
  ) {
    this.field = field;
    this.rules = rules;
    this.generator = new WorldPropGenerator(field.seed, field, rules);
    this.buildTemplate = buildTemplate;
    this.exclude = exclude;
    this.root.name = 'chunk-world-root';

    this.topMat = new THREE.MeshStandardMaterial({
      map: createIsoGrassTopTexture(),
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.02
    });
    this.sideMat = new THREE.MeshStandardMaterial({
      map: createIsoCliffTexture(),
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.02
    });
    this.stairMat = new THREE.MeshStandardMaterial({
      map: createStoneTopTexture(), vertexColors: true,
      roughness: 0.88,
      flatShading: true
    });
  }

  get activeChunkCount(): number {
    return this.chunks.size;
  }

  faceCamera(camera: THREE.Camera): void {
    camera.getWorldQuaternion(this.billboardRotation);
    for (const chunk of this.chunks.values()) {
      chunk.group.traverse(obj => {
        if (!(obj instanceof THREE.InstancedMesh) || !obj.userData.billboard) return;
        faceInstancesToCamera(obj, this.billboardRotation);
      });
    }
  }

  updateSpriteShadows(toLight: THREE.Vector3, opacity: number): void {
    const matrix = new THREE.Matrix4();
    const projected = new THREE.Matrix4();
    for (const chunk of this.chunks.values()) {
      chunk.group.traverse(obj => {
        if (!(obj instanceof THREE.InstancedMesh)) return;
        const source = obj.userData.shadowSource as THREE.InstancedMesh | undefined;
        if (!source) return;
        (obj.material as THREE.MeshBasicMaterial).opacity = opacity;
        obj.visible = opacity > 0.005;
        if (!obj.visible) return;
        const stateKey = [...this.billboardRotation.toArray(), toLight.x, toLight.y, toLight.z, source.instanceMatrix.version].join(',');
        if (obj.userData.shadowState === stateKey) return;
        for (let i = 0; i < source.count; i++) {
          source.getMatrixAt(i, matrix);
          obj.setMatrixAt(i, projectSpriteShadow(matrix, toLight, projected));
        }
        obj.instanceMatrix.needsUpdate = true;
        obj.computeBoundingSphere();
        obj.userData.shadowState = stateKey;
      });
    }
  }

  get pendingChunkCount(): number {return this.pending;}

  update(playerX: number, playerZ: number): void {
    const chunkWorldSize = this.chunkCols * this.field.preset.tileSize;
    const window = planChunkWindow(playerX, playerZ, chunkWorldSize, this.viewRadius);
    const needed = new Set(window.map(chunk => chunk.key));
    for (const [key, chunk] of this.chunks.entries()) {
      if (!needed.has(key)) {
        this.releaseChunk(chunk);
        this.chunks.delete(key);
      }
    }
    const missing = window.filter(chunk => !this.chunks.has(chunk.key));
    // At most one whole chunk per frame. Near chunks always take priority; obsolete
    // queued coordinates disappear when the player moves to another chunk window.
    const next = missing[0];
    if (next) this.loadChunk(next.cx, next.cz, next.key);
    this.pending = Math.max(0, missing.length - (next ? 1 : 0));
  }

  getActiveColliders(): Collider[] {
    const out: Collider[] = [{x: 0, z: 0, radius: 1.35}];
    for (const c of this.chunks.values()) {
      for (const col of c.colliders) out.push(col);
    }
    return out;
  }

  beginHarvestAt(wx: number, wz: number, playerX: number, playerZ: number, playerY: number): HarvestFeedback | null {
    if (Math.hypot(wx - playerX, wz - playerZ) > 6.5) return null;

    let best: HarvestableProp | null = null;
    let bestDist = Infinity;

    for (const chunk of this.chunks.values()) {
      for (const h of chunk.harvestables) {
        if (h.harvested) continue;
        if (!withinHarvestReach(playerX, playerY, playerZ, h.x, this.field.heightAt(h.x, h.z), h.z)) continue;
        const d = Math.hypot(wx - h.x, wz - h.z);
        if (d < Math.max(2.2, h.radius + 0.9) && d < bestDist) {
          bestDist = d;
          best = h;
        }
      }
    }

    if (!best) return null;
    const bases = best.instMesh.map(mesh => {
      const matrix = new THREE.Matrix4(); mesh.getMatrixAt(best!.instanceIndex, matrix); return matrix;
    });
    if (!this.actions.start(best.id, {prop: best, bases})) return null;
    return this.feedback(best);
  }

  private feedback(prop: HarvestableProp): HarvestFeedback {
    const rewardText = prop.kind === 'boulder' || prop.kind === 'ruin_pillar' ? '+2 STONE'
      : prop.kind === 'blue_slime' ? '+3 SLIME' : prop.kind === 'mushroom' ? '+1 MUSHROOM' : '+2 WOOD';
    return {id: prop.id, kind: prop.kind, x: prop.x, y: this.field.heightAt(prop.x, prop.z), z: prop.z, rewardText};
  }

  updateActions(dt: number): HarvestFeedback[] {
    const {active, completed} = this.actions.advance(dt);
    const matrix = new THREE.Matrix4(), position = new THREE.Vector3(), scale = new THREE.Vector3(), rotation = new THREE.Quaternion();
    const color = new THREE.Color();
    for (const {value, progress} of active) {
      const flash = Math.sin(progress * Math.PI);
      for (let i = 0; i < value.prop.instMesh.length; i++) {
        const mesh = value.prop.instMesh[i];
        if (mesh.userData.shadowSource) continue;
        value.bases[i].decompose(position, rotation, scale);
        if (mesh.userData.billboard) rotation.copy(this.billboardRotation);
        position.x += Math.sin(progress * Math.PI * 6) * 0.08 * flash;
        scale.y *= 1 + flash * 0.055;
        matrix.compose(position, rotation, scale); mesh.setMatrixAt(value.prop.instanceIndex, matrix);
        mesh.setColorAt(value.prop.instanceIndex, color.setRGB(1 + flash * 2.5, 1 + flash * 1.7, 1 + flash));
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    }
    return completed.map(action => this.commitHarvest(action.prop));
  }

  private commitHarvest(best: HarvestableProp): HarvestFeedback {
    best.harvested = true;
    this.removed.add(best.id);

    // Hide prop instance by scaling to 0
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const m of best.instMesh) {
      m.setMatrixAt(best.instanceIndex, zero);
      m.instanceMatrix.needsUpdate = true;
    }

    // Remove its collider
    for (const chunk of this.chunks.values()) {
      const idx = chunk.colliders.findIndex((c) => Math.abs(c.x - best!.x) < 0.01 && Math.abs(c.z - best!.z) < 0.01);
      if (idx >= 0) chunk.colliders.splice(idx, 1);
    }

    return this.feedback(best);
  }

  private loadChunk(cx: number, cz: number, key: string): void {
    const chunkGroup = new THREE.Group();
    const terrainGroup = buildChunkTerrainMesh(
      this.field,
      cx,
      cz,
      this.chunkCols,
      this.topMat,
      this.sideMat,
      this.stairMat
    );
    chunkGroup.add(terrainGroup);

    const chunkWorldSize = this.chunkCols * this.field.preset.tileSize;
    const generated = this.generator.generateChunk(cx, cz, chunkWorldSize);
    const colliders: Collider[] = [];
    const harvestables: HarvestableProp[] = [];
    const dummy = new THREE.Object3D();

    for (const rule of this.rules) {
      const items = generated.filter(item => item.kind === rule.kind && !this.removed.has(item.id) && !this.exclude(item.x, item.z));
      for (const item of items) {
        if (rule.colliderRadius > 0) colliders.push({x: item.x, z: item.z, radius: rule.colliderRadius * item.scale});
      }

      if (items.length === 0) continue;

      const template = this.buildTemplate(rule.kind, rule);
      const instMeshes: THREE.InstancedMesh[] = [];
      let spriteSource: THREE.InstancedMesh | undefined;
      for (const part of template.parts) {
        const inst = new THREE.InstancedMesh(part.geometry, part.material, items.length);
        inst.userData.billboard = !!part.billboard;
        if (part.billboard) {
          inst.layers.set(SPRITE_LIGHT_LAYER);
          spriteSource = inst;
        }
        if (part.groundShadow) inst.userData.shadowSource = spriteSource;
        inst.castShadow = !part.isOutline && !part.billboard && !part.groundShadow && rule.kind !== 'mushroom';
        inst.receiveShadow = !part.isOutline && !part.groundShadow;
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          dummy.position.set(it.x, it.y, it.z);
          if (part.billboard) dummy.quaternion.copy(this.billboardRotation);
          else dummy.rotation.set(0, it.rotY, 0);
          dummy.scale.setScalar(it.scale);
          dummy.updateMatrix();
          inst.setMatrixAt(i, dummy.matrix);
        }
        inst.instanceMatrix.needsUpdate = true;
        chunkGroup.add(inst);
        instMeshes.push(inst);
      }

      for (let i = 0; i < items.length; i++) {
        harvestables.push({
          id: items[i].id,
          kind: rule.kind,
          x: items[i].x,
          z: items[i].z,
          radius: rule.colliderRadius * items[i].scale,
          instMesh: instMeshes,
          instanceIndex: i,
          harvested: false
        });
      }
    }

    this.root.add(chunkGroup);
    this.chunks.set(key, {key, cx, cz, group: chunkGroup, colliders, harvestables});
  }

  dispose(): void {
    for (const chunk of this.chunks.values()) {
      this.releaseChunk(chunk);
    }
    this.chunks.clear();
    this.topMat.map?.dispose();
    this.sideMat.map?.dispose();
    this.stairMat.map?.dispose();
    this.topMat.dispose();
    this.sideMat.dispose();
    this.stairMat.dispose();
  }

  private releaseChunk(chunk: ChunkData): void {
    this.root.remove(chunk.group);
    for (const prop of chunk.harvestables) this.actions.cancel(prop.id);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    chunk.group.traverse(obj => {
      if (!(obj instanceof THREE.Mesh)) return;
      geometries.add(obj.geometry);
      for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) {
        if (material !== this.topMat && material !== this.sideMat && material !== this.stairMat && !material.userData.shared) materials.add(material);
      }
      if (obj instanceof THREE.InstancedMesh) obj.dispose();
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    // Pixel albedo/normal textures are shared caches; chunks do not own them.
  }
}
