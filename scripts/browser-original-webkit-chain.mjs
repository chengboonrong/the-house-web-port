import {webkit} from 'playwright';
import {PNG} from 'pngjs';
import {writeFile} from 'node:fs/promises';

/** Real original-game, original-button, same-player chain investigation.
 * Corridor -> Kitchen -> Bathroom via verified AVM1 GetURL(_level0).
 * No injected game state, modified bytecode or third-party asset artifacts.
 */
const browser=await webkit.launch({headless:true,env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'}});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,
  hasTouch:true,isMobile:true,locale:'en-US'});
const responses=[],errors=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
page.on('response',r=>{
  const p=new URL(r.url()).pathname;
  if(p.startsWith('/original/')&&p.toLowerCase().endsWith('.swf'))
    responses.push({path:p,status:r.status()});
});
const report={format:'original-the-house-webkit-two-navigation-chain-v1',
  environment:'Playwright Linux WebKit mobile touch, not physical iOS Safari',
  goal:'Corridor.swf -> Kitchen.swf -> Bathroom.swf',
  steps:[],responses,errors,result:'UNTESTED'};
const stagePoint=async(x,y)=>{
  const b=await page.locator('#stage').boundingBox();
  if(!b)throw new Error('SWF stage not present');
  await page.touchscreen.tap(Math.round(b.x+b.width*x/600),Math.round(b.y+b.height*y/600));
};
const hasResponse=path=>responses.some(r=>r.path===path&&r.status===200);
async function renderStatus(){
  const png=PNG.sync.read(await page.locator('#stage').screenshot());
  const pixels=new Set();
  for(let i=0;i<png.data.length;i+=16)
    pixels.add((png.data[i]<<16)|(png.data[i+1]<<8)|png.data[i+2]);
  return {sampleColors:pixels.size,player:await page.evaluate(()=>{
    const p=document.querySelector('#stage ruffle-player');
    return {exists:!!p,readyState:p?.readyState??null,isPlaying:p?.isPlaying??null};
  })};
}
try{
  await page.goto('http://127.0.0.1:5173/port.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.RufflePlayer?.newest==='function',{timeout:25000});
  await page.locator('#staged').click();
  await page.locator('#staged-entry').selectOption('/original/Corridor.swf');
  await page.locator('#load-entry').click();
  await page.waitForTimeout(3000);
  if(!hasResponse('/original/Corridor.swf'))throw new Error('Original Corridor not HTTP 200');
  const plan=[
    {source:'Corridor.swf',destination:'Kitchen.swf',path:'/original/Kitchen.swf',
      // Verified original DefineButton2 ID 14 on Corridor main timeline,
      // placement transform (259.65, 585.25).
      buttons:[[266,589],[280,589],[305,589],[340,589],[280,595]]},
    {source:'Kitchen.swf',destination:'Bathroom.swf',path:'/original/Bathroom.swf',
      // Verified Kitchen button ID 10 at (144.5,585.3).
      buttons:[[151,589],[165,589],[190,589],[210,589],[165,595]]}
  ];
  for(const step of plan){
    const previous=responses.filter(r=>r.path===step.path).length;
    const record={from:step.source,to:step.destination,attempts:0,requested:false,http200:false};
    for(const [x,y] of step.buttons){
      await stagePoint(x,y);
      record.attempts++;
      await page.waitForTimeout(300);
      if(responses.filter(r=>r.path===step.path).length>previous){
        record.requested=true;
        record.http200=hasResponse(step.path);
        record.hit={stageX:x,stageY:y};
        break;
      }
    }
    if(record.http200){
      await page.waitForTimeout(7400);
      record.postTransition=await renderStatus();
      record.nonFlat=record.postTransition.sampleColors>30;
    }
    report.steps.push(record);
    if(!record.http200 || !record.nonFlat)break;
  }
  const first=report.steps[0],second=report.steps[1];
  report.result=second?.http200&&second.nonFlat?'TWO_ORIGINAL_ROOM_TRANSITIONS_RENDERED':
    first?.http200&&first.nonFlat?'FIRST_TRANSITION_OK_SECOND_NOT_OBSERVED':
    'FIRST_TRANSITION_NOT_CONFIRMED';
  if(!first?.http200||!first.nonFlat||errors.length)process.exitCode=1;
  // A second transition is exploratory until the exact active button state
  // is confirmed; do not fail CI on an unobserved puzzle-dependent route.
}catch(error){report.result='TEST_ERROR';report.failure=String(error);process.exitCode=1;}
finally{
  report.caution='Only real original SWF requests count. A missed hotspot is inconclusive; no full gameplay or iPhone Safari certification.';
  console.log(JSON.stringify(report,null,2));
  await writeFile('original-webkit-chain.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
