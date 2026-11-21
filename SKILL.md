---
name: vox-collage
description: Make Vox-style paper-collage explainer videos in code (1920x920 MP4, no voice): one continuous world, parallax camera travel, line-following charts, maps, timelines, paper puppets, dust texture, designed SFX.
---

# Vox collage — think like a motion designer

You are a senior **After Effects motion designer** building a Vox-style cut-paper explainer, but your "comp" is code: a canvas engine where every frame is a **pure function of time**, stepped in headless Chrome and encoded with ffmpeg. Output **1920×920**, 24 fps, H.264. **No voice-over is generated**; the video carries a designed SFX track that leaves room for a voice added later.

The look: black-and-white **halftone photo cut-outs** with torn white borders, torn **yellow / red / sky-blue** paper, newsprint scraps, **tape**, red **marker** rings, arrows and underlines, rubber **stamps**, bold editorial type on torn labels, layered **torn-paper dioramas**, jointed **paper-puppet people**, all photographed under a warm lamp with **dust, specks and grain** over everything.

Images the user shares as a **style reference** only guide the look. Never put them in the video unless the user says so.

---

## The seven laws (what separates pro motion design from "animated slides")

1. **One continuous world. The camera travels; it does not cut.** Lay every idea out as a **station** on one big paper table. Moving to the next idea = moving the camera there: ease out of the station, a slight pull-back and bank as it glides (near scraps whip past the lens, far paper crawls), then push into the next station and settle. Cuts and transitions (`tear`, `slide`, `drop`) are rare punctuation, at most one or two per video.
2. **Parallax is everything.** Every component lives on a **z-depth plane**. Build each station as a layer stack: table (z 600–800), back scraps (z 300–500), hero plane (z 0), headline plane (z −120 to −320), out-of-focus foreground scraps (z −500 to −700). Camera moves then produce real parallax: near layers move faster, grow faster on a push and cast bigger, softer shadows; far layers crawl and soften with depth of field. Never fake parallax by hand.
3. **Zoom to tell the story.** Push in to focus on the detail being explained (a face, a number, a word); pull out to reveal context and how things connect. Every beat has a camera intention: *focus*, *reveal*, *follow* or *travel*. A static camera is a mistake; a hold is a slow drift-and-push.
4. **Charts, graphs and flows: the camera rides the line.** Land zoomed in at the start of the line, lock onto the pen tip while it draws (`follow`), pop milestones as the pen passes them, then zoom out to reveal the whole graph and travel on to the next destination. Arrows and flow lines do the same: the line leads the eye, the camera follows it.
5. **People are paper puppets.** A person cut-out never moves like a real body. Only jointed paper motions: head tilts, nods and shakes on a neck pivot; arms swing from shoulder split-pins; shoulders shrug as one piece; the whole figure slides, slams or bobs as one sheet. All in 12 fps steps.
6. **No captions. Only the text the viewer needs.** The voice tells the story; the screen shows evidence. Never put a sentence, a question, a summary or a headline phrase on screen. Allowed text: place names on maps, years and dates, numbers that are the point ("+340%"), names of people or things being identified, and at most one key word per station when nothing else can carry it. If tempted to write a line, show it instead (a ring, an arrow, a puppet gesture).
7. **The finish is a texture, not a clean render.** The final pass always lays a photographed-paper texture over everything: fine print-dot screen, paper grain, animated **dust and specks** (dark and light), the odd hair or fibre, a few fixed "lens" specks and a warm lamp falloff. It flickers on stop-motion steps. Never ship a clean digital frame.

## AE craft rules

- **Easing is the performance.** Never linear except a constant-speed pen. Easy ease on camera holds, `out` into landings, `back` (overshoot) for pop-ins, `slam` for hits. Keyframes through `kf(t,[[t0,v],[t1,v,'ease']])` work like the Graph Editor.
- **Anticipation → action → follow-through.** Things slam in with a small overshoot and settle; the camera gets a 0.3–0.45 s **shake** on big hits (`shake:[[t,amp]]`, amp 6–10).
- **Offset, never in unison.** Stagger groups (`stagger(t,i,start,0.06–0.12,dur)`). One hero move per beat; everything else is secondary.
- **Overlap the beats.** The next station's first element starts building just before the camera lands (0.2–0.4 s early), so arrival feels like discovery, not loading.
- **Secondary motion keeps it alive.** Idle layer float (built into `layer`), hand jitter on loose pieces (`jit`), a marker still drawing, dust flicker. The motion check fails any static 0.5 s.
- **Motion hierarchy by depth.** Headline labels on the nearest planes (they move most and read first); context on far planes.
- **Screen direction is continuity.** Keep travel directions logical (a story that progresses moves right or down); whoosh pans follow the move.
- **Stop-motion feel.** Animate pieces on `t = sm(lt)` (12 steps/s, on twos at 24 fps). The camera stays smooth (motion control), like a real stop-motion rig.
- **Scale, don't resize.** Animate size with `s` (the torn outline is cached by size; resizing re-cuts it every frame and shimmers).
- **Type inside the world, never a caption bar, never a sentence.** Names, years and numbers only (law 6). Anton (`FONT.head`) for numbers and years, Bitter (`FONT.slab`) lowercase for place and person names, ≥ 46 px.
- **Palette discipline.** Cream/paper, ink, one alarm red, one yellow; sky blue or navy as support. Red = problem/emphasis, yellow = the key word.
- **Pace.** ~2.5–3.2 s of screen time per idea, plus ~0.7–0.9 s per travel move.

## Maps and timelines (how Vox and Johnny Harris build them, translated to paper)

**Maps.** Clean decluttered base (`mapBase`, or a desaturated `mapImage` with traced polygons); only your own labels, pinned to places (`place`); highlight = accent colour inside the region (`region`) while its border draws on (`border`); open close on the place, hold with slight drift (pin drops, region fills), pull out to establish, follow a dashed `route()` and push in on the destination; desaturated, vignette, 12 fps, grain.

**Timelines.** A long paper ruler (`timeline`), years only at major ticks; the camera rides the playhead (`follow`, `ease:'linear'`); events pop as the playhead passes (photo cut-outs on leader lines, alternating sides, a soft pop); eras are torn bands (`era`); end with a pull-out revealing the whole span. `yearCounter` only when the year itself is the point.

## Sound design (built in)

`sfx.py` synthesises every sound from noise and sines (nothing downloaded) and `render.py` mixes it in automatically:
- **automatic cues:** a panned paper whoosh for every camera travel, a soft marker scratch while the camera follows a drawing line, a rip / whoosh / slam for the rare transitions;
- **scene cues** in `window.SFX = [[t,'slam'|'pop'|'stamp'|'tear'|'tape'|'marker'|'whoosh',{dur,pan,db}],...]` for impacts the camera can't know about (slam-ins, stamps, pops, tape, marker draw-ons);
- a very quiet room-tone bed with sparse paper rustles.

**It must never fight a voice.** Energy sits below ~900 Hz (body, thumps) and above ~5 kHz (paper air, crackle); the master gets a broad −6 dB dip at 1–4 kHz (speech intelligibility band); peaks are capped at −6 dBFS. Keep impact cues sparse (one per beat) and quieter than you think; the separate `_sfx.wav` stem lets the editor balance it under the voice in Premiere.

---

## Workflow

1. **Scaffold.** `mkdir -p <project>/{assets,out}` and write the engine files below **verbatim**: `engine.js`, `studio.html`, `render.py`, `motion_check.py`, `sfx.py`. Then write `scenes.js` (start from the example).
2. **Assets.** The user's photos go in `assets/` and `window.ASSETS`. JPG photos become B&W halftone prints (`photo()`); PNG cut-outs with transparency become white-edged stickers (`cutout()`) or puppets (`puppet()` with a rig). Missing files draw grey placeholders, or a paper figure for puppets. Never download photos of real people; ask the user for images.
3. **Plan the world before any code.** Write a short table the user can approve: station, what the viewer must understand, the one keyword, the camera intention (focus / reveal / follow / travel), the layer stack, the SFX hits. Then lay out the stations on the table: **spacing ≥ `spacingFor(farthest z)`** (≈3600 px across, ≈2400 px down for z 700) so the far layers of a neighbour never creep into frame.
4. **Build** the camera path first (`go()` with stops + `follow` windows), then each z-layer, drawing each station's slice of it inside `station(x,y,fn)`.
5. **Look.** `python3 render.py --sheet <times> --cols 3 --out out/check.jpg`, then open it with Read. Check every station on arrival, mid-hold and mid-travel. Fix overlaps, clipped type, empty travel gaps (add scraps along the path), neighbours creeping in.
6. **Render.** `python3 render.py --out out/video.mp4` (`--from/--to` for a range, `--no-sfx` to skip sound), then `python3 motion_check.py out/video.mp4`. Ship only with matching frame count, no page errors, and the motion check passing. Render only when the user wants a video.

Speed: about 2 to 4 frames/s, so 1 minute ≈ 6 to 12 minutes; render long videos in ranges and concat.

## Engine gotchas

- Pure function of time: no `Math.random()`, no state between frames (`hash`/`rnd`/`jit` instead).
- Parallax is **station-relative**: put each idea's content inside `station()`; content drawn outside sits at world origin.
- Serve over http (render.py does) or images taint the canvas.
- Wait for the ffmpeg **process**, not the file.
- Give every distinct torn piece its own `seed`.
- `go()` adds the pull-back/bank only for long moves that aren't zoom-outs or inside a `follow` window.
- Very near layers (z < −700) fly past the lens on a push; that's good for foreground scraps, bad for type.
- `scenes.js` loads before `engine.js`: top-level scene code is plain data only; call engine functions only inside `draw()`.
- Never name a scene global after an engine global (`E`, `G`, `W`, `H`, `PAL`, `FONT`, `CAM`, `IMG`, `NOW`). Name stations `A`, `B`, `C`, `D`, `M`.

## API (angles in degrees, sizes px; inside draw: `t = sm(lt)`)

```js
// time & easing
sm(lt) prog(t,start,dur) stagger(t,i,start,each,dur,ease) jit(t,key,amp) kf(t,[[t0,v],[t1,v,'easy'|'in'|'out'|'back'|'slam'|'linear'|'hold']])
E.out E.inOut E.back E.slam   hash rnd lerp clamp
// world camera (call first in draw)
go(lt,[[t,[worldCx,worldCy,push,roll],ease],...],{dof,focus,arc,bank,shake:[[t,amp]],follow:[{t0,t1,origin,pts,push,lead,ease}]})
spacingFor(zFar)   polyAt(pts,k) drawK(lt,followSpec)      // pen tip + identical k for stroke()
camera(lt,[[t,[x,y,push,roll]]],{...})                       // lower-level offset camera
// depth
layer(z,fn,{drift,blur,lift})   station(originX,originY,fn)
// set & paper
bg(col) block(x,y,w,h,col,seed,rot,depth) ridge(y,col,seed,amp,depth,base,x0,x1) newsprint(x,y,w,h,{rot,seed,depth})
paper(x,y,w,h,{col,rot,seed,torn,depth,border,alpha,s,rough},fnInside)  dot(x,y,r,{col,seed,depth,s,torn}) tape(x,y,w,rot,seed)
photo(key,x,y,w,h,{rot,seed,depth,zoom,panx,pany,color,border})   cutout(key,x,groundY,h,{rot,depth,flip,color})
label(text,x,y,{size,font,col,bg,rot,seed,depth,upper,s})  stamp(text,x,y,k,{size,col,rot})
bars(x,baseY,w,h,[vals],k,{col}) rays(cx,cy,r0,r1,n,k,{col,w}) reveal(k,x,y,w,h,dir,fn) flip(k,x,y,front,back)
// marker (k 0..1)
stroke(pts,k,{col,w}) ring(cx,cy,rx,ry,k,o) arrow(x0,y0,x1,y1,k,{bend}) underline(x0,x1,y,k) scribble(cx,cy,r,k)
// puppets
puppet(key,x,groundY,h,rig,pose,{depth,flip,brads})   act(t,'idle'|'talk'|'nod'|'shake'|'point'|'wave'|'shrug'|'think',t0)  mixPose(a,b,k)
rig = {neck:[fx,fy], head:[[fx,fy]..], armL:{poly:[..],pivot:[fx,fy]}, armR:{..}}   (fractions of the PNG; null = paper figure)
// maps
mapBase(x,y,w,h,lands,{sea,land,seed})  mapImage(key,x,y,w,h)  region(pts,k,{col,alpha,mode})  border(pts,k,{col,w})  route(pts,k,{col,w,dash})  pin(x,y,k)  pulse(x,y,t)  place(text,x,y)
// timelines   T = {from,to,x0,x1,y,major,minor,seed}
timeline(T,k)  yearX(T,year)  timelinePath(T)  era(T,from,to,col,k,seed)  yearCounter(x,y,year)
// finish (automatic): print dots + grain + dust; window.DUST = 0..2 to scale the dust
PAL.paper cream ink red yellow sky navy kraft grey white   FONT.head slab label hand
```

**Rigging a person PNG:** open the cut-out, read off fractions: `neck` = base of the neck; `head` = polygon around the head down to the neck line (slightly overlapping the collar); each arm polygon from the shoulder to the hand with `pivot` at the shoulder joint. Keep polygons generous so rotations don't reveal gaps; the brass brad hides the seam.

---

## Engine files — write these verbatim


### `engine.js`

```js
/* vox-collage engine — every frame is a PURE FUNCTION OF TIME.
   render(t) draws the whole frame for t seconds. No Math.random, no state between frames.
   Canvas 1920x920. Scenes live in scenes.js and call the helpers below. */
const W = 1920, H = 920, FPS = 24, STEP = 12;           // output fps, stop-motion steps per second
const CV = document.getElementById('c'); CV.width = W; CV.height = H;
let G = CV.getContext('2d');
const PAL = { paper:'#ece4d3', cream:'#f6f0e2', ink:'#141210', red:'#d4342a', yellow:'#f4c21b',
  sky:'#7fb3d9', navy:'#1d2a3c', kraft:'#c9a476', grey:'#8d8a84', white:'#fbf8f1' };
const FONT = { head:'Anton, "Archivo Black", Impact, sans-serif', slab:'"Bitter", "Lora", Georgia, serif',
  label:'"Archivo Black", "Anton", sans-serif', hand:'"Comic Relief", "Bitter", sans-serif' };

/* ---------- math ---------- */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;
const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)};
const rnd=(seed,i=0)=>hash(seed*91.7+i*17.13);
const E={ out:k=>1-(1-clamp(k))**3, inOut:k=>{k=clamp(k);return k<.5?4*k*k*k:1-(-2*k+2)**3/2},
  back:k=>{k=clamp(k);const c=1.9;return 1+(c+1)*(k-1)**3+c*(k-1)**2},
  slam:k=>{k=clamp(k);return k<.7?(k/.7)**2:1+Math.sin((k-.7)/.3*Math.PI)*.06*(1-(k-.7)/.3)} };
const sm=t=>Math.floor(t*STEP+1e-6)/STEP;                 // stop-motion stepped time
const prog=(t,a,d)=>clamp((t-a)/d);                        // 0..1 through a window
const jit=(t,key,amp=1)=>(hash(Math.floor(t*STEP)*13.7+key*7.1)-.5)*2*amp;   // per-step hand jitter

/* ---------- assets: put files in assets/, list them in ASSETS (scenes.js) ---------- */
const IMG = {};
window.READY = (async()=>{
  const list = (window.ASSETS||{});
  await Promise.all(Object.entries(list).map(([k,src])=>new Promise(res=>{
    const i=new Image(); i.onload=()=>{IMG[k]=i;res()}; i.onerror=()=>{IMG[k]=null;console.warn('missing',src);res()}; i.src=src; })));
  if (document.fonts) { await Promise.all(['72px Anton','72px "Archivo Black"','72px Bitter'].map(f=>document.fonts.load(f).catch(()=>0))); }
})();

/* ---------- textures (deterministic, built once) ---------- */
function tile(size, fn){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');fn(x,size);return c}
const GRAIN = tile(256,(x,s)=>{const d=x.createImageData(s,s);for(let i=0;i<s*s;i++){const v=110+hash(i*1.37)*60;d.data[i*4]=d.data[i*4+1]=d.data[i*4+2]=v;d.data[i*4+3]=22}x.putImageData(d,0,0)});
const FIBER = tile(512,(x,s)=>{x.strokeStyle='rgba(90,70,40,.10)';x.lineWidth=1;for(let i=0;i<260;i++){const a=rnd(3,i)*6.28,l=6+rnd(4,i)*26,px=rnd(5,i)*s,py=rnd(6,i)*s;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+Math.cos(a+.6)*l*.5,py+Math.sin(a+.6)*l*.5,px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke()}});
const DOTS = tile(8,(x)=>{x.fillStyle='rgba(0,0,0,.55)';x.beginPath();x.arc(4,4,1.5,0,7);x.fill()});
let _pat={};const pat=(c,k)=>_pat[k]||(_pat[k]=G.createPattern(c,'repeat'));
function texture(alpha=1){ // paper grain + fibres over the current clip
  G.save();G.globalAlpha=alpha;G.fillStyle=pat(GRAIN,'g');G.fillRect(-W,-H,W*3,H*3);G.fillStyle=pat(FIBER,'f');G.fillRect(-W,-H,W*3,H*3);G.restore();}

/* ---------- torn / cut outlines, cached by key ---------- */
const _path={};
function tornPoly(w,h,seed,rough=10,step=16){ // jagged rectangle, centred on 0,0
  const pts=[],R=(i)=>(rnd(seed,i)-.5)*2*rough;let i=0;
  const edge=(x0,y0,x1,y1,nx,ny)=>{const L=Math.hypot(x1-x0,y1-y0),n=Math.max(2,Math.round(L/step));for(let k=0;k<n;k++){const f=k/n,r=R(i++)+(rnd(seed,i+500)<.08?R(i+900)*2.2:0);pts.push([lerp(x0,x1,f)+nx*r,lerp(y0,y1,f)+ny*r])}};
  edge(-w/2,-h/2,w/2,-h/2,0,1);edge(w/2,-h/2,w/2,h/2,-1,0);edge(w/2,h/2,-w/2,h/2,0,-1);edge(-w/2,h/2,-w/2,-h/2,1,0);return pts}
function polyPath(pts){const p=new Path2D();pts.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath();return p}
function tornPath(w,h,seed,rough,step){const k=[w|0,h|0,seed,rough,step].join();return _path[k]||(_path[k]=polyPath(tornPoly(w,h,seed,rough,step)))}
function cutPath(w,h,seed){return tornPath(w,h,seed,2.2,40)}            // scissor edge: nearly straight
function blobPath(r,seed,n=14,v=.3){const k='b'+[r|0,seed,n,v];if(_path[k])return _path[k];const pts=[];for(let i=0;i<n;i++){const a=i/n*6.283,rr=r*(1-v/2+rnd(seed,i)*v);pts.push([Math.cos(a)*rr,Math.sin(a)*rr])}return _path[k]=polyPath(pts)}

/* ---------- shadows: depth = shadow ---------- */
let LAYER_LIFT=1;   // set by layer(): near layers cast longer, softer shadows
function shade(depth=1){const d=depth*LAYER_LIFT;G.shadowColor=`rgba(25,15,5,${Math.min(.5,.18+.10*d)})`;G.shadowBlur=6+d*11;G.shadowOffsetX=d*5;G.shadowOffsetY=d*8}
function noShade(){G.shadowColor='transparent';G.shadowBlur=0;G.shadowOffsetX=G.shadowOffsetY=0}

/* ---------- transforms ---------- */
function at(x,y,rot=0,s=1,fn){G.save();G.translate(x,y);G.rotate(rot*Math.PI/180);G.scale(s,s);fn();G.restore()}

/* ---------- PAPER: the base of everything ----------
   paper(x,y,w,h,{col,rot,seed,torn,depth,border,alpha,s}) draws one sheet; optional fn draws inside its clip. */
function paper(x,y,w,h,o={},fn){
  const {col=PAL.cream,rot=0,seed=1,torn=true,depth=1,border=0,alpha=1,s=1,rough=torn?9:2}=o;
  at(x,y,rot,s,()=>{G.globalAlpha=alpha;
    const path=torn?tornPath(w+border*2,h+border*2,seed,rough,14):cutPath(w+border*2,h+border*2,seed);
    shade(depth);G.fillStyle=border?PAL.white:col;G.fill(path);noShade();
    if(border){const inner=torn?tornPath(w,h,seed+50,rough*.6,18):cutPath(w,h,seed+50);G.fillStyle=col;G.fill(inner);G.save();G.clip(inner);fn&&fn(w,h);texture(.8);G.restore()}
    else{G.save();G.clip(path);fn&&fn(w,h);texture(.9);G.restore()}
  });
}

/* ---------- PHOTO: black-and-white halftone print, torn white border ----------
   photo(key,x,y,w,h,{rot,seed,zoom,panx,pany,color,depth,border}) ; missing image -> grey placeholder */
const _bw={};
function bwPrint(img,key){ if(_bw[key])return _bw[key];
  const c=document.createElement('canvas');const s=Math.min(1,1400/Math.max(img.width,img.height));c.width=img.width*s;c.height=img.height*s;
  const x=c.getContext('2d');x.filter='grayscale(1) contrast(1.35) brightness(1.04)';x.drawImage(img,0,0,c.width,c.height);x.filter='none';
  x.globalCompositeOperation='multiply';x.globalAlpha=.35;x.fillStyle=x.createPattern(DOTS,'repeat');x.fillRect(0,0,c.width,c.height);return _bw[key]=c}
function cover(src,w,h,zoom=1,px=0,py=0){const s=Math.max(w/src.width,h/src.height)*zoom;G.drawImage(src,-src.width*s/2+px,-src.height*s/2+py,src.width*s,src.height*s)}
function photo(key,x,y,w,h,o={}){const {zoom=1.05,panx=0,pany=0,color=false,border=14}=o;
  paper(x,y,w,h,Object.assign({col:PAL.grey,border},o),()=>{const img=IMG[key];
    if(img)cover(color?img:bwPrint(img,key),w,h,zoom,panx,pany);
    else{G.fillStyle='#9a958c';G.fillRect(-w/2,-h/2,w,h);G.fillStyle='rgba(0,0,0,.18)';G.fillRect(-w/2,h/6,w,h/3)}})}

/* ---------- CUTOUT: a PNG with transparency (person, car, object) with a white sticker edge ---------- */
const _stk={};
function sticker(img,key,edge=10){if(_stk[key])return _stk[key];const pad=edge*2,c=document.createElement('canvas');
  const s=Math.min(1,1400/Math.max(img.width,img.height));const w=img.width*s,h=img.height*s;c.width=w+pad*2;c.height=h+pad*2;const x=c.getContext('2d');
  for(let i=0;i<16;i++){const a=i/16*6.283;x.drawImage(img,pad+Math.cos(a)*edge,pad+Math.sin(a)*edge,w,h)}
  x.globalCompositeOperation='source-in';x.fillStyle=PAL.white;x.fillRect(0,0,c.width,c.height);x.globalCompositeOperation='source-over';
  x.filter='grayscale(1) contrast(1.3)';x.drawImage(img,pad,pad,w,h);x.filter='none';
  x.globalCompositeOperation='source-atop';x.globalAlpha=.3;x.fillStyle=x.createPattern(DOTS,'repeat');x.fillRect(0,0,c.width,c.height);return _stk[key]=c}
function cutout(key,x,y,hgt,o={}){const {rot=0,depth=1.2,flip=false,color=false}=o;const img=IMG[key];if(!img)return;
  const st=color?img:sticker(img,key);const s=hgt/st.height;at(x,y,rot,1,()=>{G.scale(flip?-s:s,s);shade(depth);G.drawImage(st,-st.width/2,-st.height);noShade()})}


/* ---------- PAPER PUPPETS: people move like jointed paper, never like real bodies ----------
   puppet(key, x, groundY, height, rig, pose, {depth,flip,brads})
   rig (fractions of the cut-out PNG, 0..1): { neck:[fx,fy], head:[[fx,fy],...polygon],
        armL:{poly:[[fx,fy],...], pivot:[fx,fy]}, armR:{...} }   (any part may be omitted)
   The torso is the image minus the part polygons; each part is the image clipped to its polygon,
   rotated about its pivot (a brass split-pin). No asset? A plain paper figure with the same joints is drawn.
   pose = {head, headY, armL, armR, lift, bob}  — build it with act(t, kind, t0) and add poses with mixPose(). */
const RIG_FALLBACK={neck:[.5,.30],head:[[.30,0],[.70,0],[.70,.31],[.30,.31]],armL:{poly:[[.05,.30],[.30,.30],[.30,.80],[.05,.80]],pivot:[.25,.34]},armR:{poly:[[.70,.30],[.95,.30],[.95,.80],[.70,.80]],pivot:[.75,.34]}};
function act(t,kind='idle',t0=0){const lt=sm(t),d=Math.max(0,lt-t0),P={head:2.2*Math.sin(lt*1.3),headY:0,armL:0,armR:0,lift:0,bob:Math.sin(lt*2.1)*2};
  if(kind==='talk'){P.head+=3.2*Math.sin(lt*5.3)+1.5*Math.sin(lt*8.9);P.headY=Math.abs(Math.sin(lt*6.1))*-3;P.armR=-8+6*Math.sin(lt*3.7)}
  if(kind==='shake'){P.head+=10*Math.sin(d*15)*Math.exp(-d*1.2)}
  if(kind==='nod'){P.headY=7*Math.abs(Math.sin(d*7))*Math.exp(-d*1.1);P.head+=2*Math.sin(d*7)}
  if(kind==='point'){P.armR=-72*E.back(prog(d,0,.35))+2*Math.sin(lt*3)}
  if(kind==='wave'){P.armR=-115*E.out(prog(d,0,.3))+16*Math.sin(d*13)}
  if(kind==='shrug'){const k=Math.sin(Math.PI*clamp(d/.9));P.lift=-16*k;P.armL=14*k;P.armR=-14*k;P.head+=4*k}
  if(kind==='think'){P.armR=-128*E.back(prog(d,0,.4));P.head+=5*E.out(prog(d,0,.4))}
  return P}
const mixPose=(a,b,k)=>{const o={};for(const n in a)o[n]=lerp(a[n],b[n]??a[n],k);return o};
function puppet(key,x,y,hgt,rig,pose={},o={}){rig=rig||RIG_FALLBACK;const P=Object.assign({head:0,headY:0,armL:0,armR:0,lift:0,bob:0},pose);
  const img=IMG[key],st=img?sticker(img,key):null,edge=10,pad=edge*2;
  const iw=st?st.width-pad*2:400,ih=st?st.height-pad*2:1000,sc=hgt/(st?st.height:ih);
  const F=([fx,fy])=>[(st?pad:0)+fx*iw,(st?pad:0)+fy*ih];
  const poly=pts=>{const p=new Path2D();pts.map(F).forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath();return p};
  const body=()=>{ if(st)G.drawImage(st,0,0); else paperFigure(iw,ih) };
  const part=(poly0,pivot,deg,dy=0)=>{const pv=F(pivot);G.save();G.translate(pv[0],pv[1]+dy);G.rotate(deg*Math.PI/180);G.translate(-pv[0],-pv[1]);G.clip(poly(poly0));body();G.restore();
    if(o.brads!==false){G.save();G.fillStyle='#b08a3e';G.strokeStyle='#5b4520';G.lineWidth=2/sc;G.beginPath();G.arc(pv[0],pv[1]+dy,7/sc*.6,0,7);G.fill();G.stroke();G.restore()}};
  const W2=(st?st.width:iw),H2=(st?st.height:ih);
  at(x,y+P.bob,0,1,()=>{G.scale(o.flip?-sc:sc,sc);G.translate(-W2/2,-H2);shade(o.depth??1.2);
    const cut=new Path2D();cut.rect(-50,-50,W2+100,H2+100);[rig.head,rig.armL&&rig.armL.poly,rig.armR&&rig.armR.poly].forEach(pp=>pp&&cut.addPath(poly(pp)));
    G.save();G.clip(cut,'evenodd');body();G.restore();noShade();                                   // torso
    const L=P.lift;
    if(rig.armL)part(rig.armL.poly,rig.armL.pivot,P.armL,L);
    if(rig.armR)part(rig.armR.poly,rig.armR.pivot,P.armR,L);
    if(rig.head)part(rig.head,rig.neck,P.head,L+P.headY);})}
function paperFigure(w,h){ // fallback cut-paper person drawn in the same 0..w x 0..h box
  const pc=(x,y,ww,hh,col,sd,tn=false)=>{G.save();G.translate(x,y);const p=tn?tornPath(ww,hh,sd,5,14):cutPath(ww,hh,sd);G.fillStyle=col;G.fill(p);G.clip(p);texture(.8);G.restore()};
  pc(w*.5,h*.62,w*.42,h*.5,'#2c2a28',301);                                  // torso
  pc(w*.18,h*.55,w*.13,h*.46,'#2c2a28',302); pc(w*.82,h*.55,w*.13,h*.46,'#2c2a28',303);   // arms
  pc(w*.18,h*.80,w*.11,h*.06,'#c99a77',304); pc(w*.82,h*.80,w*.11,h*.06,'#c99a77',305);   // hands
  G.save();G.translate(w*.5,h*.17);const hp=blobPath(w*.17,306,40,.05);G.fillStyle='#c99a77';G.fill(hp);G.clip(hp);texture(.8);G.restore();   // head
  pc(w*.5,h*.06,w*.36,h*.07,'#1a1816',307,true)}                              // hair

/* ---------- TYPE: set INSIDE the frame on paper, never a caption bar ----------
   label(text,x,y,{size,font,col,bg,rot,seed,pad,depth,upper}) */
function label(text,x,y,o={}){const {size=90,font=FONT.head,col=PAL.ink,bg=PAL.cream,rot=0,seed=7,pad=.28,depth=1,upper=true,s=1}=o;
  const tx=upper?text.toUpperCase():text;G.font=`${size}px ${font}`;const tw=G.measureText(tx).width;
  const w=tw+size*pad*2,h=size*1.18;
  const draw=()=>{G.fillStyle=col;G.font=`${size}px ${font}`;G.textAlign='center';G.textBaseline='middle';G.fillText(tx,0,size*.04);
    G.globalCompositeOperation='destination-out';G.globalAlpha=.18;G.fillStyle=pat(GRAIN,'g');G.fillRect(-w,-h,w*2,h*2);G.globalCompositeOperation='source-over';G.globalAlpha=1};
  if(bg)paper(x,y,w,h,{col:bg,rot,seed,depth,s,rough:6},draw);else at(x,y,rot,s,()=>{shade(.4);draw();noShade()});return w}

/* ---------- MARKER: hand-drawn strokes that draw on with k = 0..1 ---------- */
function stroke(pts,k,{col=PAL.red,w=12,seed=1}={}){if(k<=0||pts.length<2)return;const segs=[];let L=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);segs.push(d);L+=d}
  let rem=L*clamp(k);G.save();G.strokeStyle=col;G.lineWidth=w;G.lineCap='round';G.lineJoin='round';G.globalAlpha=.92;G.beginPath();G.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length&&rem>0;i++){const f=Math.min(1,rem/segs[i-1]);G.lineTo(lerp(pts[i-1][0],pts[i][0],f),lerp(pts[i-1][1],pts[i][1],f));rem-=segs[i-1]}G.stroke();G.restore()}
function ring(cx,cy,rx,ry,k,o={}){const pts=[],n=64,sd=o.seed||3;for(let i=0;i<=n*1.12;i++){const a=-1.9+i/n*6.283,wob=1+(rnd(sd,i%9)-.5)*.06+i/n*.05;pts.push([cx+Math.cos(a)*rx*wob,cy+Math.sin(a)*ry*wob])}stroke(pts,k,o)}
function arrow(x0,y0,x1,y1,k,o={}){const bend=o.bend??.25,mx=(x0+x1)/2-(y1-y0)*bend,my=(y0+y1)/2+(x1-x0)*bend,pts=[];for(let i=0;i<=30;i++){const f=i/30;pts.push([(1-f)**2*x0+2*(1-f)*f*mx+f*f*x1,(1-f)**2*y0+2*(1-f)*f*my+f*f*y1])}
  stroke(pts,k/.85,o);if(k>.85){const a=Math.atan2(y1-pts[27][1],x1-pts[27][0]),hl=(o.w||12)*4.2*clamp((k-.85)/.15);stroke([[x1-Math.cos(a-.5)*hl,y1-Math.sin(a-.5)*hl],[x1,y1],[x1-Math.cos(a+.5)*hl,y1-Math.sin(a+.5)*hl]],1,o)}}
function underline(x0,x1,y,k,o={}){const pts=[];for(let i=0;i<=12;i++)pts.push([lerp(x0,x1,i/12),y+Math.sin(i*1.7+(o.seed||1))*4]);stroke(pts,k,o)}
function scribble(cx,cy,r,k,o={}){const pts=[];for(let i=0;i<=80;i++){const a=i/80*6.283*3,rr=r*(.6+rnd(o.seed||5,i%13)*.5);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr*.7])}stroke(pts,k,Object.assign({w:5,col:PAL.ink},o))}

/* ---------- PROPS ---------- */
function dot(x,y,r,o={}){const {col=PAL.red,seed=1,depth=.8,s=1}=o;at(x,y,0,s,()=>{const p=o.torn===false?blobPath(r,seed,64,.025):blobPath(r,seed,90,.07);shade(depth);G.fillStyle=col;G.fill(p);noShade();G.save();G.clip(p);texture(.9);G.restore()})}
function tape(x,y,w=150,rot=0,seed=2){at(x,y,rot,1,()=>{const p=tornPath(w,42,seed,3,10);G.fillStyle='rgba(246,240,222,.78)';G.fill(p);G.save();G.clip(p);texture(.5);G.restore()})}
function stamp(text,x,y,k,o={}){if(k<=0)return;const {size=110,col=PAL.red,rot=-12}=o;const s=k<1?lerp(2.4,1,E.out(k)):1;
  at(x,y,rot,s,()=>{G.font=`${size}px ${FONT.head}`;const tw=G.measureText(text).width;G.strokeStyle=col;G.lineWidth=size*.1;G.globalAlpha=.9;
    G.strokeRect(-tw/2-size*.3,-size*.66,tw+size*.6,size*1.32);G.fillStyle=col;G.textAlign='center';G.textBaseline='middle';G.fillText(text,0,size*.05);
    G.globalCompositeOperation='destination-out';G.globalAlpha=.35;G.fillStyle=pat(GRAIN,'g');G.fillRect(-tw,-size,tw*2,size*2);G.globalCompositeOperation='source-over'})}
function bars(x,y,w,h,vals,k,o={}){const n=vals.length,gw=w/n;vals.forEach((v,i)=>{const kk=E.back(prog(k,i*.08,.5));if(kk<=0)return;const bh=h*v*kk;
  paper(x+gw*i+gw/2,y-bh/2,gw*.62,bh,{col:o.col||PAL.ink,torn:false,seed:40+i,depth:.6})});
  stroke([[x,y],[x+w,y]],1,{col:PAL.ink,w:4})}
function rays(cx,cy,r0,r1,n,k,o={}){for(let i=0;i<n;i++){const a=(o.a0||0)+i/n*(o.span||6.283),kk=E.out(prog(k,i*.04,.5));if(kk<=0)continue;stroke([[cx+Math.cos(a)*r0,cy+Math.sin(a)*r0],[cx+Math.cos(a)*lerp(r0,r1,kk),cy+Math.sin(a)*lerp(r0,r1,kk)]],1,{col:o.col||PAL.ink,w:o.w||6})}}

/* ---------- SET: backgrounds and torn layers ---------- */
function bg(col=PAL.paper){G.fillStyle=col;G.fillRect(-W,-H,W*3,H*3);texture(1)}
function block(x,y,w,h,col,seed=1,rot=0,depth=.5){paper(x,y,w,h,{col,seed,rot,depth})}
function ridge(y,col,seed,amp=60,depth=.7,base=H+60,x0=-560,x1=W+560){ // torn horizontal strip (hills, waves, skyline base)
  const k='r'+[y|0,seed,amp|0,x0,x1];let p=_path[k];if(!p){p=new Path2D();p.moveTo(x0,base);const n=Math.round((x1-x0)/40);for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;p.lineTo(x,y+Math.sin(i*.55+seed)*amp*.5+(rnd(seed,i)-.5)*amp*.6)}p.lineTo(x1,base);p.closePath();_path[k]=p}
  shade(depth);G.fillStyle=col;G.fill(p);noShade();G.save();G.clip(p);texture(.9);G.restore()}
function newsprint(x,y,w,h,o={}){paper(x,y,w,h,Object.assign({col:'#e7e1d2'},o),()=>{G.fillStyle='rgba(30,25,20,.55)';for(let r=0;r<h/22;r++)for(let c=0;c<3;c++){const lw=(w/3-24)*(.55+rnd(o.seed||9,r*3+c)*.45);G.fillRect(-w/2+14+c*(w/3),-h/2+16+r*22,lw,6)}})}


/* =====================================================================
   2.5D DEPTH + CAMERA — the After Effects way.
   Every component lives on a z-depth layer. z = 0 is the focal plane (designed size),
   positive z = farther (moves less, smaller shadow, can blur), negative z = nearer
   (moves more, bigger shadow). The camera trucks (x), pedestals (y), dollies (push)
   and rolls. Parallax falls out of the maths: never fake it by hand.
   ===================================================================== */
const PERSP=1100;                                   // focal length: smaller = stronger parallax
let CAM={x:0,y:0,push:0,roll:0,focus:0,dof:0},NOW=0,CUR_P=1;      // x/y px offset, push px toward the scene, roll deg
// AE-style keyframes: kf(t,[[t0,v0],[t1,v1,'ease'],...]) — values can be numbers or arrays.
// eases: 'linear' 'easy'(easy ease) 'in' 'out' 'back'(overshoot) 'slam' 'hold'
const EASES={linear:k=>k,easy:E.inOut,in:k=>k*k*k,out:E.out,back:E.back,slam:E.slam,hold:k=>k<1?0:1};
function kf(t,keys){if(t<=keys[0][0])return keys[0][1];const L=keys[keys.length-1];if(t>=L[0])return L[1];
  for(let i=0;i<keys.length-1;i++){const a=keys[i],b=keys[i+1];if(t>=a[0]&&t<=b[0]){const k=(EASES[b[2]||'easy'])((t-a[0])/(b[0]-a[0]));
    return Array.isArray(a[1])?a[1].map((v,j)=>lerp(v,b[1][j],k)):lerp(a[1],b[1],k)}}}
// camera: camera(lt,[[t,[x,y,push,roll]],...],{focus,dof,shake:[[t0,amp],...]}) — call once at the top of draw()
function camera(lt,keys,o={}){const v=kf(lt,keys);let sx=0,sy=0;
  (o.shake||[]).forEach(([t0,amp])=>{const d=lt-t0;if(d>=0&&d<.45){const f=amp*(1-d/.45);sx+=Math.sin(d*90)*f;sy+=Math.cos(d*77)*f*.7}});
  CAM={x:v[0]+sx,y:v[1]+sy,push:v[2]||0,roll:v[3]||0,focus:o.focus??0,dof:o.dof??0}}
const pf=z=>PERSP/(PERSP+z);                        // parallax factor at rest: 1 at z=0, <1 far, >1 near
// layer(z, fn, {drift, blur, lift}) — everything drawn inside fn sits at depth z, in design coordinates.
function layer(z,fn,o={}){
  const zz=z-CAM.push, s=(PERSP/(PERSP+zz))/pf(z);  // dolly: near layers grow faster than far ones
  if(PERSP+zz<=40)return;                            // passed the lens
  const p=pf(z),dr=o.drift??1, lt=NOW;
  const fx=dr*Math.sin(lt*.7+z*.013)*6*p, fy=dr*Math.cos(lt*.55+z*.021)*4*p;   // idle float, bigger when near
  G.save();G.translate(W/2,H/2);G.rotate(CAM.roll*Math.PI/180*Math.min(1.4,p));G.scale(s,s);
  G.translate(-W/2-CAM.x*p+fx,-H/2-CAM.y*p+fy);
  const blur=o.blur??(CAM.dof?Math.min(10,Math.abs(z-CAM.focus)/CAM.dof):0);
  if(blur>.3)G.filter=`blur(${blur.toFixed(1)}px)`;
  const prev=LAYER_LIFT,pp=CUR_P;LAYER_LIFT=o.lift??clamp(1+(-z)/600,.35,2.2);CUR_P=p;fn();LAYER_LIFT=prev;CUR_P=pp;G.filter='none';G.restore()}

/* ---------- ONE CONTINUOUS WORLD: travel the camera, don't cut ----------
   Lay every idea out as a STATION at world coords (any size, e.g. 0..8000 x 0..4000).
   go(lt, stops, o) moves the camera between stations: stops = [[t, [wx,wy,push,roll], ease], ...]
   where wx,wy is the world point at the CENTRE of the frame. Between two stops that are far apart,
   the camera automatically pulls back (o.arc px of push removed at mid-travel) and rolls slightly
   into the move, then lands with a soft settle: the classic "pull out, glide, push in" move. */
function go(lt,stops,o={}){const arc=o.arc??160,bank=o.bank??1.6;const keys=[];
  let arrive=null;
  for(let i=0;i<stops.length;i++){const s=stops[i];keys.push([s[0],[s[1][0]-W/2,s[1][1]-H/2,s[1][2]||0,s[1][3]||0],arrive||s[2]||'easy']);arrive=null;
    const n=stops[i+1];const inF=(o.follow||[]).some(f=>s[0]<f.t1&&n&&n[0]>f.t0);if(n&&!inF&&(s[1][2]||0)>=0&&(n[1][2]||0)>=0){const d=Math.hypot(n[1][0]-s[1][0],n[1][1]-s[1][1]);if(d>W*.6&&n[0]-s[0]>.3){const tm=(s[0]+n[0])/2,dir=Math.sign(n[1][0]-s[1][0])||1;
      // accelerate out of the station (cubic in), decelerate into the next (cubic out): continuous speed at mid-travel
      keys.push([tm,[(s[1][0]+n[1][0])/2-W/2,(s[1][1]+n[1][1])/2-H/2,Math.min(s[1][2]||0,n[1][2]||0)-arc,dir*bank],'in']);arrive=n[2]||'out'}}}
  // a hold between two equal stops is a slow drift, never a freeze
  camera(lt,keys,o);applyFollow(lt,o.follow);
  if(!window.GO_INFO){const tr=[];for(let i=0;i<stops.length-1;i++){const a=stops[i],b=stops[i+1],d=Math.hypot(b[1][0]-a[1][0],b[1][1]-a[1][1]);
    if(d>W*.6&&!(o.follow||[]).some(f=>a[0]<f.t1&&b[0]>f.t0))tr.push({t0:a[0],t1:b[0],pan:Math.sign(b[1][0]-a[1][0])||1})}window.GO_INFO={travels:tr,follow:(o.follow||[]).map(f=>({t0:f.t0,t1:f.t1})),shake:o.shake||[]}}}

/* ---------- FOLLOW THE LINE: the camera rides the pen tip of a chart / flow / route ----------
   polyAt(pts,k) = point at fraction k of the polyline's length (same k you pass to stroke()).
   In go(..., {follow:[{t0,t1,origin:[ox,oy],pts,push,lead,ease}]}) the camera locks onto the pen tip
   between t0 and t1 (blending in/out over `blend` s), zoomed to `push`, looking `lead` px ahead.
   Draw the line with drawK(lt,f) so the stroke and the camera use the identical k. */
function polyLen(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L}
function polyAt(pts,k){const L=polyLen(pts)*clamp(k);let acc=0;for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  if(acc+d>=L){const f=(L-acc)/(d||1);return [lerp(pts[i-1][0],pts[i][0],f),lerp(pts[i-1][1],pts[i][1],f),Math.atan2(pts[i][1]-pts[i-1][1],pts[i][0]-pts[i-1][0])]}acc+=d}
  const a=pts[pts.length-1],b=pts[pts.length-2]||a;return [a[0],a[1],Math.atan2(a[1]-b[1],a[0]-b[0])]}
const drawK=(lt,f)=>(EASES[f.ease||'inOut']||E.inOut)(prog(lt,f.t0,f.t1-f.t0));
function applyFollow(lt,list){(list||[]).forEach(f=>{const bl=f.blend??.35;if(lt<f.t0-bl||lt>f.t1+bl)return;
  const w=E.inOut(Math.min(prog(lt,f.t0-bl,bl),1-prog(lt,f.t1,bl)));const p=polyAt(f.pts,drawK(lt,f)),lead=f.lead??140;
  const tx=f.origin[0]+p[0]+Math.cos(p[2])*lead-W/2,ty=f.origin[1]+p[1]+Math.sin(p[2])*lead*.6-H/2;
  CAM.x=lerp(CAM.x,tx,w);CAM.y=lerp(CAM.y,ty,w);CAM.push=lerp(CAM.push,f.push??220,w);CAM.roll=lerp(CAM.roll,(p[2]*180/Math.PI)*.04,w)})}
// at(): reuse to place a station's content at its world position: station(x,y,fn)
// station(x,y,fn): content of one idea, designed in 0..1920 x 0..920 local coords, placed at world origin (x,y).
// Parallax is RELATIVE TO THE STATION: when the camera is centred on it, every layer lines up exactly as designed;
// as the camera travels away, near layers race off and far layers crawl. Far-away stations are skipped (culling).
// spacing rule: neighbouring stations need |dx| >= (W + overhang) / pf(farthest z)  (z 700 -> ~3600px), |dy| >= (H + overhang) / pf(z)
const spacingFor=(zFar,overhang=600)=>[(W+overhang)/pf(zFar),(H+overhang)/pf(zFar)];
function station(x,y,fn){const dx=(x-CAM.x)*CUR_P,dy=(y-CAM.y)*CUR_P;if(Math.abs(dx)>W*1.9||Math.abs(dy)>H*2.1)return;
  G.save();G.translate(x*CUR_P,y*CUR_P);fn();G.restore()}
// stagger: k for item i of a group, each starting `each` s after the last
const stagger=(t,i,start,each,dur,ease=E.out)=>ease(prog(t,start+i*each,dur));
// reveal: draw fn inside a torn-edge wipe (AE track matte). dir 'right'|'left'|'up'|'down'
function reveal(k,x,y,w,h,dir,fn,seed=3){if(k<=0)return;if(k>=1){fn();return}const p=new Path2D(),n=18,J=i=>(rnd(seed,i)-.5)*30;
  const x0=x-w/2-30,y0=y-h/2-30,W2=w+60,H2=h+60;
  if(dir==='right'||dir==='left'){const e=dir==='right'?x0+W2*k:x0+W2*(1-k);p.moveTo(dir==='right'?x0:x0+W2,y0);for(let i=0;i<=n;i++)p.lineTo(e+J(i),y0+H2*i/n);p.lineTo(dir==='right'?x0:x0+W2,y0+H2)}
  else{const e=dir==='down'?y0+H2*k:y0+H2*(1-k);p.moveTo(x0,dir==='down'?y0:y0+H2);for(let i=0;i<=n;i++)p.lineTo(x0+W2*i/n,e+J(i));p.lineTo(x0+W2,dir==='down'?y0:y0+H2)}
  p.closePath();G.save();G.clip(p);fn();G.restore()}
// flip: card turns on its vertical axis; fn draws the front (k<.5 shows back if given)
function flip(k,x,y,front,back){const c=Math.cos(clamp(k)*Math.PI);G.save();G.translate(x,y);G.scale(Math.max(.02,Math.abs(c)),1);G.translate(-x,-y);(c>=0?(back||front):front)();G.restore()}


/* ---------- MAPS (Vox Atlas / Johnny Harris grammar, in paper) ----------
   A clean, decluttered base: sea paper + land as torn paper pieces, thin ink borders, NO clutter labels.
   Only your own labels: place names pinned to the map (they move and scale with it).
   Highlights = accent colour revealed inside the region; borders DRAW ON; routes draw as dashed lines
   with a travelling head; pins drop with a bounce; the camera starts close and pulls out to establish,
   holds on each location with a slight drift, then pushes to the next. Regions are polygons in station
   coords (trace simplified outlines from a reference map image, or use mapImage() as the base). */
function polyPath2(pts){const p=new Path2D();pts.forEach((q,i)=>i?p.lineTo(q[0],q[1]):p.moveTo(q[0],q[1]));p.closePath();return p}
function centroid(pts){let x=0,y=0;pts.forEach(p=>{x+=p[0];y+=p[1]});return [x/pts.length,y/pts.length]}
function mapBase(x,y,w,h,lands,o={}){const {sea='#b9c6c4',land='#e9e0cc',seed=500}=o;
  paper(x,y,w,h,{col:sea,seed,depth:.4,rough:7},()=>{G.save();G.translate(-x,-y);
    G.strokeStyle='rgba(30,40,45,.10)';G.lineWidth=2;for(let gx=x-w/2;gx<x+w/2;gx+=160){G.beginPath();G.moveTo(gx,y-h/2);G.lineTo(gx,y+h/2);G.stroke()}   // faint graticule
    for(let gy=y-h/2;gy<y+h/2;gy+=160){G.beginPath();G.moveTo(x-w/2,gy);G.lineTo(x+w/2,gy);G.stroke()}
    lands.forEach((pts,i)=>{const p=polyPath2(pts);shade(.35);G.fillStyle=land;G.fill(p);noShade();G.save();G.clip(p);texture(.8);G.restore();
      G.strokeStyle='rgba(20,18,16,.55)';G.lineWidth=2.2;G.setLineDash([7,6]);G.stroke(p);G.setLineDash([])});G.restore()})}
function mapImage(key,x,y,w,h,o={}){photo(key,x,y,w,h,Object.assign({border:0,zoom:1},o))}      // desaturated halftone map print as the base
function region(pts,k,o={}){if(k<=0)return;const {col=PAL.red,alpha=.85,mode='grow'}=o,p=polyPath2(pts),[cx,cy]=centroid(pts);  // accent fill reveal
  G.save();G.clip(p);G.globalAlpha=alpha;G.fillStyle=col;
  if(mode==='wipe'){let x0=1e9,x1=-1e9;pts.forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0])});G.fillRect(x0-20,-1e5,(x1-x0+40)*E.out(k),2e5)}
  else{G.beginPath();G.arc(cx,cy,2500*E.out(k),0,7);G.fill()}
  G.globalAlpha=1;texture(.6);G.restore()}
function border(pts,k,o={}){stroke(pts.concat([pts[0]]),k,Object.assign({col:PAL.ink,w:5},o))}            // outline draws on
function route(pts,k,o={}){if(k<=0)return;const {col=PAL.red,w=8,dash=[18,14]}=o;const L=polyLen(pts)*clamp(k);
  G.save();G.strokeStyle=col;G.lineWidth=w;G.lineCap='round';G.setLineDash(dash);G.beginPath();let acc=0;G.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);if(acc+d>=L){const f=(L-acc)/d;G.lineTo(lerp(pts[i-1][0],pts[i][0],f),lerp(pts[i-1][1],pts[i][1],f));break}G.lineTo(pts[i][0],pts[i][1]);acc+=d}
  G.stroke();G.setLineDash([]);const hd=polyAt(pts,k);G.fillStyle=col;G.beginPath();G.arc(hd[0],hd[1],w*1.6,0,7);G.fill();G.restore()}
function pin(x,y,k,o={}){if(k<=0)return;const {col=PAL.red}=o,dy=(1-E.slam(k))*-160;at(x,y+dy,0,1,()=>{shade(1.2);G.fillStyle='#3a3530';G.fillRect(-2,-34,4,34);
  G.fillStyle=col;G.beginPath();G.arc(0,-40,14,0,7);G.fill();noShade();G.fillStyle='rgba(255,255,255,.5)';G.beginPath();G.arc(-4,-44,4,0,7);G.fill()})}
function pulse(x,y,t,o={}){const ph=(t*1.2)%1;G.save();G.strokeStyle=o.col||PAL.red;G.globalAlpha=(1-ph)*.8;G.lineWidth=4;G.beginPath();G.arc(x,y,12+ph*60,0,7);G.stroke();G.restore()}
function place(text,x,y,o={}){label(text,x,y,Object.assign({size:46,font:FONT.slab,upper:false,bg:null,col:PAL.ink},o))}   // place names only, no sentences

/* ---------- TIMELINES ----------
   A long paper ruler laid across the table; the camera RIDES THE PLAYHEAD along it (use follow with
   timelinePath()). Years appear only at major ticks; events are pinned cut-outs that pop as the playhead
   passes; eras are torn coloured bands. A big year counter may roll with the playhead (a number, not a caption). */
function yearX(T,year){return lerp(T.x0,T.x1,(year-T.from)/(T.to-T.from))}
function timelinePath(T){return [[T.x0,T.y],[T.x1,T.y]]}
function timeline(T,k,o={}){const {major=10,minor=1}=T;const xk=lerp(T.x0,T.x1,clamp(k));
  paper((T.x0+T.x1)/2,T.y,T.x1-T.x0+160,70,{col:PAL.cream,seed:T.seed||600,depth:.6,rough:5});
  G.save();G.strokeStyle=PAL.ink;for(let yr=T.from;yr<=T.to;yr+=minor){const x=yearX(T,yr);if(x>xk+40)break;const big=(yr-T.from)%major===0;
    G.lineWidth=big?4:2;G.beginPath();G.moveTo(x,T.y-(big?30:14));G.lineTo(x,T.y+(big?30:14));G.stroke();
    if(big){G.font=`40px ${FONT.head}`;G.fillStyle=PAL.ink;G.textAlign='center';G.textBaseline='top';G.fillText(String(yr),x,T.y+40)}}
  G.restore();
  at(xk,T.y-44,0,1,()=>{G.fillStyle=PAL.red;G.beginPath();G.moveTo(-16,-22);G.lineTo(16,-22);G.lineTo(0,4);G.closePath();G.fill()})}   // playhead
function era(T,from,to,col,k=1,seed=610){const a=yearX(T,from),b=yearX(T,to);if(k<=0)return;paper(a+(b-a)*E.out(k)/2,T.y,Math.max(1,(b-a)*E.out(k)),110,{col,seed,depth:.3,rough:6,alpha:.85})}
function yearCounter(x,y,year,o={}){label(String(Math.round(year)),x,y,Object.assign({size:180,bg:PAL.yellow,rot:-3,seed:620},o))}

/* ---------- CAMERA (simple 2D, legacy): smooth motion-control move, scaled about the CENTRE ----------
   cam(lt,[[t,[cx,cy,zoom]],...]) — call before drawing the scene, camEnd() after. Keep it moving. */
function cam(lt,keys){let a=keys[0],b=keys[keys.length-1];for(let i=0;i<keys.length-1;i++)if(lt>=keys[i][0]&&lt<=keys[i+1][0]){a=keys[i];b=keys[i+1];break}
  const k=b[0]>a[0]?E.inOut((lt-a[0])/(b[0]-a[0])):1;const cx=lerp(a[1][0],b[1][0],k),cy=lerp(a[1][1],b[1][1],k),z=lerp(a[1][2],b[1][2],k);
  G.save();G.translate(W/2,H/2);G.scale(z,z);G.translate(-cx,-cy)}
function camEnd(){G.restore()}

/* ---------- FINISH: the photographed-paper texture over EVERYTHING ----------
   warm lamp falloff + fine print-dot screen + paper grain + animated dust (dark and light specks,
   hairs, a few bigger flecks). Dust re-rolls on every stop-motion step, a few "lens" specks stay put. */
const SCREEN=tile(6,(x)=>{x.fillStyle='rgba(0,0,0,.6)';x.beginPath();x.arc(3,3,.9,0,7);x.fill()});
function dust(t,amount=1){const f=Math.floor(t*STEP);G.save();
  const N=Math.round(170*amount);for(let i=0;i<N;i++){const sd=f*1.31+i*.77,x=hash(sd)*W,y=hash(sd+9.1)*H,r=.6+hash(sd+3.3)**3*2.6,dark=hash(sd+5.5)<.72;
    G.globalAlpha=.18+hash(sd+7.7)*.4;G.fillStyle=dark?'#1a140e':'#fffaf0';G.beginPath();G.arc(x,y,r,0,7);G.fill()}
  for(let i=0;i<Math.round(5*amount);i++){const sd=f*2.17+i*3.9,x=hash(sd)*W,y=hash(sd+1)*H,a=hash(sd+2)*6.28,l=14+hash(sd+3)*46;  // hairs and fibres
    G.globalAlpha=.22+hash(sd+4)*.25;G.strokeStyle=hash(sd+5)<.6?'#1a140e':'#fffaf0';G.lineWidth=.9;G.beginPath();G.moveTo(x,y);
    G.quadraticCurveTo(x+Math.cos(a+1)*l*.6,y+Math.sin(a+1)*l*.6,x+Math.cos(a)*l,y+Math.sin(a)*l);G.stroke()}
  for(let i=0;i<14;i++){const x=hash(i*4.1+100)*W,y=hash(i*7.3+200)*H;G.globalAlpha=.10+hash(i+300)*.12;G.fillStyle='#120d08';  // fixed lens specks
    G.beginPath();G.arc(x,y,1+hash(i+400)*2.2,0,7);G.fill()}
  if(hash(f*.37)<.18){const x=hash(f*1.7)*W,y=hash(f*2.9)*H;G.globalAlpha=.25;G.fillStyle='#1a140e';G.beginPath();G.ellipse(x,y,3+hash(f)*5,2+hash(f+1)*3,hash(f+2)*3,0,7);G.fill()} // occasional big fleck
  G.restore()}
function finish(t=0){
  const g=G.createRadialGradient(W*.42,H*.3,80,W*.5,H*.5,W*.75);g.addColorStop(0,'rgba(255,236,200,.10)');g.addColorStop(1,'rgba(20,12,0,.32)');G.fillStyle=g;G.fillRect(0,0,W,H);
  G.save();G.globalCompositeOperation='multiply';G.globalAlpha=.10;G.fillStyle=pat(SCREEN,'scr');G.fillRect(0,0,W,H);G.restore();
  G.save();G.globalAlpha=.6;const gx=(Math.floor(t*STEP)*37)%256,gy=(Math.floor(t*STEP)*53)%256;G.translate(-gx,-gy);G.fillStyle=pat(GRAIN,'g');G.fillRect(0,0,W+256,H+256);G.restore();
  dust(t,window.DUST??1)}

/* ---------- TIMELINE + TRANSITIONS ----------
   SHOTS = [{dur, draw(lt, p), trans:'tear'|'slide'|'drop'|'cut', tdur}] from scenes.js. lt = local seconds, p = 0..1 */
const OFF=document.createElement('canvas');OFF.width=W;OFF.height=H;const CUR=document.createElement('canvas');CUR.width=W;CUR.height=H;
function shotAt(t){let s=0;for(let i=0;i<SHOTS.length;i++){if(t<s+SHOTS[i].dur||i===SHOTS.length-1)return [i,t-s];s+=SHOTS[i].dur}}
function drawShot(i,lt){const S=SHOTS[i];NOW=lt;CAM={x:0,y:0,push:0,roll:0,focus:0,dof:0};G.save();S.draw(lt,clamp(lt/S.dur));G.restore()}
function into(canvas,fn){const real=G;G=canvas.getContext('2d');G.setTransform(1,0,0,1,0,0);G.clearRect(0,0,W,H);_pat={};fn();G=real;_pat={}}
function render(t){
  const [i,lt]=shotAt(t),S=SHOTS[i],tr=S.trans||'tear',td=S.tdur||.5;
  G.setTransform(1,0,0,1,0,0);G.clearRect(0,0,W,H);
  if(i>0&&lt<td&&tr!=='cut'){
    into(OFF,()=>drawShot(i-1,SHOTS[i-1].dur+lt));      // outgoing keeps moving underneath
    into(CUR,()=>drawShot(i,lt));
    const k=E.inOut(sm(lt)/td);
    if(tr==='tear'){ // outgoing sheet is ripped off to the left along a torn edge, incoming underneath
      G.drawImage(CUR,0,0);const x=lerp(-60,W+160,k),p=new Path2D();p.moveTo(-20,-20);
      for(let j=0;j<=26;j++)p.lineTo(W-x+(rnd(9,j)-.5)*80,-20+(H+40)*j/26);p.lineTo(-20,H+20);p.closePath();
      G.save();G.translate(-x*.2,0);G.shadowColor='rgba(0,0,0,.45)';G.shadowBlur=24;G.shadowOffsetX=10;G.fillStyle=PAL.white;G.fill(p);noShade();
      G.clip(p);G.drawImage(OFF,0,0);G.restore();
      G.save();G.translate(-x*.2,0);G.strokeStyle=PAL.white;G.lineWidth=14;G.stroke(p);G.restore();}
    else if(tr==='slide'){ // new sheet pushes the old one off to the left
      G.drawImage(OFF,-W*.35*k,0);G.save();G.shadowColor='rgba(0,0,0,.5)';G.shadowBlur=30;G.shadowOffsetX=-12;G.drawImage(CUR,W*(1-k),0);G.restore();}
    else if(tr==='drop'){ // new sheet slams down from above with a bounce
      G.drawImage(OFF,0,0);const y=lerp(-H-40,0,E.slam(k));G.save();G.shadowColor='rgba(0,0,0,.5)';G.shadowBlur=30;G.shadowOffsetY=14;G.drawImage(CUR,0,y);G.restore();}
    else G.drawImage(CUR,0,0);
  } else drawShot(i,lt);
  G.setTransform(1,0,0,1,0,0);finish(t);
}
window.DURATION=()=>SHOTS.reduce((a,s)=>a+s.dur,0);
window.seek=async ms=>{await window.READY;render(ms/1000)};
window.frameJPEG=async(ms,q=.92)=>{await window.seek(ms);return CV.toDataURL('image/jpeg',q)};
```

### `studio.html`

```html
<!DOCTYPE html>
<html><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>vox-collage studio</title>
<style>html,body{margin:0;background:#111;overflow:hidden}canvas{display:block;width:100vw;height:auto}</style></head>
<body><canvas id="c"></canvas>
<script src="scenes.js"></script>
<script src="engine.js"></script>
<script>
// preview: plays in real time when opened in a browser; the renderer calls window.seek instead
if(!navigator.webdriver){window.READY.then(()=>{const t0=performance.now();(function f(){const t=((performance.now()-t0)/1000)%DURATION();render(t);requestAnimationFrame(f)})()})}
</script></body></html>
```

### `render.py`

```python
#!/usr/bin/env python3
"""Frame-step studio.html in headless Chrome and pipe JPEG frames into ffmpeg.
usage: python3 render.py [--out out/video.mp4] [--from 0] [--to <sec>] [--fps 24]
       python3 render.py --sheet 0.5,1.5,3 --out out/check.jpg   (contact sheet of chosen times)"""
import argparse, base64, functools, http.server, os, subprocess, sys, threading, shutil
ap=argparse.ArgumentParser();ap.add_argument('--out',default='out/video.mp4');ap.add_argument('--from',dest='t0',type=float,default=0)
ap.add_argument('--to',type=float);ap.add_argument('--fps',type=int,default=24);ap.add_argument('--sheet');ap.add_argument('--cols',type=int,default=3);ap.add_argument('--no-sfx',action='store_true')
a=ap.parse_args();root=os.path.dirname(os.path.abspath(__file__));os.makedirs(os.path.dirname(os.path.abspath(a.out)),exist_ok=True)
# serve over http so assets don't taint the canvas
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*x):pass
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Q,directory=root));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/studio.html'
from playwright.sync_api import sync_playwright
chrome=shutil.which('google-chrome') or shutil.which('chromium') or shutil.which('chromium-browser')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=chrome,args=['--force-color-profile=srgb']) if chrome else p.chromium.launch()
    pg=b.new_page(viewport={'width':1920,'height':920});errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));warns=[];pg.on('console',lambda m:m.type=='error' and (warns if '404' in m.text else errs).append(m.text))
    pg.goto(url);pg.evaluate('window.READY');dur=pg.evaluate('DURATION()')
    grab=lambda t:base64.b64decode(pg.evaluate(f'window.frameJPEG({t*1000})').split(',')[1])
    if a.sheet:
        from PIL import Image;import io
        ts=[float(x) for x in a.sheet.split(',')];ims=[Image.open(io.BytesIO(grab(t))).resize((640,307)) for t in ts]
        rows=(len(ims)+a.cols-1)//a.cols;sheet=Image.new('RGB',(640*a.cols,307*rows),'black')
        for i,im in enumerate(ims):sheet.paste(im,((i%a.cols)*640,(i//a.cols)*307))
        sheet.save(a.out,quality=88);print('sheet',a.out,'errors:',errs or 'none',('| missing assets (placeholders used): %d'%len(warns)) if warns else '');b.close();sys.exit(0)
    t1=a.to if a.to is not None else dur;n=int(round((t1-a.t0)*a.fps))
    ff=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','image2pipe','-framerate',str(a.fps),'-c:v','mjpeg','-i','-',
        '-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709',
        '-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',a.out],stdin=subprocess.PIPE)
    for i in range(n):
        ff.stdin.write(grab(a.t0+i/a.fps))
        if i%48==0:print(f'  frame {i}/{n}',flush=True)
    ff.stdin.close();rc=ff.wait()   # wait for the PROCESS, not the file
    # ---- SFX cues: scene cues + automatic ones from the camera path and transitions ----
    info=pg.evaluate('window.GO_INFO||{travels:[],follow:[],shake:[]}');cues=list(pg.evaluate('window.SFX||[]'))
    for tr in info['travels']:cues.append([tr['t0']+.05,'whoosh',{'dur':max(.4,tr['t1']-tr['t0']),'pan':tr['pan']}])
    for f in info['follow']:cues.append([f['t0'],'marker',{'dur':f['t1']-f['t0'],'db':-27}])
    acc=0
    for i,sh in enumerate(pg.evaluate('SHOTS.map(s=>({dur:s.dur,trans:s.trans||"tear"}))')):
        if i>0:cues.append([acc,{'tear':'tear','slide':'whoosh','drop':'slam'}.get(sh['trans'],'none'),{'dur':.5} if sh['trans']!='drop' else {}])
        acc+=sh['dur']
    b.close()
print('errors:',errs or 'none',('| missing assets (placeholders used): %d'%len(warns)) if warns else '')
real=subprocess.check_output(['ffprobe','-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames,width,height','-of','csv=p=0',a.out]).decode().strip()
print('  ',a.out,'width,height,frames =',real,'(expected frames',n,')')
if rc or int(real.split(',')[-1])<n-2:print('  TRUNCATED, do not ship');sys.exit(2)
if not a.no_sfx:
    import json,numpy as np;from scipy.io import wavfile;sys.path.insert(0,root);import sfx
    cues=[[c[0]-a.t0]+list(c[1:]) for c in cues if a.t0-1<c[0]<(t1)]
    wav=os.path.splitext(a.out)[0]+'_sfx.wav';wavfile.write(wav,sfx.SR,(sfx.mix(cues,t1-a.t0)*32767).astype(np.int16))
    tmp=a.out+'.tmp.mp4';subprocess.run(['ffmpeg','-y','-loglevel','error','-i',a.out,'-i',wav,'-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-shortest','-movflags','+faststart',tmp],check=True)
    os.replace(tmp,a.out);print('   sfx muxed (',len(cues),'cues ) | separate stem:',wav)
```

### `motion_check.py`

```python
#!/usr/bin/env python3
"""Fail if any 0.5s sample pair after the first 0.5s is static (mean abs diff < 0.35 on a 192x92 grey thumb)."""
import subprocess, sys, os, tempfile
from PIL import Image
import numpy as np
src=sys.argv[1];step=0.5;th=0.35
dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',src]).strip())
tmp=tempfile.mkdtemp();prev=None;static=[];n=0;t=0.0
while t<dur-0.2:
    f=os.path.join(tmp,f'{n:05d}.png');subprocess.run(['ffmpeg','-v','error','-ss',str(t),'-i',src,'-frames:v','1','-vf','scale=192:92,format=gray',f],check=True)
    im=np.asarray(Image.open(f),dtype=np.float32)
    if prev is not None:
        d=float(np.abs(prev-im).mean())
        if d<th and t>0.5:static.append((round(t,2),round(d,3)))
    prev=im;n+=1;t+=step
print(f'{src}: {n} samples over {dur:.1f}s, {len(static)} static')
if static:print('  STATIC AT:',static[:12]);sys.exit(2)
print('  PASS, no static run')
```

### `sfx.py`

```python
#!/usr/bin/env python3
"""Synthesised paper-world SFX, designed to sit UNDER a voice-over.
Body energy < ~900 Hz, air/crackle > ~5 kHz, a broad cut at 1-4 kHz (speech intelligibility band),
peaks capped at -6 dBFS. Nothing is downloaded: every sound is generated from noise and sines.
usage (render.py calls this): python3 sfx.py cues.json out/sfx.wav <duration_s>
cue = [t, kind, {opts}]  kinds: whoosh slam pop stamp tear tape marker  (+ bed: room tone)"""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt
SR = 48000
rng = np.random.default_rng(7)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def brown(n): b = np.cumsum(noise(n)); b -= np.linspace(b[0], b[-1], n); return b / (np.abs(b).max() + 1e-9)
def env(n, a, d, shape=3.0):  # attack fraction, then power decay
    t = np.linspace(0, 1, n); e = np.where(t < a, t / max(a, 1e-6), (1 - (t - a) / (1 - a + 1e-9)) ** shape); return e
def db(x): return 10 ** (x / 20)
def norm(x, peak_db): return x / (np.abs(x).max() + 1e-9) * db(peak_db)

def whoosh(dur=.8, pan=1, **k):
    """camera travel: swept low-mid body + airy top, bell envelope, pans across with the move"""
    n = int(SR * dur); t = np.linspace(0, 1, n); bell = np.sin(np.pi * t) ** 1.6
    body = np.zeros(n); src = noise(n); seg = 2048
    for i in range(0, n, seg):  # block-wise sweep 180 -> 850 -> 220 Hz
        f = 180 + 670 * np.sin(np.pi * min(1, i / n)) ; body[i:i+seg] = bp(src[max(0,i-512):i+seg], f*.6, f*1.6)[-len(body[i:i+seg]):]
    air = hp(noise(n), 6000) * .35
    m = norm((body + air) * bell, k.get('db', -15))
    p = np.clip((t - .5) * 2 * pan, -1, 1)               # equal-power pan sweep
    return np.stack([m * np.sqrt((1 - p) / 2), m * np.sqrt((1 + p) / 2)], 1)
def slam(**k):
    """paper slap: soft low thump (65 -> 45 Hz) + short high crackle, nothing in the voice band"""
    n = int(SR * .45); t = np.arange(n) / SR
    thump = np.sin(2 * np.pi * (65 * t - 22 * t * t)) * np.exp(-t * 14)
    crack = hp(noise(n), 5200) * np.exp(-t * 60) * .6
    return norm(thump + crack, k.get('db', -9))
def pop(**k):
    """small piece lands: tiny paper tick"""
    n = int(SR * .12); t = np.arange(n) / SR
    return norm(hp(noise(n), 6500) * np.exp(-t * 90) + .4 * np.sin(2*np.pi*180*t) * np.exp(-t * 50), k.get('db', -18))
def stamp(**k):
    """rubber stamp: dull thud + rubber click"""
    n = int(SR * .35); t = np.arange(n) / SR
    thud = lp(noise(n), 260) * np.exp(-t * 22) * 2 + np.sin(2*np.pi*95*t) * np.exp(-t * 18)
    click = hp(noise(n), 5500) * np.exp(-t * 120) * .5
    return norm(thud + click, k.get('db', -10))
def tear(dur=.5, **k):
    """paper rip: accelerating crackle grains (high) over a low torn body"""
    n = int(SR * dur); out = np.zeros(n); t = np.arange(n) / SR
    pos = 0
    while pos < n:
        g = int(SR * rng.uniform(.004, .012)); g = min(g, n - pos)
        out[pos:pos+g] += hp(noise(g), 4200) * np.hanning(g) * rng.uniform(.4, 1)
        pos += int(SR * rng.uniform(.003, .018) * (1.4 - pos / n))
    body = bp(noise(n), 140, 600) * .5
    return norm((out + body) * env(n, .1, .9, 1.5), k.get('db', -12))
def tape(**k):
    n = int(SR * .4); t = np.linspace(0, 1, n); src = noise(n); out = np.zeros(n); seg = 1024
    for i in range(0, n, seg): f = 3800 + 2600 * (i / n); out[i:i+seg] = bp(src[i:i+seg], f, f * 1.5)
    return norm(out * env(n, .05, .95, 2), k.get('db', -20))
def marker(dur=.6, **k):
    """felt marker on paper: soft high scratch with stroke rhythm"""
    n = int(SR * dur); t = np.arange(n) / SR
    rhythm = .55 + .45 * np.abs(np.sin(2 * np.pi * 7 * t))
    return norm(bp(noise(n), 5000, 9000) * rhythm * env(n, .08, .92, 1), k.get('db', -24))
def bed(n):
    """room tone: very low brown noise + sparse paper rustles, far below any voice"""
    r = lp(hp(brown(n), 40), 350) * db(-46)
    for _ in range(int(n / SR / 2.5)):
        s = rng.integers(0, max(1, n - SR)); g = int(SR * rng.uniform(.15, .4))
        r[s:s+g] += hp(noise(g), 6000) * np.hanning(g) * db(-44)
    return r

KINDS = dict(whoosh=whoosh, slam=slam, pop=pop, stamp=stamp, tear=tear, tape=tape, marker=marker)
def vocal_pocket(x):
    """broad -6 dB dip centred ~2.2 kHz (1-4 kHz) so speech stays on top"""
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    g = 1 - (1 - db(-6)) * np.exp(-((np.log2(np.maximum(f, 1) / 2200)) ** 2) / (2 * .55 ** 2))
    return np.fft.irfft(X * g[:, None], n=x.shape[0], axis=0)

def mix(cues, dur, with_bed=True):
    n = int(SR * (dur + .5)); out = np.zeros((n, 2))
    if with_bed: b = bed(n); out += np.stack([b, np.roll(b, 900)], 1)
    for c in cues:
        t, kind = c[0], c[1]; o = c[2] if len(c) > 2 else {}
        if kind not in KINDS: continue
        s = KINDS[kind](**o); s = s if s.ndim == 2 else np.stack([s * np.sqrt((1 - o.get('pan', 0)) / 2) * 1.414, s * np.sqrt((1 + o.get('pan', 0)) / 2) * 1.414], 1)
        i = int(SR * max(0, t)); j = min(n, i + len(s)); out[i:j] += s[:j - i]
    out = vocal_pocket(out)
    out = np.tanh(out * 1.2) / 1.2                                # soft safety limiter
    pk = np.abs(out).max();  out *= db(-6) / pk if pk > db(-6) else 1
    return out[:int(SR * dur)]

if __name__ == '__main__':
    from scipy.io import wavfile
    cues = json.load(open(sys.argv[1])); dur = float(sys.argv[3])
    wavfile.write(sys.argv[2], SR, (mix(cues, dur) * 32767).astype(np.int16))
    print('  sfx', sys.argv[2], f'{len(cues)} cues, {dur:.1f}s')
```

### Example `scenes.js` (one world, 5 stations: collage, diorama + puppet, chart ride, timeline ride, map)

```js
/* EXAMPLE — one continuous paper world, 5 stations, the camera TRAVELS between them (no cuts). ~21.5s.
   TEXT DISCIPLINE: no captions, no sentences. Only names, years and numbers the viewer needs.
   A collage (no text) · B diorama + paper puppet ("1971") · C line chart the camera rides (years, "+340%")
   D timeline the camera rides (ruler years only) · M paper map: close -> pull out -> follow route -> push in (place names)
   Station = an idea in its own local coords, placed at a world origin. Asset names are placeholders for the user's photos. */
window.ASSETS = { subject:'assets/subject.jpg', city:'assets/city.jpg', presenter:'assets/presenter.png',
                  ev1:'assets/event1.jpg', ev2:'assets/event2.jpg', ev3:'assets/event3.jpg' };
window.RIG_PRESENTER = null;                       // rig for presenter.png; null -> built-in paper figure

const A=[0,0], B=[4600,-300], C=[4500,2900], D=[-300,3100], M=[-400,6300];   // spaced per spacingFor(700)
const cx=s=>s[0]+960, cy=s=>s[1]+460;
const tA=0, tB=3.4, tC=6.9, tD=11.6, tM=16.4;

/* C — line chart data (station-local) */
const LINE=[[160,800],[520,760],[820,780],[1160,640],[1480,600],[1820,470],[2200,420],[2560,260],[2900,190],[3200,90]];
const MILES=[{k:.18,txt:'1950'},{k:.47,txt:'1971'},{k:.78,txt:'1990'}];
const FOLLOW_C={t0:7.0,t1:9.6,origin:C,pts:LINE,push:260,lead:160};
/* D — timeline ruler (station-local) */
const T={from:1940,to:2020,x0:200,x1:3400,y:560,major:10,minor:2,seed:600};
const EVENTS=[{yr:1944,key:'ev1'},{yr:1971,key:'ev2'},{yr:2008,key:'ev3'}];
const FOLLOW_D={t0:11.8,t1:14.8,origin:D,pts:[[T.x0,T.y-120],[T.x1,T.y-120]],push:170,lead:60,ease:'linear'};
const tlK=lt=>drawK(lt,FOLLOW_D);
/* M — paper map (station-local): abstract placeholder coastlines; trace real outlines from a reference map */
const LANDS=[[[120,160],[700,90],[980,260],[1000,620],[760,860],[300,880],[90,560]],
             [[1250,120],[1820,180],[1880,520],[1700,860],[1320,820],[1180,480]]];
const ZONE=[[640,320],[960,300],[990,600],[760,800],[560,640]];
const PA=[820,520], PB=[1520,420];
const ROUTE=[PA,[1000,380],[1180,300],[1360,330],PB];
const FOLLOW_M={t0:18.4,t1:20.0,origin:M,pts:ROUTE,push:150,lead:120};

window.SFX = [                                     // impacts the camera system can't know about
  [.15,'slam'],[.35,'pop'],[.9,'pop'],[1.25,'marker',{dur:.6}],[1.6,'marker',{dur:.5}],[.5,'tape'],
  [tB-.2,'slam'],[tB+1.1,'pop'],
  [9.65,'slam'],
  ...EVENTS.map(e=>[FOLLOW_D.t0+(FOLLOW_D.t1-FOLLOW_D.t0)*(e.yr-T.from)/(T.to-T.from),'pop']),
  [tM+.1,'slam',{db:-14}],[tM+1.0,'marker',{dur:.8}],[20.0,'slam',{db:-12}],
];

const SHOTS = [{ dur:21.5, trans:'cut', draw(lt){
  const t=sm(lt);
  go(lt,[
    [0,    [cx(A)-60,cy(A)+10,0,-.8]],
    [2.7,  [cx(A)+40,cy(A)-10,130,.4],'easy'],           // hold = drift + push
    [3.6,  [cx(B)-40,cy(B),0,0]],                          // travel A -> B
    [6.2,  [cx(B)+80,cy(B)-10,110,0],'easy'],
    [6.9,  [C[0]+160,C[1]+800,240,0]],                     // travel B -> C, land zoomed IN on the line start
    [9.6,  [C[0]+3000,C[1]+200,240,0],'linear'],           // (FOLLOW_C rides the pen)
    [10.4, [C[0]+1700,C[1]+430,-520,0],'easy'],            // zoom OUT: reveal the chart
    [10.8, [C[0]+1700,C[1]+430,-480,0],'easy'],
    [11.6, [D[0]+T.x0,D[1]+T.y-120,170,0]],                // travel C -> D, land on the ruler start
    [14.8, [D[0]+T.x1,D[1]+T.y-120,170,0],'linear'],       // (FOLLOW_D rides the playhead)
    [15.6, [D[0]+1800,D[1]+460,-560,0],'easy'],            // zoom OUT: the whole timeline
    [16.4, [M[0]+PA[0],M[1]+PA[1],320,0]],                 // travel D -> M, land CLOSE on the first place
    [17.4, [M[0]+PA[0],M[1]+PA[1],300,0],'easy'],          // hold close (pin drops, region fills)
    [18.3, [M[0]+1000,M[1]+480,-320,-1],'easy'],           // pull out to establish the map
    [20.0, [M[0]+PB[0],M[1]+PB[1],150,0],'linear'],        // (FOLLOW_M rides the route)
    [21.5, [M[0]+PB[0],M[1]+PB[1],300,.6],'easy'],         // push in on the destination
  ],{focus:0,dof:120,arc:300,bank:2,follow:[FOLLOW_C,FOLLOW_D,FOLLOW_M],shake:[[tA+.2,6],[9.65,7],[20.0,5]]});

  /* z 700 — the table */
  layer(700,()=>{ bg('#d8cdb8');
    station(A[0],A[1],()=>{ block(960,460,2500,1400,PAL.paper,201,-1.5,.4); newsprint(240,170,560,320,{rot:-6,seed:11,depth:.4}); newsprint(1700,780,600,340,{rot:5,seed:12,depth:.4}); });
    station(B[0],B[1],()=>{ block(960,460,2600,1400,'#dcc7a8',202,1,.4); dot(1380,230,150,{seed:41,depth:.4}); rays(1380,230,190,300,14,prog(t,tB-.4,1.4),{col:PAL.ink,w:5}); });
    station(C[0],C[1],()=>{ block(1700,460,4600,1700,PAL.cream,203,-1,.4); newsprint(1650,160,520,300,{rot:6,seed:81,depth:.3}); });
    station(D[0],D[1],()=>block(1800,460,4400,1500,PAL.paper,204,1,.4));
    station(M[0],M[1],()=>block(1000,480,2900,1700,'#cdbfa6',205,-1,.4));
  });
  /* z 600..150 — back planes */
  layer(600,()=>station(B[0],B[1],()=>ridge(520,'#a8896a',3,110,.4)));
  layer(420,()=>{
    station(A[0],A[1],()=>{ block(560+jit(t,1,1.5),470,540,840*E.back(prog(t,.1,.45))+1,PAL.yellow,3,8,.6);
      block(1500,170+(1-E.out(prog(t,.25,.4)))*-420,640,270,PAL.sky,4,-3,.5);
      photo('city',1490,770+(1-E.out(prog(t,.35,.45)))*520,780,250,{rot:-2,seed:21,depth:.9}); });
    station(B[0],B[1],()=>ridge(610,'#7d6550',5,90,.5));
    station(D[0],D[1],()=>{ era(T,1944,1971,PAL.sky,prog(t,FOLLOW_D.t0+.2,1.2),611); era(T,1971,2020,'#e9b9a8',prog(t,FOLLOW_D.t0+1.4,1.6),612); });
  });
  layer(300,()=>{ station(B[0],B[1],()=>{ paper(560,300,260,110,{col:PAL.white,seed:44,depth:.6}); stroke([[560,-90],[560,245]],1,{col:PAL.ink,w:2}); });
                  station(C[0],C[1],()=>block(1700,470,3800,900,PAL.white,51,-1,.5));
                  station(M[0],M[1],()=>mapBase(1000,480,2300,1300,LANDS,{seed:520})); });
  layer(150,()=>station(B[0],B[1],()=>ridge(690,'#3b4a5c',7,70,.7)));
  /* z 0 — hero plane */
  layer(0,()=>{
    station(A[0],A[1],()=>{ photo('subject',960+jit(t,2,2),470+(1-E.slam(prog(t,.15,.5)))*-950,430,520,{rot:-3+jit(t,3,.4),seed:5,depth:1.2});
      tape(860,215,170,-24,6); tape(1120,230,150,28,7);
      ring(965,330,175,150,E.inOut(prog(t,1.25,.6)),{col:PAL.red,w:11});
      bars(1290,380,330,230,[.25,.4,.35,.6,.85],prog(t,1.0,1.2)); });
    station(C[0],C[1],()=>{ stroke([[120,820],[3300,820]],1,{col:PAL.ink,w:4});
      stroke(LINE,drawK(lt,FOLLOW_C),{col:PAL.red,w:14});
      MILES.forEach((m,i)=>{ if(drawK(lt,FOLLOW_C)<m.k) return; const pt=polyAt(LINE,m.k), at0=FOLLOW_C.t0+(FOLLOW_C.t1-FOLLOW_C.t0)*m.k;
        dot(pt[0],pt[1],18,{col:PAL.ink,torn:false,seed:90+i,s:E.back(prog(t,at0,.25))+.001});
        label(m.txt,pt[0],pt[1]-90,{size:64,bg:PAL.cream,rot:(i%2?3:-3),seed:95+i,s:E.back(prog(t,at0+.05,.3))+.001}); }); });
    station(D[0],D[1],()=>{ timeline(T,tlK(lt));
      EVENTS.forEach((e,i)=>{ const x=yearX(T,e.yr); if(tlK(lt)*(T.to-T.from)+T.from<e.yr) return;
        const at0=FOLLOW_D.t0+(FOLLOW_D.t1-FOLLOW_D.t0)*(e.yr-T.from)/(T.to-T.from), up=i%2===0;
        stroke([[x,T.y+(up?-30:30)],[x,T.y+(up?-150:150)]],1,{col:PAL.ink,w:3});
        photo(e.key,x,T.y+(up?-270:270),300,210,{rot:up?-4:4,seed:700+i,depth:1,s:E.back(prog(t,at0,.35))+.001}); }); });
    station(M[0],M[1],()=>{ region(ZONE,prog(t,tM+.4,.9),{col:PAL.red,alpha:.55}); border(ZONE,E.inOut(prog(t,tM+1.0,.8)),{col:PAL.red,w:6});
      route(ROUTE,drawK(lt,FOLLOW_M),{col:PAL.ink,w:7});
      pin(PA[0],PA[1],prog(t,tM+.1,.4)); pin(PB[0],PB[1],prog(t,20.0,.4));
      if(lt>20.2) pulse(PB[0],PB[1],lt); });
  });
  /* z -140..-260 — label planes, closest to camera */
  layer(-140,()=>{
    station(B[0],B[1],()=>label('1971',520,250,{size:150,bg:PAL.yellow,rot:-5,seed:9,s:E.slam(prog(t,tB-.2,.4))+.001,depth:1.2}));
    station(M[0],M[1],()=>{ if(lt>tM+.3) place('Bretton Woods',PA[0],PA[1]+50,{s:E.back(prog(t,tM+.3,.3))+.001});
                            if(lt>20.1) place('London',PB[0],PB[1]+50,{s:E.back(prog(t,20.1,.3))+.001}); });
  });
  layer(-260,()=>{
    station(A[0],A[1],()=>{ dot(600,640,80,{seed:31,torn:false,s:E.back(prog(t,.9,.3))+.001});
      arrow(1280,340,1640,140,E.out(prog(t,1.6,.6)),{col:PAL.red,w:10,bend:-.15}); });
    station(B[0],B[1],()=>{ ridge(800,PAL.navy,11,60,1);
      const pose = lt<tB+1.1 ? act(lt,'talk') : act(lt,'shake',tB+1.1);          // paper puppet: joints only
      puppet('presenter',1700,900+(1-E.out(prog(t,tB-.3,.4)))*500,560,window.RIG_PRESENTER,pose,{depth:1.1}); });
    station(C[0],C[1],()=>{ label('+340%',3150,150,{size:150,bg:PAL.yellow,rot:4,seed:13,s:E.slam(prog(t,FOLLOW_C.t1+.05,.4))+.001,depth:1});
      ring(3150,150,280,130,E.inOut(prog(t,FOLLOW_C.t1+.45,.6)),{col:PAL.red,w:10,seed:8}); });
  });
  /* z -650 — out-of-focus foreground scraps placed ALONG THE CAMERA PATHS */
  layer(-650,()=>{
    station(A[0],A[1],()=>{ block(60,90,420,300,PAL.red,71,-18,1); block(1880,860,520,300,PAL.kraft,72,12,1); });
    station((A[0]+B[0])/2,(A[1]+B[1])/2,()=>block(960,300,380,520,PAL.yellow,73,10,1));
    station((B[0]+C[0])/2,(B[1]+C[1])/2,()=>block(700,600,520,300,PAL.red,74,-8,1));
    station((C[0]+D[0])/2,(C[1]+D[1])/2,()=>block(1100,380,420,560,PAL.kraft,75,6,1));
    station((D[0]+M[0])/2,(D[1]+M[1])/2,()=>tape(900,500,320,-25,76));
  });
}}];
```
