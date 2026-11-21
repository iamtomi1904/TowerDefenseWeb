import test from 'node:test';
import assert from 'node:assert/strict';
import {sendSnapshot} from '../snapshot-transport.mjs';
const socket=()=>({readyState:1,bufferedAmount:0,sent:[],callbacks:[],send(raw,options,done){this.sent.push(JSON.parse(raw));this.callbacks.push(done);},close(code){this.closed=code;}});
const state=(n,ids)=>({type:'state',n,events:ids.map(id=>({id}))});
test('slow sends coalesce state and retain every event exactly once',()=>{
 const ws=socket();sendSnapshot(ws,state(1,['a']));sendSnapshot(ws,state(2,['b']));sendSnapshot(ws,state(3,['b','c']));
 assert.equal(ws.sent.length,1);ws.callbacks.shift()();assert.equal(ws.sent[1].n,3);assert.deepEqual(ws.sent[1].events.map(e=>e.id),['b','c']);
});
test('buffered socket retains pending events when a newer state can finally send',()=>{
 const ws=socket();ws.bufferedAmount=40000;sendSnapshot(ws,state(1,['a']));ws.bufferedAmount=0;sendSnapshot(ws,state(2,['b']));assert.deepEqual(ws.sent[0].events.map(e=>e.id),['a','b']);
});
test('overload is explicit, closed sockets and send errors do not keep sending',()=>{
 const ws=socket();ws.snapshotSending=true;sendSnapshot(ws,state(1,Array.from({length:2048},(_,i)=>i)));sendSnapshot(ws,state(2,[2048]));assert.equal(ws.closed,1013);
 const other=socket();sendSnapshot(other,state(1,[]));sendSnapshot(other,state(2,[]));other.callbacks.shift()(new Error('closed'));assert.equal(other.pendingSnapshot,null);assert.equal(other.sent.length,1);
});
