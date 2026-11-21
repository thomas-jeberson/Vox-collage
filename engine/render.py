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
