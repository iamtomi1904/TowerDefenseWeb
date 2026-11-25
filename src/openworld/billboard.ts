import * as THREE from 'three';

/** Rotate each card around its ground anchor, preserving placement, scale and harvested state. */
export function faceInstancesToCamera(mesh: THREE.InstancedMesh, rotation: THREE.Quaternion): void {
  const previous = mesh.userData.billboardRotation as THREE.Quaternion | undefined;
  if (previous && 1 - Math.abs(previous.dot(rotation)) < 1e-8) return;
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const oldRotation = new THREE.Quaternion();
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, matrix);
    // Zero-scaled harvested instances must stay hidden when rotating the camera.
    scale.setFromMatrixScale(matrix);
    if (scale.lengthSq() === 0) continue;
    matrix.decompose(position, oldRotation, scale);
    matrix.compose(position, rotation, scale);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.userData.billboardRotation = rotation.clone();
}
