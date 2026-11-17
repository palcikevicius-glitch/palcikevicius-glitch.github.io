/** Pixel death and map-edge art. World coordinates; no imports, assets or gameplay mutations. */
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const noise=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const finite=n=>Number.isFinite(n);
function rect(c,x,y,w,h,color){if(w<=0||h<=0)return;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function line(c,points,color,width=1){if(points.length<2)return;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.strokeStyle=color;c.lineWidth=width;c.stroke();}

/**
 * fx.life counts down from fx.maxLife (normally 1.1 seconds).
 * The parent's white enemy silhouette occupies the first 0.13 seconds.
 * Returns true only while a soul is visible. Reduced motion uses a static wisp.
 */
export function drawSoulRelease(c,fx,reduced=false,quality='high'){
 if(!fx||!finite(fx.x)||!finite(fx.y))return false;
 const maxLife=finite(fx.maxLife)&&fx.maxLife>.13?fx.maxLife:1.1,life=finite(fx.life)?fx.life:maxLife,age=maxLife-life;
 if(life<=0||age<.13||age>maxLife)return false;
 const p=clamp((age-.13)/(maxLife-.13)),alpha=clamp((age-.13)/.075)*clamp(life/.28),elite=!!fx.elite,seed=finite(fx.seed)?fx.seed:fx.x*.07+fx.y*.11,size=clamp(Math.ceil((finite(fx.size)?fx.size:14)/12),1,3),baseY=fx.y-size*5;
 const lift=reduced?12:7+(elite?55:45)*Math.pow(p,.78),drift=reduced?0:(Math.sin(seed+p*4)-Math.sin(seed))*4,x=Math.round(fx.x+drift),y=Math.round(baseY-lift);
 const color=elite?'#f5d181':'#92dfeb',light=elite?'#fff0bc':'#d5fcff',white=elite?'#fffbed':'#f4ffff',shadow=elite?'#9c744b':'#477f98';
 c.save();const opacity=c.globalAlpha*alpha;c.globalAlpha=opacity;
 // The ribbon connects the rising spirit to its former body, with stepped
 // changes in direction so it remains sharp at the game's low FX resolution.
 const tail=[],steps=quality==='low'?4:7;
 for(let i=0;i<=steps;i++){const t=i/steps,wave=reduced?Math.sin(t*3)*2:Math.sin(seed+p*6+t*4)*Math.sin(t*Math.PI)*4,xx=Math.round(x+(fx.x-x)*t+wave),yy=Math.round(y+4*size+(baseY-y-4*size)*t);if(i)tail.push([xx,tail[tail.length-1][1]]);tail.push([xx,yy]);}
 c.globalAlpha=opacity*.4;line(c,tail,color,Math.max(2,size*2));c.globalAlpha=opacity*.75;line(c,tail.slice(0,Math.max(4,Math.floor(tail.length*.58))),light,Math.max(1,size));
 c.save();c.translate(x,y);c.scale(size,size);
 if(quality!=='low'){c.globalAlpha=opacity*.12;rect(c,-6,-7,12,13,color);rect(c,-8,-4,16,8,color);c.globalAlpha=opacity*.22;rect(c,-5,-5,10,10,color);}
 c.globalAlpha=opacity;
 rect(c,-2,-6,4,1,shadow);rect(c,-3,-5,6,1,shadow);rect(c,-4,-4,8,6,shadow);rect(c,-3,2,6,3,shadow);rect(c,-2,5,4,2,shadow);
 rect(c,-2,-5,4,1,light);rect(c,-3,-4,6,5,color);rect(c,-2,1,4,3,color);rect(c,-1,4,2,2,color);
 rect(c,-2,-4,4,2,white);rect(c,-3,-2,2,3,light);rect(c,-2,1,2,2,light);
 // Two small hollows read as a released spirit rather than a loose XP gem.
 rect(c,-2,-1,1,2,shadow);rect(c,1,-1,1,2,shadow);rect(c,-1,2,2,1,light);
 if(elite){rect(c,-3,-7,1,2,color);rect(c,2,-7,1,2,color);rect(c,-1,-8,2,2,light);}
 c.restore();
 if(!reduced){const count=quality==='low'?2:elite?8:5;for(let i=0;i<count;i++){const a=noise(seed+i*13)*Math.PI*2,spread=(7+noise(seed+i+8)*18)*(1+p),xx=fx.x+Math.cos(a)*spread,yy=baseY+Math.sin(a)*spread*.4-p*(18+noise(seed+i+30)*24);c.globalAlpha=opacity*(.35+.35*noise(seed+i+50));rect(c,xx,yy,i%3===0?2:1,i%2?2:3,i%2?color:white);}}
 c.restore();return true;
}

const WALLS={horizontal:{deep:'#27313a',face:'#46545b',top:'#78827d',light:'#a0aa92',moss:'#586e54'},vertical:{deep:'#26313f',face:'#46566a',top:'#7b8b99',light:'#a6b5b6',moss:'#4c746b'},square:{deep:'#302d40',face:'#514b61',top:'#82788b',light:'#b3a6ad',moss:'#666c5c'}};
const WALL_DEPTH=24,BLOCK=48;
function edgePalette(shape){return WALLS[shape]||WALLS.square;}
function outside(c,b,v){const color='#07121b',w=v.right-v.left,h=v.bottom-v.top;
 if(finite(b.minX)&&b.minX>v.left)rect(c,v.left,v.top,Math.min(v.right,b.minX)-v.left,h,color);
 if(finite(b.maxX)&&b.maxX<v.right)rect(c,Math.max(v.left,b.maxX),v.top,v.right-Math.max(v.left,b.maxX),h,color);
 if(finite(b.minY)&&b.minY>v.top)rect(c,v.left,v.top,w,Math.min(v.bottom,b.minY)-v.top,color);
 if(finite(b.maxY)&&b.maxY<v.bottom)rect(c,v.left,Math.max(v.top,b.maxY),w,v.bottom-Math.max(v.top,b.maxY),color);
}
// All stone geometry is generated in edge coordinates: x runs along the wall,
// y=0 is its collision boundary, and negative y is outside the playable map.
function masonry(c,start,end,p,time,reduced){
 if(end<=start)return;const step=Math.max(BLOCK,Math.ceil((end-start)/(BLOCK*192))*BLOCK),first=Math.floor(start/step)*step;
 rect(c,start,-WALL_DEPTH,end-start,WALL_DEPTH,p.deep);rect(c,start,0,end-start,5,'#091922');
 for(let x=first;x<end;x+=step){const index=Math.floor(x/step),grain=noise(index+17),left=Math.max(start,x),right=Math.min(end,x+step-1);if(right<=left)continue;
  rect(c,left,-21,right-left,18,p.face);rect(c,left+1,-21,Math.max(0,right-left-2),3,p.top);rect(c,left+1,-18,Math.max(0,right-left-2),1,p.light);rect(c,left+1,-3,Math.max(0,right-left-2),3,p.deep);
  const middle=x+step*.5;if(middle>left+4&&middle<right-4){rect(c,middle,-17,1,7,p.deep);rect(c,middle+1,-11,3,1,p.deep);}
  if(grain>.35){const mx=x+step*.2;if(mx>=left&&mx+7<=right){rect(c,mx,-5,7,2,p.moss);rect(c,mx+2,-3,3,3,p.moss);}}
  if(index%4===0&&right-left>16){const px=Math.max(left+4,Math.min(right-10,x+step*.72));rect(c,px,-26,10,27,'#111d2a');rect(c,px+1,-25,8,23,p.face);rect(c,px+1,-25,8,4,p.top);rect(c,px+2,-24,5,1,p.light);rect(c,px+2,-2,5,2,p.deep);
   if(index%12===0){const shine=reduced?.7:.65+Math.sin(time*1.8+index)*.12;c.save();c.globalAlpha*=shine;rect(c,px+4,-17,2,5,'#9cc7b2');rect(c,px+3,-15,4,1,'#c5dbc0');c.restore();}
  }
 }
 // A continuous top seam keeps the wall readable even when a camera edge cuts a block.
 rect(c,start,-2,end-start,2,p.top);rect(c,start,0,end-start,1,p.light);
}
function horizontal(c,y,start,end,top,p,time,reduced){c.save();c.translate(0,y);if(!top)c.scale(1,-1);masonry(c,start,end,p,time,reduced);c.restore();}
function vertical(c,x,start,end,left,p,time,reduced){c.save();c.translate(x,0);c.rotate(Math.PI/2);if(left)c.scale(1,-1);masonry(c,start,end,p,time,reduced);c.restore();}

/**
 * bounds: {minX,maxX,minY,maxY,shape}; infinite/free axes receive no wall.
 * view: {left,right,top,bottom} in world coordinates. Call after terrain and
 * before actors/hostile telegraphs. Walls occupy the outside of collision bounds.
 */
export function drawWorldBoundary(c,bounds,view,time=0,reduced=false){
 if(!bounds||!view||!['left','right','top','bottom'].every(k=>finite(view[k]))||view.right<=view.left||view.bottom<=view.top)return;
 const b=bounds,v=view,p=edgePalette(b.shape),margin=WALL_DEPTH+7,minX=finite(b.minX)?b.minX:-Infinity,maxX=finite(b.maxX)?b.maxX:Infinity,minY=finite(b.minY)?b.minY:-Infinity,maxY=finite(b.maxY)?b.maxY:Infinity;if(minX>maxX||minY>maxY)return;
 c.save();outside(c,b,v);
 const fromX=Math.max(v.left-1,minX),toX=Math.min(v.right+1,maxX),fromY=Math.max(v.top-1,minY),toY=Math.min(v.bottom+1,maxY),t=finite(time)?time:0;
 if(finite(minY)&&minY>=v.top-margin&&minY<=v.bottom+margin)horizontal(c,minY,fromX,toX,true,p,t,reduced);
 if(finite(maxY)&&maxY>=v.top-margin&&maxY<=v.bottom+margin)horizontal(c,maxY,fromX,toX,false,p,t,reduced);
 if(finite(minX)&&minX>=v.left-margin&&minX<=v.right+margin)vertical(c,minX,fromY,toY,true,p,t,reduced);
 if(finite(maxX)&&maxX>=v.left-margin&&maxX<=v.right+margin)vertical(c,maxX,fromY,toY,false,p,t,reduced);
 // Square-map corner stones join the perpendicular edges without bright gaps.
 for(const x of [minX,maxX])for(const y of [minY,maxY])if(finite(x)&&finite(y)&&x>v.left-margin&&x<v.right+margin&&y>v.top-margin&&y<v.bottom+margin){const xx=x===minX?x-WALL_DEPTH:x,yy=y===minY?y-WALL_DEPTH:y;rect(c,xx,yy,WALL_DEPTH,WALL_DEPTH,p.deep);rect(c,xx+2,yy+2,WALL_DEPTH-4,WALL_DEPTH-4,p.face);rect(c,xx+2,yy+2,WALL_DEPTH-4,3,p.top);rect(c,xx+3,yy+3,WALL_DEPTH-6,1,p.light);}
 c.restore();
}
