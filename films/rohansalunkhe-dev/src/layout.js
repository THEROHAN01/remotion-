// Grid geometry, following the site's layoutDeck() / layoutColumnWorld().
// Laptop: a 1024×576 CSS viewport (the site's desktop layout, > 760 px wide).
// Column: the site's phone layout in a 432×768 viewport (a large phone).

import { CFG } from "./product.js";

const cell = CFG.tile + CFG.gap, tile = CFG.tile, gap = CFG.gap;

export function laptopLayout() {
  const VW = 1024, VH = 576;
  const viewCols = Math.ceil(VW / cell);
  const rows = Math.ceil(VH / cell);
  const sidebarCols = Math.round((300 + gap) / cell);          // 15: one stable 300 px pane
  const homeRight = 1 + sidebarCols;
  const drawerL = homeRight, drawerR = homeRight + sidebarCols;
  const detailL = drawerR, detailR = detailL + sidebarCols;
  const sidePad = cell, paneTop = cell;
  const paneW = sidebarCols * cell - gap;
  const paneH = Math.max(tile, VH - paneTop - cell);
  const paneStride = sidebarCols * cell;
  const finalPaneRight = sidePad + paneStride * 2 + paneW;
  const desiredWorldW = Math.max(VW, finalPaneRight + VW * 0.8);
  const cols = Math.max(viewCols, Math.ceil((desiredWorldW + gap) / cell));
  const ambient = Math.max(1, Math.round((VW * 0.8 - cell) / cell));
  // Name intro placement, as in buildIntro().
  const firstCol = homeRight + 1;
  const lastVisibleCol = Math.floor(VW / cell) - 2;
  const lastCol = Math.min(homeRight + ambient - 1, lastVisibleCol);
  const availCols = lastCol - firstCol + 1;
  const textCols = 5 * 6 - 1;
  const scale = textCols * 2 <= availCols && 14 <= rows - 4 ? 2 : 1;
  return {
    mode: "laptop", VW, VH, cell, tile, gap, cols, rows, viewCols,
    homeRight, drawerL, drawerR, detailL, detailR, sidePad, paneTop, paneW, paneH, paneStride,
    worldW: cols * cell - gap, worldH: VH, ambient,
    intro: {
      scale,
      i0: firstCol + Math.floor((availCols - textCols * scale) / 2),
      j0: Math.floor((rows - 7 * scale) / 2)
    },
    // Site-space rectangle the film camera is allowed to show.
    bounds: { x0: 0, y0: 0, x1: VW, y1: VH }
  };
}

export function columnLayout() {
  const VW = 432, VH = 768;
  const pCols = Math.ceil(VW / cell), pRows = Math.ceil(VH / cell); // 22 × 39, as on a phone
  // Film-only: the wall is drawn wider and taller than the phone so the vertical
  // cut can pull back and show the ROHAN wordmark (the site skips its name
  // intro on phones because the word doesn't fit).
  const OX = 6, OY = 11;
  const cols = pCols + OX * 2, rows = pRows + OY * 2 + 0;
  return {
    mode: "column", VW, VH, cell, tile, gap, cols, rows,
    pCols, pRows, OX, OY,
    phone: { x: OX * cell, y: OY * cell, w: VW, h: VH },
    homeRight: OX + 1, colorLeft: OX + 1,
    worldW: cols * cell - gap, worldH: rows * cell - gap,
    intro: { scale: 1, i0: Math.floor((cols - 29) / 2), j0: Math.floor((rows - 7) / 2) },
    bounds: { x0: OX * cell, y0: OY * cell, x1: OX * cell + VW, y1: OY * cell + VH }
  };
}
