import test from 'node:test';import assert from 'node:assert/strict';
import {BASES,ARTIFACTS,RANKS,RANK_NAMES,RANK_COLORS,VERSION} from '../dist/catalog.js';
import {freshSave,newRun,step,spawn,spawnCrate,instantUpgrade,makeChoices,takeChoice,collisionMove,enemyTierRange,tierHealth,nextMiniTime,xpForLevel,heroXpForLevel,forgeCost,capacity,validateRun} from '../dist/core.js';
import {encodeSave,decodeSave} from '../dist/storage.js';
const quiet=()=>{const r=newRun('village','iron_bell',freshSave());r.spawnClock=9999;r.nextMini=9999;r.nextBoss=9999;r.worldClock=9999;r.props=[{id:'far',kind:'rock',x:1e6,y:1e6,radius:20}];r.weapons[0].timer=9999;return r;};
const seeded=()=>{let seed=19;return ()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);};

test('all 12 guardians and four regular bosses spawn at their exact schedules',()=>{
 const r=quiet();r.nextMini=75;r.nextBoss=300;r.hp=r.maxHp=1e6;const schedule=Array.from({length:4},(_,i)=>[75,150,225].map(t=>300*i+t)).flat();const events=[];
 for(const time of [...schedule,300,600,900,1200].sort((a,b)=>a-b)){r.time=time-.01;events.push(...step(r,{x:0,y:0},.01));r.arena=null;}
 assert.equal(events.filter(e=>e==='mini_boss').length,12);assert.equal(events.filter(e=>e==='boss').length,4);assert.equal(r.nextMini,1275);assert.equal(r.finalSpawned,true);assert.equal(r.over,false);
 assert.equal(nextMiniTime(75),150);assert.equal(nextMiniTime(225),375);assert.equal(nextMiniTime(300),375);
});

test('legacy instant upgrades respect level seven, then upgrade artifacts, then award supplies without new slots',()=>{
 const r=quiet();r.weapons[0].level=7;r.artifacts={root_sigil:5};const hp=r.maxHp;assert.equal(instantUpgrade(r).type,'artifact');assert.equal(r.artifacts.root_sigil,6);assert.equal(r.maxHp,hp+4);assert.equal(instantUpgrade(r).type,'supplies');assert.equal(r.gold,75);assert.equal(r.weapons[0].level,7);assert.equal(capacity(r),1);
});
test('supplies are limited by time, cannot be farmed by movement, never collide, and survive reload',()=>{
 const r=quiet();r.nextCrate=20;r.hp=1e6;for(let i=0;i<3600;i++){r.levelPending=0;step(r,{x:1,y:0},.05);}assert.equal(r.crateSerial,5);assert.ok(r.props.filter(p=>p.kind==='crate').length<=4);
 const q=quiet();for(let i=0;i<10;i++)spawnCrate(q,()=>.5);assert.equal(q.props.filter(p=>p.kind==='crate').length,4);const c=q.props.find(p=>p.kind==='crate');q.x=c.x-40;q.y=c.y;collisionMove(q,q,40,0,13);assert.equal(q.x,c.x);assert.equal(q.y,c.y);const restored=decodeSave(encodeSave(freshSave(),q)).run;assert.equal(restored.nextCrate,q.nextCrate);assert.equal(restored.crateSerial,4);assert.equal(restored.props.find(p=>p.id===c.id).life,c.life);
});
test('discovery offers rotate through every undiscovered family alongside upgrades and artifacts',()=>{
 const s=freshSave(),r=quiet(),rng=seeded(),offered=new Set();let upgrades=0;for(let i=0;i<140;i++){const choices=makeChoices(r,s,rng);assert.equal(choices.length,3);assert.equal(new Set(choices.map(c=>c.id)).size,3);assert.ok(choices.some(c=>c.type==='weapon'&&!s.collectedWeapons.includes(c.id)));assert.ok(choices.some(c=>c.type==='artifact'));for(const c of choices){if(c.type==='weapon')offered.add(c.id);if(c.type==='upgrade')upgrades++;}}assert.equal(offered.size,BASES.length-1);assert.ok(upgrades>=60);const loaded=decodeSave(encodeSave(s,r)).run;assert.deepEqual(loaded.choices,r.choices);assert.deepEqual(loaded.offerHistory,r.offerHistory);
});
test('six weapons and six artifacts can be filled but a seventh cannot be offered or taken',()=>{
 const s=freshSave(),r=quiet();for(const w of BASES.slice(1,6)){r.levelPending=1;r.choices=[{type:'weapon',id:w.id}];assert.equal(takeChoice(r,s,0),true);}assert.equal(capacity(r),6);r.levelPending=1;r.choices=[{type:'weapon',id:BASES[6].id}];assert.equal(takeChoice(r,s,0),false);for(const a of ARTIFACTS.slice(0,6)){r.levelPending=1;r.choices=[{type:'artifact',id:a.id}];assert.equal(takeChoice(r,s,0),true);}r.levelPending=1;r.choices=[{type:'artifact',id:ARTIFACTS[6].id}];assert.equal(takeChoice(r,s,0),false);for(let i=0;i<20;i++)assert.ok(makeChoices(r,s).every(c=>c.type!=='weapon'&&(c.type!=='artifact'||r.artifacts[c.id])));assert.doesNotThrow(()=>validateRun(r));assert.deepEqual(decodeSave(encodeSave(s,r)).run.weapons,r.weapons);
});
test('quadratic journey costs and unchanged hero/forge costs without altering earned ranks',()=>{
 for(let level=1;level<60;level++){assert.equal(xpForLevel(level),level===1?8:Math.ceil(8+2.2*level+.16*level*level));assert.equal(heroXpForLevel(level),240*level);}for(let rank=0;rank<7;rank++){assert.equal(forgeCost(rank).gold,[100,250,550,1100,2200,4400,8800][rank]*3);assert.equal(forgeCost(rank).shards,[0,1,3,6,12,24,48][rank]*2);}assert.deepEqual(RANKS,['D','C','B','A','S','SS','SSS','SSS+']);assert.equal(RANK_NAMES[0],'Common');assert.equal(RANK_NAMES[7],'Divine');assert.equal(new Set(RANK_COLORS).size,8);
});
test('actual V0.0.5 envelope migrates progress and a pending choice, while upgrading future schedules',()=>{
 const s=freshSave(),r=quiet();s.schema=2;s.lastSeenBuild=105;s.gold=4321;s.shards=52;s.heroLevel=9;s.heroXp=200;s.ranks.iron_bell=6;s.clearedMaps=['village'];s.settings.language='ru';r.schema=2;r.time=312;r.nextMini=540;r.xp=7;r.nextXp=41;r.weapons[0].level=4;r.levelPending=1;r.choices=[{type:'upgrade',id:'iron_bell'}];for(const key of ['nextCrate','crateSerial','choiceRoll','offerHistory','lastUpgrade'])delete r[key];const old=JSON.parse(encodeSave(s,r));old.version=3;const out=decodeSave(JSON.stringify(old));for(const key of ['gold','shards','heroLevel','heroXp','ranks','clearedMaps','settings'])assert.deepEqual(out.profile[key],s[key]);assert.equal(out.profile.schema,6);assert.equal(out.run.schema,6);assert.equal(out.run.nextMini,375);assert.equal(out.run.nextXp,41);assert.equal(out.run.xp,7);assert.deepEqual(out.run.choices,r.choices);assert.equal(takeChoice(out.run,out.profile,0),true);assert.equal(out.run.weapons[0].level,5);assert.equal(JSON.parse(encodeSave(out.profile,out.run )).version,9);assert.ok(VERSION.build>=115);
});

