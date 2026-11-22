# Recipes

All recipes assume `import { createSweft } from './sweft'`, and a canvas styled to fill its box (`width:100%; height:100%; display:block`).

## Portrait that turns toward the cursor

This is the demo. The subject is cut from its backdrop, the cursor steers it, and it drifts through poses when idle.

```js
createSweft(canvas, {
  source: 'me.png',
  palette: 'ember',
  onSource: (w, h) => (stage.style.aspectRatio = `${w} / ${h}`),
});
```

A transparent PNG gives the cleanest cut. If the photo has a busy background, cut it out first with any background-removal tool. Use the real photo and never a redrawn version.

## Hero background, full frame

```js
createSweft(canvas, {
  source: 'landscape.jpg',
  subject: { mode: 'none' },
  turn: { yaw: 10, pitch: 6 },
  motion: { idle: 'center' },
  rows: { fine: 0.007 },
});
```

Put text over it on a solid chip, or use a `night`-style palette with light text. The bars are busy, and thin text sitting directly on them won't read.

## Hover cards (many on a page)

Use one mosaic per card, flat, with the transition only:

```js
for (const card of document.querySelectorAll('.card')) {
  const m = createSweft(card.querySelector('canvas'), {
    source: card.dataset.src,
    turn: { enabled: false },
    motion: { pointer: false, idle: 'center' },
    transition: { intro: false },
    urlParams: false,
  });
  card.addEventListener('pointerenter', () => m.kick(1));
}
```

Browsers cap live WebGL contexts at about 16. For larger grids, create mosaics lazily with an IntersectionObserver and `destroy()` them offscreen.

## Slideshow: break up between images

```js
const m = createSweft(canvas, { source: slides[0], turn: { enabled: false }, motion: { pointer: false, idle: 'center' } });
let i = 0;
setInterval(() => m.setSource(slides[++i % slides.length]), 4000); // onSource kick does the transition
```

For a cleaner cut, kick first and swap at the peak: `m.kick(1); setTimeout(() => m.setSource(next), 120);`.

## Scroll-driven

```js
let lastY = scrollY;
addEventListener('scroll', () => {
  m.kick(Math.min(1, Math.abs(scrollY - lastY) / 60));
  lastY = scrollY;
  const p = scrollY / (document.body.scrollHeight - innerHeight);
  m.pose(-25 + 50 * p, 0); // turn across the page
}, { passive: true });
```

## Reveal on load or on view

`transition.intro` already resolves from coarse on load. To replay it when the mosaic scrolls into view, use `new IntersectionObserver(([e]) => e.isIntersecting && m.kick(1)).observe(canvas)`.

## Webcam mirror

```js
const m = createSweft(canvas, { source: 'camera', subject: { mode: 'none' }, turn: { yaw: 12, pitch: 8 } });
```

Camera access needs a user gesture on some browsers and always needs https or localhost, so start it from a button. With a plain wall behind the person, `subject: { mode: 'backdrop' }` cuts them out live.

## Video

Pass the URL, or a `<video>` you control. It plays muted and looped. The subject is re-cut every other frame at 128², so a plain-backdrop clip turns like a still. Cross-origin video needs CORS headers, otherwise the subject analysis falls back to full frame.

## Driving it from another renderer

Pass any `<canvas>` as the source, such as a three.js render, a p5 sketch or a chart. It is re-uploaded every frame. Set `subject: { mode: 'none' }` unless the canvas has a transparent background, in which case `'alpha'` works.

## React

```jsx
function Sweft({ src, ...options }) {
  const ref = useRef(null);
  const mosaic = useRef(null);
  useEffect(() => {
    mosaic.current = createSweft(ref.current, { ...options, source: src, urlParams: false });
    return () => mosaic.current.destroy();
  }, []);
  useEffect(() => { mosaic.current?.setSource(src); }, [src]);
  return <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
```

The same pattern works in Vue (`onMounted` and `onUnmounted`) and Svelte (`onMount` with a returned cleanup).

## Matching a reference clip

1. Grab frames: one at rest (finest rows) and one at peak break-up.
2. Measure the row height at rest and at peak, as a fraction of the frame height, and set `rows.fine` and `rows.coarse` from them.
3. Sample 6 to 10 colours from the bars, not from the original picture, and pass them as the palette. Sample the gaps between bars for `paper`.
4. Compare cell length with row height to get `cell.aspect`, and note whether edges show thin stripes (`cell.stripes`).
5. Time the transition: frames from rest to peak give `attack`, and peak back to sharp gives `release`.
6. Freeze a still (`?freeze=0&yaw=0&break=0`) and place it next to the reference frame at the same size before touching motion.
