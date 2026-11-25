import * as THREE from 'three';
import {WorldCameraController} from './camera';
import {PixelRain} from './weather';
import {applySpriteNormalMapping, SPRITE_LIGHT_LAYER, updateSpriteFocus, updateSpriteMotion} from './sprite-lighting';
import {ExplorerCharacter} from './character';
import {WorldSaveStore} from './world-save';
import {ActionEffects} from './effects';
import {loadSpriteAssets, type AvatarId} from './sprite-assets';
import {ADVENTURE_SAVE_KEY, ADVENTURE_SEED, AdventureSession} from './adventure-session';
import {AdventureController} from './adventure-controller';
import {ChunkManager} from './chunks';
import {WORLD_PRESETS, type WorldPreset} from './presets';
import {buildPropTemplate} from './props';
import {buildCenterMonument, createWaterTexture, TerrainField, type MonumentObjects} from './terrain';

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
const isAdventure = document.body.dataset.mode === 'adventure';
let adventureSession: AdventureSession | null = null;
if (isAdventure) {
  try {adventureSession = AdventureSession.restore(window.localStorage.getItem(ADVENTURE_SAVE_KEY));}
  catch {adventureSession = new AdventureSession();}
}
let adventure: AdventureController | null = null;

const canvasWrap = $('viewport');
const presetSelect = $<HTMLSelectElement>('preset-select');
const avatarSelect = $<HTMLSelectElement>('avatar-select');
let activeAvatar: AvatarId = 'hooded';
try {if (window.localStorage.getItem('openworld-avatar-v2') === 'human') activeAvatar = 'human';} catch { /* Storage is optional for appearance. */ }
if (adventureSession) activeAvatar = adventureSession.avatar;
avatarSelect.value = activeAvatar;
const seedInput = $<HTMLInputElement>('seed-input');
const randomSeedBtn = $<HTMLButtonElement>('random-seed');
const respawnBtn = $<HTMLButtonElement>('respawn-btn');
const camToggleBtn = $<HTMLButtonElement>('cam-toggle-btn');
const weatherBtn = $<HTMLButtonElement>('weather-btn');
const normalBtn = $<HTMLButtonElement>('normal-btn');
const sunBtn = $<HTMLButtonElement>('sun-btn');
const saveBtn = $<HTMLButtonElement>('save-btn');
const saveStatus = $('save-status');
const saves = new WorldSaveStore({
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value)
});
let normalMapsEnabled = true;
let sunAngle = 0;
normalBtn.addEventListener('click', () => {
  normalMapsEnabled = !normalMapsEnabled;
  normalBtn.textContent = normalMapsEnabled ? 'Ánh sáng: Normal map' : 'Ánh sáng: Sprite phẳng';
  normalBtn.setAttribute('aria-pressed', String(normalMapsEnabled));
});
sunBtn.addEventListener('click', () => {sunAngle += Math.PI / 4;});
const statusEl = $('telemetry');
const presetDescEl = $('preset-desc');
const resourceFeedEl = $('resource-feed');

for (const preset of Object.values(WORLD_PRESETS)) {
  const opt = document.createElement('option');
  opt.value = preset.id;
  opt.textContent = preset.name;
  presetSelect.appendChild(opt);
}

// Render at logical pixels, then enlarge without interpolation. HUD remains native resolution.
const renderer = new THREE.WebGLRenderer({antialias: false, powerPreference: 'high-performance'});
renderer.setPixelRatio(1);
function resizeRenderer(): void {
  const scale = Math.max(1, Math.ceil(window.innerHeight / 540));
  renderer.setSize(Math.ceil(window.innerWidth / scale), Math.ceil(window.innerHeight / scale), false);
}
resizeRenderer();
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
renderer.domElement.style.imageRendering = 'pixelated';
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
canvasWrap.appendChild(renderer.domElement);

// Scene & Isometric Camera Controller
const scene = new THREE.Scene();
const effects = new ActionEffects();
scene.add(effects.root);
const camCtrl = new WorldCameraController(renderer.domElement);
if (isAdventure) {camCtrl.isoZoom = 11; camCtrl.resize();}
camCtrl.isoCamera.layers.enable(SPRITE_LIGHT_LAYER);
camCtrl.perspCamera.layers.enable(SPRITE_LIGHT_LAYER);
const rain = new PixelRain();
scene.add(rain.root);
rain.root.layers.set(SPRITE_LIGHT_LAYER);
let weatherMode = 0;
let nightBlend = 0;
const nightColor = new THREE.Color('#101921');
const weatherColor = new THREE.Color();
function cycleWeather(): void {
  weatherMode = (weatherMode + 1) % 3;
  rain.root.visible = weatherMode === 2;
  weatherBtn.textContent = ['Trời: Ban ngày', 'Trời: Ban đêm', 'Trời: Đêm mưa'][weatherMode];
  weatherBtn.setAttribute('aria-label', weatherBtn.textContent + '. Bấm để đổi thời tiết');
}
weatherBtn.addEventListener('click', cycleWeather);

// Lighting
const hemiLight = new THREE.HemisphereLight('#b7dcff', '#596e45', 0.85);
hemiLight.layers.enable(SPRITE_LIGHT_LAYER);
scene.add(hemiLight);
// The object-only light is isolated in a second render pass, with the ground depth retained.
const spriteFill = new THREE.DirectionalLight('#e3f0ff', 0.8);
spriteFill.layers.set(SPRITE_LIGHT_LAYER);
scene.add(spriteFill, spriteFill.target);

const sunLight = new THREE.DirectionalLight('#fff2d6', 2.1);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 5;
sunLight.shadow.camera.far = 220;
const shadowRange = 55;
sunLight.shadow.camera.left = -shadowRange;
sunLight.shadow.camera.right = shadowRange;
sunLight.shadow.camera.top = shadowRange;
sunLight.shadow.camera.bottom = -shadowRange;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);
scene.add(sunLight.target);

// Sky Dome
const skyGeo = new THREE.SphereGeometry(260, 24, 16);
const skyColors = new Float32Array(skyGeo.attributes.position.count * 3);
skyGeo.setAttribute('color', new THREE.BufferAttribute(skyColors, 3));
const skyMat = new THREE.MeshBasicMaterial({vertexColors: true, side: THREE.BackSide, fog: false});
const skyDome = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyDome);

function updateSkyDome(topHex: string, bottomHex: string): void {
  const pos = skyGeo.attributes.position;
  const col = skyGeo.attributes.color as THREE.BufferAttribute;
  const top = new THREE.Color(topHex);
  const bottom = new THREE.Color(bottomHex);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.clamp((pos.getY(i) + 20) / 220, 0, 1);
    tmp.copy(bottom).lerp(top, t);
    col.setXYZ(i, tmp.r, tmp.g, tmp.b);
  }
  col.needsUpdate = true;
}

// Isometric Tile Highlight Cursor (like ISO-CORE white grid selector)
const tileCursor = new THREE.Mesh(
  new THREE.PlaneGeometry(1.94, 1.94),
  new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.28,
    depthWrite: false
  })
);
tileCursor.rotation.x = -Math.PI / 2;
const tileBorder = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.96, 0.04, 1.96)),
  new THREE.LineBasicMaterial({color: '#ffffff', transparent: true, opacity: 0.85})
);
tileCursor.add(tileBorder);
scene.add(tileCursor);

// Infinite water plane following player
const waterGeo = new THREE.PlaneGeometry(240, 240, 4, 4);
waterGeo.rotateX(-Math.PI / 2);
const waterMat = new THREE.MeshStandardMaterial({
  color: '#2baee0',
  map: createWaterTexture(),
  transparent: true,
  opacity: 0.88,
  roughness: 0.2,
  metalness: 0.1
});
const waterMesh = new THREE.Mesh(waterGeo, waterMat);
waterMesh.receiveShadow = true;
scene.add(waterMesh);

// Active world state
let activePreset: WorldPreset = WORLD_PRESETS['video-grove'];
let activeSeed = activePreset.defaultSeed;
let terrainField: TerrainField;
let chunkManager: ChunkManager | null = null;
let monument: MonumentObjects | null = null;
let player: ExplorerCharacter | null = null;
let saveErrorShown = false;

function showResourceToast(text: string): void {
  const item = document.createElement('div');
  item.className = 'toast';
  item.textContent = text;
  resourceFeedEl.appendChild(item);
  setTimeout(() => item.remove(), 1800);
}

function saveCurrentWorld(manual = false): void {
  if (!player || !chunkManager) return;
  if (adventureSession) {
    adventureSession.position = [player.root.position.x, player.root.position.z];
    adventureSession.avatar = activeAvatar;
    for (const id of chunkManager.removed) adventureSession.removed.add(id);
    try {
      window.localStorage.setItem(ADVENTURE_SAVE_KEY, JSON.stringify(adventureSession.snapshot()));
      saveStatus.textContent = 'Hành trình đã lưu trên trình duyệt';
      if (manual) showResourceToast('Đã lưu hành trình');
    } catch {
      saveStatus.textContent = 'Chưa ghi được bản lưu; tiến trình đang giữ trong phiên chơi';
      if (manual || !saveErrorShown) showResourceToast('Không ghi được bản lưu trên trình duyệt');
      saveErrorShown = true;
    }
    return;
  }
  const ok = saves.save({presetId: activePreset.id, seed: activeSeed,
    removed: [...chunkManager.removed], position: [player.root.position.x, player.root.position.z], savedAt: Date.now()});
  saveStatus.textContent = ok ? 'Đã lưu trên trình duyệt' : 'Chưa lưu được';
  if (manual) showResourceToast(ok ? 'Đã lưu thế giới và vị trí' : saves.error!);
  else if (!ok && !saveErrorShown) showResourceToast(saves.error!);
  saveErrorShown = !ok;
}
saveBtn.addEventListener('click', () => saveCurrentWorld(true));
window.setInterval(() => saveCurrentWorld(), 5000);
window.addEventListener('pagehide', () => saveCurrentWorld());
document.addEventListener('visibilitychange', () => {if (document.hidden) saveCurrentWorld();});

function buildWorld(presetId: string, seed: number): void {
  saveCurrentWorld();
  adventure?.dispose(); adventure = null;
  effects.reset();
  camCtrl.impact.reset();
  activePreset = WORLD_PRESETS[presetId] ?? WORLD_PRESETS['meadow-isle'];
  activeSeed = seed;
  presetSelect.value = activePreset.id;
  seedInput.value = String(activeSeed);
  presetDescEl.textContent = activePreset.subtitle;

  if (chunkManager) {
    scene.remove(chunkManager.root);
    chunkManager.dispose();
  }
  if (monument) {
    scene.remove(monument.group);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    monument.group.traverse(obj => {
      if (obj instanceof THREE.Mesh) geometries.add(obj.geometry);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Sprite) {
        for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(material);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) {
      (material as THREE.MeshStandardMaterial).map?.dispose();
      material.dispose();
    }
  }
  if (player) {
    scene.remove(player.root);
    player.dispose();
  }

  const atm = activePreset.atmosphere;
  updateSkyDome(atm.skyTop, atm.skyBottom);
  scene.fog = new THREE.Fog(atm.fogColor, atm.fogNear, atm.fogFar);
  scene.background = new THREE.Color(atm.fogColor);

  hemiLight.color.set(atm.hemiSky);
  hemiLight.groundColor.set(atm.hemiGround);
  hemiLight.intensity = atm.hemiIntensity;

  sunLight.color.set(atm.sunColor);
  sunLight.intensity = atm.sunIntensity;

  waterMat.color.set(activePreset.terrain.palette.waterSurface);
  waterMesh.position.y = activePreset.terrain.waterLevel;

  terrainField = new TerrainField(activePreset.terrain, activeSeed);
  chunkManager = new ChunkManager(terrainField, isAdventure ? activePreset.props.filter(rule => rule.kind !== 'blue_slime') : activePreset.props,
    buildPropTemplate, isAdventure ? (x, z) => Math.hypot(x, z) < 22 : undefined);
  const saved = isAdventure ? null : saves.get(activePreset.id, activeSeed);
  for (const id of adventureSession?.removed ?? saved?.removed ?? []) chunkManager.removed.add(id);
  scene.add(chunkManager.root);
  const [startX, startZ] = adventureSession?.position ?? saved?.position ?? [2.4, 2.4];
  chunkManager.update(startX, startZ);

  monument = buildCenterMonument(terrainField);
  monument.crystalLight.layers.enable(SPRITE_LIGHT_LAYER);
  scene.add(monument.group);

  player = new ExplorerCharacter(activePreset.character, activeAvatar);
  player.placeAt(startX, startZ, terrainField);
  scene.add(player.root);
  if (adventureSession) {
    adventure = new AdventureController(adventureSession, terrainField, {
      player: () => player!, colliders: () => chunkManager!.getActiveColliders(),
      save: () => saveCurrentWorld(), toast: showResourceToast,
      harvest: point => chunkManager!.beginHarvestAt(point.x, point.z, player!.root.position.x, player!.root.position.z, player!.root.position.y)
    });
    scene.add(adventure.root);
  }
  saveStatus.textContent = saved ? 'Đã khôi phục tiến trình của seed này' : 'Tự động lưu mỗi 5 giây';
}

const previousWorld = saves.active;
statusEl.textContent = 'Đang tải cây và nhân vật mới...';
try {await loadSpriteAssets();}
catch (error) {console.error('Sprite asset loading failed', error); showResourceToast('Chưa tải được bộ asset mới; đang dùng hình dự phòng');}
buildWorld(isAdventure ? 'video-grove' : previousWorld && WORLD_PRESETS[previousWorld.presetId] ? previousWorld.presetId : activePreset.id,
  isAdventure ? ADVENTURE_SEED : previousWorld && WORLD_PRESETS[previousWorld.presetId] ? previousWorld.seed : activeSeed);

avatarSelect.addEventListener('change', () => {
  activeAvatar = avatarSelect.value === 'human' ? 'human' : 'hooded';
  if (player) {
    const old = player;
    player = new ExplorerCharacter(activePreset.character, activeAvatar);
    player.root.position.copy(old.root.position);
    player.velocityY = old.velocityY; player.grounded = old.grounded;
    scene.remove(old.root); old.dispose(); scene.add(player.root); effects.reset();
  }
  if (adventureSession) {adventureSession.avatar = activeAvatar; saveCurrentWorld();}
  else try {window.localStorage.setItem('openworld-avatar-v2', activeAvatar);} catch { /* Keep the choice for this session. */ }
});

// Raycast / Mouse tile cursor & harvesting
const pointerNdc = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
let downPos = {x: 0, y: 0};

renderer.domElement.addEventListener('pointerdown', (e) => {
  downPos = {x: e.clientX, y: e.clientY};
});

renderer.domElement.addEventListener('pointermove', (e) => {
  pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointerNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (e.button !== 0 || !player || !chunkManager || player.isActing) return;
  if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;

  pointerNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointerNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camCtrl.activeCamera);
  groundPlane.constant = -player.root.position.y;
  if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
    if (adventure?.click(hitPoint, effects)) return;
    const res = chunkManager.beginHarvestAt(hitPoint.x, hitPoint.z, player.root.position.x, player.root.position.z, player.root.position.y);
    const target = res ? new THREE.Vector3(res.x, res.y, res.z) : hitPoint;
    const direction = target.clone().sub(player.root.position).setY(0).normalize();
    player.beginAction(target);
    if (res) effects.swing(res.x, res.y, res.z, direction);
    else {
      effects.swing(player.root.position.x + direction.x * 1.3, player.root.position.y, player.root.position.z + direction.z * 1.3, direction);
    }
  }
});

// Input handling
const keys = new Set<string>();
let jumpQueued = false;

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && adventure && !e.repeat) {adventure.togglePause(); keys.clear(); jumpQueued = false; return;}
  if ([seedInput, avatarSelect, presetSelect].some(element => element === document.activeElement)) return;
  const code = e.code;
  if (adventure?.paused) return;
  if (code === 'Space' || code.startsWith('Arrow')) e.preventDefault();
  if (adventure && !e.repeat) {
    if (code === 'KeyC') adventure.craft();
    if (code === 'KeyB') adventure.toggleBuild();
    if (code === 'KeyH') adventure.heal();
  }
  if (code === 'Space' && !e.repeat) jumpQueued = true;
  if (code === 'KeyQ' && !e.repeat) camCtrl.rotateStep(Math.PI * 0.25);
  if (code === 'KeyE' && !e.repeat) camCtrl.rotateStep(-Math.PI * 0.25);
  if (code === 'KeyN' && !e.repeat) cycleWeather();
  if (code === 'KeyL' && !e.repeat) sunAngle += Math.PI / 4;
  keys.add(code);
});

window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => {keys.clear(); jumpQueued = false; if (adventure && !adventure.paused) adventure.togglePause();});

presetSelect.addEventListener('change', () => {
  const next = WORLD_PRESETS[presetSelect.value];
  if (next) buildWorld(next.id, next.defaultSeed);
});

randomSeedBtn.addEventListener('click', () => {
  const nextSeed = Math.floor(1000 + Math.random() * 89999);
  buildWorld(activePreset.id, nextSeed);
});

seedInput.addEventListener('change', () => {
  const parsed = Number.parseInt(seedInput.value, 10);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 2147483647) buildWorld(activePreset.id, parsed);
});

respawnBtn.addEventListener('click', () => {
  if (player) player.placeAt(2.4, 2.4, terrainField);
});

camToggleBtn.addEventListener('click', () => {
  const mode = camCtrl.toggleMode();
  camToggleBtn.textContent = mode === 'isometric' ? 'Cam: Isometric' : 'Cam: Góc nhìn 3';
});

window.addEventListener('resize', () => {
  camCtrl.resize();
  resizeRenderer();
});

// Main loop
const moveVec = new THREE.Vector2();
const renderBufferSize = new THREE.Vector2();
const spriteLightDirection = new THREE.Vector3();
const crystalEffectPosition = new THREE.Vector3();
let prevTime = performance.now();
let fpsAcc = 0;
let fpsFrames = 0;
let fpsDisplay = 60;

function tick(now: number): void {
  requestAnimationFrame(tick);
  const realDt = Math.min(0.05, (now - prevTime) / 1000);
  const dt = adventure?.paused ? 0 : realDt;
  prevTime = now;

  fpsAcc += realDt;
  fpsFrames++;
  if (fpsAcc >= 0.4) {
    fpsDisplay = Math.round(fpsFrames / fpsAcc);
    fpsAcc = 0;
    fpsFrames = 0;
  }

  let mx = 0;
  let mz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) mz += 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) mz -= 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) mx += 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) mx -= 1;
  moveVec.set(mx, mz);
  if (moveVec.lengthSq() > 1) moveVec.normalize();

  const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');

  if (player && chunkManager && monument) {
    chunkManager.update(player.root.position.x, player.root.position.z);
    const colliders = [...chunkManager.getActiveColliders(), ...adventure?.getColliders() ?? []];

    adventure?.steer(moveVec, camCtrl.yaw, dt, effects);
    player.update(dt, moveVec, camCtrl.yaw, sprint, jumpQueued && !adventure?.paused, terrainField, colliders);
    jumpQueued = false;

    // Keep water & shadow frustum centered on player for infinite chunks
    const px = player.root.position.x;
    const pz = player.root.position.z;
    const t = now * 0.001;
    updateSpriteMotion(t);
    effects.trackPlayer(player.root.position, player.grounded, player.isWading, activePreset.terrain.waterLevel);
    waterMesh.position.set(px, activePreset.terrain.waterLevel + Math.sin(t * 1.4) * 0.03, pz);

    const sunOffset = activePreset.atmosphere.sunPosition;
    const lightYaw = camCtrl.yaw + Math.PI + sunAngle - Math.PI / 3;
    const lightRadius = Math.hypot(sunOffset[0], sunOffset[2]);
    sunLight.position.set(px + Math.sin(lightYaw) * lightRadius, player.root.position.y + sunOffset[1], pz + Math.cos(lightYaw) * lightRadius);
    sunLight.target.position.copy(player.root.position);
    sunLight.target.updateMatrixWorld();

    // Animate center crystal monument
    monument.crystalMesh.position.y = 1.65 + Math.sin(t * 2.2) * 0.14;
    monument.crystalMesh.rotation.y = t * 0.9;
    monument.crystalCapMesh.position.y = 3.2 + Math.sin(t * 2.2 + 0.8) * 0.1;
    monument.crystalCapMesh.rotation.y = -t * 0.35;
    monument.crystalLight.intensity = 4.0 + Math.sin(t * 3.5) * 0.6;
    monument.crystalGlow.position.y = monument.crystalMesh.position.y;
    monument.crystalGlow.material.opacity = 0.4 + Math.sin(t * 2.2) * 0.08 + nightBlend * 0.2;

    nightBlend = THREE.MathUtils.damp(nightBlend, weatherMode === 0 ? 0 : 1, 3, dt);
    const atm = activePreset.atmosphere;
    sunLight.intensity = THREE.MathUtils.lerp(atm.sunIntensity, 0.12, nightBlend);
    hemiLight.intensity = THREE.MathUtils.lerp(atm.hemiIntensity, 0.16, nightBlend);
    hemiLight.color.set(atm.hemiSky).lerp(weatherColor.set('#617dac'), nightBlend);
    skyMat.color.setRGB(1, 1, 1).lerp(weatherColor.set('#172432'), nightBlend);
    weatherColor.set(atm.fogColor).lerp(nightColor, nightBlend);
    (scene.background as THREE.Color).copy(weatherColor);
    (scene.fog as THREE.Fog).color.copy(weatherColor);
    monument.crystalLight.intensity *= 1 + nightBlend * 2;
    rain.update(dt, player.root.position);

    camCtrl.update(player.root.position, realDt, terrainField);
    spriteFill.position.copy(sunLight.position);
    spriteFill.target.position.copy(player.root.position);
    spriteFill.target.updateMatrixWorld();
    spriteFill.intensity = THREE.MathUtils.lerp(1.35, 0.06, nightBlend);
    player.faceCamera(camCtrl.activeCamera);
    updateSpriteFocus(camCtrl.activeCamera, player.root.position, renderer.getDrawingBufferSize(renderBufferSize));
    chunkManager.faceCamera(camCtrl.activeCamera);
    for (const impact of chunkManager.updateActions(dt)) {
      effects.impact(impact.x, impact.y, impact.z, impact.kind);
      camCtrl.impact.trigger(impact.kind === 'boulder' || impact.kind === 'ruin_pillar' ? 0.10 : 0.065);
      player.pauseOnImpact();
      showResourceToast(adventureSession ? adventureSession.reward(impact.kind) : impact.rewardText);
      saveCurrentWorld();
    }
    adventure?.update(dt, player, camCtrl.activeCamera, effects, camCtrl);
    crystalEffectPosition.copy(monument.group.position); crystalEffectPosition.y += monument.crystalMesh.position.y;
    effects.update(dt, camCtrl.activeCamera, crystalEffectPosition);
    applySpriteNormalMapping(chunkManager.root, normalMapsEnabled);
    applySpriteNormalMapping(player.root, normalMapsEnabled);
    if (adventure) applySpriteNormalMapping(adventure.root, normalMapsEnabled);
    spriteLightDirection.copy(spriteFill.position).sub(spriteFill.target.position).normalize();
    const shadowOpacity = THREE.MathUtils.lerp(0.26, 0, nightBlend);
    chunkManager.updateSpriteShadows(spriteLightDirection, shadowOpacity);
    player.updateSpriteShadow(spriteLightDirection, shadowOpacity);

    // Update 3D Tile Cursor under mouse
    raycaster.setFromCamera(pointerNdc, camCtrl.activeCamera);
    groundPlane.constant = -player.root.position.y;
    if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
      const {gx, gz} = terrainField.worldToGrid(hitPoint.x, hitPoint.z);
      const ts = activePreset.terrain.tileSize;
      const cx = (gx + 0.5) * ts;
      const cz = (gz + 0.5) * ts;
      const cy = terrainField.heightAt(cx, cz);
      tileCursor.position.set(cx, cy + 0.03, cz);
      if (adventure) {
        tileCursor.visible = !adventure.paused;
        tileCursor.material.color.set(adventure.building ? adventure.session.canBuild(tileCursor.position, player.root.position, adventure.world) ? '#a6ef89' : '#f17c61' : '#ffffff');
        tileCursor.scale.setScalar(adventure.building ? 2 : 1);
      }
    }

    const p = player.root.position;
    const biome = terrainField.biomeLabelAt(p.x, p.z);
    const region = chunkManager.generator.distribution.labelAt(p.x, p.z);
    const state = !player.grounded ? 'Nhảy' : player.isWading ? 'Lội nước' : player.speed > 0.4 ? (player.isSprinting ? 'Chạy nhanh' : 'Đi bộ') : 'Đứng yên';
    statusEl.textContent = `FPS: ${fpsDisplay} · Chunks: ${chunkManager.activeChunkCount}${chunkManager.pendingChunkCount ? ` (+${chunkManager.pendingChunkCount} đang tải)` : ''} · ${biome} / ${region} · ${state} · (${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})`;
  }

  const camera = camCtrl.activeCamera;
  // Three.js layers filter lights by camera, not by individual mesh. Separate passes
  // are required to keep the sprite sunlight off the ground and vice versa.
  const background = scene.background;
  const originalMask = camera.layers.mask;
  camera.layers.set(0);
  renderer.autoClear = true;
  renderer.render(scene, camera);
  camera.layers.set(SPRITE_LIGHT_LAYER);
  renderer.autoClear = false;
  scene.background = null; // A Color background would force another depth/color clear.
  renderer.render(scene, camera);
  scene.background = background;
  camera.layers.mask = originalMask;
}

requestAnimationFrame(tick);
