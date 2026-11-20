[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lovelydisya17/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/lovelydisya17/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Coast Cover Studio

Turn any photo into GTA 6-style multi-panel cover art. Neon Coast Cover Studio is an offline web app that grades your photo with a Vice City sunset and neon look, splits it into a multi-panel cover layout, and lets you crop and position each panel and edit the caption, then exports the finished cover as a PNG.

Use any photo you like: a sunset boulevard, a pier at dusk, a portrait, a street shot. Pick a panel layout, drag each photo into place, tune the crop and position per panel, type your caption, and export.

## Features

- Multi-panel GTA-style cover layouts with a Vice City sunset and neon grade
- Works with any photo, no account and no upload, everything runs locally in your browser
- Crop and position controls for every panel
- Caption editing with cover-style typography (Anton and Pacifico, bundled under the SIL Open Font License)
- Offline: no network calls, no tracking, your photos never leave your device
- PNG export in the three post sizes: 1080x1080 (square), 1080x1350 (portrait), 1920x1080 (landscape)

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in your browser. No build step and no dependencies, Node 22 standard library only. A different port works too: `node serve.ts --port 3000` serves the app on http://localhost:3000.

## How it works

1. Open the app and drop in a photo, or start from one of the bundled samples.
2. Choose a panel layout and adjust the crop and position of each panel.
3. Edit the caption text.
4. Export a PNG in 1080x1080, 1080x1350, or 1920x1080.

## Fonts

Anton and Pacifico are bundled in `app/fonts/` under the SIL Open Font License 1.1, see `app/fonts/OFL-Anton.txt` and `app/fonts/OFL-Pacifico.txt`.

<sub>Entered on [make.fun](https://make.fun/?ref=w285c9pc&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
