import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

/**
 * Bounded, exploratory click probing on the *original* Dining Room SWF.
 * Only reports network URLs, probes and Ruffle metadata. Never saves frames,
 * SWF bytes, graphics, game text, or audio. No claim of a full playthrough.
 */
const pageURL='http://127.0.0.1:5173/port.html';
const browser=await chromium.launch({headless:true,env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'},
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:1000,height:900},locale:'en-US'});
const swfRequests=[],pageErrors=[];
page.on('response', r=>{
  const path=new URL(r.url()).pathname;
  if(path.startsWith('/original/')&&path.toLowerCase().endsWith('.swf')){
    swfRequests.push({path,status:r.status()});
  }
});
page.on('pageerror',e=>pageErrors.push(String(e).slice(0,250)));
const result={format:'the-house-original-button-probe-v1',attempted:0,transitionObserved:false,
  source:'Dining room.swf',expectedTarget:'Bathroom.swf',swfRequests,pageErrors,
  notes:'Exploratory grid clicking; cannot prove hotspot absence when no transition is seen. No screenshots or original assets are retained.'};
try{
  await page.goto(pageURL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.RufflePlayer?.newest==='function',{timeout:20000});
  await page.locator('#staged').click();
  await page.locator('#staged-entry').selectOption('/original/Dining room.swf');
  await page.locator('#load-entry').click();
  await page.waitForFunction(()=>document.querySelector('#stage ruffle-player')?.ruffle?.()?.metadata?.width===600,{timeout:15000});
  await page.waitForTimeout(2000);
  const box=await page.locator('#stage').boundingBox();
  if(!box)throw new Error('No game stage');
  // Hit likely navigation hotspots near the edges as well as a coarse field grid.
  const fractions=[
    [0.06,0.06],[0.94,0.06],[0.06,0.94],[0.94,0.94],
    [0.1,0.5],[0.9,0.5],[0.5,0.1],[0.5,0.9]
  ];
  for(const y of [0.12,0.30,0.48,0.66,0.84]){
    for(const x of [0.08,0.24,0.40,0.56,0.72,0.88])fractions.push([x,y]);
  }
  for(const [xf,yf] of fractions){
    result.attempted++;
    await page.mouse.click(box.x+box.width*xf,box.y+box.height*yf,{delay:40});
    await page.waitForTimeout(220);
    if(swfRequests.some(r=>/Bathroom\.swf$/i.test(decodeURIComponent(r.path)))){
      result.transitionObserved=true;
      result.hitRelativePoint={x:xf,y:yf};
      break;
    }
  }
  result.finalPlayerMetadata=await page.evaluate(()=>{
    const m=document.querySelector('#stage ruffle-player')?.ruffle?.()?.metadata;
    return m?{width:m.width,height:m.height,frameRate:m.frameRate,swfVersion:m.swfVersion}:null;
  });
  result.finalPagePath=new URL(page.url()).pathname;
  result.status=await page.locator('#status').innerText();
  if(!swfRequests.some(r=>decodeURIComponent(r.path).endsWith('Dining room.swf')&&r.status===200)){
    throw new Error('Original dining SWF request not confirmed');
  }
  // Probing does not fail CI merely because no hotspot was activated.
  // Test run explicitly records transitionObserved=false in this case.
}catch(e){result.failure=String(e);process.exitCode=1;}
finally{
  console.log(JSON.stringify(result,null,2));
  await writeFile('ruffle-navigation-probe.json',JSON.stringify(result,null,2)+'\n');
  await browser.close();
}
