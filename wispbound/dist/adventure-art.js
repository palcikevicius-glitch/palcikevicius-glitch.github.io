/** Sharp Canvas navigation and ritual art. No imports, assets, random rolls or gameplay mutations. */
import {mapBounds,millCenter} from './world-geometry.js';
const TAU=Math.PI*2;
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const finitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const COLORS={rasa:'#f4c368',mira:'#ffc25e',kael:'#ff865c',neris:'#74e9da',vesper:'#c6a0ff',elin:'#eef3c0',morwen:'#dbacf2',astra:'#a0dfff',selene:'#ddeeff',brann:'#a9df83',corvin:'#9bddca',talis:'#96dbff'};
const ENEMY_COLORS=['#be7779','#d68378','#e68b75','#ef765f','#ed596e','#ff477b'];
const DIGITS={'1':['010','110','010','010','111'],'3':['110','001','010','001','110'],'5':['111','100','110','001','110']};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function line(c,points,color,width=2,close=false,fill=false){if(!points.length)return;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));if(close)c.closePath();if(fill){c.fillStyle=color;c.fill();}else{c.strokeStyle=color;c.lineWidth=width;c.stroke();}}
function circle(c,x,y,r,color,width=1,fill=false){c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);if(fill){c.fillStyle=color;c.fill();}else{c.strokeStyle=color;c.lineWidth=width;c.stroke();}}
function diamond(c,x,y,s,color){line(c,[[x,y-s],[x+s,y],[x,y+s],[x-s,y]],color,1,true,true);}
function cross(c,x,y,s,color){rect(c,x-s,y-1,s*2+1,3,color);rect(c,x-1,y-s,3,s*2+1,color);}
function knownCount(item){return item.kind==='upgrade'?1:[1,3,5].includes(item.rewardCount)?item.rewardCount:null;}
function lootColor(item){return item.final?'#ffda81':item.kind==='boss'?'#f8bf67':item.kind==='upgrade'?'#9ae3de':'#b9d7fc';}
function digit(c,n,x,y,size=1,color='#fff4d1'){const glyph=DIGITS[String(n)];if(!glyph)return;for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(glyph[row][col]==='1')rect(c,x+col*size,y+row*size,size,size,color);}
function lootItems(r){const result=[];for(const item of r.chests||[]){if(finitePoint(item))result.push(item);if(result.length>=96)break;}for(const item of r.powerups||[]){if(item.kind==='upgrade'&&finitePoint(item))result.push(item);if(result.length>=128)break;}return result;}
function lootSeal(c,x,y,item,size=1){
 const color=lootColor(item),count=knownCount(item);c.save();c.translate(Math.round(x),Math.round(y));c.scale(size,size);
 line(c,[[-10,-8],[-6,-12],[6,-12],[10,-8],[10,8],[6,12],[-6,12],[-10,8]],'#0c1727',1,true,true);
 line(c,[[-8,-7],[-5,-10],[5,-10],[8,-7],[8,7],[5,10],[-5,10],[-8,7]],color,1,true);
 if(item.kind==='upgrade'||item.kind==='mini'){
  line(c,[[0,-7],[6,-1],[2,-1],[2,6],[-2,6],[-2,-1],[-6,-1]],color,1,true,true);
  rect(c,-1,-2,2,5,'#f2ffff');
 }else{
  rect(c,-6,-4,12,10,'#6e4e33');rect(c,-6,-6,12,4,color);rect(c,-7,-1,14,2,'#172136');rect(c,-4,-5,2,10,'#f5da97');rect(c,2,-5,2,10,'#f5da97');rect(c,-1,-1,2,4,'#fff3bc');
 }
 if(item.final){line(c,[[-6,-13],[-6,-18],[-2,-15],[0,-20],[2,-15],[6,-18],[6,-13]],color,1,true,true);}
 if(count){rect(c,4,3,8,9,'#0c1727');rect(c,5,4,6,7,'#334553');digit(c,count,6,5,1,'#fff1be');}
 c.restore();
}

/** Draw in logical screen coordinates, after world effects. radius is the circle's radius. */
export function drawMinimap(c,r,{x,y,radius=56,range=700},time=0,reduced=false){
 if(!Number.isFinite(x)||!Number.isFinite(y))return;const rad=clamp(radius,24,140),worldRange=clamp(Number.isFinite(range)?range:700,100,3000),ratio=(rad-6)/worldRange,heroX=r.x||0,heroY=r.y||0;
 c.save();c.translate(Math.round(x),Math.round(y));circle(c,0,0,rad+3,'#091322',1,true);circle(c,0,0,rad+1,'#8a9b9e',1);c.save();c.beginPath();c.arc(0,0,rad-1,0,TAU);c.clip();rect(c,-rad,-rad,rad*2,rad*2,'#13242e');
 const cell=200,startX=Math.floor((heroX-worldRange)/cell)*cell,startY=Math.floor((heroY-worldRange)/cell)*cell;
 for(let wx=startX;wx<=heroX+worldRange;wx+=cell){const px=(wx-heroX)*ratio;line(c,[[px,-rad],[px,rad]],'#253640',1);}
 for(let wy=startY;wy<=heroY+worldRange;wy+=cell){const py=(wy-heroY)*ratio;line(c,[[-rad,py],[rad,py]],'#253640',1);}
 const bounds=mapBounds(r);if(r.mapId==='mill'){for(const sign of [-1,1]){const points=[];for(let yy=heroY-worldRange;yy<=heroY+worldRange;yy+=60)points.push([(millCenter(r,yy)+sign*245-heroX)*ratio,(yy-heroY)*ratio]);line(c,points,'#a1c4ba',2);}}for(const wx of [bounds.minX,bounds.maxX])if(Number.isFinite(wx)&&r.mapId!=='mill'){const px=(wx-heroX)*ratio;line(c,[[px,-rad],[px,rad]],'#a1c4ba',2);}for(const wy of [bounds.minY,bounds.maxY])if(Number.isFinite(wy)){const py=(wy-heroY)*ratio;line(c,[[-rad,py],[rad,py]],'#a1c4ba',2);}
 if(r.arena&&finitePoint(r.arena)){const a=r.arena;circle(c,(a.x-heroX)*ratio,(a.y-heroY)*ratio,(a.radius||330)*ratio,'#9c7164',1);}
 const path=r.ritualActive?.path;if(Array.isArray(path)&&path.length>2){const points=boundedPath(path).map(p=>[(p.x-heroX)*ratio,(p.y-heroY)*ratio]);line(c,points,'#426964',1,true);}
 // Normal dots are sparse; elite diamonds stay above them and retain a separate budget.
 let dots=0;const elites=[];for(const enemy of r.enemies||[]){if(!finitePoint(enemy)||enemy.hp<=0)continue;const dx=enemy.x-heroX,dy=enemy.y-heroY;if(dx*dx+dy*dy>worldRange*worldRange)continue;if(enemy.boss||enemy.mini){if(elites.length<30)elites.push(enemy);continue;}if(dots>=220)continue;const tier=clamp(Math.floor(enemy.tier||1),1,6);rect(c,dx*ratio-1,dy*ratio-1,2,2,ENEMY_COLORS[tier-1]);dots++;}
 for(const enemy of elites){const px=(enemy.x-heroX)*ratio,py=(enemy.y-heroY)*ratio,size=enemy.boss?4:3;diamond(c,px,py,size+1,'#111723');diamond(c,px,py,size,enemy.boss?'#ff6e83':'#ffd3a3');if(enemy.boss)rect(c,px,py-1,1,2,'#fff0cf');}
 for(const item of lootItems(r).slice(0,24)){const dx=item.x-heroX,dy=item.y-heroY;if(dx*dx+dy*dy>worldRange*worldRange)continue;const px=dx*ratio,py=dy*ratio,color=lootColor(item);rect(c,px-3,py-3,7,7,'#111d2e');if(item.kind==='upgrade'){line(c,[[px-2,py+1],[px,py-2],[px+2,py+1]],color,1);rect(c,px,py,1,3,color);}else{rect(c,px-2,py-2,5,4,color);rect(c,px-2,py,5,1,'#493d40');rect(c,px,py,1,2,'#fff0c8');}}
 // The hero's direction marker is the final clipped layer and cannot be hidden by loot/enemies.
 c.save();c.rotate(Number.isFinite(r.angle)?r.angle:-Math.PI/2);line(c,[[6,0],[-4,-4],[-2,0],[-4,4]],'#08151e',4,true);line(c,[[6,0],[-4,-4],[-2,0],[-4,4]],'#e2ffff',1,true,true);rect(c,-1,-1,2,2,'#8ae5dc');c.restore();c.restore();
 for(let i=0;i<4;i++){const a=i*TAU/4,outer=rad+3;line(c,[[Math.cos(a)*(outer-3),Math.sin(a)*(outer-3)],[Math.cos(a)*(outer+1),Math.sin(a)*(outer+1)]],'#e1ddbd',1);}
 // A small fixed north notch provides orientation without localized text.
 diamond(c,0,-rad-2,2,'#e8deba');c.restore();
}

/** Off-screen, uncollected loot only; at most four nearest spatially separated markers. */
export function drawLootIndicators(c,r,{width,height,scale=1},time=0,reduced=false){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<120||height<120)return;const w=width,h=height,s=Math.max(.1,Number.isFinite(scale)?scale:1),cx=w/2,cy=h/2,hw=Math.max(12,cx-60),hh=Math.max(12,cy-60),items=[];
 for(const item of lootItems(r)){const dx=(item.x-r.x)*s,dy=(item.y-r.y)*s,sx=cx+dx,sy=cy+dy;if(sx>=0&&sx<=w&&sy>=0&&sy<=h)continue;const length=Math.hypot(dx,dy);if(!length)continue;const k=Math.min(hw/Math.max(.001,Math.abs(dx)),hh/Math.max(.001,Math.abs(dy)));items.push({item,dx,dy,x:cx+dx*k,y:cy+dy*k,distance:length});}
 items.sort((a,b)=>a.distance-b.distance);const chosen=[];for(const entry of items){if(chosen.some(p=>Math.hypot(p.x-entry.x,p.y-entry.y)<54))continue;chosen.push(entry);if(chosen.length===4)break;}
 for(const entry of chosen){const {item,x,y,dx,dy}=entry,a=Math.atan2(dy,dx),t=reduced?0:Math.sin(time*3)*1.5,color=lootColor(item);c.save();c.translate(Math.round(x),Math.round(y));c.fillStyle='#0c1727';c.fillRect(-15,-16,30,32);c.strokeStyle='#4e626c';c.lineWidth=1;c.strokeRect(-15,-16,30,32);lootSeal(c,0,0,item,.9);c.save();c.rotate(a);line(c,[[20+t,-5],[25+t,0],[20+t,5]],'#0b1726',5);line(c,[[20+t,-5],[25+t,0],[20+t,5]],color,2);c.restore();c.restore();}
}

/** World-space pickup cues. Existing chest/pickup art remains responsible for its ground sprite. */
export function drawFloatingLoot(c,r,time=0,reduced=false){
 let drawn=0;for(const item of lootItems(r)){if((item.x-r.x)**2+(item.y-r.y)**2>1200**2)continue;if(drawn++>=48)break;const seed=typeof item.id==='number'?item.id:String(item.id||'').length,bob=reduced?0:Math.sin(time*2.6+seed*.3)*3,x=Math.round(item.x),y=Math.round(item.y-49+bob),color=lootColor(item);
  c.save();c.globalAlpha=.2;rect(c,x-16,y-13,32,26,color);c.globalAlpha=1;lootSeal(c,x,y,item,1);line(c,[[x-3,y+18],[x,y+21],[x+3,y+18]],color,2);
  if(!reduced){const p=(time*.55+seed*.13)%1;c.globalAlpha=(1-p)*.75;rect(c,x-15,y+4-p*21,2,3,color);rect(c,x+14,y-5-p*15,2,2,'#fff2c6');}c.restore();
 }
}

// The stored canonical polygon should contain <=80 vertices, shared with gameplay hit tests.
function boundedPath(input){const valid=input.filter(finitePoint),count=Math.min(80,valid.length);if(valid.length<=80)return valid;return Array.from({length:count},(_,i)=>valid[Math.floor(i*valid.length/count)]);}
function pathGeometry(points){const lengths=[],cumulative=[0];let total=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(b.x-a.x,b.y-a.y);lengths.push(length);total+=length;cumulative.push(total);}return {points,lengths,cumulative,total};}
function pointAlong(g,distance){const d=((distance%g.total)+g.total)%g.total;for(let i=0;i<g.points.length;i++){if(d<=g.cumulative[i+1]&&g.lengths[i]>.001){const a=g.points[i],b=g.points[(i+1)%g.points.length],t=(d-g.cumulative[i])/g.lengths[i];return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,angle:Math.atan2(b.y-a.y,b.x-a.x)};}}return {...g.points[0],angle:0};}
function motif(c,id,x,y,angle,color,t,reduced){c.save();c.translate(x,y);c.rotate(angle);const white='#f2ffe7';
 switch(id){
  case 'rasa':line(c,[[-7,5],[-4,0],[-4,-6],[0,-9],[4,-6],[4,0],[7,5]],color,2,true);rect(c,-1,5,3,3,white);line(c,[[-10,-4],[-12,-1],[-10,2]],color,1);line(c,[[10,-4],[12,-1],[10,2]],color,1);break;
  case 'mira':diamond(c,0,0,6,color);cross(c,0,0,3,white);for(let i=0;i<4;i++){const a=i*TAU/4+.785;line(c,[[Math.cos(a)*8,Math.sin(a)*8],[Math.cos(a)*12,Math.sin(a)*12]],color,2);}break;
  case 'kael':line(c,[[-7,6],[-8,0],[-3,-4],[0,-12],[3,-4],[6,-7],[8,4],[4,9],[-3,9]],color,1,true,true);line(c,[[-3,6],[0,-4],[3,5]],'#ffedb1',1,true,true);break;
  case 'neris':for(let i=0;i<3;i++)line(c,[[-10,i*4-4],[-5,i*4-7],[0,i*4-4],[5,i*4-1],[10,i*4-4]],i===1?white:color,2);break;
  case 'vesper':line(c,[[-13,-6],[-5,-3],[0,-8],[5,-3],[13,-6],[8,4],[3,1],[0,8],[-3,1],[-8,4]],color,1,true,true);rect(c,-1,-4,2,6,'#382849');break;
  case 'elin':line(c,[[-10,-6],[10,6],[10,-6],[-10,6],[-10,-6]],color,2);rect(c,-12,-8,4,16,'#c4d7b5');rect(c,8,-8,4,16,'#c4d7b5');diamond(c,0,0,3,white);break;
  case 'morwen':line(c,[[-10,7],[-10,-7],[-4,-2],[0,-11],[4,-2],[10,-7],[10,7]],color,2,true);line(c,[[-9,3],[9,3]],white,2);diamond(c,0,-1,3,'#f4d389');break;
  case 'astra':line(c,[[0,-12],[3,-3],[12,0],[3,3],[0,12],[-3,3],[-12,0],[-3,-3]],color,1,true,true);diamond(c,0,0,3,white);rect(c,10,-10,2,2,white);break;
  case 'selene':line(c,[[3,-11],[-5,-8],[-9,0],[-5,8],[3,11],[8,7],[0,6],[-3,0],[0,-6],[8,-7]],color,1,true,true);break;
  case 'brann':line(c,[[-12,5],[0,0],[10,-5]],color,3);line(c,[[-6,3],[-7,-7],[0,0],[5,9],[6,-3]],color,2);diamond(c,9,-6,4,white);break;
  case 'corvin':rect(c,-7,-7,14,16,color);rect(c,-4,-10,8,3,color);rect(c,-9,8,18,3,color);rect(c,-1,-6,2,11,'#284442');rect(c,-4,-3,8,2,'#284442');rect(c,-5,-6,2,2,white);break;
  case 'talis':line(c,[[1,-13],[-8,1],[-1,1],[-3,13],[9,-3],[2,-3],[5,-13]],color,1,true,true);line(c,[[1,-10],[-5,-1],[2,-1],[-1,9]],white,1);break;
  default:diamond(c,0,0,7,color);cross(c,0,0,3,white);
 }
 if(!reduced){const p=(t*.6)%1;rect(c,-12,-10-p*7,2,2,color);rect(c,11,5-p*5,2,2,white);}c.restore();}

/** Exact closed player polygon; no radius-circle substitution. Call below hostile telegraphs and hero. */
export function drawRitualBoundary(c,r,time=0,reduced=false){
 const active=r.ritualActive;if(!active||!Array.isArray(active.path)||active.path.length<3)return;const points=boundedPath(active.path);if(points.length<3)return;const geometry=pathGeometry(points);if(geometry.total<2)return;
 const age=Math.max(0,active.age||0),remaining=Math.max(0,active.life??active.maxLife??1);if(remaining<=0)return;const alpha=reduced?1:Math.min(clamp((age+.08)/.25),clamp(remaining/.5)),color=active.color||COLORS[active.id]||COLORS.rasa,t=reduced?0:time,coords=points.map(p=>[p.x,p.y]);
 c.save();c.globalAlpha=alpha*.8;line(c,coords,'#152c35',8,true);line(c,coords,color,3,true);c.globalAlpha=alpha*.75;c.setLineDash([7,15]);c.lineDashOffset=reduced?0:-t*20;line(c,coords,'#f2f5cf',1,true);c.setLineDash([]);c.lineDashOffset=0;
 const count=clamp(Math.floor(geometry.total/130),4,12);c.globalAlpha=alpha;for(let i=0;i<count;i++){const p=pointAlong(geometry,geometry.total*(i+.5)/count);c.save();c.globalAlpha=alpha*.92;motif(c,active.id,p.x,p.y,p.angle,color,t+i*.3,reduced);c.restore();}
 if(!reduced)for(let i=0;i<6;i++){const p=pointAlong(geometry,geometry.total*i/6+t*75);c.globalAlpha=alpha*(.65+i%2*.2);diamond(c,p.x,p.y,3,color);rect(c,p.x-1,p.y-1,2,2,'#ffffe1');}c.restore();
}
