import { HEROES, heroById } from '/content.js';
import { CLASSES, SKILLS, HERO_CLASS } from '/skills.js';

const HERO_LIST = Array.isArray(HEROES) ? HEROES : Object.values(HEROES);
const HERO_MAP = Object.fromEntries(HERO_LIST.map(h => [h.id, h]));

const HERO_ROLES = {
  'samurai':           { cat: 'phys',  tags: [['Vật lý', 'tag-phys'], ['Phong hệ · Cơ động', 'tag-role']] },
  'samurai-commander': { cat: 'phys',  tags: [['Vật lý', 'tag-phys'], ['Đơn kiếm / Song kiếm', 'tag-role']] },
  'samurai-archer':    { cat: 'phys',  tags: [['Vật lý', 'tag-phys'], ['Xạ thủ tầm xa', 'tag-role']] },
  'dark-elf':          { cat: 'phys',  tags: [['Vật lý', 'tag-phys'], ['Xuyên tâm · Tinh linh', 'tag-role']] },
  'goblin-assassin':   { cat: 'phys',  tags: [['Vật lý', 'tag-phys'], ['Sát thủ · Ẩn thân', 'tag-role']] },
  'warrior-1':         { cat: 'phys',  tags: [['Vật lý', 'tag-phys'], ['Đấu sĩ · Địa chấn', 'tag-role']] },
  'warrior-2':         { cat: 'phys',  tags: [['Vật lý', 'tag-phys'], ['Cuồng chiến · Hút máu', 'tag-role']] },
  'warrior-3':         { cat: 'tank',  tags: [['Phòng ngự', 'tag-tank'], ['Tiên phong · Cự Nhân', 'tag-role']] },
  'knight-1':          { cat: 'tank',  tags: [['Phòng ngự', 'tag-tank'], ['Khiên chắn tiền tuyến', 'tag-role']] },
  'knight-2':          { cat: 'tank',  tags: [['Hỗ trợ / Thủ', 'tag-tank'], ['Thánh vực · Hộ thuẫn', 'tag-role']] },
  'knight-3':          { cat: 'phys',  tags: [['Vật lý', 'tag-phys'], ['Hắc kỵ · Phá giáp', 'tag-role']] },
  'fire-wizard':       { cat: 'magic', tags: [['Phép thuật', 'tag-magic'], ['Hỏa bộc · Thiên thạch', 'tag-role']] },
  'lightning-mage':    { cat: 'magic', tags: [['Phép thuật', 'tag-magic'], ['Sét chuỗi · Bão lôi', 'tag-role']] },
  'wanderer-magican':  { cat: 'magic', tags: [['Phép thuật', 'tag-magic'], ['Khống chế · Hồi phục', 'tag-role']] },
};

const MAP_DATA = [
  { stage: 1,  name: 'Đồng Cỏ Biên Giới',   biome: 'Ba hướng tiến quân & khu săn thú', weather: 'Nắng sớm thảo nguyên', boss: 'Thủ Lĩnh Mộc Tinh' },
  { stage: 2,  name: 'Rừng Song Lộ',        biome: 'Bốn cửa tiến quân qua nhánh cầu',  weather: 'Mưa rừng & Sương nhẹ', boss: 'Phong Dực Đại Yêu' },
  { stage: 3,  name: 'Thung Lũng Lá Đỏ',    biome: 'Đường vòng dài rừng phong cổ',     weather: 'Gió thu & Lá cuốn',    boss: 'Thủy Xà Ngàn Năm' },
  { stage: 4,  name: 'Phế Tích Cổ',         biome: 'Tàn tích đá chia sáu ngả đường',   weather: 'Sương mù cổ thành',    boss: 'Cự Nhân Đá Cổ' },
  { stage: 5,  name: 'Ốc Đảo Đá',           biome: 'Sa mạc cát vàng & luồng viện binh',weather: 'Nắng cháy & Bão cát',  boss: 'Bọ Cạp Hoàng Đế' },
  { stage: 6,  name: 'Rừng Băng Lam',       biome: 'Sáu đường băng & tinh thể lạnh',   weather: 'Bão tuyết lạnh giá',   boss: 'Băng Giá Cự Nhân' },
  { stage: 7,  name: 'Đầm Lầy Độc',         biome: 'Đầm nước cổ thụ quanh co',         weather: 'Mưa phùn & Đom đóm',   boss: 'Độc Mộc Yêu Vương' },
  { stage: 8,  name: 'Hẻm Núi Thạch Anh',   biome: 'Hang tinh thể tím sáu hướng',      weather: 'Bão từ trường',        boss: 'Lôi Thần Hộ Pháp' },
  { stage: 9,  name: 'Vùng Đất Tro Tàn',    biome: 'Rừng cháy & lòng chảo dung nham',  weather: 'Tro tàn & Lửa rơi',    boss: 'Viêm Ma Thống Lĩnh' },
  { stage: 10, name: 'Thành Trì Hắc Ám',    biome: 'Bảy cửa ngõ tâm điểm phong ấn',    weather: 'Bão hư không & Lỗ xoáy',boss: 'Hắc Long Vĩnh Dạ' },
];

function getHeroObj(id) {
  return HERO_MAP[id] || heroById(id) || HERO_LIST[0];
}

function getHeroSkills(heroId) {
  const h = getHeroObj(heroId);
  const classId = h.classId || HERO_CLASS[h.id] || 'windblade';
  const cls = CLASSES[classId] || CLASSES.windblade;
  const bySlot = {};
  for (const sk of SKILLS) {
    if (sk.classId === classId && sk.slot) {
      bySlot[sk.slot.toLowerCase()] = sk;
    }
  }
  return { hero: h, classId, cls, skills: bySlot };
}

function heroSpriteUrl(id) {
  const knight = { 'knight-2': 'holy-foot', 'knight-3': 'dark-foot' }[id];
  if (knight) return `/assets/knights-v2/${knight}.png`;
  if (id === 'warrior-2') return '/assets/ravager/hero-v2.png';
  if (id === 'samurai-commander') return '/assets/blademaster/katana-forms.png';
  return `/assets/heroes-v2/${id === 'samurai-archer' ? 'samurai-archer-charge-v3' : id}.png`;
}

const spriteCache = new Map();
const spriteBoundsCache = new Map();

function getSpriteBounds(img, url) {
  if (spriteBoundsCache.has(url)) return spriteBoundsCache.get(url);
  const fw = Math.round(img.naturalWidth / 6);
  const fh = Math.round(img.naturalHeight / 6);
  const tmp = document.createElement('canvas');
  tmp.width = fw;
  tmp.height = fh;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(img, 0, 0, fw, fh, 0, 0, fw, fh);
  let bounds = { sx: 0, sy: 0, sw: fw, sh: fh };
  try {
    const data = tctx.getImageData(0, 0, fw, fh).data;
    let minX = fw, minY = fh, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        if (data[(y * fw + x) * 4 + 3] > 16) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }
    if (found && maxX >= minX && maxY >= minY) {
      bounds = {
        sx: Math.max(0, minX - 2),
        sy: Math.max(0, minY - 2),
        sw: Math.min(fw, maxX - minX + 5),
        sh: Math.min(fh, maxY - minY + 5)
      };
    }
  } catch {}
  spriteBoundsCache.set(url, bounds);
  return bounds;
}

function drawAvatar(container, heroId, size = 96) {
  if (!container) return;
  const h = getHeroObj(heroId);
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  const res = Math.max(160, size * 2);
  canvas.width = res;
  canvas.height = res;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.objectFit = 'contain';
  canvas.style.imageRendering = 'pixelated';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const url = heroSpriteUrl(h.id);

  const renderFrame = img => {
    if (!img || !img.naturalWidth) return;
    const { sx, sy, sw, sh } = getSpriteBounds(img, url);
    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingEnabled = false;
    const scale = Math.min((cw * 0.86) / sw, (ch * 0.88) / sh);
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);
    const dx = Math.round((cw - dw) / 2);
    const dy = Math.round((ch - dh) / 2 + ch * 0.02);
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  if (spriteCache.has(url)) {
    const cached = spriteCache.get(url);
    if (cached.complete) renderFrame(cached);
    else cached.addEventListener('load', () => renderFrame(cached), { once: true });
  } else {
    const img = new Image();
    spriteCache.set(url, img);
    img.onload = () => renderFrame(img);
    img.src = url;
  }
}

const urlParams = new URLSearchParams(location.search);
const savedHero = localStorage.getItem('gct-hero');
let selectedHeroKey = savedHero && HERO_MAP[savedHero] ? savedHero : 'samurai';
let currentFilter = 'all';
let currentMapStage = Math.max(1, Math.min(10, Number(urlParams.get('stage')) || 1));
let currentDiff = ['easy', 'normal', 'insane'].includes(urlParams.get('difficulty'))
  ? urlParams.get('difficulty')
  : 'normal';
let roomCode = (urlParams.get('code') || '').trim().toUpperCase();
const roomMode = urlParams.get('mode') || (roomCode ? 'join' : 'coop');

let selfId = 'local-self';
let localLocked = false;
let roomState = null;
let myProfile = null;
let myHistory = [];
let socialData = { friends: [], incomingRequests: [], outgoingRequests: [], roomInvites: [] };
let redirectingToBattle = false;

const $ = id => document.getElementById(id);

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function showToast(html, durationMs = 6000) {
  const stack = $('toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'lobby-toast';
  el.innerHTML = html;
  stack.appendChild(el);
  if (durationMs > 0) {
    setTimeout(() => el.remove(), durationMs);
  }
  return el;
}

async function apiGet(url) {
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (res.status === 401) {
    location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
    throw new Error('Chưa đăng nhập');
  }
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Yêu cầu thất bại');
  return data;
}

function getEffectivePlayers() {
  if (roomState && Array.isArray(roomState.players) && roomState.players.length > 0) {
    return roomState.players;
  }
  const fallbackName = (myProfile && myProfile.displayName) || localStorage.getItem('gct-name') || 'Chỉ huy';
  return [{
    id: selfId,
    name: fallbackName,
    hero: selectedHeroKey,
    heroLocked: localLocked,
    level: (myProfile && myProfile.level) || 1,
    accountLevel: (myProfile && myProfile.level) || 1
  }];
}

function getMe() {
  const players = getEffectivePlayers();
  return players.find(p => p.id === selfId) || players[0] || null;
}

function isHost() {
  if (!roomState || !roomState.hostId) return true;
  return Boolean(selfId && roomState.hostId === selfId);
}

function isFriendAccount(accountId) {
  if (!accountId) return false;
  return socialData.friends.some(f => f.accountId === accountId);
}

// --- WEBSOCKET CONNECTION ---
const wsProto = location.protocol === 'https:' ? 'wss' : 'ws';
const socket = new WebSocket(`${wsProto}://${location.host}`);

function sendWs(msg) {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(msg));
  }
}

socket.onopen = () => {
  const badge = $('ws-conn-badge');
  if (badge) {
    badge.textContent = 'Trực tuyến';
    badge.style.color = 'var(--emerald)';
  }
  const savedName = localStorage.getItem('gct-name') || (myProfile && myProfile.displayName) || 'Chỉ huy';
  sendWs({
    type: 'join',
    lobbyOnly: true,
    replaceSession: true,
    solo: roomMode === 'solo' && !roomCode,
    code: roomCode || undefined,
    difficulty: currentDiff,
    stage: currentMapStage,
    hero: selectedHeroKey,
    name: savedName
  });
};

socket.onclose = event => {
  if (event.code === 4001) {
    location.replace('/login.html?next=' + encodeURIComponent(location.pathname + location.search));
    return;
  }
  const badge = $('ws-conn-badge');
  if (badge) {
    badge.textContent = 'Ngoại tuyến';
    badge.style.color = 'var(--danger)';
  }
};

let lastSlotsSig = '';
let lastShowcaseSig = '';
let lastRosterFilter = '';
let lastChatSig = '';
let lastHeroPickAt = 0;
let lastLockToggleAt = 0;

socket.onmessage = event => {
  let msg;
  try { msg = JSON.parse(event.data); } catch { return; }

  if (msg.error && !msg.type) {
    showToast(`<strong>Thông báo:</strong> <span>${escapeHtml(msg.error)}</span>`, 4500);
    return;
  }

  if (msg.type === 'joined') {
    selfId = msg.playerId || msg.id || selfId;
    roomCode = msg.code || roomCode;
    updateRoomCodeDisplay();
    const q = new URLSearchParams(location.search);
    if (roomCode) q.set('code', roomCode);
    history.replaceState(null, '', `/lobby.html?${q.toString()}`);
  } else if (msg.type === 'state') {
    roomState = msg.state || msg;
    if (roomState.code) {
      roomCode = roomState.code;
      updateRoomCodeDisplay();
    }
    if (roomState.stage && roomState.stage !== currentMapStage) {
      currentMapStage = Math.max(1, Math.min(10, Number(roomState.stage) || 1));
      if ($('map-picker')) $('map-picker').value = String(currentMapStage);
      renderMapCard();
    }
    if (roomState.difficulty && roomState.difficulty !== currentDiff) {
      currentDiff = roomState.difficulty;
      syncDiffButtons();
    }
    const me = getMe();
    const now = Date.now();
    if (me) {
      if (now - lastLockToggleAt > 800) {
        localLocked = Boolean(me.heroLocked || me.locked);
      } else {
        me.locked = localLocked;
        me.heroLocked = localLocked;
      }
      if (now - lastHeroPickAt > 800) {
        if (me.hero && HERO_MAP[me.hero] && me.hero !== selectedHeroKey) {
          selectedHeroKey = me.hero;
          localStorage.setItem('gct-hero', selectedHeroKey);
        }
      } else {
        me.hero = selectedHeroKey;
      }
    }
    renderTeamSlots();
    renderShowcase();
    renderRoster();
    renderChatLog();

    if (roomState.launching && !redirectingToBattle) {
      redirectingToBattle = true;
      const targetUrl = `/defense.html?autostart=1&code=${encodeURIComponent(roomState.code)}&difficulty=${encodeURIComponent(roomState.difficulty || currentDiff)}&stage=${encodeURIComponent(roomState.stage || currentMapStage)}`;
      location.href = targetUrl;
    }
  } else if (msg.type === 'error') {
    showToast(`<strong>Thông báo:</strong> <span>${escapeHtml(msg.message || msg.error)}</span>`, 4500);
  } else if (msg.type === 'kicked') {
    showToast(`<strong>Bạn đã được mời rời khỏi phòng.</strong>`, 3000);
    setTimeout(() => { location.href = '/defense.html'; }, 1200);
  } else if (msg.type === 'room-invite') {
    const inv = msg.invite || {
      id: msg.inviteId,
      roomCode: msg.roomCode,
      fromDisplayName: msg.fromDisplayName || msg.fromName,
      fromUsername: msg.fromUsername
    };
    refreshSocial();
    const toast = showToast(`
      <div><strong>Lời mời vào phòng #${escapeHtml(inv.roomCode)}</strong></div>
      <div>Chỉ huy <b>${escapeHtml(inv.fromDisplayName || inv.fromUsername)}</b> mời bạn tham gia giữ thành.</div>
      <div style="display:flex;gap:6px;margin-top:4px">
        <button class="mini-btn gold" data-join-code="${escapeHtml(inv.roomCode)}" data-inv-id="${escapeHtml(inv.id)}">Vào phòng ngay</button>
        <button class="mini-btn" data-dismiss-inv="${escapeHtml(inv.id)}">Đóng</button>
      </div>
    `, 12000);
    if (toast) {
      toast.querySelector('[data-join-code]')?.addEventListener('click', () => {
        joinRoomByCode(inv.roomCode, inv.id);
        toast.remove();
      });
      toast.querySelector('[data-dismiss-inv]')?.addEventListener('click', () => {
        dismissRoomInvite(inv.id);
        toast.remove();
      });
    }
  } else if (msg.type === 'social-notify') {
    refreshSocial();
    if (msg.kind === 'friend-request') {
      showToast(`
        <div><strong>Lời mời kết bạn mới</strong></div>
        <div><b>${escapeHtml(msg.fromDisplayName || msg.fromName || msg.fromUsername)}</b> muốn kết bạn với bạn.</div>
      `, 6000);
    } else if (msg.kind === 'friend-accepted') {
      showToast(`
        <div><strong>Kết bạn thành công</strong></div>
        <div><b>${escapeHtml(msg.fromDisplayName || msg.fromName || msg.fromUsername)}</b> đã đồng ý kết bạn.</div>
      `, 5000);
    }
  }
};

function updateRoomCodeDisplay() {
  const btn = $('copy-code');
  if (btn && roomCode) {
    btn.textContent = `Mã phòng: #${roomCode}`;
  }
}

// --- RENDER 4 PLAYER SLOTS ---
function renderTeamSlots(force = false) {
  const wrap = $('team-slots');
  if (!wrap) return;

  const players = getEffectivePlayers();
  const lockedSlots = (roomState && roomState.lockedSlots) || {};
  const hostId = (roomState && (roomState.hostId || roomState.host)) || players[0]?.id;
  const amHost = isHost();

  let readyCount = 0;
  for (const p of players) {
    if (p && (p.heroLocked || p.locked)) readyCount++;
  }

  const sig = JSON.stringify({
    selfId,
    hostId,
    amHost,
    lockedSlots,
    friendsLen: socialData.friends.length,
    players: players.map(p => [
      p.id,
      p.name,
      p.hero,
      Boolean(p.heroLocked || p.locked),
      p.accountLevel || p.level || 1,
      p.accountId || '',
      p.username || ''
    ])
  });

  if (!force && sig === lastSlotsSig && wrap.children.length === 4) {
    updateSynergyAndStartState(players, readyCount);
    return;
  }
  lastSlotsSig = sig;
  wrap.innerHTML = '';

  for (let idx = 0; idx < 4; idx++) {
    const p = players[idx];
    const card = document.createElement('div');

    if (p) {
      const isLocked = Boolean(p.heroLocked || p.locked);
      const isMe = p.id === selfId || (idx === 0 && !roomState);
      const isSlotHost = p.id === hostId;
      const h = getHeroObj(p.hero);
      const alreadyFriend = isMe || isFriendAccount(p.accountId);

      card.className = `player-slot ${isMe ? 'is-me' : ''} ${isLocked ? 'is-ready' : ''}`;
      card.innerHTML = `
        ${isSlotHost ? '<div class="crown-badge" title="Chủ phòng">CHỦ PHÒNG</div>' : ''}
        <div class="slot-avatar" id="slot-av-${idx}"></div>
        <div class="slot-main">
          <div class="slot-top">
            <div class="slot-name-row">
              <span class="slot-name">${escapeHtml(p.name)}</span>
              ${isMe ? '<span class="badge-you">BẠN</span>' : ''}
              <span class="slot-lv">Lv.${p.accountLevel || p.level || 1}</span>
            </div>
            <div class="slot-actions">
              ${!alreadyFriend && p.username ? `<button class="icon-btn" data-add-friend="${escapeHtml(p.username)}" title="Kết bạn với ${escapeHtml(p.name)}">+ Bạn</button>` : ''}
              ${!isMe && amHost ? `
                <button class="icon-btn" data-promote="${p.id}" title="Nhường chủ phòng">Chủ</button>
                <button class="icon-btn" data-kick="${p.id}" title="Mời ra khỏi phòng">✕</button>
              ` : ''}
            </div>
          </div>
          <div class="slot-hero-box">
            <div class="slot-hero-name">${escapeHtml(h.name)}</div>
            <div class="slot-hero-stats">HP ${h.hp || 240} · Công ${h.power || 35} · Giáp ${h.armor ?? 5}</div>
          </div>
          <div class="slot-bottom">
            <span class="slot-role-label">${escapeHtml(h.role || HERO_ROLES[h.id]?.tags[1]?.[0] || 'Anh hùng')}</span>
            <span class="status-pill ${isLocked ? 'ready' : 'picking'}">
              ${isLocked ? 'Đã khóa tướng' : 'Đang chọn tướng'}
            </span>
          </div>
        </div>
      `;
      wrap.appendChild(card);
      drawAvatar(card.querySelector(`#slot-av-${idx}`), h.id, 96);
    } else {
      const slotClosed = Array.isArray(lockedSlots) ? lockedSlots.includes(idx) : Boolean(lockedSlots[idx]);
      card.className = 'player-slot is-empty';
      card.innerHTML = `
        <div class="empty-left">
          <div class="empty-plus">${slotClosed ? '—' : '+'}</div>
          <div>
            <div style="font-size:12.5px;font-weight:700;color:var(--text)">
              ${slotClosed ? `Vị trí #${idx + 1} đã đóng` : `Vị trí trống #${idx + 1}`}
            </div>
            <div style="font-size:11px;color:var(--muted)">
              ${slotClosed ? 'Chủ phòng đã khóa ô này' : 'Chờ người chơi tham gia...'}
            </div>
          </div>
        </div>
        <div class="empty-actions">
          ${!slotClosed ? '<button class="btn-slot-act" data-open-invite="1">Mời bạn</button>' : ''}
          ${amHost ? `<button class="btn-slot-act" data-toggle-slot="${idx}">${slotClosed ? 'Mở ô' : 'Khóa ô'}</button>` : ''}
        </div>
      `;
      wrap.appendChild(card);
    }
  }

  $('team-count').textContent = String(players.length || 1);

  wrap.querySelectorAll('[data-add-friend]').forEach(btn => {
    btn.addEventListener('click', () => sendFriendRequest(btn.dataset.addFriend));
  });
  wrap.querySelectorAll('[data-promote]').forEach(btn => {
    btn.addEventListener('click', () => sendWs({ type: 'promote', targetId: btn.dataset.promote }));
  });
  wrap.querySelectorAll('[data-kick]').forEach(btn => {
    btn.addEventListener('click', () => sendWs({ type: 'kick', targetId: btn.dataset.kick }));
  });
  wrap.querySelectorAll('[data-open-invite]').forEach(btn => {
    btn.addEventListener('click', () => openModal('social-modal'));
  });
  wrap.querySelectorAll('[data-toggle-slot]').forEach(btn => {
    btn.addEventListener('click', () => sendWs({ type: 'room-config', toggleSlot: Number(btn.dataset.toggleSlot) }));
  });

  updateSynergyAndStartState(players, readyCount);
}

// --- SYNERGY & START BUTTON ---
function updateSynergyAndStartState(players, readyCount) {
  let phys = 0, magic = 0, tank = 0;
  players.forEach(p => {
    const cat = HERO_ROLES[p.hero]?.cat || 'phys';
    if (cat === 'phys') phys++;
    else if (cat === 'magic') magic++;
    else tank++;
  });
  const total = Math.max(1, players.length);
  $('syn-phys-num').textContent = String(phys);
  $('syn-magic-num').textContent = String(magic);
  $('syn-tank-num').textContent = String(tank);
  $('syn-phys-bar').style.width = `${Math.round((phys / total) * 100)}%`;
  $('syn-magic-bar').style.width = `${Math.round((magic / total) * 100)}%`;
  $('syn-tank-bar').style.width = `${Math.round((tank / total) * 100)}%`;

  const synText = $('synergy-status');
  if (phys > 0 && magic > 0 && tank > 0) {
    synText.textContent = 'Đội hình hoàn chỉnh (Đủ 3 hệ)';
  } else if (tank === 0) {
    synText.textContent = 'Gợi ý: Thêm tướng Phòng ngự / Hỗ trợ';
  } else {
    synText.textContent = 'Đội hình cân bằng tốt';
  }

  const allReady = players.length > 0 && readyCount === players.length;
  const statusEl = $('ready-status-text');
  const startBtn = $('start-match-btn');
  const amHost = isHost();
  const me = getMe();

  if (allReady) {
    if (amHost) {
      statusEl.textContent = `Cả đội đã sẵn sàng (${readyCount}/${players.length}) — Chủ phòng có thể xuất trận`;
      startBtn.classList.add('ready');
      startBtn.textContent = `⚔ BẮT ĐẦU GIỮ THÀNH (MỐC ${currentMapStage})`;
    } else {
      statusEl.textContent = `Cả đội đã sẵn sàng (${readyCount}/${players.length}) — Chờ chủ phòng bắt đầu`;
      startBtn.classList.remove('ready');
      startBtn.textContent = `CHỜ CHỦ PHÒNG XUẤT TRẬN`;
    }
  } else {
    statusEl.textContent = `Đang chọn đội hình (${readyCount}/${players.length} đã khóa tướng)`;
    if (me && !(me.heroLocked || me.locked)) {
      startBtn.classList.remove('ready');
      startBtn.textContent = '⚔ KHÓA TƯỚNG & BẮT ĐẦU GIỮ THÀNH';
    } else {
      startBtn.classList.remove('ready');
      startBtn.textContent = `CHỜ ĐỒNG ĐỘI KHÓA TƯỚNG (${readyCount}/${players.length})`;
    }
  }
}

// --- CENTER SHOWCASE & SKILLS ---
function renderShowcase(force = false) {
  const { hero: h, cls, skills } = getHeroSkills(selectedHeroKey);
  const info = HERO_ROLES[h.id] || { cat: 'phys', tags: [['Anh hùng', 'tag-role']] };
  const me = getMe();
  const myLocked = Boolean(me ? (me.heroLocked || me.locked) : localLocked);

  const lockBtn = $('lock-hero-btn');
  if (myLocked) {
    lockBtn.classList.add('locked');
    lockBtn.textContent = 'Đã khóa (Bấm để đổi)';
  } else {
    lockBtn.classList.remove('locked');
    lockBtn.textContent = 'Khóa Anh Hùng';
  }

  const sig = `${h.id}:${myLocked}`;
  if (!force && sig === lastShowcaseSig) return;
  lastShowcaseSig = sig;

  drawAvatar($('big-avatar'), h.id, 96);
  $('hero-class-title').textContent = `${h.name} · ${cls.name}`;
  $('hero-summary-text').textContent = cls.passive || h.role || '';

  const tagsWrap = $('hero-role-tags');
  tagsWrap.innerHTML = info.tags
    .map(([label, tagCls]) => `<span class="role-tag ${tagCls}">${escapeHtml(label)}</span>`)
    .join('');

  const skillsWrap = $('skill-cards');
  skillsWrap.innerHTML = ['q', 'e', 'r'].map(k => {
    const sk = skills[k] || { name: k.toUpperCase(), cooldown: 0, text: '' };
    return `
      <div class="skill-card">
        <div class="skill-card-head">
          <div style="display:flex;align-items:center;gap:7px;min-width:0">
            <span class="skill-key-badge">${k.toUpperCase()}</span>
            <span class="skill-name">${escapeHtml(sk.name)}</span>
          </div>
          <span class="skill-cd">${sk.cooldown}s</span>
        </div>
        <div class="skill-desc">${escapeHtml(sk.text)}</div>
      </div>
    `;
  }).join('');
}

function selectHeroById(key) {
  if (!key || !HERO_MAP[key]) return;
  const now = Date.now();
  lastHeroPickAt = now;
  const me = getMe();
  const wasLocked = Boolean(localLocked || (me && (me.heroLocked || me.locked)));
  if (wasLocked) {
    lastLockToggleAt = now;
    localLocked = false;
    if (me) {
      me.locked = false;
      me.heroLocked = false;
    }
    sendWs({ type: 'lock-hero', locked: false });
  }
  selectedHeroKey = key;
  if (me) me.hero = key;
  localStorage.setItem('gct-hero', key);
  sendWs({ type: 'hero', hero: key });
  renderTeamSlots(true);
  renderShowcase(true);
  renderRoster(false);
}

// --- 14 HERO ROSTER GRID (IN-PLACE UPDATES, ZERO 50MS DOM REBUILD) ---
function renderRoster(forceRebuild = false) {
  const grid = $('roster-grid');
  if (!grid) return;

  const players = getEffectivePlayers();

  if (forceRebuild || lastRosterFilter !== currentFilter || !grid.children.length) {
    lastRosterFilter = currentFilter;
    grid.innerHTML = '';

    HERO_LIST.forEach(h => {
      const key = h.id;
      const info = HERO_ROLES[key] || { cat: 'phys', tags: [['Anh hùng', 'tag-role']] };
      if (currentFilter !== 'all' && info.cat !== currentFilter) return;

      const isSelected = key === selectedHeroKey;
      const card = document.createElement('div');
      card.className = `hero-tile ${isSelected ? 'selected' : ''}`;
      card.dataset.hero = key;
      card.innerHTML = `
        <span class="picked-dot" style="display:none"></span>
        <div class="hero-tile-avatar" id="tile-av-${key}"></div>
        <div class="hero-tile-name">${escapeHtml(h.name)}</div>
        <div class="hero-tile-sub">${escapeHtml(h.role || info.tags[1]?.[0] || '')}</div>
      `;
      card.addEventListener('pointerdown', e => {
        if (e.button && e.button !== 0) return;
        selectHeroById(key);
      });
      grid.appendChild(card);
      drawAvatar(card.querySelector(`#tile-av-${key}`), key, 110);
    });
  }

  // Update selected highlight & teammate picked dots in-place without rebuilding DOM
  grid.querySelectorAll('.hero-tile').forEach(card => {
    const key = card.dataset.hero;
    card.classList.toggle('selected', key === selectedHeroKey);
    const pickedByMate = players.find(p => p.id !== selfId && p.hero === key);
    const dot = card.querySelector('.picked-dot');
    if (dot) {
      if (pickedByMate) {
        dot.style.display = 'block';
        dot.title = `${pickedByMate.name} đang chọn`;
      } else {
        dot.style.display = 'none';
      }
    }
  });
}

// --- MAP PICKER ---
function initMaps() {
  const picker = $('map-picker');
  picker.innerHTML = MAP_DATA.map(m =>
    `<option value="${m.stage}">Mốc ${m.stage}: ${m.name}</option>`
  ).join('');
  picker.value = String(currentMapStage);
  picker.addEventListener('change', () => {
    currentMapStage = Number(picker.value);
    renderMapCard();
    renderTeamSlots();
    sendWs({ type: 'room-config', stage: currentMapStage });
  });
  renderMapCard();
}

function renderMapCard() {
  const m = MAP_DATA.find(x => x.stage === currentMapStage) || MAP_DATA[0];
  const box = $('map-preview');
  box.innerHTML = `
    <span class="map-badge-top">MỐC CHIẾN DỊCH ${m.stage} / 10</span>
    <div class="map-name-big">${escapeHtml(m.name)}</div>
    <div class="map-meta-row">
      <span>${escapeHtml(m.biome)}</span>
      <strong>Thủ lĩnh: ${escapeHtml(m.boss)}</strong>
    </div>
  `;
}

function syncDiffButtons() {
  document.querySelectorAll('#diff-picker .diff-btn').forEach(btn => {
    const active = btn.dataset.diff === currentDiff;
    btn.classList.toggle('active', active);
    if (active && $('reward-mult')) {
      $('reward-mult').textContent = btn.dataset.mult;
    }
  });
}

// --- CHAT LOG ---
function renderChatLog(force = false) {
  const log = $('chat-log');
  if (!log) return;
  const msgs = roomState && Array.isArray(roomState.chat) && roomState.chat.length
    ? roomState.chat
    : [{ id: 'init', sys: true, text: 'Phòng chờ sẵn sàng. Hãy chọn Anh hùng và khóa tướng trước khi xuất trận.' }];
  const lastMsg = msgs[msgs.length - 1];
  const sig = `${msgs.length}:${lastMsg?.id || lastMsg?.text || ''}`;
  if (!force && sig === lastChatSig) return;
  lastChatSig = sig;
  log.innerHTML = msgs.map(m => {
    if (m.sys) {
      return `<div class="chat-msg sys">${escapeHtml(m.text)}</div>`;
    }
    const sender = m.name || m.sender || 'Chỉ huy';
    return `<div class="chat-msg"><b>${escapeHtml(sender)}:</b> ${escapeHtml(m.text)}</div>`;
  }).join('');
  log.scrollTop = log.scrollHeight;
}

function pushChatMessage(text) {
  if (!text.trim()) return;
  sendWs({ type: 'chat', text: text.trim() });
}

// --- SOCIAL, INVITE BY NAME, PROFILE & HISTORY ---
async function invitePlayerByName(targetName) {
  const clean = String(targetName || '').trim();
  if (!clean) return;
  if (!roomCode) {
    showToast(`<strong>Phòng chưa sẵn sàng, vui lòng thử lại sau giây lát.</strong>`);
    return;
  }
  try {
    const res = await apiPost('/api/rooms/invite', { roomCode, targetName: clean });
    const target = res.target?.displayName || res.target?.username || clean;
    showToast(`
      <div><strong>Đã gửi lời mời vào phòng #${escapeHtml(roomCode)}</strong></div>
      <div>Đã mời <b>${escapeHtml(target)}</b> ${res.deliveredOnline ? '(Đã nhận thông báo trực tiếp)' : '(Đã lưu vào hộp thư lời mời)'}.</div>
    `, 5000);
    refreshSocial();
  } catch (err) {
    showToast(`<strong>Không thể mời:</strong> <span>${escapeHtml(err.message)}</span>`, 4500);
  }
}

async function sendFriendRequest(targetName) {
  const clean = String(targetName || '').trim();
  if (!clean) return;
  try {
    await apiPost('/api/friends/add', { targetName: clean });
    showToast(`<strong>Đã gửi lời mời kết bạn tới ${escapeHtml(clean)}.</strong>`, 4000);
    await refreshSocial();
    renderTeamSlots();
  } catch (err) {
    showToast(`<strong>Kết bạn thất bại:</strong> <span>${escapeHtml(err.message)}</span>`, 4500);
  }
}

async function respondFriendRequest(friendAccountId, action) {
  try {
    await apiPost('/api/friends/respond', { friendAccountId, action });
    await refreshSocial();
    renderTeamSlots();
  } catch (err) {
    showToast(`<strong>Lỗi:</strong> <span>${escapeHtml(err.message)}</span>`, 4000);
  }
}

async function dismissRoomInvite(inviteId) {
  try {
    await apiPost('/api/rooms/invite-dismiss', { inviteId });
    await refreshSocial();
  } catch {}
}

function joinRoomByCode(code, inviteId) {
  if (inviteId) dismissRoomInvite(inviteId);
  const clean = String(code || '').trim().toUpperCase();
  if (!clean) return;
  location.href = `/lobby.html?mode=join&code=${encodeURIComponent(clean)}`;
}

async function refreshSocial() {
  try {
    socialData = await apiGet('/api/social');
    renderSocialModal();
  } catch {}
}

function renderSocialModal() {
  const friends = socialData.friends || [];
  const incoming = socialData.incomingRequests || [];
  const outgoing = socialData.outgoingRequests || [];
  const invites = socialData.roomInvites || [];

  const badgeCount = incoming.length + invites.length;
  const badge = $('social-badge');
  if (badge) {
    badge.style.display = badgeCount > 0 ? 'inline-block' : 'none';
    badge.textContent = String(badgeCount);
  }
  if ($('friends-count')) $('friends-count').textContent = String(friends.length);

  const friendsBox = $('friends-list');
  if (friendsBox) {
    if (!friends.length) {
      friendsBox.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:10px">Chưa có bạn bè. Hãy tìm tên người chơi ở ô phía trên hoặc bấm "+ Bạn" trên ô đồng đội.</div>`;
    } else {
      friendsBox.innerHTML = friends.map(f => `
        <div class="friend-row">
          <div class="friend-meta">
            <div class="friend-name">
              <span class="status-dot ${f.online ? 'on' : 'off'}"></span>
              ${escapeHtml(f.displayName)} <span style="color:var(--muted);font-weight:400">(@${escapeHtml(f.username)})</span>
            </div>
            <div class="friend-sub">
              Lv.${f.level} · ${escapeHtml(f.title || 'Tân binh')} ·
              ${f.online ? (f.roomCode ? `Đang ở phòng #${escapeHtml(f.roomCode)}` : 'Đang trực tuyến') : 'Ngoại tuyến'}
            </div>
          </div>
          <div style="display:flex;gap:5px">
            <button class="mini-btn gold" data-invite-friend="${escapeHtml(f.username)}">Mời vào phòng</button>
            ${f.roomCode && f.roomCode !== roomCode ? `<button class="mini-btn" data-join-friend-room="${escapeHtml(f.roomCode)}">Vào cùng</button>` : ''}
            <button class="mini-btn danger" data-remove-friend="${escapeHtml(f.accountId)}" title="Hủy kết bạn">✕</button>
          </div>
        </div>
      `).join('');

      friendsBox.querySelectorAll('[data-invite-friend]').forEach(btn => {
        btn.addEventListener('click', () => invitePlayerByName(btn.dataset.inviteFriend));
      });
      friendsBox.querySelectorAll('[data-join-friend-room]').forEach(btn => {
        btn.addEventListener('click', () => joinRoomByCode(btn.dataset.joinFriendRoom));
      });
      friendsBox.querySelectorAll('[data-remove-friend]').forEach(btn => {
        btn.addEventListener('click', () => respondFriendRequest(btn.dataset.removeFriend, 'remove'));
      });
    }
  }

  const reqBox = $('requests-list');
  if (reqBox) {
    const items = [];
    invites.forEach(inv => {
      items.push(`
        <div class="friend-row">
          <div class="friend-meta">
            <div class="friend-name">Lời mời vào phòng #${escapeHtml(inv.roomCode)}</div>
            <div class="friend-sub">Từ: <b>${escapeHtml(inv.fromDisplayName)}</b> (@${escapeHtml(inv.fromUsername)})</div>
          </div>
          <div style="display:flex;gap:5px">
            <button class="mini-btn gold" data-accept-room="${escapeHtml(inv.roomCode)}" data-inv-id="${escapeHtml(inv.id)}">Vào phòng</button>
            <button class="mini-btn" data-dismiss-room="${escapeHtml(inv.id)}">Bỏ qua</button>
          </div>
        </div>
      `);
    });
    incoming.forEach(r => {
      items.push(`
        <div class="friend-row">
          <div class="friend-meta">
            <div class="friend-name">${escapeHtml(r.displayName)} <span style="color:var(--muted);font-weight:400">(@${escapeHtml(r.username)})</span></div>
            <div class="friend-sub">Lv.${r.level} · Muốn kết bạn với bạn</div>
          </div>
          <div style="display:flex;gap:5px">
            <button class="mini-btn gold" data-accept-friend="${escapeHtml(r.accountId)}">Đồng ý</button>
            <button class="mini-btn danger" data-reject-friend="${escapeHtml(r.accountId)}">Từ chối</button>
          </div>
        </div>
      `);
    });
    outgoing.forEach(r => {
      items.push(`
        <div class="friend-row">
          <div class="friend-meta">
            <div class="friend-name">${escapeHtml(r.displayName)} <span style="color:var(--muted);font-weight:400">(@${escapeHtml(r.username)})</span></div>
            <div class="friend-sub">Đang chờ đối phương đồng ý...</div>
          </div>
          <button class="mini-btn" data-cancel-friend="${escapeHtml(r.accountId)}">Hủy</button>
        </div>
      `);
    });
    reqBox.innerHTML = items.length
      ? items.join('')
      : `<div style="color:var(--muted);font-size:12px;padding:10px">Không có lời mời phòng hoặc lời mời kết bạn nào đang chờ.</div>`;

    reqBox.querySelectorAll('[data-accept-room]').forEach(btn => {
      btn.addEventListener('click', () => joinRoomByCode(btn.dataset.acceptRoom, btn.dataset.invId));
    });
    reqBox.querySelectorAll('[data-dismiss-room]').forEach(btn => {
      btn.addEventListener('click', () => dismissRoomInvite(btn.dataset.dismissRoom));
    });
    reqBox.querySelectorAll('[data-accept-friend]').forEach(btn => {
      btn.addEventListener('click', () => respondFriendRequest(btn.dataset.acceptFriend, 'accept'));
    });
    reqBox.querySelectorAll('[data-reject-friend]').forEach(btn => {
      btn.addEventListener('click', () => respondFriendRequest(btn.dataset.rejectFriend, 'reject'));
    });
    reqBox.querySelectorAll('[data-cancel-friend]').forEach(btn => {
      btn.addEventListener('click', () => respondFriendRequest(btn.dataset.cancelFriend, 'remove'));
    });
  }
}

async function loadProfileAndHistory() {
  try {
    const data = await apiGet('/api/profile');
    if (data.profile) {
      myProfile = data.profile;
      myHistory = data.history || [];
      localStorage.setItem('gct-name', myProfile.displayName);
      renderProfileModal();
      renderHistoryModal();
      renderTeamSlots();
    }
  } catch {}
}

function renderProfileModal() {
  if (!myProfile) return;
  $('pf-level').textContent = String(myProfile.level || 1);
  $('pf-matches').textContent = String(myProfile.totalMatches || 0);
  $('pf-wins').textContent = String(myProfile.wins || 0);
  $('pf-kills').textContent = String(myProfile.totalKills || 0);
  $('pf-stage').textContent = String(myProfile.highestStage || 1);

  $('pf-username').value = myProfile.username || '';
  $('pf-display-name').value = myProfile.displayName || '';
  $('pf-title').value = myProfile.title || 'Tân binh giữ thành';
  $('pf-bio').value = myProfile.bio || '';

  const heroSelect = $('pf-hero');
  if (heroSelect && !heroSelect.options.length) {
    heroSelect.innerHTML = HERO_LIST.map(h =>
      `<option value="${escapeHtml(h.id)}">${escapeHtml(h.name)}</option>`
    ).join('');
  }
  if (heroSelect && myProfile.hero && HERO_MAP[myProfile.hero]) {
    heroSelect.value = myProfile.hero;
  }
}

function renderHistoryModal() {
  const box = $('history-list');
  if (!box) return;
  if (!myHistory.length) {
    box.innerHTML = `<div style="color:var(--muted);font-size:12.5px;padding:14px">Chưa có lịch sử trận đấu nào được ghi nhận. Hãy hoàn thành một chiến dịch Giữ Thành.</div>`;
    return;
  }
  box.innerHTML = myHistory.map(m => {
    const won = m.result === 'win' || m.result === 'victory' || m.result === 'clear';
    const roster = Array.isArray(m.roster) ? m.roster : [];
    const myEntry = roster.find(r => myProfile && r.account_id === myProfile.id) || roster[0] || {};
    const heroKey = myEntry.hero || m.hero || 'samurai';
    const heroName = getHeroObj(heroKey).name;
    const dateStr = m.ended_at ? new Date(m.ended_at).toLocaleString('vi-VN') : '';
    const matchRoom = m.room || m.code || '----';
    return `
      <div class="history-row" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong style="font-size:13.5px;color:var(--emerald-deep)">${won ? 'CHIẾN THẮNG' : 'KẾT THÚC CHIẾN DỊCH'} · Phòng #${escapeHtml(matchRoom)}</strong>
            <span style="color:var(--muted);font-size:11.5px;margin-left:8px">${escapeHtml(dateStr)}</span>
          </div>
          <div style="font-size:12px;color:var(--muted);font-weight:700">
            Mốc ${m.stage || 1} · Đợt ${m.wave || 1} · Độ khó: ${escapeHtml(m.difficulty || 'normal')}
          </div>
        </div>
        <div style="font-size:12px;color:var(--text);margin-top:3px">
          Tướng của bạn: <b>${escapeHtml(heroName)}</b> (Lv.${myEntry.level || 1}) · Hạ gục: <b>${myEntry.kills ?? m.kills ?? 0}</b> · Vàng: <b>${myEntry.gold || 0}</b>
        </div>
        <div class="roster-chips">
          ${roster.map(r => {
            const hName = getHeroObj(r.hero).name;
            const canAdd = r.username && (!myProfile || r.account_id !== myProfile.id) && !isFriendAccount(r.account_id);
            return `
              <span class="roster-chip">
                <b>${escapeHtml(r.name)}</b> <span style="color:var(--muted)">(${escapeHtml(hName)} · ${r.kills} hạ gục)</span>
                ${canAdd ? `<button class="mini-btn" data-hist-add="${escapeHtml(r.username)}" style="padding:2px 6px;font-size:10px">+ Kết bạn</button>` : ''}
              </span>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  box.querySelectorAll('[data-hist-add]').forEach(btn => {
    btn.addEventListener('click', () => sendFriendRequest(btn.dataset.histAdd));
  });
}

function openModal(id) {
  const el = $(id);
  if (el) el.classList.add('open');
  if (id === 'social-modal') refreshSocial();
  if (id === 'profile-modal' || id === 'history-modal') loadProfileAndHistory();
}

function closeModal(id) {
  const el = $(id);
  if (el) el.classList.remove('open');
}

function toggleMyLock(forceVal) {
  const me = getMe();
  const cur = Boolean(me ? (me.heroLocked || me.locked) : localLocked);
  const nextLocked = typeof forceVal === 'boolean' ? forceVal : !cur;
  lastLockToggleAt = Date.now();
  localLocked = nextLocked;
  if (me) {
    me.locked = nextLocked;
    me.heroLocked = nextLocked;
  }
  sendWs({ type: 'lock-hero', locked: nextLocked });
  renderTeamSlots(true);
  renderShowcase(true);
}

// --- EVENTS ---
function bindEvents() {
  $('role-filters').addEventListener('click', e => {
    const btn = e.target.closest('.filter-tab');
    if (!btn) return;
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderRoster();
  });

  $('lock-hero-btn').addEventListener('click', () => {
    toggleMyLock();
  });

  $('diff-picker').addEventListener('click', e => {
    const btn = e.target.closest('.diff-btn');
    if (!btn) return;
    currentDiff = btn.dataset.diff;
    syncDiffButtons();
    sendWs({ type: 'room-config', difficulty: currentDiff });
  });

  $('chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('chat-input');
    pushChatMessage(input.value);
    input.value = '';
  });

  document.querySelectorAll('.qchat-btn').forEach(btn => {
    btn.addEventListener('click', () => pushChatMessage(btn.dataset.msg));
  });

  $('quick-invite-form').addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('quick-invite-input');
    const name = input.value.trim();
    if (!name) return;
    await invitePlayerByName(name);
    input.value = '';
  });

  $('copy-code').addEventListener('click', () => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode);
    const btn = $('copy-code');
    btn.textContent = `Đã sao chép #${roomCode}`;
    setTimeout(() => updateRoomCodeDisplay(), 1800);
  });

  $('copy-invite').addEventListener('click', () => {
    const inviteUrl = `${location.origin}/lobby.html?mode=join&code=${encodeURIComponent(roomCode)}`;
    navigator.clipboard?.writeText(inviteUrl);
    const btn = $('copy-invite');
    btn.textContent = 'Đã chép link phòng';
    setTimeout(() => { btn.textContent = 'Sao chép link mời'; }, 1800);
  });

  $('start-match-btn').addEventListener('click', () => {
    const players = getEffectivePlayers();
    const me = getMe();
    if (me && !me.heroLocked) {
      toggleMyLock(true);
      if (players.length === 1 && isHost()) {
        if (roomState && roomState.code) {
          sendWs({ type: 'lobby-start' });
        } else {
          location.href = `/defense.html?autostart=1&mode=${encodeURIComponent(roomMode)}&difficulty=${encodeURIComponent(currentDiff)}&stage=${encodeURIComponent(currentMapStage)}`;
        }
      }
      return;
    }
    const allReady = players.length > 0 && players.every(p => p.heroLocked);
    if (!allReady) {
      showToast(`<strong>Đang chờ tất cả thành viên khóa anh hùng.</strong>`, 3500);
      return;
    }
    if (isHost()) {
      if (roomState && roomState.code) {
        sendWs({ type: 'lobby-start' });
      } else {
        location.href = `/defense.html?autostart=1&mode=${encodeURIComponent(roomMode)}&difficulty=${encodeURIComponent(currentDiff)}&stage=${encodeURIComponent(currentMapStage)}`;
      }
    } else {
      pushChatMessage('Mình đã sẵn sàng, chủ phòng bắt đầu trận nhé!');
    }
  });

  // Modals
  $('open-social-btn')?.addEventListener('click', () => openModal('social-modal'));
  $('open-profile-btn')?.addEventListener('click', () => openModal('profile-modal'));
  $('open-history-btn')?.addEventListener('click', () => openModal('history-modal'));

  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) backdrop.classList.remove('open');
    });
  });

  $('user-search-form').addEventListener('submit', async e => {
    e.preventDefault();
    const q = $('user-search-input').value.trim();
    const box = $('user-search-results');
    if (!q) return;
    box.innerHTML = `<div style="font-size:12px;color:var(--muted)">Đang tìm kiếm...</div>`;
    try {
      const data = await apiGet(`/api/users/search?q=${encodeURIComponent(q)}`);
      const users = data.users || [];
      if (!users.length) {
        box.innerHTML = `<div style="font-size:12px;color:var(--muted)">Không tìm thấy chỉ huy nào khớp với "${escapeHtml(q)}".</div>`;
        return;
      }
      box.innerHTML = users.map(u => `
        <div class="friend-row">
          <div class="friend-meta">
            <div class="friend-name">
              <span class="status-dot ${u.online ? 'on' : 'off'}"></span>
              ${escapeHtml(u.displayName)} <span style="color:var(--muted);font-weight:400">(@${escapeHtml(u.username)})</span>
            </div>
            <div class="friend-sub">Lv.${u.level} · ${escapeHtml(u.title || 'Tân binh')}</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="mini-btn gold" data-search-invite="${escapeHtml(u.username)}">Mời vào phòng</button>
            ${!isFriendAccount(u.accountId) ? `<button class="mini-btn" data-search-add="${escapeHtml(u.username)}">+ Kết bạn</button>` : '<span style="font-size:11px;color:var(--emerald);align-self:center;font-weight:700">Bạn bè</span>'}
          </div>
        </div>
      `).join('');
      box.querySelectorAll('[data-search-invite]').forEach(btn => {
        btn.addEventListener('click', () => invitePlayerByName(btn.dataset.searchInvite));
      });
      box.querySelectorAll('[data-search-add]').forEach(btn => {
        btn.addEventListener('click', () => sendFriendRequest(btn.dataset.searchAdd));
      });
    } catch (err) {
      box.innerHTML = `<div style="font-size:12px;color:var(--danger)">${escapeHtml(err.message)}</div>`;
    }
  });

  $('profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    const status = $('pf-save-status');
    status.textContent = 'Đang lưu...';
    try {
      const payload = {
        displayName: $('pf-display-name').value.trim(),
        title: $('pf-title').value.trim(),
        bio: $('pf-bio').value.trim(),
        hero: $('pf-hero').value
      };
      const res = await apiPost('/api/profile', payload);
      if (res.profile) {
        myProfile = res.profile;
        localStorage.setItem('gct-name', myProfile.displayName);
        renderProfileModal();
        renderTeamSlots();
      }
      status.textContent = 'Đã lưu hồ sơ cá nhân.';
      setTimeout(() => { status.textContent = ''; }, 3000);
    } catch (err) {
      status.style.color = 'var(--danger)';
      status.textContent = err.message;
    }
  });
}

// --- INIT ---
initMaps();
syncDiffButtons();
renderTeamSlots();
renderShowcase();
renderRoster();
renderChatLog();
bindEvents();
loadProfileAndHistory();
refreshSocial();
