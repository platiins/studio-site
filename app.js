/* ============================================================
   Studio site — app.js
   1. Loads data/site.json (texts + design) and data/jewelry.json (pieces)
   2. Applies the design (colors, fonts, roundness) as CSS variables
   3. Draws the page into #page
   To change content, edit the JSON files. To change behaviour, edit here.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- settings you might want to extend ---------- */

  // Jewelry types, in the order they appear on the page, with their section titles.
  const TYPES = ["Labret / post", "Top / end", "Ring", "Barbell", "Aftercare", "Other"];
  const SECTION_TITLE = {
    "Labret / post": "Labrets", "Top / end": "Tops", "Ring": "Rings",
    "Barbell": "Barbells", "Aftercare": "Aftercare", "Other": "More"
  };

  // Availability label shown on each card: [css class, text]
  const AVAILABILITY = {
    in: ["in", "In stock"], low: ["low", "Last pieces"],
    out: ["out", "Out of stock"], ask: ["ask", "Ask about it"]
  };

  // Color themes: [background, card, photo well, text, muted text, lines, accent]
  const THEMES = {
    titanium: { light: ["#eef0f3","#ffffff","#e3e6ec","#16181d","#5d6370","#d3d7df","#3d43c9"], dark: ["#121419","#1b1e25","#23272f","#eceef2","#9aa1ae","#2e333d","#8e93ff"] },
    blush:    { light: ["#f7efee","#ffffff","#f1e2e0","#2a1d1f","#7a6365","#ead7d5","#b24a6b"], dark: ["#1a1416","#231b1e","#2d2327","#f3e9ea","#b39ea2","#3a2e32","#f08fae"] },
    gold:     { light: ["#f6f3ec","#fffdf8","#efe8da","#1e1b16","#6e665a","#e4dccb","#9a6b1f"], dark: ["#15130f","#1e1b16","#29251d","#f1ece2","#a89f90","#353026","#e0b25a"] },
    sage:     { light: ["#eef2ee","#ffffff","#e1e9e2","#18201a","#5c6a5f","#d3ddd4","#2f6b4f"], dark: ["#111612","#192019","#212a22","#e8efe9","#98a69b","#2c362d","#7fcfa4"] }
  };

  // Google Fonts: name -> [weights to load, headline weight]
  const HEADLINE_FONTS = {
    "Syne": ["wght@500;700;800", 800], "Unbounded": ["wght@500;700;800", 700],
    "Bricolage Grotesque": ["wght@500;700;800", 800], "Playfair Display": ["wght@500;700;800", 700],
    "DM Serif Display": ["", 400], "Cormorant Garamond": ["wght@500;600;700", 600]
  };
  const TEXT_FONTS = ["Figtree", "DM Sans", "Manrope", "Nunito Sans", "Karla", "Lora"];
  const CARD_SIZES = { small: 170, regular: 210, large: 270 };

  /* ---------- helpers ---------- */
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const eur = (n) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
  const fmtDate = (d) => { const t = new Date(d + "T12:00:00"); return isNaN(t) ? (d || "") : t.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }); };
  const typeOf = (it) => (TYPES.includes(it.type) ? it.type : "Other");
  const rank = (it) => ({ in: 0, low: 1, ask: 2, out: 3 }[it.availability] ?? 2);

  let site = {}, items = [], filter = "all";

  /* ---------- design ---------- */
  function applyDesign(d) {
    d = d || {};
    const theme = THEMES[d.theme] || THEMES.titanium;
    const accent = /^#[0-9a-f]{6}$/i.test(d.accent || "") ? d.accent : null;
    const names = ["--bg", "--surface", "--well", "--ink", "--muted", "--line", "--accent"];
    const block = (vals, dark) => names.map((n, i) =>
      n + ":" + (n === "--accent" && accent ? (dark ? `color-mix(in oklab, ${accent} 62%, #fff)` : accent) : vals[i])
    ).join(";") + (dark ? ";color-scheme:dark" : "");

    const hf = HEADLINE_FONTS[d.headlineFont] ? d.headlineFont : "Syne";
    const tf = TEXT_FONTS.includes(d.textFont) ? d.textFont : "Figtree";
    const serif = /Serif|Playfair|Cormorant/.test(hf);
    const radius = Math.max(0, Math.min(28, Number(d.cornerRadius ?? 16)));
    const common = `--f-display:"${hf}",${serif ? "Georgia,serif" : "'Helvetica Neue',Arial,sans-serif"};--w-display:${HEADLINE_FONTS[hf][1]};` +
      `--f-body:"${tf}",${tf === "Lora" ? "Georgia,serif" : "'Segoe UI',system-ui,sans-serif"};--r:${radius}px;--card-min:${CARD_SIZES[d.cardSize] || 210}px`;

    let style = document.getElementById("theme");
    if (!style) { style = document.createElement("style"); style.id = "theme"; document.head.appendChild(style); }
    style.textContent = `:root{${block(theme.light, false)};${common}}` +
      `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${block(theme.dark, true)}}}` +
      `:root[data-theme="dark"]{${block(theme.dark, true)}}`;

    const fam = (n, w) => "family=" + n.replace(/ /g, "+") + (w ? ":" + w : "");
    $("#fonts").href = "https://fonts.googleapis.com/css2?" +
      [fam(hf, HEADLINE_FONTS[hf][0]), fam(tf, "wght@400;500;600"), fam("JetBrains Mono", "wght@400;500")].join("&") + "&display=swap";
  }

  /* ---------- drawings used when a piece has no photo ---------- */
  let uid = 0;
  function drawing(it) {
    const k = ++uid, metal = `url(#m${k})`, t = it.type, size = parseInt(it.size) || 8;
    const defs = `<defs><linearGradient id="m${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--metal-hi)"/><stop offset=".5" stop-color="var(--metal-mid)"/><stop offset="1" stop-color="var(--metal-lo)"/></linearGradient>` +
      `<linearGradient id="rb${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f28bb3"/><stop offset=".35" stop-color="#9d8cf2"/><stop offset=".65" stop-color="#6cc6e8"/><stop offset="1" stop-color="#8fe0b0"/></linearGradient></defs>`;
    let g = "";
    if (t === "Labret / post") {
      const len = Math.min(84, 30 + size * 4);
      g = `<ellipse cx="60" cy="${60 + len / 2}" rx="26" ry="7" fill="${metal}"/><rect x="56" y="${60 - len / 2}" width="8" height="${len}" rx="3" fill="${metal}"/><circle cx="60" cy="${60 - len / 2}" r="5" fill="var(--metal-mid)"/>`;
    } else if (t === "Ring") {
      g = `<circle cx="60" cy="60" r="34" fill="none" stroke="${metal}" stroke-width="7"/>`;
    } else if (t === "Barbell") {
      g = `<rect x="24" y="56" width="72" height="8" rx="4" fill="${metal}"/><circle cx="22" cy="60" r="11" fill="${metal}"/><circle cx="98" cy="60" r="11" fill="${metal}"/>`;
    } else if (t === "Aftercare") {
      g = `<rect x="40" y="36" width="40" height="62" rx="10" fill="${metal}"/><rect x="50" y="22" width="20" height="16" rx="3" fill="var(--metal-lo)"/>`;
    } else if (t === "Top / end") {
      const v = (it.variant || "").toLowerCase();
      const fill = v.includes("black") ? "var(--gem-black)" : /colou?r|multi/.test(v) ? `url(#rb${k})` : "var(--gem-clear)";
      const edge = v.includes("black") ? "var(--metal-lo)" : "var(--gem-edge)";
      const scale = { s: 0.72, m: 0.86, l: 1 }[v] || 0.9;
      const gem = (it.name || "").toLowerCase().includes("diamond")
        ? `<polygon points="60,98 26,50 40,32 80,32 94,50" fill="${fill}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/><polyline points="26,50 94,50" fill="none" stroke="${edge}" stroke-width="1.5"/><polyline points="40,32 50,50 60,98 70,50 80,32" fill="none" stroke="${edge}" stroke-width="1.2" opacity=".8"/><polyline points="50,50 60,32 70,50" fill="none" stroke="${edge}" stroke-width="1.2" opacity=".8"/>`
        : `<circle cx="60" cy="62" r="34" fill="${metal}"/><circle cx="60" cy="62" r="27" fill="${fill}" stroke="${edge}" stroke-width="2"/><polygon points="60,40 78,56 72,80 48,80 42,56" fill="none" stroke="${edge}" stroke-width="1.3" opacity=".85"/><path d="M60 40 60 62 M78 56 60 62 M72 80 60 62 M48 80 60 62 M42 56 60 62" stroke="${edge}" stroke-width="1" opacity=".6"/>`;
      g = `<g transform="translate(60 62) scale(${scale}) translate(-60 -62)">${gem}</g>`;
    } else {
      g = `<circle cx="60" cy="60" r="22" fill="${metal}"/>`;
    }
    return `<svg viewBox="0 0 120 120" aria-hidden="true">${defs}${g}</svg>`;
  }

  /* ---------- one jewelry card ---------- */
  function card(it) {
    const [cls, label] = AVAILABILITY[it.availability] || AVAILABILITY.ask;
    const specs = [it.gauge, it.size, it.material].filter(Boolean).map(esc).join(" · ");
    const visual = it.photo
      ? `<img src="${esc(it.photo)}" alt="${esc(it.name)} ${esc(it.variant)}" loading="lazy">`
      : drawing(it);
    const price = typeof it.price === "number"
      ? `<div class="price">${eur(it.price)}</div>`
      : `<div class="price none">Price in studio</div>`;
    return `<article class="card${it.availability === "out" ? " is-out" : ""}">
      <div class="well">${visual}<span class="pill ${cls}">${label}</span></div>
      <div class="info">
        <h3 class="name">${esc(it.name)}${it.variant ? ` <span class="variant">${esc(it.variant)}</span>` : ""}</h3>
        ${specs ? `<div class="specs">${specs}</div>` : ""}${price}
      </div></article>`;
  }

  /* ---------- whole page ---------- */
  function render() {
    uid = 0;
    const visible = items.filter((i) => !i.hidden);
    const types = TYPES.filter((t) => visible.some((i) => typeOf(i) === t));
    if (filter !== "all" && !types.includes(filter)) filter = "all";
    const handle = String(site.instagram || "").trim().replace(/^@/, "");

    const chips = [["all", "All", visible.length], ...types.map((t) => [t, SECTION_TITLE[t], visible.filter((i) => typeOf(i) === t).length])];
    const sections = types.filter((t) => filter === "all" || t === filter).map((t) => {
      const list = visible.filter((i) => typeOf(i) === t).sort((a, b) =>
        rank(a) - rank(b) || String(a.name).localeCompare(b.name) ||
        (parseFloat(a.size) || 0) - (parseFloat(b.size) || 0) || String(a.variant).localeCompare(b.variant));
      return `<section><div class="section-h"><h2>${esc(SECTION_TITLE[t])}</h2><small>${list.length} ${list.length === 1 ? "piece" : "pieces"}</small></div>
        <div class="grid">${list.map(card).join("")}</div></section>`;
    }).join("");

    $("#page").innerHTML = `
      <header>
        <div class="eyebrow">${esc(site.studioName || site.eyebrow)}</div>
        <h1>${esc(site.headline1)}${site.headline2 ? `<em>${esc(site.headline2)}</em>` : ""}</h1>
        ${site.design && site.design.colorStripe === false ? "" : '<div class="anod" aria-hidden="true"></div>'}
        ${site.intro ? `<p class="lede">${esc(site.intro)}</p>` : ""}
        <div class="meta">${site.updated ? `<span>Updated <b>${esc(fmtDate(site.updated))}</b></span>` : ""}<span><b>${visible.filter((i) => i.availability !== "out").length}</b> pieces</span></div>
      </header>
      ${types.length > 1 ? `<nav class="bar" aria-label="Filter by type">${chips.map(([k, l, n]) => `<button class="chip" type="button" data-k="${esc(k)}" aria-pressed="${k === filter}">${esc(l)}<span>${n}</span></button>`).join("")}</nav>` : ""}
      <main class="groups">${sections || `<div class="empty">We're updating the list right now. Message us on Instagram and we'll tell you what's available.</div>`}</main>
      <section class="reserve" aria-labelledby="reserve-title">
        <h2 id="reserve-title">${esc(site.reserveTitle)}</h2>
        <ol class="steps">${(site.reserveSteps || []).filter(Boolean).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
        ${handle ? `<div class="handle"><a id="ig" href="https://instagram.com/${encodeURIComponent(handle)}" target="_blank" rel="noopener">@${esc(handle)}</a><button class="copy" id="copy" type="button">Copy</button></div>` : ""}
      </section>
      ${site.footer ? `<footer>${esc(site.footer)}</footer>` : ""}`;
  }

  /* ---------- clicks: filters + copy button ---------- */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) { filter = chip.dataset.k; render(); return; }
    if (e.target.id === "copy") {
      const a = $("#ig"), b = e.target;
      const selectIt = () => getSelection().selectAllChildren(a);
      try {
        navigator.clipboard.writeText(a.textContent).then(() => { b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy"), 1600); }, selectIt);
      } catch (_) { selectIt(); }
    }
  });

  /* ---------- start ---------- */
  Promise.all([
    fetch("data/site.json", { cache: "no-cache" }).then((r) => r.json()),
    fetch("data/jewelry.json", { cache: "no-cache" }).then((r) => r.json())
  ]).then(([s, j]) => {
    site = s || {}; items = Array.isArray(j) ? j : [];
    if (site.studioName) document.title = `Jewelry in stock · ${site.studioName}`;
    applyDesign(site.design);
    render();
  }).catch(() => {
    $("#page").innerHTML = `<div class="empty">The jewelry list couldn't load. Refresh the page, or message us on Instagram.</div>`;
  });
})();
