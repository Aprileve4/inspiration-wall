import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import worker from '../cloud/worker.mjs';
const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../cloud/schema.sql',import.meta.url),'utf8'));
const env={DB:{prepare(sql){let values=[];return {bind(...v){values=v;return this},async run(){return db.prepare(sql).run(...values)},async all(){return {results:db.prepare(sql).all(...values)}},async first(){return db.prepare(sql).get(...values)}}}},ASSETS:{fetch:async r=>new Response(new URL(r.url).pathname)}};
const call=(path,body)=>worker.fetch(new Request('https://wall.test'+path,body?{method:'POST',headers:{Origin:'https://wall.test'},body:JSON.stringify(body)}:{}),env);
assert.equal((await (await call('/api/config')).json()).source,'d1');
assert.equal(await (await call('/join')).text(),'/');
assert.match(await (await call('/qr.svg')).text(),/<svg/);
assert.equal((await call('/api/cards',{})).status,400);
for(let i=0;i<150;i++){assert.equal((await call('/api/cards',{nickname:'探索者'+i,tools:'豆包',outlook:'期待',wish:'AI 创作活动',interest:'冲！我超感兴趣'})).status,201)}
const cards=await (await call('/api/cards')).json();assert.equal(cards.length,150);assert.equal(new Set(cards.map(c=>c.id)).size,150);
assert.equal((await (await call('/api/export?format=json')).json()).count,150);
assert.match(await (await call('/api/export')).text(),/探索者149/);
assert.equal((await (await call('/healthz')).json()).ok,true);
assert.equal((await worker.fetch(new Request('https://wall.test/api/cards'),{})).status,503);
console.log('PASS: 150 submissions persist and appear in wall/export; validation, QR, form route, health and missing database.');
