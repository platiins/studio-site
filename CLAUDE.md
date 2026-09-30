# Studio website — notes for Claude

Customer-facing website for a professional piercing studio in Latvia. The owner vibe-codes it: she describes changes in plain words and knows a little front-end, so explain changes briefly and in plain language.

## Structure
- `index.html` — page shell only (head, fonts, `#page` container). Content is drawn by `app.js`.
- `styles.css` — all styling. Default tokens on `:root`; dark mode via `prefers-color-scheme` + `[data-theme]`.
- `app.js` — loads the JSON data, applies design settings as CSS variables (`applyDesign`), renders the page (`render`, `card`, `drawing`).
- `data/jewelry.json` — list of pieces: name, variant, type, gauge, size, material, price (number or null), availability (`in` | `low` | `out` | `ask`), photo (`/images/...` or empty), hidden. Optional `sizes`: `[{ gauge: "16G", lengths: ["6mm", "8mm"] }]` — one card for the piece that opens a size panel on tap (lengths are shown as "Diameter" for rings).
- `data/site.json` — texts and `design` settings (theme, accent, fonts, cornerRadius, cardSize, colorStripe).
- `images/` — product photos. `.pages.yml` — Pages CMS editor config; keep its fields in sync with the JSON shapes.

## Rules
- Plain HTML/CSS/JS, no build step, no framework, no npm dependencies. It must work by opening through any static server.
- Content changes go in the JSON files, not hard-coded in HTML/JS.
- If you add a field to the JSON, also add it to `.pages.yml` and handle it being missing in `app.js`.
- Every color is a CSS variable; update both light and dark values. Themes live in `THEMES` in `app.js`.
- Mobile first: most visitors come from Instagram on a phone. Check at ~390px width, no horizontal scroll.
- Never show private business data (cost prices, suppliers, stock counts). Only customer-facing info.
- Customer copy: short, friendly, plain English. Jewelry terms: gauge (16G), length in mm, "top"/"end", "labret", ASTM F136 titanium.
- Escape all data before inserting into HTML (use `esc()`).

## Preview locally
`python3 -m http.server 8000` in this folder, then open http://localhost:8000 (opening index.html directly won't load the JSON).
