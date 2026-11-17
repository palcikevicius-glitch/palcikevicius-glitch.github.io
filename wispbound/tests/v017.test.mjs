import test from 'node:test';import assert from 'node:assert/strict';
import {freshSave,newRun,spawn,step,attack,weaponStats,applyPowerup,openChest,capacity,ensureWorld} from '../dist/core.js';
import {WEAPONS,MAPS,ULTIMATES,weapon} from '../dist/catalog.js';
import {ACHIEVEMENTS,claimAchievement,readyAchievements,achievementReward} from '../dist/progression.js';
import {hurtPlayer,startArena} from '../dist/encounters.js';
import {insideWorld,millCenter} from '../dist/world-geometry.js';
import {encodeSave,decodeSave} from '../dist/storage.js';
import {SpatialGrid} from '../dist/spatial-grid.js';
const idle={x:0,y:0};
const quiet=(id='village')=>{const s=freshSave();s.clearedMaps=MAPS.map(m=>m.id);const r=newRun(id,'iron_bell',s);Object.assign(r,{nextBoss:1e6,nextMini:1e6,nextCrate:1e6,nextGroup:1e6,spawnClock:1e6,worldClock:1e6,props:[{id:'far',kind:'rock',x:999,y:999,radius:20}]});r.weapons[0].timer=1e6;return {s,r};};
const advance=(r,n)=>{for(let i=0;i<n;i++)step(r,idle,.05);};
const target=(r,x=90,y=0)=>{const e=spawn(r);Object.assign(e,{x,y,speed:0,hp:1e6,maxHp:1e6});return e;};
test('V017 spatial broad phase includes every actual close target, including negative cells and long sweeps',()=>{
 const items=Array.from({length:500},(_,i)=>({id:i,x:Math.sin(i*17)*1000,y:Math.cos(i*11)*1000})),grid=new SpatialGrid(items);
 for(let i=0;i<50;i++){const x=Math.cos(i)*700,y=Math.sin(i)*700,r=20+i*3,near=new Set(grid.near(x,y,r));for(const e of items)if(Math.abs(e.x-x)<=r&&Math.abs(e.y-y)<=r)assert.ok(near.has(e));}
});
test('V017 every one of 38 weapon forms deals finite damage with its real attack geometry',()=>{
 for(const d of WEAPONS){const {r}=quiet();r.weapons=[{id:d.id,level:7,rank:0,timer:1e6}];target(r,15,0);for(let i=0;i<24;i++)target(r,Math.cos(i*Math.PI/12)*(i%2?70:140),Math.sin(i*Math.PI/12)*(i%2?70:140));attack(r,r.weapons[0]);advance(r,90);assert.ok(r.enemies.some(e=>e.hp<e.maxHp),d.id);assert.ok(r.enemies.every(e=>Number.isFinite(e.hp)),d.id);}
});
test('V017 base missiles pierce only at final upgrade and basic ravens have no splash',()=>{
 const {r}=quiet();r.bonus.pierce=2;for(const id of ['amber_needle','ash_raven','moon_sickle'])for(const level of [1,3,6]){const d=weaponStats(r,{id,level,rank:0});assert.equal(d.pierce,1);assert.equal(d.splash,0);}assert.ok(weaponStats(r,{id:'amber_needle',level:7,rank:0}).pierce>1);assert.ok(weaponStats(r,{id:'ash_raven',level:7,rank:0}).splash>0);
});
test('V017 lantern aims at a nearby enemy even while the hero faces away',()=>{const {r}=quiet();r.angle=Math.PI;const e=target(r);attack(r,{id:'thorn_lantern',level:1,rank:0});assert.ok(e.hp<e.maxHp);});
test('V017 armor and ward still allow health damage, while dodge remains a separate mechanic',()=>{const {r}=quiet();r.bonus.armor=1e4;r.ward=1e4;const hp=r.hp;hurtPlayer(r,40,[],()=>1);assert.equal(hp-r.hp,8);assert.equal(r.journeyStats.damageTaken,8);});
test('V017 boss phases create aimed volleys, multiple marks, charges and expanding rings that damage',()=>{
 const {r}=quiet();const boss=spawn(r,true);boss.bossId='legacy';r.arena.phase='active';r.arena.age=2;boss.hp=boss.maxHp*.3;boss.attackClock=0;boss.pattern=0;advance(r,1);assert.equal(boss.phase,3);assert.ok(r.hazards.some(h=>h.kind==='circle'));boss.attackClock=0;advance(r,1);assert.ok(r.hazards.some(h=>h.charge));boss.attackClock=0;advance(r,1);assert.ok(r.hazards.some(h=>h.expanding));boss.attackClock=0;advance(r,1);assert.ok(r.hazards.filter(h=>h.kind==='bolt'&&!h.charge).length>=7);
 r.hazards=[{kind:'circle',x:r.x,y:r.y,radius:100,age:.9,delay:.8,life:.5,maxLife:.5,angle:0,speed:0,damage:40}];r.damageCooldown=0;const hp=r.hp;advance(r,1);assert.ok(r.hp<hp);assert.doesNotThrow(()=>decodeSave(encodeSave(freshSave(),r)));
});
test('V017 time stop lasts three combat seconds and prevents every enemy scheduler and hazard motion',()=>{
 const {r}=quiet();r.time=300;r.spawnClock=0;r.nextGroup=r.nextMini=r.nextBoss=0;applyPowerup(r,'time_stop');assert.equal(r.freezeTime,3);r.hazards=[{kind:'bolt',x:500,y:0,radius:10,age:1,delay:0,life:3,maxLife:3,angle:0,speed:100,damage:20}];advance(r,20);assert.equal(r.enemies.length,0);assert.equal(r.hazards[0].x,500);assert.ok(r.effects.some(e=>e.type==='time_blast')||r.freezeTime>0);advance(r,70);assert.ok(r.enemies.length>0);
});
test('V017 magnet gems visibly travel, preserve XP across save/reload and award half XP only on arrival',()=>{
 const {s,r}=quiet();r.nextXp=1e6;r.gems=[{x:850,y:0,value:10},{x:-880,y:0,value:6}];applyPowerup(r,'magnet');assert.equal(r.xp,0);advance(r,.3);assert.ok(r.gems[0].x<850&&r.gems[0].x>0);const restored=decodeSave(encodeSave(s,r)).run;advance(restored,100);assert.equal(restored.gems.length,0);assert.equal(restored.xp,8.8);advance(restored,30);assert.equal(restored.xp,8.8);
});
test('V017 bomb leaves gems and gives exactly one gold per enemy including elites',()=>{const {r}=quiet();const enemies=[target(r,180,0),target(r,230,0)];for(const e of enemies)e.hp=1;enemies[1].mini=true;applyPowerup(r,'fireblast');advance(r,11);assert.equal(r.gold,2);assert.equal(r.kills,2);assert.equal(r.gems.length,2);assert.ok(r.effects.some(e=>e.type==='fire_blast'));});
test('V017 walking onto an actual bomb pickup awards gems and gold before removing its victims',()=>{const {r}=quiet();for(let i=0;i<4;i++)target(r,180+i*30,0).hp=1;r.powerups=[{kind:'fireblast',x:0,y:0,life:90}];advance(r,15);assert.equal(r.kills,4);assert.equal(r.gold,4);assert.equal(r.gems.length,4);advance(r,1);assert.equal(r.kills,4);assert.equal(r.gold,4);});
test('V017 chest pickup is forgiving at 50 world units',()=>{const {r}=quiet();r.chests=[{id:20,x:50,y:0,kind:'mini',final:false,rewardCount:1}];advance(r,1);assert.ok(r.chestReward);});
test('V017 achievement shards and character rewards are once-only, including previously claimed gold',()=>{
 const {s}=quiet();s.stats.kills=500;s.achievementClaims=['kills_2'];s.gold=123;assert.ok(readyAchievements(s).some(a=>a.id==='kills_2'));assert.ok(claimAchievement(s,'kills_2'));assert.equal(s.gold,123);assert.ok(s.shards>0);assert.ok(s.characters.includes('mira'));assert.ok(s.collectedWeapons.includes('amber_needle'));const shards=s.shards;const out=decodeSave(encodeSave(s,null)).profile;assert.equal(claimAchievement(out,'kills_2'),false);assert.equal(out.shards,shards);for(const a of ACHIEVEMENTS)assert.ok(achievementReward(a).shards>=1);
});
test('V017 evolved fusion consumes both ingredients and frees exactly one equipment slot',()=>{for(const u of ULTIMATES){const {r}=quiet();r.time=901;r.catalysts=1;r.weapons=u.components.map(id=>({id,level:1,rank:0,timer:0}));assert.equal(capacity(r),2);r.chests=[{id:44,x:0,y:0,kind:'boss',final:false,rewardCount:1}];openChest(r,44,()=>0);assert.equal(r.weapons.length,1);assert.equal(r.weapons[0].id,u.id);assert.equal(capacity(r),1);assert.ok(u.components.every(id=>!r.weapons.some(w=>w.id===id)));}});
test('V017 enemies spawn outside actual portrait/landscape camera and remain inside winding mill',()=>{
 for(const id of MAPS.map(m=>m.id))for(const [hw,hh] of [[300,600],[800,450]]){const {r}=quiet(id);r.viewHalfWidth=hw;r.viewHalfHeight=hh;for(let i=0;i<32;i++){const e=spawn(r,false,false,i%4===0,()=>i/32);assert.ok(Math.abs(e.x-r.x)>hw+e.radius||Math.abs(e.y-r.y)>hh+e.radius,id);assert.ok(insideWorld(r,e,e.radius),id);}}
 const {r}=quiet('mill');assert.notEqual(millCenter(r,0),millCenter(r,800));assert.ok(insideWorld(r,{x:millCenter(r,800)+200,y:800}));assert.equal(insideWorld(r,{x:millCenter(r,800)+260,y:800}),false);
});
test('V017 landmark scenery is deterministic and survives storage',()=>{const {s,r}=quiet();r.seed=.118;for(let i=0;i<6;i++){r.x=i*400;ensureWorld(r);}assert.ok(r.props.some(p=>['house','well','ruin'].includes(p.kind)));assert.doesNotThrow(()=>decodeSave(encodeSave(s,r)));});
