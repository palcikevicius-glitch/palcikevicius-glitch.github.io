import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {VERSION} from '../dist/catalog.js';import {currentChanges} from '../dist/changelog.js';
const root=path.resolve('dist'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const apk=fs.readFileSync(path.join(root,'wispbound-android.apk'));
const release={schema:1,version:`${Math.floor(VERSION.build/100)}.${String(VERSION.build%100).padStart(2,'0')}`,displayVersion:VERSION.name,build:VERSION.build,channel:VERSION.channel,saveSchema:VERSION.save,publishedAt:new Date().toISOString(),android:{package:'lt.benas.wispbound',size:apk.length,sha256:sha(apk)},playUrl:null,appStoreUrl:null,changes:currentChanges().items};
fs.writeFileSync(path.join(root,'release.json'),JSON.stringify(release,null,2));
// Legacy clients require X.YY in release.version; every player-facing surface uses displayVersion.
const assetFiles=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).filter(n=>!n.name.startsWith('.')&&n.name!=='desktop.ini').flatMap(n=>n.isDirectory()?assetFiles(dir+'/'+n.name):[dir+'/'+n.name]);
const files=['index.html','style.css','catalog.js','progression.js','weapon-art.js','artifact-art.js','skill-tree.js','combat-art.js','action-art.js','adventure-art.js','pickup-art.js','soul-art.js','world-geometry.js','spatial-grid.js','balance.js','rituals.js','encounters.js','movement-input.js','core.js','changelog.js','storage.js','profiles.js','audio.js','i18n.js','content-i18n.js','app.js','render.js','updates.js','update-model.js','manifest.webmanifest','download-qr.svg',...assetFiles('assets')];
// Hosting may inject metadata into HTML responses. Serve the canonical shell as
// plain text, verify its bytes, then cache it explicitly as HTML for navigation.
fs.copyFileSync(path.join(root,'index.html'),path.join(root,'offline-shell.txt'));
const manifest=files.map(url=>({url,...(url==='index.html'?{source:'offline-shell.txt',contentType:'text/html; charset=utf-8'}:{}),sha256:sha(fs.readFileSync(path.join(root,url)))}));
const template=fs.readFileSync('scripts/sw.template.js','utf8').replace('__BUILD__',String(VERSION.build)).replace('__FILES__',JSON.stringify(manifest));
fs.writeFileSync(path.join(root,'sw.js'),template);console.log(JSON.stringify({build:VERSION.build,apkBytes:apk.length,sha256:release.android.sha256,cachedFiles:files.length}));
