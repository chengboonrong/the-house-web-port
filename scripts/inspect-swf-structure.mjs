#!/usr/bin/env node
/**
 * Read-only SWF structural inventory. Does not execute ActionScript.
 * Supports FWS (plain) and CWS (zlib); reports ZWS as unsupported.
 * Tag inventory includes top-level tags only; nested sprites need FFDec.
 */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

const TAG_NAMES = {
  0:'End', 1:'ShowFrame', 2:'DefineShape', 4:'PlaceObject', 6:'DefineBits',
  9:'SetBackgroundColor', 12:'DoAction', 14:'DefineSound', 15:'StartSound',
  18:'SoundStreamHead',19:'SoundStreamBlock',20:'DefineBitsLossless',
  21:'DefineBitsJPEG2',22:'DefineShape2',26:'PlaceObject2',28:'RemoveObject2',
  32:'DefineShape3',34:'DefineButton2',35:'DefineBitsJPEG3',
  39:'DefineSprite',43:'FrameLabel',46:'DefineMorphShape',48:'DefineFont2',
  56:'ExportAssets',59:'DoInitAction',60:'DefineVideoStream',
  61:'VideoFrame',65:'ScriptLimits',69:'FileAttributes',70:'PlaceObject3',
  71:'ImportAssets2',72:'DoABC',76:'SymbolClass',82:'DoABC',
  83:'DefineShape4',86:'DefineSceneAndFrameLabelData',87:'DefineBinaryData'
};
const LIMIT = 128 * 1024 * 1024;
export function inspectSwf(data) {
  if (data.length < 9 || data.length > LIMIT) throw new Error('SWF truncated or too large');
  const signature = data.subarray(0,3).toString('ascii');
  if (!['FWS','CWS','ZWS'].includes(signature)) throw new Error('Not an FWS/CWS/ZWS SWF');
  const version=data[3], expectedSize=data.readUInt32LE(4);
  if(expectedSize < 13 || expectedSize > LIMIT) throw new Error('Impossible SWF declared size');
  if(signature==='ZWS') return { signature,version,declaredBytes:expectedSize,
    unsupported:'ZWS/LZMA parsing is not implemented; inspect with FFDec' };
  const bytes=signature==='CWS'
    ? Buffer.concat([Buffer.from('FWS'),data.subarray(3,8),
        inflateSync(data.subarray(8),{maxOutputLength:LIMIT-8})])
    : data;
  if(bytes.length !== expectedSize) throw new Error('Decompressed size differs from SWF header');
  const rectStart=8;
  const nbits=bytes[rectStart]>>3;
  const totalBits=5+nbits*4;
  let offset=rectStart+Math.ceil(totalBits/8);
  if(offset+4>bytes.length) throw new Error('Truncated SWF frame header');
  const bits=(start,length)=>{
    let number=0;
    for(let k=0;k<length;k++){
      const bitPos=start+k;
      number=(number<<1)|((bytes[rectStart+(bitPos>>3)]>>(7-(bitPos%8)))&1);
    }
    return number;
  };
  const signed=(n,width)=> width === 0 ? 0 : n >= 2**(width-1) ? n-2**width : n;
  const coords=[];
  for(let i=0;i<4;i++) coords.push(signed(bits(5+i*nbits,nbits),nbits));
  const [xmin,xmax,ymin,ymax]=coords;
  const fps=bytes.readUInt16LE(offset)/256;
  const frameCount=bytes.readUInt16LE(offset+2);
  offset+=4;
  const counts={};
  let endSeen=false, parsed=0, as3Flag=false;
  while(offset<bytes.length){
    if(offset+2>bytes.length)throw new Error('Truncated tag record');
    const header=bytes.readUInt16LE(offset);offset+=2;
    const code=header>>6;
    let length=header&63;
    if(length===63){
      if(offset+4>bytes.length)throw new Error('Truncated long tag length');
      length=bytes.readUInt32LE(offset);offset+=4;
    }
    if(length>bytes.length-offset)throw new Error('Tag payload exceeds SWF length');
    const label=TAG_NAMES[code]??('Tag'+code);
    counts[label]=(counts[label]??0)+1;parsed++;
    if(code===69 && length>=4) as3Flag ||= (bytes[offset]&8)!==0;
    offset+=length;
    if(code===0){endSeen=true;break;}
    if(parsed>500000)throw new Error('Excessive number of SWF tags');
  }
  const avm1=(counts.DoAction??0)+(counts.DoInitAction??0);
  const abc=counts.DoABC??0;
  const indicators=as3Flag||abc>0?'AS3/AVM2 indicated':
    avm1>0?'AS1/AS2 (AVM1) tags present':'No top-level ActionScript indicators';
  return {
    signature,version,declaredBytes:expectedSize,actualBytes:bytes.length,
    stage:{widthPx:(xmax-xmin)/20,heightPx:(ymax-ymin)/20,rectTwips:coords},
    frameRate:fps,frameCount,tagCount:parsed,terminatorFound:endSeen,
    scriptIndicators:{fileAttributesAS3:as3Flag,avm1ActionTags:avm1,doABCTags:abc,assessment:indicators},
    tagCounts:counts,
    limitations:'Only top-level tags; cannot prove all nested scripts or dynamic dependencies. Use FFDec.'
  };
}
if(process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href){
  if(!process.argv[2]){console.error('Usage: node scripts/inspect-swf-structure.mjs file.swf');process.exit(2);}
  const data=await readFile(process.argv[2]);
  const result={file:process.argv[2],sha256:createHash('sha256').update(data).digest('hex'),...inspectSwf(data)};
  console.log(JSON.stringify(result,null,2));
}
