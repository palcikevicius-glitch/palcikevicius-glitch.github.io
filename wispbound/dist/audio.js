// V0.2.1: every map has its own score; the title and camp share the menu theme.
export const MAP_TRACKS=['village','quarry','mill','marsh','bellwood'];
export const trackFor=(mapId,boss,scene='journey')=>scene==='intro'||scene==='menu'?'menu':boss?'boss':MAP_TRACKS.includes(mapId)?mapId:'village';
export class Score{
 constructor(){this.tracks={};this.ready=false;this.target='menu';this.active=null;this.volume=0;this.levels={};this.pending={};this.blocked={};this.previous=0;}
 ensure(id){if(!this.tracks[id]){const a=new Audio(`./assets/music-${id}.mp3`);a.loop=true;a.preload='auto';a.volume=0;a.hidden=true;if(a.dataset)a.dataset.soundtrack=id;if(typeof document!=='undefined')document.body.append(a);this.tracks[id]=a;this.levels[id]=0;}return this.tracks[id];}
 // Prime all four scenes while the browser still has the user's audio gesture.
 unlock(){const first=!this.ready;this.ready=true;this.blocked={};for(const id of ['menu','boss',...MAP_TRACKS]){this.ensure(id);if(first)this.play(id,true);}this.sync(this.options||{enabled:true,volume:.2,scene:'intro'});}
 play(id,prime=false){const a=this.ensure(id);if(this.pending[id]||this.blocked[id])return;this.pending[id]=true;let promise;try{promise=a.play();}catch(e){promise=Promise.reject(e);}Promise.resolve(promise).then(()=>{this.pending[id]=false;if(this.target===id&&this.volume>0)this.active=id;else if(prime){a.pause();a.volume=0;}}).catch(()=>{this.pending[id]=false;this.blocked[id]=true;}).finally(()=>{this.pending[id]=false;});}
 get needsGesture(){return !!this.blocked[this.target];}
 sync(options){this.options=options;this.target=trackFor(options.mapId,options.boss,options.scene);this.volume=options.enabled?options.volume:0;
  if(!this.ready)return;
  const id=this.target;
  this.ensure(id);
  if(this.volume>0){const a=this.tracks[id];if(a.paused)this.play(id);else this.active=id;}
  // Wait for the incoming track to start, then crossfade over 2.2 seconds.
  // Muting and backgrounding stop immediately.
  if(!this.volume)for(const [id,a] of Object.entries(this.tracks)){a.pause();a.volume=0;this.levels[id]=0;}
 }
 tick(now){const dt=Math.min(.1,Math.max(0,(now-this.previous)/1000));this.previous=now;
  for(const [id,a] of Object.entries(this.tracks)){const target=id===this.active?this.volume:0,rate=Math.max(this.volume,.2)/2.2;this.levels[id]+=Math.sign(target-this.levels[id])*Math.min(Math.abs(target-this.levels[id]),dt*rate);a.volume=Math.max(0,Math.min(1,this.levels[id]));if(!target&&this.levels[id]<.001&&id!==this.target&&!this.pending[id])a.pause();}
 }
 pause(){this.sync({...this.options,enabled:false});}
}
