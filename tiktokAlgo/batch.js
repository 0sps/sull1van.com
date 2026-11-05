const $ = id => document.getElementById(id);
const MOODS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral'];
const TERMINAL = new Set(['done', 'no-face', 'error']);
let items = [], nextId = 0, running = false, pauseRequested = false, modelState = 'loading', model;
const modelPromise = import('./assets/face.js').then(async module => {
  model = module;
  if (!await model.finderReady()) throw new Error('Face detector could not initialize. Reload to try again.');
  modelState = 'ready'; update(); return module;
}).catch(error => { modelState = 'error'; notify(error.message); update(); return null; });
function el(tag, className, text) {
  const node = document.createElement(tag); if (className) node.className = className;
  if (text !== undefined) node.textContent = text; return node;
}
function notify(message) { $('notice').textContent = message; $('notice').hidden = !message; }
function scoreOf(item) { return Math.max(-Infinity, ...item.results.filter(r => r.age >= 16).map(r => r.attractive)); }
function update() {
  const completed = items.filter(i => TERMINAL.has(i.state)).length;
  const queued = items.filter(i => i.state === 'queued').length;
  $('total').textContent = items.length;
  $('counter').textContent = `${completed} / ${items.length} processed`;
  $('progress').max = items.length || 1; $('progress').value = completed;
  $('start').disabled = running || !queued || modelState !== 'ready';
  $('start').textContent = completed ? 'Run remaining' : 'Run batch';
  $('pause').hidden = !running; $('pause').disabled = pauseRequested;
  $('pause').textContent = pauseRequested ? 'Pausing…' : 'Pause after current';
  $('clear').disabled = running || !items.length;
  $('export').disabled = !completed;
  $('allfaces').disabled = running;
  $('status').textContent = modelState === 'loading' ? 'Loading face models…' : modelState === 'error' ? 'Models unavailable · reload to retry' : running ? (pauseRequested ? 'Finishing the current photo…' : 'Analyzing photos on your device…') : !items.length ? 'Models ready · add photos to begin' : queued ? `${queued} photo${queued === 1 ? '' : 's'} ready to analyze` : 'Batch complete';
  render();
}
function render() {
  if (!items.length) {
    $('grid').replaceChildren(Object.assign(el('div', 'empty'), {innerHTML: '<span aria-hidden="true">▧</span><h3>Your comparison starts here</h3><p>Add photos or try the sample batch to see how it works.</p>'}));
    return;
  }
  let ordered = [...items];
  if ($('sort').value === 'score') ordered.sort((a,b) => scoreOf(b) - scoreOf(a) || a.id - b.id);
  if ($('sort').value === 'name') ordered.sort((a,b) => a.file.name.localeCompare(b.file.name));
  const cards = ordered.map(item => {
    if (item.card && item.renderedState === item.state) return item.card;
    const card = el('article', 'card'), photo = el('div', 'photo');
    const image = el('img'); image.src = item.url; image.alt = item.file.name; image.loading = 'lazy'; photo.append(image);
    const labels = {queued:'Queued', processing:'Analyzing…', done:'Complete', 'no-face':'No face found', error:'Could not process'};
    photo.append(el('span', `badge ${item.state}`, labels[item.state]));
    if (item.state !== 'processing') {
      const remove = el('button', 'remove', '×'); remove.setAttribute('aria-label', `Remove ${item.file.name}`);
      remove.onclick = () => { URL.revokeObjectURL(item.url); items = items.filter(i => i !== item); update(); }; photo.append(remove);
    }
    const content = el('div', 'card-content'); const name = el('h3', 'filename', item.file.name); name.title = item.file.name; content.append(name);
    if (!item.results.length) content.append(el('p', 'pending', item.error || ({queued:'Waiting to run',processing:'Detecting faces and running models…','no-face':'Try a clearer, front-facing photo.'}[item.state] || '')));
    item.results.forEach((r, index) => {
      const result = el('div', 'result');
      if (item.results.length > 1) result.append(el('p', 'face-label', `FACE ${index + 1}`));
      const line = el('div', 'score-line'), score = el('span', 'score', r.age >= 16 ? r.attractive.toFixed(1) : '—');
      if (r.age >= 16) score.append(el('small', '', '/ 10'));
      line.append(score, el('span', 'score-label', r.age >= 16 ? 'MODEL SCORE' : 'EST. AGE UNDER 16')); result.append(line);
      const meta = el('div', 'meta'); meta.append(el('span', '', `Est. age ${Math.round(r.age)}`), el('span', '', `${r.boy >= .5 ? 'Male' : 'Female'} ${Math.round(100 * Math.max(r.boy, 1-r.boy))}%`)); result.append(meta);
      const top = r.exp.indexOf(Math.max(...r.exp)), mood = el('div', 'mood'), bar = el('progress'); bar.max = 1; bar.value = r.exp[top]; bar.setAttribute('aria-label', `${MOODS[top]} probability`);
      mood.append(el('span', '', MOODS[top]), bar, el('span', '', `${Math.round(r.exp[top]*100)}%`)); result.append(mood); content.append(result);
    });
    card.append(photo, content); item.card = card; item.renderedState = item.state; return card;
  });
  $('grid').replaceChildren(...cards);
}
function add(files) {
  const messages = [];
  for (const file of files) {
    if (items.length >= 100) { messages.push('The batch limit is 100 photos.'); break; }
    if (!file.type.startsWith('image/')) { messages.push(`${file.name}: choose an image file.`); continue; }
    if (file.size > 25 * 1024 * 1024) { messages.push(`${file.name}: exceeds 25 MB.`); continue; }
    items.push({id: ++nextId, file, url: URL.createObjectURL(file), state:'queued', results:[]});
  }
  notify([...new Set(messages)].join(' ')); update();
}
async function run() {
  if (running || modelState !== 'ready') return;
  running = true; pauseRequested = false;
  const allFaces = $('allfaces').checked;
  update();
  try {
    while (!pauseRequested) {
      const item = items.find(i => i.state === 'queued'); if (!item) break;
      item.state = 'processing'; update();
      // Paint the current state before CPU-heavy inference begins.
      await new Promise(resolve => setTimeout(resolve, 40));
      let bitmap;
      try {
        bitmap = await createImageBitmap(item.file, {imageOrientation:'from-image'});
        const photo = model.makePhoto(bitmap); bitmap.close(); bitmap = null;
        const faces = await model.findFaces(photo);
        for (const face of (allFaces ? faces : faces.slice(0,1))) {
          const result = await model.scoreFace(photo, face.e, face.m);
          if (![result.age, result.boy, result.attractive, ...result.exp].every(Number.isFinite)) throw new Error('The model returned an invalid result.');
          item.results.push(result);
        }
        item.state = faces.length ? 'done' : 'no-face';
      } catch (error) {
        item.results = []; item.state = 'error'; item.error = 'Unable to decode or analyze this image. Try JPEG, PNG, or WebP.';
        console.warn('Photo processing failed', error);
      } finally { bitmap?.close(); }
      update();
    }
  } finally { running = false; pauseRequested = false; update(); }
}
function csvCell(value) {
  let text = String(value ?? '');
  // Prevent filenames from becoming spreadsheet formulas.
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"','""') + '"';
}
function exportCSV() {
  const rows = [['filename','status','face','model_score','estimated_age','model_gender','gender_confidence',...MOODS.map(m => m.toLowerCase() + '_probability')]];
  for (const item of items.filter(i => TERMINAL.has(i.state))) {
    if (!item.results.length) rows.push([item.file.name,item.state]);
    item.results.forEach((r,i) => rows.push([item.file.name,item.state,i+1,r.age >= 16 ? r.attractive.toFixed(2) : '',Math.round(r.age),r.boy >= .5 ? 'Male' : 'Female',Math.max(r.boy,1-r.boy).toFixed(4),...r.exp.map(v=>v.toFixed(4))]));
  }
  const url = URL.createObjectURL(new Blob(['\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
  const a = el('a'); a.href=url; a.download='photo-lab-results.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('files').onchange = event => { add(event.target.files); event.target.value = ''; };
const drop = $('drop');
for (const event of ['dragenter','dragover']) drop.addEventListener(event, e => {e.preventDefault();drop.classList.add('over');});
for (const event of ['dragleave','drop']) drop.addEventListener(event, e => {e.preventDefault();drop.classList.remove('over');});
drop.addEventListener('drop', e => add(e.dataTransfer.files));
// Prevent accidental navigation when a photo is dropped outside the upload panel.
window.addEventListener('dragover', e => e.preventDefault()); window.addEventListener('drop', e => e.preventDefault());
$('start').onclick = run;
$('pause').onclick = () => {pauseRequested=true; update();};
$('sort').onchange = render;
$('clear').onclick = () => { if (running) return; items.forEach(i=>URL.revokeObjectURL(i.url));items=[];notify('');update(); };
$('export').onclick = exportCSV;
$('sample').onclick = async () => {
  $('sample').disabled = true;
  try {
    const response = await fetch('./assets/sample.jpg'); if (!response.ok) throw new Error('Sample unavailable');
    const blob = await response.blob();
    add([new File([blob], 'sample-original.jpg', {type:'image/jpeg'})]);
    const bitmap = await createImageBitmap(blob);
    try {
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d'); ctx.filter = 'brightness(1.15)'; ctx.drawImage(bitmap,0,0);
      const brighter = await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));
      if (brighter) add([new File([brighter], 'sample-brighter.jpg',{type:'image/jpeg'})]);
    } finally { bitmap.close(); }
    await modelPromise; await run();
  } catch { notify('Could not load the sample batch. Try adding your own photos.'); }
  finally { $('sample').disabled=false; }
};
update();
