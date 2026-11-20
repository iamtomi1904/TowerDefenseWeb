import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createStorage } from '../storage.mjs';

test('lobby social DB: personal profile, friends, room invites, and match history with roster', async () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'td-social-test-'));
  const store = await createStorage(tempRoot);

  // Create two test accounts
  await store.query(
    `INSERT INTO accounts(id, username, display_name, password_hash) VALUES ($1, $2, $3, 'hash1'), ($4, $5, $6, 'hash2')`,
    ['acc-1', 'minhquan', 'Minh Quân', 'acc-2', 'linhdan', 'Linh Đan']
  );

  // 1. Personal profile read & update
  const initialProfile = await store.getFullProfile('acc-1');
  assert.equal(initialProfile.username, 'minhquan');
  assert.equal(initialProfile.displayName, 'Minh Quân');
  assert.equal(initialProfile.level, 1);

  const updatedProfile = await store.updatePersonalProfile('acc-1', {
    displayName: 'Minh Quân VN',
    title: 'Đại Thủ Lĩnh Ấn Thành',
    bio: 'Chuyên giữ cổng chính với Thủy Pháp Sư',
    hero: 'Water'
  });
  assert.equal(updatedProfile.displayName, 'Minh Quân VN');
  assert.equal(updatedProfile.title, 'Đại Thủ Lĩnh Ấn Thành');
  assert.equal(updatedProfile.bio, 'Chuyên giữ cổng chính với Thủy Pháp Sư');
  assert.equal(updatedProfile.hero, 'Water');

  // 2. Search accounts by name
  const found = await store.searchAccounts('linh', 'acc-1');
  assert.equal(found.length, 1);
  assert.equal(found[0].username, 'linhdan');

  // 3. Friend request & accept flow
  const addRes = await store.addFriend('acc-1', 'Linh Đan');
  assert.equal(addRes.ok, true);
  assert.equal(addRes.status, 'pending');

  let social2 = await store.getSocial('acc-2');
  assert.equal(social2.incoming.length, 1);
  assert.equal(social2.incoming[0].username, 'minhquan');

  await store.respondFriend('acc-2', 'acc-1', 'accept');
  const social1 = await store.getSocial('acc-1');
  social2 = await store.getSocial('acc-2');
  assert.equal(social1.friends.length, 1);
  assert.equal(social1.friends[0].username, 'linhdan');
  assert.equal(social2.friends.length, 1);
  assert.equal(social2.friends[0].username, 'minhquan');

  // 4. Invite by name into a room
  const invRes = await store.createRoomInvite('acc-1', 'linhdan', 'AT8899');
  assert.equal(invRes.ok, true);
  assert.equal(invRes.target.id, 'acc-2');

  social2 = await store.getSocial('acc-2');
  assert.equal(social2.invites.length, 1);
  assert.equal(social2.invites[0].room_code, 'AT8899');
  assert.equal(social2.invites[0].from_name, 'Minh Quân VN');

  await store.deleteRoomInvite(invRes.inviteId, 'acc-2');
  social2 = await store.getSocial('acc-2');
  assert.equal(social2.invites.length, 0);

  // 5. Record match history & verify career stats + match roster
  await store.record({
    code: 'AT8899',
    phase: 'victory',
    wave: 15,
    kills: 240,
    peak: 2,
    stage: 7,
    difficulty: 'insane',
    players: [
      { id: 'p1', name: 'Minh Quân VN', hero: 'Water', earned: 3200, kills: 130, level: 9, xp: 450, accountId: 'acc-1' },
      { id: 'p2', name: 'Linh Đan', hero: 'Fire', earned: 2900, kills: 110, level: 8, xp: 410, accountId: 'acc-2' }
    ]
  });

  const afterProfile = await store.getFullProfile('acc-1');
  assert.equal(afterProfile.totalMatches, 1);
  assert.equal(afterProfile.wins, 1);
  assert.equal(afterProfile.totalKills, 130);
  assert.equal(afterProfile.highestStage, 7);

  const hist1 = await store.history('acc-1');
  assert.equal(hist1.length, 1);
  assert.equal(hist1[0].room, 'AT8899');
  assert.equal(hist1[0].stage, 7);
  assert.equal(hist1[0].roster.length, 2);
  assert.equal(hist1[0].roster.some(r => r.username === 'linhdan' && r.hero === 'Fire'), true);

  // 6. Rooms DB & Room Members persistence
  await store.saveRoom({
    code: 'AB12CD',
    stage: 4,
    difficulty: 'insane',
    phase: 'lobby',
    lockedSlots: { 3: true },
    players: [
      { id: 'ws-1', accountId: 'acc-1', username: 'minhquan', name: 'Minh Quân VN', hero: 'samurai', locked: true },
      { id: 'ws-2', accountId: 'acc-2', username: 'linhdan', name: 'Linh Đan', hero: 'fire-wizard', locked: false }
    ]
  });

  const savedRoom = await store.getRoom('AB12CD');
  assert.equal(savedRoom.code, 'AB12CD');
  assert.equal(savedRoom.stage, 4);
  assert.equal(savedRoom.difficulty, 'insane');
  assert.equal(savedRoom.max_players, 3);
  assert.equal(savedRoom.lockedSlots[3], true);
  assert.equal(savedRoom.members.length, 2);
  assert.equal(savedRoom.members[0].player_name, 'Minh Quân VN');
  assert.equal(savedRoom.members[0].hero, 'samurai');
  assert.equal(savedRoom.members[0].locked, 1);

  const openRooms = await store.listRooms();
  assert.equal(openRooms.some(r => r.code === 'AB12CD' && r.members.length === 2), true);

  await store.deleteRoom('AB12CD');
  assert.equal(await store.getRoom('AB12CD'), null);

  await store.close();
});
