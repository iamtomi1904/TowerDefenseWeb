import {parentPort,workerData} from 'node:worker_threads';import {createStorageDirect} from './storage.mjs';
const store=await createStorageDirect(workerData.root);const methods=Object.keys(store).filter(key=>typeof store[key]==='function');
parentPort.postMessage({ready:true,backend:store.backend,methods});let chain=Promise.resolve();
parentPort.on('message',m=>{chain=chain.then(async()=>{try{if(!methods.includes(m.method))throw Error('Unknown storage method');const result=await store[m.method](...m.args);parentPort.postMessage({id:m.id,result});}catch(e){parentPort.postMessage({id:m.id,error:{message:e.message,code:e.code}});}});});
