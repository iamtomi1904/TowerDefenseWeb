import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';

const directory = new URL('../public/openworld-art/v2/', import.meta.url);
async function pixels(name) {
  return sharp(Buffer.from(await readFile(new URL(name + '.png', directory)))).ensureAlpha().raw().toBuffer({resolveWithObject: true});
}

test('both avatars have 48 populated frames with transparent margins and no clipped axe or feet', async () => {
  for (const id of ['human', 'hooded']) for (const action of ['', '-run']) {
    const {data, info} = await pixels(id + action);
    assert.equal(info.width, 256); assert.equal(info.height, action ? 192 : 576);
    for (let row = 0; row < info.height / 64; row++) for (let col = 0; col < 4; col++) {
      let minX = 64, minY = 64, maxX = -1, maxY = -1, count = 0, foot = false;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
        const alpha = data[((row * 64 + y) * info.width + col * 64 + x) * 4 + 3];
        assert.ok(alpha === 0 || alpha === 255);
        if (!alpha) continue;
        minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); count++;
        if (x >= 22 && x <= 42 && y >= 52 && y <= 55) foot = true;
      }
      const label = `${id}${action} row ${row} col ${col}`;
      assert.ok(count > 100, `${label}: missing pose`);
      assert.ok(minX > 0 && minY > 0 && maxX < 63 && maxY < 63, `${label}: clipped frame (${minX},${minY})-(${maxX},${maxY})`);
      assert.ok(foot, `${label}: missing registered foot anchor`);
    }
  }
});

test('normal maps match albedo dimensions and encode unit-length front-facing tangent vectors', async () => {
  for (const name of ['pine', 'human', 'hooded', 'human-run', 'hooded-run']) {
    const albedo = await pixels(name), normal = await pixels(name + '-normal');
    assert.equal(albedo.info.width, normal.info.width); assert.equal(albedo.info.height, normal.info.height);
    for (let i = 0; i < normal.data.length; i += 4) {
      const n = [normal.data[i], normal.data[i + 1], normal.data[i + 2]].map(value => value / 255 * 2 - 1);
      assert.ok(Math.abs(Math.hypot(...n) - 1) < 0.015);
      assert.ok(n[2] > 0);
    }
  }
});

test('the added human and dedicated run cycles remain distinct from the retained hooded/walk assets', async () => {
  const human = await pixels('human'), hooded = await pixels('hooded');
  assert.notDeepEqual(human.data, hooded.data);
  for (const id of ['human', 'hooded']) {
    const walk = await pixels(id), run = await pixels(id + '-run');
    assert.notDeepEqual(run.data, walk.data.subarray(0, run.data.length));
  }
  const tree = await pixels('pine');
  assert.equal(tree.info.width, 64); assert.equal(tree.info.height, 96);
  assert.ok(tree.data.some((value, i) => i % 4 === 3 && value === 0));
  assert.ok(tree.data.some((value, i) => i % 4 === 3 && value === 255));
});
