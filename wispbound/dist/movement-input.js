// One active finger owns movement. UI taps and secondary fingers never steal it.
export function bindMovementInput({arena,controls,getMode,isActive,onInput}){
 let pointer=null,origin=null;
 const publish=(x=0,y=0)=>onInput({x,y},pointer);
 function reset(id){
  if(id!==undefined&&id!==pointer)return;
  const old=pointer;pointer=null;origin=null;publish();
  controls.classList.remove('engaged');
  const stick=controls.querySelector('.stick');if(stick)stick.style.transform='';
  if(old!==null&&arena.hasPointerCapture(old))arena.releasePointerCapture(old);
 }
 function move(e){
  if(pointer!==e.pointerId||getMode()!=='joystick'||!origin)return;
  const dx=e.clientX-origin.x,dy=e.clientY-origin.y,size=controls.getBoundingClientRect().width;
  const distance=Math.hypot(dx,dy),radius=Math.max(1,size*.35);
  const factor=distance<=5?0:1/Math.max(radius,distance),x=dx*factor,y=dy*factor;
  publish(x,y);const stick=controls.querySelector('.stick');
  if(stick)stick.style.transform=`translate(${x*size*.22}px,${y*size*.22}px)`;
 }
 function down(e){
  if(!isActive()||pointer!==null||e.button!==0)return;
  const mode=getMode(),direction=e.target.closest('[data-dir]');
  if(mode==='arrows'){
   if(!direction||!controls.contains(direction))return;
  }else if(e.target.closest('button,a,input,select,textarea,dialog,[role="button"]'))return;
  e.preventDefault();pointer=e.pointerId;
  if(mode==='joystick'){
   const size=controls.getBoundingClientRect().width,rect=arena.getBoundingClientRect();
   origin={x:e.clientX,y:e.clientY};
   controls.style.left=(e.clientX-rect.left-size/2)+'px';
   controls.style.top=(e.clientY-rect.top-size/2)+'px';
   controls.style.right=controls.style.bottom='auto';
   controls.classList.add('engaged');publish();
  }else{
   const dir=direction.dataset.dir;
   publish(dir==='left'?-1:dir==='right'?1:0,dir==='up'?-1:dir==='down'?1:0);
  }
  arena.setPointerCapture(pointer);
 }
 arena.addEventListener('pointerdown',down);
 arena.addEventListener('pointermove',move);
 for(const name of ['pointerup','pointercancel','lostpointercapture'])arena.addEventListener(name,e=>reset(e.pointerId));
 return {reset};
}
