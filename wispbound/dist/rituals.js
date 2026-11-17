import {artifactBonuses} from './catalog.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),TAU=Math.PI*2;
export const RITUALS={
 rasa:{name:'Bell of Dawn',description:'Your drawn boundary repels crossing spirits. Staying inside restores ward.',color:'#f4cd83'},
 mira:{name:'Sunwheel',description:'Needle turrets travel your traced boundary and fire inward at trapped spirits.',color:'#ffcd64'},
 kael:{name:'Ember Vortex',description:'Your traced path ignites into a burning perimeter. Lure spirits through it.',color:'#ff8353'},
 neris:{name:'Tidal Sanctuary',description:'Your enclosed sanctuary heals you and chills enemies inside it.',color:'#7adcf0'},
 vesper:{name:'Raven Tempest',description:'Ravens launch from the boundary to hunt the strongest nearby enemy.',color:'#c596ef'},
 elin:{name:'Threads of Fate',description:'Crossing threads span your contour. Enemies touching a thread are rooted.',color:'#f3d2de'},
 morwen:{name:'Sovereign Blades',description:'Royal blades patrol the exact path you drew, cutting along its edges.',color:'#d3a3f6'},
 astra:{name:'Celestial Rain',description:'Stars fall in a sequence around your traced constellation, scattering fragments.',color:'#ffe694'},
 selene:{name:'Lunar Harvest',description:'Crescents sweep between opposite boundary points, returning stolen health.',color:'#b3d6ff'},
 brann:{name:'Briarquake',description:'A living hedge blocks and roots spirits crossing your drawn boundary.',color:'#b7dd78'},
 corvin:{name:'Last Rites',description:'Spirits inside your seal receive a delayed death mark. Wounded spirits are executed.',color:'#8dedc1'},
 talis:{name:'Eye of the Storm',description:'Your enclosed storm pulls spirits toward its centre and chains lightning inside.',color:'#92efff'}
};
// V0.2.0: the ritual charges from defeated spirits and boss damage, never from time.
// While a ritual (or its echo) is active the meter is frozen; it restarts from zero afterwards.
export const RITUAL_FULL=20,RITUAL_PER_KILL=.4,RITUAL_PER_GUARDIAN=5,RITUAL_PER_BOSS=12;
export function chargeRitual(r,amount){if(r.ritualActive||!(amount>0))return 0;const before=r.ritualCharge||0;r.ritualCharge=Math.min(RITUAL_FULL,before+amount*(1+(r.bonus?.ritual||0)));return r.ritualCharge-before;}
export function insidePath(p,path){let yes=false;for(let i=0,j=path.length-1;i<path.length;j=i++){const a=path[i],b=path[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
export function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,q=dx*dx+dy*dy,t=q?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/q)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export const boundaryDistance=(p,path)=>Math.min(...path.slice(1).map((b,i)=>segmentDistance(p,path[i],b)));
export function pathPoint(path,fraction){let total=0;const lens=path.slice(1).map((p,i)=>{const n=dist(p,path[i]);total+=n;return n;});let at=(((fraction%1)+1)%1)*total;for(let i=0;i<lens.length;i++){if(at<=lens[i]){const t=lens[i]?at/lens[i]:0;return {x:path[i].x+(path[i+1].x-path[i].x)*t,y:path[i].y+(path[i+1].y-path[i].y)*t};}at-=lens[i];}return {...path[0]};}
export function closedContour(trail,p){
 for(let first=0;first<trail.length-18;first++){if(dist(trail[first],p)>38)continue;const points=trail.slice(first);let length=0,area=0;for(let i=1;i<points.length;i++){length+=dist(points[i-1],points[i]);area+=points[i-1].x*points[i].y-points[i].x*points[i-1].y;}area+=points.at(-1).x*points[0].y-points[0].x*points.at(-1).y;if(length<=180||Math.abs(area)<=4000)continue;
 const count=Math.min(79,points.length),path=Array.from({length:count},(_,i)=>({...points[Math.round(i*(points.length-1)/(count-1))]}));path.push({...path[0]});return path;
 }return null;
}
export const closedLoop=(trail,p)=>!!closedContour(trail,p);
export function activateRitual(r,api,echo=false,echoPath=null){
 if(!echo&&(r.ritualCharge<20||r.ritualActive))return false;const path=echoPath||closedContour(r.trail,r);if(!path)return false;
 const id=r.characterId||'rasa',life=7*(1+(r.bonus.ritualDuration||0)+artifactBonuses(r).duration)*(echo?.6:1),centre=path.slice(0,-1).reduce((p,q)=>({x:p.x+q.x/(path.length-1),y:p.y+q.y/(path.length-1)}),{x:0,y:0});
 r.ritualActive={id,...centre,path:structuredClone(path),age:0,life,maxLife:life,radius:Math.max(...path.map(p=>dist(p,centre))),tick:0,echoed:echo,power:echo?.5:1,sequence:0};
 if(!echo){r.ritualCharge=0;r.trail=[];r.rituals++;}if(r.bonus.ritualFreeze)r.freezeTime=Math.max(r.freezeTime,r.bonus.ritualFreeze);if(r.bonus.ritualHeal)api.heal(r,r.bonus.ritualHeal);return true;
}
function tickRitual(r,a,api){
 const {hit,zone,projectile,effect,heal}=api,color=RITUALS[a.id].color,damage=(32+r.level*1.4+(r.bonus.ritualNova||0)*.15)*(1+(r.bonus.ritualDamage||0))*a.power;
 const d={id:`ritual_${a.id}`,kind:'bolt',color,range:55,radius:8,speed:350,pierce:3,duration:1.2,ritual:true,statusDuration:1},near=r.enemies.filter(e=>e.hp>0&&dist(e,a)<a.radius+160),within=near.filter(e=>insidePath(e,a.path)),edge=near.filter(e=>boundaryDistance(e,a.path)<28*(1+(r.bonus.ritualArea||0)));
 const at=f=>pathPoint(a.path,f),fire=(from,to,extra={},power=1)=>projectile(r,{...d,...extra},Math.atan2(to.y-from.y,to.x-from.x),damage*power,{x:from.x,y:from.y,ox:from.x,oy:from.y,ritual:true,...extra});
 a.sequence++;a.tick=.6;
 switch(a.id){
 case 'rasa':for(const e of edge){hit(r,e,damage,{ritual:true,slow:.4});const v=dist(e,a)||1;if(!e.boss){e.x+=(e.x-a.x)/v*15.4;e.y+=(e.y-a.y)/v*15.4;}}if(insidePath(r,a.path))r.ward=Math.min(r.maxHp*.25,(r.ward||0)+6*a.power);a.tick=.7;break;
 case 'mira':for(let i=0;i<4;i++){const p=at(a.age*.08+i/4),e=within[i%Math.max(1,within.length)]||a;fire(p,e,{radius:5,pierce:6,speed:440},1.1);}a.tick=.45;break;
 case 'kael':for(let i=0;i<4;i++){const p=at(a.sequence*.057+i/4);zone(r,{...d,kind:'trail',range:36,duration:1.5},p.x,p.y,damage*.7,{ritual:true,burn:9});}a.tick=.5;break;
 case 'neris':if(insidePath(r,a.path))heal(r,3*a.power);for(const e of within)hit(r,e,damage*.45,{ritual:true,slow:.65,freeze:.2});a.tick=.8;break;
 case 'vesper':{const e=[...near].sort((x,y)=>Number(y.boss)-Number(x.boss)||Number(y.mini)-Number(x.mini)||y.hp-x.hp)[0];if(e)for(let i=0;i<2;i++)fire(at(a.age*.07+i/2),e,{kind:'bird',homing:true,dive:true,elite:true,targetId:e.id,splash:45,speed:260,turnRate:10},1.7);a.tick=.9;break;}
 case 'elin':for(let i=0;i<3;i++){const p=at(a.sequence*.06+i/3),q=at(a.sequence*.06+i/3+.5);effect(r,'line',p.x,p.y,0,color,{tx:q.x,ty:q.y,life:.55,maxLife:.55});for(const e of within)if(segmentDistance(e,p,q)<24)hit(r,e,damage,{ritual:true,root:.65});}a.tick=.65;break;
 case 'morwen':for(let i=0;i<6;i++){const p=at(a.age*.17+i/6);for(const e of near)if(dist(e,p)<30)hit(r,e,damage*.35,{ritual:true});}a.tick=.14;break;
 case 'astra':{const p=at(a.sequence*.137);zone(r,{...d,kind:'meteor',range:75},p.x,p.y,damage*2.3,{delay:.6,initialDelay:.6,life:.15,maxLife:.15,meteor:true,ritual:true,shards:4});a.tick=.55;break;}
 case 'selene':for(let i=0;i<2;i++)fire(at(a.sequence*.1+i/2),at(a.sequence*.1+i/2+.5),{kind:'boomerang',flightTime:2,radius:16,pierce:8,healOnHit:.2*a.power,returnX:at(a.sequence*.1+i/2).x,returnY:at(a.sequence*.1+i/2).y},1.4);a.tick=1;break;
 case 'brann':for(const e of edge)hit(r,e,damage*.65,{ritual:true,root:1.1});a.tick=.75;break;
 case 'corvin':for(const e of within.slice(0,5))zone(r,{...d,kind:'mine',range:45},e.x,e.y,damage*2,{armed:.9,deathMark:true,ritual:true,execute:.22});a.tick=1.4;break;
 case 'talis':{let p=a;for(const e of within.slice(0,7)){effect(r,'line',p.x,p.y,0,color,{tx:e.x,ty:e.y,visualKind:'lightning'});hit(r,e,damage*.8,{ritual:true,shock:.12});p=e;}a.tick=.55;break;}
 }
}
export function stepRitual(r,dt,input,events,api){
 r.ritualClock+=dt;
 if(r.ritualClock>.1&&(input.x||input.y)){r.ritualClock=0;r.trail.push({x:r.x,y:r.y});if(r.trail.length>100)r.trail.shift();if(r.ritualCharge>=20&&!r.ritualActive&&activateRitual(r,api))events.push('ritual');}
 const a=r.ritualActive;if(!a)return;a.age+=dt;a.life-=dt;a.tick-=dt;
 if(a.id==='talis')for(const e of r.enemies)if(!e.boss&&insidePath(e,a.path)){const d=dist(e,a)||1;if(d>25){e.x+=(a.x-e.x)/d*58*dt;e.y+=(a.y-e.y)/d*58*dt;}}
 if(a.tick<=0)tickRitual(r,a,api);if(a.life<=0){r.ritualActive=null;if(r.bonus.ritualEcho&&!a.echoed){activateRitual(r,api,true,a.path);events.push('ritual_echo');}}
}
