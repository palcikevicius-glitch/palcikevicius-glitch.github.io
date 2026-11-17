import test from 'node:test';import assert from 'node:assert/strict';
import {freshSave,newRun,spawn,step,applyPowerup,attack,recordDamage,weaponStats,spawnGroup,claimRun} from '../dist/core.js';
import {ProfileBook,PROFILE_KEY,playTime} from '../dist/profiles.js';import {SaveStore,SAVE_KEY,encodeSave,decodeSave,SAVE_FORMAT} from '../dist/storage.js';
import {mapBounds,insideWorld} from '../dist/world-geometry.js';import {startArena,bossDefeated} from '../dist/encounters.js';import {MAPS} from '../dist/catalog.js';
class Memory{constructor(){this.map=new Map();this.fail=null;}getItem(k){return this.map.get(k)??null;}setItem(k,v){if(k===this.fail)throw Error('Quota');this.map.set(k,v);}}
const boot=m=>{const store=new SaveStore(m),loaded=store.load(),book=new ProfileBook(m,store,loaded);return {store,loaded,book};};
const quiet=()=>{const s=freshSave(),r=newRun('village','iron_bell',s);Object.assign(r,{worldClock:999,spawnClock:999,nextBoss:99999,nextMini:99999,nextGroup:99999,nextCrate:99999,props:[{id:'far',kind:'rock',x:900,y:900,radius:10}]});r.weapons[0].timer=999;return {s,r};};
const mob=(r,x,hp=1000)=>Object.assign(spawn(r),{x,y:0,hp,maxHp:hp,speed:0});
const advance=(r,n)=>{for(let i=0;i<n;i++){r.levelPending=0;step(r,{x:0,y:0},.05);}};
test('V018 new game keeps the old hero, unfinished journey and independent play times through repeated loads',()=>{
 const m=new Memory(),a=boot(m),p=a.loaded.profile;p.gold=731;p.shards=41;p.heroLevel=8;p.characters.push('mira');p.selectedCharacter='mira';p.playedSeconds=7530;const r=newRun('village','iron_bell',p);r.time=120;r.xp=4;const originalId=p.slotId;
 const second=a.book.create(p,r);assert.equal(second.profile.gold,0);assert.equal(second.profile.heroLevel,1);assert.deepEqual(second.profile.characters,['rasa']);assert.equal(second.profile.playedSeconds,0);second.profile.gold=99;second.profile.playedSeconds=91;
 const old=a.book.load(originalId,second.profile,null);assert.equal(old.profile.gold,731);assert.equal(old.profile.shards,41);assert.equal(old.profile.selectedCharacter,'mira');assert.equal(old.profile.playedSeconds,7530);assert.equal(old.run.time,120);assert.equal(old.run.xp,4);
 const newAgain=a.book.load(second.profile.slotId,old.profile,old.run);assert.equal(newAgain.profile.gold,99);assert.equal(newAgain.profile.playedSeconds,91);assert.equal(a.book.list().length,2);const reloaded=boot(m);assert.equal(reloaded.loaded.profile.slotId,second.profile.slotId);assert.equal(reloaded.book.list().length,2);assert.equal(playTime(7530),'02h 05min');
});
test('V018 an actual legacy format8 hero migrates once without losing earned progress or making duplicate slots',()=>{
 const m=new Memory(),{s,r}=quiet();s.gold=4321;s.best=700;r.time=120;const old=JSON.parse(encodeSave(s,r));old.version=8;m.setItem(SAVE_KEY,JSON.stringify(old));const a=boot(m);assert.equal(a.loaded.profile.gold,4321);assert.equal(a.loaded.run.time,120);assert.equal(a.loaded.profile.playedSeconds,700);assert.equal(a.loaded.profile.playTimeEstimated,true);assert.equal(a.book.list().length,1);assert.equal(boot(m).book.list().length,1);assert.equal(JSON.parse(m.getItem(SAVE_KEY)).version,SAVE_FORMAT);
});
test('V018 quota failures during hero switching preserve the current primary and recoverable hero snapshots',()=>{
 const m=new Memory(),a=boot(m),first=a.loaded.profile;first.gold=987;const second=a.book.create(first,null);const primary=m.getItem(SAVE_KEY);m.fail=SAVE_KEY;assert.throws(()=>a.book.load(first.slotId,second.profile,null));assert.equal(m.getItem(SAVE_KEY),primary);m.fail=null;const reload=boot(m);assert.equal(reload.loaded.profile.slotId,second.profile.slotId);assert.equal(reload.book.list().find(s=>s.id===first.slotId).profile.gold,987);
 m.fail=PROFILE_KEY;const raw=m.getItem(SAVE_KEY);assert.throws(()=>reload.book.create(reload.loaded.profile,null));assert.equal(m.getItem(SAVE_KEY),raw);
});
test('V018 stale tabs cannot overwrite another hero selection or library; corrupt libraries are protected',()=>{
 const m=new Memory(),b=boot(m),a=boot(m);a.book.create(a.loaded.profile,null);assert.throws(()=>b.book.save(b.loaded.profile,null),/another tab/);const primary=m.getItem(SAVE_KEY);m.setItem(PROFILE_KEY,'broken');m.map.delete(PROFILE_KEY+'.backup');const damaged=boot(m);assert.equal(damaged.book.blocked,true);assert.equal(m.getItem(SAVE_KEY),primary);
});
test('V018 recovering a damaged hero library cannot overwrite its only good backup on quota failure',()=>{const m=new Memory(),a=boot(m);a.book.create(a.loaded.profile,null);const backup=m.getItem(PROFILE_KEY+'.backup');m.setItem(PROFILE_KEY,'broken');m.fail=PROFILE_KEY;const recovered=boot(m);assert.equal(recovered.book.blocked,true);assert.equal(m.getItem(PROFILE_KEY+'.backup'),backup);m.fail=null;const retry=boot(m);assert.equal(retry.book.blocked,false);assert.ok(retry.book.list().length>=1);});
test('V018 a future hero library is protected rather than replaced by an older backup',()=>{const m=new Memory(),a=boot(m),raw=JSON.stringify({version:2,slots:[]});m.setItem(PROFILE_KEY+'.backup',m.getItem(PROFILE_KEY));m.setItem(PROFILE_KEY,raw);const next=boot(m);assert.equal(next.book.blocked,true);assert.equal(m.getItem(PROFILE_KEY),raw);});
test('V018 bomb damage waits for the visible front, hits each victim once and survives a reload mid-wave',()=>{
 const {s,r}=quiet(),near=mob(r,80,1000),far=mob(r,480,1000);applyPowerup(r,'fireblast');assert.equal(near.hp,1000);assert.equal(far.hp,1000);advance(r,5);assert.ok(near.hp<1000);assert.equal(far.hp,1000);const out=decodeSave(encodeSave(s,r)).run;const nearHp=out.enemies.find(e=>e.id===near.id).hp;advance(out,21);assert.ok(out.enemies.find(e=>e.id===far.id).hp<1000);assert.ok(nearHp-out.enemies.find(e=>e.id===near.id).hp<12);assert.equal(out.blasts.length,0);
});
test('V018 real bomb pickup keeps distant enemies alive until contact and leaves gold and gems at the reached front',()=>{
 const {r}=quiet();mob(r,150,1);mob(r,490,1);r.powerups=[{kind:'fireblast',x:0,y:0,life:90}];advance(r,1);assert.equal(r.kills,0);advance(r,7);assert.equal(r.kills,1);assert.equal(r.gold,1);advance(r,18);assert.equal(r.kills,2);assert.equal(r.gold,2);assert.ok(r.gems.length>=1);
});
test('V018 damage counters use actual enemy HP, distinguish weapons/ritual/bomb and include attributed burning',()=>{
 const {s,r}=quiet(),e=mob(r,80,7);attack(r,{id:'iron_bell',level:1,rank:0});assert.equal(r.damageLog.weapons.iron_bell,7);assert.equal(r.damageLog.ritual,0);const ritual=mob(r,300,40);recordDamage(r,ritual,100,{ritual:true});assert.equal(r.damageLog.ritual,40);recordDamage(r,{kind:'crate',hp:30},30,{id:'iron_bell'});assert.equal(r.damageLog.weapons.iron_bell,7);
 const burning=mob(r,60,100);r.enemies=[burning];r.angle=0;attack(r,{id:'thorn_lantern',level:1,rank:0});const before=r.damageLog.weapons.thorn_lantern;advance(r,2);assert.ok(r.damageLog.weapons.thorn_lantern>before);const clone=decodeSave(encodeSave(s,r));assert.deepEqual(clone.run.damageLog,r.damageLog);
});
test('V018 bread drops are valid saved pickups, heal by 30 without exceeding max HP, and grant no XP',()=>{
 const {s,r}=quiet();r.hp=40;r.powerups=[{kind:'bread',x:0,y:0,life:90}];assert.doesNotThrow(()=>decodeSave(encodeSave(s,r)));advance(r,1);assert.equal(r.hp,70);assert.equal(r.xp,0);applyPowerup(r,'bread');assert.equal(r.hp,100);applyPowerup(r,'bread');assert.equal(r.hp,100);
});
test('V018 boss arena admits no new normal or guardian spawns and excludes outside enemies while keeping intruders',()=>{
 const {s,r}=quiet(),intruder=mob(r,100,10000),outside=mob(r,650,10000);const boss=spawn(r,true);boss.hp=boss.maxHp=1e6;r.hp=r.maxHp=1e7;assert.equal(intruder.arenaMember,true);assert.equal(outside.arenaMember,false);r.spawnClock=0;r.nextMini=0;r.nextGroup=0;const count=r.enemies.length;advance(r,120);assert.equal(r.enemies.length,count);assert.equal(spawn(r),null);assert.equal(spawn(r,false,false,true),null);assert.equal(spawnGroup(r),0);assert.ok(Math.hypot(outside.x-r.arena.x,outside.y-r.arena.y)>=r.arena.radius+outside.radius);assert.ok(r.enemies.includes(intruder));const out=decodeSave(encodeSave(s,r)).run;assert.equal(out.enemies.find(e=>e.id===outside.id).arenaMember,false);
 boss.hp=0;advance(r,1);r.chests=[];r.chestReward=null;advance(r,40);assert.equal(r.arena,null);assert.ok(r.enemies.some(e=>e.id!==intruder.id&&e.id!==outside.id));
});
test('V018 knockback is reduced 45% and Bellwood is smaller while legacy rewards remain reachable',()=>{
 const {r}=quiet();const d=weaponStats(r,{id:'iron_bell',level:1,rank:0});assert.ok(Math.abs(d.knock-36*.55)<1e-8);assert.equal(mapBounds('bellwood').maxX,700);const s=freshSave();s.clearedMaps=MAPS.map(m=>m.id);const old=newRun('bellwood','iron_bell',s);delete old.bellwoodSize;old.x=820;old.y=-700;old.gems=[{x:-800,y:800,value:80}];const loaded=decodeSave(encodeSave(s,old)).run;assert.equal(loaded.x,820);assert.equal(loaded.y,-700);assert.equal(loaded.gems[0].value,80);assert.ok(insideWorld(loaded,loaded.gems[0],20));
});
