import {createFixedStepper,advanceRooms} from './fixed-step-loop.mjs';
import {sendSnapshot} from './snapshot-transport.mjs';
import {performance,monitorEventLoopDelay} from 'node:perf_hooks';
const loopDelay=monitorEventLoopDelay({resolution:20});loopDelay.enable();
let serverTickMs=0,serverLoopMs=0;
setInterval(()=>{serverLoopMs=Number.isFinite(loopDelay.max)?Math.max(0,loopDelay.max/1e6-20):0;loopDelay.reset();},1000).unref();
import http from 'node:http';
import {readFileSync,existsSync,readdirSync,createReadStream,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {createStorage} from './storage.mjs';
import {createAuth,sameOrigin,json} from './auth.mjs';
import {WebSocketServer,WebSocket} from 'ws';
import {randomUUID,randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRoom,addPlayer,start,buy,nextStage,tick,snapshot,HEROES,MAPS,stats,useConsumable} from './simulation.mjs';
import {migrateMMO,createMMOService} from './mmorpg-service.mjs';
import {initializeSkills} from './abilities.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
if(existsSync(resolve(root,'.env')))process.loadEnvFile(resolve(root,'.env'));
const store=await createStorage(root);
const rooms=new Map();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.json':'application/json; charset=utf-8'};
const COMPRESSIBLE_EXTS=new Set(['.html','.js','.css','.json','.svg']);
const staticCache=new Map();
function saveProgress(p){store.saveProfile({...p}).catch(e=>console.error('Không lưu được hồ sơ:',e.code||e.name));}
function record(r){const stage=r.stage,phase=r.phase;r.recorded=true;const copy={...r,players:r.players.map(p=>({...p}))};store.record(copy).catch(e=>{console.error('Không lưu được trận:',e.code||e.name);if(r.stage===stage&&r.phase===phase)r.recorded=false;});}
async function readJsonBody(req){
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>8192)throw Error('Payload too large');chunks.push(chunk);}
 return JSON.parse(Buffer.concat(chunks).toString()||'{}');
}
const auth=createAuth(store,hash=>{for(const ws of wss.clients)if(ws.session?.hash===hash)ws.close(4001,'Đã đăng xuất');});
await migrateMMO(store,root);
const mmo=createMMOService({store,auth,config:JSON.parse(readFileSync(resolve(root,'public/mmorpg/maps/runtime-map.json'),'utf8')),devTools:process.env.NODE_ENV!=='production'&&process.env.MMO_DEV_MAP_TOOLS==='1'});

function onlineStatusMap(){
 const map=new Map();
 for(const client of wss.clients){
  if(client.readyState===WebSocket.OPEN&&client.session?.user?.id){
   const uid=client.session.user.id;
   const prev=map.get(uid);
   map.set(uid,{online:true,inRoom:client.room?.code||prev?.inRoom||null,phase:client.room?.phase||prev?.phase||null});
  }
 }
 return map;
}
function notifyAccount(accountId,payload){
 for(const client of wss.clients){
  if(client.readyState===WebSocket.OPEN&&client.session?.user?.id===accountId){
   send(client,payload);
  }
 }
}

const server=http.createServer(async(req,res)=>{
 try{
  const urlObj=new URL(req.url,'http://localhost');
  const path=decodeURIComponent(urlObj.pathname);res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(path==='/api/client-info'&&req.method==='GET'){json(res,200,{app:'an-thanh',protocol:1,database:store.backend});return;}
  if(['/api/client-release','/downloads/an-thanh-windows.zip'].includes(path)&&req.method==='GET'){
   const manifestPath=resolve(root,'release/latest-client.json');
   if(!existsSync(manifestPath)){json(res,503,{error:'Client Windows đang được đóng gói.'});return;}
   const release=JSON.parse(readFileSync(manifestPath,'utf8'));
   if(!/^AnThanh-PC-\d+\.\d+\.\d+-win-x64\.zip$/.test(release.archive||'')){json(res,503,{error:'Client Windows chưa sẵn sàng.'});return;}
   const archive=resolve(root,'release',release.archive);
   if(!existsSync(archive)){json(res,503,{error:'Chưa tìm thấy gói client Windows.'});return;}
   if(path==='/api/client-release'){json(res,200,{version:release.version,bytes:statSync(archive).size,sha256:release.sha256,download:'/downloads/an-thanh-windows.zip'});return;}
   res.setHeader('Content-Type','application/zip');res.setHeader('Content-Disposition','attachment; filename="'+release.archive+'"');res.setHeader('Content-Length',statSync(archive).size);
   const stream=createReadStream(archive);stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);return;
  }
  if(path==='/api/design-documents'){
   const ip=req.socket.remoteAddress,host=new URL('http://'+req.headers.host).hostname;if(process.env.NODE_ENV==='production'||req.headers['x-forwarded-for']||!['localhost','127.0.0.1','[::1]'].includes(host)||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip)){json(res,403,{error:'Tài liệu thiết kế nội bộ chỉ mở trên máy local.'});return;}
   const documents=[];for(const collection of ['mmorpg-design-checklist-v1','mmorpg-story-v1']){const folder=resolve(root,'design',collection);for(const file of readdirSync(folder).filter(f=>f.endsWith('.md')).sort()){const content=readFileSync(resolve(folder,file),'utf8');documents.push({id:collection+'/'+file,collection,file,title:(content.match(/^# (.+)/m)||[])[1]||file,content,spoiler:collection==='mmorpg-story-v1'&&file!=='README.md'});}}
   json(res,200,{documents});return;
  }
  if(path==='/vendor/marked.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(readFileSync(resolve(root,'node_modules/marked/lib/marked.esm.js')));return;}
  if(path.startsWith('/vendor/mermaid/')){const vendorRoot=resolve(root,'node_modules/mermaid/dist'),file=resolve(vendorRoot,path.slice('/vendor/mermaid/'.length));if(!file.startsWith(vendorRoot+sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type','text/javascript; charset=utf-8');res.end(readFileSync(file));return;}
  if(path==='/health'){res.end('ok');return;}
  if(await auth.handle(req,res,path))return;
  if(await mmo.handle(req,res,path))return;
  if(path==='/api/history'){const session=await auth.findSession(req);if(!session){json(res,401,{error:'Cần đăng nhập.'});return;}json(res,200,await store.history(session.user.id));return;}
  if(path==='/api/profile'){
   const session=await auth.findSession(req);if(!session){json(res,401,{error:'Cần đăng nhập.'});return;}
   if(req.method==='GET'){
    const profile=await store.getFullProfile(session.user.id);
    const history=await store.history(session.user.id);
    json(res,200,{profile,history});return;
   }
   if(req.method==='POST'){
    if(!sameOrigin(req)){json(res,403,{error:'Không hợp lệ.'});return;}
    const data=await readJsonBody(req);
    const profile=await store.updatePersonalProfile(session.user.id,data);
    json(res,200,{ok:true,profile});return;
   }
  }
  if(path==='/api/social'&&req.method==='GET'){
   const session=await auth.findSession(req);if(!session){json(res,401,{error:'Cần đăng nhập.'});return;}
   const social=await store.getSocial(session.user.id);
   const online=onlineStatusMap();
   const mapUser=u=>{const xp=Number(u.best_xp)||0,matches=Number(u.total_matches)||0;return {...u,accountId:u.id,displayName:u.display_name,level:Math.max(1,1+Math.floor(Math.sqrt(xp/25))+Math.floor(matches/3)),online:!!online.get(u.id)?.online,inRoom:online.get(u.id)?.inRoom||null,roomCode:online.get(u.id)?.inRoom||null,roomPhase:online.get(u.id)?.phase||null};};
   social.friends=social.friends.map(mapUser);
   social.incoming=social.incoming.map(mapUser);
   social.outgoing=social.outgoing.map(mapUser);
   social.incomingRequests=social.incoming;
   social.outgoingRequests=social.outgoing;
   social.invites=social.invites.map(inv=>{const r=rooms.get(inv.room_code);return {...inv,roomCode:inv.room_code,fromDisplayName:inv.from_name,fromUsername:inv.from_username,roomActive:!!r&&r.phase==='lobby',playersCount:r?r.players.length:0,difficulty:r?.difficulty||'normal',stage:r?.stage||1};});
   social.roomInvites=social.invites;
   json(res,200,social);return;
  }
  if(path==='/api/users/search'&&req.method==='GET'){
   const session=await auth.findSession(req);if(!session){json(res,401,{error:'Cần đăng nhập.'});return;}
   const q=urlObj.searchParams.get('q')||'';
   const rows=await store.searchAccounts(q,session.user.id);
   const online=onlineStatusMap();
   json(res,200,{users:rows.map(u=>{const xp=Number(u.best_xp)||0,matches=Number(u.total_matches)||0;return {...u,accountId:u.id,displayName:u.display_name,level:Math.max(1,1+Math.floor(Math.sqrt(xp/25))+Math.floor(matches/3)),online:!!online.get(u.id)?.online,inRoom:online.get(u.id)?.inRoom||null,roomCode:online.get(u.id)?.inRoom||null};})});return;
  }
  if(path==='/api/friends/add'&&req.method==='POST'){
   const session=await auth.findSession(req);if(!session||!sameOrigin(req)){json(res,401,{error:'Cần đăng nhập.'});return;}
   const data=await readJsonBody(req);
   const result=await store.addFriend(session.user.id,data.target||data.targetName);
   if(result.error){json(res,400,result);return;}
   notifyAccount(result.target.id,{type:'social-notify',kind:result.status==='accepted'?'friend-accepted':'friend-request',fromId:session.user.id,fromName:session.user.displayName,fromDisplayName:session.user.displayName,fromUsername:session.user.username});
   json(res,200,result);return;
  }
  if(path==='/api/friends/respond'&&req.method==='POST'){
   const session=await auth.findSession(req);if(!session||!sameOrigin(req)){json(res,401,{error:'Cần đăng nhập.'});return;}
   const data=await readJsonBody(req);
   const friendId=data.friendId||data.friendAccountId;
   const result=await store.respondFriend(session.user.id,friendId,data.action);
   if(data.action==='accept')notifyAccount(friendId,{type:'social-notify',kind:'friend-accepted',fromId:session.user.id,fromName:session.user.displayName,fromDisplayName:session.user.displayName,fromUsername:session.user.username});
   json(res,200,result);return;
  }
  if(path==='/api/rooms/invite'&&req.method==='POST'){
   const session=await auth.findSession(req);if(!session||!sameOrigin(req)){json(res,401,{error:'Cần đăng nhập.'});return;}
   const data=await readJsonBody(req);
   const code=String(data.roomCode||'').trim().toUpperCase();
   const r=rooms.get(code);
   if(!r||r.phase!=='lobby'){json(res,400,{error:'Phòng chờ không tồn tại hoặc đã bắt đầu.'});return;}
   const result=await store.createRoomInvite(session.user.id,data.target||data.targetName,code);
   if(result.error){json(res,400,result);return;}
   const deliveredOnline=notifyAccount(result.target.id,{type:'room-invite',inviteId:result.inviteId,roomCode:code,fromName:session.user.displayName,fromDisplayName:session.user.displayName,fromUsername:session.user.username,stage:r.stage,difficulty:r.difficulty,invite:{id:result.inviteId,roomCode:code,fromDisplayName:session.user.displayName,fromUsername:session.user.username,stage:r.stage,difficulty:r.difficulty}});
   json(res,200,{...result,deliveredOnline});return;
  }
  if(path==='/api/rooms/invite-dismiss'&&req.method==='POST'){
   const session=await auth.findSession(req);if(!session||!sameOrigin(req)){json(res,401,{error:'Cần đăng nhập.'});return;}
   const data=await readJsonBody(req);
   json(res,200,await store.deleteRoomInvite(data.inviteId,session.user.id));return;
  }
  if(path==='/api/rooms'&&req.method==='GET'){
   const session=await auth.findSession(req);if(!session){json(res,401,{error:'Cần đăng nhập.'});return;}
   const code=urlObj.searchParams.get('code');
   if(code){
    const dbRoom=await store.getRoom(code);
    if(!dbRoom){json(res,404,{error:'Không tìm thấy phòng.'});return;}
    json(res,200,{room:dbRoom});return;
   }
   json(res,200,{rooms:await store.listRooms()});return;
  }
  if(['/defense.html','/index.html','/lobby.html','/mmorpg/index.html'].includes(path)&&!await auth.findSession(req)){res.writeHead(302,{Location:'/login.html?next='+encodeURIComponent(path)}).end();return;}
  const base=resolve(root,'public');const vendor=path==='/vendor/phaser.js';
  const file=vendor?resolve(root,'node_modules/phaser/dist/phaser.min.js'):resolve(base,'.'+(path==='/'?'/home.html':path));
  if(!vendor&&!file.startsWith(base+sep)){res.writeHead(403).end();return;}
  const ext=extname(file),st=statSync(file),etag=`W/"${st.size}-${Math.floor(st.mtimeMs)}"`;
  const isAsset=vendor||path.startsWith('/assets/')||['.png','.webp','.svg','.jpg'].includes(ext);
  if(isAsset){
   res.setHeader('Cache-Control',/^\/assets\/optimized\/[a-f0-9]{20}\.png$/.test(path)?'public, max-age=31536000, immutable':'public, max-age=0, must-revalidate');
   res.setHeader('ETag',etag);
   if(req.headers['if-none-match']===etag){res.writeHead(304).end();return;}
  }else if(ext==='.js'||ext==='.css'||ext==='.json'){
   res.setHeader('Cache-Control','public, max-age=0, must-revalidate');
   res.setHeader('ETag',etag);
   if(req.headers['if-none-match']===etag){res.writeHead(304).end();return;}
  }
  let entry=staticCache.get(file);
  if(!entry||entry.mtimeMs!==st.mtimeMs){
   const raw=readFileSync(file);
   entry={mtimeMs:st.mtimeMs,raw,gz:null,br:null};
   if(COMPRESSIBLE_EXTS.has(ext)&&raw.length>=1024){
    entry.gz=gzipSync(raw,{level:6});
    entry.br=brotliCompressSync(raw);
   }
   if(staticCache.size>400)staticCache.delete(staticCache.keys().next().value);
   staticCache.set(file,entry);
  }
  res.setHeader('Content-Type',mime[ext]||'application/octet-stream');
  const ae=String(req.headers['accept-encoding']||'');
  if(entry.br&&ae.includes('br')){res.setHeader('Content-Encoding','br');res.setHeader('Vary','Accept-Encoding');res.end(entry.br);return;}
  if(entry.gz&&ae.includes('gzip')){res.setHeader('Content-Encoding','gzip');res.setHeader('Vary','Accept-Encoding');res.end(entry.gz);return;}
  res.end(entry.raw);
 }catch(e){if(!res.headersSent){if(e.code==='ENOENT')res.writeHead(404).end('Not found');else json(res,503,{error:'Dịch vụ tạm thời không sẵn sàng.'});}else res.end();}
});
const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:{threshold:1024}});
function sendRaw(ws,raw){if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<1_000_000)ws.send(raw);}
function send(ws,m){if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<1_000_000)ws.send(JSON.stringify(m));}
function broadcastRoom(r){
 const state=snapshot(r),raw=JSON.stringify(state);
 for(const ws of wss.clients)if(ws.room===r)sendSnapshot(ws,state,raw);
}
function pushRoomChat(r,text,sender='',color='',sys=true){
 r.chat||=[];
 r.chat.push({id:randomUUID(),sender,name:sender,color,text:String(text).slice(0,160),sys,time:Date.now()});
 if(r.chat.length>50)r.chat.shift();
}
function syncRoomDb(r){store.saveRoom(r).catch(()=>{});}
server.on('upgrade',(req,socket,head)=>{(async()=>{if(!sameOrigin(req)){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}const session=await auth.findSession(req);if(!session){socket.end('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req,session));})().catch(()=>socket.destroy());});
wss.on('connection',(ws,req,session)=>{
 ws.session=session;
 ws.id=randomUUID();ws.count=0;ws.buyAt=0;ws.purchases=new Set();
 ws.on('message',async raw=>{try{
  if(Date.now()>=ws.session.expiresAt){ws.close(4001,'Phiên đăng nhập đã hết hạn');return;}
  if(++ws.count>80)return;
  const m=JSON.parse(raw);if(!m||typeof m!=='object')return;
  if(m.type==='ping'){
   const now=Date.now();if(Number.isSafeInteger(m.id)&&m.id>0&&now-(ws.pingAt??0)>=1500){ws.pingAt=now;send(ws,{type:'pong',id:m.id,serverTickMs:Math.round(serverTickMs*10)/10,serverLoopMs:Math.round(serverLoopMs)});}return;
  }
  if(m.type==='join'&&!ws.room){
   if(ws.joining)return;ws.joining=true;let fullProfile;try{fullProfile=await store.getFullProfile(ws.session.user.id);}finally{ws.joining=false;}
   if(ws.readyState!==WebSocket.OPEN||ws.room)return;
   if(m.replaceSession){
    for(const other of wss.clients){
     if(other!==ws&&other.session?.user.id===ws.session.user.id&&other.room){
      const or=other.room;or.players=or.players.filter(p=>p.id!==other.id);other.room=null;
      syncRoomDb(or);
     }
    }
   }else if([...wss.clients].some(other=>other!==ws&&other.session?.user.id===ws.session.user.id&&other.room)){
    send(ws,{error:'Tài khoản này đang tham gia một phòng khác.'});return;
   }
   const requested=String(m.code||'').trim().toUpperCase();
   if(requested&&!/^[A-F0-9]{6}$/.test(requested)){send(ws,{error:'Mã phòng gồm 6 ký tự.'});return;}
   let r=requested?rooms.get(requested):null;
   if(requested&&!r){
    const saved=await store.getRoom(requested);
    if(saved&&saved.phase==='lobby'){
     r=createRoom(saved.code,saved.difficulty||'normal');
     r.stage=Math.max(1,Math.min(10,Number(saved.stage)||1));
     r.lockedSlots=saved.lockedSlots||{};
     pushRoomChat(r,`Chào mừng đến phòng #${saved.code} · Ấn Thành – Giữ thành.`);
     rooms.set(saved.code,r);
    }else{
     send(ws,{error:'Không tìm thấy phòng.'});return;
    }
   }
   if(!r&&rooms.size>=100){send(ws,{error:'Server đang đầy, hãy thử lại sau.'});return;}
   if(!r){
    let code;do{code=randomBytes(3).toString('hex').toUpperCase();}while(rooms.has(code));
    r=createRoom(code,m.difficulty);
    if(m.stage)r.stage=Math.max(1,Math.min(10,Number(m.stage)||1));
    pushRoomChat(r,`Chào mừng đến phòng #${code} · Ấn Thành – Giữ thành.`);
    rooms.set(code,r);
   }
   const lockedCount=Object.values(r.lockedSlots||{}).filter(Boolean).length;
   const maxAllowed=Math.max(1,4-lockedCount);
   if(r.players.length>=maxAllowed||r.phase!=='lobby'){send(ws,{error:'Phòng đã đầy hoặc đang chơi.'});return;}
   const p=addPlayer(r,{id:ws.id,name:m.name||fullProfile?.displayName||ws.session.user.displayName,hero:m.hero||fullProfile?.hero,assetsReady:m.waitForAssets!==true});
   p.accountId=ws.session.user.id;
   p.username=ws.session.user.username;
   p.accountLevel=fullProfile?.level||1;
   p.title=fullProfile?.title||'Người Giữ Cổng';
   p.locked=!!m.locked;
   ws.room=r;saveProgress(p);syncRoomDb(r);
   if(m.lobbyOnly)pushRoomChat(r,`${p.name} đã vào phòng chờ.`);
   send(ws,{type:'joined',id:ws.id,playerId:ws.id,code:r.code,stage:r.stage,assetHeroes:r.launching||r.phase!=='lobby'||(!requested&&m.solo===true)?r.players.map(p=>p.hero):null});
   if((!requested&&m.solo===true&&!m.lobbyOnly)||r.launching){r.autoStart=true;start(r);syncRoomDb(r);}
   broadcastRoom(r);
  }
  const r=ws.room,p=r?.players.find(p=>p.id===ws.id);if(!p)return;
  if(m.type==='ready'){p.assetsReady=true;if(r.autoStart||r.launching){start(r);syncRoomDb(r);}broadcastRoom(r);}
  if(m.type==='input')p.input={aimDistance:Number.isFinite(m.aimDistance)?Math.max(0,Math.min(2000,m.aimDistance)):undefined,aimX:Number.isFinite(m.aimX)?Math.max(-1,Math.min(1,m.aimX)):p.face||1,aimY:Number.isFinite(m.aimY)?Math.max(-1,Math.min(1,m.aimY)):0,x:Number.isFinite(m.x)?Math.max(-1,Math.min(1,m.x)):0,y:Number.isFinite(m.y)?Math.max(-1,Math.min(1,m.y)):0,attack:!!m.attack,guard:!!m.guard,skill:!!m.skill,q:!!m.q,e:!!m.e,r:!!m.r};
  if(m.type==='start'&&r.players[0]===p){start(r);syncRoomDb(r);broadcastRoom(r);}
  if(m.type==='hero'&&r.phase==='lobby'&&HEROES.some(h=>h.id===m.hero)){
   if(p.locked){send(ws,{error:'Hãy mở khóa anh hùng trước khi đổi tướng.'});return;}
   if(p.gem){send(ws,{error:'Bán ngọc trước khi đổi hero.'});return;}
   if(Object.keys(p.skills).length>1||Object.values(p.skills).some(rank=>rank>1)||p.mastery>0){send(ws,{error:'Đã học kỹ năng, không thể đổi hero trong phòng này.'});return;}
   p.hero=m.hero;initializeSkills(p,HEROES.find(h=>h.id===m.hero).classId);p.hp=stats(p).hp;saveProgress(p);syncRoomDb(r);broadcastRoom(r);
  }
  if(m.type==='lock-hero'&&r.phase==='lobby'){
   p.locked=typeof m.locked==='boolean'?m.locked:!p.locked;
   const hName=HEROES.find(h=>h.id===p.hero)?.name||p.hero;
   pushRoomChat(r,p.locked?`${p.name} đã khóa anh hùng: ${hName}.`:`${p.name} đang chọn lại anh hùng.`);
   syncRoomDb(r);broadcastRoom(r);
  }
  if(m.type==='room-config'&&r.phase==='lobby'&&r.players[0]===p){
   if(m.stage){
    r.stage=Math.max(1,Math.min(10,Number(m.stage)||1));
    const b=MAPS[r.stage-1].base;
    r.players.forEach((pl,i)=>{pl.x=b.x-45+i*30;pl.y=b.y+140;});
    pushRoomChat(r,`Chủ phòng đã chọn bản đồ: Mốc ${String(r.stage).padStart(2,'0')} · ${MAPS[r.stage-1].name}.`);
   }
   if(m.difficulty&&['easy','normal','insane'].includes(m.difficulty)){
    r.difficulty=m.difficulty;
    const dName={easy:'Dễ',normal:'Thường',insane:'Điên Cuồng'}[m.difficulty];
    pushRoomChat(r,`Chủ phòng đã đổi độ khó sang: ${dName}.`);
   }
   if(Number.isInteger(m.toggleSlot)&&m.toggleSlot>=1&&m.toggleSlot<=4){
    r.lockedSlots||={};
    r.lockedSlots[m.toggleSlot]=!r.lockedSlots[m.toggleSlot];
   }
   syncRoomDb(r);broadcastRoom(r);
  }
  if(m.type==='chat'&&typeof m.text==='string'){
   const text=m.text.trim().slice(0,140);
   if(text){pushRoomChat(r,text,p.name,p.hero,false);if(r.phase==='lobby')broadcastRoom(r);}
  }
  if(m.type==='kick'&&r.phase==='lobby'&&r.players[0]===p&&m.targetId&&m.targetId!==p.id){
   const victim=r.players.find(pl=>pl.id===m.targetId);
   if(victim){
    r.players=r.players.filter(pl=>pl.id!==m.targetId);
    pushRoomChat(r,`${victim.name} đã được mời rời phòng.`);
    for(const client of wss.clients)if(client.id===m.targetId){client.room=null;send(client,{type:'kicked'});}
    syncRoomDb(r);broadcastRoom(r);
   }
  }
  if(m.type==='promote'&&r.phase==='lobby'&&r.players[0]===p&&m.targetId&&m.targetId!==p.id){
   const idx=r.players.findIndex(pl=>pl.id===m.targetId);
   if(idx>0){
    const [promoted]=r.players.splice(idx,1);
    r.players.unshift(promoted);
    pushRoomChat(r,`${promoted.name} đã trở thành Chủ phòng.`);
    syncRoomDb(r);broadcastRoom(r);
   }
  }
  if(m.type==='lobby-start'&&r.phase==='lobby'&&r.players[0]===p){
   if(r.players.some(pl=>!pl.locked)){send(ws,{error:'Cần tất cả thành viên khóa anh hùng trước khi bắt đầu.'});return;}
   r.launching=true;
   r.keepUntil=Date.now()+20000;
   pushRoomChat(r,'Cả đội đã sẵn sàng! Đang tiến vào chiến trường...');
   syncRoomDb(r);broadcastRoom(r);
  }
  if(m.type==='next'&&r.players[0]===p){nextStage(r);syncRoomDb(r);broadcastRoom(r);}
  if(m.type==='use-item'){const error=useConsumable(r,p,m.item,stats);if(error)send(ws,{error});}
  if(m.type==='buy'&&Date.now()-ws.buyAt>200){if(m.requestId&&ws.purchases.has(m.requestId))return;if(m.requestId){ws.purchases.add(m.requestId);if(ws.purchases.size>256)ws.purchases.delete(ws.purchases.values().next().value);}ws.buyAt=Date.now();const error=buy(r,p,m.choice);if(error)send(ws,{error});}
 }catch{send(ws,{error:'Yêu cầu không hợp lệ.'});}});
 ws.on('close',()=>{
  const r=ws.room;if(!r)return;
  const p=r.players.find(p=>p.id===ws.id);
  if(p){
   saveProgress(p);
   if(r.phase==='lobby'&&!r.launching)pushRoomChat(r,`${p.name} đã rời phòng chờ.`);
  }
  r.players=r.players.filter(p=>p.id!==ws.id);
  r.troops=r.troops.filter(t=>t.owner!==ws.id);
  if(!r.players.length&&!(r.launching&&Date.now()<(r.keepUntil||0))){
   rooms.delete(r.code);
   store.deleteRoom(r.code).catch(()=>{});
  }else{
   syncRoomDb(r);
   if(r.phase==='lobby')broadcastRoom(r);
  }
 });
});
setInterval(()=>{
 const now=Date.now();
 for(const ws of wss.clients){ws.count=0;if(now>=ws.session.expiresAt)ws.close(4001,'Phiên đăng nhập đã hết hạn');}
 for(const [code,r]of rooms)if(!r.players.length&&now>=(r.keepUntil||0)){rooms.delete(code);store.deleteRoom(code).catch(()=>{});}
},1000).unref();
const fixedStepper=createFixedStepper({now:performance.now()});
function gameLoop(){
 const started=performance.now();
 const steps=fixedStepper.advance(started,(dt,index)=>advanceRooms(rooms,dt,index,{tick,record}));
 if(steps)for(const r of rooms.values())if(r.phase!=='lobby')broadcastRoom(r);
 serverTickMs=performance.now()-started;
 setTimeout(gameLoop,fixedStepper.delay(performance.now()));
}
setTimeout(gameLoop,50);
setInterval(()=>{for(const r of rooms.values())for(const p of r.players)saveProgress(p);},15000).unref();
server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log(`Ẩn Thành · ${store.backend}: http://localhost:${Number(process.env.PORT)||3000}`));
