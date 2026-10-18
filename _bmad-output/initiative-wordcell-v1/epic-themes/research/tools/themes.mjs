// Candidate theme data for ticket 9.1. Token names mirror src/ui/app.css :root.
// Texture layers: SVG strings (no external refs) tiled as CSS backgrounds; `extremes` lists the
// composite colours (hex, opaque) the texture can reach under a glyph, used for the worst-point
// letter contrast. Extremes are computed from the layer alphas below (see build.mjs blend()).
const T = (o) => o;

export const themes = [
  T({
    id: 'default',
    name: 'Default dark (reference)',
    tokens: {
      table: '#15171b', surface: '#1e2127', 'surface-raised': '#282c34', hairline: '#363b45',
      outline: '#6e7480', 'card-face': '#23262c', 'card-edge': '#6a707c', 'card-ink': '#f3eee4',
      'ink-primary': '#f3eee4', 'ink-secondary': '#a9a398', 'ink-disabled': '#6b675f',
      'ink-on-accent': '#15171b', 'accent-teal': '#3dbdb5', 'accent-orange': '#ef7a3d',
      destination: '#7fa2d6', 'destination-fill': '#2e3a52', error: '#f08a84', scrim: '#000000b3',
    },
    scheme: 'dark',
  }),
  T({
    id: 'scifi',
    name: 'Sci-fi: Deep Space',
    pitch: 'Near-black blue table, cyan and amber signal accents, a faint grid on the table and a fine scan-line on card faces.',
    scheme: 'dark',
    tokens: {
      table: '#0a0f1c', surface: '#111a2e', 'surface-raised': '#1a2641', hairline: '#25355a',
      outline: '#6d7fa6', 'card-face': '#0f1830', 'card-edge': '#6a82b8', 'card-ink': '#e6f4ff',
      'ink-primary': '#e6f4ff', 'ink-secondary': '#9fb2d4', 'ink-disabled': '#5e6e92',
      'ink-on-accent': '#0a0f1c', 'accent-teal': '#35d0ff', 'accent-orange': '#ffb02e',
      destination: '#9a8cff', 'destination-fill': '#2a2860', error: '#ff8f9a', scrim: '#000000b3',
    },
    notes: 'Destination turns violet-blue; error stays a light red with its glyph. Cyan = act, amber = commit.',
    table_art: {
      // 48 px grid, 1 px lines, 5 % cyan: pure decoration under the columns.
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M48 0H0V48" fill="none" stroke="#35d0ff" stroke-opacity=".07" stroke-width="1"/></svg>`,
      size: 48,
    },
    face_art: {
      // 4 px scan-lines, one 1 px line at 6 % cyan.
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="1" fill="#35d0ff" fill-opacity=".06"/></svg>`,
      layers: [{ color: '#35d0ff', alpha: 0.06 }],
      size: 4,
    },
  }),
  T({
    id: 'garden',
    name: 'Garden: Greenhouse Dusk',
    pitch: 'Deep moss table with a leaf-vein pattern, bark-dark cards, cream ink, marigold and sage accents.',
    scheme: 'dark',
    tokens: {
      table: '#101a14', surface: '#18271e', 'surface-raised': '#223528', hairline: '#2f4637',
      outline: '#7a9482', 'card-face': '#16231a', 'card-edge': '#7a9a84', 'card-ink': '#f6f0dc',
      'ink-primary': '#f6f0dc', 'ink-secondary': '#b4bfa6', 'ink-disabled': '#6e7c68',
      'ink-on-accent': '#101a14', 'accent-teal': '#8fdc9e', 'accent-orange': '#f2a23a',
      destination: '#e0a8d0', 'destination-fill': '#4a2f48', error: '#ff9a8a', scrim: '#000000b3',
    },
    notes: 'The act accent is a light sage (not teal) so it separates from the green table; destination becomes blossom pink so it never reads as a "success green". Needs owner OK on the green act accent (DESIGN.md Avoid list: no green success states).',
    table_art: {
      // 64 px tile: two crossing leaf curves at 6 % light green.
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><g fill="none" stroke="#8fdc9e" stroke-opacity=".08" stroke-width="1.2"><path d="M0 52C18 52 22 36 32 32S50 14 64 12"/><path d="M0 12C14 14 24 26 32 32S52 50 64 52"/><path d="M32 0V64"/></g></svg>`,
      size: 64,
    },
    face_art: {
      // 6 px paper fibre: two short strokes at 5 % cream.
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6"><path d="M0 1L3 0M3 4L6 3" stroke="#f6f0dc" stroke-opacity=".03" stroke-width="1"/></svg>`,
      layers: [{ color: '#f6f0dc', alpha: 0.03 }],
      size: 6,
    },
  }),
  T({
    id: 'steampunk',
    name: 'Steampunk: Brass and Walnut',
    pitch: 'Walnut-brown table with wood-grain and rivet rows, dark leather cards with a brass edge, parchment ink, brass and copper accents.',
    scheme: 'dark',
    tokens: {
      table: '#1d1510', surface: '#2a1f17', 'surface-raised': '#3a2b20', hairline: '#4a382a',
      outline: '#b09878', 'card-face': '#231810', 'card-edge': '#b08d57', 'card-ink': '#fbf0d6',
      'ink-primary': '#fbf0d6', 'ink-secondary': '#c8b48f', 'ink-disabled': '#8a7860',
      'ink-on-accent': '#1d1510', 'accent-teal': '#5cc8bd', 'accent-orange': '#e8863a',
      destination: '#a8b8d8', 'destination-fill': '#232c46', error: '#f59a8c', scrim: '#000000b3',
    },
    notes: 'Keeps verdigris teal (a brass patina, on brand for steampunk) and copper orange, so the two-accent meaning is unchanged. Brass card edge is the strongest "theme read".',
    table_art: {
      // 80x40 plank: horizontal grain lines at 7 % tan + a dark seam.
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><g stroke="#b08d57" stroke-opacity=".07" stroke-width="1"><path d="M0 6H80M0 13H55M0 22H80M0 29H40M0 35H70"/></g><path d="M0 39.5H80" stroke="#000" stroke-opacity=".25"/></svg>`,
      size: 80,
    },
    face_art: {
      // 8 px leather pebble: dots at 6 % brass.
      svg: `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="2" cy="2" r=".8" fill="#b08d57" fill-opacity=".04"/><circle cx="6" cy="6" r=".8" fill="#b08d57" fill-opacity=".04"/></svg>`,
      layers: [{ color: '#b08d57', alpha: 0.04 }],
      size: 8,
    },
  }),
  T({
    id: 'paper',
    name: 'Colour variation: Daylight Paper (light)',
    pitch: 'The one light option: warm paper table, white cards with dark ink, same teal and orange meanings darkened to hold contrast. No art needed.',
    scheme: 'light',
    tokens: {
      table: '#ece6d8', surface: '#f6f2e8', 'surface-raised': '#ffffff', hairline: '#d6cebb',
      outline: '#6d6757', 'card-face': '#fffdf7', 'card-edge': '#6a6455', 'card-ink': '#1d1b17',
      'ink-primary': '#1d1b17', 'ink-secondary': '#55503f', 'ink-disabled': '#8c8671',
      'ink-on-accent': '#ffffff', 'accent-teal': '#065a55', 'accent-orange': '#9c3a08',
      destination: '#2f5a99', 'destination-fill': '#dbe6f7', error: '#8f1f17', scrim: '#000000b3',
    },
    notes: 'Light theme flips color-scheme and the meta theme-color; scrim stays dark. Inverts the "ivory on charcoal" brand line, so it is the biggest brand departure of the five.',
  }),
  T({
    id: 'dusk',
    name: 'Colour variation: Plum Dusk (dark)',
    pitch: 'Same dark layout and no art; a warm plum-charcoal palette with rose and gold accents. The cheapest direction: tokens only.',
    scheme: 'dark',
    tokens: {
      table: '#17121c', surface: '#211a29', 'surface-raised': '#2d2438', hairline: '#3d3249',
      outline: '#807590', 'card-face': '#271f30', 'card-edge': '#7e7290', 'card-ink': '#f6eee6',
      'ink-primary': '#f6eee6', 'ink-secondary': '#b5a9bd', 'ink-disabled': '#7b6f85',
      'ink-on-accent': '#17121c', 'accent-teal': '#5ed6c2', 'accent-orange': '#f4a14a',
      destination: '#8fb0e8', 'destination-fill': '#2c3655', error: '#f59aa0', scrim: '#000000b3',
    },
    notes: 'Only the surfaces change hue; both accents stay near the default hues, so the meanings carry over unchanged.',
  }),
];
