import { writeFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';
import { resolve } from 'node:path';
import { HEROES } from '../public/content.js';
import { CLASSES, SKILLS, skillAtRank, skillPrice } from '../public/skills.js';
import { PASSIVES } from '../public/passives.js';
import { GEMS, GEM_RULES, gemStatsAt, gemTotalCost } from '../public/gems.js';
import { WIND } from '../public/wind-config.js';
import { VANGUARD } from '../public/vanguard-config.js';
import { FALLEN } from '../public/fallen-config.js';
import { PALADIN } from '../public/paladin-config.js';
import { stats } from '../simulation.mjs';

// --- Pure-Node .xlsx (OOXML ZIP) Writer ---
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8');
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const comp = deflateRawSync(raw);
    const crc = crc32(raw);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, comp);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);

    offset += lh.length + nameBuf.length + comp.length;
  }
  const cdBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...locals, cdBuf, eocd]);
}

function xmlEsc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function colLetter(idx) {
  let s = '';
  let n = idx + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function buildSheetXml(rows, colWidths = []) {
  const colsXml = colWidths.length
    ? `<cols>${colWidths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const rowsXml = rows.map((row, rIdx) => {
    const cellsXml = row.map((val, cIdx) => {
      const ref = `${colLetter(cIdx)}${rIdx + 1}`;
      const style = rIdx === 0 ? 1 : (rIdx % 2 === 0 ? 2 : 0);
      if (typeof val === 'number' && Number.isFinite(val)) {
        return `<c r="${ref}" s="${style}"><v>${val}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr" s="${style}"><is><t>${xmlEsc(val)}</t></is></c>`;
    }).join('');
    return `<row r="${rIdx + 1}"${rIdx === 0 ? ' ht="28" customHeight="1"' : ''}>${cellsXml}</row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  ${colsXml}
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

function buildXlsx(sheets) {
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Segoe UI"/><color rgb="FF192A21"/></font>
    <font><b/><sz val="11"/><name val="Segoe UI"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF176148"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF6F1E4"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFD5CAB4"/></left><right style="thin"><color rgb="FFD5CAB4"/></right><top style="thin"><color rgb="FFD5CAB4"/></top><bottom style="thin"><color rgb="FFD5CAB4"/></bottom></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
  </cellXfs>
</styleSheet>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  ${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((s, i) => `<sheet name="${xmlEsc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}
  </sheets>
</workbook>`;

  const files = [
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rels },
    { name: 'xl/workbook.xml', data: wbXml },
    { name: 'xl/_rels/workbook.xml.rels', data: wbRels },
    { name: 'xl/styles.xml', data: stylesXml },
    ...sheets.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: buildSheetXml(s.rows, s.widths)
    }))
  ];
  return buildZip(files);
}

// --- Mock Player Builders (Base vs Full Self-Buffed) ---
function mockBasePlayer(heroId, level = 1) {
  return {
    id: 'sim-base',
    hero: heroId,
    classId: HEROES.find(h=>h.id===heroId)?.classId,
    level,
    hp: 99999,
    upHP: 0, upPower: 0, upArmor: 0, upHaste: 0,
    mastery: 0,
    forestStats: {},
    buffs: []
  };
}

function mockBuffedPlayer(heroId, level = 20, skillRank = 10, rRank = 6) {
  const base = mockBasePlayer(heroId, level);
  base.mastery = 2; // Tinh thông bậc 2 (+16% Công + hiệu ứng nội tại)
  const buffs = [];
  let extra = { buffs };
  const eSkill = SKILLS.find(s => s.classId === CLASSES[HEROES.find(h => h.id === heroId).classId] ? false : false);
  const heroObj = HEROES.find(h => h.id === heroId);
  const cid = heroObj.classId;

  if (cid === 'windblade') {
    extra.windPassiveStacks = 5;
    extra.windBladeStacks = 5;
    extra.windGuard = 6;
    extra.windFieldBuff = true;
  } else if (cid === 'vanguard') {
    extra.vanguardTime = 90; // Dạng Cự Nhân
    extra.hp = 100; // < 50% HP để lấy 3-4 stack mất máu
  } else if (cid === 'fallen') {
    extra.fallenMounted = true;
    extra.fallenAura = { power: FALLEN.aura.mountedPower, haste: FALLEN.aura.mountedHaste };
  } else if (cid === 'paladin') {
    extra.holyMounted = true;
    extra.holyAura = { armor: PALADIN.aura.mountedArmor, reduction: PALADIN.aura.mountedReduction };
  } else if (cid === 'darkelf') {
    extra.moonStacks = 8;
  } else if (cid === 'assassin') {
    buffs.push({ time: 3, haste: 0.3, speed: 0.3 });
  } else if (cid === 'guardian') {
    extra.guardArmorStacks = 3;
    const rally = skillAtRank(SKILLS.find(s => s.id === 'rally'), rRank);
    buffs.push({ time: 6, haste: 0.2 });
    const bulwark = skillAtRank(SKILLS.find(s => s.id === 'bulwark'), skillRank);
    buffs.push({ time: 6, armor: 6 });
    extra._shieldPct = bulwark.shield;
  } else if (cid === 'duelist') {
    extra.dualSwords = true; // Song kiếm max 20 stack
    extra.duelStacks = 20;
    extra.duelSwapTime = 3;
  } else if (cid === 'ranger') {
    extra.focusStacks = 10;
  } else if (cid === 'berserker') {
    extra.warStacks = 5;
    const fury = skillAtRank(SKILLS.find(s => s.id === 'fury'), skillRank);
    buffs.push({ time: 7, haste: fury.haste });
  } else if (cid === 'ravager') {
    extra.hp = 100; // Dưới 50% HP (+35% Công/Tốc) - mức thực chiến ổn định (dưới 15% là +70%)
    const rage = skillAtRank(SKILLS.find(s => s.id === 'blood-rage'), skillRank);
    buffs.push({ time: 7, powerMultiplier: 0.25, haste: rage.haste });
  }
  return { ...base, ...extra };
}

const BUFF_DESC = {
  windblade: '5 tầng Phong Tốc + E (Thanh Phong) + đứng trong R (Kiếm Vực: +20% Công, +15% Tốc đánh, +35% Tốc chạy) + Tinh thông 2',
  vanguard: 'Dạng Cự Nhân R (+80% HP, +35% Công, +6 Giáp) + Tinh thông 2 (+16% Công)',
  fallen: 'Dạng Diệt Vong R (+25% Công, +15% Tốc chạy) + Aura E (+18% Công, +22% Tốc đánh) + Tinh thông 2',
  paladin: 'Dạng Thiên Mã R (+40% HP, +7 Giáp, +20% Tốc chạy) + Aura E (+8 Giáp, -22% dmg nhận) + Tinh thông 2',
  darkelf: '8 tầng Nội tại (+100 Tầm, +20% Tốc đánh) + Đứng rìa 300px (+35% dmg) + Tinh thông 2',
  assassin: 'Sau Ẩn thân E (+30% Tốc chạy) + Đánh sau lưng (+50% dmg) + Tinh thông 2 (bỏ qua 40% giáp)',
  guardian: '3 tầng Giáp Nội tại (+15% Giáp) + E Thành Đồng (+6 Giáp, Giáp ảo) + R (+20% Tốc đánh) + Tinh thông 2',
  duelist: 'Song Kiếm E + 20 tầng Kiếm Ý (+20% Tốc đánh, +20% dmg) + Đổi thế (+15% Công/Tốc) + Tinh thông 2',
  ranger: '10 tầng Tập Trung (+40% Tốc đánh, +30% dmg) + Tinh thông 2 (bắn 2 mũi tên 120% Công)',
  berserker: '5 tầng Chiến Ý Tinh thông 2 (+50% Công, +50% Tốc đánh) + E Cuồng Huyết (+Haste)',
  ravager: 'Dưới 50% HP (+35% Công, +35% Tốc đánh) + E Huyết Nộ (+25% Công, +Haste) + Tinh thông 2',
  pyromancer: 'Tinh thông 2 (+16% Công, Thiêu đốt 4% HP/s, đủ 5 tầng +5% mọi sát thương)',
  stormcaller: 'Tinh thông 2 (+16% Công, Đủ 4 stack giật 2 lần 30% Công + lan 20%)',
  tidecaller: 'Tinh thông 2 (+16% Công, Thủy Dưỡng E giảm 15% dmg + hồi máu)',
};

function calcPostBuffDmgMult(heroId) {
  switch (heroId) {
    case 'dark-elf': return 1.35; // Rìa 300px +35% dmg
    case 'goblin-assassin': return 1.5; // Đánh sau lưng / từ tàng hình +50% dmg
    case 'knight-2': return 1.45; // Thiên Mã +45% dmg
    case 'knight-3': return 1.25; // Mục tiêu chảy máu +25% (Diệt Vong)
    case 'samurai-commander': return 1.2; // 20 tầng Song Kiếm +20% dmg
    case 'samurai-archer': return 1.3; // 10 Tập Trung +30% dmg
    case 'warrior-2': return 1.2; // Kỹ năng Cuồng Nộ +20% dmg
    case 'fire-wizard': return 1.05; // 5 tầng bỏng +5% dmg
    default: return 1;
  }
}

function calcTotalSkillDamage(sk, a, power, isBuffed = false, heroId = '') {
  if (!a.mult && sk.id !== 'fallen-sunder' && sk.id !== 'holy-slash' && sk.id !== 'vanguard-flurry') {
    return 0;
  }
  const scale = sk.mult ? a.mult / sk.mult : 1;
  let totalMult = 0;
  if (sk.id === 'vanguard-flurry') {
    totalMult = isBuffed ? (9 * VANGUARD.e.giantMult * 0.42 + VANGUARD.e.giantMult * 0.85) * scale : (6 * 0.42 + 0.85) * scale;
  } else if (sk.id === 'fallen-sunder') {
    const mMult = isBuffed ? FALLEN.q.mountedMult : 1;
    const hits = isBuffed ? 6 : 4;
    totalMult = (hits * 0.45 + 0.85 + 1.25) * mMult * scale;
  } else if (sk.id === 'holy-slash') {
    const mMult = isBuffed ? PALADIN.mountedQ : 1;
    totalMult = (0.9 + 1.15 + 1.9) * mMult * scale;
  } else if (sk.id === 'vanguard-charge') {
    totalMult = a.mult * (isBuffed ? VANGUARD.q.giantMult : 1);
  } else if (sk.id === 'elf-eclipse') {
    const ticks = Math.floor((a.delay || 3) / (a.fallInterval || 0.5));
    totalMult = ticks * (a.fallMult || 0.35) + a.mult;
  } else if (sk.id === 'chain-lightning') {
    let sum = 0;
    for (let i = 0; i < (a.targets || 4); i++) sum += Math.pow(0.8, i);
    totalMult = a.mult * sum;
  } else if (sk.id === 'wind-storm') {
    const ticks = Math.floor((a.duration || 5) / 0.5);
    totalMult = a.mult * ticks;
  } else if (sk.id === 'bladestorm' && isBuffed) {
    totalMult = (6 * 0.55 + 1.4) * scale;
  } else if (sk.id === 'arrow-rain') {
    totalMult = a.mult * Math.floor((a.duration || 5) / (a.interval || 0.2));
  } else if (sk.id === 'flamefield' || sk.id === 'tempest' || sk.id === 'blizzard') {
    totalMult = a.mult * Math.floor((a.duration || 5) / (a.interval || 1));
  } else if (sk.id === 'frostnova') {
    totalMult = a.mult * (a.hits || 3);
  } else if (sk.id === 'assassin-double' || sk.id === 'blood-cleave') {
    totalMult = a.mult * 2;
  } else if (sk.id === 'bloodstorm') {
    totalMult = a.mult * 6;
  } else {
    totalMult = a.mult;
  }

  let dotMult = 0;
  if (a.burn && a.statusDuration) dotMult = a.burn * a.statusDuration;
  if (a.poison && a.statusDuration) dotMult = a.poison * a.statusDuration;
  if (a.bleed && a.statusDuration) dotMult = a.bleed * a.statusDuration;

  const dmgBonus = isBuffed ? calcPostBuffDmgMult(heroId) : 1;
  return Math.round(power * (totalMult + dotMult) * dmgBonus);
}

function calcSkillShieldHp(sk, a, maxHp, armor, isBuffed = false) {
  if (sk.id === 'bulwark' && a.shield) {
    return Math.round(maxHp * a.shield);
  }
  if (sk.id === 'holy-slash') {
    const ratio = isBuffed ? PALADIN.q.mountedShieldRatio : PALADIN.q.shieldRatio;
    const masteryBonus = isBuffed ? 1.25 : 1; // Tinh thông 2 Thiên Mã +25% Giáp ảo
    return Math.round(maxHp * ratio * masteryBonus);
  }
  return 0;
}

function calcSkillHealHp(sk, a, maxHp, totalDmg = 0, isBuffed = false) {
  if (sk.id === 'healing-tide' && a.heal) {
    return Math.round(maxHp * a.heal * (a.duration || 10)); // Tổng hồi trong 10s
  }
  if (sk.id === 'rally' && a.heal) {
    return Math.round(maxHp * a.heal);
  }
  if (sk.id === 'vanguard-flurry') {
    const cap = isBuffed ? VANGUARD.e.giantHealCap : VANGUARD.e.healCap;
    const ratio = isBuffed ? VANGUARD.e.giantHeal : VANGUARD.e.heal;
    return Math.round(Math.min(maxHp * cap, totalDmg * ratio));
  }
  if (sk.id === 'fallen-sunder') {
    return Math.round(Math.min(maxHp * FALLEN.q.leechCap, totalDmg * FALLEN.q.leech));
  }
  if (sk.id === 'holy-aura' && isBuffed) {
    return Math.round(maxHp * PALADIN.aura.healPerSecond * PALADIN.aura.duration);
  }
  return 0;
}

// ==========================================
// SHEET 1: TONG QUAN 14 TUONG (TRUOC & SAU BUFF)
// ==========================================
const s1Rows = [[
  'ID Tướng', 'Tên Tướng', 'Hệ / Class', 'Vai trò',
  'HP Lv1', 'Công Lv1', 'DPS Thường Lv1',
  'HP Lv10', 'Công Lv10 (Chưa buff)', 'DPS Thường Lv10 (Chưa buff)',
  'HP Lv20 (Chưa buff)', 'Công Lv20 (Chưa buff)', 'Giáp Lv20', 'DPS Thường Lv20 (Chưa buff)',
  'HP Lv20 (Sau Buff)', 'Công Lv20 (Sau Buff)', 'Giáp Lv20 (Sau Buff)', 'Tốc đánh Sau Buff', 'DPS Thường Lv20 (Sau Buff)',
  'Điều kiện Buff tối đa'
]];

for (const h of HEROES) {
  const cls = CLASSES[h.classId];
  const st1 = stats(mockBasePlayer(h.id, 1));
  const st10 = stats(mockBasePlayer(h.id, 10));
  const st20 = stats(mockBasePlayer(h.id, 20));
  const bf20 = stats(mockBuffedPlayer(h.id, 20));
  const aps1 = +(1 / st1.cooldown).toFixed(2);
  const aps10 = +(1 / st10.cooldown).toFixed(2);
  const aps20 = +(1 / st20.cooldown).toFixed(2);
  const apsBf = +(1 / bf20.cooldown).toFixed(2);
  const dmgMult = calcPostBuffDmgMult(h.id);
  const basicMult = h.id === 'samurai-archer' ? 1.2 : 1; // Tinh thông 2: 2 mũi tên 60% = 120%

  s1Rows.push([
    h.id, h.name, cls.name, h.role,
    st1.hp, st1.power, Math.round(st1.power * aps1),
    st10.hp, st10.power, Math.round(st10.power * aps10),
    st20.hp, st20.power, +st20.armor.toFixed(1), Math.round(st20.power * aps20),
    bf20.hp, bf20.power, +bf20.armor.toFixed(1), apsBf, Math.round(bf20.power * apsBf * dmgMult * basicMult),
    BUFF_DESC[h.id] || ''
  ]);
}

// ==========================================
// SHEET 2: CHI SO TUONG LV 1..20
// ==========================================
const s2Rows = [[
  'ID Tướng', 'Tên Tướng', 'Hệ / Class', 'Cấp độ (Lv)',
  'HP Cơ Bản', 'Công Cơ Bản', 'Giáp Cơ Bản', 'Tốc chạy', 'Tốc đánh Cơ Bản', 'DPS Cơ Bản', 'EHP Cơ Bản',
  'HP Sau Buff', 'Công Sau Buff', 'Giáp Sau Buff', 'Tốc đánh Sau Buff', 'DPS Sau Buff', 'EHP Sau Buff'
]];

for (const h of HEROES) {
  const cls = CLASSES[h.classId];
  const dmgMult = calcPostBuffDmgMult(h.id);
  const basicMult = h.id === 'samurai-archer' ? 1.2 : 1;
  for (let lv = 1; lv <= 20; lv++) {
    const st = stats(mockBasePlayer(h.id, lv));
    const bf = stats(mockBuffedPlayer(h.id, lv));
    const aps = +(1 / st.cooldown).toFixed(2);
    const apsBf = +(1 / bf.cooldown).toFixed(2);
    s2Rows.push([
      h.id, h.name, cls.name, lv,
      st.hp, st.power, +st.armor.toFixed(1), st.speed, aps, Math.round(st.power * aps), Math.round(st.hp * (1 + st.armor * 0.04)),
      bf.hp, bf.power, +bf.armor.toFixed(1), apsBf, Math.round(bf.power * apsBf * dmgMult * basicMult), Math.round(bf.hp * (1 + bf.armor * 0.04))
    ]);
  }
}

// ==========================================
// SHEET 3: DMG, SHIELD, HEAL KY NANG (TRUOC & SAU BUFF)
// ==========================================
const s3Rows = [[
  'Tên Tướng', 'Hệ / Class', 'Phím', 'Tên Kỹ Năng', 'Cấp Kỹ Năng',
  'Giá nâng (Vàng)', 'Tổng vàng', 'Hồi chiêu (s)', 'Năng lượng', 'Hệ số % (1 hit)',
  'Tổng Dmg Lv1 (Chưa buff)', 'Tổng Dmg Lv10 (Chưa buff)', 'Tổng Dmg Lv20 (Chưa buff)',
  'Tổng Dmg Lv10 (Sau Buff)', 'Tổng Dmg Lv20 (Sau Buff)', 'DPS Kỹ Năng Lv20 (Sau Buff)',
  'Giáp Ảo Lv20 (Chưa buff - HP)', 'Giáp Ảo Lv20 (Sau Buff - HP)',
  'Hồi Máu Lv20 (Chưa buff - HP)', 'Hồi Máu Lv20 (Sau Buff - HP)',
  'Bán kính / Tầm', 'Thời gian CC / Hiệu lực (s)', 'Tốc đánh cộng (%)', 'Hút máu (%)', 'Công cộng E (%)'
]];

for (const sk of SKILLS) {
  const cls = CLASSES[sk.classId];
  const hero = HEROES.find(h => h.classId === sk.classId) || HEROES[0];
  const b1 = stats(mockBasePlayer(hero.id, 1));
  const b10 = stats(mockBasePlayer(hero.id, 10));
  const b20 = stats(mockBasePlayer(hero.id, 20));
  let cumGold = 0;

  for (let rank = 1; rank <= sk.maxRank; rank++) {
    const price = rank === 1 ? sk.unlockCost : skillPrice(sk, rank - 1);
    cumGold += price;
    const a = skillAtRank(sk, rank);
    const bf10 = stats(mockBuffedPlayer(hero.id, 10, rank, Math.min(6, rank)));
    const bf20 = stats(mockBuffedPlayer(hero.id, 20, rank, Math.min(6, rank)));

    const d1 = calcTotalSkillDamage(sk, a, b1.power, false, hero.id);
    const d10 = calcTotalSkillDamage(sk, a, b10.power, false, hero.id);
    const d20 = calcTotalSkillDamage(sk, a, b20.power, false, hero.id);
    const d10Bf = calcTotalSkillDamage(sk, a, bf10.power, true, hero.id);
    const d20Bf = calcTotalSkillDamage(sk, a, bf20.power, true, hero.id);
    const dps20Bf = a.cooldown > 0 ? Math.round(d20Bf / a.cooldown) : 0;

    const sh20 = calcSkillShieldHp(sk, a, b20.hp, b20.armor, false);
    const sh20Bf = calcSkillShieldHp(sk, a, bf20.hp, bf20.armor, true);
    const heal20 = calcSkillHealHp(sk, a, b20.hp, d20, false);
    const heal20Bf = calcSkillHealHp(sk, a, bf20.hp, d20Bf, true);

    const ccStr = [
      a.stun ? `Choáng ${a.stun}s` : '',
      a.airTime ? `Hất tung ${a.airTime}s` : '',
      a.slow ? `Chậm ${Math.round(a.slow * 100)}%` : '',
      a.duration ? `Hiệu lực ${a.duration}s` : ''
    ].filter(Boolean).join(' · ') || '-';

    s3Rows.push([
      hero.name, cls.name, sk.slot, sk.name, rank,
      price, cumGold, a.cooldown, a.cost || 0, a.mult ? Math.round(a.mult * 100) : 0,
      d1, d10, d20, d10Bf, d20Bf, dps20Bf,
      sh20, sh20Bf, heal20, heal20Bf,
      `${a.radius || 0} / ${a.range || 0}`, ccStr,
      +((a.haste||0)*100).toFixed(2), +((a.lifesteal||0)*100).toFixed(2), sk.id==='blood-rage'?25+(rank-1)*4:sk.id==='fallen-aura'?(FALLEN.aura.power+(rank-1)*.02)*100:0
    ]);
  }
}

// ==========================================
// SHEET 4: BANG HOI MAU, GIAP AO & CHONG CHIU CHI TIET
// ==========================================
const s4Rows = [[
  'Tên Tướng', 'Hệ / Class', 'Loại Phòng Thủ / Hồi Phục', 'Nguồn kích hoạt',
  'Công thức (%)', 'Giá trị thực Lv1 (HP)', 'Giá trị thực Lv10 (HP)', 'Giá trị thực Lv20 (Chưa Buff - HP)',
  'Giá trị thực Lv20 (Sau Buff - HP)', 'Thời gian duy trì / Hồi chiêu', 'Ghi chú áp dụng cho Đồng đội'
]];

function addSurvRow(heroId, kind, source, formula, valAt) {
  const h = HEROES.find(x => x.id === heroId);
  const cls = CLASSES[h.classId];
  const b1 = stats(mockBasePlayer(heroId, 1));
  const b10 = stats(mockBasePlayer(heroId, 10));
  const b20 = stats(mockBasePlayer(heroId, 20));
  const bf20 = stats(mockBuffedPlayer(heroId, 20, 10, 6));
  const [v1, v10, v20, vBf, dur, ally] = valAt(b1, b10, b20, bf20);
  s4Rows.push([h.name, cls.name, kind, source, formula, v1, v10, v20, vBf, dur, ally]);
}

// Thiết Vệ
addSurvRow('knight-1', 'Giáp Ảo (Shield)', 'E · Thành Đồng (Bậc 1)', '40% Máu tối đa + 6 Giáp',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.4), Math.round(b10.hp * 0.4), Math.round(b20.hp * 0.4), Math.round(bf.hp * 0.4), '6s / CD 15s', 'Tự thân']);
addSurvRow('knight-1', 'Giáp Ảo (Shield)', 'E · Thành Đồng (Bậc 10)', '130% Máu tối đa + 6 Giáp',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 1.3), Math.round(b10.hp * 1.3), Math.round(b20.hp * 1.3), Math.round(bf.hp * 1.3), '15s / CD 6s', 'Tự thân']);
addSurvRow('knight-1', 'Chống chịu + Phản đòn', 'Nội tại · Giáp Thép Phản Chấn', 'Giảm 10% dmg + Phản (15% Giáp + 1% HP) ×2 khi có Giáp ảo; 10% phản → Giáp ảo',
  (b1, b10, b20, bf) => [Math.round(b1.armor * 0.15 + b1.hp * 0.01), Math.round(b10.armor * 0.15 + b10.hp * 0.01), Math.round(b20.armor * 0.15 + b20.hp * 0.01), Math.round((bf.armor * 0.15 + bf.hp * 0.01) * 2), '3s mỗi 4 đòn / Q / E', 'Phản AOE quanh người']);
addSurvRow('knight-1', 'Hồi Máu', 'Tinh thông 2 + Có Giáp Ảo', 'Hồi 1.5% Máu tối đa / giây khi đang có Giáp ảo',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.015), Math.round(b10.hp * 0.015), Math.round(b20.hp * 0.015), Math.round(bf.hp * 0.015), 'Liên tục khi có Khiên', 'Tự thân']);
addSurvRow('knight-1', 'Hồi Máu Đội', 'R · Hiệu Triệu (Bậc 1 → Bậc 6)', '30% → 60% Máu tối đa + 20% → 60% Tốc đánh',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.3), Math.round(b10.hp * 0.3), Math.round(b20.hp * 0.3), Math.round(bf.hp * 0.6), '6–11s / CD 24→19s', 'Hồi cho Hero & Lính bán kính 400']);

// Thánh Kỵ Sĩ
addSurvRow('knight-2', 'Giáp Ảo (Shield)', 'Q3 · Tam Thập Tự Trảm', '16% HP (24% Thiên Mã) × 1.25 (Tinh thông 2)',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.16), Math.round(b10.hp * 0.16), Math.round(b20.hp * 0.16), Math.round(bf.hp * 0.24 * 1.25), '3s / 3.5s', 'Tự thân (Nổ 80% Công khi vỡ ở TT2)']);
addSurvRow('knight-2', 'Chống chịu + Hồi máu', 'E · Hào Quang Hộ Thể & Thiên Mã', 'Giảm 15% dmg (+5 Giáp) → 22% dmg (+8 Giáp, 1.5% HP/s) ×1.25 TT2',
  (b1, b10, b20, bf) => [0, 0, 0, Math.round(bf.hp * 0.015 * 1.25 * 6), '6s / CD 16s (Tự bật ở R)', 'Áp dụng cho cả đội bán kính 260/350']);
addSurvRow('knight-2', 'Hồi Máu', 'Nội tại · Thánh Ước (4 Dấu)', '6% HP (12% Thiên Mã) × 1.25 TT2',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.06), Math.round(b10.hp * 0.06), Math.round(b20.hp * 0.06), Math.round(bf.hp * 0.12 * 1.25), 'Mỗi 4 đòn / Q', 'Bản thân + 1 đồng minh thấp máu nhất (220px)']);

// Thủy Pháp Sư
addSurvRow('wanderer-magican', 'Hồi Máu Đội + Chống chịu', 'E · Thủy Dưỡng (Bậc 1)', '2% HP/s trong 10s (=20% HP) + Giảm 15% dmg nhận',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.2), Math.round(b10.hp * 0.2), Math.round(b20.hp * 0.2), Math.round(bf.hp * 0.2), '10s / CD 15s', 'Hero, Đồng đội & Lính bán kính 520']);
addSurvRow('wanderer-magican', 'Hồi Máu Đội + Chống chịu', 'E · Thủy Dưỡng (Bậc 10)', '6.5% HP/s trong 10s (=65% HP) + Giảm 15% dmg nhận',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.65), Math.round(b10.hp * 0.65), Math.round(b20.hp * 0.65), Math.round(bf.hp * 0.65), '10s / CD 6s', 'Hero, Đồng đội & Lính bán kính 520']);
addSurvRow('wanderer-magican', 'Hồi Máu Đội', 'Nội tại · Thủy Lưu (4 Stack)', '8% HP (12% Tinh thông 2) cho bản thân + 1→2 đồng minh',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.08), Math.round(b10.hp * 0.08), Math.round(b20.hp * 0.08), Math.round(bf.hp * 0.12), 'Mỗi 4 stack (Q = 3 stack)', 'Bản thân + 1→2 đồng minh % máu thấp nhất']);

// Bất Khuất
addSurvRow('warrior-3', 'Chống chịu + Hút máu', 'Nội tại + R Cự Nhân', 'Giảm 12%→22% (+4% mất máu) dmg nhận; Hồi 10%→18% sát thương thực',
  (b1, b10, b20, bf) => [Math.round(b1.power * 0.1), Math.round(b10.power * 0.1), Math.round(b20.power * 0.1), Math.round(bf.power * 0.18), 'Liên tục (R 90s)', 'Tự thân (+35% kháng CC khi hóa Cự Nhân)']);
addSurvRow('warrior-3', 'Hồi Máu (E)', 'E · Bách Thương Liên Kích', 'Hồi 10% dmg (Tối đa 8% HP) → 18% dmg (Tối đa 12% HP ở Cự Nhân)',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.08), Math.round(b10.hp * 0.08), Math.round(b20.hp * 0.08), Math.round(bf.hp * 0.12), 'CD 14s → 5s', 'Tự thân']);

// Chiến Binh & Cuồng Chiến & Hắc Kỵ Sĩ & Phong Kiếm Khách & Dạ Tiễn
addSurvRow('warrior-1', 'Hút máu + Hồi máu', 'Nội tại (5 tầng) + E Cuồng Huyết', 'Hồi 5%→10% HP mất/hạ; Hút máu 15% (Nội tại) + 25%→61% (E bậc 1→10)',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.05), Math.round(b10.hp * 0.05), Math.round(b20.hp * 0.05), Math.round(bf.hp * 0.1), 'E 7s→16s / CD 16s→7s', 'Tự thân']);
addSurvRow('warrior-2', 'Hút máu', 'Nội tại (<50% / <15% HP) + E Huyết Nộ', 'Hút máu 15% (<50% HP) → 30% (<15% HP TT2) + 18%→54% (E)',
  (b1, b10, b20, bf) => [0, 0, 0, Math.round(bf.power * 0.48), 'E 7s→16s / CD 17s→8s', 'Tự thân (Chịu thêm 10% dmg nếu <15% HP)']);
addSurvRow('knight-3', 'Hồi Máu', 'Q2 · Liên Hoàn Bạo Trảm + TT2', 'Q2 hồi 10% dmg (max 14% HP); TT2 hồi 40%→80% dmg Chảy Máu',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.14), Math.round(b10.hp * 0.14), Math.round(b20.hp * 0.14), Math.round(bf.hp * 0.14), 'CD 8s→3s', 'Tự thân']);
addSurvRow('samurai', 'Chống chịu (E)', 'E · Thanh Phong Hộ Thể', 'Giảm 18% dmg (Bậc 1) → 36% dmg (Bậc 10) + 25% Tốc chạy',
  (b1, b10, b20, bf) => [18, 18, 18, 36, '6s→15s / CD 16s→7s', 'Tự thân (đơn vị %)']);
addSurvRow('dark-elf', 'Hồi Máu (E)', 'E · Tinh Linh Cây', 'Tinh linh hồi 2% Máu tối đa / giây trong 60s',
  (b1, b10, b20, bf) => [Math.round(b1.hp * 0.02), Math.round(b10.hp * 0.02), Math.round(b20.hp * 0.02), Math.round(bf.hp * 0.02), '60s / CD 32s', 'Chủ nhân & Tinh linh']);

// ==========================================
// SHEET 5: THONG KE KHONG CHE (CC TIMING)
// ==========================================
const s5Rows = [[
  'Nguồn (Tướng / Ngọc)', 'Kỹ năng / Nội tại', 'Loại Khống Chế (CC)',
  'Thời gian CC (s)', 'Mức độ (Làm chậm %)', 'Hồi chiêu (s) Bậc 1 → Max',
  'Tỉ lệ duy trì CC (% Uptime)', 'Phạm vi / Số mục tiêu', 'Điều kiện kích hoạt'
]];

const ccEntries = [
  ['Phong Kiếm Khách', 'Q · Phong Ảnh Trảm', 'Hất tung (Airborne)', 0.5, 0, '7s → 3s', '16.7%', 'Dọc đường 210, R 65', 'Trúng quái mặt đất khi lướt'],
  ['Phong Kiếm Khách', 'R · Phong Bạo Kiếm Vực', 'Hất tung liên hoàn', 0.5, 0, '26s → 21s (Hiệu lực 5→10s)', '23.8%', 'Bán kính 180→240', 'Mỗi 0.5s hất tung 0.5s (khóa 1s/quái)'],
  ['Bất Khuất', 'Nội tại Tinh thông 2', 'Choáng (Stun)', 0.4, 0, 'Mỗi 4 đòn thường', '20%+', 'Xuyên mục tiêu', 'Đòn đánh thường thứ 4'],
  ['Hắc Kỵ Sĩ', 'Nội tại (4 Dấu Ấn Tha Hóa)', 'Làm chậm (Slow)', 2.0, 20, 'Mỗi 4 dấu ấn', '40%+', 'Mục tiêu nổ dấu', 'Tích đủ 4 dấu ấn Tha Hóa'],
  ['Thánh Kỵ Sĩ', 'Q2 · Tam Thập Tự Trảm', 'Làm chậm (Slow)', 2.0, 25, '7s → 3s', '66.7%', 'Tầm 125', 'Lần bấm Q thứ 2'],
  ['Thánh Kỵ Sĩ', 'Nội tại Tinh thông 2', 'Choáng (Stun)', 0.35, 0, 'Mỗi 3 đòn thường', '18%+', 'Đơn mục tiêu', 'Đòn đánh thường thứ 3'],
  ['Dạ Tiễn', 'Q · Tên Xuyên Đêm', 'Làm chậm (Slow)', 2.0, '30% → 48%', '6s → 3s', '66.7%', 'Rộng 90, dài 360', 'Xuyên mọi quái trên đường'],
  ['Dạ Tiễn', 'E · Tinh Linh Cây (Rễ Trói)', 'Trói / Cấm di chuyển', 1.5, 100, 'Tự động của Tinh linh', '25%', 'Bán kính nhỏ', 'Tinh linh tự thi triển'],
  ['Dạ Tiễn', 'R · Nguyệt Giáng', 'Choáng (Stun)', 1.0, 0, '30s → 25s', '4.0%', 'Bán kính 205→265', 'Khi mặt trăng chạm đất nổ'],
  ['Hộ Vệ (Thiết Vệ)', 'Q · Khiên Chấn', 'Choáng (Stun)', 0.8, 0, '8s → 3s', '26.7%', 'Bán kính 135→243', 'Sau niệm 1.5s'],
  ['Hộ Vệ (Thiết Vệ)', 'Nội tại Tinh thông 2', 'Choáng (Stun)', 0.45, 0, 'Mỗi 3 đòn thường', '20%+', 'Đơn mục tiêu', 'Đòn thứ 3 tụ lực 1.5s'],
  ['Chiến Binh', 'R · Địa Chấn', 'Hất tung + Choáng nối tiếp', 1.75, 0, '24s → 19s', '9.2%', 'Bán kính 200→260', 'Hất tung 0.55s rồi choáng 1.2s'],
  ['Cung Thủ', 'E · Độc Tiễn', 'Làm chậm (Slow)', 4.0, '20% → 38%', '12s → 3s', '100%', 'Đòn thường & Q', 'Trong thời gian bật E (8→17s)'],
  ['Hỏa Sư', 'E · Biển Lửa', 'Làm chậm (Slow)', 1.0, '15% → 33%', '17s → 8s (Tồn tại 5→14s)', '100%', 'Bán kính 150→258', 'Quái đứng trong vùng lửa'],
  ['Lôi Sư', 'E · Lôi Kích', 'Choáng (Stun)', 1.0, 0, '13s → 4s', '25.0%', 'Bán kính 120→228', 'Nổ tức thì quanh mục tiêu'],
  ['Lôi Sư', 'R · Lôi Trận', 'Choáng ngắt nhịp', 0.2, 0, '25s → 20s (Tồn tại 5→10s)', '10.0%', 'Bán kính 205→265', 'Giật choáng 0.2s mỗi 1s'],
  ['Thủy Pháp Sư', 'Q · Hàn Triều', 'Làm chậm + Hất tung', 4.0, '50% → 68%', '8s → 3s', '100%', 'Bán kính 210→318', 'Chậm 4s; trúng đủ 3 sóng hất tung 0.6s'],
  ['Thủy Pháp Sư', 'R · Bão Tuyết', 'Làm chậm mạnh (Slow)', 1.0, '60% → 70%', '24s → 19s (Tồn tại 5→10s)', '52.6%', 'Bán kính 205→265', 'Làm chậm liên tục khi đứng trong bão'],
  ['Ngọc Sấm', 'Bậc 1 → 3', 'Choáng (Stun) / Boss -25% tốc', 0.4, 25, '22%–35% xác suất', '15%+', 'Nảy 2→5 mục tiêu', 'Tích tầng Dẫn Điện trên đòn thường'],
  ['Ngọc Băng', 'Bậc 1 → 3', 'Làm chậm + Đóng băng (Freeze)', 0.9, '20% → 30%', 'Chậm 3s; Đóng băng 10→30%', '30%+', 'Đơn mục tiêu / Aura 120', 'Đòn thường tích xác suất đóng băng'],
  ['Ngọc Độc', 'Bậc 1 → 3', 'Vũng độc làm chậm + Cắt hồi máu', 4.5, 15, 'Khi quái chết', 'Liên tục', 'Bán kính 60', 'Quái chết để lại Vũng độc 4.5s']
];
for (const row of ccEntries) s5Rows.push(row);

// ==========================================
// SHEET 6: NOI TAI & TINH THONG BAC 2
// ==========================================
const s6Rows = [[
  'ID Tướng', 'Tên Tướng', 'Hệ / Class', 'Tên Nội Tại',
  'Nội Tại Cơ Bản', 'Tinh Thông Bậc 2',
  'Công Lv20 (Chưa buff)', 'Công Lv20 (Sau Buff)', 'HP Lv20 (Sau Buff)', 'Hiệu ứng cộng thêm'
]];
for (const h of HEROES) {
  const cls = CLASSES[h.classId];
  const pas = PASSIVES[h.id] || { name: '', text: '' };
  const b20 = stats(mockBasePlayer(h.id, 20));
  const bf20 = stats(mockBuffedPlayer(h.id, 20));
  s6Rows.push([
    h.id, h.name, cls.name, pas.name,
    pas.text, cls.passive,
    b20.power, bf20.power, bf20.hp,
    BUFF_DESC[h.id] || ''
  ]);
}

// ==========================================
// SHEET 7: TIEN HOA NGOC (6 NGOC x 3 BAC)
// ==========================================
const s7Rows = [[
  'ID Ngọc', 'Tên Ngọc', 'Bậc', 'Giá nâng', 'Tổng vàng',
  'Công (+)', 'Máu (+)', 'Giáp (+)', 'Hút máu (%)', 'Tốc đánh (%)', 'Tốc chạy (%)',
  'Hiệu ứng sát thương / CC / Phá giáp theo bậc', 'Class Cộng Hưởng'
]];
const gemSpecialByTier = {
  thunder: t => `Sét chuỗi nảy ${GEM_RULES.thunder.baseTargets}→${GEM_RULES.thunder.maxTargets} mục tiêu gây ${Math.round(GEM_RULES.thunder.splashByTier[t - 1] * 100)}% Công, choáng ${GEM_RULES.thunder.stun}s (Boss -25% tốc đánh 1s)`,
  ice: t => `Làm chậm ${Math.round(GEM_RULES.ice.slowByTier[t - 1] * 100)}% trong 3s, giảm ${Math.round(GEM_RULES.ice.dmgReduceByTier[t - 1] * 100)}% dmg quái, đóng băng ${GEM_RULES.ice.freeze}s`,
  fire: t => `30% Thiêu đốt ${+(GEM_RULES.fire.percentByTier[t - 1] * 100).toFixed(1)}% HP/s trong 4s (Boss 1.2%), nổ đòn 4 gây ${Math.round(GEM_RULES.fire.detonateByTier[t - 1] * 100)}% Công lan 75px`,
  poison: t => `Độc 6 tầng × ${+(GEM_RULES.poison.percentByTier[t - 1] * 100).toFixed(1)}% HP/s (5s), giảm ${Math.round(GEM_RULES.poison.healCutByTier[t - 1] * 100)}% hồi máu, chết để lại Vũng độc 4.5s`,
  dark: t => `Xuyên ${Math.round(GEM_RULES.dark.penetrationByTier[t - 1] * 100)}% giáp, trừ 2.5% giáp Boss/tầng (tối đa 6), gọi tối đa ${GEM_RULES.dark.skeletonLimitByTier[t - 1]} Xương 25s`,
  wind: t => `Tích 8 tầng × +${Math.round(GEM_RULES.wind.hastePerStackByTier[t - 1] * 100)}% tốc đánh (+${Math.round(GEM_RULES.wind.hastePerStackByTier[t - 1] * 800)}% tối đa), đủ 8 tầng +10% tốc chạy & +20 tầm`
};
const gemResonance = {
  thunder: 'Lôi Sư (Stormcaller)',
  ice: 'Du Pháp (Tidecaller)',
  fire: 'Hỏa Sư (Pyromancer)',
  poison: 'Hắc Kỵ Sĩ (Fallen)',
  dark: 'Cuồng Chiến (Ravager)',
  wind: 'Phong Kiếm Khách / Kiếm Chủ'
};
for (const g of GEMS) {
  for (let tier = 1; tier <= 3; tier++) {
    const gs = gemStatsAt(g.id, tier);
    const upCost = tier === 1 ? GEM_RULES.price : GEM_RULES.upgradePrices[tier - 1];
    s7Rows.push([
      g.id, g.name, tier, upCost, gemTotalCost(tier),
      gs.power, gs.hp, gs.armor, Math.round(gs.lifesteal * 100),
      Math.round(gs.haste * 100), Math.round(gs.speed * 100),
      gemSpecialByTier[g.id](tier), gemResonance[g.id]
    ]);
  }
}

// ==========================================
// SHEET 8: DE XUAT CAN BANG
// ==========================================
const s8Rows = [[
  'Hạng mục', 'Số liệu phát hiện từ bảng Sau Buff', 'Mức độ', 'Đề xuất điều chỉnh cụ thể'
], [
  '1. Giáp Ảo Thành Đồng (E - Thiết Vệ)',
  'Ở Lv20, Thiết Vệ có 1.160 HP; Thành Đồng bậc 10 tạo Giáp ảo 130% HP = 1.508 HP (hồi chiêu chỉ 6s, hiệu lực 15s → duy trì 100% thời gian).',
  'Cao',
  'Đặt trần hệ số Giáp ảo của Thành Đồng tối đa 75%–80% HP và giữ thời gian hiệu lực tối đa 8s để tránh bất tử vĩnh viễn.'
], [
  '2. Hồi Máu Thủy Dưỡng (E - Thủy Pháp Sư)',
  'Ở Lv20 bậc 10, hồi 6.5% HP/s × 10s = 65% HP tối đa (663 HP/người cho toàn bộ Hero & Lính bán kính 520, CD 6s). Kết hợp Ngọc Băng (+37.5%) lên tới 89% HP mỗi 10s.',
  'Cao',
  'Giảm mức tăng mỗi bậc từ +0.5%/s xuống +0.25%/s (tối đa 4.25%/s) và thu hẹp bán kính từ 520 xuống 380.'
], [
  '3. Kỹ năng Zone R bậc 6 (Thiên Thạch, Bão Tuyết, Lôi Trận, Phong Bạo)',
  'R vùng tăng 0,6s mỗi bậc: bậc 6 tồn tại 8s; dùng skillAtRank để tính sát thương theo bậc.',
  'Trung bình - Cao',
  'Giới hạn thời lượng cộng thêm của R tối đa +2s hoặc +3s ở bậc 6 thay vì +5s.'
], [
  '4. Burst Sát Thương Sau Buff (Thánh Kỵ Sĩ, Hắc Kỵ Sĩ, Bất Khuất)',
  'Thiên Mã (+45% dmg, Q3 ×1.35 + Giáp ảo 30% HP = 456 HP), Diệt Vong (+25% Công + 18% Aura + 6 nhát Q), Cự Nhân (+80% HP, +35% Công, E 9 nhát).',
  'Cân bằng tốt',
  'Các dạng hóa thân R đều tiêu hao mana (6–12/s) hoặc có thời gian chờ dài (50s), tạo nhịp giao tranh rõ rệt.'
], [
  '5. Khống chế diện rộng (Q Hàn Triều & E Lôi Kích)',
  'Hàn Triều bậc 10 có CD 3s nhưng làm chậm 68% trong 4s (100% uptime) + hất tung 0.6s mỗi 3s; Lôi Kích bậc 10 làm choáng 1s với CD 4s (25% uptime).',
  'Lưu ý',
  'Cân nhắc giữ CD tối thiểu của Q/E khống chế cứng ở mức 4.5s–5s thay vì 3s.'
]];

// ==========================================
// HELPER CHO CHI SO NOI TAI, NANG CAP, NGOC
// ==========================================
function calcTotalUpgradeGold(base, step, count) {
  return count * base + step * ((count * (count - 1)) / 2);
}

function getHeroRowMetrics(heroId, playerObj, { includeBasicMasteryBonus = false, includePostBuffDmg = false } = {}) {
  const st = stats(playerObj);
  const aps = +(1 / st.cooldown).toFixed(2);
  const dmgMult = includePostBuffDmg ? calcPostBuffDmgMult(heroId) : 1;
  const basicMult = (includeBasicMasteryBonus && heroId === 'samurai-archer' && (playerObj.mastery || 0) >= 2) ? 1.2 : 1;
  const dpsVal = Math.round(st.power * aps * dmgMult * basicMult);
  const ehpVal = Math.round(st.hp * (1 + st.armor * 0.04));
  return {
    hp: st.hp,
    power: st.power,
    armor: +st.armor.toFixed(1),
    speed: Math.round(st.speed),
    aps,
    range: Math.round(st.range),
    dps: dpsVal,
    ehp: ehpVal
  };
}

function applyPassiveStage(heroObj, basePlayer, stage) {
  const cid = heroObj.classId;
  const p = { ...basePlayer, buffs: [...(basePlayer.buffs || [])] };
  let note = 'Chưa kích nội tại';

  if (stage === 'none') return { player: p, note };

  if (cid === 'windblade') {
    if (stage === 'half') {
      p.windPassiveStacks = 3;
      p.windBladeStacks = 3;
      note = '3/5 tầng Phong Tốc (+18% Tốc đánh, +18% Tốc chạy)';
    } else {
      p.windPassiveStacks = 5;
      p.windBladeStacks = 5;
      note = '5/5 tầng Phong Tốc (+30% Tốc đánh, +30% Tốc chạy)';
    }
  } else if (cid === 'vanguard') {
    if (stage === 'half') {
      p.hp = 400;
      note = 'Dưới 70% HP (tăng giáp & hồi phục nội tại)';
    } else {
      p.vanguardTime = 90;
      p.hp = 100;
      note = 'Hóa Cự Nhân (+80% HP, +35% Công, +6 Giáp) + dưới 50% HP';
    }
  } else if (cid === 'fallen') {
    if (stage === 'half') {
      note = 'Tích chảy máu mục tiêu (chưa lên Diệt Vong)';
    } else {
      p.fallenMounted = true;
      note = 'Dạng Diệt Vong (+25% Công, +15% Tốc chạy)';
    }
  } else if (cid === 'paladin') {
    if (stage === 'half') {
      note = 'Thánh Quang tích lũy (chưa gọi Thiên Mã)';
    } else {
      p.holyMounted = true;
      note = 'Cưỡi Thiên Mã (+40% HP, +7 Giáp, +20% Tốc chạy)';
    }
  } else if (cid === 'darkelf') {
    if (stage === 'half') {
      p.moonStacks = 4;
      note = '4/8 tầng Ánh Trăng (+50 Tầm đánh, +10% Tốc đánh)';
    } else {
      p.moonStacks = 8;
      note = '8/8 tầng Ánh Trăng (+100 Tầm đánh, +20% Tốc đánh)';
    }
  } else if (cid === 'assassin') {
    if (stage === 'half') {
      note = 'Áp sát mục tiêu (chưa kích tốc ẩn thân)';
    } else {
      p.buffs.push({ time: 3, haste: 0.3, speed: 0.3 });
      note = 'Kích tốc sau Ẩn thân (+30% Tốc đánh, +30% Tốc chạy)';
    }
  } else if (cid === 'guardian') {
    if (stage === 'half') {
      p.guardArmorStacks = 2;
      note = '2/3 tầng Giáp Nội tại (+10% Giáp)';
    } else {
      p.guardArmorStacks = 3;
      note = '3/3 tầng Giáp Nội tại (+15% Giáp)';
    }
  } else if (cid === 'duelist') {
    if (stage === 'half') {
      p.dualSwords = true;
      p.duelStacks = 10;
      note = 'Song Kiếm 10/20 tầng Kiếm Ý (+10% Tốc đánh)';
    } else {
      p.dualSwords = true;
      p.duelStacks = 20;
      p.duelSwapTime = 3;
      note = 'Song Kiếm 20/20 tầng Kiếm Ý + Đổi thế (+35% Tốc đánh, +15% Công)';
    }
  } else if (cid === 'ranger') {
    if (stage === 'half') {
      p.focusStacks = 5;
      note = '5/10 tầng Tập Trung (+20% Tốc đánh)';
    } else {
      p.focusStacks = 10;
      note = '10/10 tầng Tập Trung (+40% Tốc đánh, +30% dmg)';
    }
  } else if (cid === 'berserker') {
    if (stage === 'half') {
      p.warStacks = 3;
      note = '3/5 tầng Chiến Ý (+12% Công, +12% Tốc đánh; +24% nếu TT2)';
    } else {
      p.warStacks = 5;
      note = '5/5 tầng Chiến Ý (+20% Công/Tốc; +40% nếu TT2)';
    }
  } else if (cid === 'ravager') {
    if (stage === 'half') {
      p.hp = 400;
      note = 'Khoảng 50% HP (+35% Công, +35% Tốc đánh)';
    } else {
      p.hp = 100;
      note = 'Máu thấp kích Cuồng Huyết (+35%..70% Công & Tốc đánh)';
    }
  } else {
    note = stage === 'half' ? 'Tích ấn phép thuật (nửa tầng)' : 'Tích ấn phép thuật tối đa (kích hoạt hiệu ứng kỹ năng/TT2)';
  }

  if (stage === 'max_m2') {
    p.mastery = 2;
    note += ' + Tinh thông 2 (+16% Công)';
  }
  return { player: p, note };
}

// ==========================================
// SHEET 9: MUC NOI TAI CHI TIET (LV 1, 10, 20)
// ==========================================
const s9Rows = [[
  'ID Tướng', 'Tên Tướng', 'Hệ / Class', 'Cấp độ', 'Mức Nội tại',
  'HP', 'Công', 'Giáp', 'Tốc chạy', 'Tốc đánh', 'Tầm đánh', 'DPS Thường', 'EHP',
  'Chi tiết hiệu ứng đang kích'
]];

for (const h of HEROES) {
  const cls = CLASSES[h.classId];
  for (const lv of [1, 10, 20]) {
    const stages = [
      ['none', '0 tầng / Mặc định'],
      ['half', 'Nửa tầng Nội tại'],
      ['max', 'Đạt Max Nội tại'],
      ['max_m2', 'Max Nội tại + Tinh thông 2']
    ];
    for (const [stKey, stLabel] of stages) {
      const base = mockBasePlayer(h.id, lv);
      const { player, note } = applyPassiveStage(h, base, stKey);
      const m = getHeroRowMetrics(h.id, player, {
        includeBasicMasteryBonus: stKey === 'max_m2',
        includePostBuffDmg: stKey === 'max' || stKey === 'max_m2'
      });
      s9Rows.push([
        h.id, h.name, cls.name, lv, stLabel,
        m.hp, m.power, m.armor, m.speed, m.aps, m.range, m.dps, m.ehp, note
      ]);
    }
  }
}

// ==========================================
// SHEET 10: ANH HUONG MUA NANG CAP & TINH THONG
// ==========================================
const s10Rows = [[
  'ID Tướng', 'Tên Tướng', 'Cấp độ', 'Loại Nâng cấp', 'Mức Nâng cấp', 'Tổng Vàng tiêu',
  'HP', 'Công', 'Giáp', 'Tốc chạy', 'Tốc đánh', 'DPS Thường', 'EHP', 'Tăng DPS / EHP so với gốc'
]];

const MASTERY_COSTS = { 0: 0, 1: 100, 2: 400, 3: 1000 };

for (const h of HEROES) {
  for (const lv of [10, 20]) {
    const baseMetrics = getHeroRowMetrics(h.id, mockBasePlayer(h.id, lv));

    // 1. Tinh thông 0 -> 3
    for (const mLv of [0, 1, 2, 3]) {
      const p = mockBasePlayer(h.id, lv);
      p.mastery = mLv;
      const m = getHeroRowMetrics(h.id, p, { includeBasicMasteryBonus: mLv >= 2 });
      s10Rows.push([
        h.id, h.name, lv, 'Tinh thông', `Bậc ${mLv}`, MASTERY_COSTS[mLv],
        m.hp, m.power, m.armor, m.speed, m.aps, m.dps, m.ehp,
        `+${m.dps - baseMetrics.dps} DPS / +${m.ehp - baseMetrics.ehp} EHP`
      ]);
    }

    // 2. Mua nâng cấp từng loại (+3, +5, +10)
    const upTypes = [
      ['upPower', 'Mua Công (+6/lần)', 80, 30],
      ['upHP', 'Mua Máu (+40 HP/lần)', 80, 30],
      ['upArmor', 'Mua Giáp (+2/lần)', 100, 40],
      ['upHaste', 'Mua Tốc đánh (+5%/lần)', 100, 40]
    ];
    for (const [field, label, baseCost, stepCost] of upTypes) {
      for (const cnt of [3, 5, 10]) {
        const p = mockBasePlayer(h.id, lv);
        p[field] = cnt;
        const m = getHeroRowMetrics(h.id, p);
        const gold = calcTotalUpgradeGold(baseCost, stepCost, cnt);
        s10Rows.push([
          h.id, h.name, lv, label, `+${cnt} lần`, gold,
          m.hp, m.power, m.armor, m.speed, m.aps, m.dps, m.ehp,
          `+${m.dps - baseMetrics.dps} DPS / +${m.ehp - baseMetrics.ehp} EHP`
        ]);
      }
    }

    // 3. Mua đồng đều cả 4 loại (+3, +5, +10)
    for (const cnt of [3, 5, 10]) {
      const p = mockBasePlayer(h.id, lv);
      p.upPower = cnt; p.upHP = cnt; p.upArmor = cnt; p.upHaste = cnt;
      const m = getHeroRowMetrics(h.id, p);
      const gold =
        calcTotalUpgradeGold(80, 30, cnt) * 2 +
        calcTotalUpgradeGold(100, 40, cnt) * 2;
      s10Rows.push([
        h.id, h.name, lv, 'Mua Đồng Đều (4 loại)', `+${cnt} mỗi loại`, gold,
        m.hp, m.power, m.armor, m.speed, m.aps, m.dps, m.ehp,
        `+${m.dps - baseMetrics.dps} DPS / +${m.ehp - baseMetrics.ehp} EHP`
      ]);
    }
  }
}

// ==========================================
// SHEET 11: CHI SO KHI NHAN NGOC (LV 20)
// ==========================================
const s11Rows = [[
  'ID Tướng', 'Tên Tướng', 'Hệ / Class', 'Ngọc trang bị', 'Bậc Ngọc', 'Tổng Vàng Ngọc',
  'HP', 'Công', 'Giáp', 'Tốc chạy', 'Tốc đánh', 'Tầm đánh', 'DPS Thường', 'EHP', 'Ghi chú cộng hưởng'
]];

for (const h of HEROES) {
  const cls = CLASSES[h.classId];
  const baseP = mockBasePlayer(h.id, 20);
  const bm = getHeroRowMetrics(h.id, baseP);
  s11Rows.push([
    h.id, h.name, cls.name, 'Không Ngọc (Mặc định)', 0, 0,
    bm.hp, bm.power, bm.armor, bm.speed, bm.aps, bm.range, bm.dps, bm.ehp,
    'Chỉ số gốc Lv.20 chưa trang bị ngọc'
  ]);

  for (const g of GEMS) {
    for (const tier of [1, 3]) {
      const p = { ...mockBasePlayer(h.id, 20), gem: g.id, gemTier: tier, gemEquipped: true };
      const m = getHeroRowMetrics(h.id, p);
      s11Rows.push([
        h.id, h.name, cls.name, g.name, tier, gemTotalCost(tier),
        m.hp, m.power, m.armor, m.speed, m.aps, m.range, m.dps, m.ehp,
        tier === 3 ? 'Đã mở Cộng hưởng Bậc 3' : 'Chỉ số cơ bản Bậc 1'
      ]);
    }
    if (g.id === 'wind') {
      const pWindFull = { ...mockBasePlayer(h.id, 20), gem: 'wind', gemTier: 3, gemEquipped: true, windStacks: 8 };
      const mw = getHeroRowMetrics(h.id, pWindFull);
      s11Rows.push([
        h.id, h.name, cls.name, `${g.name} (Full 8 tầng)`, 3, gemTotalCost(3),
        mw.hp, mw.power, mw.armor, mw.speed, mw.aps, mw.range, mw.dps, mw.ehp,
        '+40% Tốc đánh từ 8 tầng + 10% Tốc chạy + 20 Tầm đánh'
      ]);
    }
  }
}

// ==========================================
// SHEET 12: FULL COMBO BUFF TOI DA (WATERFALL LV 20)
// ==========================================
const BEST_GEM_FOR_HERO = {
  'knight-1': 'wind',
  'knight-2': 'ice',
  'knight-3': 'dark',
  'elf-1': 'wind',
  'goblin-assassin': 'dark',
  'knight-guardian': 'ice',
  'samurai-commander': 'wind',
  'samurai-archer': 'wind',
  'warrior-2': 'fire',
  'warrior-3': 'dark',
  'fire-wizard': 'fire',
  'thunder-wizard': 'thunder',
  'ice-wizard': 'ice',
  'berserker-1': 'ice'
};

const s12Rows = [[
  'ID Tướng', 'Tên Tướng', 'Hệ / Class', 'Giai đoạn Build (Lv.20)',
  'HP', 'Công', 'Giáp', 'Tốc chạy', 'Tốc đánh', 'Tầm đánh', 'DPS Thường', 'EHP', 'Chi tiết cộng dồn'
]];

for (const h of HEROES) {
  const cls = CLASSES[h.classId];
  const bestGemId = BEST_GEM_FOR_HERO[h.id] || 'fire';
  const bestGem = GEMS.find(g => g.id === bestGemId);

  // 1. Gốc Lv.20
  const p1 = mockBasePlayer(h.id, 20);
  const m1 = getHeroRowMetrics(h.id, p1);
  s12Rows.push([
    h.id, h.name, cls.name, '1. Gốc Lv.20',
    m1.hp, m1.power, m1.armor, m1.speed, m1.aps, m1.range, m1.dps, m1.ehp,
    'Chỉ số thuần Lv.20 (chưa nội tại, chưa đồ)'
  ]);

  // 2. + Max Nội tại
  const { player: p2, note: note2 } = applyPassiveStage(h, p1, 'max');
  const m2 = getHeroRowMetrics(h.id, p2, { includePostBuffDmg: true });
  s12Rows.push([
    h.id, h.name, cls.name, '2. + Max Nội tại',
    m2.hp, m2.power, m2.armor, m2.speed, m2.aps, m2.range, m2.dps, m2.ehp,
    note2
  ]);

  // 3. + Tinh thông 3
  const p3 = { ...p2, mastery: 3 };
  const m3 = getHeroRowMetrics(h.id, p3, { includeBasicMasteryBonus: true, includePostBuffDmg: true });
  s12Rows.push([
    h.id, h.name, cls.name, '3. + Tinh thông 3',
    m3.hp, m3.power, m3.armor, m3.speed, m3.aps, m3.range, m3.dps, m3.ehp,
    'Tinh thông 3 (+24% Công + hiệu ứng TT2)'
  ]);

  // 4. + Mua Nâng cấp (+5 mỗi loại)
  const p4 = { ...p3, upHP: 5, upPower: 5, upArmor: 5, upHaste: 5 };
  const m4 = getHeroRowMetrics(h.id, p4, { includeBasicMasteryBonus: true, includePostBuffDmg: true });
  s12Rows.push([
    h.id, h.name, cls.name, '4. + Mua Nâng cấp (+5)',
    m4.hp, m4.power, m4.armor, m4.speed, m4.aps, m4.range, m4.dps, m4.ehp,
    '+5 HP (+200), +5 Công (+30), +5 Giáp (+10), +5 Tốc đánh (+25%)'
  ]);

  // 5. + Buff Kỹ năng (E / R)
  const p5 = { ...mockBuffedPlayer(h.id, 20), mastery: 3, upHP: 5, upPower: 5, upArmor: 5, upHaste: 5 };
  const m5 = getHeroRowMetrics(h.id, p5, { includeBasicMasteryBonus: true, includePostBuffDmg: true });
  s12Rows.push([
    h.id, h.name, cls.name, '5. + Buff Kỹ năng (E/R)',
    m5.hp, m5.power, m5.armor, m5.speed, m5.aps, m5.range, m5.dps, m5.ehp,
    BUFF_DESC[h.id] || ''
  ]);

  // 6. + Ngọc Bậc 3 Cộng Hưởng
  const p6 = {
    ...p5,
    gem: bestGemId,
    gemTier: 3,
    gemEquipped: true,
    ...(bestGemId === 'wind' ? { windStacks: 8 } : {})
  };
  const m6 = getHeroRowMetrics(h.id, p6, { includeBasicMasteryBonus: true, includePostBuffDmg: true });
  s12Rows.push([
    h.id, h.name, cls.name, `6. + ${bestGem?.name || bestGemId} Bậc 3`,
    m6.hp, m6.power, m6.armor, m6.speed, m6.aps, m6.range, m6.dps, m6.ehp,
    `Full Endgame Combo (+ ${bestGem?.name || bestGemId} Bậc 3${bestGemId === 'wind' ? ' 8 tầng' : ''})`
  ]);
}

const outPath = resolve(process.cwd(), 'bao-cao-thong-ke-chi-so-chi-tiet.xlsx');
const xlsxBuffer = buildXlsx([
  { name: 'Tong_Quan_14_Tuong', rows: s1Rows, widths: [16, 20, 20, 22, 9, 9, 13, 9, 14, 16, 14, 14, 10, 16, 14, 14, 14, 14, 16, 44] },
  { name: 'Chi_So_Tuong_Lv1_20', rows: s2Rows, widths: [16, 20, 20, 10, 11, 11, 11, 10, 13, 12, 12, 11, 11, 11, 13, 12, 12] },
  { name: 'Dmg_Truoc_Sau_Buff', rows: s3Rows, widths: [20, 20, 7, 22, 10, 12, 12, 11, 10, 12, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 14, 24] },
  { name: 'Hoi_Mau_Giap_Ao', rows: s4Rows, widths: [18, 20, 22, 26, 44, 14, 14, 18, 18, 20, 34] },
  { name: 'Khong_Che_CC', rows: s5Rows, widths: [18, 24, 24, 14, 16, 20, 14, 22, 34] },
  { name: 'Noi_Tai_Tinh_Thong', rows: s6Rows, widths: [16, 20, 20, 22, 46, 46, 14, 14, 14, 42] },
  { name: 'Tien_Hoa_Ngoc', rows: s7Rows, widths: [12, 14, 8, 12, 14, 10, 10, 10, 12, 12, 12, 54, 26] },
  { name: 'De_Xuat_Can_Bang', rows: s8Rows, widths: [32, 54, 16, 54] },
  { name: 'Muc_Noi_Tai_Chi_Tiet', rows: s9Rows, widths: [16, 20, 20, 9, 26, 10, 10, 10, 11, 11, 11, 13, 12, 52] },
  { name: 'Anh_Huong_Mua_Tinh_Thong', rows: s10Rows, widths: [16, 20, 9, 24, 16, 14, 10, 10, 10, 11, 11, 13, 12, 30] },
  { name: 'Chi_So_Khi_Nhan_Ngoc', rows: s11Rows, widths: [16, 20, 20, 24, 10, 14, 10, 10, 10, 11, 11, 11, 13, 12, 42] },
  { name: 'Full_Combo_Buff_Toi_Da', rows: s12Rows, widths: [16, 20, 20, 28, 10, 10, 10, 11, 11, 11, 13, 12, 54] }
]);

writeFileSync(outPath, xlsxBuffer);
console.log('Updated:', outPath, 'bytes:', xlsxBuffer.length);
console.log('Sheet rows:', {
  s1: s1Rows.length, s2: s2Rows.length, s3: s3Rows.length,
  s4: s4Rows.length, s5: s5Rows.length, s6: s6Rows.length,
  s7: s7Rows.length, s8: s8Rows.length, s9: s9Rows.length,
  s10: s10Rows.length, s11: s11Rows.length, s12: s12Rows.length
});
