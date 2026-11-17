'use strict';
(() => {
  const status=document.getElementById('download-status'),progress=document.getElementById('progress'),link=document.getElementById('download-link'),retry=document.getElementById('retry-button'),signin=document.getElementById('signin-link');
  let blobUrl;
  async function get(url,signal){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal});
    if(response.status===401||response.status===403){signin.hidden=false;throw Error('Pirmiausia prisijunkite ta pačia ChatGPT paskyra. Tada grįšite į APK atsisiuntimą.');}
    if(!response.ok)throw Error('Nepavyko gauti APK failo. Bandykite dar kartą.');return response;
  }
  async function prepare(){
    link.hidden=true;retry.hidden=true;signin.hidden=true;progress.hidden=false;status.classList.remove('error');status.textContent='Paruošiamas ir tikrinamas APK failas…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
    try{
      const metadata=await get('./latest.json?t='+Date.now(),controller.signal),latest=await metadata.json();
      const url=new URL(latest.apk,location.href);
      if(latest.packageName!=='lt.autoknygele.app'||url.origin!==location.origin||!url.pathname.endsWith('.apk')||!Number.isSafeInteger(latest.size)||latest.size<1000||latest.size>50*1024*1024||!/^[a-f0-9]{64}$/.test(latest.sha256)||!/^\d+\.\d{2}$/.test(latest.versionName))throw Error('Netinkama leidimo informacija. Bandykite vėliau.');
      const response=await get(url,controller.signal),bytes=await response.arrayBuffer(),view=new Uint8Array(bytes);
      if(bytes.byteLength!==latest.size||view[0]!==0x50||view[1]!==0x4b)throw Error('Gautas netinkamas arba neužbaigtas APK failas. Bandykite dar kartą.');
      const digest=await crypto.subtle.digest('SHA-256',bytes),hash=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
      if(hash!==latest.sha256)throw Error('APK patikra nepavyko. Failas nebus siūlomas diegti.');
      if(blobUrl)URL.revokeObjectURL(blobUrl);
      blobUrl=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.android.package-archive'}));link.href=blobUrl;link.download='autoknygele-v'+latest.versionName+'.apk';link.hidden=false;
      link.textContent='Atsisiųsti V'+latest.versionName+' APK';document.querySelector('.tag').textContent='Android 8.0+ · V'+latest.versionName+' · '+Math.ceil(bytes.byteLength/1024)+' KB';
      status.textContent='V'+latest.versionName+' APK paruoštas ir patikrintas.';
    }catch(e){status.classList.add('error');status.textContent=e.name==='AbortError'?'Ryšys užtruko. Patikrinkite internetą ir bandykite dar kartą.':e.name==='TypeError'?'Ryšio klaida. Patikrinkite internetą ir bandykite dar kartą.':e.message;retry.hidden=false;}
    finally{clearTimeout(timer);progress.hidden=true;}
  }
  retry.addEventListener('click',prepare);
  link.addEventListener('click',()=>{status.textContent='Failas perduotas naršyklei. Atidarykite APK iš telefono atsisiuntimų ir pasirinkite „Atnaujinti“. Ankstesnės programėlės neištrinkite.';});
  prepare();
})();
