// Until V1.0.0 (Google Play) every release is a public beta. Last digit 0-9, then the middle digit rolls over.
export const VERSION = {name:'0.2.0',build:125,channel:'direct',save:6,beta:true};
export const RANKS = ['D','C','B','A','S','SS','SSS','SSS+'];
export const RANK_NAMES = ['Common','Uncommon','Rare','Epic','Legendary','Mythical','Ancient','Divine'];
export const RANK_COLORS = ['#111820','#a2aab3','#bb83f4','#f59b48','#ffcf58','#ff6668','#ff993b','#fff8ce'];
export const ARTIFACTS = [
 {id:'linen_thread',name:'Linen Thread',theme:'Armor',stat:'armor',step:.5,unit:'flat'},
 {id:'mirror_shard',name:'Mirror Shard',theme:'Effect duration',stat:'duration',step:.05,unit:'percent'},
 {id:'ember_heart',name:'Ember Heart',theme:'Damage',stat:'damage',step:.035,unit:'percent'},
 {id:'wind_knot',name:'Wind Knot',theme:'Attack speed',stat:'haste',step:.03,unit:'percent'},
 {id:'ember_pouch',name:'Ember Pouch',theme:'Effect area',stat:'area',step:.05,unit:'percent'},
 {id:'spring_drop',name:'Spring Drop',theme:'Health per second',stat:'regen',step:.15,unit:'regen'},
 {id:'root_sigil',name:'Root Sigil',theme:'Maximum health',stat:'health',step:.04,unit:'percent'},
 {id:'astral_lens',name:'Astral Lens',theme:'Reach',stat:'reach',step:.04,unit:'percent'},
 // V0.2.1 artifacts
 {id:'lodestone',name:'Lodestone',theme:'Pickup range',stat:'pickup',step:.15,unit:'percent'},
 {id:'fortune_coin',name:'Fortune Coin',theme:'Gold find',stat:'greed',step:.08,unit:'percent'},
 {id:'hare_foot',name:"Hare's Foot",theme:'Movement speed',stat:'speed',step:.05,unit:'percent'},
 {id:'falcon_feather',name:'Falcon Feather',theme:'Projectile speed',stat:'velocity',step:.08,unit:'percent'},
 {id:'owl_lens',name:'Owl Lens',theme:'Field of view',stat:'vision',step:.05,unit:'percent'},
 {id:'luck_clover',name:'Four-leaf Clover',theme:'Critical chance',stat:'luck',step:.03,unit:'percent'}
].map(a=>({...a,maxLevel:6,icon:'',label:a.theme}));
export const artifactValue=(id,level)=>{const a=ARTIFACTS.find(a=>a.id===id);return a?`+${a.unit==='percent'?Math.round(a.step*level*100)+'%':a.unit==='regen'?(a.step*level).toFixed(2)+'/s':a.step*level}`:'';};
export const artifactBonuses=r=>Object.fromEntries(ARTIFACTS.map(a=>[a.stat,a.step*(r.artifacts[a.id]||0)]));
const base = (id,name,icon,kind,color,damage,interval,range,description,extra={}) => ({id,name,icon,kind,color,damage,interval,range,description,stage:'base',capacity:1,...extra});
export const BASES = [
 base('iron_bell','Iron Bell','♧','pulse','#efd798',22,1.6,115,'A ringing wave pushes nearby spirits away.',{knock:36}),
 base('amber_needle','Amber Needle','⟐','bolt','#ffba58',21,.8,420,'Amber missiles seek a spirit. Piercing unlocks at the final upgrade.',{pierce:2,speed:370,homing:true,turnRate:6}),
 base('ember_coil','Ember Coil','◎','trail','#f98555',13,1.1,56,'Leave burning embers along your path.',{duration:3,burn:3}),
 base('spring_vessel','Spring Vessel','◈','puddle','#7ae0d8',13,2.5,83,'A spring erupts beneath a nearby spirit.',{duration:3,slow:.2}),
 base('ash_raven','Ash Raven','⌁','bird','#bfadfa',29,1.4,470,'A raven dives into one spirit. The final upgrade adds an impact burst.',{pierce:1,speed:260,homing:true,turnRate:8,dive:true,splash:48}),
 base('thread_spindle','Thread Spindle','⋈','tether','#cce8d3',18,1.3,260,'Threads strike the three closest spirits.',{count:3}),
 base('hollow_crown','Hollow Crown','♜','orbit','#b4d083',13,.5,88,'Two thorns circle their bearer.',{count:2}),
 base('star_seed','Star Seed','✧','meteor','#95c9ff',40,2.4,75,'Stars fall on nearby enemies after a warning.',{delay:.65}),
 base('moon_sickle','Moon Sickle','☽','boomerang','#d0deef',23,1.6,560,'A crescent strikes once outward and once returning. Final mastery adds piercing.',{pierce:6,speed:360,flightTime:2.6}),
 base('thorn_lantern','Thorn Lantern','♢','cone','#e9a971',32,1.5,170,'Lantern light turns toward a nearby spirit and burns a fan.',{angle:1.25,burn:2}),
 base('grave_compass','Grave Compass','✥','mine','#a8c5b5',46,2.7,135,'Marks a nearby enemy. After 0.9 seconds, the marked ground explodes.',{duration:1,deathMark:true}),
 base('storm_chime','Storm Chime','ϟ','lightning','#acdeff',25,1.7,320,'Lightning leaps between three spirits.',{count:3}),
 // V0.2.1 elemental arsenal: slash, ice, poison, thunder, arrows, reaping and ricochet.
 base('smith_cleaver',"Smith's Cleaver",'⚔','slash','#e8eef4',30,1.25,118,'A heavy cleaver sweeps a wide arc in front of you.',{angle:2.1,knock:24,element:'slash'}),
 base('frost_distaff','Frost Distaff','❄','bolt','#a9e6ff',16,1.1,380,'Ice shards chill spirits; chilled spirits freeze solid.',{count:2,speed:300,pierce:2,slow:.35,freeze:.22,size:6,element:'ice'}),
 base('viper_censer','Viper Censer','♨','trail','#8be36a',9,.9,50,'A swinging censer leaves clouds of venom that poison spirits.',{duration:3.5,burn:5,slow:.12,element:'poison'}),
 base('thunder_drum','Thunder Drum','⦿','pulse','#b9c8ff',20,2,140,'Each drumbeat sends out a thunder wave that stuns spirits.',{knock:14,shock:.3,count:2,element:'thunder'}),
 base('rowan_bow','Rowan Bow','➶','bolt','#e05a4a',24,.95,520,'Rowan arrows fly straight and pierce through lines of spirits.',{speed:560,pierce:3,size:5,flightTime:1.1,element:'pierce'}),
 base('grave_scythe','Grave Scythe','☠','slash','#c8d0e0',38,2.3,135,'A full circle of the scythe; badly wounded spirits are reaped outright.',{angle:6.28,execute:.18,element:'death'}),
 base('hail_sling','Hail Sling','●','bolt','#dfe8f0',22,1.3,400,'Hailstones ricochet from spirit to spirit.',{speed:380,homing:true,turnRate:4,bounce:2,size:7,element:'ice'})
];
// Each row is a real alternative form, not an additional upgrade step.
const evolutionRows = [
 ['iron_bell','oath_bell','Oath Bell','linen_thread','A broad pulse shields the bearer.',{damage:36,range:165,shield:24,knock:65,count:5}],
 ['iron_bell','mourning_echo','Mourning Echo','mirror_shard','The bell becomes five linked echoes.',{kind:'tether',damage:60,interval:.8,count:5,range:360}],
 ['amber_needle','sun_spindle','Sun Spindle','ember_heart','Five solar needles pierce and burst into burning amber.',{damage:34,count:5,pierce:6,burn:4,splash:38}],
 ['amber_needle','resin_web','Resin Web','wind_knot','Twin visible resin shots open stronger webs that pin groups in place.',{kind:'puddle',damage:200,interval:1.8,range:100,count:2,speed:480,homing:false,slow:.65,duration:4}],
 ['ember_coil','ember_seam','Ember Seam','linen_thread','Wide seams burn along the path you walk.',{damage:24,interval:.65,range:75,duration:4,burn:6}],
 ['ember_coil','ash_garden','Ash Garden','ember_pouch','Plant explosive ash blossoms.',{kind:'mine',damage:95,interval:1.4,range:130,duration:12}],
 ['spring_vessel','living_spring','Living Spring','spring_drop','Healing springs restore the nearby bearer.',{damage:30,range:125,heal:2,duration:4,follow:true,count:2}],
 ['spring_vessel','frozen_ford','Frozen Ford','mirror_shard','Long frozen pools slow the horde.',{damage:34,range:125,slow:.8,freeze:.65,duration:5,count:3}],
 ['ash_raven','night_flock','Night Flock','wind_knot','Five diving ravens burst across the horde.',{count:5,damage:38,pierce:1,splash:76,dive:true}],
 ['ash_raven','watch_raven','Watch Raven','ember_heart','A giant diving raven hunts bosses and detonates in a wide burst.',{damage:130,interval:1.3,pierce:1,elite:true,count:1,splash:105,dive:true}],
 ['thread_spindle','fate_loom','Fate Loom','mirror_shard','Seven spirits share a cutting thread.',{damage:35,count:7,range:360,cleave:true}],
 ['thread_spindle','hush_knot','Hush Knot','linen_thread','Five binding threads root enemies in place.',{damage:50,count:5,slow:.65,root:.9,range:310}],
 ['hollow_crown','worldroot_heart','Worldroot Heart','root_sigil','Five broad roots orbit and shove enemies away.',{damage:32,range:135,count:5,knock:30,orbitSpeed:2.8}],
 ['hollow_crown','hollow_regent','Hollow Regent','astral_lens','Eight swift royal blades guard a tight, spinning ring.',{damage:30,range:90,count:8,interval:.32,orbitSpeed:5.4}],
 ['star_seed','starfall_choir','Starfall Choir','astral_lens','Four falling stars scatter piercing fragments on impact.',{damage:85,count:4,range:105,shards:6}],
 ['star_seed','eventide_comet','Eventide Comet','ember_heart','A massive comet burns the ground.',{damage:160,interval:3,range:160,burn:8,count:1,groundFire:true}],
 ['moon_sickle','silver_reaping','Silver Reaping','wind_knot','Six swift crescents reap long paths.',{count:6,damage:40,interval:1.3,pierce:10,size:11}],
 ['moon_sickle','blood_moon','Blood Moon','spring_drop','Two giant crescents return stolen health.',{damage:110,interval:1.7,healOnHit:.5,pierce:12,count:2,size:19}],
 ['thorn_lantern','briar_beacon','Briar Beacon','root_sigil','A broad thorn fan roots the approaching horde.',{damage:60,range:260,angle:1.8,slow:.75,root:.7,count:3}],
 ['thorn_lantern','witchfire_lantern','Witchfire Lantern','ember_pouch','A narrow intense flame burns far ahead.',{damage:110,range:350,angle:.75,burn:14,count:3}],
 ['grave_compass','last_procession','Last Procession','linen_thread','Rapid death marks erupt beneath nearby enemies.',{damage:90,interval:1.65,range:120,duration:12,armDelay:.45,count:6}],
 ['grave_compass','burial_star','Burial Star','astral_lens','Distant stars mark enormous burial blasts.',{kind:'meteor',damage:155,interval:2.7,range:175,delay:1,count:2,shards:8}],
 ['storm_chime','thunder_liturgy','Thunder Liturgy','mirror_shard','Ten lightning arcs briefly stun the gathered horde.',{damage:48,count:10,range:460,shock:.4}],
 ['storm_chime','tempest_heart','Tempest Heart','wind_knot','A rapid storm repeatedly shocks three targets.',{damage:54,count:3,interval:.85,range:330,shock:.2}]
];
export const RECIPES = evolutionRows.map(([baseId,id,name,artifactId,description,changes])=>({id,baseId,name,artifactId,baseLevel:7,artifactLevel:6,coreCost:1,description,changes}));
export const EVOLVED = RECIPES.map(r=>({...BASES.find(w=>w.id===r.baseId),count:1,...r.changes,id:r.id,baseId:r.baseId,name:r.name,description:r.description,stage:'evolved'}));
export const ULTIMATES = [
 {...BASES[0],id:'sanctuary_of_dawn',name:'Sanctuary of Dawn',icon:'☀',stage:'ultimate',kind:'sanctuary',capacity:1,components:['oath_bell','living_spring'],catalystCost:1,damage:85,interval:2,range:220,duration:2.1,follow:true,heal:3,knock:75,description:'A moving sanctuary heals its bearer and repels the horde.'},
 {...BASES[1],id:'solar_loom',name:'Solar Loom',icon:'✺',stage:'ultimate',kind:'solar',capacity:1,components:['sun_spindle','ember_seam'],catalystCost:1,damage:80,interval:1.1,range:480,count:12,pierce:12,burn:7,solarTrail:true,description:'Twelve piercing solar threads radiate outward and leave burning seams.'}
];
export const WEAPONS = [...BASES,...EVOLVED,...ULTIMATES];
export const weapon = id=>WEAPONS.find(w=>w.id===id);
export const artifact = id=>ARTIFACTS.find(a=>a.id===id);
export const MAPS = [
 {id:'village',name:'Forgotten Village',duration:1200,color:'#182e2c',accent:'#e1ad6a',unlock:0,story:'The village bells fell silent. Carry the last flame until the Bell Keeper answers.'},
 {id:'quarry',name:'Lantern Quarry',duration:600,color:'#222c39',accent:'#99c9eb',unlock:1,story:'Something beneath the quarry has learned to breathe. Bring its stolen lantern home.'},
 {id:'mill',name:'Drowned Mill',duration:1200,color:'#15343a',accent:'#78d1c9',unlock:2,story:'The drowned turn the wheel through an endless night.'},
 {id:'marsh',name:'Glass Marsh',duration:600,color:'#302840',accent:'#bea8e7',unlock:3,story:'Every reflection remembers a different ending.'},
 {id:'bellwood',name:'Bellwood',duration:1200,color:'#29342b',accent:'#c5ce80',unlock:4,story:'At the oldest root, the first bell still rings.'}
];
export {BRANCHES,SKILLS} from './skill-tree.js';
