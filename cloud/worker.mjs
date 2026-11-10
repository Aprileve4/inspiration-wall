import site from '../site.config.js';
import {cardsCsv} from '../export.mjs';
import QRCode from 'qrcode/lib/browser.js';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store'}});
const fields='id,nickname,tools,outlook,wish,interest,color,created_at AS createdAt';
export default {async fetch(request,env){
 const url=new URL(request.url),formUrl=new URL('/join',url.origin).href;
 if(url.pathname==='/api/config')return json({formUrl,qrReady:!!env.DB,source:'d1',accessMode:'public',storageReady:!!env.DB});
 if(url.pathname==='/qr.svg')return new Response(await QRCode.toString(formUrl,{type:'svg',margin:4,errorCorrectionLevel:'M'}),{headers:{'Content-Type':'image/svg+xml','Cache-Control':'no-store'}});
 if(url.pathname.startsWith('/api/')||url.pathname==='/healthz'){
  if(!env.DB)return json({error:'数据库尚未连接，请稍后再试。'},503);
  try{
   if(url.pathname==='/api/cards'){
    if(request.method==='GET')return json((await env.DB.prepare(`SELECT ${fields} FROM cards ORDER BY created_at DESC LIMIT ${site.maxVisibleCards}`).all()).results);
    if(request.method!=='POST')return json({error:'不支持的请求方式'},405);
    if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'请从本站填卡页提交'},403);
    if(Number(request.headers.get('Content-Length'))>8192)return json({error:'卡片内容过长'},413);
    const raw=await request.text();if(new TextEncoder().encode(raw).length>8192)return json({error:'卡片内容过长'},413);
    let b;try{b=JSON.parse(raw)}catch{return json({error:'提交格式有误'},400)}
    if(!b||typeof b!=='object')return json({error:'请完整填写卡片'},400);
    for(const [key,max] of Object.entries({nickname:16,tools:160,outlook:160,wish:160,interest:30}))if(typeof b[key]!=='string'||!b[key].trim()||b[key].trim().length>max)return json({error:'每题都要填写哦，也请检查字数～'},400);
    if(!site.interestOptions.includes(b.interest))return json({error:'请选择比赛兴趣'},400);
    const card={id:crypto.randomUUID(),nickname:b.nickname.trim(),tools:b.tools.trim(),outlook:b.outlook.trim(),wish:b.wish.trim(),interest:b.interest.trim(),color:Math.floor(Math.random()*3),createdAt:Date.now()};
    await env.DB.prepare('INSERT INTO cards(id,nickname,tools,outlook,wish,interest,color,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(card.id,card.nickname,card.tools,card.outlook,card.wish,card.interest,card.color,card.createdAt).run();
    return json(card,201);
   }
   if(url.pathname==='/healthz'||url.pathname==='/api/sync-status'){await env.DB.prepare('SELECT 1').first();return json({ok:true,kind:'d1',connected:true,intervalMs:site.pollIntervalMs})}
   if(url.pathname==='/api/export'){
    const format=url.searchParams.get('format')||'csv';if(!['csv','json'].includes(format))return json({error:'格式错误'},400);
    const cards=(await env.DB.prepare(`SELECT ${fields} FROM cards ORDER BY created_at ASC`).all()).results;
    return new Response(format==='csv'?cardsCsv(cards):JSON.stringify({version:1,exportedAt:new Date().toISOString(),count:cards.length,cards}),{headers:{'Content-Type':format==='csv'?'text/csv;charset=utf-8':'application/json;charset=utf-8','Content-Disposition':`attachment; filename="inspiration-wall-answers.${format}"`,'Cache-Control':'no-store'}});
   }
   return json({error:'Not found'},404);
  }catch{return json({error:'保存或读取失败，请保留填写内容后重试。'},503)}
 }
 if(url.pathname==='/join')return env.ASSETS.fetch(new Request(new URL('/',url),request));
 return env.ASSETS.fetch(request);
}};
