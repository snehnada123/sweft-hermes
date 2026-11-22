# Options

Everything is optional and typed (`WeftOptions`). Nested groups are deep-merged with the defaults, both in `createWeft(canvas, options)` and in `weft.set(partial)`.

## Look

| option | default | notes |
|---|---|---|
| `source` | none | A URL (an image, or a video when the extension is mp4/webm/mov/m4v/ogv), `{ video: url }`, an `<img>`, `<video>`, `<canvas>` or `ImageBitmap`, a `File`/`Blob`, or `'camera'`. You can also set it later with `setSource()`. |
| `palette` | `'ember'` | A preset name (`ember`, `graphite`, `riso`, `tide`, `candy`, `night`, `phosphor`, `source`), an array of up to 16 hex colours, or `{ ink, paper }`. |
| `paper` | the preset's | The ground colour between bars and behind the subject. |
| `widenOn` | `'auto'` | `'dark'` makes bars full width on dark areas (ink on light paper). `'light'` does the opposite (light bars on dark paper). `'auto'` decides from the paper's brightness. |
| `levels` | `6` | Steps per channel for `palette: 'source'`. Use 3 to 4 for posterised, 8 or more for near-photographic. |
| `dither` | `0.55` | How often a cell takes the second-nearest colour. 0 gives flat areas, 0.8 or more gives grainy, lively shading. |
| `direction` | `'rows'` | `'rows'` or `'columns'`. |
| `fit` | `'cover'` | `'cover'` crops to fill the canvas. `'contain'` letterboxes onto paper. |
| `focus` | `'subject'` | `'subject'` centres the cut-out subject (only along axes where the frame doesn't crop it), `'frame'` keeps the picture as composed, or `[x, y]` in source uv. |
| `mirror` | `false` | Flips the picture horizontally. The camera is already mirrored. |
| `maxDpr` | `2` | Caps device pixel ratio. Row heights are fractions of the canvas, so this only changes sharpness. |

### `rows`

| option | default | notes |
|---|---|---|
| `fine` | `0.0058` | Row height at rest, as a fraction of the canvas across the bars. A 1000 px tall canvas gives about 6 px. Raise it to 0.009 to 0.012 for a chunkier, poster look. |
| `coarse` | `0.03` | Row height at full break-up. Keep it 4 to 6 times `fine`. |
| `steps` | `12` | Row height changes in this many discrete steps, which gives the digital, stepped feel. Use 4 to 6 for a harsher look and 30 or more for a smooth one. |
| `breath` | `0.12` | A faint periodic coarsening at rest (period 3.1 s). Set it to 0 for a dead-still rest. |

### `cell`

| option | default | notes |
|---|---|---|
| `aspect` | `1.35` | Cell length divided by row height. Use 2 to 4 for long dashes, and about 1 for squares. |
| `jitter` | `0.7` | How unevenly cells are cut along a row. 0 gives a regular brick wall. |
| `stripes` | `true` | Cells an edge runs through split into thin stripes, which keeps outlines crisp. |
| `fillMin` | `0.5` | The narrowest bar, as a fraction of its cell, on faint areas. Lower values make it airier and give more contrast. |

## Subject and depth

### `subject`

| option | default | notes |
|---|---|---|
| `mode` | `'auto'` | `'alpha'` uses transparency. `'backdrop'` flood-fills from the border. `'none'` keeps the full frame. `'auto'` tries them in that order. |
| `tolerance` | `0.16` | Colour distance (gamma scale, 0..1) from the median border colour that still counts as backdrop. Growth may drift to 1.6 times this through small steps. |
| `step` | `0.07` | The largest colour step between neighbouring backdrop pixels, so gradients and vignettes are followed but edges are not crossed. |
| `minArea` | `0.003` | Subject islands smaller than this fraction of the frame are dropped (grain, specks). |

### `turn`

| option | default | notes |
|---|---|---|
| `enabled` | `true` | When false, the picture stays flat and only the transition moves. |
| `yaw` | `34` | Degrees, either one number or `[left, right]`. Use about 34 for portraits and 10 to 15 for full-frame pictures. |
| `pitch` | `20` | Degrees. |
| `parallax` | `[0.2, 0.16]` | How far depth moves points for yaw and pitch (in uv per radian). Bigger values give more 3D and more risk of tearing. |
| `shade` | `1` | Lighting across the turned surface, from 0 (none) to 1. |
| `depth` | `'auto'` | `'auto'` uses a dome from the subject, or a central dome when the mode is `'none'`. `'dome'` always uses the subject. `'flat'` makes the whole picture shift together. You can also pass an image or canvas depth map, where white is near, such as the output of a depth model. |

## Motion

### `motion`

| option | default | notes |
|---|---|---|
| `pointer` | `true` | Steer with the pointer anywhere on the page, relative to the canvas: x turns, y tilts. Corners are clamped onto an ellipse. |
| `idle` | `'poses'` | What happens after the pointer rests for `idleAfter` seconds. `'poses'` drifts through `poses`, `'center'` eases back to the front, and `'hold'` keeps the last pointer pose. |
| `idleAfter` | `2.6` | Seconds before idle takes over. |
| `poses` | five poses | `[{ yaw, pitch?, hold }]` in degrees and seconds. |
| `turnTime` | `1.15` | Seconds per turn between poses. |
| `wobble` | `4` | Degrees of slow pitch drift while posing. |
| `spring` | `90` | Stiffness of the critically damped follow. Use 40 for floaty and 200 for snappy. |

### `transition`

| option | default | notes |
|---|---|---|
| `sensitivity` | `70` | Degrees per second of turning that counts as full break-up. Lower it to break up more easily. |
| `attack` | `14` | How fast the break-up rises (per second). |
| `release` | `3.2` | How fast it resolves. At 3.2 it is about 90% sharp after 0.7 s. |
| `shuffle` | `[4, 9]` | How many times per second the cells re-cut, at rest and while moving. |
| `intro` | `true` | Start broken up and resolve on load. |
| `onSource` | `true` | Break up when the source changes. |

## Page integration

| option | default | notes |
|---|---|---|
| `urlParams` | `true` | Honours `?freeze=t&yaw=&pitch=&break=` for stills (and hides `[data-weft-ui]` then). Turn it off when embedding several mosaics on a page you don't control. |
| `autoplay` | `true` | Runs its own `requestAnimationFrame` loop, which pauses offscreen and in hidden tabs. When false, call `render()` yourself. |
| `onSource` | none | Called as `(width, height)` whenever a new source's size is known. Use it to size the canvas box. |

## Methods

| method | |
|---|---|
| `setSource(input)` | Returns a promise. Stops the previous camera stream. |
| `set(partial)` | Changes options live. Re-analyses the subject if `subject` or `turn.depth` changed. |
| `kick(amount = 1)` | Breaks the bars up now. The break-up decays on its own. |
| `pose(yaw, pitch)` | Steers in code (degrees). `pose(null)` hands control back. |
| `pointer(x, y)` | Feeds a pointer position (0..1 over the canvas) from your own input, such as gyro or scroll. |
| `advance(dt, x?, y?)` | Steps a simulated clock, for frame-exact rendering. |
| `render(now?)` | Draws one frame, for when `autoplay` is false. |
| `ready()` / `loaded` | Whether the source is drawable, and a promise for the initial source. |
| `state` | `{ yaw, pitch, breakup, subject }`, live. |
| `destroy()` | Removes listeners, stops the camera and releases the GL context. |
