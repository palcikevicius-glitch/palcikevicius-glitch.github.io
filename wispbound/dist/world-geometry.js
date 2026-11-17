// Geometry is independent of the journey clock: endless means unbounded terrain.
const SHAPES={village:'endless',quarry:'horizontal',mill:'vertical',marsh:'endless',bellwood:'square'};
export const millCenter=(run,y)=>{const o=run.worldOrigin||{x:0,y:0};return o.x+105*Math.sin((y-o.y)/520)+48*Math.sin((y-o.y)/1100);};
export function mapBounds(run){
 const id=typeof run==='string'?run:run.mapId,shape=SHAPES[id]||'endless',o=run.worldOrigin||{x:0,y:0};
 const halfX=shape==='vertical'?245:shape==='square'?700:Infinity,halfY=shape==='horizontal'?400:shape==='square'?700:Infinity;
 const center=shape==='vertical'?millCenter(typeof run==='string'?{}:run,run.y||0):o.x;return {shape,minX:center-halfX,maxX:center+halfX,minY:o.y-halfY,maxY:o.y+halfY};
}
export const mapShapeLabel=id=>({endless:'Endless terrain',horizontal:'Horizontal passage',vertical:'Vertical passage',square:'Square arena'}[mapBounds(id).shape]);
export function insideWorld(run,p,padding=0){const b=mapBounds(run.mapId==='mill'?{...run,y:p.y}:run);return p.x>=b.minX+padding&&p.x<=b.maxX-padding&&p.y>=b.minY+padding&&p.y<=b.maxY-padding;}
export function constrainToWorld(run,p,padding=0){const b=mapBounds(run.mapId==='mill'?{...run,y:p.y}:run);p.x=Math.max(b.minX+padding,Math.min(b.maxX-padding,p.x));p.y=Math.max(b.minY+padding,Math.min(b.maxY-padding,p.y));return p;}
export function spawnPoint(run,distance,angle,padding=24){
 // Rotate candidates instead of squeezing a circular wave onto a wall beside the hero.
 for(let i=0;i<32;i++){const a=angle+i*2.399963229728653,p={x:run.x+Math.cos(a)*distance,y:run.y+Math.sin(a)*distance};if(insideWorld(run,p,padding))return p;}
 return constrainToWorld(run,{x:run.x+Math.cos(angle)*distance,y:run.y+Math.sin(angle)*distance},padding);
}
export function prepareWorldGeometry(r){
 if(r.geometryVersion===1){if(r.mapId==='bellwood'&&!r.bellwoodSize){r.worldOrigin={x:r.x,y:r.y};r.bellwoodSize=1;for(const list of [r.enemies,r.props,r.gems,r.powerups,r.chests])for(const p of list||[])constrainToWorld(r,p,(p.radius||12)+8);r.worldClock=0;}if(r.mapId==='mill'&&!r.millRoute){r.worldOrigin={x:r.x,y:r.y};r.millRoute=1;for(const list of [r.enemies,r.props,r.gems,r.powerups,r.chests])for(const p of list||[])constrainToWorld(r,p,(p.radius||12)+8);r.worldClock=0;}return;}
 // Old journeys keep their current position. Center their new finite axes here once.
 const b=mapBounds(r.mapId);r.worldOrigin={x:Number.isFinite(b.minX)?r.x:0,y:Number.isFinite(b.minY)?r.y:0};r.geometryVersion=1;if(r.mapId==='mill')r.millRoute=1;
 for(const list of [r.enemies,r.props,r.gems,r.powerups,r.chests])for(const p of list||[])constrainToWorld(r,p,(p.radius||12)+8);
 r.props=r.props.filter(p=>p.kind==='crate');r.worldClock=0;
 if(r.arena){constrainToWorld(r,r.arena,r.arena.radius+20);for(const p of [r,...r.enemies.filter(e=>e.boss)]){const d=Math.hypot(p.x-r.arena.x,p.y-r.arena.y),limit=r.arena.radius-(p===r?18:35);if(d>limit){p.x=r.arena.x+(p.x-r.arena.x)/d*limit;p.y=r.arena.y+(p.y-r.arena.y)/d*limit;}}}
}

export function offscreenSpawn(run,angle,padding=24){
 const hw=run.viewHalfWidth||340,hh=run.viewHalfHeight||520;
 for(let i=0;i<64;i++){const a=angle+i*2.399963229728653,dx=Math.cos(a),dy=Math.sin(a),d=Math.min((hw+padding+48)/Math.max(.0001,Math.abs(dx)),(hh+padding+48)/Math.max(.0001,Math.abs(dy))),p={x:run.x+dx*d,y:run.y+dy*d};if(insideWorld(run,p,padding))return p;}
 for(const sign of [1,-1]){const p={x:run.x,y:run.y+sign*(hh+padding+80)};constrainToWorld(run,p,padding);if(Math.abs(p.x-run.x)>hw+padding||Math.abs(p.y-run.y)>hh+padding)return p;}
 return spawnPoint(run,Math.hypot(hw,hh)+padding+80,angle,padding);
}

// V0.2.1 terrain: deterministic roads, water and forest density per map. Pure functions shared by
// the scenery generator (collision props) and the ground painter (graphics).
const fract=v=>v-Math.floor(v);
export const hash2=(x,y,seed=0)=>fract(Math.sin(x*127.1+y*311.7+seed*74.7)*43758.5453);
export function valueNoise(x,y,seed=0){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
 const a=hash2(xi,yi,seed),b=hash2(xi+1,yi,seed),c=hash2(xi,yi+1,seed),d=hash2(xi+1,yi+1,seed);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
export const fbm=(x,y,seed=0)=>valueNoise(x,y,seed)*.55+valueNoise(x*2.1,y*2.1,seed+7)*.3+valueNoise(x*4.3,y*4.3,seed+13)*.15;
const wrapDist=(v,period)=>{const m=((v%period)+period)%period;return Math.min(m,period-m);};
// Distance to the nearest road centre line, in world units.
export function roadDistance(mapId,x,y,origin={x:0,y:0}){const X=x-origin.x,Y=y-origin.y;
 if(mapId==='village'){const h=wrapDist(Y+110*Math.sin(X/380)+60*Math.sin(X/170),900),v=wrapDist(X+120*Math.sin(Y/420)+50*Math.sin(Y/150),1100);return Math.min(h,v);}
 if(mapId==='quarry')return Math.abs(Y-60*Math.sin(X/520)-20);
 if(mapId==='mill'){return Math.abs(X-millCenter({worldOrigin:origin},y)+origin.x+120);}
 if(mapId==='marsh'){const h=wrapDist(Y+160*Math.sin(X/300),1300),v=wrapDist(X+140*Math.sin(Y/330),1500);return Math.min(h,v);}
 if(mapId==='bellwood'){const r=Math.hypot(X,Y),a=Math.atan2(Y,X),spoke=Math.abs(Math.sin(a*3+r/260))*r;return r<170?0:Math.min(spoke,Math.abs(r-420));}
 return 9999;}
export const ROAD_WIDTH={village:34,quarry:30,mill:26,marsh:22,bellwood:28};
export function waterAt(mapId,x,y,origin={x:0,y:0}){const X=x-origin.x,Y=y-origin.y;
 if(mapId==='mill'){const off=X-millCenter({worldOrigin:origin},y)+origin.x;return off>40&&off<185;}
 const start=Math.hypot(X,Y)>320;// the journey always begins on dry ground
 if(mapId==='marsh')return start&&fbm(X/260,Y/260,5)>.62&&roadDistance(mapId,x,y,origin)>ROAD_WIDTH.marsh+18;
 if(mapId==='village')return start&&fbm(X/420,Y/420,11)>.74&&roadDistance(mapId,x,y,origin)>80;
 return false;}
export function forestDensity(mapId,x,y,origin={x:0,y:0}){const X=x-origin.x,Y=y-origin.y,n=fbm(X/520,Y/520,3);
 if(mapId==='bellwood'){const r=Math.hypot(X,Y);return Math.max(0,Math.min(1,(r-260)/300))*(.55+.45*n);}
 if(mapId==='quarry')return n>.66?.25:0;
 if(mapId==='mill')return .35+.4*n;
 if(mapId==='marsh')return n>.55?.45:.12;
 return Math.max(0,(n-.45)*2.2);}
