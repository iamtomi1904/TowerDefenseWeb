import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {randomUUID} from 'node:crypto';
export async function createStorage(root){
 const postgres=!!process.env.DATABASE_URL;let pool,sqlite;if(process.env.NODE_ENV==='production'&&!process.env.PUBLIC_ORIGIN?.startsWith('https://'))throw Error('Production cần PUBLIC_ORIGIN là địa chỉ HTTPS.');
 if(postgres){const {Pool}=await import('pg');pool=new Pool({connectionString:process.env.DATABASE_URL,max:10,connectionTimeoutMillis:10000,idleTimeoutMillis:30000});pool.on('error',()=>console.error('Kết nối PostgreSQL bị gián đoạn.'));}
 else {if(process.env.NODE_ENV==='production')throw Error('Production cần DATABASE_URL PostgreSQL.');const dir=process.env.GAME_DATA_DIR||resolve(root,'data');mkdirSync(dir,{recursive:true});sqlite=new DatabaseSync(resolve(dir,'game.sqlite'));sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');}
 const stmtCache=new Map();
 const local=(sql,args=[])=>{const values=[];const query=sql.replace(/\$(\d+)/g,(_,n)=>{values.push(args[Number(n)-1]);return '?';});let stmt=stmtCache.get(query);if(!stmt){stmt=sqlite.prepare(query);stmtCache.set(query,stmt);}if(/^\s*SELECT/i.test(query)||/RETURNING/i.test(query))return {rows:stmt.all(...values)};return {rows:[],...stmt.run(...values)};};
 const query=(sql,args=[])=>postgres?pool.query(sql,args):Promise.resolve(local(sql,args));
 const schema=`CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password_hash TEXT NOT NULL,display_name TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS account_sessions(token_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE INDEX IF NOT EXISTS sessions_account_idx ON account_sessions(account_id);
 CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON account_sessions(expires_at);
 CREATE TABLE IF NOT EXISTS account_profiles(account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,hero TEXT NOT NULL DEFAULT 'knight-1',best_xp INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY,room TEXT,result TEXT,wave INTEGER,kills INTEGER,players INTEGER,stage INTEGER DEFAULT 1,difficulty TEXT DEFAULT 'easy',ended_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP);
 CREATE TABLE IF NOT EXISTS match_players(match_id TEXT REFERENCES matches(id),player_id TEXT,name TEXT,hero TEXT,gold INTEGER,kills INTEGER,level INTEGER,account_id TEXT REFERENCES accounts(id),PRIMARY KEY(match_id,player_id));
 CREATE TABLE IF NOT EXISTS friendships(user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,friend_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,status TEXT NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(user_id,friend_id));
 CREATE INDEX IF NOT EXISTS friendships_friend_idx ON friendships(friend_id);
 CREATE TABLE IF NOT EXISTS rooms(code TEXT PRIMARY KEY,host_account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,host_name TEXT NOT NULL DEFAULT 'Chỉ huy',stage INTEGER NOT NULL DEFAULT 1,difficulty TEXT NOT NULL DEFAULT 'normal',phase TEXT NOT NULL DEFAULT 'lobby',locked_slots TEXT NOT NULL DEFAULT '{}',max_players INTEGER NOT NULL DEFAULT 4,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE INDEX IF NOT EXISTS rooms_phase_idx ON rooms(phase);
 CREATE TABLE IF NOT EXISTS room_members(room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,player_id TEXT NOT NULL,account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,username TEXT,player_name TEXT NOT NULL,hero TEXT NOT NULL DEFAULT 'samurai',locked INTEGER NOT NULL DEFAULT 0,is_host INTEGER NOT NULL DEFAULT 0,joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(room_code,player_id));
 CREATE INDEX IF NOT EXISTS room_members_account_idx ON room_members(account_id);
 CREATE TABLE IF NOT EXISTS room_invites(id TEXT PRIMARY KEY,room_code TEXT NOT NULL,from_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,to_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP);
 CREATE INDEX IF NOT EXISTS room_invites_to_idx ON room_invites(to_account_id);`;if(postgres)await query(schema);else sqlite.exec(schema);
 const extraCols=[
  ['match_players','account_id','TEXT REFERENCES accounts(id)','TEXT'],
  ['matches','stage','INTEGER DEFAULT 1','INTEGER DEFAULT 1'],
  ['matches','difficulty',"TEXT DEFAULT 'easy'","TEXT DEFAULT 'easy'"],
  ['account_profiles','title',"TEXT DEFAULT 'Người Giữ Cổng'","TEXT DEFAULT 'Người Giữ Cổng'"],
  ['account_profiles','bio',"TEXT DEFAULT ''","TEXT DEFAULT ''"],
  ['account_profiles','total_matches','INTEGER DEFAULT 0','INTEGER DEFAULT 0'],
  ['account_profiles','wins','INTEGER DEFAULT 0','INTEGER DEFAULT 0'],
  ['account_profiles','total_kills','INTEGER DEFAULT 0','INTEGER DEFAULT 0'],
  ['account_profiles','highest_stage','INTEGER DEFAULT 1','INTEGER DEFAULT 1']
 ];
 if(postgres){for(const [t,col,pgDef]of extraCols)await query(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS ${col} ${pgDef}`);}
 else{for(const [t,col,_,sqDef]of extraCols)if(!sqlite.prepare('PRAGMA table_info('+t+')').all().some(c=>c.name===col))sqlite.exec('ALTER TABLE '+t+' ADD COLUMN '+col+' '+sqDef);}
 await query('CREATE INDEX IF NOT EXISTS match_account_idx ON match_players(account_id)');
 const batch=async statements=>{if(!postgres){sqlite.exec('BEGIN');try{for(const [sql,args]of statements)local(sql,args);sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}return;}const client=await pool.connect();try{await client.query('BEGIN');for(const [sql,args]of statements)await client.query(sql,args);await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}};
 const profileSQL=`INSERT INTO account_profiles(account_id,hero,best_xp) VALUES($1,$2,$3) ON CONFLICT(account_id) DO UPDATE SET hero=excluded.hero,best_xp=CASE WHEN account_profiles.best_xp>excluded.best_xp THEN account_profiles.best_xp ELSE excluded.best_xp END,updated_at=CURRENT_TIMESTAMP`;
 const matchStatsSQL=`INSERT INTO account_profiles(account_id,hero,best_xp,total_matches,wins,total_kills,highest_stage) VALUES($1,$2,$3,1,$4,$5,$6) ON CONFLICT(account_id) DO UPDATE SET hero=excluded.hero,best_xp=CASE WHEN account_profiles.best_xp>excluded.best_xp THEN account_profiles.best_xp ELSE excluded.best_xp END,total_matches=COALESCE(account_profiles.total_matches,0)+1,wins=COALESCE(account_profiles.wins,0)+excluded.wins,total_kills=COALESCE(account_profiles.total_kills,0)+excluded.total_kills,highest_stage=CASE WHEN COALESCE(account_profiles.highest_stage,1)>excluded.highest_stage THEN COALESCE(account_profiles.highest_stage,1) ELSE excluded.highest_stage END,updated_at=CURRENT_TIMESTAMP`;
 return {backend:postgres?'postgresql':'sqlite-local',query,
  async transaction(fn){if(!postgres)throw Error('MMORPG requires PostgreSQL');const client=await pool.connect();try{await client.query('BEGIN');const result=await fn(client);await client.query('COMMIT');return result;}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}},
  async profile(id){return (await query('SELECT hero,best_xp,title,bio,total_matches,wins,total_kills,highest_stage FROM account_profiles WHERE account_id=$1',[id])).rows[0];},
  async getFullProfile(id){
   const r=(await query(`SELECT a.id,a.username,a.display_name,a.created_at,COALESCE(p.hero,'knight-1') AS hero,COALESCE(p.best_xp,0) AS best_xp,COALESCE(p.title,'Người Giữ Cổng') AS title,COALESCE(p.bio,'') AS bio,COALESCE(p.total_matches,0) AS total_matches,COALESCE(p.wins,0) AS wins,COALESCE(p.total_kills,0) AS total_kills,COALESCE(p.highest_stage,1) AS highest_stage FROM accounts a LEFT JOIN account_profiles p ON p.account_id=a.id WHERE a.id=$1`,[id])).rows[0];
   if(!r)return null;
   const xp=Number(r.best_xp)||0,matches=Number(r.total_matches)||0;
   return {id:r.id,username:r.username,displayName:r.display_name,createdAt:r.created_at,hero:r.hero,bestXP:xp,level:Math.max(1,1+Math.floor(Math.sqrt(xp/25))+Math.floor(matches/3)),title:r.title||'Người Giữ Cổng',bio:r.bio||'',totalMatches:matches,wins:Number(r.wins)||0,totalKills:Number(r.total_kills)||0,highestStage:Number(r.highest_stage)||1};
  },
  async updatePersonalProfile(id,{displayName,title,bio,hero}){
   if(displayName&&displayName.trim().length>=1&&displayName.trim().length<=18){
    await query('UPDATE accounts SET display_name=$1 WHERE id=$2',[displayName.trim(),id]);
   }
   const cur=await this.profile(id);
   const nextHero=hero||cur?.hero||'knight-1';
   const nextTitle=typeof title==='string'?title.trim().slice(0,32):(cur?.title||'Người Giữ Cổng');
   const nextBio=typeof bio==='string'?bio.trim().slice(0,160):(cur?.bio||'');
   await query(`INSERT INTO account_profiles(account_id,hero,best_xp,title,bio) VALUES($1,$2,0,$3,$4) ON CONFLICT(account_id) DO UPDATE SET hero=excluded.hero,title=excluded.title,bio=excluded.bio,updated_at=CURRENT_TIMESTAMP`,[id,nextHero,nextTitle||'Người Giữ Cổng',nextBio]);
   return this.getFullProfile(id);
  },
  async saveProfile(p){if(p.accountId)await query(profileSQL,[p.accountId,p.hero,p.xp]);},
  async history(id){
   const rows=(await query('SELECT m.* FROM matches m WHERE EXISTS(SELECT 1 FROM match_players p WHERE p.match_id=m.id AND p.account_id=$1) ORDER BY m.ended_at DESC,m.id DESC LIMIT 20',[id])).rows;
   for(const m of rows){
    m.roster=(await query('SELECT mp.player_id,mp.name,mp.hero,mp.gold,mp.kills,mp.level,mp.account_id,a.username FROM match_players mp LEFT JOIN accounts a ON a.id=mp.account_id WHERE mp.match_id=$1',[m.id])).rows;
   }
   return rows;
  },
  async record(r){const id=randomUUID(),won=(r.phase==='victory'||r.phase==='clear')?1:0,statements=[['INSERT INTO matches(id,room,result,wave,kills,players,stage,difficulty) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,r.code,r.phase,r.wave,r.kills,r.peak,r.stage,r.difficulty]]];for(const p of r.players){statements.push(['INSERT INTO match_players(match_id,player_id,name,hero,gold,kills,level,account_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,p.id,p.name,p.hero,p.earned,p.kills,p.level,p.accountId||null]]);if(p.accountId)statements.push([matchStatsSQL,[p.accountId,p.hero,p.xp,won,p.kills||0,r.stage||1]]);}await batch(statements);},
  async findAccountByName(q){
   const s=String(q||'').trim();if(!s)return null;
   return (await query('SELECT a.id,a.username,a.display_name,COALESCE(p.hero,\'knight-1\') AS hero,COALESCE(p.title,\'Người Giữ Cổng\') AS title,COALESCE(p.best_xp,0) AS best_xp,COALESCE(p.total_matches,0) AS total_matches FROM accounts a LEFT JOIN account_profiles p ON p.account_id=a.id WHERE LOWER(a.username)=LOWER($1) OR LOWER(a.display_name)=LOWER($1) LIMIT 1',[s])).rows[0]||null;
  },
  async searchAccounts(q,excludeId){
   const s='%'+String(q||'').trim().toLowerCase()+'%';
   return (await query('SELECT a.id,a.username,a.display_name,COALESCE(p.hero,\'knight-1\') AS hero,COALESCE(p.title,\'Người Giữ Cổng\') AS title,COALESCE(p.best_xp,0) AS best_xp,COALESCE(p.total_matches,0) AS total_matches FROM accounts a LEFT JOIN account_profiles p ON p.account_id=a.id WHERE a.id!=$1 AND (LOWER(a.username) LIKE $2 OR LOWER(a.display_name) LIKE $2) ORDER BY a.display_name ASC LIMIT 12',[excludeId||'',s])).rows;
  },
  async addFriend(fromId,targetNameOrId){
   let target=(await query('SELECT id,username,display_name FROM accounts WHERE id=$1',[targetNameOrId])).rows[0];
   if(!target)target=await this.findAccountByName(targetNameOrId);
   if(!target)return {error:'Không tìm thấy chỉ huy có tên này.'};
   if(target.id===fromId)return {error:'Không thể tự kết bạn với chính mình.'};
   const rev=(await query('SELECT status FROM friendships WHERE user_id=$1 AND friend_id=$2',[target.id,fromId])).rows[0];
   if(rev){
    await batch([
     ['INSERT INTO friendships(user_id,friend_id,status) VALUES($1,$2,\'accepted\') ON CONFLICT(user_id,friend_id) DO UPDATE SET status=\'accepted\'',[fromId,target.id]],
     ['UPDATE friendships SET status=\'accepted\' WHERE user_id=$1 AND friend_id=$2',[target.id,fromId]]
    ]);
    return {ok:true,status:'accepted',target:{id:target.id,username:target.username,displayName:target.display_name}};
   }
   await query('INSERT INTO friendships(user_id,friend_id,status) VALUES($1,$2,\'pending\') ON CONFLICT(user_id,friend_id) DO NOTHING',[fromId,target.id]);
   return {ok:true,status:'pending',target:{id:target.id,username:target.username,displayName:target.display_name}};
  },
  async respondFriend(userId,friendId,action){
   if(action==='accept'){
    await batch([
     ['UPDATE friendships SET status=\'accepted\' WHERE user_id=$1 AND friend_id=$2',[friendId,userId]],
     ['INSERT INTO friendships(user_id,friend_id,status) VALUES($1,$2,\'accepted\') ON CONFLICT(user_id,friend_id) DO UPDATE SET status=\'accepted\'',[userId,friendId]]
    ]);
    return {ok:true};
   }
   await batch([
    ['DELETE FROM friendships WHERE user_id=$1 AND friend_id=$2',[userId,friendId]],
    ['DELETE FROM friendships WHERE user_id=$1 AND friend_id=$2',[friendId,userId]]
   ]);
   return {ok:true};
  },
  async getSocial(userId){
   const friends=(await query(`SELECT a.id,a.username,a.display_name,COALESCE(p.hero,'knight-1') AS hero,COALESCE(p.title,'Người Giữ Cổng') AS title,COALESCE(p.best_xp,0) AS best_xp,COALESCE(p.total_matches,0) AS total_matches,COALESCE(p.highest_stage,1) AS highest_stage FROM friendships f JOIN accounts a ON a.id=f.friend_id LEFT JOIN account_profiles p ON p.account_id=a.id WHERE f.user_id=$1 AND f.status='accepted' ORDER BY a.display_name ASC`,[userId])).rows;
   const incoming=(await query(`SELECT a.id,a.username,a.display_name,COALESCE(p.hero,'knight-1') AS hero,COALESCE(p.title,'Người Giữ Cổng') AS title,f.created_at FROM friendships f JOIN accounts a ON a.id=f.user_id LEFT JOIN account_profiles p ON p.account_id=a.id WHERE f.friend_id=$1 AND f.status='pending' ORDER BY f.created_at DESC`,[userId])).rows;
   const outgoing=(await query(`SELECT a.id,a.username,a.display_name,COALESCE(p.hero,'knight-1') AS hero,COALESCE(p.title,'Người Giữ Cổng') AS title,f.created_at FROM friendships f JOIN accounts a ON a.id=f.friend_id LEFT JOIN account_profiles p ON p.account_id=a.id WHERE f.user_id=$1 AND f.status='pending' ORDER BY f.created_at DESC`,[userId])).rows;
   const invites=(await query(`SELECT ri.id,ri.room_code,ri.created_at,a.id AS from_id,a.username AS from_username,a.display_name AS from_name FROM room_invites ri JOIN accounts a ON a.id=ri.from_account_id WHERE ri.to_account_id=$1 ORDER BY ri.created_at DESC LIMIT 10`,[userId])).rows;
   return {friends,incoming,outgoing,invites};
  },
  async createRoomInvite(fromId,targetNameOrId,roomCode){
   let target=(await query('SELECT id,username,display_name FROM accounts WHERE id=$1',[targetNameOrId])).rows[0];
   if(!target)target=await this.findAccountByName(targetNameOrId);
   if(!target)return {error:'Không tìm thấy người chơi có tên này.'};
   if(target.id===fromId)return {error:'Bạn đã ở trong phòng này.'};
   const id=randomUUID();
   await query('DELETE FROM room_invites WHERE room_code=$1 AND to_account_id=$2',[roomCode,target.id]);
   await query('INSERT INTO room_invites(id,room_code,from_account_id,to_account_id) VALUES($1,$2,$3,$4)',[id,roomCode,fromId,target.id]);
   return {ok:true,inviteId:id,target:{id:target.id,username:target.username,displayName:target.display_name}};
  },
  async deleteRoomInvite(inviteId,userId){
   await query('DELETE FROM room_invites WHERE id=$1 AND to_account_id=$2',[inviteId,userId]);
   return {ok:true};
  },
  async saveRoom(r){
   if(!r||!r.code)return;
   const host=r.players?.[0]||null;
   const lockedJson=JSON.stringify(r.lockedSlots||{});
   const lockedCount=Object.values(r.lockedSlots||{}).filter(Boolean).length;
   const maxPlayers=Math.max(1,4-lockedCount);
   const statements=[
    [`INSERT INTO rooms(code,host_account_id,host_name,stage,difficulty,phase,locked_slots,max_players,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP) ON CONFLICT(code) DO UPDATE SET host_account_id=excluded.host_account_id,host_name=excluded.host_name,stage=excluded.stage,difficulty=excluded.difficulty,phase=excluded.phase,locked_slots=excluded.locked_slots,max_players=excluded.max_players,updated_at=CURRENT_TIMESTAMP`,[r.code,host?.accountId||null,host?.name||'Chỉ huy',r.stage||1,r.difficulty||'normal',r.phase||'lobby',lockedJson,maxPlayers]],
    ['DELETE FROM room_members WHERE room_code=$1',[r.code]]
   ];
   for(const [idx,p]of (r.players||[]).entries()){
    statements.push([
     'INSERT INTO room_members(room_code,player_id,account_id,username,player_name,hero,locked,is_host) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
     [r.code,p.id,p.accountId||null,p.username||null,p.name||'Chỉ huy',p.hero||'samurai',p.locked?1:0,idx===0?1:0]
    ]);
   }
   await batch(statements);
  },
  async getRoom(code){
   const c=String(code||'').trim().toUpperCase();if(!c)return null;
   const room=(await query('SELECT * FROM rooms WHERE code=$1',[c])).rows[0];
   if(!room)return null;
   const members=(await query('SELECT * FROM room_members WHERE room_code=$1 ORDER BY is_host DESC,joined_at ASC',[c])).rows;
   let lockedSlots={};try{lockedSlots=JSON.parse(room.locked_slots||'{}');}catch{}
   return {...room,lockedSlots,members};
  },
  async listRooms(){
   const rows=(await query("SELECT * FROM rooms WHERE phase='lobby' ORDER BY updated_at DESC LIMIT 20")).rows;
   for(const r of rows){
    r.members=(await query('SELECT player_id,account_id,username,player_name,hero,locked,is_host FROM room_members WHERE room_code=$1 ORDER BY is_host DESC,joined_at ASC',[r.code])).rows;
    try{r.lockedSlots=JSON.parse(r.locked_slots||'{}');}catch{r.lockedSlots={};}
   }
   return rows;
  },
  async deleteRoom(code){
   const c=String(code||'').trim().toUpperCase();if(!c)return;
   await query('DELETE FROM rooms WHERE code=$1',[c]);
  },
  async close(){if(pool)await pool.end();else sqlite.close();}
 };
}
