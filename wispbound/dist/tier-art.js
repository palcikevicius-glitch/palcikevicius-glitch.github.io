// V0.2.1: weapons visibly grow with every upgrade. Tier 0 = level 1-2, 1 = level 3-4, 2 = level 5-6,
// 3 = mastered (level 7), 4 = evolved or Ultimate. Pure drawing, no gameplay effect.
const TAU=Math.PI*2;
export const tierOf=o=>o?.stage&&o.stage!=='base'?4:(o?.level||1)>=7?3:(o?.level||1)>=5?2:(o?.level||1)>=3?1:0;
export const tierScale=t=>[1,1.2,1.38,1.6,1.8][t];
const mix=(a,b,f)=>{const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));if(!/^#[0-9a-f]{6}/i.test(a||''))return b;const x=p(a),y=p(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*f).toString(16).padStart(2,'0')).join('');};
export const tierColor=(color,t)=>t>=4?mix(color,'#fff1b0',.5):mix(color,'#ffffff',[0,.2,.35,.5][t]);
function sparks(c,x,y,n,rad,time,color,size=2){for(let j=0;j<n;j++){const a=time*6+j*TAU/n;c.fillStyle=color;c.fillRect(Math.round(x+Math.cos(a)*rad)-1,Math.round(y+Math.sin(a)*rad)-1,size,size);}}
export function shotBehind(c,p,time,reduced){const t=tierOf(p);if(!t)return;const col=tierColor(p.color,t),a=p.angle||0,n=t>=3?7:t*2+1;c.save();
 for(let j=1;j<=n;j++){const d=j*(5+t*2);c.globalAlpha=.55*(1-j/(n+1));c.fillStyle=col;const s=Math.max(2,(p.radius||6)*(1.1-j*.12)*tierScale(t)*.6);c.beginPath();c.arc(p.x-Math.cos(a)*d,p.y-Math.sin(a)*d,s,0,TAU);c.fill();}
 if(t>=2){c.globalAlpha=(t>=3?.34:.2)+(reduced?0:.1*Math.sin(time*12));c.fillStyle=col;c.beginPath();c.arc(p.x,p.y,(p.radius||6)*(t>=3?3:2.2),0,TAU);c.fill();}c.restore();}
export function shotFront(c,p,time,reduced){const t=tierOf(p);if(t<1)return;const col=tierColor(p.color,t);c.save();sparks(c,p.x,p.y,t>=4?6:t*2,(p.radius||6)+8+t*2,reduced?0:time,t>=4?'#fff1b0':col,t>=3?3:2);
 if(t>=3){const s=reduced?5:5+2*Math.sin(time*16);c.fillStyle='#ffffff';c.globalAlpha=.9;c.fillRect(Math.round(p.x-s),Math.round(p.y),Math.round(s*2+1),1);c.fillRect(Math.round(p.x),Math.round(p.y-s),1,Math.round(s*2+1));}c.restore();}
export function zoneTier(c,z,time,reduced){const t=tierOf(z);if(!t||z.delay>0)return;const col=tierColor(z.color,t),rad=z.mine?16:z.radius||30;c.save();c.globalAlpha=.55;c.strokeStyle=col;c.lineWidth=1+t;c.setLineDash(t>=3?[]:[6,5]);c.lineDashOffset=reduced?0:-time*20;c.beginPath();c.arc(z.x,z.y,rad+2+t,0,TAU);c.stroke();c.setLineDash([]);
 if(t>=2)for(let j=0;j<t*2;j++){const a=(reduced?0:time*2)+j*TAU/(t*2),d=rad*(.35+.5*((j*37)%10)/10);c.globalAlpha=.8;c.fillStyle=j%2?'#ffffff':col;c.fillRect(Math.round(z.x+Math.cos(a)*d),Math.round(z.y+Math.sin(a)*d),2,2);}c.restore();}
export function effectTier(c,e,time,reduced){const t=tierOf(e);if(!t)return;const life=e.maxLife?e.life/e.maxLife:1,col=tierColor(e.color,t);c.save();c.globalAlpha=Math.max(0,life)*.7;
 if(e.type==='ring'){c.strokeStyle=col;c.lineWidth=t;c.beginPath();c.arc(e.x,e.y,(e.size||40)*(1.04+.06*t),0,TAU);c.stroke();if(t>=2)sparks(c,e.x,e.y,t*3,(e.size||40)*(1-life*.3),reduced?0:time*.5,col,3);}
 else if(e.type==='line'&&e.tx!==undefined){c.strokeStyle=col;c.lineWidth=1+t;c.globalAlpha*=.6;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.tx,e.ty);c.stroke();if(t>=3){c.fillStyle='#ffffff';c.fillRect(Math.round(e.tx)-2,Math.round(e.ty)-2,4,4);}}
 else if(e.type==='cone'){c.fillStyle=col;c.globalAlpha*=.25+.08*t;c.beginPath();c.moveTo(e.x,e.y);c.arc(e.x,e.y,(e.size||100)*(1+.05*t),(e.angle||0)-(e.width||1)/2,(e.angle||0)+(e.width||1)/2);c.closePath();c.fill();}
 c.restore();}
