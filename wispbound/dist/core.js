import {SpatialGrid} from './spatial-grid.js';
import {insideWorld,constrainToWorld,spawnPoint,offscreenSpawn,prepareWorldGeometry} from './world-geometry.js';
import {COMBAT_SPEED,encounterPacing,tiersAt,healthForTier,pathStats,effectWindow} from './balance.js';
import {encounterState,gainArtifact,recordLoadout,startArena,bossDefeated,hurtPlayer,stepEncounters,activateRitual as invokeRitual,openChest as collectChest} from './encounters.js';
export {acknowledgeChest} from './encounters.js';
import {chargeRitual,RITUAL_PER_KILL,RITUAL_PER_GUARDIAN,RITUAL_PER_BOSS} from './rituals.js';
import {freshMeta,freshChallenge,validateMeta,character} from './progression.js';
import {LEGACY_SKILLS,BONUS_DEFAULTS,prerequisitesMet} from './skill-tree.js';
import {BASES,ARTIFACTS,RECIPES,ULTIMATES,MAPS,SKILLS,BRANCHES,RANKS,weapon,artifactBonuses} from './catalog.js';
// Quadratic costs balance the growing value of green and red gems.
export const xpForLevel=level=>level===1?8:Math.ceil(8+2.2*level+.16*level*level);
export const heroXpForLevel=level=>level*240;
export const SUPPLY_INTERVAL=37.5/1.15;
export const WEAPON_SLOTS=6,ARTIFACT_SLOTS=6;
export const nextMiniTime=time=>{const block=Math.floor(time/300),within=time-block*300;return block*300+(within<75?75:within<150?150:within<225?225:375);};
export const enemyTierRange=tiersAt;
export const gemValue=tier=>tier>=5?9:tier>=3?3:1;
export const tierHealth=healthForTier;
export const freshSave=()=>({schema:6,...freshMeta(),collectedWeapons:['iron_bell'],clearedMaps:[],heroLevel:1,heroXp:0,gold:0,shards:0,skills:[],ranks:{},discovered:[],trials:[],bosses:0,best:0,runs:0,lastClaim:null,settings:{language:'en',controls:'joystick',controlSize:130,controlOpacity:.7,controlSide:'left',controlBottom:24,music:.35,musicMuted:false,sfx:.6,quality:'high',soundQuality:'high',sharpness:100,pixelScale:1,fxIntensity:.75,screenShake:.35}});
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
export function validateSave(s){
 if(!s||![1,2,3,4,5,6].includes(s.schema)||!int(s.heroLevel,1,60)||!Number.isFinite(s.heroXp)||s.heroXp<0||!Number.isFinite(s.gold)||s.gold<0||!Number.isFinite(s.shards)||s.shards<0)throw Error('Invalid save');
 for(const key of ['skills','discovered','trials'])if(!Array.isArray(s[key])||new Set(s[key]).size!==s[key].length)throw Error('Invalid collections');
 const tree=s.schema<4?LEGACY_SKILLS:SKILLS;
 if(s.skills.some(id=>!tree.some(n=>n.id===id))||s.discovered.some(id=>!RECIPES.some(r=>r.id===id)&&!ULTIMATES.some(u=>u.id===id)))throw Error('Unknown progress');
 if(s.trials.length>21||s.trials.some(id=>!s.discovered.includes(id))||s.skills.reduce((sum,id)=>sum+tree.find(n=>n.id===id).cost,0)>s.heroLevel-1+s.trials.length)throw Error('Invalid points');
 if(s.skills.some(id=>!prerequisitesMet(s,tree.find(n=>n.id===id))))throw Error('Invalid prerequisites');
 if(!s.ranks||Object.entries(s.ranks).some(([id,r])=>!BASES.some(w=>w.id===id)||!int(r,0,7)))throw Error('Invalid ranks');
 if(!int(s.bosses,0,1000000)||!int(s.runs,0,1000000)||!Number.isFinite(s.best)||s.best<0)throw Error('Invalid history');
 if(s.schema>=2){for(const [key,catalog] of [['collectedWeapons',BASES],['clearedMaps',MAPS]])if(!Array.isArray(s[key])||new Set(s[key]).size!==s[key].length||s[key].some(id=>!catalog.some(d=>d.id===id)))throw Error('Invalid discoveries');if(!s.collectedWeapons.includes('iron_bell'))throw Error('Missing starter');}
 if(s.schema>=5)validateMeta(s);
 if(s.slotId!==undefined&&(typeof s.slotId!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(s.slotId)))throw Error('Invalid hero slot');if(s.playedSeconds!==undefined&&(!Number.isFinite(s.playedSeconds)||s.playedSeconds<0))throw Error('Invalid play time');
 const o={...freshSave().settings,...s.settings};
 if(!['en','ru','lt'].includes(o.language)||!['joystick','arrows'].includes(o.controls)||!['left','right'].includes(o.controlSide)||!['low','medium','high'].includes(o.quality)||!['low','high'].includes(o.soundQuality))throw Error('Invalid settings');
 for(const [k,a,b] of [['controlSize',90,200],['controlOpacity',.2,1],['controlBottom',12,180],['music',0,1],['sfx',0,1],['sharpness',0,100],['pixelScale',1,3],['fxIntensity',.25,1],['screenShake',0,1]])if(!Number.isFinite(o[k])||o[k]<a||o[k]>b)throw Error('Invalid settings');
 if(typeof o.musicMuted!=='boolean')throw Error('Invalid music setting');return {...s,settings:o};
}
export const mapUnlocked=(s,id)=>{const index=MAPS.findIndex(m=>m.id===id);return index===0||index>0&&(s.clearedMaps||[]).includes(MAPS[index-1].id);};
export const collectedBases=s=>BASES.filter(w=>(s.collectedWeapons||['iron_bell']).includes(w.id));
export function collectWeapon(s,id){const d=weapon(id);if(!d)return;const ids=d.stage==='ultimate'?d.components.map(i=>weapon(i).baseId):[d.baseId||d.id];s.collectedWeapons||=['iron_bell'];for(const i of ids)if(!s.collectedWeapons.includes(i))s.collectedWeapons.push(i);}
export function migrateProgress(profile,run){
 const s=structuredClone(validateSave(profile)),r=run?structuredClone(validateRun(run)):null;
 if(s.schema===1){s.schema=2;s.collectedWeapons=['iron_bell'];s.clearedMaps=[];for(const id of [...Object.keys(s.ranks),...s.discovered])collectWeapon(s,id);}
 if(s.schema<4){s.refundedSkills=s.skills.length;s.skills=[];s.schema=4;}
 if(s.schema<5){Object.assign(s,freshMeta());s.schema=5;}
 if(s.schema<6){s.challenge=freshChallenge();s.schema=6;}
 if(r){for(const w of r.weapons)collectWeapon(s,w.id);if(r.won&&!s.clearedMaps.includes(r.mapId))s.clearedMaps.push(r.mapId);
  if(r.schema===1){r.schema=2;for(const w of r.weapons)if(weapon(w.id).stage==='base')w.level=Math.min(6,w.level);Object.assign(r,{props:[],brokenCrates:[],powerups:[],freezeTime:0,worldClock:0,nextMini:Math.max(240,r.nextBoss-60),miniBosses:0});if(r.nextMini<=r.time)r.nextMini+=300;}
  if(r.schema===2){r.schema=3;r.nextMini=nextMiniTime(r.time);r.nextCrate=r.time+37.5;r.crateSerial=0;r.choiceRoll=0;r.offerHistory=[];r.lastUpgrade=null;r.props=r.props.filter(p=>p.kind!=='crate').concat(r.props.filter(p=>p.kind==='crate'&&p.hp>0).slice(0,4).map(p=>({...p,life:90})));}
  if(r.schema===3){r.schema=4;r.ward=0;r.revives=0;r.lastHurt=-5;r.lastStandAt=-60;r.rerolls=0;r.bonus={...BONUS_DEFAULTS,...r.bonus};}
  if(r.schema===4){Object.assign(r,encounterState(r,true));r.schema=5;r.bonus={...BONUS_DEFAULTS,...r.bonus};for(const e of r.enemies){const factor=e.boss?4:e.mini?3:2;e.hp*=factor;e.maxHp*=factor;}for(const p of r.shots)if(p.homing){p.life=Math.min(p.life,1.8);p.maxLife=Math.min(p.maxLife,1.8);}const boss=r.enemies.find(e=>e.boss&&e.hp>0);if(boss){startArena(r,boss);delete boss.damageAtSpawn;delete boss.spawnedAt;}}
  if(r.schema===5){r.schema=6;r.combatTime=r.time*.7;r.pendingDiscoveries=[];if(r.ritualActive&&!r.ritualActive.path){const a=r.ritualActive;a.path=Array.from({length:33},(_,i)=>({x:a.x+Math.cos(i*Math.PI/16)*a.radius,y:a.y+Math.sin(i*Math.PI/16)*a.radius}));a.sequence=0;}r.baseMaxHp=r.maxHp/(1+.04*(r.artifacts.root_sigil||0));for(const w of r.weapons)w.timer=Math.max(0,w.timer||0);for(const c of r.chests)c.kind||='boss';for(const p of r.powerups.filter(p=>p.kind==='upgrade'))r.chests.push({id:r.entityId++,x:p.x,y:p.y,kind:'mini',final:false});r.powerups=r.powerups.filter(p=>p.kind!=='upgrade');}
  prepareWorldGeometry(r);
 }
 return {profile:validateSave(s),run:r?validateRun(r):null};
}
export const points=s=>Math.min(SKILLS.length,s.heroLevel-1+s.trials.length)-s.skills.reduce((sum,id)=>sum+(SKILLS.find(n=>n.id===id)?.cost||1),0);
export function learnSkill(s,id){const n=SKILLS.find(n=>n.id===id);if(!n||s.skills.includes(id)||points(s)<n.cost||!prerequisitesMet(s,n))return false;s.skills.push(id);s.refundedSkills=0;return true;}
export function bonuses(s){const out={...BONUS_DEFAULTS};for(const id of s.skills){const n=SKILLS.find(n=>n.id===id);if(n)for(const [effect,value] of Object.entries(n.effects))out[effect]+=value;}return out;}
export function heal(r,value){const amount=value*(1+(r.bonus.healBoost||0)),excess=Math.max(0,r.hp+amount-r.maxHp);r.hp=Math.min(r.maxHp,r.hp+amount);if(r.bonus.overhealWard)r.ward=Math.min(r.maxHp*.25,(r.ward||0)+excess);}
export function rerollChoices(r,s){if(!r.levelPending||!(r.rerolls>0))return false;r.rerolls--;makeChoices(r,s);return true;}
export const forgeCost=r=>({gold:3*([100,250,550,1100,2200,4400,8800][r]||0),shards:2*([0,1,3,6,12,24,48][r]||0)});
export function forge(s,id){if(!collectedBases(s).some(w=>w.id===id))return false;const r=s.ranks[id]||0,c=forgeCost(r);if(r>=7||s.gold<c.gold||s.shards<c.shards)return false;s.gold-=c.gold;s.shards-=c.shards;s.ranks[id]=r+1;return true;}
export const capacity=r=>r.weapons.reduce((n,w)=>n+weapon(w.id).capacity,0);
export function newRun(mapId,starter,s){
 const map=MAPS.find(m=>m.id===mapId);if(!map||!collectedBases(s).some(w=>w.id===starter)||!mapUnlocked(s,mapId))throw Error('Locked journey');
 const b=bonuses(s),hp=100*(1+b.health)+(s.heroLevel-1)*.7;
 const run={schema:6,geometryVersion:1,millRoute:1,bellwoodSize:1,damageLog:{weapons:{},ritual:0,powerups:0,from:0},blasts:[],worldOrigin:{x:0,y:0},combatTime:0,pendingDiscoveries:[],ward:b.shieldHp,revives:0,paidRevives:0,reviveSpent:0,awaitingRevive:false,lastHurt:-5,lastStandAt:-60,rerolls:b.rerolls,nextCrate:20/1.15,crateSerial:0,choiceRoll:0,offerHistory:[],lastUpgrade:null,props:[],brokenCrates:[],powerups:[],freezeTime:0,worldClock:0,nextMini:75,miniBosses:0,id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,mapId,seed:Math.random(),time:0,x:0,y:0,angle:0,hp,maxHp:hp,level:1,xp:b.startXp,nextXp:xpForLevel(1),kills:0,gold:0,shards:0,cores:0,catalysts:0,bosses:0,nextBoss:300,finalSpawned:false,won:false,over:false,damageCooldown:0,spawnClock:0,nextGroup:18,groupSerial:0,healClock:0,weapons:[{id:starter,level:1+b.startLevel,rank:s.ranks[starter]||0,timer:0}],artifacts:{},enemies:[],shots:[],zones:[],effects:[],gems:[],trail:[],ritualCharge:0,ritualClock:0,rituals:0,levelPending:b.openingGifts||0,bonus:b,entityId:1,choices:[],claimed:false};
 return Object.assign(run,encounterState(run));
}
export function newCharacterRun(mapId,characterId,s){const c=character(characterId);if(!c||!s.characters.includes(c.id))throw Error('Locked character');const r=newRun(mapId,c.weapon,s);r.characterId=c.id;return r;}
export function validateRun(r){
 if(!r||![1,2,3,4,5,6].includes(r.schema)||typeof r.id!=='string'||!MAPS.some(m=>m.id===r.mapId)||!Array.isArray(r.weapons)||r.weapons.length<1||r.weapons.some(w=>!weapon(w.id)||!int(w.level,1,r.schema===1?8:r.schema>=6?7:6)||!int(w.rank,0,7)||(w.resonance!==undefined&&!int(w.resonance,0,3))||(w.volleys!==undefined&&!int(w.volleys,0,10000000))||(w.echoUntil!==undefined&&!Number.isFinite(w.echoUntil))))throw Error('Invalid run');
 for(const k of ['time','x','y','hp','maxHp','level','xp','nextXp','gold','shards','kills','bosses','cores','catalysts','nextBoss','entityId'])if(!Number.isFinite(r[k]))throw Error('Invalid run state');
 for(const k of ['enemies','shots','zones','effects','gems','trail','choices'])if(!Array.isArray(r[k])||r[k].length>5000)throw Error('Invalid world');
 if(r.nextXp<=0||r.xp<0||!int(r.level,1,10000)||capacity(r)>(r.schema<3?4:WEAPON_SLOTS)||r.time<0||r.time>86400||!r.bonus||!r.artifacts||Object.keys(r.artifacts).length>6||Object.entries(r.artifacts).some(([id,l])=>!ARTIFACTS.some(a=>a.id===id)||!int(l,1,r.schema>=6?6:3)))throw Error('Invalid run limits');
 for(const k of ['health','damage','ritual','speed','gold','xp'])if(!Number.isFinite(r.bonus[k])||r.bonus[k]<0||r.bonus[k]>1)throw Error('Invalid bonuses');
 if(!int(r.levelPending,0,100)||!int(r.entityId,1,1e8)||r.choices.some(c=>!['upgrade','weapon','artifact','heal','gold'].includes(c.type)||(c.type==='artifact'?!ARTIFACTS.some(a=>a.id===c.id):['weapon','upgrade'].includes(c.type)&&!BASES.some(w=>w.id===c.id))))throw Error('Invalid choices');
 if(r.schema>=2){for(const k of ['props','brokenCrates','powerups'])if(!Array.isArray(r[k])||r[k].length>20000)throw Error('Invalid scenery');for(const k of ['freezeTime','worldClock','nextMini','miniBosses'])if(!Number.isFinite(r[k])||r[k]<0)throw Error('Invalid encounter');if(r.props.some(p=>!['rock','tree','crate','house','ruin','well'].includes(p.kind)||![p.x,p.y,p.radius].every(Number.isFinite)||(p.kind==='crate'&&![p.hp,p.maxHp].every(Number.isFinite))))throw Error('Invalid prop');if(r.powerups.some(p=>!PICKUPS.includes(p.kind)||![p.x,p.y,p.life].every(Number.isFinite)))throw Error('Invalid powerup');}
 if(r.schema>=3){for(const k of ['nextCrate','crateSerial','choiceRoll'])if(!Number.isFinite(r[k])||r[k]<0)throw Error('Invalid schedule');if(!Array.isArray(r.offerHistory)||r.offerHistory.length>12||r.offerHistory.some(id=>!BASES.some(w=>w.id===id)&&!ARTIFACTS.some(a=>a.id===id)))throw Error('Invalid offer history');}
 if(r.schema>=4){for(const k of ['ward','revives','rerolls'])if(!Number.isFinite(r[k])||r[k]<0)throw Error('Invalid talent state');for(const k of ['lastHurt','lastStandAt'])if(!Number.isFinite(r[k]))throw Error('Invalid talent timer');for(const k of Object.keys(BONUS_DEFAULTS))if(!Number.isFinite(r.schema<5?(r.bonus[k]??0):r.bonus[k])||(r.bonus[k]??0)<0)throw Error('Invalid talent bonus');}
 if(r.schema>=5){
  for(const k of ['baseMaxHp','afterimageClock'])if(!Number.isFinite(r[k]))throw Error('Invalid encounter state');
  for(const k of ['chests','hazards'])if(!Array.isArray(r[k])||r[k].length>200)throw Error('Invalid encounter collection');
  if(r.chests.some(c=>(c.rewardCount!==undefined&&![1,3,5].includes(c.rewardCount))||!Number.isFinite(c.id)||![c.x,c.y].every(Number.isFinite)||typeof c.final!=='boolean'))throw Error('Invalid chest');
  if(r.hazards.some(h=>!['circle','ring','bolt'].includes(h.kind)||!['x','y','radius','age','delay','life','maxLife','angle','speed','damage'].every(k=>Number.isFinite(h[k]))))throw Error('Invalid hazard');
  if(r.arena&&(!['opening','active','closing'].includes(r.arena.phase)||!['x','y','radius','age','timer','bossId'].every(k=>Number.isFinite(r.arena[k]))))throw Error('Invalid arena');
  if(r.ritualActive&&(!character(r.ritualActive.id)||!['x','y','age','life','maxLife','radius','tick','power'].every(k=>Number.isFinite(r.ritualActive[k]))))throw Error('Invalid ritual');
  if(!r.journeyStats||typeof r.journeyStats.eligible!=='boolean'||['damageTaken','ritualKills','chests','noHitBosses','fastBosses','peakSlots','maxArtifacts'].some(k=>!Number.isFinite(r.journeyStats[k])||r.journeyStats[k]<0))throw Error('Invalid challenge state');
  if(r.chestReward&&(!Number.isFinite(r.chestReward.id)||typeof r.chestReward.final!=='boolean'||![1,3,5].includes(r.chestReward.rewards?.length)||r.chestReward.rewards.some(c=>!['weapon','artifact','resonance','supplies','evolution'].includes(c.type)||(c.type==='artifact'?!ARTIFACTS.some(a=>a.id===c.id):c.type!=='supplies'&&!weapon(c.id)))))throw Error('Invalid reward');
 }
 if(r.schema>=6){if(!Number.isFinite(r.combatTime)||r.combatTime<0||!Array.isArray(r.pendingDiscoveries)||r.pendingDiscoveries.length>26||r.pendingDiscoveries.some(id=>!RECIPES.some(x=>x.id===id)&&!ULTIMATES.some(x=>x.id===id)))throw Error('Invalid combat progress');if(r.ritualActive&&(!Array.isArray(r.ritualActive.path)||r.ritualActive.path.length<4||r.ritualActive.path.length>80||r.ritualActive.path.some(p=>![p.x,p.y].every(Number.isFinite))))throw Error('Invalid ritual contour');}
 if(r.millRoute!==undefined&&r.millRoute!==1)throw Error('Invalid mill route');
 if(r.geometryVersion!==undefined&&(r.geometryVersion!==1||!r.worldOrigin||![r.worldOrigin.x,r.worldOrigin.y].every(Number.isFinite)))throw Error('Invalid world origin');
 if(r.characterId!==undefined&&!character(r.characterId))throw Error('Unknown character');
 if(r.damageLog&&(!r.damageLog.weapons||Object.entries(r.damageLog.weapons).some(([id,v])=>!weapon(id)||!Number.isFinite(v)||v<0)||['ritual','powerups','from'].some(k=>!Number.isFinite(r.damageLog[k])||r.damageLog[k]<0)))throw Error('Invalid damage log');
 if(r.blasts!==undefined&&(!Array.isArray(r.blasts)||r.blasts.length>100||r.blasts.some(b=>!['id','x','y','radius','age','duration','damage'].every(k=>Number.isFinite(b[k]))||b.radius<0||b.duration<=0||b.age<0||b.age>b.duration||!Array.isArray(b.hitIds)||b.hitIds.length>5000)))throw Error('Invalid blast');
 if(r.paidRevives!==undefined&&!int(r.paidRevives,0,2)||r.reviveSpent!==undefined&&(!Number.isFinite(r.reviveSpent)||r.reviveSpent<0||r.reviveSpent>1500)||r.awaitingRevive!==undefined&&(typeof r.awaitingRevive!=='boolean'||r.awaitingRevive&&(!r.over||r.claimed||r.hp>0||(r.paidRevives||0)>=2)))throw Error('Invalid revive state');
 return r;
}
export function discover(s,id){if(!s.discovered.includes(id)){s.discovered.push(id);if(s.trials.length<21)s.trials.push(id);}}
// Evolution is awarded by an elite chest. The former manual actions cannot bypass it.
export const evolve=()=>({ok:false});
export const fuse=()=>({ok:false});
export function recordDiscoveries(r,s){for(const id of r.pendingDiscoveries||[])discover(s,id);r.pendingDiscoveries=[];}
export function knownBadge(s,r,id){
 const recipes=RECIPES.filter(x=>s.discovered.includes(x.id)&&(x.baseId===id||x.artifactId===id));
 if(!recipes.length)return '';
 const eligible=recipes.filter(x=>r?.weapons.some(w=>w.id===x.baseId)&&(r?.artifacts[x.artifactId]||0)>=x.artifactLevel);
 return eligible.some(x=>r.weapons.find(w=>w.id===x.baseId).level>=7)?'ready':eligible.length?'compatible':'discovered';
}
export function makeChoices(r,s,rng=Math.random){
 const ownedBase=new Set(r.weapons.flatMap(w=>{const d=weapon(w.id);return d.stage==='ultimate'?d.components.map(id=>weapon(id).baseId):[d.baseId||d.id];}));
 const upgrades=r.weapons.filter(w=>weapon(w.id).stage==='base'&&w.level<7).map(w=>({type:'upgrade',id:w.id}));
 const weapons=BASES.filter(w=>!ownedBase.has(w.id)&&capacity(r)<WEAPON_SLOTS).map(w=>({type:'weapon',id:w.id}));
 const artifacts=ARTIFACTS.filter(a=>(r.artifacts[a.id]||0)<6&&(Object.keys(r.artifacts).length<ARTIFACT_SLOTS||r.artifacts[a.id])).map(a=>({type:'artifact',id:a.id}));
 r.choiceRoll=(r.choiceRoll||0)+1;const recent=new Set(r.offerHistory||[]),picks=[];
 const choose=group=>{let eligible=group.filter(c=>!picks.some(p=>p.id===c.id));if(!eligible.length)return false;const unseen=eligible.filter(c=>!recent.has(c.id));if(unseen.length)eligible=unseen;const weights=eligible.map(c=>c.type==='weapon'&&!s.collectedWeapons.includes(c.id)?5:1),total=weights.reduce((a,b)=>a+b,0);let roll=rng()*total,index=0;while(index<weights.length-1&&roll>=weights[index])roll-=weights[index++];picks.push(eligible[index]);return true;};
 // One genuinely undiscovered family whenever space remains. Rotate offers instead of rerolling on reload.
 const undiscovered=weapons.filter(w=>!s.collectedWeapons.includes(w.id));if(weapons.length)choose(undiscovered.length?undiscovered:weapons);
 // Two rolls out of three include an owned upgrade; the third leans into discovery.
 if(r.choiceRoll%3!==0||!weapons.length)choose(upgrades);
 choose(artifacts);
 const pool=[...weapons,...upgrades,...artifacts];while(picks.length<3+(r.bonus.choiceCount||0)&&choose(pool)){}
 if(!picks.length)picks.push({type:'heal',id:'heal'},{type:'gold',id:'gold'});
 for(let i=picks.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[picks[i],picks[j]]=[picks[j],picks[i]];}
 r.offerHistory=[...(r.offerHistory||[]),...picks.filter(c=>c.type!=='heal'&&c.type!=='gold').map(c=>c.id)].slice(-6);r.choices=picks;return picks;
}

export function takeChoice(r,s,index){
 const c=r.choices[index];if(!c||r.levelPending<1)return false;
 if(c.type==='upgrade'){const w=r.weapons.find(w=>w.id===c.id);if(!w||weapon(w.id).stage!=='base'||w.level>=7)return false;w.level++;w.timer=0;}
 if(c.type==='weapon'){if(capacity(r)>=WEAPON_SLOTS||r.weapons.some(w=>w.id===c.id))return false;r.weapons.push({id:c.id,level:1,rank:s.ranks[c.id]||0,timer:0});collectWeapon(s,c.id);heal(r,r.bonus.discoveryHeal||0);}
 if(c.type==='artifact'){if((r.artifacts[c.id]||0)>=6||(!r.artifacts[c.id]&&Object.keys(r.artifacts).length>=ARTIFACT_SLOTS))return false;gainArtifact(r,c.id);}
 if(c.type==='heal')heal(r,30);
 if(c.type==='gold')r.gold+=25;
 recordLoadout(r);r.levelPending--;r.choices=[];return true;
}
export const earnedGold=r=>{const killGold=r.killGold??Math.min(r.gold,r.kills);return Math.max(0,killGold+Math.floor(Math.max(0,r.gold-killGold)*(1+(r.bonus.gold||0)))-(r.reviveSpent||0));};
export const reviveCost=r=>(r.paidRevives||0)<2?500*((r.paidRevives||0)+1):null;
export const reviveWallet=(r,s)=>s.gold+earnedGold(r);
export function buyRevive(r,s){
 const cost=reviveCost(r);if(!r.over||!r.awaitingRevive||r.claimed||r.won||cost===null||reviveWallet(r,s)<cost)return false;
 const bank=Math.min(s.gold,cost);s.gold-=bank;r.reviveSpent=(r.reviveSpent||0)+cost-bank;
 r.paidRevives=(r.paidRevives||0)+1;r.awaitingRevive=false;r.over=false;r.hp=r.maxHp*.5;r.damageCooldown=3;r.lastHurt=r.time;return true;
}
export function finishDeath(r){if(!r.over||!r.awaitingRevive)return false;r.awaitingRevive=false;return true;}
export function claimRun(r,s){if(!r.over||r.awaitingRevive||r.claimed||s.lastClaim===r.id)return false;r.claimed=true;s.lastClaim=r.id;s.runs++;s.challenge||=freshChallenge();const c=s.challenge,j=r.journeyStats||{};c.bestKills=Math.max(c.bestKills,r.kills);c.bestRituals=Math.max(c.bestRituals,r.rituals||0);for(const k of ['ritualKills','chests','noHitBosses','fastBosses'])c[k]+=j[k]||0;if(r.won&&j.eligible){if(!c.characterWins.includes(r.characterId||'rasa'))c.characterWins.push(r.characterId||'rasa');c.mapWins[r.mapId]=(c.mapWins[r.mapId]||0)+1;if(j.peakSlots<=3)c.limitedWins++;if(j.maxArtifacts===0)c.artifactlessWins++;if(j.damageTaken===0)c.flawlessWins++;}s.stats||=freshMeta().stats;s.stats.kills+=r.kills;s.stats.guardians+=r.miniBosses||0;s.stats.rituals+=r.rituals||0;if(r.won&&!s.clearedMaps.includes(r.mapId))s.clearedMaps.push(r.mapId);s.gold+=earnedGold(r);s.shards+=r.shards;s.bosses+=r.bosses;s.best=Math.max(s.best,r.time);s.heroXp+=Math.floor((r.kills*.4+r.time*.2+r.bosses*80+(r.won?150:0))*1.25*(1+(r.bonus.heroXp||0)));while(s.heroLevel<60&&s.heroXp>=heroXpForLevel(s.heroLevel)){s.heroXp-=heroXpForLevel(s.heroLevel);s.heroLevel++;}if(s.heroLevel===60)s.heroXp=0;return true;}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function effect(r,type,x,y,size,color,extra={}){r.effects.push({type,x,y,size,color,life:.4,maxLife:.4,...extra});}
export function recordDamage(r,e,amount,source={}){if(e.kind==='crate'||e.hp<=0||!Number.isFinite(amount)||amount<=0)return;const log=r.damageLog||=( {weapons:{},ritual:0,powerups:0,from:r.time} ),dealt=Math.min(e.hp,amount);if(source.ritual)log.ritual+=dealt;else{const id=source.weaponId||source.id;if(weapon(id))log.weapons[id]=(log.weapons[id]||0)+dealt;else log.powerups+=dealt;}}
function hit(r,e,damage,d){if(e.hp<=0)return;if(d.weaponId&&d.maxLife!==undefined&&d.hitIds===undefined&&!d.ritual){e.areaHits||={};const now=r.combatTime??r.time*COMBAT_SPEED;if((e.areaHits[d.weaponId]??-1)>now)return;e.areaHits[d.weaponId]=now+(d.pulse?.12:.5);}const elite=e.boss?1:0;damage*=elite&&d.ritual?.8:1;const critical=(d.crit||0)>0&&Math.random()<d.crit;damage*=critical?2:1;if(!e.boss&&!e.mini&&e.kind!=='crate'&&e.hp/e.maxHp<=(d.execute||0))damage=Math.max(damage,e.hp);recordDamage(r,e,damage,d);if(e.boss&&e.maxHp>0)chargeRitual(r,Math.min(e.hp,damage)/e.maxHp*RITUAL_PER_BOSS);e.hp-=damage;if(e.hp<=0&&d.ritual)e.killedByRitual=true;e.lastHitAngle=Math.atan2(e.y-r.y,e.x-r.x);if(r.time>=(e.numberAt||0)){effect(r,'damage',e.x,e.y-22,0,'#ffe5b0',{text:String(Math.round(damage))+(critical?'!':''),life:.65,maxLife:.65});e.numberAt=r.time+.16;}if(d.ritual&&r.bonus.ritualSlow)d={...d,slow:Math.max(d.slow||0,r.bonus.ritualSlow)};if(d.slow){e.slow=Math.max(e.slow||0,d.slow);e.slowTime=2*(d.statusDuration||1);}if(d.burn){e.burn=d.burn;e.burnTime=3*(d.statusDuration||1);e.burnRitual=!!d.ritual;e.burnWeapon=d.weaponId||d.id||null;}if(d.freeze||d.shock)e.freezeTime=Math.max(e.freezeTime||0,d.freeze||d.shock);if(d.root)e.rootTime=Math.max(e.rootTime||0,d.root);if(d.knock&&e.kind!=='crate'){const a=Math.atan2(e.y-r.y,e.x-r.x);e.x+=Math.cos(a)*d.knock;e.y+=Math.sin(a)*d.knock;constrainToWorld(r,e,e.radius||12);}if(d.healOnHit)heal(r,d.healOnHit);e.flash=.11;}
function zone(r,d,x,y,damage,extra={}){const window=effectWindow(r,d);if(!window.active&&!d.ritual)return;r.zones.push({x,y,visualKind:d.kind,weaponId:d.id,crit:d.crit,execute:d.execute,radius:d.range,color:d.color,life:d.duration||.45,maxLife:d.duration||.45,tick:0,damage,slow:d.slow||0,heal:d.heal||0,burn:d.burn||0,mine:d.kind==='mine',knock:d.knock||0,freeze:d.freeze||0,root:d.root||0,statusDuration:d.statusDuration||1,shards:d.shards||0,groundFire:!!d.groundFire,follow:!!d.follow,ritual:!!d.ritual,...extra,...(Number.isFinite(window.remaining)&&!d.ritual?{life:Math.min(d.duration||.45,window.remaining),maxLife:Math.min(d.duration||.45,window.remaining)}:{})});}
// The same derived stats power combat and the upgrade preview.
export function weaponStats(r,w){
 const base=weapon(w.id),g=pathStats(base.id,base.stage==='base'?w.level:1),a=artifactBonuses(r),area=Math.sqrt(1+a.area+g.area),reach=1+(r.bonus.reach||0)+a.reach+g.reach;
 const haste=g.haste,rank=w.rank||0,count=(base.count||1)+g.count+(['bolt','bird','boomerang'].includes(base.kind)?(r.bonus.projectiles||0):0);
 return {...base,rank,level:w.level,crit:r.bonus.crit||0,execute:r.bonus.execute||0,cleave:base.cleave||g.cleave,
 knock:(base.knock||0)*.55*(1+g.knock+(r.bonus.knock||0)),pierce:base.stage==='base'?(w.level>=7?1+g.pierce+(r.bonus.pierce||0):1):(base.pierce||1)+(r.bonus.pierce||0),
 damage:base.damage*.9*(1+g.damage)*(1+rank*.065)*(1+r.bonus.damage+a.damage)*(1+(w.resonance||0)*.04),
 interval:base.interval/(1+haste+(r.bonus.haste||0)+(r.moving?(r.bonus.moveHaste||0):0)+a.haste),
 range:base.range*reach*(['bolt','bird','boomerang','tether','lightning'].includes(base.kind)?1:area),
 speed:(base.speed||370)*(1+g.speed),count:count*(base.kind==='orbit'&&w.echoUntil>r.time?2:1),haste,
 radius:(base.size||(base.kind==='bird'?10:6))*(1+g.size)*area,
 duration:base.duration?base.duration*(1+g.duration)*(1+a.duration):undefined,statusDuration:1+a.duration+g.duration,
 splash:base.stage==='base'?(base.id==='ash_raven'&&w.level>=7?48*area:0):(base.splash||0)*area,orbitSpeed:(base.orbitSpeed||2.5)*(1+g.orbit),
 burn:(base.burn||0)+g.burn,slow:Math.min(.8,(base.slow||0)+g.slow),angle:(base.angle||1)+g.angle,
 flightTime:base.flightTime?base.flightTime*(1+g.flight):undefined,delay:Math.max(.2,(base.delay||.65)+g.delay),
 armDelay:Math.max(.3,(base.armDelay||.9)+g.delay),shards:(base.shards||0)+g.shards,shock:(base.shock||0)+g.shock,
 homing:!!base.homing&&['bolt','bird'].includes(base.kind)};
}
export const POWERUPS=['time_stop','magnet','fireblast','xp','bread'];
export const PICKUPS=[...POWERUPS,'upgrade'];
const worldHash=(x,y,seed)=>{const n=Math.sin(x*127.1+y*311.7+seed*93.1)*43758.5453;return n-Math.floor(n);};
// Deterministic scenery can be regenerated as the player explores. Broken crates stay broken.
export function ensureWorld(r){
 const props=new Map(r.props.filter(p=>distance(p,r)<1250&&insideWorld(r,p,p.radius+8)).map(p=>[p.id,p])),broken=new Set(r.brokenCrates),cx=Math.floor(r.x/240),cy=Math.floor(r.y/240);
 const add=p=>{if(distance(p,r)>p.radius+28&&!r.chests.some(c=>distance(p,c)<p.radius+42)&&!r.powerups.some(c=>distance(p,c)<p.radius+38)&&insideWorld(r,p,p.radius+8)&&!props.has(p.id)&&!broken.has(p.id)&&Math.hypot(p.x,p.y)>115)props.set(p.id,p);};
 for(let x=cx-4;x<=cx+4;x++)for(let y=cy-4;y<=cy+4;y++){
  const n=worldHash(x,y,r.seed),px=x*240+35+n*125,py=y*240+35+worldHash(y+21,x,r.seed)*125;
  if(n<.82)add({id:`prop:${x}:${y}`,x:px,y:py,radius:20+n*12,kind:n<.43?'rock':'tree'});
  else if(n>.9){const kind=n>.975?'house':n>.94?'ruin':'well';add({id:`landmark:${x}:${y}`,x:px,y:py,radius:kind==='house'?58:kind==='ruin'?43:25,kind});}

 }

 r.props=[...props.values()];
}
export function collisionMove(r,actor,dx,dy,radius){
 const resolve=()=>{for(const p of (frames.get(r)?.props?.near(actor.x,actor.y,radius+80)||r.props)){if(p.kind==='crate'||r.arena&&distance(p,r.arena)<r.arena.radius+100)continue;const min=radius+p.radius;if(Math.abs(actor.x-p.x)>min||Math.abs(actor.y-p.y)>min)continue;const d=distance(actor,p);if(d<min){const a=d?Math.atan2(actor.y-p.y,actor.x-p.x):0;actor.x=p.x+Math.cos(a)*min;actor.y=p.y+Math.sin(a)*min;}}};
 actor.x+=dx;resolve();constrainToWorld(r,actor,radius);actor.y+=dy;resolve();constrainToWorld(r,actor,radius);
}
export function moveEnemy(r,e,dt){
 if(r.arena&&!e.boss&&!e.arenaMember){const a=r.arena,min=a.radius+e.radius+8,d=Math.hypot(e.x-a.x,e.y-a.y)||1;if(d<min){e.x=a.x+(e.x-a.x)/d*min;e.y=a.y+(e.y-a.y)/d*min;}return;}

 const x=e.x,y=e.y,d=Math.hypot(r.x-x,r.y-y)||1,travel=e.speed*(1-e.slow)*dt,angle=Math.atan2(r.y-y,r.x-x);if(travel<=0)return;
 collisionMove(r,e,Math.cos(angle)*travel,Math.sin(angle)*travel,e.radius);
 if(Math.hypot(e.x-x,e.y-y)>=travel*.5&&Math.hypot(r.x-e.x,r.y-e.y)<d-travel*.15)return;
 // A blocked pursuer chooses a stable side and walks around the obstacle.
 const side=e.navSide||((e.id%2)?1:-1);
 for(const sign of [side,-side])for(const turn of [1.45,1.8,2.2]){const p={x,y};collisionMove(r,p,Math.cos(angle+sign*turn)*travel,Math.sin(angle+sign*turn)*travel,e.radius);if(Math.hypot(p.x-x,p.y-y)<travel*.7)continue;e.x=p.x;e.y=p.y;e.navSide=sign;return;}
}
export function spawnGroup(r,rng=Math.random){if(r.freezeTime>0||r.arena)return 0;
 const pace=encounterPacing(r.time,!!r.arena),available=pace.cap-r.enemies.filter(e=>!e.boss&&!e.mini&&e.hp>0).length,count=Math.min(available,6+Math.min(3,Math.floor(r.time/300))*4);if(count<=0)return 0;
 const center=offscreenSpawn(r,rng()*Math.PI*2,110),angle=Math.atan2(center.y-r.y,center.x-r.x),group=r.groupSerial=(r.groupSerial||0)+1;
 for(let i=0;i<count;i++){const e=spawn(r,false,false,false,rng),row=Math.floor(i/6),col=i%6-2.5;e.x=center.x+Math.cos(angle)*row*24-Math.sin(angle)*col*25;e.y=center.y+Math.sin(angle)*row*24+Math.cos(angle)*col*25;constrainToWorld(r,e,e.radius+5);if(Math.abs(e.x-r.x)<(r.viewHalfWidth||340)+e.radius&&Math.abs(e.y-r.y)<(r.viewHalfHeight||520)+e.radius)Object.assign(e,offscreenSpawn(r,angle,e.radius+90));e.groupId=group;}return count;
}
export function spawnCrate(r,rng=Math.random){
 if(r.props.filter(p=>p.kind==='crate'&&p.hp>0).length>=4)return false;
 const angle=rng()*Math.PI*2,d=180+rng()*100;let {x,y}=spawnPoint(r,d,angle,28);
 // Keep supplies clear of solid scenery, while crates themselves never block movement.
 for(let i=0;i<12;i++){if(!r.props.some(p=>p.kind!=='crate'&&Math.hypot(p.x-x,p.y-y)<p.radius+28))break;const a=angle+(i+1)*.55;({x,y}=spawnPoint(r,d,a,28));}
 r.props.push({id:`supply:${++r.crateSerial}`,x,y,radius:18,kind:'crate',hp:32,maxHp:32,life:100,drop:POWERUPS[Math.floor(rng()*POWERUPS.length)]});return true;
}
export function instantUpgrade(r,rng=Math.random){
 const weapons=r.weapons.filter(w=>weapon(w.id).stage==='base'&&w.level<7);
 if(weapons.length){const w=weapons[Math.floor(rng()*weapons.length)],from=w.level;w.level++;w.timer=0;r.lastUpgrade={type:'weapon',id:w.id,from,to:w.level};return r.lastUpgrade;}
 const arts=Object.keys(r.artifacts).filter(id=>r.artifacts[id]<6);
 if(arts.length){const id=arts[Math.floor(rng()*arts.length)],from=r.artifacts[id];gainArtifact(r,id);r.lastUpgrade={type:'artifact',id,from,to:r.artifacts[id]};return r.lastUpgrade;}
 r.gold+=75;heal(r,25);r.lastUpgrade={type:'supplies',gold:75,health:25};return r.lastUpgrade;
}
const frames=new WeakMap();
const damageTargets=r=>frames.get(r)?.targets||[...r.enemies,...r.props.filter(p=>p.kind==='crate')].filter(e=>e.hp>0);
const nearTargets=(r,x,y,radius)=>frames.get(r)?.grid?.near(x,y,radius)||damageTargets(r);
const refreshTargets=r=>{const targets=[...r.enemies,...r.props.filter(p=>p.kind==='crate')].filter(e=>e.hp>0),frame=frames.get(r);if(frame){frame.targets=targets;frame.ids=new Map(targets.map(e=>[e.id,e]));frame.grid=new SpatialGrid(targets);}};
export function applyPowerup(r,kind,rng=Math.random){
 if(!PICKUPS.includes(kind))return false;
 r.gold+=r.bonus.powerGold||0;
 if(kind==='upgrade')instantUpgrade(r,rng);
 if(kind==='time_stop'){r.freezeTime=Math.max(r.freezeTime,3*(1+(r.bonus.powerDuration||0)+artifactBonuses(r).duration));effect(r,'time_blast',r.x,r.y,620,'#81dfff',{life:.8,maxLife:.8});};
 if(kind==='magnet'){for(const g of r.gems){g.magnet=true;g.magnetAge=0;}effect(r,'magnet_blast',r.x,r.y,180,'#c1a7ed',{life:.8,maxLife:.8});}
 if(kind==='fireblast'){r.blasts||=[];r.blasts.push({id:r.entityId++,x:r.x,y:r.y,radius:560,age:0,duration:.9,damage:220+r.level*20,hitIds:[]});effect(r,'fire_blast',r.x,r.y,560,'#ff9257',{life:1.2,maxLife:1.2,expansion:.9});}
 if(kind==='bread'){heal(r,30);effect(r,'spark',r.x,r.y,48,'#b8f099',{life:.7,maxLife:.7});}
 if(kind==='xp')r.xp+=(12+r.level*2)*.5*(1+r.bonus.xp);
 effect(r,'ring',r.x,r.y,120,kind==='fireblast'?'#ff9257':kind==='xp'?'#e9cd81':'#93ddf2',{life:.8,maxLife:.8});return true;
}

function projectile(r,d,angle,damage,extra={}){
 const life=d.homing?Math.min(2,d.flightTime||(d.kind==='bird'?1.8:1.6)):(d.flightTime||1.4);if(r.shots.length>=180)r.shots.shift();
 r.shots.push({x:r.x,y:r.y,ox:r.x,oy:r.y,angle,speed:d.speed,life,maxLife:life,damage,crit:d.crit,execute:d.execute,color:d.color,splash:d.splash||0,dive:!!d.dive,solarTrail:!!d.solarTrail,statusDuration:d.statusDuration||1,ritual:!!d.ritual,pierce:d.pierce||1,initialPierce:d.pierce||1,hitIds:[],radius:d.radius,weaponId:d.id,rank:d.rank||0,kind:d.kind,burn:d.burn||0,healOnHit:d.healOnHit||0,homing:d.homing,turnRate:d.turnRate||5,seekRadius:Math.max(520,d.range*1.3),elite:!!d.elite,targetId:null,trail:[],...extra});
}
export function attack(r,w){
 const effectStart=r.effects.length;const d=weaponStats(r,w);if(!effectWindow(r,d).active)return;const damage=d.damage,range=d.range,count=d.count;
 const enemies=damageTargets(r).filter(e=>e.hp>0).sort((a,b)=>d.elite?(Number(b.boss)-Number(a.boss)||distance(a,r)-distance(b,r)):distance(a,r)-distance(b,r));
 const targets=enemies.filter(e=>distance(e,r)<(['meteor','puddle'].includes(d.kind)||d.deathMark?600:range)),target=targets[0];
 if(d.kind==='sanctuary'){zone(r,d,r.x,r.y,damage,{follow:true});effect(r,'ring',r.x,r.y,range,d.color,{life:1,maxLife:1});}
 else if(d.kind==='pulse'){effect(r,'ring',r.x,r.y,range,d.color);for(const e of enemies)if(distance(e,r)<range)hit(r,e,damage,d);for(let i=1;i<count;i++)zone(r,{...d,duration:.02},r.x,r.y,damage,{delay:i*.17,pulse:true});if(d.heal)heal(r,d.heal);if(d.shield)r.ward=Math.min(Math.max(d.shield,r.bonus.shieldHp||0),(r.ward||0)+d.shield);}
 else if(d.kind==='trail'){for(let i=0;i<count;i++){const a=r.angle+Math.PI/2,offset=(i-(count-1)/2)*d.range*.8;zone(r,d,r.x+Math.cos(a)*offset,r.y+Math.sin(a)*offset,damage,{angle:r.angle});}}
 else if(d.kind==='mine'){for(let i=0;i<count;i++){if(d.deathMark){const e=targets[i];if(!e)continue;zone(r,d,e.x+(i>=targets.length?Math.cos(i*2.4)*48:0),e.y+(i>=targets.length?Math.sin(i*2.4)*48:0),damage,{life:1,maxLife:1,armed:d.armDelay||.9,deathMark:true,targetId:e.id,angle:r.angle});effect(r,'line',r.x,r.y,0,d.color,{tx:e.x,ty:e.y,life:.2,maxLife:.2});}else{const a=r.angle+Math.PI+i*Math.PI*2/count,spread=count>1?52:0;zone(r,d,r.x+Math.cos(a)*spread,r.y+Math.sin(a)*spread,damage,{life:d.duration,armed:.45,angle:r.angle});}}}
 else if(d.id==='resin_web'){if(target)for(let i=0;i<count;i++){const e=targets[i%targets.length],a=Math.atan2(e.y-r.y,e.x-r.x),offset=(i-(count-1)/2)*d.range*.8;projectile(r,{...d,kind:'bolt',radius:12,homing:false,flightTime:2},a,damage,{web:{...d},webX:e.x-Math.sin(a)*offset,webY:e.y+Math.cos(a)*offset});const p=r.shots.at(-1);p.angle=Math.atan2(p.webY-p.y,p.webX-p.x);}}
 else if(d.kind==='puddle'){if(d.follow)zone(r,d,r.x,r.y,damage,{follow:true});for(let i=0;i<count;i++){const e=targets[i];if(e)zone(r,d,e.x+(i?Math.cos(i*2)*d.range*.5:0),e.y+(i?Math.sin(i*2)*d.range*.5:0),damage);}}
 else if(d.kind==='orbit'){effect(r,'orbit_cast',r.x,r.y,range,d.color);}
 else if(d.kind==='cone'){const struck=new Set();for(let i=0;i<count;i++){const a=(target?Math.atan2(target.y-r.y,target.x-r.x):r.angle)+(i-(count-1)/2)*.2;effect(r,'cone',r.x,r.y,range,d.color,{angle:a,width:d.angle});for(const e of enemies)if(!struck.has(e.id)&&distance(e,r)<range&&Math.abs(angleDelta(Math.atan2(e.y-r.y,e.x-r.x),a))<d.angle/2){hit(r,e,damage,d);struck.add(e.id);}}}
 else if(d.kind==='tether'||d.kind==='lightning'){let origin=r;const struck=new Set();for(const e of targets.slice(0,count)){effect(r,'line',origin.x,origin.y,0,d.color,{tx:e.x,ty:e.y});if(!struck.has(e.id)){hit(r,e,damage,d);struck.add(e.id);}if(d.cleave)for(const other of enemies)if(!struck.has(other.id)&&distanceToSegment(other,origin.x,origin.y,e)<other.radius+12){hit(r,other,damage,d);struck.add(other.id);}if(d.kind==='lightning')origin=e;}}
 else if(d.kind==='meteor'){for(let i=0;i<count;i++){const e=targets[i];if(e)zone(r,d,e.x+(i?Math.cos(i*2)*35:0),e.y+(i?Math.sin(i*2)*35:0),damage,{delay:d.delay||.65,initialDelay:d.delay||.65,life:.45,maxLife:.45,meteor:true,targetId:e.id});}}
 else if(d.kind==='solar'){for(let i=0;i<count;i++)projectile(r,d,r.time+i*Math.PI*2/count,damage);zone(r,{...d,range:65,duration:2},r.x,r.y,damage*.4);}
 else if(target){for(let i=0;i<count;i++){const e=d.homing?targets[i%targets.length]:target,a=Math.atan2(e.y-r.y,e.x-r.x);projectile(r,d,a+(d.dive?.65:0)+(i-(count-1)/2)*.18,damage,{targetId:d.homing?e.id:null});}}
 for(let i=effectStart;i<r.effects.length;i++){r.effects[i].visualKind=d.kind;r.effects[i].weaponId=d.id;}
}
export function steerProjectile(r,p,dt){
 if(!p.homing)return;
 const eligible=e=>e.hp>0&&!p.hitIds.includes(e.id)&&distance(e,p)<=p.seekRadius;
 let target=frames.get(r)?.ids?.get(p.targetId)||damageTargets(r).find(e=>e.id===p.targetId);if(target&&!eligible(target))target=null;
 if(p.elite&&!target?.boss)target=r.enemies.filter(e=>e.boss&&eligible(e)).sort((a,b)=>distance(a,p)-distance(b,p))[0]||target;
 if(!target){let closest=Infinity;for(const e of nearTargets(r,p.x,p.y,p.seekRadius)){if(!eligible(e))continue;const d=(e.x-p.x)**2+(e.y-p.y)**2;if(d<closest){closest=d;target=e;}}}
 p.targetId=target?.id??null;if(!target)return;
 const desired=Math.atan2(target.y-p.y,target.x-p.x),delta=angleDelta(desired,p.angle),limit=p.turnRate*dt;
 p.angle+=Math.max(-limit,Math.min(limit,delta));
}
// Match the rotating blade's visible body; other shots get a small forgiving margin.
export const projectileHitRadius=p=>p.kind==='boomerang'?20*Math.max(.8,Math.min(1.7,(p.radius||6)/6))+3:(p.radius||6)+4;
export function projectileTouchesEnemy(p,oldX,oldY,e){
 const radius=projectileHitRadius(p)+e.radius;if(e.kind==='crate')return distanceToSegment(e,oldX,oldY,p)<radius;
 const top={x:e.x,y:e.y-e.radius*1.7},feet={x:e.x,y:e.y};
 // Distance between the shot segment and a vertical capsule through the sprite's body.
 if(Math.abs(p.x-oldX)>.00001){const t=(e.x-oldX)/(p.x-oldX),y=oldY+t*(p.y-oldY);if(t>=0&&t<=1&&y>=top.y&&y<=feet.y)return true;}
 return Math.min(distanceToSegment(top,oldX,oldY,p),distanceToSegment(feet,oldX,oldY,p),distanceToSegment({x:oldX,y:oldY},top.x,top.y,feet),distanceToSegment(p,top.x,top.y,feet))<radius;
}
function distanceToSegment(e,x,y,p){const dx=p.x-x,dy=p.y-y,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((e.x-x)*dx+(e.y-y)*dy)/length)):0;return Math.hypot(e.x-x-t*dx,e.y-y-t*dy);}

export function spawn(r,boss=false,final=false,mini=false,rng=Math.random){if(r.arena&&!boss)return null;
 const a=rng()*Math.PI*2,minute=r.time/60,range=boss||mini?330:340+rng()*130;
 const tiers=enemyTierRange(r.time),archetype=Math.min(tiers.length-1,Math.floor(rng()*tiers.length)),tier=tiers[archetype];
 const hp=boss?(2200+minute*240)*(final?1.5:1):mini?600+minute*75:tierHealth(tier);
 const e={id:r.entityId++,...(boss?spawnPoint(r,range,a,35):offscreenSpawn(r,a,mini?35:28)),hp,maxHp:hp,speed:boss?84:mini?83:[63,89,51][archetype]+Math.min(12,minute*.6),radius:boss?29:mini?23:(tier>=7?21:[12,10,17][archetype]),boss,mini,final,tier,archetype,color:boss?'#ba7260':mini?'#d09c55':['#6f9293','#9e82b7','#8d7465'][archetype],slow:0,slowTime:0,flash:0};r.enemies.push(e);if(boss)startArena(r,e);return e;
}
export const waveSize=time=>encounterPacing(time).count;
export const waveInterval=time=>encounterPacing(time).interval;

export function step(r,input,dt){
 if(r.over||r.levelPending||r.chestReward)return [];frames.set(r,{targets:null,grid:null,props:new SpatialGrid(r.props.filter(p=>p.kind!=='crate'))});const realDt=Math.max(0,Math.min(.05,dt));dt=realDt*COMBAT_SPEED;r.combatTime=(r.combatTime??r.time*COMBAT_SPEED)+dt;const events=[];r.worldClock=Math.max(0,r.worldClock-dt);if(!r.props.length||r.worldClock===0){ensureWorld(r);r.worldClock=.5;frames.get(r).props=new SpatialGrid(r.props.filter(p=>p.kind!=='crate'));}r.freezeTime=Math.max(0,r.freezeTime-dt);r.time+=realDt;r.damageCooldown=Math.max(0,r.damageCooldown-dt);const map=MAPS.find(m=>m.id===r.mapId);
 r.moving=!!(input.x||input.y);const norm=Math.hypot(input.x,input.y)||1,speed=142*(1+r.bonus.speed+(r.time-(r.lastHurt??-5)>4?(r.bonus.sprint||0):0));
 if(input.x||input.y){collisionMove(r,r,input.x/norm*speed*dt,input.y/norm*speed*dt,13);r.angle=Math.atan2(input.y,input.x);}
 r.spawnClock-=realDt;if(r.spawnClock<=0&&r.freezeTime<=0&&!r.arena&&!r.finalSpawned){const pace=encounterPacing(r.time,!!r.arena),available=pace.cap-r.enemies.filter(e=>!e.boss&&!e.mini).length;for(let i=0;i<Math.min(pace.count,available);i++)spawn(r);r.spawnClock=pace.interval;}
 if(r.nextGroup===undefined){r.nextGroup=r.time+8;r.groupSerial=0;}if(r.freezeTime<=0&&r.time>=r.nextGroup&&!r.finalSpawned&&!r.arena){spawnGroup(r);r.nextGroup=r.time+34;}
 if(!r.arena&&r.freezeTime<=0&&r.time>=r.nextMini&&r.nextMini<map.duration&&!r.finalSpawned){spawn(r,false,false,true);r.nextMini=nextMiniTime(r.nextMini);events.push('mini_boss');}
 if(r.freezeTime<=0&&r.time>=r.nextBoss&&r.nextBoss<=map.duration&&!r.arena&&!r.victoryPending){const final=r.nextBoss===map.duration;spawn(r,true,final);r.nextBoss+=300;r.finalSpawned=final;events.push('boss');}
 if(r.time>=r.nextCrate&&!r.finalSpawned){spawnCrate(r);r.nextCrate=r.time+SUPPLY_INTERVAL;}
 r.healClock+=dt;if(r.healClock>4){r.healClock=0;heal(r,.5+4*artifactBonuses(r).regen+4*(r.bonus.regen||0));}
 refreshTargets(r);stepEncounters(r,dt,input,events,combatAPI);
 for(const w of r.weapons){w.timer-=dt;if(w.timer<=0){attack(r,w);w.volleys=(w.volleys||0)+1;if(r.bonus.volleyEcho&&w.volleys%5===0){attack(r,w);if(weapon(w.id).kind==='orbit')w.echoUntil=r.time+weaponStats(r,w).interval;}if(r.bonus.echo&&Math.random()<r.bonus.echo)attack(r,w);w.timer=weaponStats(r,w).interval;}}
 stepOrbits(r,dt);
 for(const e of r.enemies){e.flash=Math.max(0,e.flash-dt);if(e.slowTime>0)e.slowTime-=dt;else e.slow=0;if(e.burnTime>0){e.burnTime-=dt;recordDamage(r,e,e.burn*dt,{ritual:e.burnRitual,weaponId:e.burnWeapon});e.hp-=e.burn*dt;if(e.hp<=0&&e.burnRitual)e.killedByRitual=true;}const d=distance(e,r)||1;if(r.moving&&d<100&&r.bonus.trailSlow)e.slow=Math.max(e.slow,r.bonus.trailSlow);e.freezeTime=Math.max(0,(e.freezeTime||0)-dt);e.rootTime=Math.max(0,(e.rootTime||0)-dt);if(r.freezeTime<=0&&e.freezeTime<=0&&e.rootTime<=0&&!e.dashing)moveEnemy(r,e,dt);
  if((!r.arena||e.boss||e.arenaMember)&&r.freezeTime<=0&&distance(e,r)<e.radius+12&&r.damageCooldown<=0&&e.hp>0){hurtPlayer(r,e.boss?38:e.mini?27:10+(e.tier||1)*3,events);}
 }
 refreshTargets(r);for(const p of r.shots){p.life-=p.homing?realDt:dt;if(p.life<=0)continue;if(p.web){const distance=Math.hypot(p.webX-p.x,p.webY-p.y),travel=p.speed*dt;if(distance<=travel){p.x=p.webX;p.y=p.webY;zone(r,p.web,p.x,p.y,p.damage);p.life=0;}else{p.x+=(p.webX-p.x)/distance*travel;p.y+=(p.webY-p.y)/distance*travel;}continue;}const oldX=p.x,oldY=p.y;steerProjectile(r,p,dt);if(p.dive)p.speed=Math.min(600,p.speed+dt*420);if(p.solarTrail){p.trailClock=(p.trailClock||0)-dt;if(p.trailClock<=0){p.trailClock=.2;zone(r,{id:p.weaponId,kind:'trail',range:28,color:p.color,duration:.8},p.x,p.y,p.damage*.2,{burn:p.burn});}}if(p.kind==='boomerang'&&p.life<p.maxLife/2){if(!p.returning){p.returning=true;p.hitIds=[];p.pierce=p.initialPierce||Math.max(1,p.pierce);}p.angle=Math.atan2((p.returnY??r.y)-p.y,(p.returnX??r.x)-p.x);}if(p.homing){p.trail=p.trail||[];p.trail.push({x:p.x,y:p.y});if(p.trail.length>8)p.trail.shift();}p.x+=Math.cos(p.angle)*p.speed*dt;p.y+=Math.sin(p.angle)*p.speed*dt;for(const e of nearTargets(r,(oldX+p.x)/2,(oldY+p.y)/2,Math.hypot(p.x-oldX,p.y-oldY)/2+projectileHitRadius(p)+90)){if(p.pierce>0&&e.hp>0&&!p.hitIds.includes(e.id)&&projectileTouchesEnemy(p,oldX,oldY,e)){hit(r,e,p.damage,p);if(p.splash){effect(r,'ring',e.x,e.y,p.splash,p.color,{life:.4,maxLife:.4,visualKind:'pulse',weaponId:p.weaponId});for(const other of nearTargets(r,e.x,e.y,p.splash+32))if(other!==e&&other.hp>0&&distance(other,e)<p.splash)hit(r,other,p.damage*.7,p);}p.hitIds.push(e.id);p.pierce--;if(p.pierce<=0){if(p.kind!=='boomerang'||p.returning)p.life=0;break;}}}}
 r.shots=r.shots.filter(p=>p.life>0);
 for(const z of r.zones){if(z.follow){z.x=r.x;z.y=r.y;}if(z.targetId&&(z.delay>.3||z.armed>.3)){const target=frames.get(r)?.ids?.get(z.targetId);if(target?.hp>0){z.x=target.x;z.y=target.y;}}if(z.delay>0){z.delay-=dt;continue;}z.life-=dt;z.tick-=dt;if(z.armed>0){z.armed-=dt;continue;}if(z.mine){if(z.deathMark||damageTargets(r).some(e=>distance(e,z)<45)){effect(r,'ring',z.x,z.y,z.radius,z.color,{visualKind:z.visualKind,weaponId:z.weaponId});for(const e of nearTargets(r,z.x,z.y,z.radius+32))if(e.hp>0&&distance(e,z)<z.radius)hit(r,e,z.damage,z);z.life=0;}}else if(z.tick<=0){z.tick=.55;if(z.meteor&&!z.impacted){z.impacted=true;if(z.shards)for(let i=0;i<z.shards;i++)projectile(r,{id:z.weaponId,kind:'bolt',color:z.color,speed:380,radius:5,pierce:3},i*Math.PI*2/z.shards,z.damage*.3,{x:z.x,y:z.y,ritual:z.ritual,hitIds:damageTargets(r).filter(e=>distance(e,z)<z.radius).map(e=>e.id)});if(z.groundFire)zone(r,{id:z.weaponId,kind:'trail',range:z.radius*.8,color:z.color,duration:3},z.x,z.y,z.damage*.18,{burn:z.burn});}if(z.pulse)effect(r,'ring',z.x,z.y,z.radius,z.color,{visualKind:z.visualKind,weaponId:z.weaponId});for(const e of nearTargets(r,z.x,z.y,z.radius+32))if(e.hp>0&&distance(e,z)<z.radius)hit(r,e,z.damage,z);if(z.heal&&distance(r,z)<z.radius)heal(r,z.heal);}}
 r.zones=r.zones.filter(z=>z.life>0).slice(-240);for(const fx of r.effects)fx.life-=dt;r.effects=[...r.effects.filter(f=>f.life>0&&f.type!=='soul_release').slice(-140),...r.effects.filter(f=>f.life>0&&f.type==='soul_release').slice(-64)];
 for(const blast of r.blasts||[]){blast.age=Math.min(blast.duration,blast.age+dt);const edge=blast.radius*blast.age/blast.duration;for(const e of nearTargets(r,blast.x,blast.y,edge+50))if(e.hp>0&&!blast.hitIds.includes(e.id)&&distance(e,blast)<=edge){hit(r,e,blast.damage,{burn:8,powerup:true});blast.hitIds.push(e.id);}}
 r.blasts=(r.blasts||[]).filter(b=>b.age<b.duration);
 for(const p of r.powerups){p.life-=dt;if(distance(p,r)<(p.kind==='upgrade'?54:38)){applyPowerup(r,p.kind);p.life=0;events.push(p.kind);}}
 r.powerups=r.powerups.filter(p=>p.life>0);
 for(const e of r.enemies.filter(e=>e.hp<=0)){events.push('kill');effect(r,'soul_release',e.x,e.y,e.radius,e.boss||e.mini?'#ffda8c':'#adf4f1',{seed:e.id,elite:!!(e.boss||e.mini),sprite:{id:e.id,radius:e.radius,tier:e.tier,boss:e.boss,mini:e.mini},poseTime:r.combatTime,life:1.1,maxLife:1.1});heal(r,r.bonus.healOnKill||0);effect(r,'blood',e.x,e.y,e.boss||e.mini?32:16,'#9d3e51',{seed:e.id,angle:e.lastHitAngle||0,life:.6,maxLife:.6});effect(r,'stain',e.x,e.y,e.boss||e.mini?24:11,'#632d38',{seed:e.id,life:5,maxLife:5});effect(r,'burst',e.x,e.y,e.boss||e.mini?85:24,e.boss||e.mini?'#f5ce80':'#94d7df',{life:.65,maxLife:.65});r.kills++;if(e.killedByRitual)r.journeyStats.ritualKills++;if(!e.boss)chargeRitual(r,e.mini?RITUAL_PER_GUARDIAN:RITUAL_PER_KILL);r.gold+=1;r.killGold=(r.killGold??Math.min(r.gold-1,r.kills-1))+1;if(!e.boss&&!e.mini&&r.bonus.shardChance&&Math.random()<r.bonus.shardChance)r.shards++;r.gems.push({x:e.x,y:e.y,value:(e.boss?30:e.mini?12:gemValue(e.tier))*(e.boss||e.mini?1+(r.bonus.eliteXp||0):1)});if(e.mini){r.miniBosses++;r.cores++;r.shards++;r.chests.push({id:r.entityId++,kind:'mini',x:e.x,y:e.y,final:false});events.push('mini_clear');}if(e.boss){r.bosses++;r.shards+=(e.final?3:1)+(r.bonus.bossShard||0);bossDefeated(r,e);if(!e.final){r.cores++;if(r.time>=900)r.catalysts++;}heal(r,35);events.push('boss_clear');}}
 for(const p of r.props){if(p.kind!=='crate')continue;p.life=(p.life??100)-dt;p.flash=Math.max(0,(p.flash||0)-dt);if(p.burnTime>0){p.burnTime-=dt;p.hp-=p.burn*dt;}if(p.hp<=0){if(!r.brokenCrates.includes(p.id)){r.brokenCrates.push(p.id);r.gold+=r.bonus.crateGold||0;if(r.bonus.crateLuck&&Math.random()<r.bonus.crateLuck)r.powerups.push({kind:POWERUPS[Math.floor(Math.random()*POWERUPS.length)],x:p.x+25,y:p.y,life:90});r.powerups.push({kind:p.drop,x:p.x,y:p.y,life:90});effect(r,'burst',p.x,p.y,42,'#c89659',{life:.65,maxLife:.65});events.push('crate');}}}
 r.props=r.props.filter(p=>p.kind!=='crate'||p.hp>0&&p.life>0);
 r.enemies=r.enemies.filter(e=>e.hp>0&&!e.retired&&distance(e,r)<Math.max(1000,Math.hypot(r.viewHalfWidth||340,r.viewHalfHeight||520)+350));
 for(const g of r.gems){let d=distance(g,r);if(g.magnet){g.magnetAge=(g.magnetAge||0)+realDt;const move=Math.min(d,(400+g.magnetAge*1600)*realDt);if(d){g.x+=(r.x-g.x)/d*move;g.y+=(r.y-g.y)/d*move;}d=distance(g,r);}else if(d<105*(1+(r.bonus.pickup||0))){g.x+=(r.x-g.x)*Math.min(1,dt*8);g.y+=(r.y-g.y)*Math.min(1,dt*8);}if(d<20){effect(r,'spark',g.x,g.y,16,'#94d7df',{life:.3,maxLife:.3});r.xp+=g.value*.55*(1+r.bonus.xp);g.taken=true;}}
 r.gems=r.gems.filter(g=>!g.taken);if(r.gems.length>600){const old=r.gems.splice(0,r.gems.length-500);r.gems[0].value+=old.reduce((n,g)=>n+g.value,0);}
 while(r.xp>=r.nextXp){r.xp-=r.nextXp;r.level++;r.levelPending++;r.nextXp=xpForLevel(r.level);heal(r,4);events.push('level');}
 if(r.hp>0&&r.hp<r.maxHp*.25&&r.bonus.lastStand&&r.time-(r.lastStandAt??-60)>=60){heal(r,r.maxHp*r.bonus.lastStand);r.lastStandAt=r.time;events.push('second_wind');}if(r.bonus.shieldHp&&r.time-(r.lastHurt??-5)>4)r.ward=Math.min(r.bonus.shieldHp,(r.ward||0)+dt*3);if(r.hp<=0&&(r.paidRevives||0)<2&&r.bonus.revive&&r.revives<r.bonus.revive){r.hp=r.maxHp*.4;r.revives++;r.damageCooldown=3;events.push('revive');}
 if(r.hp<=0){r.hp=0;r.over=true;r.awaitingRevive=(r.paidRevives||0)<2;events.push('death');}frames.delete(r);return events;
}

export function orbitalPositions(r,w,time=r.combatTime??r.time*COMBAT_SPEED){const d=weaponStats(r,w);return Array.from({length:d.count},(_,i)=>{const a=time*d.orbitSpeed+i*Math.PI*2/d.count;return {x:r.x+Math.cos(a)*d.range,y:r.y+Math.sin(a)*d.range};});}
function stepOrbits(r,dt){for(const w of r.weapons){const d=weaponStats(r,w);if(d.kind!=='orbit'||!effectWindow(r,d).active)continue;const current=orbitalPositions(r,w),previous=orbitalPositions(r,w,(r.combatTime??r.time*COMBAT_SPEED)-dt);for(const e of damageTargets(r)){e.orbitHits||={};if((e.orbitHits[w.id]||0)>r.time)continue;for(let i=0;i<current.length;i++)if(distanceToSegment(e,previous[i].x,previous[i].y,current[i])<e.radius+d.radius+10){hit(r,e,d.damage,d);e.orbitHits[w.id]=r.time+Math.max(.22,d.interval/2);break;}}}}
const combatAPI={hit,zone,projectile,effect,heal};
export const activateRitual=r=>invokeRitual(r,combatAPI);
export const openChest=(r,id,rng)=>collectChest(r,id,heal,rng);
