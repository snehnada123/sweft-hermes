import { createWeft, enableDrop, PALETTES, type PaletteName } from '../weft';

const params = new URLSearchParams(location.search);
const stage = document.querySelector<HTMLElement>('.stage')!;
const canvas = document.querySelector<HTMLCanvasElement>('canvas')!;
const palettes = Object.keys(PALETTES) as PaletteName[];

// Draw a bundled, local source so the demo runs without external images.
const portrait = document.createElement('canvas');
portrait.width = 720;
portrait.height = 960;
const ctx = portrait.getContext('2d')!;
ctx.fillStyle = '#ede5d2';
ctx.fillRect(0, 0, 720, 960);
ctx.fillStyle = '#6b4b78';
ctx.beginPath();
ctx.ellipse(360, 885, 310, 280, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#30293f';
ctx.beginPath();
ctx.ellipse(360, 366, 184, 244, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#d89977';
ctx.beginPath();
ctx.ellipse(360, 405, 141, 183, 0, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = '#30293f';
ctx.beginPath();
ctx.ellipse(355, 280, 151, 98, -0.18, 0, Math.PI * 2);
ctx.fill();
ctx.fillRect(222, 330, 29, 105);
ctx.fillStyle = '#493146';
for (const x of [305, 415]) {
  ctx.beginPath();
  ctx.ellipse(x, 412, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}
ctx.strokeStyle = '#9a5c58';
ctx.lineWidth = 5;
ctx.beginPath();
ctx.arc(360, 467, 34, 0.15, Math.PI - 0.15);
ctx.stroke();
ctx.fillStyle = '#bd7867';
ctx.fillRect(331, 553, 58, 70);

const originalSource = params.get('src') || portrait;
let palette = (params.get('palette') as PaletteName) || 'ember';
let direction: 'rows' | 'columns' = params.get('dir') === 'columns' ? 'columns' : 'rows';

function paint() {
  const scheme = PALETTES[palette];
  document.body.style.setProperty('--paper', scheme.paper);
  const dark = parseInt(scheme.paper.slice(1, 3), 16) < 80;
  document.body.style.setProperty('--ink', dark ? '#f3efe6' : Array.isArray(scheme.ink) ? scheme.ink[0] : '#1c1a27');
}
paint();

const weft = createWeft(canvas, {
  source: originalSource,
  palette,
  direction,
  subject: { mode: params.get('src') ? 'auto' : 'backdrop' },
  turn: { enabled: params.get('turn') !== '0' },
  motion: { idle: 'poses' },
  onSource(w, h) {
    stage.style.aspectRatio = `${w} / ${h}`;
    stage.style.height = `min(100svh, ${(100 * h) / w}vw)`;
  },
});
enableDrop(weft);

document.querySelector<HTMLButtonElement>('.palette')!.onclick = () => {
  palette = palettes[(palettes.indexOf(palette) + 1) % palettes.length];
  paint();
  weft.set({ palette }).kick(0.8);
};
document.querySelector<HTMLButtonElement>('.direction')!.onclick = () => {
  direction = direction === 'rows' ? 'columns' : 'rows';
  weft.set({ direction }).kick(0.8);
};
const camera = document.querySelector<HTMLButtonElement>('.cam')!;
camera.onclick = async () => {
  const active = camera.getAttribute('aria-pressed') === 'true';
  try {
    await weft.setSource(active ? originalSource : 'camera');
    camera.setAttribute('aria-pressed', String(!active));
  } catch (error) {
    console.error('Camera unavailable', error);
  }
};
