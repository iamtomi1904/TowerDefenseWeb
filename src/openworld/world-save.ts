export const WORLD_SAVE_KEY = 'openworld-progress-v1';
const GENERATOR_VERSION = 2;

export interface SavedWorld {
  presetId: string;
  seed: number;
  removed: string[];
  position: [number, number];
  savedAt: number;
}
interface SaveFile {version: 1; generator: number; active: string; worlds: Record<string, SavedWorld>}
interface SaveStorage {getItem(key: string): string | null; setItem(key: string, value: string): void}

/** Save only seed, player position and removed IDs; generated terrain is never serialized. */
export class WorldSaveStore {
  private storage: SaveStorage;
  private data: SaveFile = {version: 1, generator: GENERATOR_VERSION, active: '', worlds: {}};
  error: string | null = null;
  constructor(storage: SaveStorage) {
    this.storage = storage;
    try {
      const raw = storage.getItem(WORLD_SAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || parsed.generator !== GENERATOR_VERSION || !parsed.worlds || typeof parsed.worlds !== 'object') return;
      for (const world of Object.values(parsed.worlds)) {
        if (!WorldSaveStore.valid(world)) continue;
        this.data.worlds[this.key(world.presetId, world.seed)] = world;
      }
      if (typeof parsed.active === 'string' && Object.hasOwn(this.data.worlds, parsed.active)) this.data.active = parsed.active;
    } catch {this.error = 'Không đọc được bản lưu trên trình duyệt';}
  }
  private static valid(value: unknown): value is SavedWorld {
    if (!value || typeof value !== 'object') return false;
    const w = value as SavedWorld;
    return typeof w.presetId === 'string' && /^[a-z0-9-]+$/.test(w.presetId) &&
      Number.isInteger(w.seed) && w.seed > 0 && w.seed <= 2147483647 &&
      Array.isArray(w.position) && w.position.length === 2 && w.position.every(n => typeof n === 'number' && Number.isFinite(n)) &&
      Array.isArray(w.removed) && w.removed.every(id => typeof id === 'string' && /^[a-z_]+:-?\d+:-?\d+$/.test(id)) &&
      typeof w.savedAt === 'number' && Number.isFinite(w.savedAt);
  }
  private key(presetId: string, seed: number): string {return `${presetId}|${seed}`;}
  get active(): SavedWorld | null {return this.data.worlds[this.data.active] ?? null;}
  get(presetId: string, seed: number): SavedWorld | null {return this.data.worlds[this.key(presetId, seed)] ?? null;}
  save(world: SavedWorld): boolean {
    if (!WorldSaveStore.valid(world)) return false;
    const key = this.key(world.presetId, world.seed);
    this.data.worlds[key] = {...world, removed: [...world.removed], position: [...world.position]};
    this.data.active = key;
    try {
      this.storage.setItem(WORLD_SAVE_KEY, JSON.stringify(this.data));
      this.error = null;
      return true;
    } catch {
      this.error = 'Không ghi được bản lưu; tiến trình hiện tại vẫn giữ trong phiên này';
      return false;
    }
  }
}
