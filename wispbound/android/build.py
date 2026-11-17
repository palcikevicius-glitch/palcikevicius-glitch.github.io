"""Personal direct APK build. Retain the private signing identity outside this source tree.
Usage: python android/build.py --tools PATH --build PATH --signing PATH --output PATH
Uses the existing local Android tools; no Gradle download or account required.
"""
import argparse, pathlib, shutil, subprocess, zipfile, os, secrets, json
p=argparse.ArgumentParser();p.add_argument('--tools',required=True);p.add_argument('--build',required=True);p.add_argument('--signing',required=True);p.add_argument('--output',required=True);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];tools=pathlib.Path(a.tools);build=pathlib.Path(a.build).resolve();signing=pathlib.Path(a.signing).resolve();output=pathlib.Path(a.output).resolve()
for folder in [build,signing,output.parent]:folder.mkdir(parents=True,exist_ok=True)
def find(name):
 # Windows tool names end in .exe; Linux/macOS builds use the same names without it.
 for candidate in [name,name[:-4]] if name.endswith('.exe') else [name]:
  files=[f for f in tools.rglob(candidate) if f.is_file()]
  if len(files)==1:return files[0]
  if len(files)>1:raise RuntimeError('Expected exactly one '+candidate)
 raise RuntimeError('Missing '+name)
java,javac,keytool,aapt,align,android,d8,signer=[find(n) for n in ['java.exe','javac.exe','keytool.exe','aapt.exe','zipalign.exe','android.jar','d8.jar','apksigner.jar']]
shutil.copyfile(android,build/'android.jar');android=build/'android.jar'
def run(*cmd):subprocess.run([str(c) for c in cmd],check=True)
assets=build/'assets'/'web';classes=build/'classes';dex=build/'dex';generated=build/'generated'
for f in [assets,classes,dex,generated,build/'res']:f.mkdir(parents=True,exist_ok=True)
# Refuse a reused dirty build directory, so removed content cannot leak into a later APK.
if any(assets.iterdir()) or any(classes.iterdir()):raise RuntimeError('Choose a fresh build directory; signing directory must stay stable.')
for file in (root/'dist').rglob('*'):
 if file.is_file() and file.suffix in ['.html','.css','.js','.png','.svg','.wav','.mp3','.webmanifest','.json'] and file.name not in ['release.json','sw.js','precache.json']:
  dest=assets/file.relative_to(root/'dist');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(file,dest)
shutil.copytree(root/'android'/'res',build/'res',dirs_exist_ok=True)
for metadata in (build/'res').rglob('desktop.ini'):
 if metadata.is_file() and metadata.resolve().is_relative_to((build/'res').resolve()) and '[.ShellClassInfo]' in metadata.read_text(encoding='utf-8',errors='ignore'):
  metadata.unlink()
run(aapt,'package','-f','-m','-M',root/'android'/'AndroidManifest.xml','-S',build/'res','-I',android,'-J',generated)
run(javac,'-encoding','UTF-8','--release','8','-classpath',android,'-d',classes,*list((root/'android'/'src').rglob('*.java')),*generated.rglob('*.java'))
run(java,'-cp',d8,'com.android.tools.r8.D8','--min-api','26','--lib',android,'--output',dex,*classes.rglob('*.class'))
unsigned=build/'unsigned.apk';aligned=build/'aligned.apk'
run(aapt,'package','-f','-M',root/'android'/'AndroidManifest.xml','-S',build/'res','-A',build/'assets','-I',android,'-F',unsigned)
with zipfile.ZipFile(unsigned,'a',compression=zipfile.ZIP_DEFLATED) as z:z.write(dex/'classes.dex','classes.dex')
run(align,'-f','-p','4',unsigned,aligned)
key=signing/'wispbound-signing.p12';password=signing/'signing-password.txt'
if key.exists()!=password.exists():raise RuntimeError('Incomplete signing identity. Recover it instead of replacing it.')
if not key.exists():
 password.write_text(secrets.token_urlsafe(36),encoding='ascii');os.environ['WISPBOUND_SIGNING_PASS']=password.read_text()
 run(keytool,'-genkeypair','-keystore',key,'-storetype','PKCS12','-storepass:env','WISPBOUND_SIGNING_PASS','-keypass:env','WISPBOUND_SIGNING_PASS','-alias','wispbound','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Wispbound personal development')
os.environ['WISPBOUND_SIGNING_PASS']=password.read_text()
run(java,'-jar',signer,'sign','--ks',key,'--ks-key-alias','wispbound','--ks-pass','env:WISPBOUND_SIGNING_PASS','--key-pass','env:WISPBOUND_SIGNING_PASS','--out',output,aligned)
run(java,'-jar',signer,'verify','--verbose','--print-certs',output)
run(aapt,'dump','badging',output)
print('APK built and signature verified:',output)
