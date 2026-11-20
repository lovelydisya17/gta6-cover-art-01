// Neon Coast cover renderer: draws the multi-panel poster cover onto any 2D canvas.
// All art is original: gradient skies, a striped sunset sun, a skyline silhouette,
// bold Anton title lettering with a Pacifico neon subtitle, grain and vignette.
// No Rockstar logo, artwork or font is used anywhere.

/** Colour grades: sky, wash, panel tint, title accent and subtitle neon. */
export const GRADES = {
  vice: {
    label: 'Vice Sunset', sky: ['#2b0f54', '#a4136b', '#ff5e3a', '#ffb347'],
    wash: 'rgba(255, 94, 58, 0.20)', tint: 'rgba(255, 46, 136, 0.16)',
    accent: '#ff2e88', neon: '#2de2c5', ink: '#1c0b2e', sun: ['#ffd319', '#ff2975'],
  },
  neon: {
    label: 'Neon Nights', sky: ['#0b0620', '#1c0b3d', '#5b1a6e', '#ff2e88'],
    wash: 'rgba(120, 40, 255, 0.22)', tint: 'rgba(45, 226, 197, 0.12)',
    accent: '#2de2c5', neon: '#ff5ce1', ink: '#0a0618', sun: ['#ff5ce1', '#7b2fff'],
  },
  golden: {
    label: 'Golden Hour', sky: ['#3d1c10', '#8a3b12', '#ff8c1a', '#ffd319'],
    wash: 'rgba(255, 140, 26, 0.18)', tint: 'rgba(255, 179, 71, 0.14)',
    accent: '#ff7a18', neon: '#fff3b0', ink: '#2b1206', sun: ['#fff3b0', '#ff7a18'],
  },
  dusk: {
    label: 'Miami Dusk', sky: ['#160b33', '#4b1d6e', '#b83280', '#ff7a59'],
    wash: 'rgba(184, 50, 128, 0.22)', tint: 'rgba(122, 47, 255, 0.14)',
    accent: '#ff7a59', neon: '#8affd1', ink: '#150a2e', sun: ['#ffb347', '#ff2975'],
  },
  noir: {
    label: 'Teal Noir', sky: ['#04141c', '#0a2e3d', '#0f5a5a', '#2de2c5'],
    wash: 'rgba(45, 226, 197, 0.16)', tint: 'rgba(10, 46, 61, 0.20)',
    accent: '#2de2c5', neon: '#ffb347', ink: '#031018', sun: ['#e8fff8', '#2de2c5'],
  },
};

/** Layouts: each returns panel rects as fractions of the canvas, plus title placement. */
export const LAYOUTS = {
  hero3: { label: 'Hero + 3', panels: 4, title: 'bottom',
    rects: (g) => [
      { x: 0, y: 0, w: 0.62, h: 1, rot: 0 },
      { x: 0.62 + g, y: 0, w: 0.38 - g, h: (1 - 2 * g) / 3, rot: 0 },
      { x: 0.62 + g, y: (1 + g) / 3, w: 0.38 - g, h: (1 - 2 * g) / 3, rot: 0 },
      { x: 0.62 + g, y: 2 * (1 + g) / 3, w: 0.38 - g, h: (1 - 2 * g) / 3, rot: 0 },
    ] },
  four: { label: 'Four Panel', panels: 4, title: 'bottom',
    rects: (g) => [
      { x: 0, y: 0, w: 0.5 - g / 2, h: 0.5 - g / 2, rot: 0 },
      { x: 0.5 + g / 2, y: 0, w: 0.5 - g / 2, h: 0.5 - g / 2, rot: 0 },
      { x: 0, y: 0.5 + g / 2, w: 0.5 - g / 2, h: 0.5 - g / 2, rot: 0 },
      { x: 0.5 + g / 2, y: 0.5 + g / 2, w: 0.5 - g / 2, h: 0.5 - g / 2, rot: 0 },
    ] },
  nine: { label: 'Nine Panel', panels: 9, title: 'bottom',
    rects: (g) => {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        out.push({ x: c * (1 + g) / 3, y: r * (1 + g) / 3, w: (1 - 2 * g) / 3, h: (1 - 2 * g) / 3, rot: 0 });
      return out;
    } },
  bleed: { label: 'Full Bleed', panels: 1, title: 'bottom',
    rects: () => [{ x: 0, y: 0, w: 1, h: 1, rot: 0 }] },
  tilt: { label: 'Tilted Shots', panels: 3, title: 'top',
    rects: (g) => [
      { x: 0.06, y: 0.30, w: 0.34, h: 0.52, rot: -0.07 },
      { x: 0.33, y: 0.24, w: 0.34, h: 0.58, rot: 0.02 },
      { x: 0.60, y: 0.30, w: 0.34, h: 0.52, rot: 0.07 },
    ] },
  duo: { label: 'Split Duo', panels: 2, title: 'bottom',
    rects: (g) => [
      { x: 0, y: 0, w: 0.5 - g / 2, h: 1, rot: 0 },
      { x: 0.5 + g / 2, y: 0, w: 0.5 - g / 2, h: 1, rot: 0 },
    ] },
};

/** Export sizes: the common post sizes. */
export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

let noiseCanvas = null;
/** A reusable film-grain tile, drawn with low alpha over the cover. */
function grainTile() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 160; noiseCanvas.height = 160;
  const c = noiseCanvas.getContext('2d');
  const img = c.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 155);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 28;
  }
  c.putImageData(img, 0, 0);
  return noiseCanvas;
}

/** Draws one photo cover-fitting a rect, with zoom and pan offsets in [-1, 1]. */
export function drawPhotoCover(ctx, photo, rx, ry, rw, rh, zoom, ox, oy) {
  if (!photo || !photo.naturalWidth) return;
  const base = Math.max(rw / photo.naturalWidth, rh / photo.naturalHeight);
  const s = base * Math.max(1, zoom || 1);
  const dw = photo.naturalWidth * s, dh = photo.naturalHeight * s;
  const slackX = Math.max(0, (dw - rw) / 2), slackY = Math.max(0, (dh - rh) / 2);
  ctx.drawImage(photo, rx + (rw - dw) / 2 - (ox || 0) * slackX, ry + (rh - dh) / 2 - (oy || 0) * slackY, dw, dh);
}

/** A striped synthwave sun: circle with a warm gradient and cut slats. */
export function drawSunsetSun(ctx, cx, cy, r, colors) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[1]);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // Dark slats across the lower half, the classic striped-sun look.
  ctx.fillStyle = 'rgba(24, 8, 46, 0.92)';
  const slats = 5;
  for (let i = 0; i < slats; i++) {
    const y = cy + r * (0.05 + i * 0.17);
    ctx.fillRect(cx - r - 2, y, r * 2 + 4, r * (0.02 + i * 0.022));
  }
  ctx.restore();
}

/** A dark skyline silhouette with a few lit windows along the bottom. */
function drawSkyline(ctx, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  let x = 0;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (x < w) {
    const bw = w * (0.05 + rnd() * 0.07);
    const bh = h * (0.05 + rnd() * 0.11);
    ctx.fillRect(x, h - bh, bw, bh);
    ctx.fillStyle = 'rgba(255, 211, 25, 0.75)';
    for (let k = 0; k < 4; k++) {
      if (rnd() > 0.55) ctx.fillRect(x + bw * (0.15 + rnd() * 0.6), h - bh + bh * (0.15 + rnd() * 0.6), 3, 4);
    }
    ctx.fillStyle = color;
    x += bw + w * 0.008;
  }
  ctx.restore();
}

/** Fits text to maxWidth, wrapping on spaces into at most two lines. Returns lines and size. */
function fitTitleLines(ctx, text, maxWidth, startSize, fontName) {
  let size = startSize;
  const wrap = (s) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [''];
    for (const word of words) {
      const test = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + word : word;
      ctx.font = `${s}px ${fontName}`;
      if (ctx.measureText(test).width <= maxWidth || !lines[lines.length - 1]) lines[lines.length - 1] = test;
      else lines.push(word);
      if (lines.length > 2) return null;
    }
    return lines;
  };
  while (size > 16) {
    const lines = wrap(size);
    if (lines) return { lines, size };
    size -= 4;
  }
  return { lines: [text], size };
}

/** Draws the title block: Anton title, Pacifico subtitle, tagline, badge. */
function drawTitleBlock(ctx, w, h, state, grade, place) {
  const title = (state.title || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  const tag = (state.tagline || '').trim().toUpperCase();
  const top = place === 'top';
  const bandH = h * (top ? 0.24 : 0.30);
  const bandY = top ? 0 : h - bandH;
  if (!top) {
    const scrim = ctx.createLinearGradient(0, h - bandH - h * 0.06, 0, h);
    scrim.addColorStop(0, 'rgba(10, 4, 24, 0)');
    scrim.addColorStop(1, 'rgba(10, 4, 24, 0.82)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, h - bandH - h * 0.06, w, bandH + h * 0.06);
  }
  const cx = w / 2;
  let cursorY = top ? bandY + h * 0.04 : bandY + h * 0.045;
  if (title) {
    const { lines, size } = fitTitleLines(ctx, title, w * 0.92, h * (top ? 0.095 : 0.115), 'Anton, sans-serif');
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = `${size}px Anton, sans-serif`;
    const grad = ctx.createLinearGradient(0, cursorY, 0, cursorY + size * lines.length);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#ffe9c9');
    lines.forEach((line, i) => {
      const y = cursorY + size * (i + 1) - size * 0.12;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = grade.ink; ctx.lineWidth = Math.max(3, size * 0.09);
      ctx.strokeText(line, cx, y);
      ctx.shadowColor = grade.accent; ctx.shadowBlur = size * 0.18; ctx.shadowOffsetX = size * 0.045; ctx.shadowOffsetY = size * 0.045;
      ctx.fillStyle = grad;
      ctx.fillText(line, cx, y);
      ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    });
    cursorY += size * lines.length * 1.02;
  }
  if (sub) {
    const size = h * 0.042;
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.shadowColor = grade.neon; ctx.shadowBlur = size * 0.9;
    ctx.fillStyle = grade.neon;
    ctx.fillText(sub, cx, cursorY + size * 0.9);
    ctx.shadowBlur = 0;
    cursorY += size * 1.5;
  }
  if (tag) {
    const size = Math.max(13, h * 0.016);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    const spaced = tag.split('').join(' ');
    // On a top title the panels start below the words, so the tagline goes
    // along the foot instead of colliding with them.
    const tagY = top ? h - size * 1.6 : cursorY + size;
    ctx.fillText(spaced, cx, tagY);
  }
  if (state.badge) {
    const label = '★ VICE COAST ★';
    const size = Math.max(13, h * 0.018);
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    const tw = ctx.measureText(label).width + size * 2.2;
    const bx = w - tw - w * 0.03, by = top ? h - h * 0.075 : h * 0.03;
    ctx.save();
    ctx.fillStyle = grade.accent;
    ctx.beginPath();
    ctx.roundRect(bx, by, tw, size * 2.1, size);
    ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + tw / 2, by + size * 1.08);
    ctx.restore();
  }
}

/**
 * Draws the whole cover onto ctx at W x H from state:
 * { layout, grade, photos, panels, title, subtitle, tagline, grain, sun, badge }.
 * panels[i] = { photo: index into photos or -1, zoom, ox, oy }.
 */
export function drawCover(ctx, W, H, state) {
  const grade = GRADES[state.grade] || GRADES.vice;
  const layout = LAYOUTS[state.layout] || LAYOUTS.hero3;
  const g = 0.012;
  // Sky background.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Sun and skyline behind tilted panels.
  if (state.sun && state.layout === 'tilt') {
    drawSunsetSun(ctx, W * 0.5, H * 0.20, H * 0.13, grade.sun);
    drawSkyline(ctx, W, H, 'rgba(8, 3, 20, 0.9)');
  }
  if (state.sun && state.layout === 'bleed') {
    drawSunsetSun(ctx, W * 0.78, H * 0.22, H * 0.11, grade.sun);
  }
  // Panels.
  const rects = layout.rects(g);
  const frame = '#ffffff';
  rects.forEach((r, i) => {
    const rx = r.x * W, ry = r.y * H, rw = r.w * W, rh = r.h * H;
    const panel = (state.panels && state.panels[i]) || { photo: -1, zoom: 1, ox: 0, oy: 0 };
    ctx.save();
    ctx.translate(rx + rw / 2, ry + rh / 2);
    if (r.rot) ctx.rotate(r.rot);
    ctx.translate(-rw / 2, -rh / 2);
    ctx.beginPath(); ctx.rect(0, 0, rw, rh); ctx.clip();
    const photo = panel.photo >= 0 ? state.photos[panel.photo] : null;
    if (photo) {
      drawPhotoCover(ctx, photo, 0, 0, rw, rh, panel.zoom, panel.ox, panel.oy);
      ctx.fillStyle = grade.tint;
      ctx.fillRect(0, 0, rw, rh);
    } else {
      const empty = ctx.createLinearGradient(0, 0, rw, rh);
      empty.addColorStop(0, 'rgba(255,255,255,0.10)'); empty.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = empty; ctx.fillRect(0, 0, rw, rh);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1.5, W * 0.0015);
      ctx.setLineDash([10, 8]);
      ctx.strokeRect(rw * 0.08, rh * 0.08, rw * 0.84, rh * 0.84);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `700 ${Math.max(14, W * 0.014)}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', rw / 2, rh / 2);
    }
    ctx.restore();
    // White frame around the panel.
    ctx.save();
    ctx.translate(rx + rw / 2, ry + rh / 2);
    if (r.rot) ctx.rotate(r.rot);
    ctx.translate(-rw / 2, -rh / 2);
    ctx.strokeStyle = frame; ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(0, 0, rw, rh);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, W * 0.0015);
    ctx.strokeRect(W * 0.004, W * 0.004, rw - W * 0.008, rh - W * 0.008);
    ctx.restore();
  });
  // Whole-cover warm wash.
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, W, H);
  // Title block.
  drawTitleBlock(ctx, W, H, state, grade, layout.title);
  // Grain and vignette.
  if (state.grain) {
    ctx.save(); ctx.globalAlpha = 0.5;
    const tile = grainTile();
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
  return rects;
}

/** Makes a fresh canvas of W x H with the cover drawn on it, for export. */
export function renderCoverCanvas(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  drawCover(canvas.getContext('2d'), w, h, state);
  return canvas;
}
