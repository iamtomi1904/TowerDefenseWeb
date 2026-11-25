import * as THREE from 'three';
import {createExplorerFrames, type PixelSpriteFrame} from './pixel-sprites';
import {createLitSpriteMaterial, createSpriteShadowMaterial, projectSpriteShadow, SPRITE_LIGHT_LAYER} from './sprite-lighting';
import type {CharacterPreset} from './presets';
import type {Collider} from './props';
import type {TerrainField} from './terrain';
import type {AvatarId} from './sprite-assets';

export class ExplorerCharacter {
  readonly root = new THREE.Group();
  readonly preset: CharacterPreset;

  private sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private frames: PixelSpriteFrame[][];
  private attackFrames: PixelSpriteFrame[][];
  private runFrames: PixelSpriteFrame[][];
  private hitFrames: PixelSpriteFrame[][];
  private hitTime = 0;
  private actionTime = 0;
  private impactPause = 0;
  private shadowMesh: THREE.Mesh;
  private castShadowMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private shadowSourceMatrix = new THREE.Matrix4();
  private groundY = 0;

  velocityY = 0;
  grounded = true;
  isSprinting = false;
  isWading = false;
  speed = 0;
  private animTime = 0;
  private facingAngle = 0;

  constructor(preset: CharacterPreset, avatar: AvatarId = 'hooded') {
    this.preset = preset;
    this.root.name = 'pixel-explorer';
    this.frames = createExplorerFrames(preset.colors, 'walk', avatar);
    this.attackFrames = createExplorerFrames(preset.colors, 'attack', avatar);
    this.runFrames = createExplorerFrames(preset.colors, 'run', avatar);
    this.hitFrames = createExplorerFrames(preset.colors, 'hit', avatar);
    const geometry = new THREE.PlaneGeometry(3.0, 3.0);
    geometry.translate(0, 1.5 - 10 / 64 * 3.0, 0); // 64px frame, common foot pivot at row 54.
    this.sprite = new THREE.Mesh(geometry, createLitSpriteMaterial(this.frames[0][0].map, this.frames[0][0].normalMap));
    this.sprite.layers.set(SPRITE_LIGHT_LAYER);
    this.sprite.receiveShadow = true;
    this.root.add(this.sprite);
    this.shadowMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.48, 16),
      new THREE.MeshBasicMaterial({color: '#0e1a12', transparent: true, opacity: 0.36, depthWrite: false})
    );
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = 0.03;
    this.root.add(this.shadowMesh);
    this.castShadowMesh = new THREE.Mesh(geometry, createSpriteShadowMaterial(this.frames[0][0].map));
    this.castShadowMesh.matrixAutoUpdate = false;
    this.root.add(this.castShadowMesh);
  }

  faceCamera(camera: THREE.Camera): void {
    camera.getWorldQuaternion(this.sprite.quaternion);
    const towardCamera = Math.atan2(camera.position.x - this.root.position.x, camera.position.z - this.root.position.z);
    const relative = this.facingAngle - towardCamera;
    const front = Math.cos(relative);
    const direction = front > 0.55 ? 0 : front < -0.55 ? 2 : 1;
    const frame = this.hitTime > 0 ? Math.min(3, Math.floor((1 - this.hitTime / 0.32) * 4))
      : this.actionTime > 0 ? Math.min(3, Math.floor((1 - this.actionTime / 0.28) * 4))
      : this.grounded && this.speed > 0.4 ? Math.floor(this.animTime) % 4 : 0;
    const textures = (this.hitTime > 0 ? this.hitFrames : this.actionTime > 0 ? this.attackFrames : this.isSprinting ? this.runFrames : this.frames)[direction][frame];
    this.sprite.material.map = textures.map;
    this.sprite.material.userData.spriteNormalMap = textures.normalMap;
    if (this.sprite.material.normalMap) this.sprite.material.normalMap = textures.normalMap;
    this.castShadowMesh.material.map = textures.map;
    this.sprite.scale.x = direction === 1 && Math.sin(relative) < 0 ? -1 : 1;
  }

  get isActing(): boolean {return this.actionTime > 0;}
  playHitAnimation(): void {this.hitTime = 0.32;} // Presentation hook; does not decide damage/HP.
  pauseOnImpact(): void {this.impactPause = 0.045;}
  beginAction(target: THREE.Vector3): void {
    this.actionTime = 0.28;
    this.facingAngle = Math.atan2(target.x - this.root.position.x, target.z - this.root.position.z);
  }

  updateSpriteShadow(toLight: THREE.Vector3, opacity: number): void {
    this.sprite.updateMatrix();
    this.shadowSourceMatrix.copy(this.sprite.matrix);
    const heightAboveGround = this.root.position.y - this.groundY;
    const e = this.shadowSourceMatrix.elements;
    e[12] -= toLight.x / Math.max(0.25, toLight.y) * heightAboveGround;
    e[14] -= toLight.z / Math.max(0.25, toLight.y) * heightAboveGround;
    projectSpriteShadow(this.shadowSourceMatrix, toLight, this.castShadowMesh.matrix, -heightAboveGround);
    this.castShadowMesh.matrixWorldNeedsUpdate = true;
    this.castShadowMesh.material.opacity = opacity;
    this.castShadowMesh.visible = opacity > 0.005;
  }

  dispose(): void {
    this.sprite.geometry.dispose();
    this.sprite.material.dispose();
    this.castShadowMesh.material.dispose();
    this.shadowMesh.geometry.dispose();
    (this.shadowMesh.material as THREE.Material).dispose();
    for (const frames of [this.frames, this.attackFrames, this.runFrames, this.hitFrames]) for (const direction of frames) for (const frame of direction) {frame.map.dispose(); frame.normalMap.dispose();}
  }

  placeAt(x: number, z: number, terrain: TerrainField): void {
    const y = terrain.heightAt(x, z);
    this.root.position.set(x, y, z);
    this.groundY = y;
    this.velocityY = 0;
    this.grounded = true;
  }

  update(
    dt: number,
    moveInput: THREE.Vector2,
    cameraYaw: number,
    sprint: boolean,
    jumpPressed: boolean,
    terrain: TerrainField,
    colliders: Collider[]
  ): void {
    const p = this.preset;
    const animationDt = Math.max(0, dt - this.impactPause);
    this.impactPause = Math.max(0, this.impactPause - dt);
    this.actionTime = Math.max(0, this.actionTime - animationDt);
    this.hitTime = Math.max(0, this.hitTime - dt);
    const hasMove = moveInput.lengthSq() > 0.001;
    this.isSprinting = sprint && hasMove;
    const targetSpeed = hasMove ? (this.isSprinting ? p.sprintSpeed : p.walkSpeed) * (this.isActing ? 0.35 : 1) : 0;

    this.speed = THREE.MathUtils.lerp(this.speed, targetSpeed, Math.min(1, dt * 12));

    let nextX = this.root.position.x;
    let nextZ = this.root.position.z;

    if (hasMove) {
      const inputAngle = Math.atan2(moveInput.x, moveInput.y);
      const worldAngle = cameraYaw + inputAngle;

      let diff = worldAngle - this.facingAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facingAngle += diff * Math.min(1, dt * p.turnSpeed);


      nextX += Math.sin(worldAngle) * this.speed * dt;
      nextZ += Math.cos(worldAngle) * this.speed * dt;
    }

    // Stepped cliff guard: allow stairs/gentle steps or jumping, block tall cliffs
    const candidateGroundY = terrain.heightAt(nextX, nextZ);
    const maxStepUp = 0.48;
    if (candidateGroundY > this.root.position.y + maxStepUp) {
      const tryX = terrain.heightAt(nextX, this.root.position.z) <= this.root.position.y + maxStepUp;
      const tryZ = terrain.heightAt(this.root.position.x, nextZ) <= this.root.position.y + maxStepUp;
      if (tryX) nextZ = this.root.position.z;
      else if (tryZ) nextX = this.root.position.x;
      else {
        nextX = this.root.position.x;
        nextZ = this.root.position.z;
      }
    }

    // Prop circle colliders
    for (const c of colliders) {
      const dx = nextX - c.x;
      const dz = nextZ - c.z;
      const minDist = p.colliderRadius + c.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < minDist * minDist && d2 > 1e-6) {
        const d = Math.sqrt(d2);
        const push = (minDist - d) / d;
        nextX += dx * push;
        nextZ += dz * push;
      }
    }

    this.root.position.x = nextX;
    this.root.position.z = nextZ;

    const groundY = terrain.heightAt(nextX, nextZ);
    this.groundY = groundY;
    if (jumpPressed && this.grounded) {
      this.velocityY = p.jumpVelocity;
      this.grounded = false;
    }

    if (!this.grounded) {
      this.velocityY -= p.gravity * dt;
      this.root.position.y += this.velocityY * dt;
      if (this.root.position.y <= groundY) {
        this.root.position.y = groundY;
        this.velocityY = 0;
        this.grounded = true;
      }
    } else {
      this.root.position.y = groundY;
    }

    this.isWading = this.root.position.y < terrain.preset.waterLevel + 0.05;

    const heightAboveGround = Math.max(0, this.root.position.y - groundY);
    this.shadowMesh.position.y = groundY - this.root.position.y + 0.03;
    this.shadowMesh.scale.setScalar(Math.max(0.45, 1 - heightAboveGround * 0.14));

    this.animate(animationDt);
  }

  private animate(dt: number): void {
    const moving = this.speed > 0.4;
    this.animTime += dt * (moving ? (this.isSprinting ? 14 : 9) : 2.4);
    this.sprite.position.y = this.grounded && moving ? Math.abs(Math.sin(this.animTime * Math.PI / 2)) * 0.08 : 0;
  }
}
