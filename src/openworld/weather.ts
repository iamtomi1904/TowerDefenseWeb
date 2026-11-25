import * as THREE from 'three';
import {createRng} from './noise';

/** World-space streaks, rendered through the same low-resolution pass as the world. */
export class PixelRain {
  readonly root: THREE.LineSegments;
  private positions = new Float32Array(420 * 6);
  private rng = createRng(4831);

  constructor() {
    for (let i = 0; i < this.positions.length; i += 6) {
      this.positions[i] = (this.rng() - 0.5) * 60;
      this.positions[i + 1] = this.rng() * 24 - 4;
      this.positions[i + 2] = (this.rng() - 0.5) * 60;
      this.endPoint(i);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.root = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({
      color: '#a1c4dc', transparent: true, opacity: 0.32, depthWrite: false
    }));
    this.root.frustumCulled = false;
    this.root.visible = false;
  }

  private endPoint(i: number): void {
    this.positions[i + 3] = this.positions[i] - 0.12;
    this.positions[i + 4] = this.positions[i + 1] + 0.65;
    this.positions[i + 5] = this.positions[i + 2];
  }

  update(dt: number, focus: THREE.Vector3): void {
    if (!this.root.visible) return;
    this.root.position.copy(focus);
    for (let i = 0; i < this.positions.length; i += 6) {
      this.positions[i] += dt * 2;
      this.positions[i + 1] -= dt * 17;
      if (this.positions[i + 1] < -4) {
        this.positions[i] = (this.rng() - 0.5) * 60;
        this.positions[i + 1] += 24;
      }
      this.endPoint(i);
    }
    this.root.geometry.attributes.position.needsUpdate = true;
  }
}
