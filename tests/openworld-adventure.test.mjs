import test from 'node:test';
import assert from 'node:assert/strict';
import {AdventureSession, ADVENTURE_SAVE_KEY} from '../src/openworld/adventure-session.ts';
import {WORLD_SAVE_KEY} from '../src/openworld/world-save.ts';

const world = {heightAt: () => 0, blocked: () => false, waterLevel: -1};
const point = (x, z, y = 0) => ({x, y, z});
function act(game, target) {
  const player = point(target.x - 2.5, target.z);
  assert.ok(game.beginAction(target, player));
  for (let i = 0; i < 4; i++) game.update(0.1, player, world);
  return game.drainEvents();
}

test('single-player loop: gather, craft, build, fight, save and restore without duplicating rewards', () => {
  const game = new AdventureSession(); game.initialize(world);
  for (const node of game.nodes) {
    const events = act(game, node);
    assert.equal(events.filter(e => e.type === 'harvest').length, 1);
  }
  assert.deepEqual(game.supplies, {wood: 18, stone: 12, gel: 0, food: 7});
  game.craftAxe(); assert.equal(game.axe, true);
  assert.deepEqual([game.supplies.wood, game.supplies.stone], [14, 10]);
  game.craftAxe(); assert.deepEqual([game.supplies.wood, game.supplies.stone], [14, 10]);
  game.build(point(6, -10), point(6, -6), world); assert.ok(game.house);
  assert.deepEqual([game.supplies.wood, game.supplies.stone], [6, 6]);
  game.build(point(6, -10), point(6, -6), world);
  assert.deepEqual([game.supplies.wood, game.supplies.stone], [6, 6]);
  const victims = [...game.creatures.values()].slice(0, 3);
  for (const mob of victims) {act(game, mob); const events = act(game, mob); assert.equal(events.filter(e => e.type === 'kill').length, 1);}
  assert.equal(game.kills, 3); assert.equal(game.supplies.gel, 3);
  game.removed.add('pine_tree:4:8');
  const restored = AdventureSession.restore(JSON.stringify(game.snapshot())); restored.initialize(world);
  assert.deepEqual(restored.supplies, game.supplies); assert.deepEqual(restored.house, game.house);
  assert.equal(restored.kills, 3); assert.equal(restored.nodes.filter(n => n.removed).length, 12);
  assert.ok(restored.removed.has('pine_tree:4:8'));
  for (const mob of victims) assert.equal(restored.creatures.has(mob.id), false);
  assert.equal(restored.beginAction(restored.nodes[0], point(-8, 4)), null);
  assert.notEqual(ADVENTURE_SAVE_KEY, WORLD_SAVE_KEY);
});

test('resources and enemies reject wrong elevation, out-of-range and repeated swings; moving away cancels impact', () => {
  const game = new AdventureSession(); game.initialize(world); const node = game.nodes[0];
  assert.equal(game.beginAction(node, point(node.x + 4, node.z)), null);
  assert.equal(game.beginAction(node, point(node.x + 2, node.z, 2)), null);
  assert.ok(game.beginAction(node, point(node.x + 2, node.z)));
  assert.equal(game.beginAction(node, point(node.x + 2, node.z)), null);
  for (let i = 0; i < 4; i++) game.update(0.1, point(0, 0), world);
  assert.equal(node.removed, false); assert.equal(game.supplies.wood, 0);
  act(game, node); assert.equal(game.supplies.wood, 3);
  game.update(0.1, point(0, 0), world); assert.equal(game.supplies.wood, 3);
});

test('building spends nothing for water, occupied, sloped or distant ground', () => {
  for (const terrain of [
    {...world, waterLevel: 1}, {...world, blocked: () => true},
    {...world, heightAt: x => x > 7 ? 1 : 0}
  ]) {
    const game = new AdventureSession(); game.axe = true; game.supplies.wood = 20; game.supplies.stone = 20;
    game.build(point(6, -10), point(6, -6), terrain);
    assert.equal(game.house, null); assert.deepEqual([game.supplies.wood, game.supplies.stone], [20, 20]);
  }
  const game = new AdventureSession(); game.axe = true; game.supplies.wood = game.supplies.stone = 20;
  game.build(point(40, 40), point(6, -6), world); assert.equal(game.house, null);
});

test('slime telegraphs can be dodged, safe camp takes no damage, death and recovery keep inventory', () => {
  const game = new AdventureSession(); game.initialize(world);
  const mob = game.creatures.get('slime:camp:0');
  const player = point(mob.x + 1, mob.z);
  game.update(0.01, player, world); assert.equal(mob.state, 'windup'); assert.equal(game.hp, 100);
  for (let i = 0; i < 7; i++) game.update(0.1, point(player.x + 5, player.z), world);
  assert.equal(game.hp, 100);
  mob.state = 'windup'; mob.timer = 0.01; mob.aimX = player.x; mob.aimZ = player.z;
  game.update(0.02, player, world); assert.equal(game.hp, 86);
  const other = game.creatures.get('slime:camp:1'); other.x = player.x; other.z = player.z;
  other.state = 'windup'; other.timer = 0.01; other.aimX = player.x; other.aimZ = player.z;
  game.update(0.02, player, world); assert.equal(game.hp, 86, 'invulnerability prevents piled-up damage');
  for (let i = 0; i < 20; i++) game.update(0.1, point(2.4, 2.4), world);
  assert.equal(game.hp, 86);
  game.supplies.wood = 9; game.hp = 0; assert.equal(game.dead, true);
  assert.equal(game.beginAction(game.nodes[0], game.nodes[0]), null);
  assert.deepEqual(game.respawn(), [2.4, 2.4]); assert.equal(game.hp, 100); assert.equal(game.supplies.wood, 9);
  game.hp = 30; game.heal(point(10, 10)); assert.equal(game.hp, 65); assert.equal(game.supplies.food, 2);
  game.house = point(8, -10); game.heal(point(8, -6)); assert.equal(game.hp, 100); assert.equal(game.supplies.food, 2);
});

test('malformed saves start clean; dead saves restore honestly; exploration streams creatures without resurrecting kills', () => {
  for (const raw of ['{', '{}', JSON.stringify({version: 1, hp: -10})]) assert.equal(AdventureSession.restore(raw).hp, 100);
  const game = new AdventureSession(); game.initialize(world); game.hp = 0;
  assert.equal(AdventureSession.restore(JSON.stringify(game.snapshot())).hp, 0);
  game.respawn(); game.killed.add('slime:camp:0'); game.creatures.delete('slime:camp:0');
  for (let x = 0; x < 1000; x += 36) game.update(0.05, point(x, 0), world);
  assert.ok(game.creatures.size < 40);
  game.update(0.05, point(2.4, 2.4), world);
  assert.equal(game.creatures.has('slime:camp:0'), false);
});
