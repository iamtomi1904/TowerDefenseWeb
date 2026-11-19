// 3-Layer Aura VFX System using Dedicated Sprite Sheets:
// 1. Thinned Outer Aura Boundary + Animated Concentric Waves inside Area of Effect:
//    /assets/auras/aura-rims-topdown.png (3 cols x 2 rows, 1:1 circular top-down thin rims)
//    - Frame 0: Tidecaller (Thủy Dưỡng 520) — Curling ocean waves, 8 glowing water lotuses & bubbles
//    - Frame 1: Fallen Knight (Sát Khí Hắc Ám 260/350) — Demonic purple-black rune rim, horned skulls & bats
//    - Frame 2: Paladin (Hào Quang Hộ Thể 260/350) — Golden celestial rune rim & 8 crusader shields
//    - Frame 3: Guardian (Hiệu Triệu 400) — Sacred bastion rim & 8 winged divine shields
//    - Frame 4: Windblade (Phong Bạo Kiếm Vực 135) — Swirling turquoise-emerald wind blades & leaves
//    - Frame 5: Berserker / Ravager (Cuồng Huyết / Huyết Nộ) — Crimson ancient blood-rune & blood-flame rim
// 2. Underfoot Unit Buff (Vòng buff dưới chân): /assets/auras/class-auras-1.png & class-auras-2.png (compact 80x52px foot rings on allies only)
// 3. Activation Cast Burst (Hiệu ứng phát động tỏa ra cái vòng): Central burst sprite + expanding circular wave rings blasting from caster (0.1*r) out to full radius (1.0*r)

const TAU = Math.PI * 2;

export const AURA_PAL = {
  holy: [0x103947, 0x1d7794, 0x41c9dd, 0xc4fbff, 0xfff4c4],
  holyHeal: [0x1c4732, 0x34855a, 0x64db96, 0xb8ffcf, 0xf5fff9],
  fallen: [0x12081c, 0x31144a, 0x6c2da3, 0xb56cff, 0xebd6ff],
  fallenSkull: [0x160a24, 0x3b1b59, 0x7a3eb3, 0xc78fff, 0x98f576],
  fallenBlood: [0x2e0814, 0x6e1429, 0xc22b4c, 0xff6b8b, 0xffd6e0],
  guardian: [0x382b16, 0x7d6230, 0xcfa855, 0xfae29c, 0xfffff2],
  tide: [0x143042, 0x235c75, 0x3ca6b8, 0x8be8f2, 0xf0ffff],
  wind: [0x163330, 0x2b6962, 0x56b8a8, 0x9ef2e2, 0xf2fffc],
  bulwark: [0x2b2d3c, 0x575a6e, 0xa8925e, 0xe6cb83, 0xfff5d6],
  fury: [0x2b0509, 0x6e0b14, 0xc91827, 0xff4d58, 0xffccd0]
};

export function ensureAuraFrames(scene, key) {
  if (!scene?.textures?.exists(key) || !scene?.add?.image) return false;
  const tx = scene.textures.get(key), im = tx.getSourceImage?.();
  if (!im?.width || !im?.height) return false;
  const is3x2 = key === 'aura-rims-topdown' || key === 'paladin-divine-auras';
  const cols = is3x2 ? 3 : 6;
  const rows = is3x2 ? 2 : 4;
  const w = Math.floor(im.width / cols), h = Math.floor(im.height / rows);
  if (w < 8 || h < 8) return false;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (!tx.has(idx)) tx.add(idx, 0, col * w, row * h, w, h);
    }
  }
  return true;
}

export function clearUnitAuraSprites(obj) {
  if (!obj) return;
  for (const s of obj.classAuraSprites?.values() || []) s.destroy();
  obj.classAuraSprites?.clear();
}

export function syncAuraSprite(scene, map, id, key, row, x, y, width, height, depth, time, alpha = 0.92, fixedCol = null) {
  if (!ensureAuraFrames(scene, key)) return null;
  const col = fixedCol !== null ? fixedCol : Math.floor(time / 135) % 6;
  const frame = row * 6 + col;
  let img = map.get(id);
  if (!img || !img.active) {
    img = scene.add.image(x, y, key, frame);
    map.set(id, img);
  }
  img.setTexture(key, frame).setPosition(x, y).setDisplaySize(width, height).setDepth(depth).setAlpha(alpha).setRotation(0).setVisible(true);
  return img;
}

export function syncOuterRimSprite(scene, map, id, rimFrame, x, y, r, depth, time, alpha = 0.9, rotSpeed = 0.00015) {
  if (!ensureAuraFrames(scene, 'aura-rims-topdown')) return null;
  let img = map.get(id);
  if (!img || !img.active) {
    img = scene.add.image(x, y, 'aura-rims-topdown', rimFrame);
    map.set(id, img);
  }
  const d = Math.max(8, r * 2.18);
  img.setTexture('aura-rims-topdown', rimFrame).setPosition(x, y).setDisplaySize(d, d).setDepth(depth).setAlpha(alpha).setRotation(time * rotSpeed).setVisible(true);
  return img;
}

// Renders all 3 dynamic field components for an active aura zone:
// 1) Activation Burst (burstT < 1): Outer rim expands from 0.12*r -> 1.0*r + secondary shockwave rim + center burst emblem
// 2) Sustained Thinned Outer Rim at 1.0*r
// 3) 2 Continuous Animated Expanding Waves (vòng động) rippling from 0.15*r -> 0.98*r inside the area of effect
export function syncSustainedFieldRims(scene, map, prefix, rimFrame, burstCol, x, y, r, depth, time, burstT = 1, alpha = 0.9, dir = 1) {
  if (!scene || !map) return;
  const isBursting = burstT < 1;
  const easeOut = 1 - Math.pow(1 - Math.max(0, Math.min(1, burstT)), 3);

  // 1. Main Outer Rim: expands from 0.12*r to 1.0*r during activation, then stays at 1.0*r
  const mainR = isBursting ? r * (0.12 + 0.88 * easeOut) : r;
  syncOuterRimSprite(scene, map, prefix + '-rim', rimFrame, x, y, mainR, depth, time + (isBursting ? burstT * 1800 : 0), alpha, 0.00018 * dir);

  // 2. Activation Burst Wave & Central Emblem (tỏa ra từ người nhân vật thành cái vòng)
  if (isBursting) {
    const waveR = r * (0.06 + 0.94 * Math.pow(Math.max(0, burstT), 0.65));
    const waveAlpha = Math.sin(burstT * Math.PI) * 0.85;
    syncOuterRimSprite(scene, map, prefix + '-burst-rim', rimFrame, x, y, waveR, depth + 1, -time * 2, waveAlpha, -0.0004 * dir);
    if (burstCol !== null) {
      const s = 0.5 + 0.85 * easeOut;
      syncAuraSprite(scene, map, prefix + '-burst-center', 'class-auras-2', 3, x, y - 8, 136 * s, 100 * s, depth + 3, time, Math.sin(burstT * Math.PI) * 0.95, burstCol);
    }
  } else {
    if (map.has(prefix + '-burst-rim')) map.get(prefix + '-burst-rim').setVisible(false);
    if (map.has(prefix + '-burst-center')) map.get(prefix + '-burst-center').setVisible(false);
  }

  // 3. Two Continuous Animated Concentric Waves (Vòng động trong phạm vi tác dụng) rippling outward from 0.15*r to 0.98*r
  for (let wIdx = 0; wIdx < 2; wIdx++) {
    const phase = ((time / 2100) + wIdx * 0.5) % 1;
    const waveRadius = r * (0.15 + phase * 0.83);
    const waveAlpha = Math.sin(phase * Math.PI) * 0.46 * (isBursting ? easeOut : 1) * (alpha / 0.9);
    syncOuterRimSprite(scene, map, `${prefix}-wave-${wIdx}`, rimFrame, x, y, waveRadius, depth - 1, time, waveAlpha, (wIdx % 2 === 0 ? -0.00032 : 0.00028) * dir);
  }
}

export function destroyFieldRims(map, prefix) {
  if (!map) return;
  for (const suffix of ['-rim', '-burst-rim', '-burst-center', '-wave-0', '-wave-1', '-rays', '-field', '-burst']) {
    const k = prefix + suffix;
    if (map.has(k)) {
      map.get(k).destroy();
      map.delete(k);
    }
  }
}

const STAMPS = {
  skull: [
    '...1222221...',
    '..123333321..',
    '.12333333321.',
    '.12344244321.',
    '.12344244321.',
    '.12333133321.',
    '..123212321..',
    '...1232321...',
    '...1.3.3.1...'
  ],
  batOpen: [
    '1...1..1..1...1',
    '12.121.1.121.21',
    '123232131232321',
    '.1233343433321.',
    '..12323332321..',
    '...1.12321.1...'
  ],
  batFold: [
    '....1..1..1....',
    '...121.1.121...',
    '..12321312321..',
    '.123.24342.321.',
    '.12..12321..21.',
    '.1....121....1.'
  ],
  holyShield: [
    '.133333331.',
    '13222422231',
    '13224442231',
    '13444444431',
    '13224442231',
    '.132242231.',
    '..1324231..',
    '...13431...',
    '....131....'
  ],
  wingedShield: [
    '44...1333331...44',
    '.43.132242231.34.',
    '..4313244423134..',
    '.433134444431334.',
    '432.132242231.234',
    '32...1324231...23',
    '......13431......',
    '.......131.......'
  ],
  towerShield: [
    '13333333331',
    '14222322241',
    '13223432231',
    '13334443331',
    '13223432231',
    '14222322241',
    '.133333331.',
    '..1334331..'
  ],
  divineCross: [
    '....4....',
    '....4....',
    '..3.4.3..',
    '...343...',
    '443444344',
    '...343...',
    '..3.4.3..',
    '....4....',
    '....4....'
  ]
};

function px(g, x, y, c, a = 1, size = 2) {
  g.fillStyle(c, a).fillRect(Math.round(x / size) * size, Math.round(y / size) * size, size, size);
}

function stamp(g, name, x, y, pal, a = 1, scale = 2, flip = false) {
  const rows = STAMPS[name];
  if (!rows) return;
  const w = rows[0].length, h = rows.length;
  const ox = x - (w * scale) / 2, oy = y - (h * scale) / 2;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const ch = rows[j][i];
      if (ch === '.') continue;
      const v = Number(ch);
      if (v >= 0) px(g, ox + (flip ? w - 1 - i : i) * scale, oy + j * scale, pal[Math.min(pal.length - 1, v)], a, scale);
    }
  }
}

function drawGlossyBubble(g, x, y, rad, p, alpha = 1) {
  g.fillStyle(p[2], alpha * 0.2).fillCircle(x, y, rad);
  g.lineStyle(1.5, p[3], alpha * 0.85).strokeCircle(x, y, rad);
  px(g, x - rad * 0.38, y - rad * 0.38, p[4], alpha * 0.95, Math.max(2, Math.round(rad * 0.32)));
}

// Helper for animated concentric aura wave rings on Graphics canvas (works in both browser & headless tests)
function drawAnimatedConcentricWaves(g, x, y, r, time, colorOuter, colorInner, alpha = 1, count = 2) {
  for (let i = 0; i < count; i++) {
    const phase = ((time / 2100) + i / count) % 1;
    const wr = r * (0.14 + phase * 0.84);
    const a = Math.sin(phase * Math.PI) * 0.38 * alpha;
    g.lineStyle(2, colorOuter, a).strokeCircle(x, y, wr);
    if (wr > 18) g.lineStyle(1, colorInner, a * 0.7).strokeCircle(x, y, wr - 6);
  }
}

// ============================================================================
// 1. HẮC KỴ SĨ — SÁT KHÍ HẮC ÁM (260 Bộ / 350 Diệt Vong)
// ============================================================================
export function drawFallenAuraBurst(g, x, y, r, t, enhanced = false) {
  const p = AURA_PAL.fallen, sp = AURA_PAL.fallenSkull, bp = AURA_PAL.fallenBlood;
  const ease = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const fade = Math.sin(Math.PI * Math.max(0, Math.min(1, t)));
  const rr = Math.max(16, r * (0.1 + 0.9 * ease));
  const trailR = Math.max(10, r * (0.05 + 0.95 * Math.pow(Math.max(0, t), 0.65)));

  // Expanding activation shockwave rings radiating from caster to outer boundary
  g.fillStyle(p[0], fade * 0.1).fillCircle(x, y, rr);
  g.lineStyle(4, p[2], fade * 0.8).strokeCircle(x, y, rr);
  g.lineStyle(2, enhanced ? bp[3] : p[4], fade * 0.95).strokeCircle(x, y, rr);
  g.lineStyle(2, sp[4], fade * 0.65).strokeCircle(x, y, trailR);

  // Bats & Skulls blasting outward along the expanding ring
  const swarm = enhanced ? 10 : 8;
  for (let i = 0; i < swarm; i++) {
    const a = (i / swarm) * TAU + t * 1.1;
    const bx = x + Math.cos(a) * rr, by = y + Math.sin(a) * rr - Math.sin(t * Math.PI) * 18;
    if (i % 2 === 0) {
      const flap = Math.floor(t * 16 + i) % 2 === 0 ? 'batOpen' : 'batFold';
      stamp(g, flap, bx, by, p, fade * 0.95, 2.2);
    } else {
      stamp(g, 'skull', bx, by, sp, fade * 0.95, 2.2);
    }
  }
}

export function drawFallenSustainedField(g, x, y, r, time, burstT = 1, enhanced = false, scene = null, obj = null) {
  const p = AURA_PAL.fallen, sp = AURA_PAL.fallenSkull, bp = AURA_PAL.fallenBlood;
  const pulse = 0.8 + Math.sin(time / 280) * 0.14;

  if (burstT < 1) {
    drawFallenAuraBurst(g, x, y, r, burstT, enhanced);
  }

  if (scene && obj) {
    obj.classAuraSprites ||= new Map();
    syncSustainedFieldRims(scene, obj.classAuraSprites, 'fallen', 1, 0, x, y, r, y - 7, time, burstT, (enhanced ? 0.92 : 0.84) * pulse, -1);
  }

  g.fillStyle(p[0], enhanced ? 0.045 : 0.03).fillCircle(x, y, r * 0.94);
  drawAnimatedConcentricWaves(g, x, y, r, time, p[2], enhanced ? bp[3] : p[3], pulse, 2);

  // Bats & Skulls flying outward across the area of effect
  const batCount = enhanced ? 7 : 5;
  for (let i = 0; i < batCount; i++) {
    const cycle = ((time / 1800 + i / batCount) % 1);
    const a = i * 2.399 - time / 1100;
    const dist = r * (0.2 + cycle * 0.75);
    const bx = x + Math.cos(a) * dist, by = y + Math.sin(a) * dist - cycle * 32;
    if (i % 2 === 0) {
      const flap = Math.floor(time / 110 + i) % 2 === 0 ? 'batOpen' : 'batFold';
      stamp(g, flap, bx, by, enhanced ? bp : p, Math.sin(cycle * Math.PI) * 0.9, 1.9);
    } else {
      stamp(g, 'skull', bx, by, sp, Math.sin(cycle * Math.PI) * 0.85, 1.8);
    }
  }
}

export function drawFallenUnderfootBuff(g, x, y, time, enhanced = false, scene = null, obj = null) {
  const p = AURA_PAL.fallen;
  const rx = enhanced ? 35 : 30, ry = enhanced ? 13 : 11;

  if (scene && obj) {
    obj.classAuraSprites ||= new Map();
    const w = enhanced ? 90 : 78, h = enhanced ? 60 : 52;
    syncAuraSprite(scene, obj.classAuraSprites, 'fallen-foot', 'class-auras-1', 0, x, y - 2, w, h, y - 1, time, 0.92);
  }
  g.fillStyle(p[0], 0.16).fillEllipse(x, y + 3, rx * 2, ry * 2);
}

// ============================================================================
// 2. THÁNH KỴ SĨ — HÀO QUANG HỘ THỂ (260 Bộ / 350 Thiên Mã)
// ============================================================================
export function drawHolyAuraBurst(g, x, y, r, t, enhanced = false) {
  const p = AURA_PAL.holy, hp = AURA_PAL.holyHeal;
  const ease = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const fade = Math.sin(Math.PI * Math.max(0, Math.min(1, t)));
  const rr = Math.max(16, r * (0.1 + 0.9 * ease));
  const trailR = Math.max(10, r * (0.05 + 0.95 * Math.pow(Math.max(0, t), 0.65)));

  g.fillStyle(p[3], fade * 0.08).fillCircle(x, y, rr);
  g.lineStyle(4, p[2], fade * 0.75).strokeCircle(x, y, rr);
  g.lineStyle(2, p[4], fade * 0.95).strokeCircle(x, y, rr);
  g.lineStyle(2, enhanced ? hp[3] : p[3], fade * 0.65).strokeCircle(x, y, trailR);

  const count = enhanced ? 10 : 8;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + t * 0.5;
    stamp(g, i % 2 === 0 ? 'holyShield' : 'divineCross', x + Math.cos(a) * rr, y + Math.sin(a) * rr - 4, enhanced && i % 2 === 1 ? hp : p, fade * 0.95, 2.1);
  }
}

export function drawHolySustainedField(g, x, y, r, time, burstT = 1, enhanced = false, scene = null, obj = null) {
  const p = AURA_PAL.holy, hp = AURA_PAL.holyHeal;
  const pulse = 0.84 + Math.sin(time / 240) * 0.16;

  if (burstT < 1) {
    drawHolyAuraBurst(g, x, y, r, burstT, enhanced);
  }

  // Multi-layered Additive Divine Light Sanctuary using paladin-divine-auras (extracted from #000000 black background)
  if (scene && obj && ensureAuraFrames(scene, 'paladin-divine-auras')) {
    obj.classAuraSprites ||= new Map();
    const map = obj.classAuraSprites;
    const isBursting = burstT < 1;
    const easeOut = 1 - Math.pow(1 - Math.max(0, Math.min(1, burstT)), 3);
    const setDivine = (id, frame, px, py, w, h, depth, alpha, rot = 0) => {
      let img = map.get(id);
      if (!img || !img.active) {
        img = scene.add.image(px, py, 'paladin-divine-auras', frame);
        map.set(id, img);
      }
      img.setTexture('paladin-divine-auras', frame).setPosition(px, py).setDisplaySize(w, h).setDepth(depth).setAlpha(alpha).setRotation(rot).setBlendMode?.(1).setVisible(true);
      return img;
    };

    // 1. Rotating Cathedral 16-Ray Sunbeam Mandala filling the interior of the sanctuary
    const mainR = isBursting ? r * (0.12 + 0.88 * easeOut) : r;
    const rayD = mainR * 2.12;
    setDivine('holy-rays', 2, x, y, rayD, rayD, y - 8, (enhanced ? 0.62 : 0.48) * pulse, -time * 0.00014);

    // 2. Luminous Divine Outer Halo Rim (with Winged Shields, Celestial Runes & 4-Pointed Starbursts)
    const rimD = mainR * 2.18;
    setDivine('holy-rim', 0, x, y, rimD, rimD, y - 7, (enhanced ? 0.98 : 0.9) * pulse, time * 0.00018);

    // 3. Two Continuous Expanding Angel-Feather & Starburst Wave Rings (Vòng động lông vũ & sao thánh)
    for (let wIdx = 0; wIdx < 2; wIdx++) {
      const phase = ((time / 1850) + wIdx * 0.5) % 1;
      const waveD = r * (0.16 + phase * 0.82) * 2.16;
      const waveAlpha = Math.sin(phase * Math.PI) * (enhanced ? 0.72 : 0.58) * (isBursting ? easeOut : 1);
      setDivine(`holy-wave-${wIdx}`, 1, x, y, waveD, waveD, y - 6, waveAlpha, (wIdx === 0 ? 1 : -1) * time * 0.00035);
    }

    // 4. Activation Heavenly Light Pillar & Unfurling Angel Wings (Cột ánh sáng thiên thần & đôi cánh phát động)
    if (isBursting) {
      const shockD = r * (0.06 + 0.94 * Math.pow(Math.max(0, burstT), 0.62)) * 2.18;
      setDivine('holy-burst-rim', 1, x, y, shockD, shockD, y - 5, Math.sin(burstT * Math.PI) * 0.95, -time * 0.0006);
      const pillarScale = 0.65 + 0.75 * Math.sin(burstT * Math.PI);
      setDivine('holy-burst-center', 3, x, y - 34, 210 * pillarScale, 220 * pillarScale, y + 5, Math.sin(burstT * Math.PI), 0);
    } else {
      if (map.has('holy-burst-rim')) map.get('holy-burst-rim').setVisible(false);
      if (map.has('holy-burst-center')) map.get('holy-burst-center').setVisible(false);
    }
  } else if (scene && obj) {
    obj.classAuraSprites ||= new Map();
    syncSustainedFieldRims(scene, obj.classAuraSprites, 'holy', 2, 1, x, y, r, y - 7, time, burstT, (enhanced ? 0.92 : 0.84) * pulse, 1);
  }

  // Warm golden-white floor illumination & rising 4-pointed stars / crosses
  g.fillStyle(p[4], enhanced ? 0.065 : 0.045).fillCircle(x, y, r * 0.95);
  g.fillStyle(p[3], enhanced ? 0.09 : 0.06).fillCircle(x, y, r * 0.48);
  drawAnimatedConcentricWaves(g, x, y, r, time, p[3], enhanced ? hp[3] : p[4], pulse * 1.15, 2);

  const rays = enhanced ? 8 : 6;
  for (let i = 0; i < rays; i++) {
    const cycle = ((time / 1700 + i / rays) % 1);
    const a = i * 2.399 + time / 2200;
    const d = r * (0.2 + cycle * 0.74);
    stamp(g, i % 2 === 0 ? 'divineCross' : 'holyShield', x + Math.cos(a) * d, y + Math.sin(a) * d - cycle * 32, enhanced && i % 2 === 0 ? hp : p, Math.sin(cycle * Math.PI) * 0.9, 1.6);
  }
}

export function drawHolyUnderfootBuff(g, x, y, time, enhanced = false, scene = null, obj = null) {
  const p = AURA_PAL.holy;
  const rx = enhanced ? 36 : 31, ry = enhanced ? 14 : 12;

  if (scene && obj && ensureAuraFrames(scene, 'paladin-divine-auras')) {
    obj.classAuraSprites ||= new Map();
    const map = obj.classAuraSprites;
    const w = enhanced ? 104 : 92, h = enhanced ? 74 : 64;
    const frame = enhanced ? 5 : 4;
    let img = map.get('holy-foot');
    if (!img || !img.active) {
      img = scene.add.image(x, y - 3, 'paladin-divine-auras', frame);
      map.set('holy-foot', img);
    }
    const pulse = 0.92 + Math.sin(time / 180) * 0.08;
    img.setTexture('paladin-divine-auras', frame).setPosition(x, y - 3).setDisplaySize(w * pulse, h * pulse).setDepth(y - 1).setAlpha(0.98).setBlendMode?.(1).setVisible(true);
  } else if (scene && obj) {
    obj.classAuraSprites ||= new Map();
    const w = enhanced ? 90 : 78, h = enhanced ? 60 : 52;
    syncAuraSprite(scene, obj.classAuraSprites, 'holy-foot', 'class-auras-1', 1, x, y - 2, w, h, y - 1, time, 0.92);
  }
  g.fillStyle(p[4], 0.16).fillEllipse(x, y + 3, rx * 2, ry * 2);
}

// ============================================================================
// 3. THIẾT VỆ — HIỆU TRIỆU (Bán kính 400)
// ============================================================================
export function drawRallyBurst(g, x, y, r, t) {
  const p = AURA_PAL.guardian;
  const ease = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const fade = Math.min(1, (1 - t) * 2.8);
  const rr = Math.max(20, r * (0.1 + 0.9 * ease));
  const trailR = Math.max(12, r * (0.05 + 0.95 * Math.pow(Math.max(0, t), 0.65)));

  g.fillStyle(p[3], fade * 0.06).fillCircle(x, y, rr);
  g.lineStyle(4, p[2], fade * 0.8).strokeCircle(x, y, rr);
  g.lineStyle(2, p[4], fade * 0.95).strokeCircle(x, y, rr);
  g.lineStyle(2, p[3], fade * 0.65).strokeCircle(x, y, trailR);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + t * 0.3;
    stamp(g, 'wingedShield', x + Math.cos(a) * rr, y + Math.sin(a) * rr - 6, p, fade * 0.95, 2.2);
  }
}

export function drawRallySustainedField(ground, glow, x, y, time, r = 400, scene = null, obj = null, burstT = 1) {
  const p = AURA_PAL.guardian;
  const pulse = 0.8 + Math.sin(time / 250) * 0.14;

  if (scene && obj) {
    obj.classAuraSprites ||= new Map();
    syncSustainedFieldRims(scene, obj.classAuraSprites, 'rally', 3, 2, x, y, r, y - 7, time, burstT, 0.88 * pulse, 1);
  }
  ground.fillStyle(p[3], 0.025).fillCircle(x, y, r * 0.94);
  drawAnimatedConcentricWaves(ground, x, y, r, time, p[2], p[4], pulse, 2);
  stamp(glow, 'wingedShield', x, y - 62 + Math.sin(time / 190) * 3, p, 0.92, 2.2);
}

// ============================================================================
// 4. THỦY PHÁP SƯ — THỦY DƯỠNG (Bán kính 520)
// ============================================================================
export function drawTideFieldVFX(g, e, t) {
  const p = AURA_PAL.tide, r = e.radius || 520;
  const fade = Math.min(1, (1 - t) * 5);
  const phase = t * 16;

  // Activation wave expanding from caster (0.1*r) out to full 520 ring during first 12% of lifetime
  if (t < 0.12) {
    const bt = t / 0.12, ease = 1 - Math.pow(1 - bt, 3);
    const br = r * (0.1 + 0.9 * ease), tr = r * (0.05 + 0.95 * Math.pow(bt, 0.65));
    const bf = Math.sin(bt * Math.PI);
    g.fillStyle(p[3], bf * 0.07).fillCircle(e.x, e.y, br);
    g.lineStyle(4, p[2], bf * 0.8).strokeCircle(e.x, e.y, br);
    g.lineStyle(2, p[4], bf * 0.95).strokeCircle(e.x, e.y, br);
    g.lineStyle(2, p[3], bf * 0.65).strokeCircle(e.x, e.y, tr);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + bt * 0.6;
      drawGlossyBubble(g, e.x + Math.cos(a) * br, e.y + Math.sin(a) * br, 5 + (i % 3) * 2.5, p, bf * 0.95);
    }
  }

  g.fillStyle(p[1], fade * 0.03).fillCircle(e.x, e.y, r * 0.94);
  // Continuous animated concentric water ripples inside the 520 zone
  drawAnimatedConcentricWaves(g, e.x, e.y, r, t * 10000, p[2], p[3], fade, 3);

  // Glossy water bubbles floating upward across the area of effect
  for (let i = 0; i < 24; i++) {
    const a = i * 2.399 + Math.sin(phase * 0.25 + i) * 0.12;
    const d = r * (0.2 + ((i * 29) % 74) / 100);
    const cycle = (phase * 0.32 + i * 0.19) % 1;
    const bx = e.x + Math.cos(a) * d;
    const by = e.y + Math.sin(a) * d - cycle * 36;
    const rad = 4 + (i % 3) * 2;
    drawGlossyBubble(g, bx, by, rad, p, fade * Math.sin(cycle * Math.PI) * 0.88);
  }
}

// ============================================================================
// 5. THÀNH ĐỒNG & CUỒNG HUYẾT / HUYẾT NỘ — HIỆU ỨNG PHÁT ĐỘNG
// ============================================================================
export function drawBulwarkBurst(g, x, y, r, t) {
  const p = AURA_PAL.bulwark;
  const ease = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const fade = Math.min(1, (1 - t) * 3);
  const rr = Math.max(16, r * (0.15 + 0.85 * ease));

  g.lineStyle(3, p[3], fade * 0.85).strokeCircle(x, y, rr);
  g.lineStyle(1.5, p[4], fade * 0.65).strokeCircle(x, y, rr * 0.78);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + t * 0.5;
    stamp(g, 'towerShield', x + Math.cos(a) * rr * 0.88, y + Math.sin(a) * rr * 0.88 - t * 8, p, fade * 0.95, 2.2);
  }
}

export function drawBloodFuryBurst(g, x, y, r, t) {
  const p = AURA_PAL.fury;
  const ease = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const fade = Math.min(1, (1 - t) * 3);
  const rr = Math.max(16, r * (0.15 + 0.85 * ease));

  g.fillStyle(p[0], fade * 0.2).fillCircle(x, y, rr);
  g.lineStyle(3, p[2], fade * 0.9).strokeCircle(x, y, rr);
  g.lineStyle(1.5, p[3], fade * 0.7).strokeCircle(x, y, rr * 0.78);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - t * 1.1;
    const fx = x + Math.cos(a) * rr, fy = y + Math.sin(a) * rr;
    g.fillStyle(p[3], fade * 0.9).fillTriangle(fx - 5, fy + 2, fx + 5, fy + 2, fx, fy - 20 * Math.sin(t * Math.PI));
  }
}

// ============================================================================
// 6. HIỆU ỨNG BUFF HÀO QUANG DƯỚI CHÂN (CHỈ ĐỒNG MINH — GỌN DƯỚI CHÂN)
// ============================================================================
export function drawUnitAuraBuffs(s, u, obj, time) {
  const ground = s.unitGround, glow = s.unitGlow;
  if (!ground || !glow) return;
  const x = obj.sprite.x, y = obj.groundY ?? obj.sprite.y;
  const buffs = (u.buffs || []).filter(b => b.time > 0);

  const isAlly = Boolean(u.hero || u.owner);
  const rallyBuff = buffs.find(b => b.aura === 'rally');
  const blessed = Boolean(rallyBuff);
  const shield = !u.boss && (u.shield > 0 || buffs.some(b => b.shield || b.armor > 0));
  const fury = buffs.some(b => b.lifesteal || b.powerMultiplier) || (u.hero === 'warrior-2' && u.hp < (u.stats?.hp || 100) * 0.4);
  const haste = buffs.some(b => b.haste && b.aura !== 'rally' && !b.lifesteal && !b.powerMultiplier);

  const inTideField = isAlly && (
    buffs.some(b => b.aura === 'tide') ||
    (s.liveVFX || []).some(v => v.kind === 'tide' && v.e?.type === 'tide-field' && Math.hypot(x - v.e.x, y - v.e.y) <= (v.e.radius || 520))
  );

  obj.classAuraSprites ||= new Map();
  const activeSpriteIds = new Set();

  // 1) THIẾT VỆ — HIỆU TRIỆU (RALLY): Viền ngoài 400 + Vòng động + Hiệu ứng phát động tỏa ra
  if (blessed) {
    const p = AURA_PAL.guardian;
    if (!obj.rallyActive || (rallyBuff.time > (obj.lastRallyTime || 0) + 0.2)) {
      obj.rallyStarted = time;
    }
    obj.rallyActive = true;
    obj.lastRallyTime = rallyBuff.time;
    const burstT = Math.max(0, Math.min(1, (time - (obj.rallyStarted || time)) / 850));

    if (u.classId === 'guardian') {
      activeSpriteIds.add('rally');
      drawRallySustainedField(ground, glow, x, y, time, 400, s, obj, burstT);
    }
    activeSpriteIds.add('rally-foot');
    syncAuraSprite(s, obj.classAuraSprites, 'rally-foot', 'class-auras-1', 2, x, y - 1, 80, 52, y - 1, time, 0.92);
    ground.fillStyle(p[3], 0.1).fillEllipse(x, y + 3, 58, 20);
  } else {
    obj.rallyActive = false;
    obj.lastRallyTime = 0;
    destroyFieldRims(obj.classAuraSprites, 'rally');
  }

  // 2) THỦY PHÁP SƯ — THỦY DƯỠNG (HEALING TIDE): Vòng sóng nước & bong bóng gọn dưới chân đồng minh (78x50)
  if (inTideField) {
    const p = AURA_PAL.tide;
    activeSpriteIds.add('tide-foot');
    syncAuraSprite(s, obj.classAuraSprites, 'tide-foot', 'class-auras-1', 3, x, y - 1, 78, 50, y - 1, time, 0.92);
    for (let i = 0; i < 3; i++) {
      const cycle = ((time / 1100 + i / 3) % 1);
      const a = i * 2.1 + Math.sin(cycle * TAU) * 0.4;
      drawGlossyBubble(glow, x + Math.cos(a) * 18, y + 2 - cycle * 32, 3.5 + (i % 2) * 1.5, p, Math.sin(cycle * Math.PI) * 0.9);
    }
  }

  // 3) THÀNH ĐỒNG (BULWARK / SHIELD): Vòng khiên pháo đài dưới chân (82x54)
  if (shield) {
    const p = AURA_PAL.bulwark;
    activeSpriteIds.add('bulwark-foot');
    syncAuraSprite(s, obj.classAuraSprites, 'bulwark-foot', 'class-auras-2', 1, x, y - 2, 82, 54, y - 1, time, 0.94);
    ground.fillStyle(p[3], 0.1).fillEllipse(x, y + 3, 60, 22);
  }

  // 4) CUỒNG HUYẾT / HUYẾT NỘ (FURY / BLOOD RAGE): Vòng Ký Tự Cổ Màu Đỏ dưới chân (84x56)
  if (fury) {
    const p = AURA_PAL.fury;
    activeSpriteIds.add('fury-foot');
    syncAuraSprite(s, obj.classAuraSprites, 'fury-foot', 'class-auras-2', 2, x, y - 1, 84, 56, y - 1, time, 0.95);
    ground.fillStyle(p[0], 0.2).fillEllipse(x, y + 3, 62, 22);
    if (!obj.empoweredId && u.classId !== 'berserker') {
      const wx = x + (u.face || 1) * 16, wy = obj.sprite.y - 27;
      glow.fillStyle(p[2], 0.22).fillCircle(wx, wy, 17);
      glow.lineStyle(3, p[3], 0.8).lineBetween(wx, wy + 9, wx + (u.face || 1) * 9, wy - 13);
    }
  }

  if (haste) {
    const p = AURA_PAL.guardian;
    ground.lineStyle(1.5, p[3], 0.65).strokeEllipse(x, y + 3, 54, 19);
  }

  for (const key of ['rally-foot', 'tide-foot', 'bulwark-foot', 'fury-foot']) {
    if (!activeSpriteIds.has(key) && obj.classAuraSprites.has(key)) {
      obj.classAuraSprites.get(key).destroy();
      obj.classAuraSprites.delete(key);
    }
  }
}

// ============================================================================
// 7. PHONG KIẾM KHÁCH — GIÓ BẢO VỆ (Vòng lốc gió gọn dưới chân 80x52)
// ============================================================================
export function drawWindUnderfootBuff(ground, glow, x, y, time, fieldBuff = false, scene = null, obj = null) {
  if (!ground || !glow) return;
  const p = AURA_PAL.wind;
  if (scene && obj) {
    obj.classAuraSprites ||= new Map();
    const w = fieldBuff ? 88 : 78, h = fieldBuff ? 58 : 50;
    syncAuraSprite(scene, obj.classAuraSprites, 'wind-foot', 'class-auras-2', 0, x, y - 2, w, h, y - 1, time, 0.92);
  }
  ground.fillStyle(p[3], 0.1).fillEllipse(x, y + 3, 56, 20);
}
