---
name: weft
description: Rebuild an image, video, webcam feed or canvas as an interactive scanline bar mosaic with coarse-to-fine transitions and cursor-driven depth parallax. Use for bar mosaics, risograph or line-dither portraits, cursor-turning avatars, or matching this look in a web project.
version: 1.0.0
license: MIT
metadata:
  hermes:
    category: creative
    tags: [webgl2, typescript, visual-effects, creative-coding]
---

# Weft

Any picture is redrawn as rows of short coloured bars on a paper ground. Each row is cut into jittered cells. A cell takes the palette colour nearest the picture there, sometimes dithered to the runner-up. Its bar is full width on strong areas and narrower on faint ones, and cells that an edge runs through split into thin stripes. When something moves, the rows step up to big blocks and the cells re-cut many times a second. When it rests, they step back down to fine detail. That transition is the signature of the look, so protect it.

A subject cut from a plain or transparent backdrop gets a smooth depth dome from its silhouette, so it can **turn** (yaw) and **tilt** (pitch) without stretching. Points slide sideways by their depth and light rolls across the dome. Full-frame pictures get a gentle central dome instead. The subject is kept centred in the frame automatically.

## Files

| path | what |
|---|---|
| [`assets/weft.ts`](assets/weft.ts) | The engine, one strictly typed TypeScript module with no runtime dependencies: `createWeft(canvas, options)`, `enableDrop`, `PALETTES`, and the types `WeftOptions`, `WeftConfig` and `Weft`. |
| [`assets/demo/index.html`](assets/demo/index.html) and [`assets/demo/main.ts`](assets/demo/main.ts) | Vite demo with palette, direction, camera and drag-and-drop controls. |
| [`assets/package.json`](assets/package.json) and [`assets/tsconfig.json`](assets/tsconfig.json) | Demo dependencies and strict TypeScript settings. |
| [`references/options.md`](references/options.md) | Every option, what it does and its useful range. |
| [`references/recipes.md`](references/recipes.md) | Integrations: React, hero, hover cards, scroll, slideshow, reveal, webcam, and matching a reference. |
| [`references/pitfalls.md`](references/pitfalls.md) | What went wrong building this and how to avoid it. |

| [`assets/LICENSE`](assets/LICENSE) | The original MIT copyright and permission notice to retain with copied source. |

## Hermes usage

Load this skill with `/weft` or ask Hermes to use Weft. Read `references/options.md` for exact settings, `references/recipes.md` for placement patterns, and `references/pitfalls.md` for visual or WebGL issues. The files listed above are part of the skill bundle; resolve paths relative to this `SKILL.md`, then copy from the installed skill directory using Hermes's terminal tool. Do not assume a Claude-specific path.

The engine is MIT licensed. When copying `assets/weft.ts` into a project, copy `assets/LICENSE` beside it (for example `vendor/weft/LICENSE`) and preserve its original copyright line. In a hackathon demo, identify the renderer as an open-source component and explain the work added in the submission.

## Workflow

1. **Pin down the source and the job.** What is it: a still, a video, the webcam, or a canvas the page already draws? Where does it live: a hero, a card, a full page? Which motion is wanted: cursor steering, an idle drift, a reveal, or a transition between images?
2. **Copy `assets/weft.ts` into the project** along with `assets/LICENSE`, and keep the engine whole. It needs only a bundler or `tsc`, both of which any TS project has. For a plain-JS page, compile it once with `npx tsc` or `esbuild`.
3. **Start from `assets/demo/main.ts`** or the API example below and set the options using the decisions below.
4. **Show one still first.** Freeze a pose with `?freeze=0&yaw=-20&pitch=8&break=0` and look at it before building more around it. Check the front, both turns, a tilt and a broken-up frame (`break=1`). If the user gave a reference, put a still next to a frame of it and compare palette, row height and paper colour.
5. **Then motion.** Check the transition live. The break-up lasts a fraction of a second, so step through a screen recording frame by frame rather than trusting one glance. Look for three things: the break-up is obvious when moving, every rest resolves fully sharp, and nothing stretches at the turn limits.

## Decisions

**Subject** (`subject.mode`):
- Use `'auto'` (default). A transparent PNG uses `'alpha'`. A frame whose border is mostly one colour uses `'backdrop'`, which flood-fills the backdrop from the border, follows gradients and drops stray specks. Anything else uses `'none'`.
- Force `'none'` for landscapes, artwork and screenshots, so a cream sky or paper border isn't cut away.
- If a busy background leaks into the subject, adjust `subject.tolerance` (default 0.16), or better, pass a cut-out PNG.

**Palette** (`palette`):
- Pick a preset: `ember` (warm riso, best for skin), `graphite`, `riso`, `tide`, `candy`, `night` (light bars on dark), `phosphor`, or `source` (the picture's own colours, posterised).
- You can also pass your own hex colours (up to 16) and set `paper`.
- Colours are matched nearest-first. Include a dark, a mid and a light in each hue family the picture needs, otherwise faces go flat or muddy.
- On a dark `paper`, bars widen on bright areas automatically.

**Direction**: use `'rows'` (horizontal, the classic look) or `'columns'`.

**Framing**: `focus: 'subject'` (default) centres the cut-out subject's bounding box. It only shifts along an axis where the subject isn't cropped by the frame. Use `'frame'` to keep the picture as composed.

**Motion** (`motion`, `turn`):
- `pointer: true` lets the cursor steer: x turns, y tilts. The corners are clamped onto an ellipse, so a diagonal never stacks full yaw and full pitch.
- `idle` decides what happens when the pointer rests. `'poses'` drifts through `motion.poses`, `'center'` eases back to the front, and `'hold'` stays put.
- Keep `turn.yaw` at 34� or less and `turn.pitch` at 20� or less for a flat picture. Full-frame pictures want about 10 to 15� yaw.
- Use `turn.enabled: false` for a flat mosaic whose only motion is the transition.

**Transition**:
- Turning breaks the bars up automatically. Call `weft.kick(amount)` for anything else, such as a click, scroll velocity, a slide change or a beat.
- `transition.intro` resolves from coarse on load, and `transition.onSource` does the same when the source changes.
- Keep `rows.coarse / rows.fine` around 4 to 6x.

## API at a glance

```ts
import { createWeft, enableDrop, type WeftOptions } from './weft';

const weft = createWeft(canvas, {
  source: 'portrait.png',          // URL, <img>, <video>, <canvas>, File/Blob or 'camera'
  palette: 'ember',                // or ['#1c1a27', ...], or 'source'
  direction: 'rows',
  turn: { yaw: 30, pitch: 18 },
  motion: { pointer: true, idle: 'poses' },
  onSource: (w, h) => { stage.style.aspectRatio = `${w} / ${h}`; },
});
await weft.loaded;
weft.kick(0.8);                    // break up now
weft.set({ palette: 'night' });    // live option changes, deep-merged
weft.pose(-20, 6);                 // steer in code; pose(null) hands back
weft.setSource('camera');
enableDrop(weft);                  // drop an image/video file anywhere
weft.destroy();
```

The canvas fills its CSS box, and the page owns the layout. Elements marked `data-weft-ui` are hidden in frozen stills. `weft.advance(dt, x, y)` steps a simulated clock, for frame-exact rendering.

## Rules that keep it good

- **Use the real pixels.** Never redraw, trace or "clean up" a person's photo or avatar to feed it in. The effect is the stylisation.
- **Keep the paper calm.** Cream, bone or off-white for light palettes; a near-black with a hint of colour for dark ones. Avoid pure #fff and #000.
- **The transition needs contrast in time.** Moves must be quick enough to reach the coarse end, and rests long enough (about 1 s or more) to fully resolve.
- **UI is icon-only and quiet**: in a corner at low opacity, marked `data-weft-ui`.
- **Respect `prefers-reduced-motion`.** The engine already shows a still, fine mosaic.
- **Check corners and edges**: full left, right, up, down and a diagonal before calling it done.

## Run the bundled demo

Copy the entire `assets/` directory into an ordinary project directory. Run the following commands from that copied directory:

```bash
npm install
npm run dev        # Vite
npm run typecheck  # strict tsc
```

The bundled demo creates its source artwork locally, so it does not require a hosted image. Verify image drop, palette and bar direction, camera permission, coarse-to-fine animation and the static view under reduced motion. WebGL2 is required. The demo is a renderer showcase, not a complete hackathon submission.

