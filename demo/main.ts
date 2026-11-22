import { createWeft, enableDrop, PALETTES, type PaletteName } from '../src/weft';

// URL params: ?src=<url> &palette=<name> &dir=rows|columns &subject=auto|backdrop|alpha|none
// &idle=poses|center|hold &turn=0, plus the library's ?freeze=<t>&yaw=&pitch=&break=
const q = new URLSearchParams(location.search);
const stage = document.querySelector<HTMLElement>('.stage')!;
const canvas = document.querySelector('canvas')!;
const names = Object.keys(PALETTES) as PaletteName[];
const fallback = `${import.meta.env.BASE_URL}portrait.svg`;
let palette = (q.get('palette') as PaletteName) || 'ember';
let direction: 'rows' | 'columns' = q.get('dir') === 'columns' ? 'columns' : 'rows';

// match the page to the palette's paper so the picture sits on one ground
function paint() {
  const p = PALETTES[palette];
  document.body.style.setProperty('--paper', p.paper);
  const dark = parseInt(p.paper.slice(1, 3), 16) < 80;
  document.body.style.setProperty('--ink', dark ? '#f3efe6' : Array.isArray(p.ink) ? p.ink[0] : '#1c1a27');
}
paint();

const weft = createWeft(canvas, {
  source: q.get('src') || fallback,
  palette,
  direction,
  subject: { mode: (q.get('subject') as 'auto') || 'auto' },
  turn: { enabled: q.get('turn') !== '0' },
  motion: { idle: (q.get('idle') as 'poses') || 'poses' },
  onSource(w, h) {
    stage.style.aspectRatio = `${w} / ${h}`;
    stage.style.height = `min(100svh, ${(100 * h) / w}vw)`;
  },
});
enableDrop(weft);
if (q.has('debug')) Object.assign(window, { weft });

document.querySelector<HTMLButtonElement>('.palette')!.onclick = () => {
  palette = names[(names.indexOf(palette) + 1) % names.length];
  paint();
  weft.set({ palette }).kick(0.8);
};
document.querySelector<HTMLButtonElement>('.direction')!.onclick = () => {
  direction = direction === 'rows' ? 'columns' : 'rows';
  weft.set({ direction }).kick(0.8);
};
const cam = document.querySelector<HTMLButtonElement>('.cam')!;
cam.onclick = async () => {
  const on = cam.getAttribute('aria-pressed') === 'true';
  try {
    await weft.setSource(on ? q.get('src') || fallback : 'camera');
    cam.setAttribute('aria-pressed', String(!on));
  } catch (e) {
    console.error(e);
  }
};
