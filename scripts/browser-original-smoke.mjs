import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {createHash} from 'node:crypto';
import {writeFile} from 'node:fs/promises';

const url=process.env.RESEARCH_URL || 'http://127.0.0.1:5173/port.html';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:960,height:760},deviceScaleFactor:1});
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
 const buffer=await page.locator('#stage').screenshot();
 const png=PNG.sync.read(buffer);
 let distinct=new Set(),total=0,notBlack=0;
 for(let i=0;i<png.data.length;i+=16){
   const r=png.data[i],g=png.data[i+1],b=png.data[i+2];
   distinct.add((r<<16)|(g<<8)|b);
   total++;
   if(Math.max(r,g,b)>35)notBlack++;
 }
 if(status.includes('failed')||status.includes('unavailable')||!hasPlayer)process.exitCode=1;
 result={
   format:'the-house-original-ruffle-chromium-smoke-v1',
   status,hasPlayer,runtime,
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
