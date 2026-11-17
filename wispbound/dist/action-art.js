/** Self-contained world-space Canvas art. No assets, timers, randomness or gameplay mutations. */
const TAU=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function path(c,points,color,width=2,closed=false,fill=false){c.beginPath();for(let i=0;i<points.length;i++)i?c.lineTo(...points[i]):c.moveTo(...points[i]);if(closed)c.closePath();if(fill){c.fillStyle=color;c.fill();}else{c.strokeStyle=color;c.lineWidth=width;c.stroke();}}
function ring(c,x,y,r,color,width=2,a=0,b=TAU){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(.1,r),a,b);c.stroke();}
function diamond(c,x,y,s,color){path(c,[[x,y-s],[x+s,y],[x,y+s],[x-s,y]],color,1,true,true);}
function cross(c,x,y,s,color){rect(c,x-s,y-1,s*2+1,3,color);rect(c,x-1,y-s,3,s*2+1,color);}
function ray(c,a,inner,outer,color,width=2){path(c,[[Math.cos(a)*inner,Math.sin(a)*inner],[Math.cos(a)*outer,Math.sin(a)*outer]],color,width);}
function rune(c,x,y,a,color,scale=1){c.save();c.translate(x,y);c.rotate(a);path(c,[[-4*scale,5*scale],[-4*scale,-5*scale],[4*scale,-2*scale],[-4*scale,1*scale],[4*scale,5*scale]],color,2);c.restore();}
function blade(c,x,y,a,size,color,light='#fff8d4',root=false){c.save();c.translate(x,y);c.rotate(a);path(c,[[-size*.7,2],[-size*.2,-3],[size,-size*.7],[size*.6,1],[-size*.1,5]],'#152333',4,true,true);path(c,[[-size*.7,2],[-size*.2,-3],[size,-size*.7],[size*.6,1],[-size*.1,5]],color,1,true,true);path(c,[[-size*.6,1],[size*.2,-1],[size,-size*.7]],light,2);if(root){path(c,[[-size*.1,1],[-size*.3,-size*.5],[-size*.7,-size*.8]],color,3);path(c,[[size*.3,1],[size*.1,size*.5],[-size*.3,size*.7]],color,3);}rect(c,-size*.65,1,4,4,'#f6d994');c.restore();}
function crescent(c,x,y,a,size,color){c.save();c.translate(x,y);c.rotate(a);path(c,[[0,-size],[-size*.7,-size*.65],[-size,-size*.05],[-size*.7,size*.65],[0,size],[size*.35,size*.8],[-size*.2,size*.45],[-size*.45,0],[-size*.2,-size*.45],[size*.35,-size*.8]],color,1,true,true);path(c,[[0,-size],[-size*.7,-size*.65],[-size,-size*.05],[-size*.7,size*.65],[0,size]],'#f5f9ff',2);c.restore();}
function feather(c,x,y,a,size,color){c.save();c.translate(x,y);c.rotate(a);path(c,[[-size*.7,0],[-size*.2,-size*.28],[size*.8,-size*.17],[size*.2,size*.28],[-size*.7,0]],color,1,true,true);path(c,[[-size*.7,0],[size*.75,-size*.1]],'#f2ddff',1);c.restore();}
function lightning(c,points,color='#74cfff'){path(c,points,'#153d72',7);path(c,points,color,4);path(c,points,'#e9ffff',1.5);}

/** Arena age is time in its current phase. Opening/closing take 1.2 seconds. */
export function drawArena(c,arena,time=0,reduced=false){
 if(!arena)return;const r=Math.max(50,arena.radius||330),age=Math.max(0,arena.age||0),opening=arena.phase==='opening',closing=arena.phase==='closing',progress=reduced?1:clamp(age/1.2),alpha=closing?1-progress:opening?progress:1,t=reduced?0:time;
 if(alpha<=0)return;c.save();c.translate(arena.x,arena.y);c.globalAlpha=alpha;
 // A thin double boundary leaves the centre unobscured and reads above dark terrain.
 ring(c,0,0,r,'#10192d',9);ring(c,0,0,r,'#c68164',3);ring(c,0,0,r-9,'#754d66',2);
 const count=16;for(let i=0;i<count;i++){const a=i*TAU/count,x=Math.cos(a)*r,y=Math.sin(a)*r;c.save();c.translate(x,y);c.rotate(a);rect(c,-6,-10,13,21,'#151b2e');rect(c,-4,-8,9,17,'#647188');rect(c,-3,-8,6,3,'#a5a4a6');rect(c,-4,5,9,3,'#333747');diamond(c,0,0,3,i%2?'#ffc280':'#cf85bb');c.restore();if(i%2===0)rune(c,Math.cos(a)*(r-23),Math.sin(a)*(r-23),a+Math.PI/2,'#ffc280');}
 c.globalAlpha=alpha*.65;for(let i=0;i<8;i++){const a=i*TAU/8+.08;ring(c,0,0,r-5,'#f1ba82',2,a,a+.38);}
 if(!reduced){for(let i=0;i<24;i++){const a=i*TAU/24+t*.035,cycle=(t*.6+i*.37)%1,d=r-2-cycle*14;rect(c,Math.cos(a)*d,Math.sin(a)*d-cycle*13,2,3,i%2?'#ffcd8d':'#cf9bdd');}}
 if((opening||closing)&&!reduced){c.globalAlpha=alpha*(1-progress)*.65;ring(c,0,0,r*(opening?.35+progress*.65:1+progress*.2),'#ffe2b0',5);for(let i=0;i<12;i++){const a=i*TAU/12,d=r*(.7+progress*.4);diamond(c,Math.cos(a)*d,Math.sin(a)*d,3,'#fff5cd');}}
 c.restore();
}

/** Uses the same phase as orbit collisions; reduced motion removes decorative trails only. */
export function drawOrbit(c,r,w,d,reduced=false){
 const count=clamp(Math.round(d.count||2),1,20),range=Math.max(12,d.range||88),speed=d.orbitSpeed??2.2,t=r.time||0,root=w.id==='worldroot_heart',royal=w.id==='hollow_regent',evolved=d.stage==='evolved'||root||royal,color=d.color||'#b4d083',size=Math.max(9,d.radius||13)*(evolved?1.15:1);
 c.save();c.translate(r.x,r.y);if(evolved){c.globalAlpha=.25;ring(c,0,0,range,color,1);c.globalAlpha=1;}
 for(let i=0;i<count;i++){const a=t*speed+i*TAU/count,x=Math.cos(a)*range,y=Math.sin(a)*range;
  if(!reduced){c.globalAlpha=evolved?.52:.28;ring(c,0,0,range,color,evolved?4:2,a-.35,a-.03);c.globalAlpha=1;}
  blade(c,x,y,a+Math.PI/2,size,royal?'#e7b765':color,royal?'#fff6ca':'#efffca',root);
  if(royal){diamond(c,x,y,3,'#d891ec');if(!reduced)rect(c,x-Math.cos(a)*8,y-Math.sin(a)*8,2,2,'#fff8d0');}
 }
 c.restore();
}

const RITUAL_COLORS={rasa:'#f4c368',mira:'#ffba4c',kael:'#ff775b',neris:'#67e3d8',vesper:'#ba90ff',elin:'#edf4c1',morwen:'#d8a2ef',astra:'#86ceff',selene:'#d6e8ff',brann:'#99d775',corvin:'#8dd5c3',talis:'#86cfff'};
function sigil(c,r,color,t,quality,opacity=1){c.globalAlpha=opacity*(.5);ring(c,0,0,r,color,2);ring(c,0,0,r-8,color,1);const count=quality==='low'?6:12;for(let i=0;i<count;i++){const a=i*TAU/count+t*.06;rune(c,Math.cos(a)*(r-18),Math.sin(a)*(r-18),a+Math.PI/2,color,.8);}c.globalAlpha=opacity*(1);}
function bellRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?2:4;for(let i=0;i<n;i++){const p=reduced?(i+.6)/n:(t*.7+i/n)%1,rad=26+p*(r-28);c.globalAlpha=opacity*((1-p)*.8);for(let j=0;j<4;j++)ring(c,0,0,rad,'#f9ca73',4,j*TAU/4+.08,j*TAU/4+1.4);c.globalAlpha=opacity*((1-p)*.6);for(let j=0;j<12;j++){const a=j*TAU/12;ray(c,a,rad-5,rad+7,'#fff0b6',2);}}c.globalAlpha=opacity*(1);}
function solarRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?8:12;for(let i=0;i<n;i++){const a=i*TAU/n+(reduced?0:t*.3),p=reduced?.6:(t*.85+i*.13)%1,d=30+p*(r-40),len=18+p*20;c.globalAlpha=opacity*(.35+.6*(1-p));ray(c,a,Math.max(25,d-len),d,'#ff9b38',6);ray(c,a,Math.max(25,d-len*.8),d+5,'#fff0ad',2);diamond(c,Math.cos(a)*d,Math.sin(a)*d,4,'#ffdc76');}c.globalAlpha=opacity*(1);}
function infernoRitual(c,r,t,reduced,quality,opacity=1){const arms=quality==='low'?3:5,n=quality==='low'?8:13;for(let arm=0;arm<arms;arm++)for(let j=0;j<n;j++){const p=j/n,a=arm*TAU/arms+p*3.4+(reduced?0:t*1.4),d=35+p*(r-48),s=3+p*5,x=Math.cos(a)*d,y=Math.sin(a)*d;c.globalAlpha=opacity*(.38+p*.48);c.save();c.translate(x,y);c.rotate(a+Math.PI/2);path(c,[[-s,3],[-s-2,-s*.4],[-s*.25,-s*.7],[0,-s*2],[s*.25,-s*.7],[s,-s*1.3],[s,2]],'#ff8755',1,true,true);path(c,[[-s*.45,2],[0,-s*1.15],[s*.5,1]],'#ffe2a0',1,true,true);rect(c,-1,0,3,3,'#fff3cb');c.restore();}c.globalAlpha=opacity*(1);}
function tideRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?3:5;for(let i=0;i<n;i++){const p=reduced?(i+.5)/n:(t*.28+i/n)%1,d=30+p*(r-30);c.globalAlpha=opacity*(.8*(1-p));for(let j=0;j<3;j++){const a=j*TAU/3+t*.12;ring(c,0,0,d,'#63c9d0',5,a+.1,a+1.8);ring(c,0,0,d-3,'#d4fff1',1,a+.1,a+1.8);}}c.globalAlpha=opacity*(.85);for(let i=0;i<4;i++){const a=i*TAU/4+.7,d=r*.65;cross(c,Math.cos(a)*d,Math.sin(a)*d,5,'#b9ffde');}c.globalAlpha=opacity*(1);}
function ravenRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?7:13;for(let i=0;i<n;i++){const a=i*2.399+(reduced?0:t*(.8+i%3*.17)),d=45+(i%4)/4*(r-40),x=Math.cos(a)*d,y=Math.sin(a)*d,flap=reduced?0:Math.sin(t*12+i)*5;c.save();c.translate(x,y);c.rotate(a+Math.PI/2);path(c,[[-14,-8-flap],[-5,-5],[0,-10],[4,-5],[14,-8-flap],[8,3],[3,1],[0,8],[-3,1],[-8,3]],'#37274f',3,true,true);path(c,[[-14,-8-flap],[-5,-5],[0,-10],[4,-5],[14,-8-flap]],'#c89cf8',2);rect(c,-1,-6,2,4,'#f7ddff');c.restore();}if(quality!=='low')for(let i=0;i<8;i++){const a=i*TAU/8+t*.7;feather(c,Math.cos(a)*r*.82,Math.sin(a)*r*.82,a,8,'#9c77d6');}}
function loomRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?5:8;for(let i=0;i<n;i++){const a=i*TAU/n+(reduced?0:t*.35),b=a+Math.PI*.75,x=Math.cos(a)*r*.8,y=Math.sin(a)*r*.8;c.globalAlpha=opacity*(.52);path(c,[[x,y],[Math.cos(b)*r*.8,Math.sin(b)*r*.8]],i%2?'#a4c7b9':'#fff1c9',2);c.globalAlpha=opacity*(1);c.save();c.translate(x,y);c.rotate(a+Math.PI/2);rect(c,-3,-9,6,18,'#698f8d');rect(c,-6,-8,12,3,'#fff2c3');rect(c,-6,5,12,3,'#d8d5a2');rect(c,-2,-3,4,6,'#edf5d5');c.restore();}for(let i=0;i<4;i++){const a=i*TAU/4-t*.6;diamond(c,Math.cos(a)*r*.49,Math.sin(a)*r*.49,5,'#fff8d2');}}
function crownRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?6:10;for(let i=0;i<n;i++){const a=i*TAU/n+(reduced?0:t*1.45),d=r*(i%2?.72:.92);blade(c,Math.cos(a)*d,Math.sin(a)*d,a+Math.PI/2,21,i%2?'#b398db':'#edc883','#fff8d4');if(!reduced){c.globalAlpha=opacity*(.5);ring(c,0,0,d,'#d4a1f1',3,a-.3,a);c.globalAlpha=opacity*(1);}}}
function starRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?4:7;for(let i=0;i<n;i++){const seed=i*23+4,a=noise(seed)*TAU,d=45+noise(seed+1)*(r-60),x=Math.cos(a)*d,y=Math.sin(a)*d,p=reduced?.65:(t*.7+i/n)%1,height=(1-p)*58;c.globalAlpha=opacity*(.3);ring(c,x,y,14,'#89c9ff',1);c.globalAlpha=opacity*(.9);path(c,[[x-20-height*.7,y-38-height],[x-height*.35,y-height]],'#6d92da',7);path(c,[[x-15-height*.7,y-30-height],[x-height*.35,y-height]],'#c1efff',2);diamond(c,x-height*.35,y-height,7,'#b7eaff');rect(c,x-height*.35-1,y-height-3,3,4,'#fff8dd');if(p>.7){c.globalAlpha=opacity*((1-p)*3);ring(c,x,y,8+(p-.7)*60,'#c7e8ff',3);}}c.globalAlpha=opacity*(1);}
function moonRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?4:7;for(let i=0;i<n;i++){const a=i*TAU/n+(reduced?0:t*.8),d=r*(i%2?.58:.83);crescent(c,Math.cos(a)*d,Math.sin(a)*d,a+t*.3,17+i%3*3,i%2?'#9bb3e6':'#d5ebff');if(!reduced){c.globalAlpha=opacity*(.35);ring(c,0,0,d,'#b2bceb',3,a-.38,a-.04);c.globalAlpha=opacity*(1);}}}
function thornRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?8:12;for(let i=0;i<n;i++){const a=i*TAU/n+.2,p=reduced?.7:(t*.55+i*.16)%1,d=42+p*(r-50);c.save();c.rotate(a);c.globalAlpha=opacity*(.85);path(c,[[28,0],[d*.5,4],[d*.75,-4],[d,0]],'#64894d',5);path(c,[[28,-1],[d*.5,2],[d*.75,-6],[d,0]],'#b4e78e',1.5);path(c,[[d-12,2],[d-6,-18-p*17],[d+5,-4],[d+10,2]],'#83b764',1,true,true);path(c,[[d-7,-2],[d-6,-18-p*17],[d+1,-7]],'#c9f0a6',1.5);c.restore();}c.globalAlpha=opacity*(1);}
function graveRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?5:8;for(let i=0;i<n;i++){const a=i*TAU/n+.35,d=r*(i%2?.54:.82),x=Math.cos(a)*d,y=Math.sin(a)*d,p=reduced?.5:(t*.5+i/n)%1;c.globalAlpha=opacity*(.55);ring(c,x,y,14+p*22,'#78c1b1',2);c.globalAlpha=opacity*(1);rect(c,x-6,y-17,12,20,'#29464c');rect(c,x-4,y-19,8,20,'#84bcb4');rect(c,x-5,y-17,10,3,'#cef2d8');rect(c,x-1,y-14,2,8,'#22373f');rect(c,x-4,y-12,8,2,'#22373f');if(!reduced)for(let j=0;j<3;j++){const rise=(p+j*.3)%1;diamond(c,x+(j-1)*11,y-13-rise*32,3,'#b2f1d9');}}}
function stormRitual(c,r,t,reduced,quality,opacity=1){const n=quality==='low'?4:6;for(let i=0;i<n;i++){const a=i*TAU/n+(reduced?0:t*.7),pts=[];for(let j=0;j<7;j++){const p=j/6,d=40+p*(r-40),ang=a+p*.9;pts.push([Math.cos(ang)*d+(j%2?5:-5),Math.sin(ang)*d+(j%2?-5:5)]);}lightning(c,pts);const p=pts[pts.length-1];cross(c,p[0],p[1],5,'#e0f8ff');}c.globalAlpha=opacity*(.35);ring(c,0,0,r*.62,'#6ba8d9',2);c.globalAlpha=opacity*(1);}
const RITUALS={rasa:bellRitual,mira:solarRitual,kael:infernoRitual,neris:tideRitual,vesper:ravenRitual,elin:loomRitual,morwen:crownRitual,astra:starRitual,selene:moonRitual,brann:thornRitual,corvin:graveRitual,talis:stormRitual};

/** Active ritual remains legible without obscuring the player at the centre. */
export function drawRitualFX(c,r,time=0,reduced=false,quality='high'){
 const active=r.ritualActive;if(!active)return;const radius=Math.max(55,active.radius||170),age=Math.max(0,active.age??0),remaining=Math.max(0,active.life??active.maxLife??1),fade=reduced?1:Math.min(clamp((age+.06)/.25),clamp(remaining/.5)),t=reduced?0:(active.age==null?time:age),color=RITUAL_COLORS[active.id]||RITUAL_COLORS.rasa;
 if(!remaining||fade<=0)return;c.save();c.translate(active.x??r.x,active.y??r.y);c.globalAlpha=fade;
 sigil(c,radius,color,t,quality,fade);(RITUALS[active.id]||bellRitual)(c,radius,t,reduced,quality,fade);
 if(quality!=='low'&&!reduced)for(let i=0;i<8;i++){const a=i*TAU/8+t*.17,d=radius*.9;rect(c,Math.cos(a)*d,Math.sin(a)*d-((t*14+i*9)%22),2,3,color);}
 c.restore();
}

/** Telegraphs persist in reduced-motion mode. age < delay is the safe warning window. */
export function drawHazards(c,r,time=0,reduced=false){
 for(const h of r.hazards||[]){const age=h.age||0,delay=Math.max(.001,h.delay||0),warning=age<delay,p=clamp(age/delay),radius=Math.max(6,h.radius||45),color=warning?'#ffc175':'#ff627a',t=reduced?0:time;c.save();c.translate(h.x,h.y);
  if(h.kind==='bolt'){const a=h.angle||0,length=warning?Math.max(25,Math.min(110,(h.speed||100)*delay)):20;c.rotate(a);if(warning){c.globalAlpha=.25;rect(c,-8,-radius,length+8,radius*2,'#ca673e');c.globalAlpha=1;path(c,[[0,-radius],[length,-radius],[length+10,0],[length,radius],[0,radius]],'#fdb779',2);path(c,[[4,0],[length*p,0]],'#ffebad',3);}else{path(c,[[-18,0],[-5,-radius*.65],[14,0],[-5,radius*.65]],'#be344f',3,true,true);path(c,[[-14,0],[0,-radius*.35],[16,0],[0,radius*.35]],'#ffcf98',1,true,true);}c.restore();continue;}
  c.globalAlpha=warning?.11:.18;c.fillStyle=warning?'#ffb674':'#ff355d';c.beginPath();c.arc(0,0,radius,0,TAU);if(h.kind==='ring') {c.strokeStyle=color;c.lineWidth=Math.max(10,radius*.11);c.stroke();}else c.fill();
  c.globalAlpha=1;ring(c,0,0,radius,'#301e32',6);ring(c,0,0,radius,color,3);if(warning){ring(c,0,0,radius-5,'#ffead4',2,-Math.PI/2,-Math.PI/2+TAU*p);for(let i=0;i<8;i++){const a=i*TAU/8;ray(c,a,radius-4,radius+6,color,2);}if(h.kind!=='ring'){cross(c,0,0,5,'#ffc780');rect(c,-1,-radius*.45,3,8,'#ffe0aa');rect(c,-1,-radius*.45+11,3,3,'#ffe0aa');}}
  else{ring(c,0,0,Math.max(2,radius-7),'#ff9f9c',2);for(let i=0;i<8;i++){const a=i*TAU/8+(reduced?0:t*.4),d=radius*(h.kind==='ring'?.94:.55);diamond(c,Math.cos(a)*d,Math.sin(a)*d,4,'#ffd7b5');}}
  c.restore();
 }
}

/** Golden reward chest silhouette; final clears add a crown above its lid. */
export function drawChests(c,r,time=0,reduced=false){
 for(const chest of r.chests||[]){const seed=typeof chest.id==='number'?chest.id:String(chest.id||'').length,bob=reduced?0:Math.sin(time*2.5+seed)*1.5;c.save();c.translate(Math.round(chest.x),Math.round(chest.y+bob));
  rect(c,-19,12,38,7,'#101727');rect(c,-16,-5,32,23,'#251c30');rect(c,-17,-12,34,11,'#342435');rect(c,-14,-16,28,8,'#614437');rect(c,-13,-14,26,9,'#d89442');rect(c,-15,-8,30,7,'#f0bd61');rect(c,-14,-2,28,16,'#986332');rect(c,-13,1,26,3,'#c1873e');rect(c,-13,12,26,3,'#5e3e2f');rect(c,-10,-14,4,28,'#f8d57b');rect(c,6,-14,4,28,'#f8d57b');rect(c,-10,-12,2,10,'#fff0ae');rect(c,6,-12,2,10,'#fff0ae');rect(c,-15,-4,30,3,'#4b3041');rect(c,-4,-5,8,11,'#342938');rect(c,-3,-5,6,9,'#ffe29a');rect(c,-1,-2,2,4,'#685345');
  c.globalAlpha=.45;for(let i=0;i<5;i++){const a=-Math.PI+.25+i*(Math.PI-.5)/4,len=reduced?27:25+Math.sin(time*2+i)*4;path(c,[[Math.cos(a)*20,Math.sin(a)*20-4],[Math.cos(a)*len,Math.sin(a)*len-4]],'#ffd995',2);}c.globalAlpha=1;
  if(chest.final){path(c,[[-10,-27],[-9,-36],[-3,-31],[0,-39],[3,-31],[9,-36],[10,-27]],'#eab951',2,true,true);rect(c,-9,-27,18,3,'#fff2bf');diamond(c,0,-30,2,'#f484ac');}
  if(!reduced){const p=(time*.7+(typeof chest.id==='number'?chest.id*.17:0))%1;rect(c,-13+p*24,-12,3,2,'#fff6c9');const a=time*1.7;cross(c,Math.cos(a)*24,-18+Math.sin(a)*4,3,'#ffebb4');}
  c.restore();
 }
}
