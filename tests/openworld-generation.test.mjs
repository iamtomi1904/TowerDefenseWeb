import test from 'node:test';
import assert from 'node:assert/strict';
import {WorldDistribution, WorldPropGenerator, planChunkWindow} from '../src/openworld/world-generation.ts';
import {WorldSaveStore, WORLD_SAVE_KEY} from '../src/openworld/world-save.ts';

const terrain = {heightAt: () => 0, slopeAt: () => 0};
const rules = [
  {kind: 'pine_tree', density: 0.06, minHeight: -1, maxHeight: 5, maxSlope: 0.3, minSpacing: 2.6, scaleRange: [0.8, 1.2], colliderRadius: 0.5},
  {kind: 'boulder', density: 0.035, minHeight: -1, maxHeight: 5, maxSlope: 0.3, minSpacing: 2, scaleRange: [0.9, 1.3], colliderRadius: 0.6}
];
const memoryStorage = () => {
  const values = new Map();
  return {getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value)};
};

test('world seed reproduces prop layout regardless of chunk loading order, including negative coordinates', () => {
  const first = new WorldPropGenerator(2026, terrain, rules);
  const second = new WorldPropGenerator(2026, terrain, rules);
  const chunks = [[-2, -1], [-1, -1], [0, -1], [1, -1], [1, 0]];
  const expected = new Map(chunks.map(([x, z]) => [`${x},${z}`, first.generateChunk(x, z, 28)]));
  for (const [x, z] of [...chunks].reverse()) assert.deepEqual(second.generateChunk(x, z, 28), expected.get(`${x},${z}`));
  assert.notDeepEqual(new WorldPropGenerator(4096, terrain, rules).generateChunk(-1, -1, 28), expected.get('-1,-1'));
});

test('global candidate ownership is unique and minimum spacing survives neighboring chunk borders', () => {
  const generator = new WorldPropGenerator(2026, terrain, rules);
  const items = [];
  for (let z = -2; z <= 1; z++) for (let x = -2; x <= 1; x++) {
    const chunk = generator.generateChunk(x, z, 28);
    assert.ok(chunk.every(p => Math.floor(p.x / 28) === x && Math.floor(p.z / 28) === z));
    items.push(...chunk);
  }
  assert.ok(items.length > 30);
  assert.equal(new Set(items.map(p => p.id)).size, items.length);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= Math.max(a.spacing, b.spacing) - 1e-8);
  }
});

test('vegetation and mineral noise are continuous across a chunk edge, independent, and spatially varied', () => {
  const distribution = new WorldDistribution(2026);
  const points = [];
  for (let x = -200; x <= 200; x += 20) points.push(distribution.sample(x, 17));
  assert.ok(Math.max(...points.map(p => p.forest)) - Math.min(...points.map(p => p.forest)) > 0.35);
  assert.ok(points.some(p => Math.abs(p.forest - p.stone) > 0.3));
  const a = distribution.sample(28 - 1e-5, 17), b = distribution.sample(28 + 1e-5, 17);
  assert.ok(Math.abs(a.forest - b.forest) < 1e-5);
  assert.ok(Math.abs(a.stone - b.stone) < 1e-5);
});

test('chunk window prioritizes the center and replaces old coordinates after moving or teleporting', () => {
  const window = planChunkWindow(-0.1, -28.1, 28, 2);
  assert.equal(window.length, 25);
  assert.equal(window[0].key, '-1,-2');
  assert.equal(new Set(window.map(c => c.key)).size, 25);
  const next = planChunkWindow(10000, -10000, 28, 2);
  assert.equal(next[0].key, '357,-358');
  assert.ok(next.every(c => !window.some(old => old.key === c.key)));
});

test('harvest changes survive unload/recreation and a new save-store instance, isolated by seed/preset', () => {
  const storage = memoryStorage();
  const generator = new WorldPropGenerator(2026, terrain, rules);
  const original = generator.generateChunk(-1, -1, 28);
  assert.ok(original.length > 0);
  const removed = original[0].id;
  const saves = new WorldSaveStore(storage);
  assert.ok(saves.save({presetId: 'meadow-isle', seed: 2026, removed: [removed], position: [-5, -12], savedAt: 1}));
  const restored = new WorldSaveStore(storage);
  assert.deepEqual(restored.active.position, [-5, -12]);
  const delta = new Set(restored.get('meadow-isle', 2026).removed);
  const regenerated = new WorldPropGenerator(2026, terrain, rules).generateChunk(-1, -1, 28).filter(p => !delta.has(p.id));
  assert.deepEqual(regenerated, original.slice(1));
  assert.equal(restored.get('meadow-isle', 4096), null);
  assert.equal(restored.get('highland-ruins', 2026), null);
  const file = JSON.parse(storage.getItem(WORLD_SAVE_KEY));
  assert.deepEqual(Object.keys(file.worlds['meadow-isle|2026']).sort(), ['position', 'presetId', 'removed', 'savedAt', 'seed']);
});

test('invalid saves and blocked browser storage do not crash the running world', () => {
  const storage = memoryStorage();
  storage.setItem(WORLD_SAVE_KEY, '{invalid');
  assert.equal(new WorldSaveStore(storage).active, null);
  const blocked = new WorldSaveStore({getItem() {throw new Error('blocked');}, setItem() {throw new Error('quota');}});
  assert.equal(blocked.save({presetId: 'meadow-isle', seed: 2026, removed: [], position: [0, 0], savedAt: 1}), false);
  assert.deepEqual(blocked.active.position, [0, 0], 'session still retains progress');
  assert.ok(blocked.error);
  assert.equal(blocked.save({presetId: 'meadow-isle', seed: 2026, removed: [], position: [Infinity, 0], savedAt: 1}), false);
});
