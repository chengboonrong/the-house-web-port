import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { inspectSwf } from '../scripts/inspect-swf-structure.mjs';

/** Self-authored synthetic Flash header; no copyright game content. */
function syntheticSwf() {
  const nbits=15;
  const values=[0,640*20,0,480*20];
  const bits=[...Array.from({length:5},(_,i)=>(nbits>>(4-i))&1)];
  for(const value of values)for(let i=nbits-1;i>=0;i--)bits.push((value>>i)&1);
  while(bits.length%8)bits.push(0);
  const rect=Buffer.from(Array.from({length:bits.length/8},(_,index)=>
    bits.slice(index*8,index*8+8).reduce((acc,b)=>(acc<<1)|b,0)));
  const frame=Buffer.alloc(4);
  frame.writeUInt16LE(12*256,0);frame.writeUInt16LE(1,2);
  const end=Buffer.from([0,0]);
  const tag=Buffer.from([0x44,0x11,0x00,0x00,0x00,0x00]); // FileAttributes, AS3 flag false
  const body=Buffer.concat([rect,frame,tag,end]);
  const header=Buffer.alloc(8);header.write('FWS',0);header[3]=8;header.writeUInt32LE(8+body.length,4);
  return Buffer.concat([header,body]);
}
test('inspects synthetic FWS dimensions, rate and top-level tags',()=>{
  const swf=syntheticSwf();
  const got=inspectSwf(swf);
  assert.equal(got.signature,'FWS');
  assert.equal(got.stage.widthPx,640);
  assert.equal(got.stage.heightPx,480);
  assert.equal(got.frameRate,12);
  assert.equal(got.frameCount,1);
  assert.equal(got.tagCounts.FileAttributes,1);
  assert.equal(got.terminatorFound,true);
});
test('inspects corresponding CWS zlib contents',()=>{
  const swf=syntheticSwf();
  const cws=Buffer.concat([Buffer.from('CWS'),swf.subarray(3,8),deflateSync(swf.subarray(8))]);
  assert.equal(inspectSwf(cws).stage.widthPx,640);
});
test('rejects mismatched length and corrupt tag boundaries',()=>{
  const swf=syntheticSwf();
  const wrong=Buffer.from(swf);wrong.writeUInt32LE(999,4);
  assert.throws(()=>inspectSwf(wrong),/size differs/);
  const corrupt=Buffer.from(swf);corrupt[corrupt.length-2]=0xff;corrupt[corrupt.length-1]=0xff;
  assert.throws(()=>inspectSwf(corrupt),/long tag length/);
});
