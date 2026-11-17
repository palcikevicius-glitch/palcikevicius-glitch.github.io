import {VERSION} from './catalog.js';
import {freshSave,validateSave,validateRun,migrateProgress} from './core.js';

// Stable keys and origin are part of the save format: never include a release number.
export const SAVE_KEY='wispbound.save';
export const SAVE_FORMAT=9;
const checksum=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');};
export class FutureSaveError extends Error{}
export function decodeSave(raw){
 const data=JSON.parse(raw);
 if(!data||typeof data!=='object')throw Error('Invalid save file');
 if((data.version||0)>SAVE_FORMAT||(data.profile?.schema||0)>6||(data.run?.schema||0)>6)throw new FutureSaveError('This save needs a newer game');
 let payload=data;
 if(data.format==='wispbound'){
  if(![2,3,4,5,6,7,8,SAVE_FORMAT].includes(data.version)||!data.payload||checksum(JSON.stringify(data.payload))!==data.checksum)throw Error('Save checksum mismatch');
  payload=data.payload;
  if((payload.profile?.schema||0)>6||(payload.run?.schema||0)>6)throw new FutureSaveError('This save needs a newer game');
 }
 // V1.01/V1.02 exported {profile,run} directly. Their values, including the
 // unfinished run's next XP threshold and explicit language choice, stay intact.
 const {profile,run}=migrateProgress(payload.profile,payload.run);
 return {profile,run,revision:Number.isSafeInteger(payload.revision)?payload.revision:0};
}
export function encodeSave(profile,run,revision=0){
 validateSave(profile);if(run)validateRun(run);
 const payload={build:VERSION.build,savedAt:new Date().toISOString(),revision,profile,run};
 return JSON.stringify({format:'wispbound',version:SAVE_FORMAT,payload,checksum:checksum(JSON.stringify(payload))});
}
export class SaveStore{
 constructor(storage){this.storage=storage;this.expected=null;this.revision=0;this.blocked=false;this.recovered=false;}
 load(){
  let primary,hadBackup=false;
  try{primary=this.storage.getItem(SAVE_KEY);this.expected=primary;
   if(primary){try{const data=decodeSave(primary);this.revision=data.revision;return {...data,status:'ok'};}catch(e){if(e instanceof FutureSaveError)throw e;}}
   for(const suffix of ['.backup','.upgrade']){
    const raw=this.storage.getItem(SAVE_KEY+suffix);if(!raw)continue;hadBackup=true;
    try{const data=decodeSave(raw);this.revision=data.revision;this.recovered=true;return {...data,status:'recovered'};}catch(e){if(e instanceof FutureSaveError)throw e;}
   }
   if(primary||hadBackup)throw Error('No readable save');
   return {profile:freshSave(),run:null,status:'fresh'};
  }catch{this.blocked=true;return {profile:freshSave(),run:null,status:'blocked'};}
 }
 verifiedWrite(key,raw){this.storage.setItem(key,raw);if(this.storage.getItem(key)!==raw)throw Error('Save verification failed');}
 write(profile,run,{checkpoint=false,replace=false}={}){
  if(this.blocked&&!replace)throw Error('Existing save is protected');
  const raw=encodeSave(profile,run,this.revision+1),current=this.storage.getItem(SAVE_KEY);
  if(!replace&&current!==this.expected)throw Error('Progress changed in another tab. Reload this tab.');
  let validCurrent=null;
  if(current){try{decodeSave(current);validCurrent=current;}catch{this.verifiedWrite(SAVE_KEY+'.unreadable',current);}}
  // Write the fallback before changing the primary. A full disk cannot destroy
  // the only valid copy, and failed writes must stop an update from applying.
  this.verifiedWrite(SAVE_KEY+'.backup',validCurrent||raw);
  if(checkpoint)this.verifiedWrite(SAVE_KEY+'.upgrade',raw);
  this.verifiedWrite(SAVE_KEY,raw);
  this.expected=raw;this.revision++;this.blocked=false;this.recovered=false;
  return true;
 }
 export(profile,run){return this.blocked?this.expected:encodeSave(profile,run,this.revision);}
}
