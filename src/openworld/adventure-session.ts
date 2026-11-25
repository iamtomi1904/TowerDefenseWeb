import type {PropKind} from './presets';

export const ADVENTURE_SAVE_KEY = 'the-world-adventure-v1';
export const ADVENTURE_SEED = 20261125;
export type Supplies = {wood: number; stone: number; gel: number; food: number};
export interface Point {x: number; y: number; z: number}
export interface AdventureWorld {heightAt(x: number, z: number): number; blocked(x: number, z: number, radius: number): boolean; waterLevel: number}
export interface ResourceNode extends Point {id: string; kind: PropKind; removed: boolean}
export interface Creature extends Point {id: string; homeX: number; homeZ: number; hp: number; state: 'roam' | 'chase' | 'windup' | 'recover' | 'return' | 'dead'; timer: number; flash: number; aimX: number; aimZ: number}
export interface House extends Point {}
export interface AdventureEvent extends Point {type: 'harvest' | 'hit' | 'kill' | 'hurt' | 'death'; kind: PropKind; text: string}
interface Swing {target: string; elapsed: number; committed: boolean}
export interface AdventureSnapshot {
  version: 1; seed: number; hp: number; supplies: Supplies; axe: boolean; house: House | null;
  position: [number, number]; avatar: 'human' | 'hooded'; removed: string[];
  nodes: string[]; killed: string[]; creatures: Creature[]; savedAt: number;
}
const START_NODES: [PropKind, number, number][] = [
  ['pine_tree', -8, 4], ['pine_tree', 8, 4], ['pine_tree', -10, -4], ['pine_tree', 10, -4],
  ['pine_tree', -4, 11], ['pine_tree', 4, 11], ['boulder', -8, -8], ['boulder', 8, -8],
  ['boulder', -13, 4], ['boulder', 13, 4], ['mushroom', -4, -6], ['mushroom', 4, -6]
];
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Single-player rules. Renderer, DOM, storage and design-preview state are deliberately outside. */
export class AdventureSession {
  hp = 100;
  supplies: Supplies = {wood: 0, stone: 0, gel: 0, food: 3};
  axe = false;
  house: House | null = null;
  readonly nodes: ResourceNode[] = START_NODES.map(([kind, x, z], i) => ({kind, x, z, y: 0, id: `camp-resource-${i}`, removed: false}));
  readonly creatures = new Map<string, Creature>();
  readonly killed = new Set<string>();
  readonly removed = new Set<string>();
  position: [number, number] = [2.4, 2.4];
  avatar: 'human' | 'hooded' = 'human';
  private swing: Swing | null = null;
  private invulnerable = 0;
  private events: AdventureEvent[] = [];
  private region = '';

  get dead(): boolean {return this.hp <= 0;}
  get acting(): boolean {return this.swing !== null;}
  get kills(): number {return this.killed.size;}
  get objective(): string {
    if (!this.axe) return 'Chế rìu tốt: thu thập 4 gỗ và 2 đá.';
    if (!this.house) return 'Dựng nhà đầu tiên: 8 gỗ và 4 đá. Bấm Xây nhà, chọn một khoảng đất trống.';
    if (this.kills < 3) return `Khám phá bìa rừng và hạ 3 slime (${this.kills}/3). Về gần nhà rồi bấm H để hồi máu.`;
    return 'Trại đã vững vàng. Tiếp tục khám phá, thu thập và săn quái trong thế giới mở.';
  }
  initialize(world: AdventureWorld): void {
    for (const node of this.nodes) node.y = world.heightAt(node.x, node.z);
    this.ensureRegion(this.position[0], this.position[1], world);
  }
  private spawn(id: string, x: number, z: number, world: AdventureWorld): void {
    if (this.creatures.has(id) || this.killed.has(id)) return;
    const y = world.heightAt(x, z);
    if (y < world.waterLevel + 0.1 || world.blocked(x, z, 0.7)) return;
    this.creatures.set(id, {id, x, y, z, homeX: x, homeZ: z, hp: 30, state: 'roam', timer: 0, flash: 0, aimX: 0, aimZ: 0});
  }
  private ensureRegion(x: number, z: number, world: AdventureWorld): void {
    const cx = Math.floor(x / 36), cz = Math.floor(z / 36), key = `${cx}:${cz}`;
    if (key === this.region) return;
    this.region = key;
    for (const [i, p] of [[-15, 10], [15, 10], [-15, -10], [15, -10]].entries()) this.spawn(`slime:camp:${i}`, p[0], p[1], world);
    // One deterministic creature per sector, checked only when crossing a sector boundary.
    for (let sx = cx - 1; sx <= cx + 1; sx++) for (let sz = cz - 1; sz <= cz + 1; sz++) {
      const hash = Math.abs(Math.imul(sx + 117, 73856093) ^ Math.imul(sz - 51, 19349663) ^ ADVENTURE_SEED);
      const hx = sx * 36 + 9 + hash % 18, hz = sz * 36 + 9 + (hash >>> 8) % 18;
      if (Math.hypot(hx, hz) < 27) continue;
      this.spawn(`slime:${sx}:${sz}`, hx, hz, world);
    }
    // Stream distant live creatures out; killed IDs stay separate so they never respawn.
    for (const [id, mob] of this.creatures) if (Math.hypot(mob.homeX - x, mob.homeZ - z) > 100) this.creatures.delete(id);
  }
  beginAction(point: Point, player: Point): Point | null {
    if (this.dead || this.swing) return null;
    let target: ResourceNode | Creature | null = null, best = Infinity;
    for (const candidate of [...this.creatures.values(), ...this.nodes]) {
      if ('removed' in candidate ? candidate.removed : candidate.hp <= 0) continue;
      const reach = Math.hypot(candidate.x - player.x, candidate.z - player.z);
      const select = Math.hypot(candidate.x - point.x, candidate.z - point.z);
      if (reach <= 3.6 && Math.abs(candidate.y - player.y) <= 0.65 && select < 2.1 && select < best) {target = candidate; best = select;}
    }
    if (!target) return null;
    this.swing = {target: target.id, elapsed: 0, committed: false};
    return target;
  }
  reward(kind: PropKind): string {
    if (kind === 'boulder' || kind === 'ruin_pillar') {this.supplies.stone += 3; return '+3 đá';}
    if (kind === 'mushroom') {this.supplies.food += 2; return '+2 nấm hồi sức';}
    if (kind === 'blue_slime') return '';
    this.supplies.wood += 3; return '+3 gỗ';
  }
  craftAxe(): string {
    if (this.dead) return 'Bạn cần hồi sinh trước.';
    if (this.axe) return 'Bạn đã có rìu tốt.';
    if (this.supplies.wood < 4 || this.supplies.stone < 2) return 'Cần 4 gỗ và 2 đá để chế rìu tốt.';
    this.supplies.wood -= 4; this.supplies.stone -= 2; this.axe = true;
    return 'Đã chế rìu tốt. Sát thương tăng từ 10 lên 20.';
  }
  canBuild(point: Point, player: Point, world: AdventureWorld): boolean {
    if (this.dead || this.house || Math.hypot(point.x - player.x, point.z - player.z) > 9 || Math.hypot(point.x, point.z) < 5) return false;
    if (point.y < world.waterLevel + 0.2 || world.blocked(point.x, point.z, 2.4)) return false;
    if (Math.hypot(point.x - player.x, point.z - player.z) < 2.8) return false;
    for (const node of this.nodes) if (!node.removed && Math.hypot(node.x - point.x, node.z - point.z) < 3.2) return false;
    for (const mob of this.creatures.values()) if (mob.hp > 0 && Math.hypot(mob.x - point.x, mob.z - point.z) < 4) return false;
    for (const dx of [-2, 0, 2]) for (const dz of [-1.8, 0, 1.8]) if (Math.abs(world.heightAt(point.x + dx, point.z + dz) - point.y) > 0.25) return false;
    return true;
  }
  build(point: Point, player: Point, world: AdventureWorld): string {
    if (!this.axe) return 'Hãy chế rìu tốt trước khi dựng nhà.';
    if (this.supplies.wood < 8 || this.supplies.stone < 4) return 'Cần 8 gỗ và 4 đá để xây nhà.';
    if (!this.canBuild(point, player, world)) return 'Chọn đất bằng, trống, cách bạn 3–9 bước và cách đèn hiệu ít nhất 5 bước.';
    this.supplies.wood -= 8; this.supplies.stone -= 4; this.house = {...point};
    return 'Nhà đã dựng xong! Đến gần và bấm H để nghỉ ngơi.';
  }
  heal(player: Point): string {
    if (this.dead) return 'Bạn cần hồi sinh trước.';
    if (this.hp >= 100) return 'Máu đã đầy.';
    if (this.house && Math.hypot(player.x - this.house.x, player.z - this.house.z) < 6 && Math.abs(player.y - this.house.y) < 0.65) {
      this.hp = 100; return 'Đã nghỉ ngơi tại nhà. Máu được hồi đầy.';
    }
    if (this.supplies.food <= 0) return 'Hết nấm hồi sức. Hãy tìm nấm hoặc trở về nhà.';
    this.supplies.food--; this.hp = Math.min(100, this.hp + 35); return 'Đã ăn nấm, hồi 35 máu.';
  }
  respawn(): [number, number] {
    this.hp = 100; this.invulnerable = 2; this.swing = null;
    this.position = this.house ? [this.house.x, this.house.z + 3.4] : [2.4, 2.4];
    return [...this.position];
  }
  private protectedAt(x: number, z: number): boolean {
    return Math.hypot(x, z) < 5 || !!this.house && Math.hypot(x - this.house.x, z - this.house.z) < 6;
  }
  update(dt: number, player: Point, world: AdventureWorld): void {
    if (this.dead) return;
    dt = Math.max(0, Math.min(0.1, dt));
    this.position = [player.x, player.z];
    this.ensureRegion(player.x, player.z, world);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    if (this.swing) {
      this.swing.elapsed += dt;
      if (!this.swing.committed && this.swing.elapsed >= 0.2) {
        this.swing.committed = true;
        const target = this.creatures.get(this.swing.target) ?? this.nodes.find(node => node.id === this.swing!.target);
        if (target && Math.hypot(target.x - player.x, target.z - player.z) <= 3.8 && Math.abs(target.y - player.y) <= 0.65) {
          if ('removed' in target && !target.removed) {
            target.removed = true;
            this.events.push({...target, type: 'harvest', text: this.reward(target.kind)});
          } else if ('hp' in target && target.hp > 0) {
            target.hp = Math.max(0, target.hp - (this.axe ? 20 : 10)); target.flash = 0.18;
            target.timer = 0.3; target.state = target.hp ? 'recover' : 'dead';
            if (!target.hp) {this.killed.add(target.id); this.supplies.gel++;}
            this.events.push({...target, type: target.hp ? 'hit' : 'kill', kind: 'blue_slime', text: target.hp ? `${this.axe ? 20 : 10} sát thương` : '+1 lõi slime'});
          }
        }
      }
      if (this.swing.elapsed >= 0.36) this.swing = null;
    }
    for (const mob of this.creatures.values()) {
      if (mob.hp <= 0 || Math.hypot(mob.x - player.x, mob.z - player.z) > 45) continue;
      mob.flash = Math.max(0, mob.flash - dt); mob.timer -= dt;
      const distance = Math.hypot(mob.x - player.x, mob.z - player.z);
      const sameLevel = Math.abs(mob.y - player.y) < 0.65;
      const safe = this.protectedAt(player.x, player.z);
      if (mob.state === 'windup') {
        if (mob.timer <= 0) {
          if (!safe && sameLevel && distance < 1.9 && Math.hypot(player.x - mob.aimX, player.z - mob.aimZ) < 1.7 && this.invulnerable <= 0) {
            this.hp = Math.max(0, this.hp - 14); this.invulnerable = 0.85;
            this.events.push({...player, type: this.dead ? 'death' : 'hurt', kind: 'blue_slime', text: '-14 máu'});
          }
          mob.state = 'recover'; mob.timer = 0.8;
        }
        continue;
      }
      if (mob.state === 'recover' && mob.timer > 0) continue;
      const leash = Math.hypot(mob.x - mob.homeX, mob.z - mob.homeZ) > 14;
      if (safe || leash || distance > 12) mob.state = 'return';
      else if (distance < 9 && sameLevel) mob.state = 'chase';
      else if (mob.state !== 'return') mob.state = 'roam';
      if (mob.state === 'chase' && distance < 1.65) {
        mob.state = 'windup'; mob.timer = 0.6; mob.aimX = player.x; mob.aimZ = player.z; continue;
      }
      let tx = mob.state === 'chase' ? player.x : mob.homeX, tz = mob.state === 'chase' ? player.z : mob.homeZ;
      if (mob.state === 'return' && Math.hypot(mob.x - tx, mob.z - tz) < 0.3) mob.state = 'roam';
      if (mob.state === 'roam') {tx += Math.sin(mob.timer * 0.6 + mob.homeX) * 1.6; tz += Math.cos(mob.timer * 0.5 + mob.homeZ) * 1.6;}
      const d = Math.hypot(tx - mob.x, tz - mob.z);
      if (d > 0.1) {
        const step = Math.min(d, (mob.state === 'chase' ? 3.2 : 1.3) * dt);
        const nx = mob.x + (tx - mob.x) / d * step, nz = mob.z + (tz - mob.z) / d * step;
        const canMove = (x: number, z: number) => Math.abs(world.heightAt(x, z) - mob.y) <= 0.45 && world.heightAt(x, z) > world.waterLevel + 0.1 && !world.blocked(x, z, 0.45) && !this.protectedAt(x, z);
        if (canMove(nx, nz)) {mob.x = nx; mob.z = nz;}
        else if (canMove(nx, mob.z)) mob.x = nx;
        else if (canMove(mob.x, nz)) mob.z = nz;
        mob.y = world.heightAt(mob.x, mob.z);
      }
      if (this.dead) break;
    }
  }
  drainEvents(): AdventureEvent[] {const events = this.events; this.events = []; return events;}
  snapshot(): AdventureSnapshot {
    return {version: 1, seed: ADVENTURE_SEED, hp: this.hp, supplies: {...this.supplies}, axe: this.axe,
      house: this.house && {...this.house}, position: [...this.position], avatar: this.avatar,
      nodes: this.nodes.filter(node => node.removed).map(node => node.id), removed: [...this.removed],
      killed: [...this.killed], creatures: [...this.creatures.values()].filter(mob => mob.hp > 0).map(mob => ({...mob})), savedAt: Date.now()};
  }
  static restore(raw: string | null): AdventureSession {
    const game = new AdventureSession();
    if (!raw) return game;
    try {
      const s = JSON.parse(raw) as AdventureSnapshot;
      const strings = (items: unknown): items is string[] => Array.isArray(items) && items.length <= 50000 && items.every(item => typeof item === 'string' && item.length < 100);
      if (s.version !== 1 || s.seed !== ADVENTURE_SEED || !finite(s.hp) || s.hp < 0 || s.hp > 100 || !s.supplies ||
        !['wood', 'stone', 'gel', 'food'].every(key => Number.isSafeInteger(s.supplies[key as keyof Supplies]) && s.supplies[key as keyof Supplies] >= 0) ||
        !Array.isArray(s.position) || s.position.length !== 2 || !s.position.every(n => finite(n) && Math.abs(n) < 1000000) ||
        !strings(s.nodes) || !strings(s.removed) || !strings(s.killed) || typeof s.axe !== 'boolean' ||
        s.house !== null && (!s.house || ![s.house.x, s.house.y, s.house.z].every(finite)) || !Array.isArray(s.creatures) || s.creatures.length > 100) return game;
      game.hp = s.hp; game.supplies = {...s.supplies}; game.axe = s.axe; game.house = s.house; game.position = [...s.position];
      game.avatar = s.avatar === 'hooded' ? 'hooded' : 'human';
      for (const node of game.nodes) node.removed = s.nodes.includes(node.id);
      for (const id of s.removed) game.removed.add(id);
      for (const id of s.killed) game.killed.add(id);
      for (const mob of s.creatures) {
        if (!mob || typeof mob.id !== 'string' || game.killed.has(mob.id) || ![mob.x, mob.y, mob.z, mob.homeX, mob.homeZ, mob.hp].every(finite) || mob.hp <= 0 || mob.hp > 30) continue;
        game.creatures.set(mob.id, {...mob, state: 'roam', timer: 0, flash: 0, aimX: 0, aimZ: 0});
      }
      return game;
    } catch {return game;}
  }
}
