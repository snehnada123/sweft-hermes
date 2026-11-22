// Weft: rebuild any image, video, canvas or camera feed from rows of coloured
// bars, like threads across a loom or a risograph print. When it moves, the
// rows go coarse and break up; when it settles, they resolve back to fine
// detail. A subject cut from its backdrop can turn in 3D (yaw and pitch) by
// depth parallax, steered by the pointer or drifting through poses.
//
// One file, no dependencies, WebGL2. See ../SKILL.md and ../references/.

// --- types --------------------------------------------------------------------

export type PaletteName = 'ember' | 'graphite' | 'riso' | 'tide' | 'candy' | 'night' | 'phosphor' | 'source';
export interface Palette { ink: readonly string[] | 'source'; paper: string }
export type Source = string | { video: string } | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | Blob | 'camera';
export type DepthMap = HTMLImageElement | HTMLCanvasElement | ImageBitmap;
export interface Pose { yaw: number; pitch?: number; hold: number }

export interface WeftConfig {
  /** Preset name, an array of up to 16 hex colours, or `{ ink, paper }`. */
  palette: PaletteName | readonly string[] | Palette;
  /** Overrides the preset's paper (ground) colour. */
  paper: string | null;
  /** Where bars grow full width: on dark areas, light areas, or decided from the paper. */
  widenOn: 'dark' | 'light' | 'auto';
  /** Colour steps per channel when the palette is `'source'`. */
  levels: number;
  /** 0..1: how often a cell takes the second-nearest colour. */
  dither: number;
  direction: 'rows' | 'columns';
  fit: 'cover' | 'contain';
  /** Keep the cut-out subject centred, the frame centred, or a source uv point. */
  focus: 'subject' | 'frame' | readonly [number, number];
  mirror: boolean;
  maxDpr: number;
  rows: {
    /** Row height at rest, as a fraction of the canvas across the bars. */
    fine: number;
    /** Row height at full break-up. */
    coarse: number;
    /** Quantised steps between the two. */
    steps: number;
    /** Faint periodic coarsening while resting (0 = still). */
    breath: number;
  };
  cell: {
    /** Cell length / row height. */
    aspect: number;
    /** How unevenly cells are cut along a row. */
    jitter: number;
    /** Cells an edge runs through split into thin stripes. */
    stripes: boolean;
    /** Narrowest bar, as a fraction of its cell, on faint areas. */
    fillMin: number;
  };
  subject: {
    mode: 'auto' | 'alpha' | 'backdrop' | 'none';
    /** Colour distance from the backdrop that still counts as backdrop. */
    tolerance: number;
    /** Largest colour step between neighbouring backdrop pixels (follows gradients). */
    step: number;
    /** Drop subject islands smaller than this fraction of the frame. */
    minArea: number;
  };
  turn: {
    enabled: boolean;
    /** Degrees: one number, or `[left, right]`. */
    yaw: number | readonly [number, number];
    /** Degrees. */
    pitch: number;
    /** How far depth shifts points for yaw and pitch. */
    parallax: readonly [number, number];
    /** 0..1: lighting across the turned surface. */
    shade: number;
    depth: 'auto' | 'dome' | 'flat' | DepthMap;
  };
  motion: {
    /** Steer with the pointer: x turns, y tilts. */
    pointer: boolean;
    /** What happens when the pointer rests. */
    idle: 'poses' | 'center' | 'hold';
    /** Seconds without movement before idle takes over. */
    idleAfter: number;
    poses: readonly Pose[];
    /** Seconds per turn between poses. */
    turnTime: number;
    /** Degrees of slow pitch drift while posing. */
    wobble: number;
    /** Stiffness of the critically damped follow. */
    spring: number;
  };
  transition: {
    /** Degrees per second of turning that counts as full break-up. */
    sensitivity: number;
    attack: number;
    release: number;
    /** Cell re-cuts per second at rest and while moving. */
    shuffle: readonly [number, number];
    /** Start broken up and resolve on load. */
    intro: boolean;
    /** Break up when the source changes. */
    onSource: boolean;
  };
  /** Honour `?freeze=t&yaw=&pitch=&break=` for stills. */
  urlParams: boolean;
  /** Run its own animation loop (paused offscreen and in hidden tabs). */
  autoplay: boolean;
  /** Called with the size of each new source, e.g. to size the canvas box. */
  onSource: ((width: number, height: number) => void) | null;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends readonly unknown[] | Function | HTMLElement | null ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K] };
export type WeftOptions = DeepPartial<WeftConfig> & { source?: Source };

export interface Weft {
  /** Replace the source: an element, URL, File/Blob, or `'camera'`. */
  setSource(input: Source): Promise<Weft>;
  /** Change options live (deep-merged). */
  set(options: WeftOptions): Weft;
  /** Break the bars up now (0..1); they resolve on their own. */
  kick(amount?: number): Weft;
  /** Steer to a pose in degrees; `pose(null)` hands back to pointer/idle motion. */
  pose(yaw: number | null, pitch?: number): Weft;
  /** Feed a pointer position (0..1 over the canvas) from your own input. */
  pointer(x: number, y: number, now?: number): void;
  /** Step a simulated clock by `dt` seconds, optionally moving the pointer. */
  advance(dt: number, x?: number, y?: number): boolean;
  /** Draw one frame (when `autoplay` is off). */
  render(now?: number): boolean;
  ready(): boolean;
  /** Resolves once the initial `source` has loaded. */
  loaded: Promise<Weft>;
  readonly state: { yaw: number; pitch: number; breakup: number; subject: string };
  readonly canvas: HTMLCanvasElement;
  destroy(): void;
}

// --- presets ------------------------------------------------------------------

/** Ready-made palettes. `ink` is the bar colours, `paper` the ground. */
export const PALETTES: Record<PaletteName, Palette> = {
  // warm risograph: ink, plum, umber, teal, brick, vermilion, marigold, apricot, cream
  ember: { ink: ['#1c1a27', '#3a2a45', '#5b3424', '#2b6e68', '#a8342a', '#de5a2c', '#ef8a3a', '#f4b24e', '#f7d39a'], paper: '#f4ecdc' },
  // soft graphite on cream
  graphite: { ink: ['#141414', '#3a3a3a', '#686868', '#9a9a9a'], paper: '#f2efe8' },
  // classic riso drum set
  riso: { ink: ['#1d1f3a', '#3255a4', '#0078bf', '#00a95c', '#ff48b0', '#f15060', '#ff6c2f', '#ffe800'], paper: '#f5f1e6' },
  // cold blues and a single coral
  tide: { ink: ['#0d1b2a', '#1b3a5c', '#2c6e8f', '#5fa8b8', '#a9d6d0', '#e07a5f', '#f2cc8f'], paper: '#eef1ec' },
  // pastel cyan, pink and lemon on white
  candy: { ink: ['#2b2140', '#5b4b8a', '#4cc9f0', '#f72585', '#ff8fab', '#ffd166', '#bde0fe'], paper: '#fbf8f3' },
  // light bars on a dark ground (bars widen on bright areas)
  night: { ink: ['#2b2f4a', '#5a4b8c', '#c0436b', '#ff7a59', '#ffb454', '#ffe3a3', '#7fd6c2', '#f3efe6'], paper: '#0f0e14' },
  // phosphor green terminal
  phosphor: { ink: ['#0f3d1e', '#1f7a3a', '#39b54a', '#8ee86b', '#d8ffb0'], paper: '#050b07' },
  // keep the source's own colours, posterised
  source: { ink: 'source', paper: '#f4ecdc' },
};

const DEFAULTS: WeftConfig = {
  palette: 'ember',
  paper: null,
  widenOn: 'auto',
  levels: 6,
  dither: 0.55,
  direction: 'rows',
  fit: 'cover',
  focus: 'subject',
  mirror: false,
  maxDpr: 2,
  rows: { fine: 0.0058, coarse: 0.03, steps: 12, breath: 0.12 },
  cell: { aspect: 1.35, jitter: 0.7, stripes: true, fillMin: 0.5 },
  subject: { mode: 'auto', tolerance: 0.16, step: 0.07, minArea: 0.003 },
  turn: { enabled: true, yaw: 34, pitch: 20, parallax: [0.2, 0.16], shade: 1, depth: 'auto' },
  motion: {
    pointer: true,
    idle: 'poses',
    idleAfter: 2.6,
    poses: [
      { yaw: 0, hold: 1.6 },
      { yaw: -32, hold: 1.4 },
      { yaw: 12, hold: 1.0 },
      { yaw: 32, hold: 1.4 },
      { yaw: -16, hold: 1.0 },
    ],
    turnTime: 1.15,
    wobble: 4,
    spring: 90,
  },
  transition: { sensitivity: 70, attack: 14, release: 3.2, shuffle: [4, 9], intro: true, onSource: true },
  urlParams: true,
  autoplay: true,
  onSource: null,
};

// --- shaders ------------------------------------------------------------------

const MAXP = 16;
const VERT = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D src;
uniform sampler2D depth;   // r: depth (1 = near), g: subject mask
uniform vec2 size, srcScale, pivot, par, focus; // focus: source uv shown at the canvas centre
uniform vec4 carry;        // subject cropped at edge: left, right, top, bottom
uniform float rowH, seed, angle, pitch, bob, turnOn, shadeAmt, dither, levels;
uniform float cellAspect, jitter, stripes, fillMin;
uniform int cols, palN, widenLight;
uniform vec3 pal[${MAXP}];
uniform vec3 paper;
out vec4 color;

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float lum(vec3 c){ return dot(c, vec3(.299,.587,.114)); }
bool outside(vec2 s){ return s.x < 0. || s.x > 1. || s.y < 0. || s.y > 1.; }

// source colour seen at canvas uv; a = 0 off the subject
vec4 look(vec2 uv, float lod){
  vec2 s = (uv - .5) * srcScale + focus;
  s.y += bob;
  if (outside(s)) return vec4(0.);
  float shade = 1.;
  if (turnOn > .5) {
    // Turn: each point slides by its depth (parallax) and the subject
    // foreshortens. Find the source point landing here by fixed-point iteration.
    float sa = sin(angle), ca = cos(angle), sp = sin(pitch), cp = cos(pitch);
    vec2 X = s, q = s;
    for (int i = 0; i < 7; i++) {
      float d = texture(depth, q).r;
      q.x = pivot.x + (X.x - pivot.x - d * sa * par.x) / ca;
      q.y = pivot.y + (X.y - pivot.y + d * sp * par.y) / cp;
    }
    // where the subject is cropped by the frame, carry its edge on outwards
    if (carry.x > .5) q.x = max(q.x, .003);
    if (carry.y > .5) q.x = min(q.x, .997);
    if (carry.z > .5) q.y = max(q.y, .003);
    if (carry.w > .5) q.y = min(q.y, .997);
    s = q;
    if (outside(s)) return vec4(0.);
    float e = 1. / 128.;
    float dx = texture(depth, vec2(s.x + e, s.y)).r - texture(depth, vec2(s.x - e, s.y)).r;
    float dy = texture(depth, vec2(s.x, s.y + e)).r - texture(depth, vec2(s.x, s.y - e)).r;
    vec3 n = normalize(vec3(-dx * 6., dy * 6., 1.));
    n = vec3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca);
    n = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);
    float lit = clamp(dot(n, normalize(vec3(-.45, .25, .86))), 0., 1.);
    shade = mix(1. - .28 * shadeAmt, 1. + .06 * shadeAmt, lit);
  }
  if (texture(depth, s).g < .5) return vec4(0.);
  return vec4(textureLod(src, s, lod).rgb * shade, 1.);
}

// nearest palette colour, dithered towards the runner-up
vec3 inkFor(vec3 c, float n){
  if (palN == 0) return clamp(floor(c * levels + .5 + (n - .5) * dither * .7) / levels, 0., 1.);
  int best = 0, second = 0;
  float d1 = 1e9, d2 = 1e9;
  for (int i = 0; i < ${MAXP}; i++){
    if (i >= palN) break;
    vec3 d = (pal[i] - c) * vec3(.9, 1.2, .7);
    float dd = dot(d, d);
    if (dd < d1){ d2 = d1; second = best; d1 = dd; best = i; }
    else if (dd < d2){ d2 = dd; second = i; }
  }
  float p = dither * sqrt(d1) / (sqrt(d1) + sqrt(d2) + 1e-4);
  return n < p ? pal[second] : pal[best];
}

vec2 uvOf(float along, float across, vec2 bs, bool cl){
  vec2 u = vec2(along / bs.x, across);
  return cl ? u.yx : u;
}

void main(){
  bool cl = cols == 1;
  vec2 fc = vec2(gl_FragCoord.x, size.y - gl_FragCoord.y);
  vec2 px = cl ? fc.yx : fc;   // bar space: x along the bars, y across
  vec2 bs = cl ? size.yx : size;
  float row = floor(px.y / rowH);
  float yc = (row + .5) * rowH / bs.y;

  // jittered cells, brick-offset per row
  float cw = rowH * cellAspect;
  float shift = hash(vec2(row, seed*.13)) * cw * 3.;
  float x = px.x + shift;
  float k = floor(x / cw);
  float b0 = (k + (hash(vec2(k, row+seed)) - .5) * jitter) * cw;
  float b1 = (k + 1. + (hash(vec2(k+1., row+seed)) - .5) * jitter) * cw;
  if (x < b0) { b1 = b0; k -= 1.; b0 = (k + (hash(vec2(k, row+seed)) - .5) * jitter) * cw; }
  else if (x >= b1) { k += 1.; b0 = b1; b1 = (k + 1. + (hash(vec2(k+1., row+seed)) - .5) * jitter) * cw; }
  float w = b1 - b0;
  float lod = log2(max(1., rowH * .35 * 400. / bs.y));

  // cells an edge runs through split into thin stripes
  float n = 1.;
  if (stripes > .5) {
    vec4 l = look(uvOf(b0 + w*.18 - shift, yc, bs, cl), lod);
    vec4 r = look(uvOf(b1 - w*.18 - shift, yc, bs, cl), lod);
    vec3 dc = l.rgb - r.rgb;
    float busy = step(.06, dot(dc, dc)) + step(.5, abs(l.a - r.a));
    float stripe = max(2. * bs.y / 1000., rowH * (.12 + .1 * hash(vec2(k, row*3.1))));
    n = busy > .5 ? clamp(floor(w / stripe), 1., 10.) : 1.;
  }
  float sub = floor((x - b0) / w * n);
  float sw = w / n;
  float s0 = b0 + sub * sw;
  float fx = (x - s0) / sw;
  float id = k * 7. + sub;

  vec4 m = look(uvOf(s0 + sw*.5 - shift, yc, bs, cl), lod);
  if (m.a < .5) { color = vec4(paper, 1.); return; }

  // bar width: full where the image is strong, narrower where it fades
  float v = widenLight == 1 ? lum(m.rgb) : 1. - lum(m.rgb);
  float fill = mix(fillMin, 1., smoothstep(.2, .75, v));
  float h = hash(vec2(id, row*1.7 + floor(seed)));
  float start = (1. - fill) * h;
  bool ink = fx >= start && fx < start + fill;

  vec3 c = inkFor(m.rgb, hash(vec2(id*.71 + 3., row + floor(seed)*.37)));
  c *= 1. - .07 * (fx - .5) * step(.95, fill); // soft smear across wide bars
  color = vec4(ink ? c : paper, 1.);
}`;

// --- helpers ------------------------------------------------------------------

type RGB = [number, number, number];
type Vec2 = [number, number];
type Media = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
interface Loaded { el: Media; stream?: MediaStream; mirror?: boolean }
interface Analysis { size: number; data: Uint8Array; pivot: Vec2; carry: [number, number, number, number]; center: Vec2; mode: string }
interface Frame { angle: number; pitch: number; bob: number; rowFrac: number; seed: number }

const hex = (c: string): RGB => {
  const s = c.replace('#', '');
  const n = parseInt(s.length === 3 ? s.replace(/./g, '$&$&') : s, 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const luma = ([r, g, b]: RGB) => 0.299 * r + 0.587 * g + 0.114 * b;
const isPlain = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Element) && !(typeof ImageBitmap !== 'undefined' && v instanceof ImageBitmap);
function merge<T>(base: T, over: unknown): T {
  const out = { ...base } as Record<string, unknown>;
  if (!isPlain(over)) return out as T;
  for (const k of Object.keys(over)) {
    const b = out[k];
    const v = over[k];
    if (v === undefined) continue;
    out[k] = isPlain(b) && isPlain(v) ? merge(b, v) : v;
  }
  return out as T;
}
const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

function resolvePalette(o: WeftConfig) {
  let ink: readonly string[] | 'source';
  let paper: string | undefined;
  if (typeof o.palette === 'string') {
    const p = PALETTES[o.palette as PaletteName];
    if (!p) throw Error(`weft: unknown palette "${o.palette}"`);
    ({ ink, paper } = p);
  } else if (Array.isArray(o.palette)) ink = o.palette as readonly string[];
  else ({ ink, paper } = o.palette as Palette);
  const pv = hex(o.paper || paper || '#f4ecdc');
  const widenLight = o.widenOn === 'auto' ? luma(pv) < 0.5 : o.widenOn === 'light';
  return { ink: ink === 'source' ? [] : ink.slice(0, MAXP).map(hex), paper: pv, widenLight };
}

const dimsOf = (s: Media): Vec2 =>
  s instanceof HTMLVideoElement ? [s.videoWidth, s.videoHeight] : s instanceof HTMLImageElement ? [s.naturalWidth, s.naturalHeight] : [s.width, s.height];
const readyOf = (s: Media | undefined): boolean =>
  !s ? false : s instanceof HTMLVideoElement ? s.readyState >= 2 && s.videoWidth > 0 : s instanceof HTMLImageElement ? s.complete && s.naturalWidth > 0 : s.width > 0;
const isStill = (s: Media) => s instanceof HTMLImageElement || (typeof ImageBitmap !== 'undefined' && s instanceof ImageBitmap);

// Separable box blur with edge clamping; running sums, so cost is independent of radius.
function boxBlur(a: Float32Array, N: number, r: number): Float32Array {
  const t = new Float32Array(N * N);
  const o = new Float32Array(N * N);
  const pass = (src: Float32Array, dst: Float32Array, stride: number, step: number) => {
    for (let line = 0; line < N; line++) {
      const base = line * stride;
      const at = (i: number) => src[base + Math.min(N - 1, Math.max(0, i)) * step];
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += at(i);
      for (let i = 0; i < N; i++) {
        dst[base + i * step] = sum / (2 * r + 1);
        sum += at(i + r + 1) - at(i - r);
      }
    }
  };
  pass(a, t, N, 1); // rows
  pass(t, o, 1, N); // columns
  return o;
}

// Remove subject islands smaller than `minArea` (fraction of the frame): grain,
// cracks or noise in the backdrop that the flood fill couldn't reach.
function dropSpecks(mask: Float32Array, N: number, minArea: number) {
  const seen = new Uint8Array(N * N);
  const min = minArea * N * N;
  const stack: number[] = [];
  const comp: number[] = [];
  for (let s = 0; s < N * N; s++) {
    if (!mask[s] || seen[s]) continue;
    comp.length = 0;
    stack.push(s);
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      comp.push(i);
      const x = i % N;
      for (const j of [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, i - N, i + N])
        if (j >= 0 && j < N * N && mask[j] && !seen[j]) {
          seen[j] = 1;
          stack.push(j);
        }
    }
    if (comp.length < min) for (const i of comp) mask[i] = 0;
  }
}

// Subject mask, depth and turn centre from the source, at N×N in source uv.
function analyse(source: Media, cfg: WeftConfig, N: number, g: CanvasRenderingContext2D): Analysis {
  const out: Analysis = { size: N, data: new Uint8Array(N * N * 2), pivot: [0.5, 0.5], carry: [0, 0, 0, 0], center: [0.5, 0.5], mode: 'none' };
  if (g.canvas.width !== N || g.canvas.height !== N) {
    g.canvas.width = N;
    g.canvas.height = N;
  }
  let d: Uint8ClampedArray | null;
  try {
    g.clearRect(0, 0, N, N);
    g.drawImage(source, 0, 0, N, N);
    d = g.getImageData(0, 0, N, N).data;
  } catch {
    d = null; // cross-origin source: no pixel access, treat as full frame
  }
  const mask = new Float32Array(N * N);
  let mode: string = cfg.subject.mode;
  if (d) {
    const px8 = d;
    // compare colours on a gamma (square-root) scale so near-blacks separate as
    // well as near-whites: a dark backdrop vs a shadow is a real difference
    const px = (i: number): RGB => [Math.sqrt(px8[i * 4] / 255), Math.sqrt(px8[i * 4 + 1] / 255), Math.sqrt(px8[i * 4 + 2] / 255)];
    const dist = (a: RGB, b: RGB) => Math.sqrt(0.3 * (a[0] - b[0]) ** 2 + 0.59 * (a[1] - b[1]) ** 2 + 0.11 * (a[2] - b[2]) ** 2);
    let clear = 0;
    for (let i = 0; i < N * N; i++) if (px8[i * 4 + 3] < 128) clear++;
    // backdrop colour: median of the border
    const border: number[] = [];
    for (let x = 0; x < N; x++) border.push(x, (N - 1) * N + x);
    for (let y = 1; y < N - 1; y++) border.push(y * N, y * N + N - 1);
    const med = [0, 1, 2].map((c) => border.map((i) => px(i)[c]).sort((a, b) => a - b)[border.length >> 1]) as RGB;
    const tol = cfg.subject.tolerance;
    const uniform = border.filter((i) => dist(px(i), med) < tol).length / border.length;
    if (mode === 'auto') mode = clear > N * N * 0.01 ? 'alpha' : uniform > 0.55 ? 'backdrop' : 'none';
    if (mode === 'alpha') {
      for (let i = 0; i < N * N; i++) mask[i] = px8[i * 4 + 3] >= 128 ? 1 : 0;
    } else if (mode === 'backdrop') {
      // everything not reachable from the border through backdrop-like pixels;
      // seeds must be close to the backdrop, growth may drift further (a
      // gradient or vignette) as long as each step to a neighbour is small
      const bg = new Uint8Array(N * N);
      const ok = (i: number, from: number) =>
        px8[i * 4 + 3] < 128 ||
        (from < 0 ? dist(px(i), med) < tol : dist(px(i), med) < tol * 1.6 && dist(px(i), px(from)) < cfg.subject.step);
      const stack: number[] = [];
      for (const i of border)
        if (ok(i, -1)) {
          bg[i] = 1;
          stack.push(i);
        }
      while (stack.length) {
        const i = stack.pop()!;
        const x = i % N;
        for (const j of [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, i >= N ? i - N : -1, i < N * (N - 1) ? i + N : -1])
          if (j >= 0 && !bg[j] && ok(j, i)) {
            bg[j] = 1;
            stack.push(j);
          }
      }
      for (let i = 0; i < N * N; i++) mask[i] = bg[i] ? 0 : 1;
      dropSpecks(mask, N, cfg.subject.minArea);
    }
  } else mode = 'none';
  if (mode === 'none') mask.fill(1);
  out.mode = mode;

  // turn centre, cropped edges and framing centre
  let sx = 0;
  let sy = 0;
  let count = 0;
  for (let i = 0; i < N * N; i++)
    if (mask[i]) {
      sx += i % N;
      sy += (i / N) | 0;
      count++;
    }
  if (count) out.pivot = [(sx / count + 0.5) / N, (sy / count + 0.5) / N];
  if (mode !== 'none') {
    const edge = (f: (k: number) => number) => {
      let c = 0;
      for (let k = 0; k < N; k++) c += mask[f(k)];
      return c / N > 0.2 ? 1 : 0;
    };
    out.carry = [edge((k) => k * N), edge((k) => k * N + N - 1), edge((k) => k), edge((k) => (N - 1) * N + k)];
    // centre of the subject's bounding box, but only along an axis where it
    // isn't cropped by the frame (shifting would open a gap there)
    let x0 = N;
    let x1 = -1;
    let y0 = N;
    let y1 = -1;
    for (let i = 0; i < N * N; i++) {
      if (!mask[i]) continue;
      const x = i % N;
      const y = (i / N) | 0;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    if (x1 >= 0) {
      const [l, r, t, b] = out.carry;
      if (!l && !r) out.center[0] = (x0 + x1 + 1) / 2 / N;
      if (!t && !b) out.center[1] = (y0 + y1 + 1) / 2 / N;
    }
  }

  // depth
  const depthMode = cfg.turn.depth;
  const dep = new Float32Array(N * N);
  if (typeof depthMode === 'object') {
    g.clearRect(0, 0, N, N);
    g.drawImage(depthMode, 0, 0, N, N);
    const dd = g.getImageData(0, 0, N, N).data;
    for (let i = 0; i < N * N; i++) dep[i] = dd[i * 4] / 255;
  } else if (depthMode === 'flat') {
    dep.fill(0.5);
  } else if (mode === 'none' && depthMode !== 'dome') {
    // full frame: a soft central dome
    for (let i = 0; i < N * N; i++) {
      const x = ((i % N) + 0.5) / N - 0.5;
      const y = (((i / N) | 0) + 0.5) / N - 0.5;
      dep[i] = Math.max(0, 1 - (x * x + y * y) * 2.4) ** 0.7;
    }
  } else {
    // subject: its mask blurred wide into a smooth dome; thick parts stand out,
    // edges fall to 0, and holes (teeth, eye whites) close up
    const r = Math.max(2, Math.round(N * 0.07));
    let m: Float32Array = mask;
    for (let i = 0; i < 3; i++) m = boxBlur(m, N, r);
    for (let i = 0; i < N * N; i++) dep[i] = Math.min(1, m[i] * 1.3) ** 0.8;
  }
  for (let i = 0; i < N * N; i++) {
    out.data[i * 2] = Math.round(255 * dep[i]);
    out.data[i * 2 + 1] = mask[i] ? 255 : 0;
  }
  return out;
}

async function toSource(input: Source): Promise<Loaded> {
  if (input === 'camera') {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 960, facingMode: 'user' } });
    const v = document.createElement('video');
    Object.assign(v, { muted: true, playsInline: true, srcObject: stream });
    await v.play();
    return { el: v, stream, mirror: true };
  }
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    const url = URL.createObjectURL(input);
    return toSource(input.type.startsWith('video/') ? { video: url } : url);
  }
  if (typeof input === 'string' || 'video' in input) {
    const url = typeof input === 'string' ? input : input.video;
    const isVideo = typeof input !== 'string' || /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(url);
    if (isVideo) {
      const v = document.createElement('video');
      Object.assign(v, { muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous', src: url });
      await new Promise<void>((res, rej) => {
        v.onloadeddata = () => res();
        v.onerror = () => rej(Error(`weft: can't load ${url}`));
      });
      v.play().catch(() => {});
      return { el: v };
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    return { el: img };
  }
  if (input instanceof HTMLImageElement && !input.complete) await input.decode();
  if (input instanceof HTMLVideoElement && input.readyState < 2)
    await new Promise((r) => input.addEventListener('loadeddata', r, { once: true }));
  return { el: input as Media };
}

// --- the component --------------------------------------------------------------

/** Create a Weft on a canvas. The canvas fills its CSS box; the page owns layout. */
export function createWeft(canvas: HTMLCanvasElement, options: WeftOptions = {}): Weft {
  let o = merge(DEFAULTS, options);
  const ctx = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!ctx) throw Error('weft: WebGL2 unavailable');
  const gl = ctx;
  const prog = gl.createProgram()!;
  for (const [type, text] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, text);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s) ?? 'shader error');
    gl.attachShader(prog, s);
  }
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(prog) ?? 'link error');
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const makeTex = (unit: number, min: number) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const srcTex = makeTex(0, gl.LINEAR_MIPMAP_LINEAR);
  const depTex = makeTex(1, gl.LINEAR);
  const U: Record<string, WebGLUniformLocation | null> = {};
  for (let i = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS) - 1; i >= 0; i--) {
    const name = gl.getActiveUniform(prog, i)!.name.replace('[0]', '');
    U[name] = gl.getUniformLocation(prog, name);
  }
  gl.uniform1i(U.src, 0);
  gl.uniform1i(U.depth, 1);

  const g = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;

  function applyStyle() {
    const p = resolvePalette(o);
    const flat = new Float32Array(MAXP * 3);
    p.ink.forEach((c, i) => flat.set(c, i * 3));
    gl.uniform3fv(U.pal, flat);
    gl.uniform1i(U.palN, p.ink.length);
    gl.uniform3fv(U.paper, p.paper);
    gl.uniform1i(U.widenLight, p.widenLight ? 1 : 0);
    gl.uniform1f(U.levels, Math.max(1, o.levels - 1));
    gl.uniform1f(U.dither, o.dither);
    gl.uniform1i(U.cols, o.direction === 'columns' ? 1 : 0);
    gl.uniform1f(U.cellAspect, o.cell.aspect);
    gl.uniform1f(U.jitter, o.cell.jitter);
    gl.uniform1f(U.stripes, o.cell.stripes ? 1 : 0);
    gl.uniform1f(U.fillMin, o.cell.fillMin);
    gl.uniform2f(U.par, o.turn.parallax[0], o.turn.parallax[1]);
    gl.uniform1f(U.shadeAmt, o.turn.shade);
  }
  applyStyle();

  // --- state
  let src: Loaded | null = null;
  let info: Analysis | null = null;
  let focusNow: Vec2 | null = null;
  let uploaded: Media | null = null;
  let frameNo = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const query = new URLSearchParams(o.urlParams ? location.search : '');
  const frozen = query.get('freeze');
  const t0 = performance.now();
  let last = t0;
  let clock = t0;
  let steer = 0;
  const view = { yaw: 0, pitch: 0, vy: 0, vp: 0 };
  let prev = { yaw: 0, pitch: 0 };
  let trans = o.transition.intro ? 1 : 0;
  let boost = 0;
  let cursor: { yaw: number; pitch: number } | null = null;
  let lastMove = -1e9;
  let hold = { yaw: 0, pitch: 0 };
  let visible = true;
  let raf = 0;
  let destroyed = false;
  let manual: { yaw: number; pitch: number } | null = null;
  const state = { yaw: 0, pitch: 0, breakup: trans, subject: 'none' };

  const yawRange = (): Vec2 => (typeof o.turn.yaw === 'number' ? [o.turn.yaw, o.turn.yaw] : [o.turn.yaw[0], o.turn.yaw[1]]);
  const cycle = () => o.motion.poses.reduce((s, p) => s + p.hold + o.motion.turnTime, 0);
  function timeline(t: number) {
    const P = o.motion.poses;
    const T = o.motion.turnTime;
    if (!P.length) return { yaw: 0, pitch: 0, speed: 0 };
    let u = ((t % cycle()) + cycle()) % cycle();
    for (let i = 0; i < P.length; i++) {
      const a = P[i];
      const b = P[(i + 1) % P.length];
      if (u < a.hold) return { yaw: a.yaw, pitch: a.pitch ?? 0, speed: 0 };
      u -= a.hold;
      if (u < T) {
        const x = ease(u / T);
        const dy = b.yaw - a.yaw;
        const dp = (b.pitch ?? 0) - (a.pitch ?? 0);
        const speed = Math.sin(Math.PI * (u / T)) * Math.min(1, Math.hypot(dy, dp) / 40);
        return { yaw: a.yaw + dy * x, pitch: (a.pitch ?? 0) + dp * x, speed };
      }
      u -= T;
    }
    return { yaw: 0, pitch: 0, speed: 0 };
  }
  function rowFor(e: number, t: number) {
    const { fine, coarse, steps, breath } = o.rows;
    const b = breath * (0.5 - 0.5 * Math.cos((t / 3.1) * Math.PI * 2));
    const x = Math.min(1, e * 1.15 + b);
    return fine * (coarse / fine) ** (Math.round(x * steps) / steps);
  }

  // pointer: x, y over the canvas, 0..1
  function setPointer(x: number, y: number, now = clock) {
    x = Math.min(1, Math.max(0, x));
    y = Math.min(1, Math.max(0, y));
    // full turn and full tilt together is too much for a flat picture: pull the
    // corners onto an ellipse (a strong diagonal, not both maxed)
    let u = x * 2 - 1;
    let v = (0.5 - y) * 2;
    const r = Math.hypot(u, v);
    if (r > 1) {
      u /= r;
      v /= r;
    }
    const [left, right] = yawRange();
    cursor = { yaw: (u < 0 ? left : right) * u, pitch: v * o.turn.pitch };
    hold = cursor;
    lastMove = now;
  }
  const onMove = (e: PointerEvent) => {
    if (!o.motion.pointer) return;
    const b = canvas.getBoundingClientRect();
    setPointer((e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height, performance.now());
  };
  const onLeave = () => {
    lastMove = -1e9;
  };
  addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(([e]) => (visible = e.isIntersecting)) : null;
  io?.observe(canvas);

  function setInfo(a: Analysis) {
    info = a;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, depTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, a.size, a.size, 0, gl.RG, gl.UNSIGNED_BYTE, a.data);
  }

  function draw(p: Frame) {
    if (!src) return;
    const dpr = Math.min(devicePixelRatio || 1, o.maxDpr);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (!w || !h) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    const el = src.el;
    if (el !== uploaded || !isStill(el)) {
      uploaded = el;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, srcTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, el);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    // live sources: re-cut the subject every couple of frames
    if (!info || (!isStill(el) && frameNo % 2 === 0)) setInfo(analyse(el, o, isStill(el) ? 256 : 128, g));
    frameNo++;
    const a = info!;
    const [sw, sh] = dimsOf(el);
    const ca = w / h;
    const sa = sw / sh;
    const contain = o.fit === 'contain';
    const sx = ca > sa ? (contain ? ca / sa : 1) : contain ? 1 : ca / sa;
    const sy = ca > sa ? (contain ? 1 : sa / ca) : contain ? sa / ca : 1;
    const mirror = o.mirror !== !!src.mirror;
    gl.uniform2f(U.size, w, h);
    gl.uniform2f(U.srcScale, mirror ? -sx : sx, sy);
    gl.uniform1f(U.rowH, Math.max(2, Math.round(p.rowFrac * (o.direction === 'columns' ? w : h))));
    gl.uniform1f(U.seed, p.seed);
    gl.uniform1f(U.angle, p.angle);
    gl.uniform1f(U.pitch, p.pitch);
    gl.uniform1f(U.bob, p.bob);
    gl.uniform1f(U.turnOn, o.turn.enabled ? 1 : 0);
    gl.uniform2f(U.pivot, a.pivot[0], a.pivot[1]);
    gl.uniform4f(U.carry, a.carry[0], a.carry[1], a.carry[2], a.carry[3]);
    // keep the subject centred; live sources glide rather than jump
    const want: Vec2 = o.focus === 'subject' ? a.center : o.focus === 'frame' ? [0.5, 0.5] : [o.focus[0], o.focus[1]];
    const k = isStill(el) || !focusNow ? 1 : 0.12;
    const f: Vec2 = focusNow ? [focusNow[0] + (want[0] - focusNow[0]) * k, focusNow[1] + (want[1] - focusNow[1]) * k] : want;
    focusNow = f;
    gl.uniform2f(U.focus, f[0], f[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function tick(now: number) {
    if (!src || !readyOf(src.el)) return false;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const t = frozen !== null ? Number(frozen) : (now - t0) / 1000;
    let yaw: number;
    let pitch: number;
    let speed: number;
    if (frozen !== null) {
      ({ yaw, pitch, speed } = timeline(t));
      if (query.get('yaw') !== null) yaw = Number(query.get('yaw'));
      if (query.get('pitch') !== null) pitch = Number(query.get('pitch'));
      if (query.get('break') !== null) speed = Number(query.get('break'));
    } else if (reduce.matches) {
      yaw = 0;
      pitch = 0;
      speed = 0;
    } else {
      const idle = o.motion.idle;
      const auto = idle === 'poses' ? timeline(t) : { yaw: 0, pitch: 0, speed: 0 };
      if (idle === 'poses') auto.pitch += o.motion.wobble * Math.sin(t * 0.7);
      if (idle === 'hold') Object.assign(auto, { yaw: hold.yaw, pitch: hold.pitch });
      const active = !!manual || (!!cursor && now - lastMove < o.motion.idleAfter * 1000);
      const target = manual || cursor || auto;
      steer += ((active ? 1 : 0) - steer) * Math.min(1, dt * (active ? 6 : 1.2));
      const ty = auto.yaw + (target.yaw - auto.yaw) * steer;
      const tp = auto.pitch * (1 - steer) + target.pitch * steer;
      // critically damped spring: glides after the target rather than snapping
      const k = o.motion.spring;
      const c = 2 * Math.sqrt(k);
      view.vy += (k * (ty - view.yaw) - c * view.vy) * dt;
      view.vp += (k * (tp - view.pitch) - c * view.vp) * dt;
      view.yaw += view.vy * dt;
      view.pitch += view.vp * dt;
      yaw = view.yaw;
      pitch = view.pitch;
      const moved = Math.hypot(yaw - prev.yaw, pitch - prev.pitch) / Math.max(dt, 1e-3);
      speed = Math.max(auto.speed * (1 - steer), Math.min(1, moved / o.transition.sensitivity) * steer);
    }
    prev = { yaw, pitch };
    boost *= Math.exp(-dt * 2.5);
    speed = Math.max(speed, boost);
    if (!o.turn.enabled) {
      yaw = 0;
      pitch = 0;
    }
    const dtt = frozen !== null ? 1 : dt;
    const { attack, release, shuffle } = o.transition;
    trans += (speed - trans) * Math.min(1, dtt * (speed > trans ? attack : release));
    const still = reduce.matches;
    draw({
      angle: (yaw * Math.PI) / 180,
      pitch: (pitch * Math.PI) / 180,
      bob: o.direction === 'rows' ? -0.006 * trans : 0,
      rowFrac: still ? o.rows.fine * 1.3 : rowFor(trans, t),
      seed: still ? 1 : Math.floor(t * (trans > 0.05 ? shuffle[1] : shuffle[0])),
    });
    state.yaw = yaw;
    state.pitch = pitch;
    state.breakup = trans;
    return true;
  }

  const loop = (now: number) => {
    if (destroyed) return;
    raf = requestAnimationFrame(loop);
    if (visible && !document.hidden) tick(now);
    else last = now;
  };

  async function setSource(input: Source): Promise<Weft> {
    const next = await toSource(input);
    if (src?.stream && src.stream !== next.stream) for (const tr of src.stream.getTracks()) tr.stop();
    src = next;
    info = null;
    uploaded = null;
    focusNow = null;
    if (isStill(next.el)) setInfo(analyse(next.el, o, 256, g));
    state.subject = info ? (info as Analysis).mode : 'auto';
    if (o.transition.onSource) boost = Math.max(boost, 0.9);
    const [w, h] = dimsOf(next.el);
    o.onSource?.(w, h);
    return api;
  }

  const api: Weft = {
    setSource,
    set(next) {
      o = merge(o, next);
      applyStyle();
      if (src && (next.subject || next.turn?.depth)) setInfo(analyse(src.el, o, isStill(src.el) ? 256 : 128, g));
      return api;
    },
    kick(amount = 1) {
      boost = Math.max(boost, amount);
      return api;
    },
    pose(yaw, pitch = 0) {
      manual = yaw == null ? null : { yaw, pitch };
      return api;
    },
    pointer: setPointer,
    advance(dt, x, y) {
      clock += dt * 1000;
      if (x != null && y != null) setPointer(x, y, clock);
      return tick(clock);
    },
    render(now = performance.now()) {
      return tick(now);
    },
    ready: () => !!src && readyOf(src.el) && !!info,
    loaded: Promise.resolve(null as unknown as Weft),
    state,
    canvas,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      io?.disconnect();
      if (src?.stream) for (const tr of src.stream.getTracks()) tr.stop();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };

  if (frozen !== null) for (const el of document.querySelectorAll<HTMLElement>('[data-weft-ui]')) el.style.setProperty('display', 'none', 'important');
  if (o.autoplay) raf = requestAnimationFrame(loop);
  const initial = (options as WeftOptions).source;
  api.loaded = initial ? setSource(initial) : Promise.resolve(api);
  return api;
}

/** Let people drop an image or video file anywhere on `target` to use it. */
export function enableDrop(weft: Weft, target: EventTarget = window): () => void {
  const over = (e: Event) => e.preventDefault();
  const drop = (e: Event) => {
    e.preventDefault();
    const file = (e as DragEvent).dataTransfer?.files?.[0];
    if (file && /^(image|video)\//.test(file.type)) weft.setSource(file);
  };
  target.addEventListener('dragover', over);
  target.addEventListener('drop', drop);
  return () => {
    target.removeEventListener('dragover', over);
    target.removeEventListener('drop', drop);
  };
}
