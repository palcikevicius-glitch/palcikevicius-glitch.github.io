import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {validateRelease,isNewer,canApply,safeStoreUrl} from '../dist/update-model.js';
import {VERSION} from '../dist/catalog.js';
const source=fs.readFileSync(new URL('../dist/updates.js',import.meta.url),'utf8').replace(/^import .*?;import .*?;\s*/, '').replace('export class Updates','globalThis.Updates=class Updates');
function setup({native=false,run=null,saved=true,workerBuild=117}={}){
 const calls=[],events={};let update,applied=false,reloaded=false;
 const worker={state:'installed',postMessage(message,ports){if(message.type==='VERSION')queueMicrotask(()=>ports[0].owner.onmessage({data:{build:workerBuild}}));if(message.type==='APPLY')applied=true;}};
 const registration={waiting:worker,active:null,update:async()=>calls.push('download'),addEventListener(){}};
 const context={VERSION:{build:115},validateRelease,isNewer,canApply,safeStoreUrl,setTimeout,clearTimeout,Promise,Date,Error,queueMicrotask,MessageChannel:class{constructor(){this.port1={close(){}};this.port2={owner:this.port1};}},navigator:{userAgent:'test',serviceWorker:{register:async()=>registration,addEventListener:(name,fn)=>events[name]=fn}},location:{reload:()=>reloaded=true},fetch:async()=>({ok:true,json:async()=>({schema:1,version:'1.17',displayVersion:'0.1.6',build:117,channel:'direct'})})};
 if(native)context.WispboundNative={checkUpdate:()=>{calls.push('check');context.onNativeUpdate({state:'available'});},downloadUpdate:()=>{calls.push('download');context.onNativeUpdate({state:'ready',progress:100});},installUpdate:()=>calls.push('install')};
 vm.runInNewContext(source,context);update=new context.Updates({notify(){},getRun:()=>run,save:()=>{calls.push('save');return saved;}});
 return {update,calls,events,get applied(){return applied;},get reloaded(){return reloaded;},setRun(value){run=value;}};
}
test('V014 web client detects V016, downloads matching worker and applies only after saving',async()=>{
 const h=setup();await h.update.check();assert.equal(h.update.state,'available');await h.update.download();assert.equal(h.update.state,'ready');assert.equal(h.applied,false);h.update.apply();assert.equal(h.applied,true);assert.deepEqual(h.calls,['save','download','save']);h.events.controllerchange();assert.equal(h.reloaded,true);
});
test('native update bridge checks, downloads and requests installation after save checkpoints',async()=>{
 const h=setup({native:true});await h.update.check();assert.equal(h.update.state,'available');await h.update.download();assert.equal(h.update.state,'ready');h.update.apply();assert.deepEqual(h.calls,['check','save','download','save','install']);
});
test('active journey prevents downloading and also prevents applying an already staged update',async()=>{
 for(const native of [false,true]){const h=setup({native,run:{over:false}});await h.update.download();assert.equal(h.update.state,'active');assert.deepEqual(h.calls,[]);h.setRun(null);await h.update.check();await h.update.download();const before=h.calls.length;h.setRun({over:false});h.update.apply();assert.equal(h.update.state,'active');assert.equal(h.calls.length,before);assert.equal(h.applied,false);}
});
test('failed save prevents web and Android downloads or installation',async()=>{
 for(const native of [false,true]){const h=setup({native,saved:false});await h.update.download();assert.equal(h.update.state,'saveFailed');h.update.apply();assert.equal(h.update.state,'saveFailed');assert.deepEqual(h.calls,['save','save']);assert.equal(h.applied,false);}
});
test('V016 test release retains legacy update compatibility and stable save schema',()=>{
 assert.match(VERSION.name,/^0\.1\.\d+$/);assert.ok(VERSION.build>115);assert.equal(VERSION.save,6);assert.ok(isNewer(115,validateRelease({schema:1,version:'1.17',displayVersion:VERSION.name,build:VERSION.build,channel:'direct'})));
});
