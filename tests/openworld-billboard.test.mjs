import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {faceInstancesToCamera} from '../src/openworld/billboard.ts';

test('camera rotation preserves prop anchors, scale and hidden harvested instances', () => {
  const geometry = new THREE.PlaneGeometry(2, 4).translate(0, 2, 0);
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.InstancedMesh(geometry, material, 2);
  const anchor = new THREE.Vector3(-19, 3.4, 71);
  const scale = new THREE.Vector3(1.2, 1.2, 1.2);
  mesh.setMatrixAt(0, new THREE.Matrix4().compose(anchor, new THREE.Quaternion(), scale));
  mesh.setMatrixAt(1, new THREE.Matrix4().makeScale(0, 0, 0));
  const matrix = new THREE.Matrix4();
  for (const yaw of [0, Math.PI / 4, Math.PI, -Math.PI / 2]) {
    const camera = new THREE.OrthographicCamera();
    camera.position.set(Math.sin(yaw) * 60, 30, Math.cos(yaw) * 60);
    camera.lookAt(0, 0, 0);
    faceInstancesToCamera(mesh, camera.quaternion);
    mesh.getMatrixAt(0, matrix);
    const actualAnchor = new THREE.Vector3();
    const actualRotation = new THREE.Quaternion();
    const actualScale = new THREE.Vector3();
    matrix.decompose(actualAnchor, actualRotation, actualScale);
    assert.ok(actualAnchor.distanceTo(anchor) < 1e-5);
    assert.ok(actualScale.distanceTo(scale) < 1e-5);
    assert.ok(1 - Math.abs(actualRotation.dot(camera.quaternion)) < 1e-6);
    mesh.getMatrixAt(1, matrix);
    assert.deepEqual(matrix.elements, new THREE.Matrix4().makeScale(0, 0, 0).elements);
    assert.ok(Number.isFinite(mesh.boundingSphere.radius));
  }
  mesh.dispose(); geometry.dispose(); material.dispose();
});
