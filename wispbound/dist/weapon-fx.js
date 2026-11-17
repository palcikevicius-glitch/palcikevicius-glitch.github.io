// V0.2.1 signature visuals for the elemental arsenal. Pure drawing in world space.
import {tierOf,tierColor} from './tier-art.js';
const TAU=Math.PI*2;
const life=e=>e.maxLife?Math.max(0,e.life/e.maxLife):1;
export function drawSlash(c,e,time){const p=1-life(e),t=tierOf(e),R=e.size||110,w=Math.min(TAU,e.width||2),a=e.angle||0,col=tierColor(e.color||'#e8eef4',t),sweep=a-w/2+w*Math.min(1,p*1.6);c.save();c.translate(e.x,e.y);
 c.globalAlpha=.85*(1-p*.7);c.strokeStyle='#1a1d26';c.lineWidth=9+t*2;c.beginPath();c.arc(0,0,R*.82,a-w/2,sweep);c.stroke();c.strokeStyle=col;c.lineWidth=6+t*2;c.stroke();c.strokeStyle='#ffffff';c.lineWidth=2;c.beginPath();c.arc(0,0,R*.86,Math.max(a-w/2,sweep-.6),sweep);c.stroke();
 c.globalAlpha=.25*(1-p);c.fillStyle=col;c.beginPath();c.moveTo(0,0);c.arc(0,0,R,a-w/2,sweep);c.closePath();c.fill();
 for(let k=0;k<4+t*2;k++){const b=a-w/2+w*((k*0.37+p)%1),d=R*(.6+.35*((k*53)%7)/7);c.globalAlpha=.8*(1-p);c.fillStyle=k%2?'#ffffff':col;c.fillRect(Math.round(Math.cos(b)*d),Math.round(Math.sin(b)*d),2,2);}c.restore();}
export function drawSpecialShot(c,p,time,reduced){const id=p.weaponId;if(!['frost_distaff','rowan_bow','hail_sling'].includes(id))return false;c.save();c.translate(p.x,p.y);c.rotate(p.angle||0);
 if(id==='frost_distaff'){c.fillStyle='#1b2a3a';c.beginPath();c.moveTo(12,0);c.lineTo(0,-6);c.lineTo(-10,0);c.lineTo(0,6);c.closePath();c.fill();c.fillStyle='#a9e6ff';c.beginPath();c.moveTo(10,0);c.lineTo(0,-4);c.lineTo(-8,0);c.lineTo(0,4);c.closePath();c.fill();c.fillStyle='#ffffff';c.fillRect(1,-1,6,2);c.globalAlpha=.5;c.fillStyle='#d8f6ff';for(let k=1;k<4;k++)c.fillRect(-10-k*5,(k%2?-3:2),2,2);}
 else if(id==='rowan_bow'){c.fillStyle='#2a1a14';c.fillRect(-16,-2,26,4);c.fillStyle='#8a5a34';c.fillRect(-15,-1,22,2);c.fillStyle='#c9ced6';c.beginPath();c.moveTo(14,0);c.lineTo(7,-4);c.lineTo(7,4);c.closePath();c.fill();c.fillStyle='#e05a4a';c.fillRect(-17,-4,5,2);c.fillRect(-17,2,5,2);c.fillStyle='#f2e8d8';c.fillRect(-14,-3,3,1);}
 else{const spin=reduced?0:time*12;c.rotate(spin);c.fillStyle='#253040';c.beginPath();c.arc(0,0,8,0,TAU);c.fill();c.fillStyle='#dfe8f0';c.beginPath();c.arc(0,0,6,0,TAU);c.fill();c.fillStyle='#ffffff';c.fillRect(-3,-3,3,3);c.fillStyle='#9fb4c8';c.fillRect(1,1,3,2);}
 c.restore();return true;}
export function drawSpecialZone(c,z,time,reduced){if(z.weaponId!=='viper_censer'||z.delay>0)return false;const l=life(z),R=z.radius||40,t=reduced?0:time;c.save();c.globalAlpha=.32*Math.min(1,l*2);c.fillStyle='#5aa83a';c.beginPath();c.arc(z.x,z.y,R,0,TAU);c.fill();c.globalAlpha=.55*Math.min(1,l*2);c.fillStyle='#8be36a';
 for(let k=0;k<6;k++){const a=k*1.05+t*.8,d=R*(.2+.6*((k*37)%10)/10),bob=Math.sin(t*3+k)*3;c.beginPath();c.arc(z.x+Math.cos(a)*d,z.y+Math.sin(a)*d+bob,3+(k%3),0,TAU);c.fill();}
 c.fillStyle='#d8ffb0';for(let k=0;k<3;k++){const a=k*2.1-t,d=R*.5;c.fillRect(Math.round(z.x+Math.cos(a)*d),Math.round(z.y+Math.sin(a)*d-((t*20+k*9)%14)),2,2);}c.restore();return true;}
export function drawThunderRing(c,e,time){if(e.weaponId!=='thunder_drum'||e.type!=='ring')return false;const l=life(e),R=(e.size||140)*(1-l*.55),n=26;c.save();c.globalAlpha=l;c.strokeStyle='#e8eeff';c.lineWidth=3;c.beginPath();
 for(let k=0;k<=n;k++){const a=k*TAU/n,j=(Math.sin(k*7.3+time*30)*.5+.5)*10;const x=e.x+Math.cos(a)*(R+j-5),y=e.y+Math.sin(a)*(R+j-5);k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.strokeStyle='#8fa4ff';c.lineWidth=7;c.globalAlpha=l*.35;c.stroke();
 c.globalAlpha=l;c.fillStyle='#ffffff';for(let k=0;k<6;k++){const a=k*TAU/6+time;c.fillRect(Math.round(e.x+Math.cos(a)*R)-2,Math.round(e.y+Math.sin(a)*R)-2,4,4);}c.restore();return true;}
