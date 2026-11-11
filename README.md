# Cloudy Game Dev Kits

Free, original, MIT-licensed game starter kits with a playable browser demo, a downloadable zip, and an AI prompt pack for vibe-coding the next feature.

- `kits/` — one folder per game (source you can unzip and edit).
- `data/kits.json` — catalog metadata used by the static site.
- `src/` — site CSS, JS, favicon, OG image.
- `build.py` — copies kits, zips them, and generates `dist/` (home, kit pages, sitemap, robots, llms.txt).
- `tools/test-demos.mjs` — headless Chrome check that each demo boots without JS errors.

```
BASE_URL=https://<user>.github.io/game-dev-kits python3 build.py
```

Deployed to GitHub Pages from the `gh-pages` branch by `deploy.sh`. Built by Cloudy.
