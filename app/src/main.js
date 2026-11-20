// Neon Coast Cover Studio wiring: photos, layout and grade pickers, caption editing,
// per-panel crop and position (sliders, drag, scroll), undo/redo and PNG export.
// Photos are read on this machine only and never uploaded anywhere.
import { drawCover, renderCoverCanvas, GRADES, LAYOUTS, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

/** The cover state: layout, grade, size, words, photos and one crop per panel. */
export function freshState() {
  return {
    layout: 'hero3', grade: 'vice', size: 'square',
    title: 'VICE SUNSET', subtitle: 'Neon Coast', tagline: 'EVERY SUNSET IS A GETAWAY',
    grain: true, sun: true, badge: true,
    photos: [], trayPhoto: 0, selected: 0,
    panels: Array.from({ length: 9 }, (_, i) => ({ photo: i < 2 ? i : -1, zoom: 1.15, ox: 0, oy: 0 })),
  };
}
let state = freshState();

/** Undo history: snapshots of the serialisable state (photos live outside it). */
const history = [];
let historyAt = -1;
function snapshot() {
  const { photos, ...rest } = state;
  return JSON.stringify(rest);
}
function pushHistory() {
  history.length = historyAt + 1;
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyAt = history.length - 1;
  refreshUndoButtons();
}
function applySnapshot(json) {
  const rest = JSON.parse(json);
  const photos = state.photos;
  state = { ...rest, photos };
  syncControls();
  redraw();
}
function refreshUndoButtons() {
  document.getElementById('undo').disabled = historyAt <= 0;
  document.getElementById('redo').disabled = historyAt >= history.length - 1;
}
document.getElementById('undo').addEventListener('click', () => {
  if (historyAt <= 0) return;
  historyAt -= 1; applySnapshot(history[historyAt]); refreshUndoButtons();
});
document.getElementById('redo').addEventListener('click', () => {
  if (historyAt >= history.length - 1) return;
  historyAt += 1; applySnapshot(history[historyAt]); refreshUndoButtons();
});

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Loads the vendored display fonts so canvas lettering uses them. */
async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('16px Anton'),
      document.fonts.load('16px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fall back to system fonts */ }
}

function panelCount() {
  return (LAYOUTS[state.layout] || LAYOUTS.hero3).panels;
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w; canvas.height = size.h;
  }
  drawCover(ctx, size.w, size.h, state);
  updatePanelLabel();
}

function updatePanelLabel() {
  const p = state.panels[state.selected];
  document.getElementById('panelLabel').textContent =
    `Panel ${state.selected + 1} of ${panelCount()} — ${p.photo >= 0 ? `photo ${p.photo + 1}` : 'empty'}`;
  document.getElementById('zoom').value = p.zoom;
  document.getElementById('ox').value = p.ox;
  document.getElementById('oy').value = p.oy;
}

/** Syncs every control with the state (used after a shot scene sets it up). */
export function syncControls() {  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('tagline').value = state.tagline;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('sun').checked = state.sun;
  document.getElementById('badge').checked = state.badge;
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('active', b.dataset.value === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('active', b.dataset.value === state.grade));
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('active', b.dataset.value === state.size));
  renderTray();
  updatePanelLabel();
}

/** Builds a picker of buttons from an object of { key: { label } }. */
function buildPicker(el, entries, current, onPick) {
  el.innerHTML = '';
  for (const [key, value] of Object.entries(entries)) {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.value = key; b.textContent = value.label;
    if (key === current) b.classList.add('active');
    b.addEventListener('click', () => {
      el.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      onPick(key);
    });
    el.appendChild(b);
  }
}

function renderTray() {
  const tray = document.getElementById('tray');
  tray.innerHTML = '';
  if (!state.photos.length) {
    const span = document.createElement('span');
    span.className = 'empty';
    span.textContent = 'No photos yet. Add your own or try a sample.';
    tray.appendChild(span);
    return;
  }
  state.photos.forEach((img, i) => {
    const thumb = document.createElement('img');
    thumb.src = img.src; thumb.alt = `Photo ${i + 1}`;
    thumb.title = `Photo ${i + 1}: click to pick, then "Put tray photo here"`;
    if (i === state.trayPhoto) thumb.classList.add('active');
    thumb.addEventListener('click', () => { state.trayPhoto = i; renderTray(); });
    tray.appendChild(thumb);
  });
}

/** Adds loaded images to the tray and fills empty panels with them. */
function addPhotos(images) {
  for (const img of images) {
    if (state.photos.length >= 6) break;
    state.photos.push(img);
  }
  state.trayPhoto = Math.min(state.trayPhoto, state.photos.length - 1);
  state.panels.forEach((p, i) => {
    if (p.photo < 0 && i < state.photos.length) p.photo = i;
  });
  renderTray(); redraw(); pushHistory();
}

document.getElementById('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  const images = [];
  for (const file of files) {
    try { images.push(await loadImage(URL.createObjectURL(file))); } catch { /* skip unreadable file */ }
  }
  addPhotos(images);
  status.textContent = `${images.length} photo${images.length === 1 ? '' : 's'} loaded.`;
  e.target.value = '';
});

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  img.dataset.sample = name;
  addPhotos([img]);
  status.textContent = `Sample "${name}" loaded. Add your own photos any time.`;
}
document.getElementById('samplePier').addEventListener('click', () => loadSample('pier'));
document.getElementById('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));

buildPicker(document.getElementById('layouts'), LAYOUTS, state.layout, (key) => {
  state.layout = key;
  if (state.selected >= panelCount()) state.selected = 0;
  redraw(); pushHistory();
});
buildPicker(document.getElementById('grades'), GRADES, state.grade, (key) => {
  state.grade = key; redraw(); pushHistory();
});
buildPicker(document.getElementById('sizes'), SIZES, state.size, (key) => {
  state.size = key; redraw(); pushHistory();
});

for (const [id, key] of [['title', 'title'], ['subtitle', 'subtitle'], ['tagline', 'tagline']]) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => { state[key] = input.value; redraw(); });
  input.addEventListener('change', pushHistory);
}
for (const [id, key] of [['grain', 'grain'], ['sun', 'sun'], ['badge', 'badge']]) {
  document.getElementById(id).addEventListener('change', (e) => {
    state[key] = e.target.checked; redraw(); pushHistory();
  });
}

/** Panel crop sliders for the selected panel. */
function bindPanelSlider(id, key) {
  const input = document.getElementById(id);
  input.addEventListener('input', () => {
    state.panels[state.selected][key] = Number(input.value);
    redraw();
  });
  input.addEventListener('change', pushHistory);
}
bindPanelSlider('zoom', 'zoom');
bindPanelSlider('ox', 'ox');
bindPanelSlider('oy', 'oy');

document.getElementById('assignPhoto').addEventListener('click', () => {
  if (!state.photos.length) { status.textContent = 'Add a photo first.'; return; }
  state.panels[state.selected].photo = state.trayPhoto;
  redraw(); pushHistory();
});
document.getElementById('fillAll').addEventListener('click', () => {
  if (!state.photos.length) { status.textContent = 'Add a photo first.'; return; }
  state.panels.forEach((p, i) => { p.photo = state.photos.length === 1 ? 0 : i % state.photos.length; });
  redraw(); pushHistory();
  status.textContent = 'All panels filled.';
});
document.getElementById('clearPanel').addEventListener('click', () => {
  state.panels[state.selected].photo = -1;
  redraw(); pushHistory();
});

/** Click a panel to select it; drag to pan its photo; scroll to zoom it. */
function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height),
  };
}
function panelAt(x, y) {
  const g = 0.012;
  const rects = (LAYOUTS[state.layout] || LAYOUTS.hero3).rects(g);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    const cx = (r.x + r.w / 2) * canvas.width, cy = (r.y + r.h / 2) * canvas.height;
    let dx = x - cx, dy = y - cy;
    if (r.rot) {
      const c = Math.cos(-r.rot), s = Math.sin(-r.rot);
      [dx, dy] = [dx * c - dy * s, dx * s + dy * c];
    }
    if (Math.abs(dx) <= r.w * canvas.width / 2 && Math.abs(dy) <= r.h * canvas.height / 2) return i;
  }
  return -1;
}
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const { x, y } = canvasPoint(e);
  const i = panelAt(x, y);
  if (i < 0) return;
  state.selected = i; updatePanelLabel();
  const p = state.panels[i];
  dragging = { x, y, ox: p.ox, oy: p.oy };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const { x, y } = canvasPoint(e);
  const p = state.panels[state.selected];
  p.ox = Math.max(-1, Math.min(1, dragging.ox + (x - dragging.x) / (canvas.width * 0.25)));
  p.oy = Math.max(-1, Math.min(1, dragging.oy + (y - dragging.y) / (canvas.height * 0.25)));
  redraw();
});
canvas.addEventListener('pointerup', () => { if (dragging) { dragging = null; pushHistory(); } });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[state.selected];
  p.zoom = Math.max(1, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });
canvas.addEventListener('wheel', pushHistory, { passive: true });

/** Downloads a canvas as a PNG file. */
function downloadCanvas(shotCanvas, name) {
  shotCanvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}

document.getElementById('export').addEventListener('click', async () => {
  await loadFonts();
  const size = SIZES[state.size];
  const shot = renderCoverCanvas(state, size.w, size.h);
  downloadCanvas(shot, `neon-coast-${size.w}x${size.h}.png`);
  status.textContent = `Saved neon-coast-${size.w}x${size.h}.png`;
});
document.getElementById('exportAll').addEventListener('click', async () => {
  await loadFonts();
  status.textContent = 'Exporting all 3 sizes…';
  for (const [key, size] of Object.entries(SIZES)) {
    const shot = renderCoverCanvas(state, size.w, size.h);
    downloadCanvas(shot, `neon-coast-${size.w}x${size.h}.png`);
    await new Promise((r) => setTimeout(r, 300));
  }
  status.textContent = 'Saved all 3 sizes: 1080 x 1080, 1080 x 1350, 1920 x 1080.';
});

/** Screenshot scenes: ?shot=cover draws the cover full-frame, ?shot=editor the editor. */
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, loadImage, loadFonts, redraw, pushHistory, syncControls);
} else {
  loadFonts().then(redraw);
  redraw();
  pushHistory();
}
