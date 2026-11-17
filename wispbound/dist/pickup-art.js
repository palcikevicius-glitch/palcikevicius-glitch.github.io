// The visible fire front uses the same combat-clock expansion as its damage wave.
export function drawPickupBlast(c,e,reduced=false){
 const age=e.maxLife-e.life,progress=Math.min(1,age/(e.expansion||.9)),radius=e.size*progress,fade=Math.min(1,e.life/.3);c.save();c.translate(e.x,e.y);
 if(age<.22){const lift=Math.sin(age/.22*Math.PI)*18;c.fillStyle='#11202b';c.fillRect(-12,-20-lift,24,24);c.fillStyle='#384149';c.fillRect(-9,-19-lift,18,20);c.fillStyle='#ffdc96';c.fillRect(3,-26-lift,4,8);c.fillStyle='#ff8250';c.fillRect(5,-30-lift,5,5);}
 c.globalAlpha=(reduced?.08:.16)*fade;c.fillStyle='#f86631';c.beginPath();c.arc(0,0,Math.max(1,radius),0,Math.PI*2);c.fill();
 for(let ring=0;ring<3;ring++){c.globalAlpha=(reduced?.22:.8)*fade;c.strokeStyle=['#ff4c33','#ff9e42','#ffe5a3'][ring];c.lineWidth=[20,12,4][ring];c.beginPath();c.arc(0,0,Math.max(1,radius-ring*5),0,Math.PI*2);c.stroke();}
 const count=reduced?16:64;for(let i=0;i<count;i++){const angle=i*Math.PI*2/count,wobble=Math.sin(i*7+age*16),distance=radius-8+(i%3)*5,x=Math.cos(angle)*distance,y=Math.sin(angle)*distance,height=9+(i%5)*4+Math.abs(wobble)*8;c.globalAlpha=fade*.85;c.fillStyle=i%2?'#ff793a':'#e54a32';c.fillRect(Math.round(x-4),Math.round(y-height),8,height);c.fillStyle='#ffd68b';c.fillRect(Math.round(x-2),Math.round(y-height*.55),4,height*.55);if(!reduced){c.fillStyle='#ffedba';c.globalAlpha*=.65;const ember=radius+12+(i%4)*9;c.fillRect(Math.round(Math.cos(angle)*ember),Math.round(Math.sin(angle)*ember-age*10),3,3);}}
 c.restore();
}
