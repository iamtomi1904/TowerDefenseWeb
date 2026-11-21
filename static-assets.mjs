import {readFile} from 'node:fs/promises';import {gzip,brotliCompress,constants} from 'node:zlib';import {promisify} from 'node:util';
const gzipAsync=promisify(gzip),brotliAsync=promisify(brotliCompress);
export function createStaticAssetCache({maxBytes=64*1024*1024}={}){
 const cache=new Map(),pending=new Map();let bytes=0,active=0;const waiters=[];
 async function compressed(raw){if(active>=2)await new Promise(resolve=>waiters.push(resolve));else active++;try{return await Promise.all([gzipAsync(raw,{level:6}),brotliAsync(raw,{params:{[constants.BROTLI_PARAM_QUALITY]:4}})]);}finally{if(waiters.length)waiters.shift()();else active--;}}
 return {async get(file,mtimeMs,compress){
  const hit=cache.get(file);if(hit?.mtimeMs===mtimeMs)return hit;
  const id=file+':'+mtimeMs;if(pending.has(id))return pending.get(id);
  const job=(async()=>{const raw=await readFile(file);const [gz,br]=compress&&raw.length>=1024?await compressed(raw):[null,null];const entry={raw,gz,br,mtimeMs},size=raw.length+(gz?.length||0)+(br?.length||0);const old=cache.get(file);if(old){bytes-=old.size;cache.delete(file);}if(size<=maxBytes){while(bytes+size>maxBytes&&cache.size){const key=cache.keys().next().value;bytes-=cache.get(key).size;cache.delete(key);}entry.size=size;cache.set(file,entry);bytes+=size;}return entry;})();pending.set(id,job);try{return await job;}finally{pending.delete(id);}
 },get bytes(){return bytes;}};
}
