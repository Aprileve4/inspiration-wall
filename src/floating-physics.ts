export type Rect={x:number;y:number;w:number;h:number};
export type Floater=Rect&{id:string;vx:number;vy:number;phase:number;hit:number;angle:number};
export function overlaps(a:Rect,b:Rect,gap=10){return a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y}
export function layoutFloaters(items:{id:string;width:number;height:number}[],width:number,height:number,obstacles:Rect[]=[],previous:Floater[]=[]){
 if(!items.length)return {scale:.78,bodies:[] as Floater[]};
 let seed=items.reduce((total,i)=>total+i.id.split('').reduce((n,c)=>n+c.charCodeAt(0),0),12345);
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const usableArea=Math.max(width*height*.35,width*height-obstacles.reduce((n,o)=>n+Math.max(0,Math.min(width,o.x+o.w)-Math.max(0,o.x))*Math.max(0,Math.min(height,o.y+o.h)-Math.max(0,o.y)),0));
 const rawArea=items.reduce((n,i)=>n+(i.width+i.height*.065+10)*(i.height+i.width*.065+10),0);
 const maxScale=Math.min(.78,Math.sqrt(usableArea*.40/rawArea));
 const prior=new Map(previous.map(b=>[b.id,b]));
 // Existing cards keep their paths. A new card is spawned in genuinely free space.
 const ordered=[...items].sort((a,b)=>Number(prior.has(b.id))-Number(prior.has(a.id)));
 for(let scale=maxScale;scale>=.04;scale-=.02){
  const bodies:Floater[]=[];
  for(const item of ordered){
   const w=item.width*scale,h=item.height*scale;
   const old=prior.get(item.id);let spot:Rect|null=null;
   const clear=(r:Rect,gap=2,obstacleGap=3)=>r.x>=0&&r.y>=0&&r.x+r.w<=width&&r.y+r.h<=height&&!bodies.some(b=>overlaps(r,b,gap))&&!obstacles.some(o=>overlaps(r,o,obstacleGap));
   if(old&&Math.abs(old.w-w)<.1&&Math.abs(old.h-h)<.1&&clear(old,0,0))spot={x:old.x,y:old.y,w,h};
   for(let attempt=0;!spot&&attempt<2400;attempt++){
    const candidate={x:random()*Math.max(0,width-w),y:random()*Math.max(0,height-h),w,h};
    if(clear(candidate))spot=candidate;
   }
   if(!spot)break;
   const heading=random()*Math.PI*2;
   bodies.push({...spot,id:item.id,vx:old?.vx??Math.sign(Math.cos(heading))*(20+Math.abs(Math.cos(heading))*30),vy:old?.vy??Math.sign(Math.sin(heading))*(20+Math.abs(Math.sin(heading))*30),phase:old?.phase??random()*Math.PI*2,hit:0,angle:old?.angle??0});
  }
  if(bodies.length===items.length)return {scale,bodies};
 }
 throw Error('Floating area is too small');
}
type Oriented=Rect&{angle?:number};
function vertices(r:Oriented){const t=(r.angle||0)*Math.PI/180,c=Math.cos(t),s=Math.sin(t),x=r.x+r.w/2,y=r.y+r.h/2;return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dy])=>({x:x+dx*r.w/2*c-dy*r.h/2*s,y:y+dx*r.w/2*s+dy*r.h/2*c}))}
export function contact(a:Oriented,b:Oriented){
 const dx=a.x+a.w/2-b.x-b.w/2,dy=a.y+a.h/2-b.y-b.h/2;
 // Cheap rejection keeps 100-card walls fast before the rotated-edge test.
 if(Math.abs(dx)>(a.w+b.w)/2+(a.h+b.h)*.03||Math.abs(dy)>(a.h+b.h)/2+(a.w+b.w)*.03)return null;
 const at=(a.angle||0)*Math.PI/180,bt=(b.angle||0)*Math.PI/180;
 const ac=Math.cos(at),as=Math.sin(at),bc=Math.cos(bt),bs=Math.sin(bt);
 const axes=[[ac,as],[-as,ac],[bc,bs],[-bs,bc]];let depth=Infinity,nx=0,ny=0;
 for(const [ax,ay] of axes){
  const ra=a.w/2*Math.abs(ac*ax+as*ay)+a.h/2*Math.abs(-as*ax+ac*ay);
  const rb=b.w/2*Math.abs(bc*ax+bs*ay)+b.h/2*Math.abs(-bs*ax+bc*ay);
  const dot=dx*ax+dy*ay,overlap=ra+rb-Math.abs(dot);
  if(overlap<=.00001)return null;
  if(overlap<depth){depth=overlap;nx=dot<0?-ax:ax;ny=dot<0?-ay:ay}
 }
 return {depth,nx,ny};
}
export function stepFloaters(bodies:Floater[],width:number,height:number,dt:number,now:number,obstacles:Rect[]=[],random:()=>number=Math.random){
 const scatter=(b:Floater,nx:number,ny:number)=>{
  const angle=Math.atan2(ny,nx)+(random()-.5)*2.15,speed=52+random()*24;
  b.vx=Math.cos(angle)*speed;b.vy=Math.sin(angle)*speed;b.hit=now+180;
 };
 const fits=(b:Oriented)=>vertices(b).every(p=>p.x>=-.001&&p.y>=-.001&&p.x<=width+.001&&p.y<=height+.001);
 const steps=Math.max(1,Math.ceil(dt/.006)),tick=dt/steps;
 for(let k=0;k<steps;k++)for(const body of bodies){
  const candidate={...body,x:body.x+body.vx*tick,y:body.y+body.vy*tick,angle:Math.sin(now*.00065+body.phase)*2.8};
  const points=vertices(candidate),minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));
  if(minX<0){candidate.x-=minX;scatter(body,1,0)}else if(maxX>width){candidate.x-=maxX-width;scatter(body,-1,0)}
  if(minY<0){candidate.y-=minY;scatter(body,0,1)}else if(maxY>height){candidate.y-=maxY-height;scatter(body,0,-1)}
  // Resolve at the rotated card surface, with only a subpixel numerical epsilon.
  for(let pass=0;pass<4;pass++){
   let touched=false;
   for(const obstacle of obstacles){const hit=contact(candidate,obstacle);if(hit){candidate.x+=hit.nx*(hit.depth+.002);candidate.y+=hit.ny*(hit.depth+.002);scatter(body,hit.nx,hit.ny);touched=true}}
   for(const other of bodies){if(other===body)continue;const hit=contact(candidate,other);if(hit){candidate.x+=hit.nx*(hit.depth+.002);candidate.y+=hit.ny*(hit.depth+.002);scatter(body,hit.nx,hit.ny);scatter(other,-hit.nx,-hit.ny);touched=true}}
   if(!touched)break;
  }
  if(fits(candidate)&&!obstacles.some(o=>contact(candidate,o))&&!bodies.some(b=>b!==body&&contact(candidate,b))){body.x=candidate.x;body.y=candidate.y;body.angle=candidate.angle}
 }
}
