# Sweft for Hermes Agent

A Hermes skill for turning an image, video, webcam feed or canvas into an interactive TypeScript and WebGL2 bar mosaic. Use `/sweft` in Hermes to add the effect to a web project.

**[Open the website demo](https://snehnada123.github.io/sweft-hermes/)**. It preserves the original page's layout and controls and uses a different default portrait. Drop your own image or video onto the page to change the source.

The renderer and reference material are adapted from MIT-licensed source. The original copyright and permission notice is retained in [LICENSE](LICENSE) and [assets/LICENSE](assets/LICENSE). The bundled demo uses a generated portrait so it runs without external media.

## Install in Hermes

Install from the direct skill file URL so Hermes includes the referenced assets and documentation:

```powershell
hermes skills install https://raw.githubusercontent.com/snehnada123/sweft-hermes/main/SKILL.md
hermes skills list
```

In Hermes chat:

```text
/sweft Create an interactive portrait from my image in my website
```

Hermes loads skill files on demand. To manually install from this folder, copy `SKILL.md`, `references/` and `assets/` into `~/.hermes/skills/sweft/`, then start a new Hermes session. Keep the repository's `LICENSE` in any redistributed copy. The skill names every asset and reference in its Markdown so direct GitHub skill installation can include them.

## Try the demo

The website source is in `demo/`, with the renderer in `src/`. Run the published page locally with:

```powershell
npm ci
npm run typecheck
npm run dev
```

The skill also contains a self-contained demo in `assets/`:

```powershell
cd assets
npm install
npm run typecheck
npm run dev
```

Open the Vite address, move the pointer over the portrait, try the palette and direction buttons, or drop your own image or video. The camera button requires browser permission and localhost or HTTPS.


