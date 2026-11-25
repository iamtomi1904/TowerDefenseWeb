import test from 'node:test';
import assert from 'node:assert/strict';
import {ImpactFeedback, withinHarvestReach} from '../src/openworld/impact-feedback.ts';

test('harvest rejects distant targets, other terraces and airborne reach', () => {
  assert.equal(withinHarvestReach(0, 1, 0, 3.5, 1.5, 0), true);
  assert.equal(withinHarvestReach(0, 1, 0, 3.7, 1, 0), false);
  assert.equal(withinHarvestReach(0, 1, 0, 1, 2, 0), false);
  assert.equal(withinHarvestReach(0, 4, 0, 1, 1, 0), false);
});

test('camera impulse is bounded and returns exactly to zero at all frame rates', () => {
  for (const dt of [1 / 144, 1 / 60, 0.05, 0.3]) {
    const effect = new ImpactFeedback(); effect.trigger(10);
    for (let i = 0; i < 100; i++) {
      const offset = effect.advance(dt);
      assert.ok(Math.abs(offset.x) <= 0.12 && Math.abs(offset.y) <= 0.066);
    }
    assert.deepEqual(effect.advance(0), {x: 0, y: 0});
    effect.trigger(); effect.advance(0.01); effect.reset();
    assert.deepEqual(effect.advance(0), {x: 0, y: 0});
  }
});
