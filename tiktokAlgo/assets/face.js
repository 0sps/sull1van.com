// Finds a face, crops it the way TikTok does, and runs the two decoded networks. No page code in here.
import './engine.js';
const BASE=new URL('./',import.meta.url).href;
export const EXP={S:256,E:[126.63,75.15],M:[127.65,179.75]};
export const AGE={S:224,E:[111.92,75.01],M:[112.63,148.25]};
const MAX_SIDE=2800;
const CONF={det:.5,pres:.6};
const MAX_FACES=6;
let En=null,An=null,finder=null;

async function net(name){
  const [spec,bin]=await Promise.all([fetch(BASE+name+'.json').then(r=>r.json()),fetch(BASE+name+'.bin').then(r=>r.arrayBuffer())]);
  return new self.FaceNet.Net(spec,bin);
}
async function loadFinder(){
  try{
    const {FaceLandmarker}=await import('./runtime/vision_bundle.js');
    finder=await FaceLandmarker.createFromOptions(
      {wasmLoaderPath:BASE+'runtime/vision_wasm_internal.js',wasmBinaryPath:BASE+'runtime/vision_wasm_internal.wasm'},
      {baseOptions:{modelAssetPath:BASE+'runtime/face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:MAX_FACES,minFaceDetectionConfidence:CONF.det,minFacePresenceConfidence:CONF.pres,minTrackingConfidence:CONF.pres});
  }catch(err){finder=null;console.warn('Face finder unavailable',err);}
}
export const ready=(async()=>{[En,An]=await Promise.all([net('expnet'),net('agenet')]);await loadFinder();})();

export function makePhoto(img){
  const w=img.width||img.naturalWidth,h=img.height||img.naturalHeight,k=Math.min(1,MAX_SIDE/Math.max(w,h));
  const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  return {c,w:c.width,h:c.height,mips:[c]};
}
function mip(p,level){
  while(p.mips.length<=level){
    const a=p.mips[p.mips.length-1],b=document.createElement('canvas');b.width=Math.max(1,a.width>>1);b.height=Math.max(1,a.height>>1);
    const x=b.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(a,0,0,b.width,b.height);p.mips.push(b);
  }
  return p.mips[level];
}
// Similarity transform that puts the eye midpoint and mouth midpoint on the template.
export function transform(t,e,m){
  const dx=m[0]-e[0],dy=m[1]-e[1],Dx=t.M[0]-t.E[0],Dy=t.M[1]-t.E[1],n=dx*dx+dy*dy,re=(Dx*dx+Dy*dy)/n,im=(Dy*dx-Dx*dy)/n;
  return {re,im,tx:t.E[0]-(re*e[0]-im*e[1]),ty:t.E[1]-(im*e[0]+re*e[1])};
}
export function drawCrop(ctx,S,t,p,e,m,k=1){
  const f=transform(t,e,m);let s=Math.hypot(f.re,f.im)*k,level=0;
  while(s<.25&&level<6){s*=2;level++;}
  const src=mip(p,level),scale=p.w/src.width,re=f.re*scale,im=f.im*scale,h=.5/k;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,S,S);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';
  ctx.setTransform(re*k,im*k,-im*k,re*k,(f.tx+h-(re-im)*h)*k,(f.ty+h-(im+re)*h)*k);ctx.drawImage(src,0,0);ctx.setTransform(1,0,0,1,0,0);
}
function tensor(t,p,e,m){
  const c=document.createElement('canvas');c.width=c.height=t.S;const x=c.getContext('2d',{willReadFrequently:true});drawCrop(x,t.S,t,p,e,m);
  const d=x.getImageData(0,0,t.S,t.S).data,o=new Int16Array(t.S*t.S*3);
  for(let i=0;i<t.S*t.S;i++){o[i*3]=d[i*4+2]-128;o[i*3+1]=d[i*4+1]-128;o[i*3+2]=d[i*4]-128;}
  return o;
}
const pause=()=>new Promise(r=>setTimeout(r,10));
export async function scoreFace(p,e,m){
  await ready;await pause();
  const a=self.FaceNet.expScores(En.run(tensor(EXP,p,e,m)));await pause();
  const b=self.FaceNet.ageScores(An.run(tensor(AGE,p,e,m)));
  return {...a,...b};
}
export const finderReady=async()=>{await ready;return !!finder;};
function faceFrom(L,w,h){
  const P=i=>[L[i].x*w,L[i].y*h],mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],l=mid(P(33),P(133)),r=mid(P(362),P(263)),e=mid(l,r),m=mid(P(61),P(291));
  return {e,m,eyes:Math.hypot(r[0]-l[0],r[1]-l[1]),span:Math.hypot(m[0]-e[0],m[1]-e[1])};
}
const believable=f=>f.span>=8&&f.eyes/f.span>.35&&f.eyes/f.span<1.9;
function look(p,sx,sy,sw,sh,deg,pad=1){
  const k=Math.min(1280/(Math.max(sw,sh)*pad),4),T=document.createElement('canvas'),w=Math.round(sw*k),h=Math.round(sh*k),rad=deg*Math.PI/180;
  const W=deg?Math.ceil(Math.abs(w*Math.cos(rad))+Math.abs(h*Math.sin(rad))):Math.round(w*pad),H=deg?Math.ceil(Math.abs(w*Math.sin(rad))+Math.abs(h*Math.cos(rad))):Math.round(h*pad);
  T.width=W;T.height=H;const x=T.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,W,H);x.imageSmoothingQuality='high';x.translate(W/2,H/2);x.rotate(rad);x.drawImage(p.c,sx,sy,sw,sh,-w/2,-h/2,w,h);
  const back=a=>{const dx=a[0]-W/2,dy=a[1]-H/2,c=Math.cos(-rad),s=Math.sin(-rad);return [(c*dx-s*dy+w/2)/k+sx,(s*dx+c*dy+h/2)/k+sy];};
  return finder.detect(T).faceLandmarks.map(L=>faceFrom(L,W,H)).map(f=>({e:back(f.e),m:back(f.m),eyes:f.eyes/k,span:f.span/k})).filter(believable).sort((a,b)=>b.span-a.span);
}
// A real face turns up again, in the right place, once it's cropped and aligned. Most false hits don't.
function confirmed(p,f){
  const k=1.5,S=256*k,c=document.createElement('canvas');c.width=c.height=S;drawCrop(c.getContext('2d'),S,EXP,p,f.e,f.m,k);
  return finder.detect(c).faceLandmarks.map(L=>faceFrom(L,S,S)).some(g=>Math.hypot(g.e[0]-EXP.E[0]*k,g.e[1]-EXP.E[1]*k)<S*.12&&Math.hypot(g.m[0]-EXP.M[0]*k,g.m[1]-EXP.M[1]*k)<S*.12);
}
const real=(p,list)=>list.filter(f=>confirmed(p,f));
// Tries the whole photo, then a padded view for close-ups, then tilted views.
export async function findFaces(p){
  await ready;if(!finder)return [];
  const {w,h}=p;
  let hit=real(p,look(p,0,0,w,h,0));if(hit.length)return hit;
  await pause();hit=real(p,look(p,0,0,w,h,0,1.7));if(hit.length)return hit;
  for(const deg of [-30,30,-60,60,-90,90]){await pause();hit=real(p,look(p,0,0,w,h,deg));if(hit.length)return hit;}
  return [];
}
// Only runs once a real face is found: tighter windows pick up the smaller people around it. Run on anything else
// this finds cartoon faces in game screenshots, so it never decides whether a photo has a face.
export async function moreFaces(p,known){
  const {w,h}=p,found=[...known];
  for(const f of [.7,.45,.28]){
    const sw=Math.round(Math.min(w,h)*f),step=Math.round(sw*.6),xs=[],ys=[];
    for(let x=0;x<=w-sw;x+=step)xs.push(x);if(xs[xs.length-1]!==w-sw)xs.push(w-sw);
    for(let y=0;y<=h-sw;y+=step)ys.push(y);if(ys[ys.length-1]!==h-sw)ys.push(h-sw);
    for(const x of xs)for(const y of ys){await pause();for(const g of real(p,look(p,x,y,sw,sw,0)))if(!found.some(o=>Math.hypot(o.e[0]-g.e[0],o.e[1]-g.e[1])<o.span))found.push(g);}
  }
  return found.slice(0,MAX_FACES);
}
// After a manual crop: find the face inside it and return its exact eyes and mouth, so the crop only has to be rough
// and tilt fixes itself. Returns null when there's no face, so a crop of anything else can't be scored.
export async function snapInCrop(p,e,m){
  await ready;if(!finder)return null;
  const c=document.createElement('canvas');c.width=c.height=1024;drawCrop(c.getContext('2d'),1024,EXP,p,e,m,4);
  const q={c,w:1024,h:1024};
  for(const deg of [0,-30,30,-60,60,-90,90]){
    const hit=look(q,0,0,1024,1024,deg)[0];
    if(hit){const f=transform(EXP,e,m),n=f.re*f.re+f.im*f.im,back=a=>{const x=a[0]/4-f.tx,y=a[1]/4-f.ty;return [(f.re*x+f.im*y)/n,(-f.im*x+f.re*y)/n];},r={e:back(hit.e),m:back(hit.m)};if(confirmed(p,r))return r;}
    await pause();
  }
  return null;
}
