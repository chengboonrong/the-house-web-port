import {webkit} from 'playwright';
import {PNG} from 'pngjs';
import {writeFile} from 'node:fs/promises';

/** Real Sinthai The House (2005) in Playwright Linux WebKit.
 * This is NOT Mobile Safari on a physical Apple device.
 * Run on ephemeral CI with the original SWFs staged locally.
 */
const browser=await webkit.launch({headless:true,
  env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'}});
const page=await browser.newPage({viewport:{width:390,height:844},
  deviceScaleFactor:2,hasTouch:true,isMobile:true,locale:'en-US'});
const requests=[],errors=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text().slice(0,300));});
page.on('response',res=>{
  try{
    const path=new URL(res.url()).pathname;
    if(path.startsWith('/original/'))requests.push({path,status:res.status()});
  }catch{}
});
const report={format:'original-the-house-linux-webkit-touch-probe-v1',
  environment:'Playwright WebKit on Linux, 390x844 touch; NOT iPhone Safari',
  title:null,corridor:null,tapCount:0,requests,errors};
try{
  await page.goto('http://127.0.0.1:5173/port.html',{waitUntil:'domcontentloaded',timeout:25000});
  await page.waitForFunction(()=>typeof window.RufflePlayer?.newest==='function',{timeout:25000});
  await page.locator('#staged').click();
  await page.waitForTimeout(4500);
  report.title=await page.evaluate(()=>{
    const p=document.querySelector('#stage ruffle-player');
    const m=p?.ruffle?.()?.metadata;
    return {status:document.querySelector('#status')?.textContent,
      loaded:typeof p?.ruffle==='function',stageRatio:document.querySelector('#stage')?.style.aspectRatio,
      movie:m?{width:m.width,height:m.height,swfVersion:m.swfVersion}:null};
  });
  if(!requests.some(r=>r.path==='/original/Title.swf'&&r.status===200))
    throw new Error('Original Title.swf did not return HTTP 200');
  await page.locator('#staged-entry').selectOption('/original/Corridor.swf');
  await page.locator('#load-entry').click();
  await page.waitForTimeout(3500);
  if(!requests.some(r=>r.path==='/original/Corridor.swf'&&r.status===200))
    throw new Error('Original Corridor.swf did not return HTTP 200');
  const stage=page.locator('#stage');
  for(const [x,y] of [[19.25,589.25],[33.25,589.25],[57.25,589.25],
                      [19.25,595.25],[33.25,595.25],[57.25,595.25]]){
    const box=await stage.boundingBox();
    if(!box)throw new Error('Cannot locate WebKit SWF stage');
    await page.touchscreen.tap(Math.round(box.x+box.width*x/600),
      Math.round(box.y+box.height*y/600));
    report.tapCount++;
    await page.waitForTimeout(250);
    if(requests.some(r=>r.path==='/original/Dining%20room.swf'))break;
  }
  const target=requests.find(r=>r.path==='/original/Dining%20room.swf');
  report.corridor={targetHttp:target?.status??null,frames:[]};
  if(target?.status===200){
    for(const delay of [1000,2500,4500]){
      await page.waitForTimeout(delay);
      const png=PNG.sync.read(await stage.screenshot());
      const unique=new Set();
      for(let i=0;i<png.data.length;i+=16)
        unique.add((png.data[i]<<16)|(png.data[i+1]<<8)|png.data[i+2]);
      report.corridor.frames.push({delayMs:delay,uniqueSampledColors:unique.size});
    }
  }
  // Distinguish source/start success from an actual end-to-end WebKit transition.
  report.result=target?.status===200&&report.corridor.frames.some(f=>f.uniqueSampledColors>30)
    ?'WEBKIT_TOUCH_TRANSITION_RENDERED'
    :target?.status===200?'WEBKIT_TOUCH_REQUEST_NO_CONFIRMED_RENDER'
    :'WEBKIT_ORIGINAL_LOADED_NO_TOUCH_TRANSITION';
  if(report.result!=='WEBKIT_TOUCH_TRANSITION_RENDERED'||errors.length)
    process.exitCode=1;
}catch(error){report.result='WEBKIT_TEST_ERROR';report.failure=String(error);process.exitCode=1;}
finally{
  report.note='WebKit Linux does not certify iOS Safari GPU, audio, hardware memory or interactions.';
  console.log(JSON.stringify(report,null,2));
  await writeFile('original-webkit-metadata.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
