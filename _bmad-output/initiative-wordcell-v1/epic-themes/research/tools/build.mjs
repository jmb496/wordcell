// Ticket 9.1 generator: contrast report, art sizes and 360 px mockups from themes.mjs.
// Usage: node build.mjs   (writes ../mockups/*.html, ../contrast.json, ../art-sizes.json)
import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes } from './themes.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..');

// ---- WCAG contrast -------------------------------------------------------------------------
const rgb = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (h) => {
  const [r, g, b] = rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');
/** Composite `top` at `alpha` over opaque `base`. */
const blend = (base, top, alpha) => {
  const [b, t] = [rgb(base), rgb(top)];
  return `#${b.map((v, i) => hex2(v * (1 - alpha) + t[i] * alpha)).join('')}`;
};

// DESIGN.md Colors figures: [label, fg, bg, floor]. Floors are the figures DESIGN.md states.
const PAIRS = [
  ['card ink on card face', 'card-ink', 'card-face', 13.1],
  ['outline on table', 'outline', 'table', 3.8],
  ['outline on surface', 'outline', 'surface', 3.4],
  ['card edge on table', 'card-edge', 'table', 3.6],
  ['card edge on surface', 'card-edge', 'surface', 3.2],
  ['ink secondary on surface', 'ink-secondary', 'surface', 6.4],
  ['ink secondary on surface raised', 'ink-secondary', 'surface-raised', 5.6],
  ['accent teal on surface', 'accent-teal', 'surface', 7.0],
  ['accent teal on card face', 'accent-teal', 'card-face', 6.6],
  ['ink on accent orange', 'ink-on-accent', 'accent-orange', 6.4],
  ['card ink on destination fill', 'card-ink', 'destination-fill', 9.9],
  ['error on surface', 'error', 'surface', 6.7],
  ['ink primary on table', 'ink-primary', 'table', 4.5],
  ['destination outline on table', 'destination', 'table', 3.0],
];

const report = {};
for (const t of themes) {
  const k = t.tokens;
  const rows = PAIRS.map(([label, f, b, floor]) => {
    const r = ratio(k[f], k[b]);
    return { label, fg: k[f], bg: k[b], ratio: +r.toFixed(2), floor, pass: r + 0.05 >= floor };
  });
  const extra = [];
  if (t.face_art) {
    // Worst point under a glyph: the face colour fully covered by the texture layer at its alpha
    // (the extreme the pattern can reach), plus the bare face. Conservative: assumes full coverage.
    const reach = [k['card-face'], ...t.face_art.layers.map((l) => blend(k['card-face'], l.color, l.alpha))];
    const worst = Math.min(...reach.map((c) => ratio(k['card-ink'], c)));
    extra.push({ label: 'card ink over worst face-texture point', ratio: +worst.toFixed(2), floor: 13.1, pass: worst + 0.05 >= 13.1 });
    const worstEdge = Math.min(...reach.map((c) => ratio(k['card-edge'], c)));
    extra.push({ label: 'card edge over worst face-texture point (info)', ratio: +worstEdge.toFixed(2), floor: 3.0, pass: worstEdge >= 3.0 });
  }
  if (t.table_art) {
    const tex = (t.table_art.svg.match(/stroke="(#[0-9a-f]{6})"/) ?? t.table_art.svg.match(/fill="(#[0-9a-f]{6})"/))[1];
    const alphas = [...t.table_art.svg.matchAll(/(?:stroke|fill)-opacity="([\d.]+)"/g)].map((m) => +m[1]);
    const reachT = [k.table, blend(k.table, tex, Math.max(...alphas))];
    const lo = Math.min(...reachT.map((c) => ratio(k['card-edge'], c)));
    const lo2 = Math.min(...reachT.map((c) => ratio(k.outline, c)));
    extra.push({ label: 'card edge over worst table-texture point', ratio: +lo.toFixed(2), floor: 3.6, pass: lo + 0.05 >= 3.6 });
    extra.push({ label: 'outline over worst table-texture point', ratio: +lo2.toFixed(2), floor: 3.8, pass: lo2 + 0.05 >= 3.8 });
  }
  report[t.id] = { rows: [...rows, ...extra], allPass: [...rows, ...extra].every((r) => r.pass) };
}
writeFileSync(join(out, 'contrast.json'), `${JSON.stringify(report, null, 2)}\n`);

// ---- art sizes -----------------------------------------------------------------------------
const sizes = {};
const css = (t) =>
  Object.entries(t.tokens).map(([n, v]) => `--wc-${n}:${v};`).join('');
for (const t of themes) {
  const tokenBytes = Buffer.byteLength(`[data-theme="${t.id}"]{${css(t)}}`);
  const art = [t.table_art, t.face_art].filter(Boolean);
  const svgRaw = art.reduce((n, a) => n + Buffer.byteLength(a.svg), 0);
  // As shipped: a tile SVG is inlined in CSS as a url("data:...") or an asset file; gzip-9 either way.
  const svgGz = art.reduce((n, a) => n + gzipSync(a.svg, { level: 9 }).length, 0);
  const tokGz = gzipSync(`[data-theme="${t.id}"]{${css(t)}}`, { level: 9 }).length;
  sizes[t.id] = { tokenCssRawBytes: tokenBytes, tokenCssGzipBytes: tokGz, svgTilesRawBytes: svgRaw, svgTilesGzipBytes: svgGz, totalGzipBytes: tokGz + svgGz };
}
writeFileSync(join(out, 'art-sizes.json'), `${JSON.stringify(sizes, null, 2)}\n`);

// ---- mockup --------------------------------------------------------------------------------
const uri = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
const W = 40, H = 53, SLOT = 44, STRIP = 44;
const letter = (ch, extra = '') => ch;
// Representative board: 8 columns (letters), one selected card, one Qu, tray with the D block + free letters.
const cols = [
  ['F', 'R', 'O', 'S', 'T'],
  ['L', 'A', 'M', 'P'],
  ['E', 'N', 'Qu', 'I', 'D', 'K'],
  ['W', 'H', 'Y', 'R'],
  ['T', 'O', 'B', 'E', 'A'],
  ['G', 'U', 'S', 'T', 'E', 'V'],
  ['C', 'N', 'I', 'Z'],
  ['J', 'E', 'L', 'X', 'D'],
];

function mockup(t) {
  const k = t.tokens;
  const vars = Object.entries(k).map(([n, v]) => `--wc-${n}:${v};`).join('');
  const tableBg = t.table_art ? `background-image:${uri(t.table_art.svg)};background-size:${t.table_art.size}px;` : '';
  const faceBg = t.face_art ? `background-image:${uri(t.face_art.svg)};background-size:${t.face_art.size}px;` : '';
  const card = (g, o = {}) => {
    const full = o.full ? ' full' : '';
    const q = g === 'Qu' ? ' qu' : '';
    return `<div class="slot${full}${o.sel ? ' sel' : ''}${o.cls ? ` ${o.cls}` : ''}"><div class="face"><span class="glyph${q}">${g}</span>${o.badge ? '<span class="badge">×2</span>' : ''}${o.star ? '<span class="mark star">★</span>' : ''}${o.lock ? '<span class="mark lock">🔒︎</span>' : ''}</div></div>`;
  };
  const column = (cs, i) =>
    `<div class="col">${cs.map((g, j) => card(g, { full: j === cs.length - 1, sel: i === 5 && j === cs.length - 1, badge: g === 'Qu', star: i === 3 && j === cs.length - 1 })).join('')}</div>`;
  const tile = (g, cls = '') => card(g, { full: true, cls });
  const cells = [3, 4, 5, 6, 7, 8, 9, 10];
  const placed = { 3: 'F', 5: 'L' };
  const cellRow = cells.map((n) => `<div class="cellcol"><span class="num">${n}</span>${placed[n] ? card(placed[n], { full: true }) : '<div class="slot full"><div class="face ghost"></div></div>'}</div>`).join('');
  return `<!doctype html>
<html lang="en" data-theme="${t.id}"><head><meta charset="utf-8"><meta name="viewport" content="width=360">
<title>WordCell mockup: ${t.name}</title>
<style>
@font-face{font-family:"WordCell Serif";src:url("../../../../../src/ui/assets/wordcell-serif.woff2") format("woff2");font-weight:600}
:root{color-scheme:${t.scheme};font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;${vars}color:var(--wc-ink-primary)}
html,body{margin:0;background:var(--wc-table);${tableBg}}
body{width:360px;min-height:740px;position:relative}
.bar{width:352px;margin:0 auto;height:44px;display:flex;align-items:center;gap:8px;background:var(--wc-table)}
.bar b{flex:1;text-align:center;font-weight:600}.bar span{width:44px;text-align:center;color:var(--wc-ink-secondary)}
.board{width:352px;margin:0 auto;display:flex}
.col{width:${SLOT}px}
.slot{width:${SLOT}px;height:${STRIP}px;flex:none}.slot.full{height:${H}px}
.face{position:relative;box-sizing:border-box;width:${W}px;height:${H}px;margin:0 2px;background:var(--wc-card-face);${faceBg}border:1px solid var(--wc-card-edge);border-radius:6px;color:var(--wc-card-ink);isolation:isolate}
.face::after{content:'';position:absolute;left:20%;width:60%;top:calc(86% - 3px);height:3px;border-bottom:1px solid var(--wc-card-edge);border-radius:0 0 50% 50%}
.glyph{position:absolute;left:0;right:0;top:0;height:72%;display:flex;align-items:center;justify-content:center;font-family:"WordCell Serif",serif;font-weight:600;line-height:1;font-size:${(W * 0.56).toFixed(1)}px}
.glyph.qu{top:12px;height:calc(72% - 12px);font-size:${(W * 0.44).toFixed(1)}px}
.badge{position:absolute;top:1px;right:1px;width:18px;height:12px;display:grid;place-items:center;border-radius:9999px;background:var(--wc-accent-orange);color:var(--wc-ink-on-accent);font:700 11px/1 system-ui}
.mark{position:absolute;z-index:1;bottom:2px;right:3px;font:700 11px/1 system-ui;color:var(--wc-card-ink)}.star{color:var(--wc-accent-orange)}
.sel .face{outline:2px solid var(--wc-accent-teal);outline-offset:-2px;transform:translateY(-6px);box-shadow:0 6px 16px #0008}
.ghost{background:none;border:1px dashed var(--wc-outline)}.ghost::after{content:none}
.foot{width:352px;margin:0 auto;display:flex;height:44px}.foot i{width:${SLOT}px;display:block;position:relative}
.foot i::before{content:'';position:absolute;inset:6px 2px;border:1px dashed var(--wc-outline);border-radius:6px}
.tray{width:352px;margin:4px auto 0;background:var(--wc-surface);border-radius:8px;padding:6px 0 6px}
.tray .word{padding:0 8px;font-size:12px;color:var(--wc-ink-secondary);letter-spacing:.08em}
.tiles{display:flex;padding:4px 4px}
.tiles .block .face{background:var(--wc-destination-fill);border:2px solid var(--wc-destination)}
.tiles .block .face::after{content:none}
.ctl{display:flex;justify-content:space-between;padding:4px 8px 0;font-size:12px;color:var(--wc-ink-secondary)}
.cellrow{width:352px;margin:6px auto 0;display:flex}
.cellcol{width:${SLOT}px}.num{display:block;text-align:center;font-size:11px;color:var(--wc-ink-secondary);height:14px}
.action{width:352px;margin:8px auto 0}
.btn{height:44px;border-radius:8px;background:var(--wc-accent-orange);color:var(--wc-ink-on-accent);display:grid;place-items:center;font-weight:700}
.msg{width:352px;margin:6px auto 0;font-size:12px;color:var(--wc-error)}
.label{position:absolute;right:4px;top:4px;font-size:9px;color:var(--wc-ink-disabled)}
</style></head><body>
<div class="bar"><span>☰</span><b>Score 124</b><span>↶ ↷</span></div>
<div class="board">${cols.map(column).join('')}</div>
<div class="foot">${'<i></i>'.repeat(8)}</div>
<div class="tray"><div class="word">BAKED</div>
<div class="tiles">${['B', 'A', 'K'].map((g, i) => card(g, { full: true, cls: 'block', lock: i === 0 })).join('')}${['E', 'D'].map((g) => tile(g)).join('')}</div>
<div class="ctl"><span>− 3 +</span><span>⇄ Flip</span><span>5 letters</span></div></div>
<div class="cellrow">${cellRow}</div>
<div class="msg">✕ QUIJO is not a word</div>
<div class="action"><div class="btn">Validate</div></div>
<div class="label">${t.name} · 360 px · cards ${W}×${H}</div>
</body></html>`;
}

for (const t of themes) writeFileSync(join(out, 'mockups', `${t.id}.html`), mockup(t));
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).map(([id, r]) => [id, r.allPass])), null, 1));
for (const [id, r] of Object.entries(report)) for (const row of r.rows) if (!row.pass) console.log(id, 'FAIL', row.label, row.ratio, '<', row.floor);
