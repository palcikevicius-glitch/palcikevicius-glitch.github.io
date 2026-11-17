// Journey time is real time; movement, attacks and combat effects share this clock.
export const COMBAT_SPEED=.77,WEAPON_MAX=7,ARTIFACT_MAX=6;
export const PACING=[
 [0,18,1.5,2],[60,28,1.4,2],[180,44,1.3,3],[300,60,1.15,3],
 [480,78,1.05,4],[600,96,.95,4],[780,118,.9,5],[900,142,.85,5],[1080,166,.8,6]
];
export function encounterPacing(time,arena=false){const row=PACING.findLast(x=>time>=x[0])||PACING[0];return {cap:arena?[12,18,24,30][Math.min(3,Math.floor(time/300))]:row[1],interval:row[2]*(arena?2:1),count:arena?2:row[3]};}
export function tiersAt(time){const q=Math.min(3,Math.floor(time/300)),low=1+q*2,within=time%300;return within<120?[low]:within<240?[low,Math.min(8,low+1)]:[low,Math.min(8,low+1),Math.min(8,low+2)].filter((v,i,a)=>a.indexOf(v)===i);}
export const healthForTier=t=>[32,76,128,205,340,525,850,1200][Math.min(7,Math.max(0,t-1))];
const p=(label,stats)=>({label,...stats});
export const WEAPON_PATHS={
 iron_bell:[p('Wider resonance',{area:.12}),p('A second echo',{count:1}),p('Quicker toll',{haste:.12}),p('Heavier chime',{damage:.2,knock:.2}),p('A third echo',{count:1}),p('Resonant heart',{damage:.2,area:.12})],
 amber_needle:[p('Twin needles',{count:1}),p('Amber point',{damage:.18}),p('Quick draw',{haste:.15}),p('Triple needles',{count:1}),p('Amber point',{damage:.2}),p('Piercing final volley',{count:1,haste:.1,pierce:1})],
 ember_coil:[p('Lingering embers',{duration:.1}),p('Hotter trail',{damage:.2,burn:1}),p('Wider seam',{area:.18}),p('Twin seams',{count:1}),p('Fast ignition',{haste:.12}),p('Searing wake',{damage:.2,duration:.1})],
 spring_vessel:[p('Wider spring',{area:.16}),p('Longer current',{duration:.12}),p('Chilling water',{slow:.08}),p('Twin springs',{count:1}),p('Rising tide',{damage:.25}),p('Deep reservoir',{area:.16,duration:.12})],
 ash_raven:[p('Faster dive',{speed:.12}),p('Twin ravens',{count:1}),p('Ravenous beak',{damage:.2}),p('Sharper beak',{damage:.18}),p('Quick return',{haste:.15}),p('Bursting flock',{count:1,damage:.15,splash:1})],
 thread_spindle:[p('Fourth thread',{count:1}),p('Longer weave',{reach:.15}),p('Taut fibres',{damage:.2}),p('Fast stitch',{haste:.12}),p('Fifth thread',{count:1}),p('Cutting weave',{cleave:true,damage:.15})],
 hollow_crown:[p('Third thorn',{count:1}),p('Faster orbit',{orbit:.2}),p('Broad blades',{size:.2}),p('Fourth thorn',{count:1}),p('Heavy thorns',{damage:.2}),p('Living crown',{count:1,duration:.1})],
 star_seed:[p('Larger crater',{area:.18}),p('Twin falling stars',{count:1}),p('Heavy starlight',{damage:.25}),p('Shorter warning',{delay:-.1}),p('Swift constellation',{haste:.12}),p('Fragmenting stars',{shards:3,damage:.15})],
 moon_sickle:[p('Twin crescents',{count:1}),p('Longer flight',{flight:.2}),p('Sharp moonlight',{damage:.2}),p('Triple crescents',{count:1}),p('Wider crescent',{size:.2}),p('Piercing moon',{haste:.18,count:1,pierce:2})],
 thorn_lantern:[p('Wider lantern fan',{angle:.18}),p('Longer flame',{reach:.15}),p('Hotter wick',{damage:.25,burn:2}),p('Quick flare',{haste:.12}),p('Broad furnace',{angle:.18}),p('Searing light',{damage:.3,reach:.1})],
 grave_compass:[p('Twin death marks',{count:1}),p('Quicker seal',{delay:-.15}),p('Wider burial',{area:.18}),p('Deeper curse',{damage:.25}),p('Third death mark',{count:1}),p('Final toll',{damage:.25,haste:.12})],
 storm_chime:[p('Fourth arc',{count:1}),p('Longer chain',{reach:.15}),p('Faster storm',{haste:.15}),p('Charged strike',{damage:.2}),p('Fifth arc',{count:1}),p('Stunning current',{shock:.16,damage:.15})],
 smith_cleaver:[p('Wider swing',{angle:.2}),p('Honed edge',{damage:.2}),p('Quick swing',{haste:.15}),p('Twin swing',{count:1}),p('Longer reach',{reach:.15}),p('Master smith',{damage:.25,angle:.2})],
 frost_distaff:[p('Third shard',{count:1}),p('Bitter cold',{slow:.08}),p('Quick frost',{haste:.15}),p('Sharper ice',{damage:.2}),p('Fourth shard',{count:1}),p('Deep freeze',{damage:.2,shock:.1})],
 viper_censer:[p('Thicker smoke',{area:.18}),p('Stronger venom',{burn:2}),p('Lingering cloud',{duration:.15}),p('Quick censer',{haste:.12}),p("Viper's bite",{damage:.25}),p('Choking cloud',{slow:.08,area:.15})],
 thunder_drum:[p('Wider thunder',{area:.15}),p('Louder beat',{damage:.2}),p('Third beat',{count:1}),p('Quick rhythm',{haste:.15}),p('Stunning thunder',{shock:.1}),p('Storm drum',{damage:.25,area:.12})],
 rowan_bow:[p('Twin arrows',{count:1}),p('Fletched arrows',{speed:.15}),p('Rowan tips',{damage:.2}),p('Quick draw',{haste:.15}),p('Volley',{count:1}),p('Heartwood',{damage:.25,pierce:1})],
 grave_scythe:[p('Longer blade',{reach:.12}),p('Grim edge',{damage:.2}),p('Swift reaping',{haste:.15}),p('Cold hands',{damage:.15,haste:.08}),p('Second sweep',{count:1}),p("Death's harvest",{damage:.25,reach:.1})],
 hail_sling:[p('Second stone',{count:1}),p('Hard hail',{damage:.2}),p('Quick sling',{haste:.15}),p('Faster stones',{speed:.15}),p('Third stone',{count:1}),p('Storm of hail',{damage:.25,haste:.1})]
};
export function pathStats(id,level){const out={damage:0,haste:0,count:0,pierce:0,area:0,reach:0,duration:0,size:0,speed:0,splash:0,orbit:0,burn:0,slow:0,angle:0,flight:0,delay:0,knock:0,shards:0,shock:0,cleave:false};for(const node of (WEAPON_PATHS[id]||[]).slice(0,Math.max(0,Math.min(7,level)-1)))for(const key of Object.keys(out))if(typeof out[key]==='boolean')out[key]||=!!node[key];else out[key]+=node[key]||0;return out;}
export const upgradeName=(id,level)=>WEAPON_PATHS[id]?.[level-2]?.label||'';
export const sustainedKind=kind=>['orbit','trail','puddle','sanctuary'].includes(kind);
export function effectWindow(r,d){if(!sustainedKind(d.kind)||d.id==='afterimage')return {active:true,remaining:Infinity};const time=r.combatTime??r.time*COMBAT_SPEED,phase=((time%4)+4)%4,activeTime=Math.min(3.96,3*(1+(d.statusDuration-1||0)));return {active:phase<activeTime,remaining:Math.max(0,activeTime-phase)};}
