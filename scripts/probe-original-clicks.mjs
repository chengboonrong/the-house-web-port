import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

/**
 * Bounded real-player click probe. Deliberately does not bypass puzzles or
 * inject synthetic ActionScript into original game files.
 * Success ONLY if browser observes original target SWF loaded (HTTP 200).
 */
const browser=await chromium.launch({headless:true,
  env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'},
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:960,height:760},locale:'en-US'});
const requests=[],errors=[],clicks=[];
const target='/original/Bathroom.swf';
let status='UNKNOWN';
page.on('response',r=>{
  try{
    const u=new URL(r.url());
    if(u.pathname.startsWith('/original/'))requests.push({path:u.pathname,status:r.status()});
  }catch{}
});
page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
try {
  await page.goto('http://127.0.0.1:5173/port.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.RufflePlayer?.newest==='function',{timeout:25000});
  await page.locator('#staged').click();
  await page.locator('#staged-entry').selectOption('/original/Dining room.swf');
  await page.locator('#load-entry').click();
  await page.waitForTimeout(3000);
  const originalLoaded=requests.some(r=>r.path==='/original/Dining%20room.swf'&&r.status===200);
  if(!originalLoaded)throw Error('Dining room was not downloaded successfully');
  const player=page.locator('#stage ruffle-player');
  const bounds=await player.boundingBox();
  if(!bounds)throw Error('Cannot locate actual Ruffle player');
  // Bounded sweep of real DOM pointer clicks. Not guaranteed to hit a puzzle-locked exit.
  outer:for(let row=1;row<=8;row++){
    for(let col=1;col<=8;col++){
      const x=bounds.x+bounds.width*(col/9), y=bounds.y+bounds.height*(row/9);
      await page.mouse.click(x,y,{delay:35});
      clicks.push({xFraction:col/9,yFraction:row/9});
      await page.waitForTimeout(90);
      if(requests.some(r=>r.path===target)){
        status=requests.some(r=>r.path===target&&r.status===200)
          ?'OBSERVED_ORIGINAL_BATHROOM_REQUEST_200':'BATHROOM_REQUEST_BUT_NOT_HTTP_200';
        break outer;
      }
    }
  }
  if(status==='UNKNOWN')status='NO_ROOM_TRANSITION_OBSERVED_IN_BOUNDED_CLICK_SWEEP';
  if(status==='OBSERVED_ORIGINAL_BATHROOM_REQUEST_200')await page.waitForTimeout(1200);
}catch(error){
  status='PROBE_ERROR';
  errors.push(String(error).slice(0,400));
  process.exitCode=1;
}finally{
  const report={
    format:'the-house-2005-native-click-probe-v1',status,
    clickCount:clicks.length,
    requests:requests.slice(-35),
    errors:errors.slice(0,20),
    limitations:'Automated grid clicks do not prove puzzles are solvable or that game transitions are broken. Actual original SWF used; no image or game data retained.'
  };
  console.log(JSON.stringify(report,null,2));
  await writeFile('original-click-metadata.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
