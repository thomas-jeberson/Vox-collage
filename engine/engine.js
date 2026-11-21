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
