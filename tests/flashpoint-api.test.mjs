import test from 'node:test';
import assert from 'node:assert/strict';
import {parseResult} from '../scripts/search-flashpoint-api.mjs';
test('Flashpoint public API results distinguish same-title alternate author and sequel',()=>{
 const result=parseResult({games:[
  {id:'same-title',title:'The House',developer:'Anode & Cathode',releaseDate:'2005',platform:'Flash',gameData:[]},
  {id:'sequel',title:'The House 2',developer:'Sinthai Studio',releaseDate:'2010',platform:'Flash',gameData:[]},
  {id:'correct',title:'The House',developer:'SINTHAIstudio',releaseDate:'2005',platform:'Flash',
    gameData:[{dateAdded:'2025-01-01T00:00:00Z',launchCommand:'http://example.invalid/Title.swf',size:1024}]}
 ]});
 assert.equal(result[0].id,'correct');
 assert.equal(result[0].status,'CANDIDATE_REVIEW_REQUIRED');
 assert.equal(result[0].gameData[0].launchCommand,'http://example.invalid/Title.swf');
 assert.equal(result.find(g=>g.id==='same-title').status,'NOT_CONFIRMED_OR_NAMESAKE');
 assert.equal(result.find(g=>g.id==='sequel').status,'NOT_CONFIRMED_OR_NAMESAKE');
});
test('invalid API payload is not silently reported as zero games',()=>{
 assert.throws(()=>parseResult([]),/games\[\]/);
 assert.throws(()=>parseResult({error:'unavailable'}),/games\[\]/);
});
