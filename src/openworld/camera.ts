import * as THREE from 'three';
import type {TerrainField} from './terrain';
import {ImpactFeedback} from './impact-feedback';

export type CameraMode = 'isometric' | 'third-person';

export class WorldCameraController {
  mode: CameraMode = 'isometric';
  yaw = Math.PI * 0.25; // Classic 45-degree isometric angle
  pitch = Math.PI / 6; // 2:1 pixel-art dimetric projection
  isoZoom = 15; // Half-height of orthographic frustum in world units
  perspDistance = 13;

  readonly isoCamera: THREE.OrthographicCamera;
  readonly perspCamera: THREE.PerspectiveCamera;

  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private targetPos = new THREE.Vector3();
  private desiredCamPos = new THREE.Vector3();
  readonly impact = new ImpactFeedback();
  private shakeOffset = new THREE.Vector3();
  private shakenCamera: THREE.Camera | null = null;

  constructor(domElement: HTMLElement) {
    const aspect = window.innerWidth / window.innerHeight;
    this.isoCamera = new THREE.OrthographicCamera(
      -this.isoZoom * aspect,
      this.isoZoom * aspect,
      this.isoZoom,
      -this.isoZoom,
      0.1,
      300
    );
    this.perspCamera = new THREE.PerspectiveCamera(56, aspect, 0.2, 420);

    domElement.addEventListener('pointerdown', (e) => {
      if (e.button === 0 || e.button === 2) {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      this.yaw -= dx * 0.0065;
      if (this.mode === 'third-person') {
        this.pitch = THREE.MathUtils.clamp(this.pitch + dy * 0.0055, 0.14, 1.25);
      } else {
        this.pitch = Math.PI / 6;
      }
    });

    domElement.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        if (this.mode === 'isometric') {
          this.isoZoom = THREE.MathUtils.clamp(this.isoZoom + e.deltaY * 0.012, 7.5, 32);
          this.resize();
        } else {
          this.perspDistance = THREE.MathUtils.clamp(this.perspDistance + e.deltaY * 0.01, 5.5, 28);
        }
      },
      {passive: false}
    );

    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  get activeCamera(): THREE.Camera {
    return this.mode === 'isometric' ? this.isoCamera : this.perspCamera;
  }

  toggleMode(): CameraMode {
    this.mode = this.mode === 'isometric' ? 'third-person' : 'isometric';
    if (this.mode === 'isometric') {
      this.pitch = Math.PI / 6;
    } else {
      this.pitch = 0.42;
    }
    this.resize();
    return this.mode;
  }

  rotateStep(deltaYaw: number): void {
    this.yaw += deltaYaw;
  }

  resize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.isoCamera.left = -this.isoZoom * aspect;
    this.isoCamera.right = this.isoZoom * aspect;
    this.isoCamera.top = this.isoZoom;
    this.isoCamera.bottom = -this.isoZoom;
    this.isoCamera.updateProjectionMatrix();

    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();
  }

  update(focus: THREE.Vector3, dt: number, terrain: TerrainField): void {
    // Remove last frame's presentation offset before smoothing, including mode switches.
    if (this.shakenCamera) this.shakenCamera.position.sub(this.shakeOffset);
    const lookTarget = new THREE.Vector3(focus.x, focus.y + 1.2, focus.z);
    this.targetPos.lerp(lookTarget, Math.min(1, dt * 11));

    const dist = this.mode === 'isometric' ? 60 : this.perspDistance;
    const horiz = Math.cos(this.pitch) * dist;
    const vert = Math.sin(this.pitch) * dist;

    const camX = this.targetPos.x - Math.sin(this.yaw) * horiz;
    const camZ = this.targetPos.z - Math.cos(this.yaw) * horiz;
    let camY = this.targetPos.y + vert;

    if (this.mode === 'third-person') {
      const minTerrainY = terrain.heightAt(camX, camZ) + 0.9;
      if (camY < minTerrainY) camY = minTerrainY;
    }

    this.desiredCamPos.set(camX, camY, camZ);
    const cam = this.activeCamera;
    cam.position.lerp(this.desiredCamPos, Math.min(1, dt * 14));
    cam.lookAt(this.targetPos);
    const shake = this.impact.advance(dt);
    this.shakeOffset.set(shake.x, shake.y, 0).applyQuaternion(cam.quaternion);
    cam.position.add(this.shakeOffset);
    cam.updateMatrixWorld();
    this.shakenCamera = cam;
  }
}
