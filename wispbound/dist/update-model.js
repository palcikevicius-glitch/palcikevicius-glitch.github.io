export function validateRelease(r){
 if(!r||r.schema!==1||!Number.isSafeInteger(r.build)||r.build<1||typeof r.version!=='string'||!/^(?:\d+\.\d{2}|\d+\.\d+\.\d+)$/.test(r.version)||!['direct','store'].includes(r.channel))throw Error('Invalid release');
 if(r.displayVersion!==undefined&&(typeof r.displayVersion!=='string'||!/^\d+\.\d+\.\d+$/.test(r.displayVersion)))throw Error('Invalid display version');
 if(r.android&&(!Number.isSafeInteger(r.android.size)||r.android.size<1||r.android.size>80*1024*1024||!/^[a-f0-9]{64}$/.test(r.android.sha256)||r.android.package!=='lt.benas.wispbound'))throw Error('Invalid Android release');
 return r;
}
export const isNewer=(installed,release)=>release.build>installed;
export const canApply=run=>!run||run.over===true;
export function safeStoreUrl(url,platform){const u=new URL(url);if(u.protocol!=='https:'||!(['play.google.com','apps.apple.com'].includes(u.hostname)))throw Error('Invalid store URL');return u.href;}
