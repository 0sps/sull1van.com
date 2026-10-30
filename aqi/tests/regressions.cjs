const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = process.env.AQI_HTML || require('node:path').join(__dirname, '../index.html');
const source = fs.readFileSync(path, 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const elements = new Map();
function element(id='') {
  const classes = new Set();
  const e = {id, style:{setProperty(){}}, attributes:{}, children:[], textContent:'', disabled:false,
    offsetTop:58, scrollTop:0, listeners:{},
    classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)},toggle(x,b){if(b===undefined)b=!classes.has(x); b?classes.add(x):classes.delete(x); return b;}},
    setAttribute(k,v){this.attributes[k]=v}, addEventListener(k,f){this.listeners[k]=f},
    append(...xs){this.children.push(...xs)}, appendChild(x){this.children.push(x)},
    querySelector(k){return this.queries[k] ||= element(k)}, queries:{},
    contains(other){return other===this}, focus(){}, closest(){return null}
  };
  Object.defineProperty(e,'innerHTML',{set(v){this.html=v;this.children=[]},get(){return this.html||''}});
  return e;
}
const get = id => {if(!elements.has(id))elements.set(id,element(id));return elements.get(id)};
const listeners={};
const mobile = {matches:true,addEventListener(){}};
const pending=[];
const storage={};
let geo;
const ctx = vm.createContext({console, Map, Date, Math, Number, JSON, Promise,
  localStorage:{getItem(k){return storage[k] || null},setItem(k,v){storage[k]=v}},
  navigator:{geolocation:{getCurrentPosition(ok,fail){geo={ok,fail}}}},
  document:{getElementById:get,createElement:()=>element(),querySelector:get,body:element('body'),documentElement:element('html'),addEventListener(){}},
  window:{innerHeight:800,matchMedia:()=>mobile,addEventListener(k,f){listeners[k]=f},setTimeout(f){f()}},
  requestAnimationFrame:f=>f(), fetch:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))
});
vm.runInContext(source,ctx);
const run = code => vm.runInContext(code,ctx);

const data=(aqi=80,time='2026-10-30T12:00:00Z')=>({regionCode:'us',dateTime:time,indexes:[{code:'usa_epa',aqi,displayName:'US AQI'}],pollutants:[],healthRecommendations:{generalPopulation:'Current guidance'}});
const respond=(request,body)=>request.resolve({ok:true,json:async()=>body});
(async()=>{
  ctx.uk={regionCode:'gb',indexes:[{code:'gbr_defra',aqi:10,category:'Very high air pollution',color:{red:0.8,green:0.2,blue:1}}]};
  assert.equal(run('aqiSummary(uk).label'),'Very high air pollution');
  run('renderAirQuality(uk)'); assert.equal(get('.aqi-scale').style.display,'none');
  ctx.reading=data();run('renderAirQuality(reading)'); assert.equal(get('.aqi-scale').style.display,'');
  for(const [value,aqi] of [[205,201],[250,223],[404,300],[605,500]]) assert.equal(run(`liveUsAqi([{code:'o3',concentration:{value:${value}}}]).aqi`),aqi);
  console.log('PASS: native index classification and ozone boundaries');
  const p=run('useLocation({latitude:51.5,longitude:-0.1},false,"London")');
  pending.shift().reject(new Error('Offline')); await p;
  assert.equal(get('locationName').textContent,'London');assert.equal(get('aqiScore').textContent,'··');assert.equal(get('pollutants').children.length,0);
  const p2=run('useLocation({latitude:44,longitude:55})');respond(pending.shift(),data());await p2;
  geo.ok({coords:{latitude:11,longitude:22}});
  assert.equal(run('currentLocation.latitude'),44);assert.equal(pending.length,0);
  run('requestLocation()');const failedGeo=geo;
  const p3=run('useLocation({latitude:33,longitude:44})');respond(pending.shift(),data());await p3;failedGeo.fail();assert.equal(run('currentLocation.latitude'),33);
  console.log('PASS: failed selection clears readings and late GPS success/failure ignored');
  ctx.google={maps:{importLibrary:async()=>({PlaceAutocompleteElement:class {addEventListener(n,f){this[n]=f}focus(){}}})}};
  run('map={addListener(){},fitBounds(){},setZoom(){}}');await run('initPlaceSearch()');
  let release;ctx.event={placePrediction:{toPlace:()=>({fetchFields:()=>new Promise(r=>release=r),location:{lat:()=>66,lng:()=>77},formattedAddress:'Old search'})}};
  const search=run('placeSearch["gmp-select"](event)');const p4=run('useLocation({latitude:88,longitude:99})');respond(pending.shift(),data());await p4;release();await search;assert.equal(run('currentLocation.latitude'),88);
  // Failed place-details lookup must leave an existing AQI request able to finish.
  const active=run('useLocation({latitude:22,longitude:33})');ctx.event={placePrediction:{toPlace:()=>({fetchFields:async()=>{throw new Error('Details unavailable')}})}};await run('placeSearch["gmp-select"](event)');respond(pending.shift(),data());await active;assert.equal(get('refreshButton').disabled,false);
  console.log('PASS: slow search ignored and failed search preserves active fetch');
  run('pinnedPlaces=[];for(let i=0;i<21;i++){currentLocation={latitude:i,longitude:0};toggleCurrentPin()}');assert.equal(run('loadPinnedPlaces().length'),21);
  run('pinnedPlaces=pinnedPlaces.slice(0,2);currentLocation={latitude:pinnedPlaces[0].latitude,longitude:0}');ctx.reading=data(80,'2026-10-30T13:00:00Z');run('renderAirQuality(reading)');
  const refresh=run('refreshPinnedPlaces(true)');run('removePinnedPlace(pinnedPlaces[1].id)');assert.equal(get('refreshPins').disabled,true);const count=pending.length;await run('refreshPinnedPlaces(true)');assert.equal(pending.length,count);
  respond(pending.shift(),data(20,'2026-10-30T12:00:00Z'));respond(pending.shift(),data());await refresh;assert.equal(run('pinnedPlaces[0].aqi'),80);
  const fresh=run('refreshPinnedPlaces(true)');respond(pending.shift(),data(150,'2026-10-30T14:00:00Z'));await fresh;assert.equal(run('pinnedPlaces[0].aqi'),150);assert.equal(get('aqiScore').textContent,150);
  const failing=run('refreshPinnedPlaces(true)');pending.shift().reject(new Error('429'));await failing;assert.match(get('pinsSubtitle').textContent,/could not update/);assert.equal(get('refreshPins').disabled,false);
  console.log('PASS: pin persistence, refresh locking, timestamp ordering, active card sync, failure reporting');
  get('grabberZone').listeners.click();get('sheetContent').scrollTop=120;
  get('sheet').listeners.touchstart({target:get('grabberZone'),touches:[{clientY:200}],timeStamp:0});get('sheet').listeners.touchmove({touches:[{clientY:400}],timeStamp:100,preventDefault(){}});get('sheet').listeners.touchend();assert.equal(get('sheet').style.transform,'translateY(454px)');
  assert.match(source,/maxZoom: 16/);
  const tileBody=source.match(/getTileUrl: \(coord, zoom\) => \{([\s\S]*?)\n        \},/)[1];
  const tile=vm.runInContext('(coord, zoom) => {'+tileBody+'}',ctx);
  assert.equal(tile({x:0,y:0},17),null);
  assert.equal(tile({x:0,y:-1},16),null);
  assert.match(tile({x:-1,y:1},16),/heatmapTiles\/16\/65535\/1/);
  for(const color of ['#d9a62e','#df7f3e','#3aa76d','#7e3a4e','rgb(204, 51, 255)']){ctx.color=color;const fg=run('readableText(color)');const rgb=color.startsWith('#')?color.slice(1).match(/../g).map(x=>parseInt(x,16)):color.match(/[\d.]+/g).map(Number);const linear=rgb.map(v=>v/255<=.04045?v/255/12.92:((v/255+.055)/1.055)**2.4);const l=linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;assert.ok((fg==='#000'?(l+.05)/.05:1.05/(l+.05))>=4.5)}
  console.log('PASS: scrolled grabber drag, zoom limits and text contrast');
})().catch(e=>{console.error(e);process.exitCode=1});
