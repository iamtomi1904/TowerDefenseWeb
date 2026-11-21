import test from 'node:test';import assert from 'node:assert/strict';import {createBattleSocket} from '../public/battle-socket.js';
test('client reconnects with same identity and forwards state through stable facade',()=>{
 const old={WebSocket:globalThis.WebSocket,window:globalThis.window,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};const sockets=[],timers=[];
 try{globalThis.WebSocket=class {constructor(){this.readyState=1;this.sent=[];sockets.push(this);}send(v){this.sent.push(JSON.parse(v));}close(){this.readyState=3;}};globalThis.window={addEventListener(){}};globalThis.setTimeout=fn=>{timers.push(fn);return timers.length;};globalThis.clearTimeout=()=>{};globalThis.setInterval=()=>1;globalThis.clearInterval=()=>{};
 const api=createBattleSocket('ws://test');let opens=0,received=0;api.onopen=()=>opens++;api.onmessage=()=>received++;sockets[0].onopen({});sockets[0].onmessage({data:JSON.stringify({type:'joined',id:'p',code:'ABC123'})});sockets[0].onclose({code:1006});timers.shift()();sockets[1].onopen({});assert.equal(opens,1);assert.deepEqual(sockets[1].sent[0],{type:'resume',id:'p',code:'ABC123'});sockets[1].onmessage({data:JSON.stringify({type:'state'})});assert.equal(received,2);api.send(JSON.stringify({type:'input'}));assert.equal(sockets[1].sent[1].type,'input');
 }finally{Object.assign(globalThis,old);}
});
test('idle lobby does not trigger snapshot watchdog; active battle still detects a stall',()=>{
 const old={WebSocket:globalThis.WebSocket,window:globalThis.window,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval};const dateNow=Date.now;let now=0,watchdog,socket;
 try{Date.now=()=>now;globalThis.WebSocket=class{constructor(){socket=this;this.readyState=1;this.closes=[];}send(){}close(code){this.closes.push(code);}};globalThis.window={addEventListener(){}};globalThis.setInterval=fn=>{watchdog=fn;return 1;};globalThis.clearInterval=()=>{};
 createBattleSocket('ws://test');socket.onopen({});socket.onmessage({data:JSON.stringify({type:'joined',id:'p',code:'ROOM'})});socket.onmessage({data:JSON.stringify({type:'state',phase:'lobby'})});now=60000;watchdog();assert.equal(socket.closes.length,0);
 socket.onmessage({data:JSON.stringify({type:'state',phase:'battle'})});now+=11000;watchdog();assert.deepEqual(socket.closes,[4000]);
 }finally{Object.assign(globalThis,old);Date.now=dateNow;}
});
