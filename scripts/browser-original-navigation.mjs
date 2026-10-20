import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

const browser=await chromium.launch({headless:true,env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'},args:['--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:840},locale:'en-US'});
const responses=[], errors=[];
page.on('response',r=>{const p=new URL(r.url()).pathname;if(p.startsWith('/original/'))responses.push({path:p,status:r.status()});});
page.on('pageerror',e=>errors.push(String(e).slice(0,250)));
let report={format:'the-house-native-room-click-navigation-v1',from:'Corridor.swf',result:'UNTESTED',clicks:[],responses:[],errors:[],notice:'Observed SWF URL request is evidence of original click behavior, not proof of visually correct transition.'};
try{
 await page.goto('http://127.0.0.1:5173/port.html');
 await page.waitForFunction(()=>Boolean(window.RufflePlayer?.newest),{timeout:20000});
 await page.locator('#staged').click();
 await page.locator('#staged-entry').selectOption('/original/Corridor.swf');
 await page.locator('#load-entry').click();
 await page.waitForTimeout(3500);
 const expectedSource=responses.some(x=>x.path==='/original/Corridor.swf'&&x.status===200);
 if(!expectedSource)throw new Error('Corridor original SWF did not load');
 const status=await page.locator('#status').innerText();
 if(/failed|unavailable/i.test(status))throw new Error(status);
 // Scan the native 600 x 600 stage. We use actual pointer clicks and never
 // invoke Ruffle internal navigation APIs or synthetic SWF bytecode.
 const node=page.locator('#stage');
 let matching=[];
 let clicks=0;
 const wanted=/^\/original\/(?:Bathroom|Kitchen|Living%20room|Dining%20room|Credit)\.swf$/i;
 // Coordinates derived from ORIGINAL Corridor.swf PlaceObject2 button
 // translation origins, NOT invented UI hotspots. Hit rectangles still vary.
 const anchorX=[13.25,144.5,259.65,364.45];
 const anchorY=585.25;
 report.probeStrategy='original-button-placement-bottom-edge-then-grid';
 report.placementOrigins=anchorX.map(x=>[x,anchorY]);
 for(const sx of anchorX){
   for(const dx of [6,20,44,75]){
     for(const dy of [-3,4,10]){
       const rect=await node.boundingBox();
       if(!rect)throw new Error('Stage unavailable');
       const px=Math.round(rect.x+rect.width*(sx+dx)/600);
       const py=Math.round(rect.y+rect.height*(anchorY+dy)/600);
       await page.mouse.click(px,py,{delay:35});
       clicks++;
       await page.waitForTimeout(140);
       matching=responses.filter(x=>wanted.test(x.path));
       if(matching.length){
         report.firstMatchingClick={strategy:'static-placement-probe',anchorX:sx,offsetX:dx,offsetY:dy,pixelX:px,pixelY:py,request:matching[0]};
         break;
       }
     }
     if(matching.length)break;
   }
   if(matching.length)break;
 }

 outer:for(let iy=0;iy<12 && !matching.length;iy++){
   for(let ix=0;ix<12;ix++){
     const rect=await node.boundingBox();
     if(!rect)throw new Error('Stage unavailable');
     const px=Math.round(rect.x+rect.width*(ix+0.5)/12);
     const py=Math.round(rect.y+rect.height*(iy+0.5)/12);
     await page.mouse.click(px,py,{delay:40});
     clicks++;
     await page.waitForTimeout(125);
     matching=responses.filter(x=>wanted.test(x.path));
     if(matching.length){
       report.firstMatchingClick={x:ix,y:iy,pixelX:px,pixelY:py,request:matching[0]};
       break outer;
     }
     if(page.isClosed())throw new Error('Browser page unexpectedly closed');
   }
 }
 await page.waitForTimeout(1500);
 report.result=matching.some(x=>x.status===200)?'ROOM_REQUEST_SUCCEEDED':matching.length?'ROOM_REQUEST_FAILED':'NO_NAVIGATION_OBSERVED';
 report.clicksAttempted=clicks;
 report.sourceHttp200=expectedSource;
 report.responses=responses.slice(-45);
 report.errors=errors.slice(-15);
 // No hit in a bounded blind sweep is an inconclusive experiment, not a runtime regression.
 // Keep infrastructure failures and failed target HTTP requests actionable.
 if(report.result==='ROOM_REQUEST_FAILED')process.exitCode=1;
}catch(e){
 report.result='TEST_ERROR';
 report.error=String(e).slice(0,600);
 report.responses=responses.slice(-30);
 report.errors=errors.slice(-15);
 process.exitCode=1;
}finally{
 await writeFile('ruffle-navigation-metadata.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
 await browser.close();
}
