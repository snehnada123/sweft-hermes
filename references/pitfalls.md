# Pitfalls

These are lessons from building this effect. Each one cost an iteration.

**Fitting the palette by brightness instead of nearest colour.** Mapping luminance onto a palette ramp made faces too dark or washed out, depending on the picture. Matching each cell to the nearest palette colour (weighted toward green, the channel the eye is most sensitive to) and dithering toward the runner-up keeps skin, hair and clothes distinct.

**A cold or unrelated palette on a face reads as creepy.** Skin needs a warm ramp: umber, brick, vermilion, apricot and cream. Cool colours belong in shadows, through dithering. If a palette must be cold, use `source` or keep one warm accent.

**Wrapping the picture on a cylinder to turn it.** This stretches the side views badly. Depth parallax (points slide by depth over a dome built from the silhouette) keeps the features intact, because nothing is resampled across the width.

**Testing each pixel against "the backdrop at the top of its column".** This failed where a hair spike touched the top edge: that column's backdrop read as hair, and the skin below vanished as a vertical cut. Flood-filling the backdrop from the whole border fixes it.

**Measuring colour distance in linear RGB.** Near-blacks all look alike in linear RGB, so a dark backdrop flooded into dark hair and shadows. Compare on a gamma (square-root) scale, and drop small leftover islands (`subject.minArea`).

**Maxing yaw and pitch together in a corner.** A flat picture can't take both. Clamp the cursor onto an ellipse, so a diagonal is strong but never both at full.

**A subject cropped by the frame lifts off when tilted.** If the mask touches an edge, carry the last row or column outward (`carry` in the shader) instead of showing paper there.

**A weak transition at quick cursor speeds.** Measuring raw cursor speed made fast flicks barely coarsen. Drive the break-up from the turn's angular speed after the spring, normalised by `sensitivity`, with a fast attack and a slower release.

**A holographic or foil sheen on top.** It looked cheap and was rejected. The bars carry the look, so don't add effects over them.

**Recording in real time.** Screen capture drops frames, and the break-up lasts only a few frames. Step a simulated clock per frame instead (`advance()`).

**UI left visible in the recording.** A CSS `display: grid` rule beats the `hidden` attribute. Hide recording-only elements with an inline `display: none !important`. The engine does this for `[data-weft-ui]` in frozen stills.

**No time to settle between moves in a video.** Twenty quick flicks back to back never showed a sharp frame. Ten flicks, each with a rest of about 1 s, show both states.

**Reading pixels from a canvas you didn't size.** A fresh `<canvas>` is 300x150. Drawing a 256� analysis into it silently cropped the mask to the top 59%.

**Cross-origin sources.** Pixels can't be read from cross-origin sources without CORS, so subject analysis falls back to full frame. Serve sources from the same origin, or with `Access-Control-Allow-Origin`.

**An off-centre subject.** Paintings and photos rarely put the subject in the middle, and a turning figure that sits to one side looks like a mistake. `focus: 'subject'` centres its bounding box, but never along an axis where the frame crops it.
