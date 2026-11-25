import * as THREE from 'three';
import {AdventureSession, type AdventureWorld, type Point} from './adventure-session';
import {getPixelSpriteTexture, getPixelSpriteNormalTexture} from './pixel-sprites';
import {createLitSpriteMaterial, SPRITE_LIGHT_LAYER} from './sprite-lighting';
import {buildPropTemplate, type Collider} from './props';
import type {TerrainField} from './terrain';
import type {ExplorerCharacter} from './character';
import type {ActionEffects} from './effects';
import type {WorldCameraController} from './camera';

interface Context {player(): ExplorerCharacter; colliders(): Collider[]; save(): void; toast(text: string): void; harvest(point: Point): Point | null}
interface MobView {root: THREE.Group; sprite: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>; bar: THREE.Group; fill: THREE.Mesh; ring: THREE.Mesh}
const $ = (id: string) => document.getElementById(id)!;
const put = (id: string, value: string) => {const el = $(id); if (el.textContent !== value) el.textContent = value;};

/** The playable mode uses the same art/world engine while keeping the preview's tools intact. */
export class AdventureController {
  readonly root = new THREE.Group();
  paused = true;
  building = false;
  private started = false;
  private destination: Point | null = null;
  private travelTime = 0;
  private nodeViews = new Map<string, THREE.Group>();
  private mobViews = new Map<string, MobView>();
  private houseView: THREE.Group | null = null;
  private homeMarker: THREE.Mesh;
  private buttons: AbortController = new AbortController();
  readonly world: AdventureWorld;

  constructor(readonly session: AdventureSession, private field: TerrainField, private context: Context) {
    this.world = {heightAt: (x, z) => field.heightAt(x, z), waterLevel: field.preset.waterLevel,
      blocked: (x, z, r) => [...context.colliders(), ...this.getColliders()].some(c => Math.hypot(x - c.x, z - c.z) < r + c.radius)};
    session.initialize(this.world);
    this.root.name = 'adventure-gameplay';
    this.homeMarker = new THREE.Mesh(new THREE.RingGeometry(4.7, 4.85, 48), new THREE.MeshBasicMaterial({color: '#f6d07a', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide}));
    this.homeMarker.rotation.x = -Math.PI / 2; this.homeMarker.position.y = field.heightAt(0, 0) + 0.04;
    this.root.add(this.homeMarker);
    for (const node of session.nodes) {
      const root = new THREE.Group(); root.position.set(node.x, node.y, node.z);
      const template = buildPropTemplate(node.kind, {kind: node.kind, density: 0, minHeight: -99, maxHeight: 99, maxSlope: 1, minSpacing: 1, scaleRange: [1, 1], colliderRadius: 0.65});
      for (const part of template.parts) {
        if (part.groundShadow) {part.material.dispose(); continue;}
        const mesh = new THREE.Mesh(part.geometry, part.material);
        mesh.userData.billboard = !!part.billboard;
        if (part.billboard) mesh.layers.set(SPRITE_LIGHT_LAYER);
        root.add(mesh);
      }
      root.visible = !node.removed; this.root.add(root); this.nodeViews.set(node.id, root);
    }
    const on = (id: string, action: () => void) => $(id).addEventListener('click', action, {signal: this.buttons.signal});
    on('play-adventure', () => {
      if (session.dead) {
        const [x, z] = session.respawn(); context.player().placeAt(x, z, field); context.save();
      }
      this.started = true; this.paused = false; $('adventure-menu').hidden = true;
    });
    on('pause-adventure', () => this.togglePause());
    on('craft-axe', () => this.craft());
    on('build-house', () => this.toggleBuild());
    on('heal-player', () => this.heal());
    on('save-adventure', () => {context.save(); context.toast('Đã yêu cầu lưu hành trình. Xem trạng thái lưu bên dưới.');});
    this.renderHud(context.player().root.position);
  }
  togglePause(): void {
    if (!this.started || this.session.dead) return;
    this.paused = !this.paused;
    this.destination = null;
    $('adventure-menu').hidden = !this.paused;
    put('menu-title', 'Nghỉ chân bên hành trình');
    put('menu-description', 'Thế giới đang tạm dừng. Tiến trình được lưu riêng cho chế độ phiêu lưu trên trình duyệt này.');
    put('play-adventure', 'Tiếp tục phiêu lưu');
    if (this.paused) this.context.save();
  }
  craft(): void {if (!this.paused) {this.context.toast(this.session.craftAxe()); this.context.save();}}
  toggleBuild(): void {
    if (this.paused) return;
    if (this.session.house) {this.context.toast('Bạn đã có nhà. Về gần nhà và bấm H để nghỉ ngơi.'); return;}
    if (!this.session.axe || this.session.supplies.wood < 8 || this.session.supplies.stone < 4) {this.context.toast('Cần rìu tốt, 8 gỗ và 4 đá.'); return;}
    this.building = !this.building;
    this.destination = null;
    this.context.toast(this.building ? 'Chọn đất trống để dựng nhà. Bấm B để hủy.' : 'Đã hủy đặt nhà.');
  }
  heal(): void {if (!this.paused) {this.context.toast(this.session.heal(this.context.player().root.position)); this.context.save();}}
  getColliders(): Collider[] {
    const colliders = this.session.nodes.filter(n => !n.removed && n.kind !== 'mushroom').map(n => ({x: n.x, z: n.z, radius: n.kind === 'boulder' ? 0.8 : 0.65}));
    if (this.session.house) colliders.push({x: this.session.house.x, z: this.session.house.z, radius: 2.15});
    return colliders;
  }
  click(point: Point, effects: ActionEffects, arrived = false): boolean {
    if (this.paused || this.session.dead) return true;
    const player = this.context.player();
    if (this.building) {
      const target = {x: Math.floor(point.x / 2) * 2 + 1, y: 0, z: Math.floor(point.z / 2) * 2 + 1}; target.y = this.field.heightAt(target.x, target.z);
      this.context.toast(this.session.build(target, player.root.position, this.world));
      if (this.session.house) {this.building = false; this.context.save();}
      return true;
    }
    if (this.session.acting) return true;
    const target = this.session.beginAction(point, player.root.position) ?? this.context.harvest(point);
    if (!target) {
      if (!arrived && Math.hypot(point.x - player.root.position.x, point.z - player.root.position.z) > 2.7) {
        const candidates = [...this.session.nodes.filter(n => !n.removed), ...[...this.session.creatures.values()].filter(m => m.hp > 0)];
        this.destination = candidates.find(n => Math.hypot(n.x - point.x, n.z - point.z) < 2.1) ?? {...point};
        this.travelTime = 0;
      }
      return true;
    }
    this.destination = null;
    const pos = new THREE.Vector3(target.x, target.y, target.z);
    player.beginAction(pos);
    effects.swing(pos.x, pos.y, pos.z, pos.clone().sub(player.root.position).setY(0));
    return true;
  }
  steer(input: THREE.Vector2, yaw: number, dt: number, effects: ActionEffects): void {
    if (!this.destination || this.paused) return;
    if (input.lengthSq() > 0.001) {this.destination = null; return;}
    const player = this.context.player();
    const dx = this.destination.x - player.root.position.x, dz = this.destination.z - player.root.position.z;
    this.travelTime += dt;
    if (Math.hypot(dx, dz) < 2.7) {
      const point = this.destination; this.destination = null;
      this.click(point, effects, true); return;
    }
    if (this.travelTime > 8) {this.destination = null; this.context.toast('Lối đi bị chắn. Dùng WASD để vòng qua hoặc chọn điểm gần hơn.'); return;}
    const angle = Math.atan2(dx, dz) - yaw;
    input.set(Math.sin(angle), Math.cos(angle));
  }
  private createMob(): MobView {
    const root = new THREE.Group();
    const geometry = new THREE.PlaneGeometry(1.9, 1.35); geometry.translate(0, 0.675, 0);
    const sprite = new THREE.Mesh(geometry, createLitSpriteMaterial(getPixelSpriteTexture('blue_slime'), getPixelSpriteNormalTexture('blue_slime'), 2));
    sprite.layers.set(SPRITE_LIGHT_LAYER); root.add(sprite);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 14), new THREE.MeshBasicMaterial({color: '#183c32', transparent: true, opacity: 0.3, depthWrite: false}));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.03; root.add(shadow);
    const bar = new THREE.Group(); bar.position.y = 1.7; bar.layers.set(SPRITE_LIGHT_LAYER);
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.15), new THREE.MeshBasicMaterial({color: '#182f36', depthTest: false}));
    bg.layers.set(SPRITE_LIGHT_LAYER); bar.add(bg);
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.08), new THREE.MeshBasicMaterial({color: '#9ce178', depthTest: false}));
    fill.position.z = 0.01; fill.layers.set(SPRITE_LIGHT_LAYER); bar.add(fill); root.add(bar);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.42, 28), new THREE.MeshBasicMaterial({color: '#ff8058', transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide}));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; root.add(ring);
    this.root.add(root); return {root, sprite, bar, fill, ring};
  }
  private createHouse(point: Point): THREE.Group {
    const house = new THREE.Group(); house.position.set(point.x, point.y, point.z);
    const block = (w: number, h: number, d: number, color: string, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({color, roughness: 1}));
      mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; house.add(mesh); return mesh;
    };
    block(4.3, 0.3, 3.8, '#a3a39a', 0, 0.15, 0);
    block(3.8, 2.2, 3.2, '#ad7948', 0, 1.4, 0);
    for (const x of [-1.85, 1.85]) for (const z of [-1.55, 1.55]) block(0.22, 2.4, 0.22, '#60412f', x, 1.5, z);
    for (let y = 0.6; y < 2.5; y += 0.38) block(3.8, 0.045, 3.24, '#8d5e36', 0, y, 0);
    for (const sign of [-1, 1]) {const roof = block(2.5, 0.22, 4.0, '#487c73', sign * 1.03, 3.0, 0); roof.rotation.z = -sign * 0.55;}
    block(0.95, 1.65, 0.08, '#3a302b', 0, 1.15, 1.65);
    block(0.1, 0.1, 0.1, '#efc36b', 0.28, 1.05, 1.72);
    for (const x of [-1.15, 1.15]) {block(0.7, 0.72, 0.10, '#5a4936', x, 1.8, 1.65); block(0.48, 0.48, 0.12, '#f5d783', x, 1.8, 1.70);}
    block(1.6, 0.16, 0.9, '#ae9c7c', 0, 0.08, 2.1);
    const light = new THREE.PointLight('#ffd185', 3, 9); light.position.set(0, 2, 2); light.layers.enable(SPRITE_LIGHT_LAYER); house.add(light);
    this.root.add(house); return house;
  }
  private disposeGroup(root: THREE.Object3D): void {
    root.traverse(obj => {if (obj instanceof THREE.Mesh) {obj.geometry.dispose(); for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) if (!mat.userData.shared) mat.dispose();}});
  }
  update(dt: number, player: ExplorerCharacter, camera: THREE.Camera, effects: ActionEffects, camCtrl: WorldCameraController): void {
    if (!this.paused) this.session.update(dt, player.root.position, this.world);
    for (const event of this.session.drainEvents()) {
      this.context.toast(event.text);
      if (event.type === 'hurt' || event.type === 'death') {player.playHitAnimation(); camCtrl.impact.trigger(0.11);}
      else {effects.impact(event.x, event.y, event.z, event.kind); camCtrl.impact.trigger(0.075); player.pauseOnImpact();}
      if (event.type === 'death') {
        this.paused = true; this.building = false; $('adventure-menu').hidden = false;
        put('menu-title', 'Hành trình vẫn còn phía trước');
        put('menu-description', 'Bạn đã kiệt sức. Trở về nhà hoặc đèn hiệu để hồi sinh. Túi đồ và công trình vẫn được giữ.');
        put('play-adventure', 'Hồi sinh và tiếp tục');
      }
      this.context.save();
    }
    for (const node of this.session.nodes) {
      const view = this.nodeViews.get(node.id)!; view.visible = !node.removed;
      for (const child of view.children) if (child.userData.billboard) camera.getWorldQuaternion(child.quaternion);
    }
    for (const [id, mob] of this.session.creatures) {
      let view = this.mobViews.get(id);
      if (!view && mob.hp > 0) {view = this.createMob(); this.mobViews.set(id, view);}
      if (!view) continue;
      view.root.visible = mob.hp > 0 && Math.hypot(mob.x - player.root.position.x, mob.z - player.root.position.z) < 45;
      view.root.position.set(mob.x, mob.y, mob.z);
      camera.getWorldQuaternion(view.sprite.quaternion); camera.getWorldQuaternion(view.bar.quaternion);
      view.sprite.material.color.set(mob.flash > 0 ? '#fff2b8' : mob.state === 'windup' ? '#ffb599' : '#ffffff');
      view.sprite.scale.setScalar(mob.flash > 0 ? 1.08 : 1);
      view.fill.scale.x = mob.hp / 30; view.fill.position.x = -(1 - mob.hp / 30) * 0.675;
      view.bar.visible = mob.state !== 'roam' || mob.hp < 30;
      view.ring.visible = mob.state === 'windup';
      if (view.ring.visible) {view.ring.position.set(mob.aimX - mob.x, 0.06, mob.aimZ - mob.z); view.ring.scale.setScalar(0.5 + (1 - Math.max(0, mob.timer) / 0.6) * 0.5);}
    }
    for (const [id, view] of this.mobViews) if (!this.session.creatures.has(id)) {this.root.remove(view.root); this.disposeGroup(view.root); this.mobViews.delete(id);}
    if (this.session.house && !this.houseView) this.houseView = this.createHouse(this.session.house);
    if (this.session.house) this.homeMarker.position.set(this.session.house.x, this.session.house.y + 0.04, this.session.house.z);
    this.renderHud(player.root.position);
  }
  private renderHud(position: Point): void {
    const s = this.session, inv = s.supplies;
    put('player-hp', `${s.hp} / 100`); ($('hp-fill') as HTMLElement).style.width = `${s.hp}%`;
    put('inventory-wood', String(inv.wood)); put('inventory-stone', String(inv.stone)); put('inventory-gel', String(inv.gel)); put('inventory-food', String(inv.food));
    put('quest-text', s.objective);
    put('quest-title', !s.axe ? 'Dụng cụ của người lữ hành' : !s.house ? 'Một nơi để trở về' : s.kills < 3 ? 'Bìa rừng đang chuyển động' : 'Hành trình của riêng bạn');
    put('tool-label', s.axe ? 'Rìu tốt · 20 sát thương' : 'Rìu thô · 10 sát thương');
    put('craft-axe', s.axe ? 'Đã có rìu tốt' : 'C · Chế rìu (4 gỗ, 2 đá)');
    ($('craft-axe') as HTMLButtonElement).disabled = s.axe || inv.wood < 4 || inv.stone < 2;
    ($('build-house') as HTMLButtonElement).disabled = !!s.house || !s.axe || inv.wood < 8 || inv.stone < 4;
    put('build-house', s.house ? 'Nhà đã dựng' : this.building ? 'B · Hủy đặt nhà' : 'B · Xây nhà (8 gỗ, 4 đá)');
    put('build-hint', this.building ? 'ĐẶT NHÀ · Chọn vùng xanh trên mặt đất · B để hủy' : '');
    const home = s.house ?? {x: 0, z: 0};
    const distance = Math.round(Math.hypot(position.x - home.x, position.z - home.z));
    put('location-label', `${s.house ? 'Nhà' : 'Đèn hiệu'} cách ${distance} bước · Đã hạ ${s.kills} slime`);
    if (s.dead && !this.started) {
      put('menu-title', 'Tiếp tục hành trình'); put('menu-description', 'Bạn đã kiệt sức trong lần chơi trước. Hồi sinh tại nhà hoặc đèn hiệu, giữ nguyên túi đồ và công trình.'); put('play-adventure', 'Hồi sinh và tiếp tục');
    }
  }
  dispose(): void {this.buttons.abort(); this.disposeGroup(this.root); this.root.removeFromParent();}
}
