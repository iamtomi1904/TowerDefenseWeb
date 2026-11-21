import {Worker} from 'node:worker_threads';
export async function createSQLiteWorker(root){
 const worker=new Worker(new URL('./storage-worker.mjs',import.meta.url),{workerData:{root}}),pending=new Map();let sequence=0,dead=false;
 const ready=new Promise((resolve,reject)=>{
 worker.on('message',m=>{if(m.ready){resolve(m);return;}const job=pending.get(m.id);if(!job)return;pending.delete(m.id);if(m.error){const error=new Error(m.error.message);error.code=m.error.code;job.reject(error);}else job.resolve(m.result);});
 const fail=error=>{dead=true;reject(error);for(const job of pending.values())job.reject(error);pending.clear();};worker.on('error',fail);worker.on('exit',code=>fail(new Error('SQLite worker stopped ('+code+')')));
 });
 const info=await ready;
 function call(method,args){if(dead)return Promise.reject(Error('SQLite worker unavailable'));return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});try{worker.postMessage({id,method,args});}catch(error){pending.delete(id);reject(error);}});}
 const store={backend:info.backend};for(const method of info.methods)store[method]=(...args)=>call(method,args);
 store.close=async()=>{if(dead)return;await call('close',[]);await worker.terminate();};return store;
}
