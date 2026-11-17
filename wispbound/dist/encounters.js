import {constrainToWorld} from './world-geometry.js';
import {weapon,artifactBonuses,RECIPES,ULTIMATES} from './catalog.js';

const TAU=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
import {stepRitual} from './rituals.js';
export {RITUALS,activateRitual,closedLoop} from './rituals.js';
export function encounterState(r,legacy=false){
 return {baseMaxHp:r.maxHp/(1+.08*(r.artifacts?.root_sigil||0)),arena:null,hazards:[],chests:[],chestReward:null,ritualActive:null,afterimageClock:0,victoryPending:false,journeyStats:{damageTaken:0,ritualKills:0,chests:0,noHitBosses:0,fastBosses:0,peakSlots:r.weapons.reduce((n,w)=>n+weapon(w.id).capacity,0),maxArtifacts:Object.keys(r.artifacts).length,eligible:!legacy}};
}
export function recordLoadout(r){if(!r.journeyStats)return;r.journeyStats.peakSlots=Math.max(r.journeyStats.peakSlots,r.weapons.reduce((n,w)=>n+weapon(w.id).capacity,0));r.journeyStats.maxArtifacts=Math.max(r.journeyStats.maxArtifacts,Object.keys(r.artifacts).length);}
export function gainArtifact(r,id){r.artifacts[id]=(r.artifacts[id]||0)+1;if(id==='root_sigil'){const extra=(r.baseMaxHp||r.maxHp)*.04;r.maxHp+=extra;r.hp=Math.min(r.maxHp,r.hp+extra);}recordLoadout(r);}
export function startArena(r,e){
 const radius=r.mapId==='mill'?210:330;r.arena=constrainToWorld(r,{x:r.x,y:r.y,radius,phase:'opening',age:0,timer:1.2,bossId:e.id},radius+20);
 e.spawnedAt=r.time;e.damageAtSpawn=r.journeyStats.damageTaken;e.attackClock=1.8;e.pattern=0;
 e.x=r.x+(e.x-r.x)*.8;e.y=r.y+(e.y-r.y)*.8;
 for(const n of r.enemies)if(!n.boss)n.arenaMember=dist(n,r.arena)<radius-n.radius;
}
export function bossDefeated(r,e){
 for(const n of r.enemies)delete n.arenaMember;
 if(r.arena){r.arena.phase='closing';r.arena.age=0;r.arena.timer=1.2;}r.hazards=[];
 if(Number.isFinite(e.damageAtSpawn)&&r.journeyStats.damageTaken===e.damageAtSpawn)r.journeyStats.noHitBosses++;
 if(Number.isFinite(e.spawnedAt)&&r.time-e.spawnedAt<=30)r.journeyStats.fastBosses++;
 r.chests.push({id:r.entityId++,kind:'boss',x:e.x,y:e.y,final:!!e.final});
 if(e.final){r.victoryPending=true;r.powerups=[];r.enemies.forEach(n=>{if(n!==e)n.retired=true;});}
}
export function hurtPlayer(r,raw,events,rng=Math.random){
 if(r.damageCooldown>0||r.hp<=0)return;
 if(r.bonus.dodge&&rng()<r.bonus.dodge){r.damageCooldown=.25;events.push('dodge');return;}
 const damage=Math.max(raw*.3,raw-(r.bonus.armor||0)-artifactBonuses(r).armor),absorbed=Math.min(r.ward||0,Math.max(0,damage-raw*.2));
 r.ward=Math.max(0,(r.ward||0)-absorbed);r.hp-=damage-absorbed;r.journeyStats.damageTaken+=damage-absorbed;r.lastHurt=r.time;r.damageCooldown=.65+(r.bonus.invuln||0);events.push('hurt');
}
export const chestCount=roll=>roll<.8?1:roll<.97?3:5;
export function eligibleEvolutions(r){
 const normal=RECIPES.filter(p=>r.weapons.some(w=>w.id===p.baseId&&w.level>=7)&&(r.artifacts[p.artifactId]||0)>=6);
 const ultimate=r.time>=900&&r.catalysts>0&&!r.weapons.some(w=>weapon(w.id).stage==='ultimate')?ULTIMATES.filter(p=>p.components.every(id=>r.weapons.some(w=>w.id===id))):[];
 return [...ultimate,...normal];
}
export function openChest(r,id,heal,rng=Math.random){
 const chest=r.chests.find(c=>c.id===id);if(!chest||r.chestReward)return false;
 // Eligibility is captured before any ordinary reward. One roll per chest, never per reel.
 const eligible=eligibleEvolutions(r),count=chest.rewardCount||chestCount(rng()),rewards=[],used=new Set();
 if(eligible.length&&rng()<.7){const p=eligible[Math.min(eligible.length-1,Math.floor(rng()*eligible.length))];
  if(p.components){const parts=r.weapons.filter(w=>p.components.includes(w.id));r.weapons=r.weapons.filter(w=>!p.components.includes(w.id));r.weapons.push({id:p.id,level:1,rank:Math.min(...parts.map(w=>w.rank)),timer:0});r.catalysts--;}
  else{const w=r.weapons.find(w=>w.id===p.baseId);w.id=p.id;w.level=1;w.timer=0;}
  rewards.push({type:'evolution',id:p.id});used.add(p.id);r.pendingDiscoveries||=[];if(!r.pendingDiscoveries.includes(p.id))r.pendingDiscoveries.push(p.id);
 }
 for(let i=rewards.length;i<count;i++){
  // Ordinary upgrades remain the priority until every owned base and artifact is mastered.
  let pool=[...r.weapons.filter(w=>weapon(w.id).stage==='base'&&w.level<7).map(w=>({type:'weapon',id:w.id})),...Object.keys(r.artifacts).filter(id=>r.artifacts[id]<6).map(id=>({type:'artifact',id}))];
  if(!pool.length)pool=r.weapons.filter(w=>weapon(w.id).stage!=='base'&&(w.resonance||0)<3).map(w=>({type:'resonance',id:w.id}));
  const unique=pool.filter(x=>!used.has(x.id));if(unique.length)pool=unique;
  if(pool.length){const pick=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];used.add(pick.id);
   if(pick.type==='artifact'){pick.from=r.artifacts[pick.id];gainArtifact(r,pick.id);pick.to=r.artifacts[pick.id];}
   else{const w=r.weapons.find(w=>w.id===pick.id),key=pick.type==='resonance'?'resonance':'level';pick.from=w[key]||0;w[key]=pick.from+1;pick.to=w[key];w.timer=0;}rewards.push(pick);
  }else{r.gold+=100;r.shards++;heal(r,20);rewards.push({type:'supplies',gold:100,shards:1,health:20});}
 }
 const bonus=r.bonus.treasure?{gold:150,shards:1}:null;if(bonus){r.gold+=150;r.shards++;}
 r.chests=r.chests.filter(c=>c.id!==id);r.journeyStats.chests++;r.chestReward={id,final:chest.final,kind:chest.kind||'boss',rewards,bonus,revealed:false};return true;
}
export function acknowledgeChest(r){if(!r.chestReward)return false;const final=r.chestReward.final;r.chestReward=null;if(final){r.won=true;r.over=true;r.victoryPending=false;}return true;}
export function stepEncounters(r,dt,input,events,api){
 const a=r.arena;if(a){for(const enemy of r.enemies)if(!enemy.boss&&enemy.arenaMember===undefined)enemy.arenaMember=dist(enemy,a)<a.radius-enemy.radius;a.age+=dt;a.timer=Math.max(0,a.timer-dt);if(a.phase==='opening'&&a.age>=1.2)a.phase='active';if(a.phase==='closing'&&a.age>=1.2)r.arena=null;else if(a.phase!=='closing'){for(const actor of [r,...r.enemies.filter(e=>e.boss)]){const d=dist(actor,a),limit=a.radius-(actor===r?18:35);if(d>limit){actor.x=a.x+(actor.x-a.x)/d*limit;actor.y=a.y+(actor.y-a.y)/d*limit;}}}}
 for(const e of r.enemies){
  if(!e.boss||e.hp<=0||!r.arena||r.arena.phase!=='active'||r.freezeTime>0)continue;
  const phase=e.hp/e.maxHp<.35?3:e.hp/e.maxHp<.7?2:1;e.phase=phase;e.speed=84+phase*9;e.attackClock=(e.attackClock??1)-dt;if(e.attackClock>0)continue;
  e.attackClock=3.5-phase*.45;e.pattern=(e.pattern||0)+1;
  const damage=29+phase*6+Math.floor(r.time/300)*2,aim=Math.atan2(r.y-e.y,r.x-e.x),make=(kind,x,y,radius,extra={})=>r.hazards.push({kind,x,y,radius,age:0,delay:.8,life:.6,maxLife:.6,angle:0,speed:220,damage,hit:false,...extra});
  const pattern=(e.pattern+['village','quarry','mill','marsh','bellwood'].indexOf(r.mapId))%4;
  if(pattern===0){for(let i=-phase;i<=phase;i++)make('bolt',e.x,e.y,12,{angle:aim+i*.2,life:3,maxLife:3,delay:.65});}
  else if(pattern===1){make('circle',r.x,r.y,68+phase*8,{delay:.9});if(phase>1)for(const sign of [-1,1])make('circle',r.x+Math.cos(r.angle+Math.PI/2)*sign*115,r.y+Math.sin(r.angle+Math.PI/2)*sign*115,60,{delay:1.15});}
  else if(pattern===2)make('bolt',e.x,e.y,32,{angle:aim,speed:345+phase*25,life:.7,maxLife:.7,delay:.85,charge:true,owner:e.id,damage:damage+10});
  else make('ring',e.x,e.y,55,{expanding:true,speed:145+phase*25,life:1.7,maxLife:1.7,delay:.75,damage:damage+4});
 }
 if(r.freezeTime<=0)for(const h of r.hazards){h.age+=dt;if(h.age<h.delay)continue;h.life-=dt;if(h.kind==='bolt'){h.x+=Math.cos(h.angle)*h.speed*dt;h.y+=Math.sin(h.angle)*h.speed*dt;if(h.charge){const boss=r.enemies.find(e=>e.id===h.owner&&e.hp>0);if(boss){boss.dashing=true;Object.assign(boss,constrainToWorld(r,{x:h.x,y:h.y},boss.radius));}else h.life=0;}}if(h.expanding)h.radius+=h.speed*dt;
  const d=dist(h,r),touch=h.kind==='ring'?Math.abs(d-h.radius)<26:d<h.radius+13;if(touch&&!h.hit&&r.damageCooldown<=0){hurtPlayer(r,h.damage,events);h.hit=true;}
 }r.hazards=r.hazards.filter(h=>h.life>0);for(const e of r.enemies)if(e.dashing&&!r.hazards.some(h=>h.owner===e.id&&h.life>0&&h.age>=h.delay))e.dashing=false;
 stepRitual(r,dt,input,events,api);
 if(r.bonus.afterimage&&r.moving){r.afterimageClock-=dt;if(r.afterimageClock<=0){r.afterimageClock=2;api.zone(r,{kind:'puddle',id:'afterimage',range:55,color:'#b7dafc',duration:2.5},r.x,r.y,12,{slow:.5,follow:false});}}
 for(const c of r.chests)if(dist(c,r)<56&&openChest(r,c.id,api.heal)){events.push('chest');break;}
 recordLoadout(r);
}
