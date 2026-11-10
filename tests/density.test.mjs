import assert from 'node:assert/strict';
import {layoutFloaters,stepFloaters,contact} from '../src/floating-physics.ts';
let seed=21;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
for(const [width,height,count] of [[1920,1080,150],[1440,900,150]]){
 const obstacles=[{x:width-157,y:height-230,w:143,h:216}];
 const items=Array.from({length:count},(_,i)=>({id:`density-${i}`,width:174,height:190+(i%5)*25}));
 const world=layoutFloaters(items,width,height,obstacles);const travelled=Array(count).fill(0);let edgeResponses=0;
 const started=performance.now();
 for(let frame=0;frame<1200;frame++){
  const old=world.bodies.map(b=>({x:b.x,y:b.y}));stepFloaters(world.bodies,width,height,1/60,frame*1000/60,obstacles,random);
  world.bodies.forEach((b,i)=>{const dy=b.y-old[i].y;travelled[i]+=Math.hypot(b.x-old[i].x,dy);const angle=b.angle*Math.PI/180,ex=(b.w*Math.abs(Math.cos(angle))+b.h*Math.abs(Math.sin(angle)))/2,ey=(b.w*Math.abs(Math.sin(angle))+b.h*Math.abs(Math.cos(angle)))/2,cx=b.x+b.w/2,cy=b.y+b.h/2;assert(cx-ex>=-.01&&cx+ex<=width+.01&&cy-ey>=-.01&&cy+ey<=height+.01,'card crossed viewport edge');if(b.hit>frame*1000/60)edgeResponses++});
  if(frame%30===0)world.bodies.forEach((b,i)=>{assert(!obstacles.some(o=>contact(b,o)));for(let j=i+1;j<count;j++)assert(!contact(b,world.bodies[j]),'cards overlap')});
 }
 assert(travelled.every(d=>d>100));console.log(`${width}x${height}: ${count} simultaneous cards, width ${(174*world.scale).toFixed(0)}px; no overlaps, all moving; ${(performance.now()-started).toFixed(0)}ms for 1200 frames; contact responses ${edgeResponses}`);
}
{
 const b={id:'edge',x:100,y:589.8,w:80,h:110,angle:0,phase:0,vx:20,vy:50,hit:0};
 stepFloaters([b],1000,700,.1,1,[],random);assert(b.y+b.h<=700.01,'must stay fully visible');assert(b.vy<0,'bottom boundary must reflect inward');console.log('Viewport edge reflection verified; cards never wrap or disappear.');
}
