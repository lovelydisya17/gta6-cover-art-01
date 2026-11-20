// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone at its
// export size; ?shot=editor shows the editor with sample photos loaded.
// Query knobs: photo, photo2, layout, grade, size, title, subtitle, tagline.
// window.__shotReady is set once the scene is painted.
export async function runShot(shot, query, state, loadImage, loadFonts, redraw, pushHistory, syncControls) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('size')) state.size = query.get('size');
  if (query.get('title')) state.title = query.get('title');
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  if (query.get('tagline') !== null) state.tagline = query.get('tagline');

  const names = [query.get('photo') ?? 'pier', query.get('photo2') ?? 'boulevard'];
  const loaded = [];
  for (const name of names) {
    try { loaded.push(await loadImage(`samples/${name}.jpg`)); } catch { /* sample missing */ }
  }
  state.photos = loaded;
  state.trayPhoto = 0;
  // Spread the photos across the panels, alternating when there are two.
  state.panels.forEach((p, i) => {
    if (!loaded.length) { p.photo = -1; return; }
    p.photo = i % loaded.length;
    p.zoom = 1.15; p.ox = 0; p.oy = 0;
  });
  if (query.get('zoom')) state.panels[0].zoom = Number(query.get('zoom'));
  if (query.get('ox')) state.panels[0].ox = Number(query.get('ox'));

  await loadFonts();
  // Sync the visible controls with the scene, then paint.
  if (syncControls) syncControls();
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('tagline').value = state.tagline;
  redraw();
  if (pushHistory) pushHistory();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
