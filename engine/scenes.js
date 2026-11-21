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
