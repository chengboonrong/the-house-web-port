import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {createHash} from 'node:crypto';
import {writeFile,mkdir} from 'node:fs/promises';

const url=process.env.RESEARCH_URL || 'http://127.0.0.1:5173/port.html';
const browser=await chromium.launch({headless:true,env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'},args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:960,height:760},deviceScaleFactor:1,locale:'en-US'});
const errors=[],resources=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
page.on('console',m=>{if(m.type()==='error'&&errors.length<50)errors.push(m.text().slice(0,300));});
page.on('requestfailed',r=>{if(resources.length<100)resources.push({path:new URL(r.url()).pathname,failed:r.failure()?.errorText});});
page.on('response',r=>{if(new URL(r.url()).pathname.startsWith('/original/')&&resources.length<100)resources.push({path:new URL(r.url()).pathname,status:r.status()});});
let result;
try{
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>Boolean(window.RufflePlayer?.newest),{timeout:25000});
 await page.locator('#staged').click();
 await page.waitForTimeout(8000);
 const status=await page.locator('#status').innerText();
 const runtime=await page.evaluate(()=>{const p=document.querySelector('#stage ruffle-player');return {language:navigator.language,languages:navigator.languages,playerTag:p?.tagName,playerConstructor:p?.constructor?.name,customElementRegistered:Boolean(customElements.get('ruffle-player')),ruffleType:typeof p?.ruffle,loadType:typeof p?.load,playerProto:Object.getOwnPropertyNames(Object.getPrototypeOf(p??document.body)).slice(0,35),runtimeAPI:typeof window.RufflePlayer?.newest};});
 const hasPlayer=await page.locator('#stage ruffle-player').count()>0;
 const titleStageRatio=await page.locator('#stage').evaluate(el=>el.style.aspectRatio);
 const titleMetadata=await page.evaluate(()=>{const p=document.querySelector('#stage ruffle-player');const m=p?.ruffle?.()?.metadata;return m?{width:m.width,height:m.height,frameRate:m.frameRate,numFrames:m.numFrames,swfVersion:m.swfVersion,isActionScript3:m.isActionScript3}:null;});
 const buffer=await page.locator('#stage').screenshot();
 if(process.env.CAPTURE_PREVIEWS==='1') {await mkdir('research-screenshots',{recursive:true});await writeFile('research-screenshots/01-title.png',buffer);}
 const png=PNG.sync.read(buffer);
 let distinct=new Set(),total=0,notBlack=0;
 for(let i=0;i<png.data.length;i+=16){
   const r=png.data[i],g=png.data[i+1],b=png.data[i+2];
   distinct.add((r<<16)|(g<<8)|b);
   total++;
   if(Math.max(r,g,b)>35)notBlack++;
 }
 if(status.includes('failed')||status.includes('unavailable')||!hasPlayer || !resources.some(r=>r.path==='/original/Title.swf'&&r.status===200))process.exitCode=1;
 await page.locator('#staged-entry').selectOption('/original/Dining room.swf');
 await page.locator('#load-entry').click();
 await page.waitForTimeout(3500);
 const roomStatus=await page.locator('#status').innerText();
 const roomMetadata=await page.evaluate(()=>{const p=document.querySelector('#stage ruffle-player');const m=p?.ruffle?.()?.metadata;return m?{width:m.width,height:m.height,frameRate:m.frameRate,numFrames:m.numFrames,swfVersion:m.swfVersion,isActionScript3:m.isActionScript3}:null;});
 const roomStageRatio=await page.locator('#stage').evaluate(el=>el.style.aspectRatio);
 const roomImage=await page.locator('#stage').screenshot();
 if(process.env.CAPTURE_PREVIEWS==='1')await writeFile('research-screenshots/02-dining-room.png',roomImage);
 const roomScreenshot=PNG.sync.read(roomImage);
 const roomColors=new Set();for(let i=0;i<roomScreenshot.data.length;i+=16)roomColors.add((roomScreenshot.data[i]<<16)|(roomScreenshot.data[i+1]<<8)|roomScreenshot.data[i+2]);
 const roomResourceSucceeded=resources.some(r=>r.path==='/original/Dining%20room.swf'&&r.status===200);
 if(roomStatus.includes('failed')||!roomResourceSucceeded||roomColors.size<12 || !titleMetadata || !roomMetadata ||
   titleMetadata.width!==800 || titleMetadata.height!==515 || roomMetadata.width!==600 || roomMetadata.height!==600 ||
   titleStageRatio!=='800 / 515' || roomStageRatio!=='600 / 600' ||
   titleMetadata.isActionScript3!==false || roomMetadata.isActionScript3!==false || errors.length>0)process.exitCode=1;
 result={
   format:'the-house-original-ruffle-chromium-smoke-v1',
   status,hasPlayer,runtime,titleMetadata,titleStageRatio,
   room:{status:roomStatus,metadata:roomMetadata,stageRatio:roomStageRatio,resourceSucceeded:roomResourceSucceeded,sampledUniqueColors:roomColors.size},
   screenshotSHA256:createHash('sha256').update(buffer).digest('hex'),
   screenshotSize:{width:png.width,height:png.height},
   sampledUniqueColors:distinct.size,
   brightPixelRatio:Math.round(1000*notBlack/total)/1000,
   originalResourceResponses:resources,
   errors:errors.slice(0,30),
   note:'Pixel variation does not prove authentic title rendering or working interactions. Screenshot bytes never uploaded.'
 };
}catch(e){
 result={format:'the-house-original-ruffle-chromium-smoke-v1',
  failed:String(e),errors:errors.slice(0,30),resources};
 process.exitCode=1;
}finally{
 await writeFile('ruffle-smoke-metadata.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result,null,2));
 await browser.close();
}
