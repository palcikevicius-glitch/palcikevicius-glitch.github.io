// V0.2.0 boss roster. Every boss has its own sprite, movement, phases and attack cycle.
// Design rule: every attack is telegraphed (at least 0.6 s) and always leaves a reachable escape.
import {mapBounds} from './world-geometry.js';
const TAU=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const ARENA_RADIUS=400,ARENA_MIN_RADIUS=280;
const name=(en,lt,ru)=>({en,lt,ru});
export const BOSSES={
 scarecrow:{id:'scarecrow',sprite:'scarecrow',name:name('Scarecrow Warden','Kaliausė Sargė','Пугало-страж'),radius:30,speed:[70,80,92],hp:1,color:'#c9a45a',
  phases:[['crow_fan','straw_dolls','scythe_dash'],['crow_fan','straw_dolls','crow_ring','scythe_dash'],['crow_ring','scythe_dash','straw_dolls','crow_fan']]},
 werewolf:{id:'werewolf',sprite:'werewolf',name:name('Grave Hound','Vilkolakis','Оборотень'),radius:28,speed:[88,98,112],hp:1.05,color:'#8f8a96',
  phases:[['pounce','claw_sweep','howl'],['pounce','claw_sweep','howl','claw_sweep'],['frenzy','claw_sweep','howl','frenzy']]},
 bellkeeper:{id:'bellkeeper',sprite:'bellkeeper',name:name('The Bell Keeper','Varpų Sergėtojas','Хранитель Колокола'),radius:31,speed:[62,70,78],hp:1,color:'#e2b46c',
  phases:[['toll_rings','bell_drop','toll_rings'],['bell_pillars','toll_rings','bell_drop'],['bell_cage','toll_rings','bell_drop','bell_pillars']]},
 kaukas:{id:'kaukas',sprite:'kaukas',name:name('Lantern Thief','Kaukas Žibintų Vagis','Каукас-похититель'),radius:23,speed:[104,114,126],hp:.9,color:'#e8b85c',
  phases:[['blink','spark_spray','blink'],['blink','lantern_mines','spark_spray','steal_light'],['steal_light','blink','lantern_mines','spark_spray']]},
 stonebreather:{id:'stonebreather',sprite:'stonebreather',name:name('Stone Breather','Akmens Alsuotojas','Каменный Дыхатель'),radius:34,speed:[52,58,66],hp:1.15,color:'#9bb6c9',
  phases:[['rock_line','dust_breath','burrow'],['boulder_roll','burrow','rock_line','dust_breath'],['burrow','boulder_roll','dust_breath','rock_line']]},
 legacy:{id:'legacy',sprite:'bellkeeper',name:name('Restless Keeper','Neramus Sergėtojas','Беспокойный Хранитель'),radius:29,speed:[93,102,111],hp:1,color:'#ba7260',phases:[['legacy'],['legacy'],['legacy']]}
};
// Bosses by five-minute slot. The last entry is the final boss of that map.
export const BOSS_ROSTER={village:['scarecrow','werewolf','scarecrow','bellkeeper'],quarry:['kaukas','stonebreather']};
export function bossFor(mapId,slot,final){const list=BOSS_ROSTER[mapId];if(!list)return 'legacy';if(final)return list.at(-1);return list[clamp(slot,0,Math.max(0,list.length-2))];}
export const bossDef=e=>BOSSES[e?.bossId]||BOSSES.legacy;
export const bossName=(e,lang='en')=>{const n=bossDef(e).name;return n[lang]||n.en;};
// Arena centre stays inside the world even on narrow passages; the walls then bound the fight.
export function arenaAround(r,x,y,radius=ARENA_RADIUS){const b=mapBounds(r.mapId==='mill'?{...r,y}:r),pad=(lo,hi)=>Math.min(radius+20,Math.max(0,(hi-lo)/2-1));
 const px=Number.isFinite(b.minX)?pad(b.minX,b.maxX):0,py=Number.isFinite(b.minY)?pad(b.minY,b.maxY):0;
 return {x:Number.isFinite(b.minX)?clamp(x,b.minX+px,b.maxX-px):x,y:Number.isFinite(b.minY)?clamp(y,b.minY+py,b.maxY-py):y,radius,baseRadius:radius};}
const bossDamage=(r,e)=>29+(e.phase||1)*6+Math.floor(r.time/300)*2;
function hazard(r,e,kind,x,y,radius,extra={}){const h={kind,x,y,radius,age:0,delay:.8,life:.6,maxLife:extra.life??.6,angle:0,speed:220,damage:bossDamage(r,e),hit:false,owner:e.id,...extra};h.maxLife=h.life;r.hazards.push(h);return h;}
const aimAt=(e,r)=>Math.atan2(r.y-e.y,r.x-e.x);
// A point inside the arena at most `limit` from its centre.
function inArena(r,p,margin=40){const a=r.arena;if(!a)return p;const d=dist(p,a),max=a.radius-margin;if(d>max){p.x=a.x+(p.x-a.x)/d*max;p.y=a.y+(p.y-a.y)/d*max;}return p;}
// Fan aimed at the hero. With `hole`, the centre lane stays open: standing still is safe.
function fan(r,e,count,step,extra,hole=false){const aim=aimAt(e,r);if(hole){for(let i=1;i<=count/2;i++)for(const s of [-1,1])hazard(r,e,'bolt',e.x,e.y,extra.radius||10,{...extra,angle:aim+s*(i-.5)*step*1.6});return;}for(let i=0;i<count;i++)hazard(r,e,'bolt',e.x,e.y,extra.radius||10,{...extra,angle:aim+(i-(count-1)/2)*step});}
// Outward ring of bolts with a gap near the hero, so the escape is always reachable.
function boltRing(r,e,count,gapSize,extra,rng){const toward=aimAt(e,r),gap=toward+(rng()-.5)*1.6;for(let i=0;i<count;i++){const a=i*TAU/count;let off=Math.abs(((a-gap)%TAU+TAU+Math.PI)%TAU-Math.PI);if(off<gapSize*TAU/count/2)continue;hazard(r,e,'bolt',e.x,e.y,extra.radius||10,{...extra,angle:a});}}
const ATTACKS={
 legacy(r,e){const phase=e.phase,aim=aimAt(e,r),pattern=(e.pattern+['village','quarry','mill','marsh','bellwood'].indexOf(r.mapId))%4;
  if(pattern===0){for(let i=-phase;i<=phase;i++)hazard(r,e,'bolt',e.x,e.y,12,{angle:aim+i*.2,life:3,delay:.65});}
  else if(pattern===1){hazard(r,e,'circle',r.x,r.y,68+phase*8,{delay:.9});if(phase>1)for(const sign of [-1,1])hazard(r,e,'circle',r.x+Math.cos(r.angle+Math.PI/2)*sign*115,r.y+Math.sin(r.angle+Math.PI/2)*sign*115,60,{delay:1.15});}
  else if(pattern===2)hazard(r,e,'bolt',e.x,e.y,32,{angle:aim,speed:345+phase*25,life:.7,delay:.85,charge:true,damage:bossDamage(r,e)+10});
  else hazard(r,e,'ring',e.x,e.y,55,{expanding:true,speed:145+phase*25,life:1.7,delay:.75,damage:bossDamage(r,e)+4});
  return 3.5-phase*.45;},
 // Scarecrow Warden
 crow_fan(r,e){fan(r,e,2+e.phase*2,.22,{radius:10,speed:225,life:2.6,delay:.75,look:'crow'},true);return 2.4;},
 straw_dolls(r,e,rng){const k=Math.min(5,2+e.phase),turn=rng()*TAU;hazard(r,e,'circle',r.x,r.y,62,{delay:1.4,life:.35,look:'doll'});for(let i=0;i<k;i++){const a=turn+i*TAU/k;hazard(r,e,'circle',r.x+Math.cos(a)*175,r.y+Math.sin(a)*175,58,{delay:1.5+i*.08,life:.35,look:'doll'});}return 2.6;},
 scythe_dash(r,e){const aim=aimAt(e,r),speed=360+e.phase*30,life=.7;hazard(r,e,'bolt',e.x,e.y,32,{angle:aim,speed,life,delay:.85,charge:true,look:'scythe',damage:bossDamage(r,e)+8});const end=inArena(r,{x:e.x+Math.cos(aim)*speed*life,y:e.y+Math.sin(aim)*speed*life});if(e.phase>1)hazard(r,e,'circle',end.x,end.y,85,{delay:.85+life+.25,life:.3,look:'scythe'});return 2.7;},
 crow_ring(r,e,rng){boltRing(r,e,18,3.2,{radius:10,speed:165,life:3,delay:.85,look:'crow'},rng);return 2.6;},
 // Grave Hound
 pounce(r,e){const n=1+e.phase;for(let i=0;i<n;i++){const p=inArena(r,{x:r.x,y:r.y});hazard(r,e,'circle',p.x,p.y,72,{delay:.95+i*.8,life:.3,look:'claw',leap:true,track:i>0?.68:0});}return 1.4+n*.8;},
 frenzy(r,e){for(let i=0;i<5;i++)hazard(r,e,'circle',r.x,r.y,64,{delay:.75+i*.66,life:.25,look:'claw',leap:true,track:i>0?.6:0});return 4.7;},
 claw_sweep(r,e){const aim=aimAt(e,r);e.dashing=true;hazard(r,e,'cone',e.x,e.y,165,{angle:aim,spread:.85,delay:.8,life:.3,look:'claw',hold:true});if(e.phase>1)hazard(r,e,'cone',e.x,e.y,165,{angle:aim+(e.pattern%2?.9:-.9),spread:.75,delay:1.35,life:.3,look:'claw',hold:true});return 2.2;},
 howl(r,e,rng,api){const alive=r.enemies.filter(n=>n.summonedBy===e.id&&n.hp>0).length,count=Math.max(0,Math.min(10-alive,2+e.phase*2));for(let i=0;i<count;i++){const a=rng()*TAU,p=inArena(r,{x:e.x+Math.cos(a)*90,y:e.y+Math.sin(a)*90},50);api.summon?.(r,e,p.x,p.y);}hazard(r,e,'ring',e.x,e.y,30,{expanding:true,speed:120,life:1.1,delay:.6,gap:.9,gapAngle:aimAt(e,r),look:'howl',damage:Math.round(bossDamage(r,e)*.6)});return 2.6;},
 // The Bell Keeper
 // Consecutive rings drift their gap a little, so the escape lane moves but stays reachable.
 toll_rings(r,e,rng){const n=1+e.phase,start=aimAt(e,r)+(rng()-.5)*.8,drift=rng()<.5?-.25:.25;for(let i=0;i<n;i++)hazard(r,e,'ring',e.x,e.y,40,{expanding:true,speed:150,life:2.8,delay:.75+i*.6,gap:.42,gapAngle:start+i*drift,look:'bell'});return 2.2+n*.4;},
 bell_drop(r,e,rng){const k=2+e.phase,turn=rng()*TAU;hazard(r,e,'circle',r.x,r.y,60,{delay:1,life:.3,look:'bell'});for(let i=0;i<k;i++){const a=turn+i*TAU/k,p=inArena(r,{x:r.x+Math.cos(a)*165,y:r.y+Math.sin(a)*165});hazard(r,e,'circle',p.x,p.y,56,{delay:1.1+i*.14,life:.3,look:'bell'});}return 2.4;},
 // Pillars stand away from the hero: the hero's side of the arena stays between two of them.
 bell_pillars(r,e,rng){const a=r.arena||e,turn=Math.atan2(r.y-a.y,r.x-a.x)+Math.PI/3;for(let i=0;i<3;i++){const ang=turn+i*TAU/3,p={x:a.x+Math.cos(ang)*a.radius*.6,y:a.y+Math.sin(ang)*a.radius*.6};hazard(r,e,'circle',p.x,p.y,34,{delay:.9,life:4.2,look:'pillar',damage:Math.round(bossDamage(r,e)*.5)});for(let k=0;k<3;k++)hazard(r,e,'ring',p.x,p.y,36,{expanding:true,speed:115,life:1.2,delay:1.3+k*1.35,gap:.6,gapAngle:Math.atan2(a.y-p.y,a.x-p.x),look:'bell',damage:Math.round(bossDamage(r,e)*.75)});}return 4.4;},
 bell_cage(r,e,rng){if(r.arena&&!e.caged){e.caged=true;r.arena.targetRadius=Math.max(ARENA_MIN_RADIUS,(r.arena.baseRadius||r.arena.radius)*.72);}return ATTACKS.toll_rings(r,e,rng);},
 // Lantern Thief
 blink(r,e,rng){const a=rng()*TAU,d=150+rng()*110,p=inArena(r,{x:r.x+Math.cos(a)*d,y:r.y+Math.sin(a)*d},60);e.hidden=true;e.dashing=true;hazard(r,e,'circle',p.x,p.y,48,{delay:.85,life:.25,look:'blink',leap:true,land:'sparks'});return 2.1;},
 spark_spray(r,e){for(let w=0;w<3;w++)hazard(r,e,'bolt',e.x,e.y,8,{angle:aimAt(e,r),speed:270,life:2.2,delay:.65+w*.25,look:'spark',spray:3,step:.25});return 2.3;},
 lantern_mines(r,e,rng){const turn=rng()*TAU;for(let i=0;i<4;i++){const a=turn+i*TAU/4,p=inArena(r,{x:r.x+Math.cos(a)*135,y:r.y+Math.sin(a)*135});hazard(r,e,'circle',p.x,p.y,66,{delay:1.6+i*.12,life:.3,look:'lantern'});}return 2.4;},
 steal_light(r,e,rng){r.darkUntil=r.time+4.5;return ATTACKS.spark_spray(r,e,rng);},
 // Stone Breather
 burrow(r,e){e.hidden=true;e.dashing=true;hazard(r,e,'circle',r.x,r.y,88,{delay:1.75,life:.35,look:'burrow',leap:true,follow:.9,land:e.phase>1?'rocks':null});return 3.1;},
 boulder_roll(r,e,rng){const a=r.arena||{x:e.x,y:e.y,radius:ARENA_RADIUS},dir=e.pattern%2?1:-1,lanes=5,skip=1+Math.floor(rng()*3);for(let i=0;i<lanes;i++){if(i===skip)continue;const y=r.y+(i-(lanes-1)/2)*104,x=a.x-dir*(a.radius+20);hazard(r,e,'bolt',x,y,30,{angle:dir>0?0:Math.PI,speed:230,life:(a.radius*2+40)/230,delay:1.05,look:'boulder'});}return 3;},
 rock_line(r,e){const lines=e.phase>2?3:1,aim=aimAt(e,r);for(let l=0;l<lines;l++){const ang=aim+(l-(lines-1)/2)*.55;for(let i=1;i<=8;i++)hazard(r,e,'circle',e.x+Math.cos(ang)*i*55,e.y+Math.sin(ang)*i*55,36,{delay:.7+i*.09,life:.25,look:'stone'});}return 2.3;},
 dust_breath(r,e){const aim=aimAt(e,r),sweep=e.phase>1?3:1;e.dashing=true;for(let i=0;i<sweep;i++)hazard(r,e,'cone',e.x,e.y,225,{angle:aim+(i-(sweep-1)/2)*(e.pattern%2?.6:-.6),spread:.5,delay:.9+i*.32,life:.35,look:'dust',hold:true});return 2.6;}
};
export const ATTACK_IDS=Object.keys(ATTACKS);
export function bossPhase(e){return e.hp/e.maxHp<.35?3:e.hp/e.maxHp<.7?2:1;}
// Called once per frame for each living boss while its arena is active.
export function stepBoss(r,e,dt,events,api,rng=Math.random){
 const def=bossDef(e),phase=bossPhase(e);if(phase>(e.phase||1)){e.phase=phase;events.push('boss_phase');}e.phase=phase;
 if(!e.hidden)e.speed=def.speed[phase-1];
 e.attackClock=(e.attackClock??1)-dt;if(e.attackClock>0||e.hidden)return;
 const list=def.phases[phase-1],id=list[(e.pattern||0)%list.length];e.pattern=(e.pattern||0)+1;
 const recovery=(ATTACKS[id]||ATTACKS.legacy)(r,e,rng,api);e.attackClock=id==='legacy'?recovery:recovery*(1-.08*(phase-1));
}
// Moves hazards, resolves leaps/landings and damages the hero. Shared by all bosses.
export function stepHazards(r,dt,events,hurt){
 const owner=id=>r.enemies.find(e=>e.id===id&&e.hp>0);
 for(const h of r.hazards){const before=h.age;h.age+=dt;
  if(h.age<h.delay){if(h.follow&&h.age<h.follow){const d=dist(h,r)||1,step=Math.min(d,190*dt);h.x+=(r.x-h.x)/d*step;h.y+=(r.y-h.y)/d*step;}else if(h.track&&before<h.delay-h.track&&h.age>=h.delay-h.track){h.x=r.x;h.y=r.y;}
   continue;}
  if(before<h.delay){// activation moment
   if(h.spray){const n=h.spray;for(let i=0;i<n;i++){if(i===0)continue;r.hazards.push({...h,spray:0,age:h.age,angle:h.angle+(i-(n-1)/2)*h.step});}h.angle+=-(n-1)/2*h.step;h.spray=0;}
   if(h.hold&&!r.hazards.some(x=>x!==h&&x.owner===h.owner&&x.hold&&x.age<x.delay)){const b=owner(h.owner);if(b&&!b.hidden)b.dashing=false;}
   if(h.leap){const b=owner(h.owner);if(b){b.x=h.x;b.y=h.y;b.hidden=false;b.dashing=false;events.push('boss_land');
    if(h.land==='sparks'){for(let i=0;i<12;i++)if(i%6!==2)r.hazards.push({kind:'bolt',x:h.x,y:h.y,radius:8,age:0,delay:.25,life:1.6,maxLife:1.6,angle:i*TAU/12+(r.time%1),speed:210,damage:Math.round(h.damage*.7),hit:false,owner:h.owner,look:'spark'});}
    if(h.land==='rocks')r.hazards.push({kind:'ring',x:h.x,y:h.y,radius:40,age:0,delay:.2,life:1.5,maxLife:1.5,angle:0,speed:150,expanding:true,gap:.5,gapAngle:Math.atan2(r.y-h.y,r.x-h.x),damage:Math.round(h.damage*.7),hit:false,owner:h.owner,look:'stone'});}}
  }
  h.life-=dt;
  if(h.kind==='bolt'){h.x+=Math.cos(h.angle)*h.speed*dt;h.y+=Math.sin(h.angle)*h.speed*dt;if(h.charge){const b=owner(h.owner);if(b){b.dashing=true;b.x=h.x;b.y=h.y;if(r.arena){const d=dist(b,r.arena),max=r.arena.radius-35;if(d>max){b.x=r.arena.x+(b.x-r.arena.x)/d*max;b.y=r.arena.y+(b.y-r.arena.y)/d*max;h.life=0;}}}else h.life=0;}}
  if(h.expanding)h.radius+=h.speed*dt;
  if(h.hit||r.damageCooldown>0||!(h.damage>0))continue;
  if(touches(h,r))  {hurt(r,h.damage,events);h.hit=true;}
 }
 r.hazards=r.hazards.filter(h=>h.life>0);
 for(const e of r.enemies)if(e.dashing&&!e.hidden&&!r.hazards.some(h=>h.owner===e.id&&(h.charge&&h.life>0&&h.age>=h.delay||h.hold&&h.age<h.delay)))e.dashing=false;
}
export function touches(h,p){const d=dist(h,p),a=Math.atan2(p.y-h.y,p.x-h.x),off=g=>Math.abs(((a-g)%TAU+TAU+Math.PI)%TAU-Math.PI);
 if(h.kind==='ring'){if(Math.abs(d-h.radius)>=26)return false;return !(h.gap>0&&off(h.gapAngle)<h.gap);}
 if(h.kind==='cone')return d<h.radius+13&&off(h.angle)<h.spread;
 return d<h.radius+13;}
