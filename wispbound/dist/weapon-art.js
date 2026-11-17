import {weapon} from './catalog.js';

const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const RANKS=['D','C','B','A','S','SS','SSS','SSS+'];
const METALS=['#718d99','#b8c9cf','#bd8af1','#f6a961','#f9d071','#ef8b97','#ffa15e','#fff1c1'];
const LIGHTS=['#e4eee1','#f2f5e5','#efdbff','#ffe4b1','#fff3bf','#ffe1d6','#ffedb0','#ffffff'];
const details=new Map();
const familyOf=entry=>entry.baseId||(entry.components&&weapon(entry.components[0])?.baseId)||entry.id;
const rankNumber=value=>{const n=typeof value==='string'&&RANKS.includes(value.toUpperCase())?RANKS.indexOf(value.toUpperCase()):Number(value);return Number.isFinite(n)?Math.max(0,Math.min(7,Math.floor(n))):0;};

// Attachment points follow each original physical 32px icon. They are blade
// barbs, metal fittings and engraved sockets, rather than a frame around it.
const FITTINGS={
 iron_bell:{socket:[20,12],rune:[18,9],trim:[[15,16],[22,19],[25,17]],fin:[[16,8],[13,5],[12,11],[15,14]],second:[[23,7],[27,6],[29,13],[25,16]],crest:[[18,7],[18,2],[21,0],[24,3],[24,7]],tails:[[9,23],[6,20],[4,23],[7,26]]},
 amber_needle:{socket:[18,16],rune:[23,8],trim:[[8,27],[18,17],[25,6]],fin:[[20,10],[17,5],[17,13],[20,14]],second:[[23,12],[29,14],[25,18],[21,17]],crest:[[24,6],[28,0],[30,5],[28,10]],tails:[[10,24],[5,23],[4,27],[8,30]]},
 ember_coil:{socket:[15,18],rune:[18,12],trim:[[11,20],[16,22],[21,17]],fin:[[14,11],[9,9],[9,14],[13,16]],second:[[21,14],[26,12],[27,17],[22,20]],crest:[[17,7],[18,1],[21,4],[24,0],[26,7]],tails:[[10,25],[5,24],[4,28],[9,30]]},
 spring_vessel:{socket:[16,22],rune:[15,14],trim:[[8,23],[12,27],[21,27],[24,23]],fin:[[9,15],[4,13],[2,19],[6,22]],second:[[22,15],[27,13],[30,19],[25,23]],crest:[[10,9],[10,5],[14,6],[16,1],[18,6],[22,5],[22,9]],tails:[[12,28],[10,31],[22,31],[20,28]]},
 ash_raven:{socket:[16,18],rune:[14,12],trim:[[6,12],[11,18],[15,22],[21,18],[26,12]],fin:[[8,13],[1,2],[1,12],[6,18]],second:[[23,13],[30,2],[30,12],[25,18]],crest:[[12,8],[10,2],[14,4],[16,0],[19,4],[22,2],[20,9]],tails:[[13,24],[9,31],[16,28],[22,31],[18,23]]},
 thread_spindle:{socket:[16,16],rune:[12,11],trim:[[10,7],[21,10],[23,25],[13,24]],fin:[[9,9],[5,4],[4,9],[9,14]],second:[[21,22],[28,23],[29,28],[24,29]],crest:[[9,7],[9,2],[14,3],[17,1],[21,5],[23,8]],tails:[[12,23],[7,25],[10,30],[15,26]]},
 hollow_crown:{socket:[16,25],rune:[17,15],trim:[[6,23],[11,26],[22,26],[26,23]],fin:[[8,13],[6,3],[11,7],[13,13]],second:[[22,13],[26,2],[28,8],[26,17]],crest:[[13,12],[13,5],[17,0],[21,5],[21,13]],tails:[[7,25],[2,26],[4,30],[12,30]]},
 star_seed:{socket:[21,11],rune:[18,15],trim:[[14,12],[18,18],[22,19],[27,14]],fin:[[18,8],[12,3],[11,10],[16,13]],second:[[24,8],[30,5],[31,11],[26,15]],crest:[[19,6],[20,0],[25,1],[27,6]],tails:[[10,25],[5,23],[4,28],[9,30]]},
 moon_sickle:{socket:[17,16],rune:[25,11],trim:[[21,5],[25,10],[24,16],[20,20]],fin:[[25,7],[31,8],[30,13],[26,14]],second:[[24,18],[27,25],[22,27],[18,23]],crest:[[17,5],[15,0],[21,1],[24,5]],tails:[[10,24],[5,22],[3,27],[7,30]]},
 thorn_lantern:{socket:[16,8],rune:[16,22],trim:[[9,9],[22,9],[24,23],[21,27]],fin:[[8,15],[2,10],[1,17],[6,21]],second:[[24,15],[30,10],[31,17],[26,21]],crest:[[11,8],[8,3],[12,4],[16,0],[20,4],[24,3],[21,8]],tails:[[9,25],[4,29],[12,31],[15,28],[20,31],[27,29],[22,25]]},
 grave_compass:{socket:[16,17],rune:[11,13],trim:[[10,9],[22,9],[26,14],[25,23],[20,27]],fin:[[8,13],[1,10],[2,17],[7,19]],second:[[24,15],[31,12],[30,21],[25,22]],crest:[[11,9],[12,2],[16,0],[20,4],[21,9]],tails:[[11,25],[8,31],[15,28],[20,31],[23,25]]},
 storm_chime:{socket:[16,7],rune:[16,20],trim:[[8,6],[24,6],[25,9],[9,9]],fin:[[8,13],[4,10],[3,16],[7,19]],second:[[24,13],[29,10],[30,16],[26,19]],crest:[[9,6],[9,1],[13,3],[17,0],[21,4],[25,2],[24,7]],tails:[[14,25],[11,29],[16,31],[21,29],[18,25]]}
};
const rect=(x,y,w,h,color)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
const line=(points,color,width=1,fill=false)=>`<path d="${points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')}${fill?'Z':''}" fill="${fill?color:'none'}" stroke="${fill?'#182335':color}" stroke-width="${width}" stroke-linejoin="miter"/>`;
function gem(x,y,color,light){return rect(x-2,y-2,5,5,'#182335')+rect(x-1,y-1,3,3,color)+rect(x-1,y-1,1,1,light);}
function rune(x,y,color){return rect(x,y,1,5,color)+rect(x+1,y,2,1,color)+rect(x+2,y+1,1,2,color)+rect(x+1,y+3,2,1,color);}
function embellishment(family,rank){
 const key=family+':'+rank;if(details.has(key))return details.get(key);const fit=FITTINGS[family];if(!fit)return {back:'',front:''};const metal=METALS[rank],light=LIGHTS[rank];let back='',front='';
 // Every added rank introduces geometry, while keeping all previous fittings.
 front+=rect(fit.socket[0]-1,fit.socket[1],3,1,metal)+rect(fit.socket[0],fit.socket[1]-1,1,3,light);
 if(rank>=2)front+=gem(...fit.socket,metal,light)+line(fit.trim,metal,1);
 if(rank>=3)back+=line(fit.fin,metal,1,true);
 if(rank>=4)front+=rune(...fit.rune,light)+line(fit.trim.map(([x,y])=>[x,y+1]),'#665038',1);
 if(rank>=5)back+=line(fit.second,metal,1,true); 
 if(rank>=6){back+=line(fit.crest,'#f99b57',1,true);front+=line(fit.trim,light,1)+gem(fit.socket[0],fit.socket[1],rank===7?'#f9da76':'#f6b16a',light);}
 if(rank>=7){back+=line(fit.tails,'#d9b575',1,true);front+=line(fit.fin.slice(0,3),'#fff4d6',1)+line(fit.second.slice(0,3),'#fff4d6',1)+rect(fit.rune[0]-2,fit.rune[1]+6,1,1,light)+rect(fit.rune[0]+4,fit.rune[1]-2,1,1,light);}
 const result={back,front};details.set(key,result);return result;
}

/** Original physical family asset; existing callers and URLs are unchanged. */
export function weaponArt(id){const entry=weapon(id);return entry?`./assets/weapons/${familyOf(entry)}.svg`:'';}

/** Optional third argument accepts 0..7 or D/C/B/A/S/SS/SSS/SSS+. Omitted/D retains the original img markup. */
export function weaponIcon(id,className='',rank=0){
 const entry=weapon(id),src=weaponArt(id);if(!entry||!src)return '';const n=rankNumber(rank),classes=`weapon-art weapon-art--${entry.stage}${className?` ${esc(className)}`:''}`;
 if(!n)return `<img class="${classes}" src="${src}" alt="" aria-hidden="true" width="64" height="64" draggable="false" decoding="async">`;
 const art=embellishment(familyOf(entry),n);
 return `<svg xmlns="http://www.w3.org/2000/svg" class="${classes} weapon-art--rank-${n}" viewBox="0 0 32 32" width="64" height="64" aria-hidden="true" focusable="false" shape-rendering="crispEdges" data-weapon-rank="${n}">${art.back}<image href="${src}" x="0" y="0" width="32" height="32" preserveAspectRatio="xMidYMid meet" style="image-rendering:pixelated"/>${art.front}</svg>`;
}
