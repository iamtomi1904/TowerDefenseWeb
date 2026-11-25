import * as THREE from 'three';
import {createRng} from './noise';
import type {PropKind} from './presets';

interface Particle {position: THREE.Vector3; velocity: THREE.Vector3; color: THREE.Color; life: number; total: number; size: number; gravity: number}
interface Slash {mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>; life: number; direction: THREE.Vector3}

/** A bounded pool of world-space pixel particles, shared by all transient action effects. */
export class ActionEffects {
  readonly root = new THREE.Group();
  private particles: Particle[] = [];
  private slashes: Slash[] = [];
  private rng = createRng(93471);
  private mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true
  }), 512);
  private dummy = new THREE.Object3D();
  private lastStep = new THREE.Vector3();
  private stepReady = false;
  private wasGrounded = true;
  private sparkleTime = 0;
  private slashTexture: THREE.CanvasTexture;

  constructor() {
    this.mesh.count = 0; this.mesh.frustumCulled = false; this.mesh.layers.set(1);
    this.root.add(this.mesh);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const distance = Math.hypot(x - 14, y - 19);
      if (distance < 14 && distance > 10 && x > y * 0.36 && y < 25) {
        ctx.fillStyle = distance > 12.5 ? '#f9b64c' : '#fff7d1'; ctx.fillRect(x, y, 1, 1);
      }
    }
    this.slashTexture = new THREE.CanvasTexture(canvas);
    this.slashTexture.magFilter = this.slashTexture.minFilter = THREE.NearestFilter;
    this.slashTexture.colorSpace = THREE.SRGBColorSpace;
  }

  reset(): void {
    this.particles.length = 0; this.mesh.count = 0; this.stepReady = false; this.wasGrounded = true;
    for (const slash of this.slashes) {this.root.remove(slash.mesh); slash.mesh.geometry.dispose(); slash.mesh.material.dispose();}
    this.slashes.length = 0;
  }

  private emit(x: number, y: number, z: number, color: string, size: number, vx: number, vy: number, vz: number, life: number, gravity = 5): void {
    if (this.particles.length >= 512) return;
    this.particles.push({position: new THREE.Vector3(x, y, z), velocity: new THREE.Vector3(vx, vy, vz),
      color: new THREE.Color(color), life, total: life, size, gravity});
  }

  swing(x: number, y: number, z: number, direction = new THREE.Vector3(1, 0, 0)): void {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), new THREE.MeshBasicMaterial({
      map: this.slashTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, toneMapped: false, forceSinglePass: true
    }));
    mesh.position.set(x, y + 0.9, z); mesh.layers.set(1);
    this.root.add(mesh); this.slashes.push({mesh, life: 0.24, direction: direction.clone().normalize()});
  }

  impact(x: number, y: number, z: number, kind: PropKind): void {
    // Short radial glint at the actual contact; debris remains material-specific.
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      this.emit(x, y + 0.9, z, '#fff3c4', i % 2 ? 0.10 : 0.16,
        Math.cos(angle) * 4, Math.sin(angle) * 4, 0, 0.10, 0);
    }
    const stone = kind === 'boulder' || kind === 'ruin_pillar';
    const slime = kind === 'blue_slime';
    const colors = stone ? ['#d8d9ca', '#9fa7a5', '#f7e6bc'] : slime ? ['#4ccae0', '#a8f2ec', '#2797bd'] : ['#a6dc5d', '#5ba74a', '#b8864f'];
    for (let i = 0; i < 24; i++) {
      const angle = this.rng() * Math.PI * 2, speed = 0.8 + this.rng() * 2.5;
      this.emit(x, y + 0.5 + this.rng() * 1.1, z, colors[i % 3], 0.07 + this.rng() * 0.11,
        Math.cos(angle) * speed, 1.3 + this.rng() * 3, Math.sin(angle) * speed, 0.35 + this.rng() * 0.55, 7);
    }
    this.ring(x, y + 0.08, z, stone ? '#e9d8af' : slime ? '#80dfeb' : '#d8cf91', 0.7, 12);
  }

  private ring(x: number, y: number, z: number, color: string, speed: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2;
      this.emit(x + Math.cos(a) * 0.25, y, z + Math.sin(a) * 0.25, color, 0.09,
        Math.cos(a) * speed, 0.1, Math.sin(a) * speed, 0.35, 0);
    }
  }

  trackPlayer(position: THREE.Vector3, grounded: boolean, water: boolean, waterY = position.y): void {
    const surfaceY = water ? Math.max(position.y, waterY) : position.y;
    if (!this.stepReady) {this.lastStep.copy(position); this.stepReady = true;}
    if (!this.wasGrounded && grounded) this.ring(position.x, surfaceY + 0.06, position.z, water ? '#b1e8db' : '#d9d0ab', 2.6, 20);
    const distance = Math.hypot(position.x - this.lastStep.x, position.z - this.lastStep.z);
    if (distance > 0.85 && grounded) {
      if (distance < 4) {
        if (water) this.ring(position.x, surfaceY + 0.09, position.z, '#90d6dc', 0.8, 8);
        else for (let i = 0; i < 3; i++) this.emit(position.x + (this.rng() - 0.5) * 0.3, position.y + 0.05, position.z,
          '#c4c09b', 0.08 + this.rng() * 0.06, (this.rng() - 0.5) * 0.6, 0.4, (this.rng() - 0.5) * 0.6, 0.28, 0.3);
      }
      this.lastStep.copy(position);
    }
    this.wasGrounded = grounded;
  }

  update(dt: number, camera: THREE.Camera, crystal: THREE.Vector3): void {
    this.sparkleTime += dt;
    if (this.sparkleTime > 0.12) {
      this.sparkleTime = 0;
      this.emit(crystal.x + (this.rng() - 0.5) * 0.7, crystal.y, crystal.z + (this.rng() - 0.5) * 0.7,
        this.rng() > 0.5 ? '#ffe5a6' : '#f6b950', 0.055, 0, 0.5 + this.rng() * 0.3, 0, 0.65, 0);
    }
    camera.getWorldQuaternion(this.dummy.quaternion);
    let count = 0;
    for (const particle of this.particles) {
      particle.life -= dt;
      if (particle.life <= 0) continue;
      particle.velocity.y -= particle.gravity * dt;
      particle.position.addScaledVector(particle.velocity, dt);
      this.dummy.position.copy(particle.position);
      this.dummy.scale.setScalar(particle.size * Math.min(1, particle.life / particle.total * 2));
      this.dummy.updateMatrix(); this.mesh.setMatrixAt(count, this.dummy.matrix); this.mesh.setColorAt(count, particle.color);
      this.particles[count++] = particle;
    }
    this.particles.length = count; this.mesh.count = count;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const slash = this.slashes[i]; slash.life -= dt;
      if (slash.life <= 0) {
        this.root.remove(slash.mesh); slash.mesh.geometry.dispose(); slash.mesh.material.dispose(); this.slashes.splice(i, 1);
      } else {
        camera.getWorldQuaternion(slash.mesh.quaternion);
        const localDirection = slash.direction.clone().applyQuaternion(slash.mesh.quaternion.clone().invert());
        slash.mesh.rotateZ(Math.atan2(localDirection.y, localDirection.x));
        slash.mesh.material.opacity = Math.min(1, slash.life * 7);
        slash.mesh.scale.setScalar(1.2 - slash.life);
      }
    }
  }
}
