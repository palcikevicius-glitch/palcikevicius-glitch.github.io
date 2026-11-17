"""WISPBOUND's original V1.03 score. No samples or borrowed game melodies.
Reproducible PCM synthesis: numpy, 22.05 kHz stereo, circular echo tails.
Run from the project root. Every lead note is recorded in score-notes.json.
"""
from pathlib import Path
import math, json, wave
import numpy as np

OUT=Path(__file__).resolve().parents[1]/'dist'/'assets'
SR=22050
RNG=np.random.default_rng(103)
REPORT=[]
NOTES={}

def instrument(note,duration,kind):
    t=np.arange(round(duration*SR))/SR
    f=440*2**((note-69)/12)
    attack={'strings':.2,'flute':.055,'celesta':.004,'harp':.007,'bass':.014}[kind]
    release=min(.3,duration*.4)
    env=np.minimum(t/attack,1)*np.clip((duration-t)/release,0,1)
    if kind=='strings':
        x=sum(np.sin(2*np.pi*f*(1+d)*t+v)*g for d,v,g in [(-.0018,.3,.42),(.0014,1.1,.42),(0,0,.4)])
        x+=.14*np.sin(4*np.pi*f*t)+.035*np.sin(6*np.pi*f*t)
    elif kind=='flute':
        phase=2*np.pi*f*t+.055*np.sin(2*np.pi*4.7*t)*np.minimum(t/.3,1)
        x=np.sin(phase)+.16*np.sin(2*phase)+.05*np.sin(3*phase)
        env*=.8+.2*np.exp(-t*3)
    elif kind=='celesta':
        x=np.sin(2*np.pi*f*t)+.24*np.sin(2*np.pi*f*2.002*t)*np.exp(-t*4)+.08*np.sin(2*np.pi*f*3.97*t)*np.exp(-t*7)
        env*=np.exp(-t*2.5)
    elif kind=='bass':
        x=np.sin(2*np.pi*f*t)+.2*np.sin(4*np.pi*f*t)
        env*=np.exp(-t*2)
    else:
        x=np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t)+.12*np.sin(6*np.pi*f*t)*np.exp(-t*8)
        env*=np.exp(-t*4)
    return x*env

def drum(kind):
    duration=.34 if kind=='tom' else .08
    t=np.arange(round(duration*SR))/SR
    noise=RNG.uniform(-1,1,len(t))
    if kind=='tom':return np.sin(2*np.pi*(72*t+1.9*(1-np.exp(-t*18))))*np.exp(-t*13)+noise*.015*np.exp(-t*25)
    return (noise-np.roll(noise,1))*.16*np.exp(-t*65)*np.minimum(t/.003,1)

def add(mix,sound,start,gain,pan=0):
    # Wrap releases into the next loop instead of cutting them at the seam.
    idx=(np.arange(len(sound))+round(start*SR))%len(mix)
    mix[idx,0]+=sound*gain*math.sqrt((1-pan)/2)
    mix[idx,1]+=sound*gain*math.sqrt((1+pan)/2)

# Newly composed eight-bar call-and-answer themes, with rests and a second voice.
VILLAGE=[[(0,74,1.25),(1.5,77,.5),(2.5,81,.75)],[(.5,79,.5),(1.5,77,1),(3,72,.75)],[(0,74,.75),(1,69,.5),(2,72,1.5)],[(0,76,1),(1.5,74,.5),(2.5,69,1)],[(0,77,.75),(1,81,1),(2.5,84,1)],[(.5,81,.75),(1.5,79,.5),(2.5,77,1)],[(0,76,1),(1.5,72,.5),(2.5,69,.5)],[(0,72,.75),(1.25,76,.5),(2.5,74,1.25)]]
WOOD=[[(0,76,1.5),(2,79,.5),(3,83,.75)],[(.5,81,1),(2,79,1.5)],[(0,78,.75),(1,74,.75),(2.5,78,1)],[(0,79,1.5),(2,76,1.5)],[(.5,83,1),(2,86,.75),(3,83,.75)],[(0,81,.75),(1,79,.75),(2.5,76,1)],[(0,78,1.5),(2,74,1)],[(0,78,.75),(1.5,79,.5),(2.5,76,1.25)]]
BOSS=[[(0,74,.5),(.75,74,.25),(1.5,77,.5),(2.5,76,.5),(3.25,72,.5)],[(0,70,.75),(1,74,.5),(2,77,.5),(3,76,.75)],[(0,69,.5),(1,72,.5),(1.75,77,.75),(3,79,.5)],[(0,76,.75),(1.25,73,.5),(2.25,69,.5),(3,73,.5)],[(0,81,.5),(.75,81,.5),(1.5,84,.5),(2.5,83,.5),(3.25,79,.5)],[(0,77,.75),(1,74,.5),(2,70,.5),(3,74,.75)],[(0,77,.5),(1,81,.5),(2,79,.75),(3,76,.5)],[(0,73,.75),(1.25,69,.5),(2.25,73,.5),(3.25,76,.5)]]

def compose(key,title,bpm,bars,theme,chords):
    beat=60/bpm;mix=np.zeros((round(bars*4*beat*SR),2),dtype=np.float64);notes=[]
    boss=key=='boss'
    for bar in range(bars):
        base=bar*4*beat;root,chord=chords[bar%len(chords)]
        section=bar//8
        for i,note in enumerate(chord):add(mix,instrument(note,4.7*beat,'strings'),base,.052 if not boss else .039,[-.55,.5,-.2,.3][i%4])
        for tick in range(8):
            n=chord[[0,2,1,3,2,1,3,1][tick]%len(chord)]+12
            add(mix,instrument(n,1.6*beat,'harp'),base+tick*.5*beat,.066 if boss else .046,(-.5 if tick%2 else .5))
            if boss or section!=0:add(mix,drum('shaker'),base+tick*.5*beat,.06 if boss else .032,.25)
        for at in ([0,1.5,2,3.5] if boss else [0,2.5]):
            add(mix,instrument(root,.9*beat,'bass'),base+at*beat,.18 if boss else .11)
        if boss or section in [1,3]:
            for at in ([0,1.5,2.75] if boss else [0,2]):add(mix,drum('tom'),base+at*beat,.16 if boss else .065,-.12)
        for at,note,duration in theme[bar%8]:
            voice='celesta' if section%2==0 or boss else 'flute'
            # Variation: intimate first phrase, brighter third phrase, soft answer.
            gain=.19 if voice=='flute' else .24
            add(mix,instrument(note,(duration+.2)*beat,voice),base+at*beat,gain,-.13)
            if section==2:add(mix,instrument(note+12,(duration+.5)*beat,'celesta'),base+(at+.08)*beat,.06,.4)
            notes.append({'bar':bar+1,'beat':at,'midi':note,'beats':duration,'voice':voice})
        if section%2==1:
            add(mix,instrument(chord[1]+12,2.2*beat,'celesta'),base+1.75*beat,.095,.45)
    # Circular multi-tap room/diffuse echo: tails are present on both sides of loop.
    dry=mix.copy()
    for delay,gain in [(.113,.10),(.227,.08),(.379,.065),(.613,.046),(.911,.025)]:
        mix+=np.roll(dry,round(delay*SR),axis=0)[:,::-1]*gain
    mix-=mix.mean(axis=0,keepdims=True)
    mix=np.tanh(mix*1.05)
    mix*=.79/np.max(np.abs(mix))
    pcm=np.round(mix*32767).astype('<i2')
    with wave.open(str(OUT/f'music-{key}.wav'),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
    REPORT.append({'file':f'music-{key}.wav','title':title,'bpm':bpm,'bars':bars,'durationSeconds':round(len(mix)/SR,3),'sampleRate':SR,'channels':2,'peakDbFS':round(20*math.log10(abs(mix).max()),2),'rmsDbFS':round(20*math.log10(np.sqrt(np.mean(mix**2))),2),'clippedSamples':int(np.count_nonzero(abs(pcm)>=32767)),'boundaryJump':round(float(np.max(abs(mix[-1]-mix[0]))),6),'originalComposition':True,'loop':True})
    NOTES[key]=notes
    print(title,REPORT[-1]['durationSeconds'],'seconds')

compose('village','Lanterns Remember',98,32,VILLAGE,[(38,[62,65,69,72]),(34,[58,62,65,69]),(41,[60,65,69,72]),(36,[60,64,67,74])])
compose('wood','Where the Willow Sings',92,32,WOOD,[(40,[64,67,71,74]),(36,[60,64,67,71]),(43,[62,67,71,74]),(38,[62,66,69,76])])
compose('boss','The Thirteenth Bell',128,24,BOSS,[(38,[62,65,69,74]),(34,[58,62,65,69]),(41,[60,65,69,72]),(33,[57,61,64,67])])
(OUT/'score-notes.json').write_text(json.dumps({'provenance':'Original WISPBOUND melodies and synthesis. No third-party audio or soundtrack samples.','tracks':REPORT,'leadNotes':NOTES},indent=2),encoding='utf-8')
