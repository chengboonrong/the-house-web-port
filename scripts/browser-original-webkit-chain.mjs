import {webkit} from 'playwright';
import {PNG} from 'pngjs';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Real original-game, original-button, same-player chain investigation.
 * Corridor -> Kitchen -> Bathroom -> Dining Room via verified AVM1 GetURL(_level0).
 * No injected game state, modified bytecode or third-party asset artifacts.
 */
const browser=await webkit.launch({headless:true,env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'}});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,
  hasTouch:true,isMobile:true,locale:'en-US'});
const responses=[],errors=[],failedRequests=[];
page.on('requestfailed',r=>{if(new URL(r.url()).pathname.startsWith('/original/'))failedRequests.push({path:new URL(r.url()).pathname,reason:r.failure()?.errorText??'unknown'});});
page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
page.on('response',r=>{
  const p=new URL(r.url()).pathname;
  if(p.startsWith('/original/')&&p.toLowerCase().endsWith('.swf'))
    responses.push({path:p,status:r.status()});
});
const report={format:'original-the-house-webkit-three-navigation-chain-v2',
  environment:'Playwright Linux WebKit mobile touch, not physical iOS Safari',
  goal:'Corridor.swf -> Kitchen.swf -> Bathroom.swf -> Dining room.swf',
  steps:[],responses,errors,result:'UNTESTED'};
let hostPageNavigations=0;
page.on('framenavigated',frame=>{if(frame===page.mainFrame())hostPageNavigations++;});
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
  return {sampleColors:pixels.size,frameSHA256:createHash('sha256').update(png.data).digest('hex'),player:await page.evaluate(()=>{
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
  const originalPlayer=await page.locator('#stage ruffle-player').elementHandle();
  const navigationBaseline=hostPageNavigations;
  if(!originalPlayer)throw new Error('Original Ruffle player absent');
  const plan=[
    {source:'Corridor.swf',destination:'Kitchen.swf',path:'/original/Kitchen.swf',
      // Verified original DefineButton2 ID 14 on Corridor main timeline,
      // placement transform (259.65, 585.25).
      buttons:[[266,589],[280,589],[305,589],[340,589],[280,595]]},
    {source:'Kitchen.swf',destination:'Bathroom.swf',path:'/original/Bathroom.swf',
      // Verified Kitchen button ID 10 at (144.5,585.3).
      buttons:[[151,589],[165,589],[190,589],[210,589],[165,595]]},
    {source:'Bathroom.swf',destination:'Dining room.swf',path:'/original/Dining%20room.swf',
      // Verified original Bathroom button ID 10 at (13.3,585.3).
      buttons:[[19,589],[33,589],[57,589],[85,589],[33,595]]}
  ];
  for(const step of plan){
    const previous=responses.filter(r=>r.path===step.path).length;
    const clickClock=Date.now();
    const record={from:step.source,to:step.destination,attempts:0,requested:false,http200:false};
    for(const [x,y] of step.buttons){
      await stagePoint(x,y);
      record.attempts++;
      await page.waitForTimeout(300);
      if(responses.filter(r=>r.path===step.path).length>previous){
        record.requested=true;
        record.http200=hasResponse(step.path);
        record.hit={stageX:x,stageY:y};
        record.requestObservedWithinMs=Date.now()-clickClock;
        break;
      }
    }
    if(record.http200){
      await page.waitForTimeout(7400);
      record.postTransition=await renderStatus();
      record.nonFlat=record.postTransition.sampleColors>30;
      await page.waitForTimeout(1000);
      record.laterFrame=await renderStatus();
      record.stillNonFlatAfterOneSecond=record.laterFrame.sampleColors>30;
      record.samePlayerConnected=await originalPlayer.evaluate(el=>el.isConnected).catch(()=>false);
      record.hostPath=new URL(page.url()).pathname;
      record.hostReloads=hostPageNavigations-navigationBaseline;
    }
    report.steps.push(record);
    if(!record.http200 || !record.nonFlat)break;
  }
  const first=report.steps[0],second=report.steps[1],third=report.steps[2];
  report.result=third?.http200&&third.nonFlat?'THREE_ORIGINAL_ROOM_TRANSITIONS_RENDERED':
    second?.http200&&second.nonFlat?'TWO_ORIGINAL_ROOM_TRANSITIONS_RENDERED':
    first?.http200&&first.nonFlat?'FIRST_TRANSITION_ONLY':
    'FIRST_TRANSITION_NOT_CONFIRMED';
  // Passive original Dining Room endurance probe. No injected AVM1 state or
  // speculative puzzle clicks; this verifies runtime continuity only.
  if(report.result==='THREE_ORIGINAL_ROOM_TRANSITIONS_RENDERED'){
    const samples=[];
    const enduranceStart=Date.now();
    for(let i=0;i<4;i++){
      await page.waitForTimeout(3000);
      const frame=await renderStatus();
      samples.push({
        elapsedMs:Date.now()-enduranceStart,
        sampleColors:frame.sampleColors,
        frameSHA256:frame.frameSHA256,
        playerRunning:frame.player.isPlaying,
        playerConnected:await originalPlayer.evaluate(el=>el.isConnected).catch(()=>false),
        hostPath:new URL(page.url()).pathname,
        reloads:hostPageNavigations-navigationBaseline,
        failedOriginalRequests:failedRequests.length,
        pageErrors:errors.length
      });
    }
    report.diningRoomEndurance={
      mode:'passive observation of unmodified original SWF; not puzzle or jumpscare certification',
      samples,
      passed:samples.every(s=>s.sampleColors>30 && s.playerRunning &&
        s.playerConnected && s.hostPath==='/port.html' &&
        s.reloads===0 && s.failedOriginalRequests===0 && s.pageErrors===0)
    };
  }
  report.hostPageNavigations=hostPageNavigations-navigationBaseline;
  report.failedOriginalRequests=failedRequests;
  // Three unmodified original navigation transitions are now verified.
  // Fail CI if any request, recovery or stable playback regresses.
  if(report.result!=='THREE_ORIGINAL_ROOM_TRANSITIONS_RENDERED'||
     !report.diningRoomEndurance?.passed||errors.length||
     failedRequests.length || report.steps.some(step=>!step.postTransition?.player?.isPlaying ||
       !step.stillNonFlatAfterOneSecond || !step.laterFrame?.player?.isPlaying ||
       !step.samePlayerConnected || step.hostPath!=='/port.html' || step.hostReloads!==0))
    process.exitCode=1;
}catch(error){report.result='TEST_ERROR';report.failure=String(error);process.exitCode=1;}
finally{
  report.caution='Only real original SWF requests count. A missed hotspot is inconclusive; no full gameplay or iPhone Safari certification.';
  console.log(JSON.stringify(report,null,2));
  await writeFile('original-webkit-chain.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
