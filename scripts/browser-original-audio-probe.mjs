import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';

/** Non-recording WebAudio diagnostics for authentic original Sinthai SWFs.
 * Do not synthesize sounds, replace playback buffers, collect audio samples,
 * or infer audibility from the AudioContext state alone.
 */
const browser=await chromium.launch({headless:true,
  env:{...process.env,LANG:'en_US.UTF-8',LC_ALL:'en_US.UTF-8'},
  args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--autoplay-policy=user-gesture-required']});
const page=await browser.newPage({viewport:{width:960,height:760},locale:'en-US'});
const requests=[],errors=[];
page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
page.on('response',r=>{
  const path=new URL(r.url()).pathname;
  if(path.startsWith('/original/') && /\.swf$/i.test(path)) requests.push({path,status:r.status()});
});
await page.addInitScript(()=>{
  const original=window.AudioContext || window.webkitAudioContext;
  const probe={supported:Boolean(original),contexts:[],resumeCalls:0,sourceStarts:0,decodeAttempts:0};
  Object.defineProperty(window,'__audioProbe',{value:probe,writable:false});
  if(!original)return;
  // Observable wrapper retains native prototype, function and context behavior.
  class TrackedAudioContext extends original {
    constructor(...args){
      super(...args);
      const record={initialState:this.state,resumeStates:[],startedSources:0};
      probe.contexts.push(record);
      const resume=this.resume.bind(this);
      this.resume=async(...resumeArgs)=>{
        probe.resumeCalls++;
        const returned=await resume(...resumeArgs);
        record.resumeStates.push(this.state);
        return returned;
      };
      const createBufferSource=this.createBufferSource.bind(this);
      this.createBufferSource=(...sourceArgs)=>{
        const source=createBufferSource(...sourceArgs);
        const start=source.start.bind(source);
        source.start=(...startArgs)=>{
          probe.sourceStarts++;
          record.startedSources++;
          return start(...startArgs);
        };
        return source;
      };
      const decodeAudioData=this.decodeAudioData.bind(this);
      this.decodeAudioData=(...decodeArgs)=>{
        probe.decodeAttempts++;
        return decodeAudioData(...decodeArgs);
      };
    }
  }
  window.AudioContext=TrackedAudioContext;
  if(window.webkitAudioContext)window.webkitAudioContext=TrackedAudioContext;
});
const report={format:'the-house-original-browser-audio-observation-v1',checks:[],requests,errors};
try{
  await page.goto('http://127.0.0.1:5173/port.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.RufflePlayer?.newest==='function',{timeout:20000});
  const snapshot=async label=>{
    const data=await page.evaluate(()=>{
      const p=document.querySelector('#stage ruffle-player');
      const contexts=window.__audioProbe?.contexts??[];
      return {
        audioSupported:window.__audioProbe?.supported??false,
        contextCount:contexts.length,
        contextStates:contexts.map(c=>c.resumeStates.at(-1)??c.initialState),
        resumeCalls:window.__audioProbe?.resumeCalls??0,
        bufferSourceStarts:window.__audioProbe?.sourceStarts??0,
        decodeAttempts:window.__audioProbe?.decodeAttempts??0,
        ruffleIsPlaying:typeof p?.isPlaying==='boolean'?p.isPlaying:null,
        playerReadyState:p?.readyState??null
      };
    });
    report.checks.push({label,...data});
  };
  await snapshot('before-load');
  await page.locator('#staged').click();
  await page.waitForTimeout(2500);
  await snapshot('title-loaded-no-extra-gesture');
  // Browser user gesture that should be sufficient to unlock audio on Chromium.
  await page.locator('#stage').click({position:{x:160,y:180}});
  await page.waitForTimeout(2600);
  await snapshot('after-stage-gesture');
  await page.locator('#staged-entry').selectOption('/original/Dining room.swf');
  await page.locator('#load-entry').click();
  await page.waitForTimeout(3500);
  await snapshot('dining-room-loaded');
  report.status='PROBE_COMPLETE';
  if(!requests.some(r=>r.path==='/original/Title.swf'&&r.status===200)
     || !requests.some(r=>r.path==='/original/Dining%20room.swf'&&r.status===200))
    throw new Error('Original Title and Dining SWF requests were not both successful');
}catch(error){
  report.status='PROBE_ERROR';
  report.failure=String(error);
  process.exitCode=1;
}finally{
  report.caution='WebAudio API activity alone does not prove that any sound is audible or matches original Flash. No waveform or audio bytes were captured. Safari requires separate real-device checks.';
  console.log(JSON.stringify(report,null,2));
  await writeFile('original-audio-observation.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
