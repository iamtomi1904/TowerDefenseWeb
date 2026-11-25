import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {paintSpriteNormals, createSpriteNormalTexture, createLitSpriteMaterial, applySpriteNormalMapping, projectSpriteShadow} from '../src/openworld/sprite-lighting.ts';

test('normal data has distinct rounded and stone face directions with matching pixel dimensions', () => {
  const grid = ['.LLLL.', '.GGGG.', '.bBbB.', '.CcSs.'];
  const {width, height, data} = paintSpriteNormals(grid);
  assert.equal(width, 6); assert.equal(height, 4);
  const at = (x, y) => [...data.slice((y * width + x) * 4, (y * width + x) * 4 + 3)].map(v => v / 255 * 2 - 1);
  assert.ok(at(1, 0)[0] < 0 && at(4, 0)[0] > 0, 'canopy sides face opposite horizontal directions');
  assert.ok(at(1, 0)[1] > 0, 'canopy top faces upward');
  assert.ok(Math.abs(at(2, 2)[1]) < 0.01, 'trunk is cylindrical');
  assert.ok(at(1, 3)[0] < 0 && at(4, 3)[0] > 0, 'stone faces differ');
  for (let i = 0; i < data.length; i += 4) {
    const vector = new THREE.Vector3(...[...data.slice(i, i + 3)].map(v => v / 255 * 2 - 1));
    assert.ok(Math.abs(vector.length() - 1) < 0.012);
  }
  const texture = createSpriteNormalTexture(grid);
  assert.equal(texture.colorSpace, THREE.NoColorSpace);
  assert.equal(texture.flipY, true);
  assert.equal(texture.magFilter, THREE.NearestFilter);
  texture.dispose();
});

test('flat/normal comparison switches only normal vectors and can restore a newly selected frame', () => {
  const map = new THREE.Texture();
  const normal = createSpriteNormalTexture(['GG']);
  const material = createLitSpriteMaterial(map, normal);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(), material);
  applySpriteNormalMapping(mesh, false);
  assert.equal(material.normalMap, null); assert.equal(material.map, map);
  const next = createSpriteNormalTexture(['gg']);
  material.userData.spriteNormalMap = next;
  applySpriteNormalMapping(mesh, true);
  assert.equal(material.normalMap, next);
  mesh.geometry.dispose(); material.dispose(); map.dispose(); normal.dispose(); next.dispose();
});

test('sprite silhouette shadow stays grounded and reverses with the light; harvested sprites stay hidden', () => {
  const source = new THREE.Matrix4().makeTranslation(10, 2, -4);
  const projected = new THREE.Matrix4();
  const tip = new THREE.Vector3(0, 3, 0);
  for (const lightX of [-1, 1]) {
    projectSpriteShadow(source, new THREE.Vector3(lightX, 1, 0), projected);
    const anchor = new THREE.Vector3(0, 0, 0).applyMatrix4(projected);
    const shadowTip = tip.clone().applyMatrix4(projected);
    assert.ok(Math.abs(anchor.y - 2.045) < 1e-8);
    assert.ok(Math.abs(shadowTip.y - anchor.y) < 1e-8);
    assert.equal(Math.sign(shadowTip.x - anchor.x), -Math.sign(lightX));
    assert.ok(projected.elements.every(Number.isFinite));
  }
  projectSpriteShadow(new THREE.Matrix4().makeScale(0, 0, 0), new THREE.Vector3(1, 1, 0), projected);
  assert.deepEqual(projected.elements, new THREE.Matrix4().makeScale(0, 0, 0).elements);
});
