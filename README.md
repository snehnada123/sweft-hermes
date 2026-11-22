# Weft for Hermes Agent

A Hermes skill adaptation of [Weft](https://github.com/JDhruv14/weft), the TypeScript and WebGL2 bar-mosaic renderer by JDhruv14. Use `/weft` in Hermes to turn an image, video, webcam feed or canvas into interactive rows of coloured bars.

The renderer in `assets/weft.ts` and the option, recipe and pitfalls references are copied from [upstream commit `1ad5e852`](https://github.com/JDhruv14/weft/tree/1ad5e852adada7607ccc83b5edb9c9ca235dfd30). The skill instructions are adapted for Hermes, and the bundled demo uses a generated portrait so it can run without upstream media. The original MIT copyright and permission notice is retained in [LICENSE](LICENSE) and [assets/LICENSE](assets/LICENSE).

## Install in Hermes

Install from the direct skill file URL so Hermes includes the referenced assets and documentation:

```powershell
hermes skills install https://raw.githubusercontent.com/snehnada123/weft-hermes/main/SKILL.md
hermes skills list
```

In Hermes chat:

```text
/weft Create an interactive portrait from my image in my website
```

Hermes loads skill files on demand. To manually install from this folder, copy `SKILL.md`, `references/` and `assets/` into `~/.hermes/skills/weft/`, then start a new Hermes session. Keep the repository's `LICENSE` in any redistributed copy. The skill names every asset and reference in its Markdown so direct GitHub skill installation can include them.

## Try the demo

```powershell
cd assets
npm install
npm run typecheck
npm run dev
```

Open the Vite address, move the pointer over the portrait, try the palette and direction buttons, or drop your own image or video. The camera button requires browser permission and localhost or HTTPS.

## Hackathon use

Weft is the renderer. If your submission uses it, keep its MIT notice with the code, explain the original interaction or product that you built around it, and identify the renderer as an existing component. A renamed copy of the demo is not an original hackathon project.
