import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {writeFile} from 'node:fs/promises';

/**
 * Authentic original Corridor -> Dining Room via mobile-size touchscreen input.
 * Chromium touch emulation is NOT an iOS WebKit/Safari test.
 * No original assets or screenshots are retained in artifacts.
 */
const browser=await chromium.launch({headless:true,
  env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'},
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({
  viewport:{width:390,height:844},deviceScaleFactor:2,
  isMobile:true,hasTouch:true,locale:'en-US'
});
const responses=[],errors=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,250)));
page.on('response',r=>{
  const p=new URL(r.url()).pathname;
  if(p.startsWith('/original/')&&p.endsWith('.swf'))responses.push({path:p,status:r.status()});
});
const report={format:'the-house-original-mobile-touch-chromium-v1',
  device:'Chromium simulated 390x844 touch viewport (NOT iPhone Safari)',
  originalFrom:'Corridor.swf',originalTarget:'Dining room.swf',
  status:'UNTESTED',tapCount:0,responses,errors};
try{
  await page.goto('http://127.0.0.1:5173/port.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.RufflePlayer?.newest==='function',{timeout:25000});
  await page.locator('#staged').click();
  await page.locator('#staged-entry').selectOption('/original/Corridor.swf');
  await page.locator('#load-entry').click();
  await page.waitForTimeout(3200);
  if(!responses.some(r=>r.path==='/original/Corridor.swf'&&r.status===200))
    throw new Error('Original Corridor SWF failed to download');
  const stage=page.locator('#stage');
  const candidatePoints=[[19.25,589.25],[33.25,589.25],[57.25,589.25],
      [19.25,595.25],[33.25,595.25],[57.25,595.25]];
  for(const [x,y] of candidatePoints){
    const b=await stage.boundingBox();
    if(!b)throw new Error('No stage bounds');
    const px=Math.round(b.x+b.width*x/600);
    const py=Math.round(b.y+b.height*y/600);
    await page.touchscreen.tap(px,py);
    report.tapCount++;
    await page.waitForTimeout(240);
    if(responses.some(r=>r.path==='/original/Dining%20room.swf')){report.hit={x,y,pixelX:px,pixelY:py};break;}
  }
  const targetResponse=responses.find(r=>r.path==='/original/Dining%20room.swf');
  report.originalTargetHttp=targetResponse?.status??null;
  report.frames=[];
  if(targetResponse?.status===200){
    for(const ms of [750,3000,4500]){
      await page.waitForTimeout(ms);
      const png=PNG.sync.read(await stage.screenshot());
      const pixels=new Set();
      for(let i=0;i<png.data.length;i+=16){
        pixels.add((png.data[i]<<16)|(png.data[i+1]<<8)|png.data[i+2]);
      }
      report.frames.push({waitMs:report.frames.reduce((a,f)=>a+f.deltaMs,0)+ms,
        deltaMs:ms,uniqueSampleColors:pixels.size});
    }
  }
  report.status=targetResponse?.status!==200?'NO_ORIGINAL_TOUCH_TRANSITION':
    report.frames.some(f=>f.uniqueSampleColors>30)?'TOUCH_TRANSITION_AND_NONFLAT_RENDER':'TOUCH_REQUEST_WITH_UNCONFIRMED_RENDER';
  if(report.status!=='TOUCH_TRANSITION_AND_NONFLAT_RENDER'||errors.length)
    process.exitCode=1;
}catch(e){report.status='ERROR';report.failure=String(e);process.exitCode=1;}
finally{
  report.limitations='Chromium touch simulation is not Apple WebKit, a real iPhone, an audio verification, or a puzzle playthrough.';
  console.log(JSON.stringify(report,null,2));
  await writeFile('original-touch-metadata.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
