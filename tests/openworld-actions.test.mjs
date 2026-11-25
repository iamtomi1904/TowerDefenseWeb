import test from 'node:test';
import assert from 'node:assert/strict';
import {ActionClock} from '../src/openworld/actions.ts';

test('repeated clicks do not reset a pending impact or produce duplicate resource commits', () => {
  const clock = new ActionClock(0.22);
  const resource = {kind: 'pine_tree', reward: 2};
  assert.equal(clock.start('tree:1:2', resource), true);
  assert.equal(clock.start('tree:1:2', {kind: 'pine_tree', reward: 200}), false);
  assert.deepEqual(clock.advance(0.1).completed, []);
  assert.equal(clock.start('tree:1:2', resource), false);
  assert.deepEqual(clock.advance(0.12).completed, [resource]);
  assert.deepEqual(clock.advance(1).completed, []);
});

test('impact completes once at both fast and slow frame rates', () => {
  for (const step of [1 / 144, 1 / 60, 0.05, 0.3]) {
    const clock = new ActionClock(0.22); clock.start('stone', 'stone');
    const commits = [];
    for (let i = 0; i < 200; i++) {
      const update = clock.advance(step);
      assert.ok(update.active.every(a => a.progress >= 0 && a.progress < 1));
      commits.push(...update.completed);
    }
    assert.deepEqual(commits, ['stone']);
  }
});

test('unloading a target cancels its pending effect and prevents a late reward', () => {
  const clock = new ActionClock();
  clock.start('unloaded', 'wood'); clock.start('visible', 'stone');
  clock.advance(0.1); clock.cancel('unloaded');
  assert.deepEqual(clock.advance(0.2).completed, ['stone']);
});
