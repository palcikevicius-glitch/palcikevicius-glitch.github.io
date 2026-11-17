// V0.2.1 world painter: every map has its own ground, roads, water, decorations, ambient life and
// lantern lighting. Ground is painted once per 256-unit chunk (2 world units per pixel) and cached.
import {roadDistance,waterAt,ROAD_WIDTH,fbm,hash2,millCenter,mapBounds} from './world-geometry.js';
const CHUNK=256,PX=2,SIZE=CHUNK/PX,TAU=Math.PI*2;
const BIOMES={
 village:{ground:['#1d3626','#22402c','#284a32','#2f5539'],road:['#4f4130','#5c4c37','#6a583f'],edge:'#3d3326',cobble:['#4e524d','#5d625b','#6d726a'],water:['#183847','#1f4657','#2a586b'],shore:'#5b5a3c',dark:.42,
  details:[['tuft',.3],['flower',.1],['pebble',.12],['mushroom',.04],['leaf',.06]],decor:[['fence',.05],['grave',.03],['hay',.03],['lamp',.035],['cart',.012],['stump',.04],['sign',.015]],flowers:['#e7c26a','#d97a8a','#c8d8f0','#f2f0e0','#b99ae8']},
 quarry:{ground:['#30353c','#373d45','#3f464f','#474f59'],road:['#4c4339','#574d42','#62574a'],edge:'#2b2622',cobble:['#4d5157','#5a5f66','#686d74'],water:['#1a2f3c','#203a4a','#294658'],shore:'#4a4a48',dark:.5,
  details:[['pebble',.4],['crack',.14],['dust',.12],['tuft',.05]],decor:[['crystal',.05],['barrel',.035],['lamp',.03],['planks',.03],['ore',.03],['pick',.012]],flowers:['#8fd6ff','#c49bff','#ffd27a']},
 mill:{ground:['#16332f','#1b3d38','#214741','#28524b'],road:['#5a4330','#684e37','#4b3726'],edge:'#2e2219',cobble:['#4a5048','#576052','#646d5f'],water:['#103444','#154152','#1d5064'],shore:'#3e4a34',dark:.4,boardwalk:true,
  details:[['tuft',.24],['reed',.07],['pebble',.08],['flower',.05]],decor:[['post',.05],['lamp',.03],['reeds',.08],['sack',.03],['stump',.03]],flowers:['#d9e3a0','#a7d3e8','#f0d0e0']},
 marsh:{ground:['#251f30','#2b2437','#322a40','#3a3149'],road:['#4a3f33','#55493b','#3f352b'],edge:'#211a1c',cobble:['#433b4c','#4f4659','#5b5266'],water:['#2b3a55','#354968','#425b7e'],shore:'#3a3346',dark:.5,boardwalk:true,
  details:[['reed',.08],['tuft',.12],['glass',.08],['pebble',.08]],decor:[['shard',.06],['reeds',.08],['bones',.025],['wisp',.03],['post',.03]],flowers:['#bfa8f0','#8fe0e8','#f0c8f8']},
 bellwood:{ground:['#252c1f','#2c3424','#343d2a','#3d4731'],road:['#574d35','#64593e','#4a412d'],edge:'#2a251a',cobble:['#4c5040','#5a5f4b','#686e57'],water:['#1d3a3a','#244747','#2d5656'],shore:'#4a4a33',dark:.36,
  details:[['leaf',.36],['tuft',.18],['mushroom',.08],['flower',.08],['root',.06]],decor:[['bellpost',.035],['ring',.02],['log',.04],['stone',.03],['stump',.04],['lamp',.02]],flowers:['#f2c86a','#e98a5a','#f5ecd0','#c9e08a']}
};
export const biome=id=>BIOMES[id]||BIOMES.village;
const pick=(list,h)=>list[Math.min(list.length-1,Math.floor(h*list.length))];
function chooseWeighted(list,h){let acc=0;for(const [name,w] of list){acc+=w;if(h<acc)return name;}return null;}

export class WorldPainter{
 constructor(){this.cache=new Map();this.key='';}
 reset(key){if(key!==this.key){this.cache.clear();this.key=key;}}
 chunk(r,cx,cy){const id=cx+':'+cy;let ch=this.cache.get(id);if(ch){this.cache.delete(id);this.cache.set(id,ch);return ch;}
  ch=paintChunk(r,cx,cy);this.cache.set(id,ch);if(this.cache.size>90)this.cache.delete(this.cache.keys().next().value);return ch;}
 draw(c,r,view){this.reset(r.mapId+':'+(r.worldOrigin?.x||0)+':'+(r.worldOrigin?.y||0));const lights=[];
  for(let cx=Math.floor(view.left/CHUNK);cx<=Math.floor(view.right/CHUNK);cx++)for(let cy=Math.floor(view.top/CHUNK);cy<=Math.floor(view.bottom/CHUNK);cy++){
   const ch=this.chunk(r,cx,cy);c.drawImage(ch.canvas,cx*CHUNK,cy*CHUNK,CHUNK,CHUNK);for(const l of ch.lights)lights.push(l);}
  return lights;}
}

function paintChunk(r,cx,cy){
 const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(SIZE,SIZE):Object.assign(document.createElement('canvas'),{width:SIZE,height:SIZE});
 const c=canvas.getContext('2d'),b=biome(r.mapId),o=r.worldOrigin||{x:0,y:0},map=r.mapId,img=c.createImageData(SIZE,SIZE),data=img.data,width=ROAD_WIDTH[map]||30,lights=[];
 const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
 const G=b.ground.map(rgb),R=b.road.map(rgb),C=b.cobble.map(rgb),W=b.water.map(rgb),E=rgb(b.edge),S=rgb(b.shore);
 for(let py=0;py<SIZE;py++)for(let px=0;px<SIZE;px++){const wx=cx*CHUNK+px*PX+1,wy=cy*CHUNK+py*PX+1,i=(py*SIZE+px)*4,dither=hash2(wx,wy,9);let col;
  if(waterAt(map,wx,wy,o)){const n=fbm(wx/90,wy/90,2);col=W[Math.min(2,Math.floor(n*3+dither*.4))];if(hash2(Math.floor(wx/14),Math.floor(wy/4),3)>.93)col=[col[0]+28,col[1]+34,col[2]+40];}
  else{const near=waterAt(map,wx+8,wy,o)||waterAt(map,wx-8,wy,o)||waterAt(map,wx,wy+8,o)||waterAt(map,wx,wy-8,o),rd=roadDistance(map,wx,wy,o);
   if(near)col=S;
   else if(rd<width){const plaza=map==='village'&&fbm(wx/160,wy/160,21)>.56||map==='bellwood'&&Math.hypot(wx-o.x,wy-o.y)<170;
    if(b.boardwalk&&!plaza){const plank=Math.floor((wy+(map==='marsh'?wx*.3:0))/10);col=R[(plank%3+3)%3];if(((wy%10)+10)%10<1.6)col=E;}
    else if(plaza){const bx=Math.floor(wx/12+(Math.floor(wy/10)%2)*.5),by=Math.floor(wy/10);col=C[Math.floor(hash2(bx,by,4)*3)];if(((wy%10)+10)%10<2||((wx+(Math.floor(wy/10)%2)*6)%12+12)%12<2)col=E;}
    else{col=R[Math.min(2,Math.floor(fbm(wx/40,wy/40,8)*2.4+dither*.6))];if(rd>width-5)col=E;else if(Math.abs(rd-width*.45)<2.5&&map!=='bellwood')col=R[0];}}
   else{const n=fbm(wx/150,wy/150,1)*.7+fbm(wx/35,wy/35,6)*.3;col=G[Math.max(0,Math.min(3,Math.floor(n*4.2+dither*.7-.5)))];}}
  data[i]=col[0];data[i+1]=col[1];data[i+2]=col[2];data[i+3]=255;}
 c.putImageData(img,0,0);
 // Small details: tufts, flowers, pebbles, leaves.
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 for(let k=0;k<44;k++){const hx=hash2(cx*71+k,cy*37,1),hy=hash2(cx*13,cy*91+k,2),px=hx*SIZE,py=hy*SIZE,wx=cx*CHUNK+px*PX,wy=cy*CHUNK+py*PX;
  if(waterAt(map,wx,wy,o)){if(map==='mill'&&hash2(k,cx,cy)>.8){rect(px,py,4,3,'#2f6b3a');rect(px+1,py+1,2,1,'#4a8f4f');}continue;}
  if(roadDistance(map,wx,wy,o)<width+4)continue;
  const kind=chooseWeighted(b.details,hash2(k,cx*5,cy*3));if(!kind)continue;const g=b.ground,v=hash2(k*3,cx,cy);
  if(kind==='tuft'){rect(px,py,1,3,g[3]);rect(px+1,py-1,1,4,'#4f7a4a');rect(px+2,py,1,3,g[3]);}
  else if(kind==='flower'){const f=pick(b.flowers,v);rect(px,py+1,1,2,'#3e6b3a');rect(px-1,py,3,1,f);rect(px,py-1,1,3,f);rect(px,py,1,1,'#fff6c8');}
  else if(kind==='pebble'){rect(px,py,3,2,'#6d726d');rect(px,py,2,1,'#8b908a');}
  else if(kind==='mushroom'){rect(px,py+1,1,2,'#e8dcc0');rect(px-1,py,3,1,v>.5?'#c94a3c':'#d8a45a');rect(px,py,1,1,'#fff');}
  else if(kind==='leaf'){rect(px,py,2,1,pick(['#b5622f','#d08a3a','#8e4a2a','#c9a24a'],v));}
  else if(kind==='crack'){rect(px,py,4,1,'#262a30');rect(px+3,py+1,3,1,'#262a30');}
  else if(kind==='dust'){rect(px,py,2,2,'#59606a');}
  else if(kind==='reed'){rect(px,py-3,1,5,'#5b7a3e');rect(px+2,py-4,1,6,'#6d8f48');rect(px+2,py-5,1,2,'#7a5a34');}
  else if(kind==='glass'){rect(px,py,2,2,'#9fc4f0');rect(px,py,1,1,'#eaf6ff');}
  else if(kind==='root'){rect(px,py,6,1,'#4a3a26');rect(px+5,py+1,4,1,'#4a3a26');}
 }
 // Larger decorations along roads and in the open. Lamps, crystals and wisps also emit light.
 for(let k=0;k<9;k++){const hx=hash2(cx*17+k*5,cy*29,11),hy=hash2(cx*41,cy*53+k*7,12),px=6+hx*(SIZE-12),py=8+hy*(SIZE-14),wx=cx*CHUNK+px*PX,wy=cy*CHUNK+py*PX;
  if(waterAt(map,wx,wy,o)){if(map==='mill'&&k%3===0){rect(px-3,py,7,3,'#2f6b3a');rect(px-1,py-1,3,1,'#4a8f4f');rect(px,py-2,1,1,'#f0c8e0');}continue;}
  const rd=roadDistance(map,wx,wy,o);if(rd<width+3)continue;const kind=chooseWeighted(b.decor,hash2(k*7,cx*3,cy*11));if(!kind)continue;
  if(['fence','lamp','sign','post','bellpost'].includes(kind)&&rd>width+40)continue;
  drawDecor(c,kind,px,py,hash2(k,cx,cy),lights,wx,wy,map);}
 return {canvas,lights};
}
function drawDecor(c,kind,x,y,v,lights,wx,wy,map){const R=(a,b,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x+a),Math.round(y+b),w,h);};const ink='#121318';
 if(kind==='fence'){for(let i=0;i<4;i++){R(i*4-1,-6,3,8,ink);R(i*4,-5,1,6,'#7a5c3c');}R(-1,-4,15,3,ink);R(0,-3,13,1,'#8a6a46');R(-1,0,15,2,ink);R(0,0,13,1,'#6a4f33');}
 else if(kind==='grave'){R(-3,-9,7,10,ink);R(-2,-8,5,8,'#7d817c');R(-2,-8,5,1,'#9aa09a');R(0,-7,1,4,'#4c504c');R(-1,-6,3,1,'#4c504c');R(-4,1,9,1,'#1b2a1f');}
 else if(kind==='hay'){R(-6,-6,13,8,ink);R(-5,-5,11,6,'#c9a24a');R(-5,-5,11,1,'#e3c46c');for(let i=-4;i<5;i+=3)R(i,-3,1,3,'#9a7a32');}
 else if(kind==='lamp'){R(-1,-14,3,15,ink);R(0,-13,1,13,'#4a4a4a');R(-3,-18,7,5,ink);R(-2,-17,5,3,'#ffd77a');R(-1,-16,3,1,'#fff6c8');lights.push({x:wx,y:wy-30,r:150,color:'#ffcf7a'});}
 else if(kind==='cart'){R(-8,-7,17,7,ink);R(-7,-6,15,5,'#7a5a3a');R(-7,-6,15,1,'#9a7a4a');R(-6,-1,4,4,ink);R(4,-1,4,4,ink);R(-5,0,2,2,'#5a4a3a');R(5,0,2,2,'#5a4a3a');R(9,-3,5,1,'#5a4a3a');}
 else if(kind==='stump'){R(-4,-3,9,5,ink);R(-3,-2,7,3,'#6a4a2e');R(-2,-2,5,1,'#b08a5a');R(-1,-1,3,1,'#8a6a46');}
 else if(kind==='sign'){R(0,-10,2,11,'#5a4430');R(-5,-12,11,5,ink);R(-4,-11,9,3,'#8a6a46');R(-3,-10,6,1,'#3a2a1a');}
 else if(kind==='crystal'){const col=v>.5?'#8fd6ff':'#c49bff';R(-2,-9,5,10,ink);R(-1,-8,3,8,col);R(0,-8,1,6,'#f0fbff');R(2,-5,4,6,ink);R(3,-4,2,4,col);lights.push({x:wx,y:wy-8,r:90,color:col});}
 else if(kind==='barrel'){R(-4,-8,9,9,ink);R(-3,-7,7,7,'#7a5232');R(-3,-5,7,1,'#4a4a4a');R(-3,-2,7,1,'#4a4a4a');R(-2,-7,5,1,'#9a7242');}
 else if(kind==='planks'){R(-7,-3,15,5,ink);R(-6,-2,13,1,'#8a6a46');R(-6,0,13,1,'#7a5a3a');}
 else if(kind==='ore'){R(-4,-4,9,5,ink);R(-3,-3,7,3,'#5b616a');R(-2,-3,2,1,'#ffd27a');R(2,-2,1,1,'#ffd27a');}
 else if(kind==='pick'){R(-5,-1,11,1,'#6a4a2e');R(4,-4,1,7,'#9aa0a8');}
 else if(kind==='post'){R(-1,-10,4,11,ink);R(0,-9,2,9,'#6a4f33');R(-2,-6,6,1,'#3a2a1a');}
 else if(kind==='reeds'){for(let i=-3;i<4;i+=2){R(i,-7-(i&1)*2,1,8,'#5b7a3e');R(i,-8-(i&1)*2,1,2,'#7a5a34');}}
 else if(kind==='sack'){R(-4,-6,9,7,ink);R(-3,-5,7,5,'#c9b48a');R(-1,-6,3,1,'#8a7a5a');}
 else if(kind==='shard'){R(-1,-8,3,9,ink);R(0,-7,1,7,'#bcd8ff');R(2,-4,3,5,ink);R(3,-3,1,3,'#9fc4f0');lights.push({x:wx,y:wy-6,r:70,color:'#a8c8ff'});}
 else if(kind==='bones'){R(-4,0,9,1,'#d8d2c0');R(-5,-1,2,3,'#d8d2c0');R(4,-1,2,3,'#d8d2c0');R(-1,-3,3,3,'#e8e2d0');R(-1,-2,1,1,ink);}
 else if(kind==='wisp'){R(-1,-10,3,3,'#9fe8ff');R(0,-9,1,1,'#ffffff');lights.push({x:wx,y:wy-20,r:110,color:'#8fe8ff'});}
 else if(kind==='bellpost'){R(-1,-16,3,17,ink);R(0,-15,1,15,'#6a4f33');R(-1,-16,8,2,'#6a4f33');R(4,-14,5,5,ink);R(5,-13,3,3,'#d8b45a');R(6,-10,1,1,'#fff6c8');lights.push({x:wx+12,y:wy-26,r:80,color:'#ffd88a'});}
 else if(kind==='ring'){for(let i=0;i<8;i++){const a=i*TAU/8,px=Math.cos(a)*9,py=Math.sin(a)*5;R(px,py+1,1,2,'#e8dcc0');R(px-1,py,3,1,i%2?'#c94a3c':'#e8c06a');}lights.push({x:wx,y:wy,r:60,color:'#c9ffd0'});}
 else if(kind==='log'){R(-9,-3,19,5,ink);R(-8,-2,17,3,'#6a4a2e');R(-8,-2,17,1,'#8a6a46');R(8,-2,2,3,'#b08a5a');}
 else if(kind==='stone'){R(-5,-6,11,7,ink);R(-4,-5,9,5,'#6d7266');R(-4,-5,9,1,'#8a9082');R(-2,-3,5,1,'#4f8a5a');}
}

// Ambient life drawn every frame in world space: fireflies, drifting fog, falling leaves, rain.
export function drawAmbient(c,r,view,time,reduced){if(reduced)return;const map=r.mapId,t=time;c.save();
 if(map==='village'||map==='bellwood'||map==='mill'){for(let i=0;i<24;i++){const bx=Math.floor(view.left/400)*400+(i%6)*400/6*4,by=Math.floor(view.top/400)*400+Math.floor(i/6)*420,x=bx+hash2(i,1,map.length)*400+Math.sin(t*.7+i)*30,y=by+hash2(i,2,map.length)*400+Math.cos(t*.5+i*1.7)*24;if(x<view.left-20||x>view.right+20||y<view.top-20||y>view.bottom+20)continue;const glow=.5+.5*Math.sin(t*3+i*2.3);c.globalAlpha=.25+.6*glow;c.fillStyle=map==='mill'?'#bff0ff':'#ffe9a0';c.fillRect(Math.round(x),Math.round(y),3,3);c.globalAlpha=.15*glow;c.fillRect(Math.round(x)-3,Math.round(y)-3,9,9);}}
 if(map==='marsh'||map==='mill'){c.fillStyle=map==='marsh'?'#b9a8d8':'#a8c8c8';for(let i=0;i<10;i++){const x=view.left+((hash2(i,7,3)*(view.right-view.left+400)+t*(12+i*2))%(view.right-view.left+400))-200,y=view.top+hash2(i,8,3)*(view.bottom-view.top);c.globalAlpha=.06;c.beginPath();c.ellipse(x,y,160,40,0,0,TAU);c.fill();}}
 if(map==='bellwood'){for(let i=0;i<18;i++){const span=view.bottom-view.top+60,y=view.top-30+((hash2(i,3,1)*span+t*(26+i))%span),x=view.left+hash2(i,4,1)*(view.right-view.left)+Math.sin(t*1.3+i)*18;c.globalAlpha=.8;c.fillStyle=['#c9762f','#e0a040','#a8502a'][i%3];c.fillRect(Math.round(x),Math.round(y),3,2);}}
 if(map==='mill'){c.strokeStyle='#9cc4d8';c.lineWidth=1;c.globalAlpha=.28;c.beginPath();for(let i=0;i<70;i++){const span=view.bottom-view.top,x=view.left+hash2(i,5,2)*(view.right-view.left),y=view.top+((hash2(i,6,2)*span+t*420)%span);c.moveTo(x,y);c.lineTo(x-3,y+12);}c.stroke();}
 c.restore();}

// Night and lantern light. Darkness is painted on a small offscreen layer, lights are cut out of it
// and the result is stretched over the screen (soft edges for free).
export class Lighting{
 constructor(){this.canvas=document.createElement('canvas');this.ctx=this.canvas.getContext('2d');}
 draw(main,r,view,lights,brightness,screen){const dark=biome(r.mapId).dark*(1.15-brightness);if(dark<=.02)return;const q=4,w=Math.ceil(screen.width/q),h=Math.ceil(screen.height/q);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const c=this.ctx,sx=w/(view.right-view.left),sy=h/(view.bottom-view.top),X=x=>(x-view.left)*sx,Y=y=>(y-view.top)*sy;c.globalCompositeOperation='source-over';c.clearRect(0,0,w,h);c.fillStyle=`rgba(4,8,16,${Math.min(.85,dark)})`;c.fillRect(0,0,w,h);
  c.globalCompositeOperation='destination-out';const hole=(x,y,rad,strength=1)=>{const g=c.createRadialGradient(X(x),Y(y),0,X(x),Y(y),rad*sx);g.addColorStop(0,`rgba(0,0,0,${strength})`);g.addColorStop(.55,`rgba(0,0,0,${strength*.75})`);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(X(x)-rad*sx,Y(y)-rad*sx,rad*sx*2,rad*sx*2);};
  const flicker=1+.04*Math.sin(r.time*9)+.03*Math.sin(r.time*23);hole(r.x,r.y-10,280*flicker,1);for(const l of lights)hole(l.x,l.y,l.r,.85);for(const z of r.zones||[])if(z.burn&&z.life>0)hole(z.x,z.y,70,.5);
  c.globalCompositeOperation='source-over';main.save();main.setTransform(1,0,0,1,0,0);main.imageSmoothingEnabled=true;main.drawImage(this.canvas,0,0,main.canvas.width,main.canvas.height);main.restore();
  // Warm glow pools on top so lamps read as light, not only as holes in the dark.
  main.save();main.globalCompositeOperation='lighter';for(const l of lights){if(l.x<view.left-l.r||l.x>view.right+l.r||l.y<view.top-l.r||l.y>view.bottom+l.r)continue;const g=main.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r*.6);g.addColorStop(0,l.color+'33');g.addColorStop(1,l.color+'00');main.fillStyle=g;main.fillRect(l.x-l.r,l.y-l.r,l.r*2,l.r*2);}
  const g=main.createRadialGradient(r.x,r.y-10,0,r.x,r.y-10,150);g.addColorStop(0,'#ffd88a22');g.addColorStop(1,'#ffd88a00');main.fillStyle=g;main.fillRect(r.x-150,r.y-160,300,300);main.restore();}
}
