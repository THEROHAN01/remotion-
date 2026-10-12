// Launch film for rohansalunkhe.dev. One page, two formats:
//   film.html?format=landscape  (1024×576 CSS, rendered at 1.875× → 1920×1080)
//   film.html?format=portrait   (432×768 CSS, rendered at 2.5× → 1080×1920)
// window.film = { duration, fps, seek(t) }. Every frame is a pure function of t.

import { laptopLayout, columnLayout } from "./layout.js";
import { runSim, FPS } from "./sim.js";
import { makeTimeline } from "./timeline.js";
import { drawWall, drawDead, makeLUTs, lutFill, BG, LINE, DEAD } from "./wall.js";
import { ART_EYES, artLid, CFG, GLYPHS, INTRO, cssEase, fillLUT, fbm, sm, clamp01 } from "./product.js";
import { spring, springA, enter, lerp, DUR, STAGGER } from "./motion.js";

const params = new URLSearchParams(location.search);
const FORMAT = params.get("format") === "portrait" ? "portrait" : "landscape";
const L = FORMAT === "portrait" ? columnLayout() : laptopLayout();
const laptop = L.mode === "laptop";
const DPR = devicePixelRatio || 1;
document.documentElement.classList.toggle("column-mode", !laptop);

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, attrs = {}, parent) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "style") Object.assign(n.style, v);
    else if (k === "text") n.textContent = v;
    else n.setAttribute(k, v);
  }
  if (parent) parent.appendChild(n);
  return n;
};

// ---------------------------------------------------------------- DOM -----
const viewport = el("div", { id: "viewport", style: { width: L.VW + "px", height: L.VH + "px" } }, document.body);
const camera = el("div", { id: "camera" }, viewport);
const site = el("div", { id: "site" }, camera);
const fx = el("canvas", { id: "fx", class: "film-canvas" }, viewport);
fx.width = L.VW * DPR; fx.height = L.VH * DPR;
fx.style.width = L.VW + "px"; fx.style.height = L.VH + "px";
const titles = el("div", { id: "titles" }, viewport);
const payoff = el("div", { id: "payoff" }, viewport);
const lockup = el("div", { id: "lockup" }, viewport);
const pointer = el("div", { id: "pointer" }, viewport);
pointer.innerHTML = `<svg viewBox="0 0 22 30" width="22" height="30"><path d="M2 2v22.5l6.2-5.6 4.1 9.2 3.9-1.7-4-9h8.4z" fill="#fff6e8" stroke="#060607" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const touch = el("div", { id: "touch" }, viewport);

const panesHTML = await (await fetch("src/panes.html")).text();
const holder = el("div", { style: { display: "none" } }, document.body);
holder.innerHTML = panesHTML;
const PANES = Object.fromEntries(Array.from(holder.querySelectorAll("article")).map(a => [a.id, a]));
const pane = id => PANES[id];
const about = pane("about"), kpoint = pane("kpoint"), projects = pane("projects"), jarvis = pane("project-jarvis");
$(".me-clock", about).textContent = "10:42 pm · tuesday";   // sample data (live India time on the site)

let wall, dead, drawerBody, detailBody, drawerEl, detailEl, columnEl, phoneEl;
const root = document.documentElement.style;

if (laptop) {
  site.style.width = L.VW + "px"; site.style.height = L.VH + "px";
  site.innerHTML = `
  <div id="stage"><div id="world">
    <div id="deck" class="show"><div id="strip"></div></div>
    <div id="drawer"><div id="drawer-body"></div></div>
    <div id="detail"><div id="detail-body"></div></div>
    <div id="frame" aria-hidden="true"><span class="frame-edge frame-top"></span><span class="frame-edge frame-right"></span><span class="frame-edge frame-bottom"></span><span class="frame-edge frame-left"></span></div>
  </div></div>`;
  const world = $("#world", site);
  wall = el("canvas", { id: "wall", class: "film-canvas" });
  world.insertBefore(wall, world.firstChild);
  dead = el("canvas", { id: "dead", class: "film-canvas" }, site);
  drawerEl = $("#drawer", site); detailEl = $("#detail", site);
  drawerBody = $("#drawer-body", site); detailBody = $("#detail-body", site);
  $("#strip", site).appendChild(about);
  for (const [k, v] of Object.entries({
    "--world-w": L.worldW + "px", "--pane-w": L.paneW + "px", "--pane-h": L.paneH + "px", "--pane-gap": "1px",
    "--pane-top": L.paneTop + "px", "--side-pad": L.sidePad + "px",
    "--drawer-left": L.sidePad + L.paneStride + "px", "--detail-left": L.sidePad + L.paneStride * 2 + "px", "--strip-x": "0px"
  })) root.setProperty(k, v);
  // preparePaneCloseControls(): titles get a label wrapper and a (hidden) close control.
  for (const [p, href, attr] of [[kpoint, "/", "data-close-drawer"], [projects, "/", "data-close-drawer"], [jarvis, "/projects", "data-close-detail"]]) {
    const heading = $(".name", p);
    const label = heading.textContent.trim();
    const title = el("span", { class: "title-label" });
    const link = $("a.title-link", heading);
    if (link) title.appendChild(link); else title.textContent = label;
    const close = el("a", { class: "pane-close", href, [attr]: "", "aria-label": "Close " + label }, title);
    close.appendChild(closeIcon());
    heading.replaceChildren(title);
  }
} else {
  site.style.width = L.worldW + "px"; site.style.height = L.worldH + "px";
  wall = el("canvas", { id: "wall", class: "film-canvas" }, site);
  dead = el("canvas", { id: "dead", class: "film-canvas" }, site);
  phoneEl = el("div", { id: "phone", style: { left: L.phone.x + "px", top: L.phone.y + "px", width: L.VW + "px", height: L.VH + "px" } }, site);
  phoneEl.innerHTML = `<div id="frame" aria-hidden="true"><span class="frame-edge frame-top"></span><span class="frame-edge frame-right"></span><span class="frame-edge frame-bottom"></span><span class="frame-edge frame-left"></span></div>`;
  // buildColumn(): hero, about, window, kpoint, window, projects; details sit under their links.
  columnEl = el("div", { id: "column" }, phoneEl);
  const windowBand = () => el("div", { class: "col-window", "aria-hidden": "true" });
  [about, kpoint, projects].forEach(p => p.classList.add("col-sec"));
  for (const a of projects.querySelectorAll("a[data-detail]")) {
    const d = pane(a.dataset.detail);
    if (!d) continue;
    d.classList.add("col-detail"); d.hidden = true;
    a.after(d);
  }
  columnEl.append(el("div", { class: "col-hero" }), about, windowBand(), kpoint, windowBand(), projects);
}
// syncWorkLinks()/syncDetailLinks(): link text sits in a .link-label span.
for (const a of document.querySelectorAll("#site a[data-work], #site a[data-go], #site a[data-detail]")) {
  const label = a.textContent.replace(/^\[|\]$/g, "");
  a.dataset.label = label;
  a.replaceChildren(el("span", { class: "link-label", text: label }));
}
function closeIcon() {
  const icon = el("span", { class: "close-icon", "aria-hidden": "true" });
  icon.innerHTML = '<svg viewBox="0 0 12 12"><path d="M4 4 8 8M8 4 4 8"/></svg>';
  return icon;
}

// Portrait art (loadPortraitArt()).
const portraitEl = $(".buddy-portrait", about);
const face = $(".buddy-face", about);
const sayEl = $(".buddy-say", about);
$(".buddy-art-base", about).src = "assets/me/rohan.webp";
$(".buddy-art-brow-l", about).src = "assets/me/rohan-brow-l.webp";
$(".buddy-art-brow-r", about).src = "assets/me/rohan-brow-r.webp";
["l", "r"].forEach((side, i) => {
  const eye = ART_EYES[i], pts = [];
  for (let x = eye.cx - 70; x <= eye.cx + 70; x += 7) pts.push(x.toFixed(1) + " " + artLid(eye, x).toFixed(1));
  $(`#buddy-lid-${side} path`, about).setAttribute("d", `M${pts.join(" L")} L${eye.cx + 70} ${eye.cy + 80} L${eye.cx - 70} ${eye.cy + 80} Z`);
});
portraitEl.hidden = false;
portraitEl.classList.add("in");
const pupils = Array.from(about.querySelectorAll(".art-pupil"));
const artInner = $(".buddy-art-inner", about);
const toast = $(".copy-toast", about);
toast.textContent = "copied. talk soon.";

// Fonts and images: load once, then measure layout once.
await Promise.all([
  document.fonts.load('400 16px "Geist"'), document.fonts.load('600 16px "Geist"'),
  document.fonts.load('400 16px "Geist Mono"'), document.fonts.load('400 16px "Instrument Serif"'),
  document.fonts.load('400 16px "Architects Daughter"')
]);
await document.fonts.ready;
await Promise.all(Array.from(document.querySelectorAll("#site img")).map(img => img.decode().catch(() => {})));

// ------------------------------------------------------------- anchors -----
const siteRect = () => site.getBoundingClientRect();
const rectOf = node => {
  const r = node.getBoundingClientRect(), s = siteRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height, cx: r.left - s.left + r.width / 2, cy: r.top - s.top + r.height / 2 };
};
const A = {};
if (laptop) {
  A.kpLink = rectOf($("a[data-work]", about));
  A.prLink = rectOf($("a[data-go=projects]", about));
  A.email = rectOf($(".copy-email", about));
  A.face = rectOf(face);
  // Measure the drawer and detail panes with them mounted, then reset.
  drawerEl.classList.add("open"); detailEl.classList.add("open");
  drawerBody.appendChild(kpoint);
  A.kpPara = rectOf(kpoint.querySelector(":scope > p:not(.name):not(.role)"));
  A.kpTitle = rectOf($(".name", kpoint));
  drawerBody.replaceChildren(projects);
  A.jvLink = rectOf($('a[data-detail="project-jarvis"]', projects));
  detailBody.appendChild(jarvis);
  A.jvPara = rectOf(jarvis.querySelector(":scope > p:not(.name)"));
  drawerBody.replaceChildren(); detailBody.replaceChildren();
  drawerEl.classList.remove("open"); detailEl.classList.remove("open");
} else {
  const ph = L.phone;
  const local = node => {
    const r = node.getBoundingClientRect(), c = columnEl.getBoundingClientRect();
    return { x: r.left - c.left, y: r.top - c.top + columnEl.scrollTop, w: r.width, h: r.height };
  };
  columnEl.scrollTop = 0;
  A.kpLink = local($("a[data-work]", about));
  A.prLink = local($("a[data-go=projects]", about));
  A.email = local($(".copy-email", about));
  A.face = local(face);
  A.colKpointTop = local(kpoint).y;
  A.colProjectsTop = local(projects).y;
  A.jvLink = local($('a[data-detail="project-jarvis"]', projects));
  A.colJarvisTop = A.jvLink.y;
  A.kpPara = local(kpoint.querySelector(":scope > p:not(.name):not(.role)"));
  const jvDetail = pane("project-jarvis");
  jvDetail.hidden = false;
  A.jvPara = local(jvDetail.querySelector(":scope > p:not(.name)"));
  const heightOpen = columnEl.scrollHeight;
  jvDetail.hidden = true;
  const heightClosed = columnEl.scrollHeight;
  A.colMaxScroll = open => (open ? heightOpen : heightClosed) - L.VH;
  A.phone = ph;
}
A.layout = L;

// --------------------------------------------------------- timeline + sim -
const TL = makeTimeline(L, A, FORMAT);
const SIM = runSim(L, TL, A);
const lutAt = makeLUTs(SIM.lutEvents);
// Hue LUT of the default palette, for the wordmark tiles (same colouring as the name intro).
const baseLUT = new Uint8ClampedArray(512 * 3);
fillLUT(baseLUT, CFG.palette);
const wordFill = (hue, b = 1) => {
  const idx = (hue * 512) | 0, m2 = ((b * 63 | 0) + 0.5) / 64, o = idx * 3;
  return `rgb(${baseLUT[o] * m2 | 0},${baseLUT[o + 1] * m2 | 0},${baseLUT[o + 2] * m2 | 0})`;
};

// Hook headline.
const headlineEls = TL.headline.lines.map((words, li) => {
  const line = el("div", { class: "headline" }, titles);
  line.style.fontSize = TL.headline.size + "px";
  line.style.top = TL.headline.top + li * TL.headline.size * 1.02 + "px";
  return words.map(([word, at]) => {
    const w = el("span", { class: "w", text: word }, line);
    line.appendChild(document.createTextNode(" "));
    return { w, at };
  });
});

// Payoff bubble and lockup text.
const bubble = el("p", { class: "payoff-bubble", text: "" }, payoff);
const lockEls = TL.lockup.lines.map(ln => {
  const n = el("div", { class: "lock-line " + ln.cls, text: ln.text }, lockup);
  n.style.fontSize = ln.size + "px";
  n.style.top = ln.top + "px";
  return { n, ...ln };
});

// ------------------------------------------------------------ rendering ---
const wctx = wall.getContext("2d"), dctx = dead.getContext("2d"), fctx = fx.getContext("2d");
let shownDrawer = "", shownDetail = "";

function placeCanvas(c, view, z) {
  // Canvas covers exactly the visible site rect; its backing store is at output resolution.
  c.style.left = view.x0 + "px"; c.style.top = view.y0 + "px";
  c.style.width = (view.x1 - view.x0) + "px"; c.style.height = (view.y1 - view.y0) + "px";
  const w = Math.round((view.x1 - view.x0) * z * DPR), h = Math.round((view.y1 - view.y0) * z * DPR);
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  const ctx = c.getContext("2d");
  ctx.setTransform(z * DPR, 0, 0, z * DPR, -view.x0 * z * DPR, -view.y0 * z * DPR);
  ctx.clearRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);
}

function setLinkActive(a, active) {
  const icon = a.querySelector(":scope > .close-icon");
  if (active && !icon) a.appendChild(closeIcon());
  else if (!active && icon) icon.remove();
  a.classList.toggle("is-on", active);
}

function seek(t) {
  const n = Math.max(0, Math.min(SIM.N - 1, Math.round(t * FPS)));
  t = n / FPS;
  const S = SIM.frames[n];

  // Camera: one transform, computed from t.
  const cam = TL.cameraAt(t);
  const z = cam.z;
  let tx = L.VW / 2 - cam.cx * z, ty = L.VH / 2 - cam.cy * z;
  const B = TL.cameraBounds(t);
  tx = Math.min(-B.x0 * z, Math.max(L.VW - B.x1 * z, tx));
  ty = Math.min(-B.y0 * z, Math.max(L.VH - B.y1 * z, ty));
  camera.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;
  const view = { x0: -tx / z, y0: -ty / z, x1: (L.VW - tx) / z, y1: (L.VH - ty) / z };
  const toView = (x, y) => ({ x: x * z + tx, y: y * z + ty });

  // Wall and dead layer.
  placeCanvas(wall, view, z);
  drawWall(wctx, L, S, SIM.intro, lutAt(t), view, { boot: TL.boot, phoneAmt: TL.phoneAmt(t) });
  placeCanvas(dead, view, z);
  const deadOn = drawDead(dctx, L, S, view, TL.boot);
  dead.style.display = deadOn ? "" : "none";

  // Site UI revealed by the opening splash (it was "off" during the hook).
  const ui = laptop ? $("#deck", site) : columnEl;
  ui.style.visibility = S.openT < 0 ? "hidden" : "";
  if (laptop) {
    $("#frame", site).style.visibility = S.openT < 0 ? "hidden" : "";
    renderPanes(S);
  } else {
    renderColumn(S, t);
  }
  renderBuddy(S, t);

  // Headline (hook), masked away by the opening splash.
  const boot = TL.boot;
  const splashR = S.openT < 0 ? -1 : sm(S.openT / CFG.revealIn) * boot.maxD * L.cell * z;
  const c = toView(boot.si * L.cell + L.cell / 2, boot.sj * L.cell + L.cell / 2);
  titles.style.display = t < TL.bootT + CFG.revealIn ? "" : "none";
  for (const line of headlineEls) for (const { w, at } of line) {
    const u = enter(t, at, DUR.mid);
    w.style.opacity = u;
    w.style.transform = `translateY(${(1 - u) * 0.32}em)`;
  }
  if (splashR > 0) {
    const soft = 3 * L.cell * z;
    titles.style.webkitMaskImage = titles.style.maskImage =
      `radial-gradient(circle at ${c.x}px ${c.y}px, transparent ${Math.max(0, splashR - soft)}px, black ${splashR + soft}px)`;
  } else titles.style.webkitMaskImage = titles.style.maskImage = "none";

  renderPointer(t, toView);
  renderPayoffAndSignoff(t, S, toView, z);
}

function renderPanes(S) {
  // Drawer layers (mountDrawer / startDrawerSwitch).
  const key = S.drawerLayers.map(l => l.id).join("+");
  if (key !== shownDrawer) {
    drawerBody.replaceChildren(...S.drawerLayers.map(l => (l.id === "kpoint" ? kpoint : projects)));
    shownDrawer = key;
  }
  drawerEl.classList.toggle("open", !!S.drawerId);
  for (const l of S.drawerLayers) {
    const node = l.id === "kpoint" ? kpoint : projects;
    if (l.clip && S.switches.length) {
      const sw = S.switches[0];
      const cutRows = TL.switchBandCenter(sw.vis) - 1;
      const cutPx = Math.max(0, Math.min(L.paneH, cutRows * L.cell));
      node.style.clipPath = "inset(0 0 " + Math.max(0, L.paneH - cutPx) + "px 0)";
    } else node.style.clipPath = "";
  }
  const dKey = S.detailId || "";
  if (dKey !== shownDetail) { detailBody.replaceChildren(...(S.detailId ? [jarvis] : [])); shownDetail = dKey; }
  detailEl.classList.toggle("open", !!S.detailId);
  // Active links and hint marker.
  setLinkActive($("a[data-work]", about), S.workLocked && S.workId === "kpoint");
  setLinkActive($("a[data-go=projects]", about), S.drawerId === "projects" && S.paneIntentOpen);
  setLinkActive($('a[data-detail="project-jarvis"]', projects), S.detailIntentOpen && S.detailId === "project-jarvis");
  $("a[data-work]", about).classList.toggle("hint-glow", S.hint === "experience");
  $("a[data-go=projects]", about).classList.toggle("hint-glow", S.hint === "projects");
  $('a[data-detail="project-jarvis"]', projects).classList.toggle("hint-glow", S.hint === "pick");
}

function renderColumn(S, t) {
  columnEl.scrollTop = S.colScroll;
  // Film: the column stays below the frame while the wall shows the wordmark, then rises into place.
  const rise = spring(clamp01((t - TL.T.columnRise) / DUR.long));
  columnEl.style.transform = rise >= 1 ? "" : `translateY(${(1 - rise) * L.VH}px)`;
  const d = pane("project-jarvis");
  const open = S.colDetailOpen === "project-jarvis";
  d.hidden = !open;
  $('a[data-detail="project-jarvis"]', projects).setAttribute("aria-expanded", open ? "true" : "false");
  for (const a of projects.querySelectorAll("a[data-detail]")) if (a.dataset.detail !== "project-jarvis") a.setAttribute("aria-expanded", "false");
  $("a[data-work]", about).classList.toggle("hint-glow", S.hint === "experience");
  $("#frame", phoneEl).style.opacity = TL.phoneAmt(t);
}

function renderBuddy(S, t) {
  const f = S.face;
  const lx = Math.max(-1, Math.min(1, f.x)), ly = Math.max(-1, Math.min(1, f.y));
  ART_EYES.forEach((eye, k) => {
    const x = eye.cx + eye.min + (eye.max - eye.min) * (lx + 1) / 2;
    const ry = Math.max(0.5, eye.r * f.open);
    const top = artLid(eye, x) + (eye.cy - artLid(eye, eye.cx)) - eye.r + 7 * ly;
    const p = pupils[k];
    p.setAttribute("cx", x.toFixed(2)); p.setAttribute("cy", (top + ry).toFixed(2));
    p.setAttribute("rx", String(eye.r)); p.setAttribute("ry", ry.toFixed(2));
  });
  artInner.style.setProperty("--lean", (1.4 * (lx - 0.85)).toFixed(3) + "deg");
  const mood = f.mood || {};
  face.setAttribute("data-mouth", mood.mouth || "rest");
  // The site animates these with CSS transitions; evaluated here as functions of t.
  // Blush: opacity 0.6 s ease-out. Brows ("up"): translateY(-1.4%) over 0.55 s cubic-bezier(0.34, 1.56, 0.64, 1).
  const easeOut = u => 1 - (1 - u) * (1 - u);
  const bl = f.blush, br = f.brows;
  const blushU = bl.on ? easeOut(clamp01((t - bl.onAt) / 0.6)) : 1 - easeOut(clamp01((t - bl.offAt) / 0.6));
  $(".art-blush", about).style.opacity = bl.onAt < 0 && !bl.on ? 0 : blushU;
  const browU = br.on ? backOut(clamp01((t - br.onAt) / 0.55)) : 1 - backOut(clamp01((t - br.offAt) / 0.55));
  const browY = (br.onAt < 0 && !br.on ? 0 : browU) * -1.4;
  for (const b of about.querySelectorAll(".buddy-art-brow")) b.style.transform = `translateY(${browY}%)`;
  // Speech bubble: .on transitions opacity/transform over 0.18 s.
  const s = S.say;
  const u = s.on ? cssEase(clamp01((t - s.onAt) / 0.18)) : 1 - cssEase(clamp01((t - s.offAt) / 0.18));
  sayEl.textContent = s.text;
  sayEl.classList.toggle("hint", s.hint);
  sayEl.style.opacity = TL.hideRealBubble(t) ? 0 : u;
  sayEl.style.transform = u >= 1 ? "none" : `translateY(${(1 - u) * 4}px) scale(${0.96 + 0.04 * u})`;
  // Copy toast: opacity 0.6 and translateX(-4px → 0) over 0.25 s.
  const tu = t < S.toast.onAt ? 0 : t < S.toast.offAt ? cssEase(clamp01((t - S.toast.onAt) / 0.25)) : 1 - cssEase(clamp01((t - S.toast.offAt) / 0.25));
  toast.style.opacity = 0.6 * tu;
  toast.style.transform = `translateX(${-4 * (1 - tu)}px)`;
}

function renderPointer(t, toView) {
  const p = TL.pointerAt(t);
  const isTouch = !laptop;
  pointer.style.display = !isTouch && p.visible ? "" : "none";
  touch.style.display = isTouch && p.visible ? "" : "none";
  const v = toView(p.x, p.y);
  if (!isTouch) {
    pointer.style.opacity = p.alpha;
    pointer.style.transform = `translate(${v.x - 2}px, ${v.y - 2}px) scale(${1.15 * p.press})`;
  } else {
    touch.style.opacity = p.alpha;
    touch.style.transform = `translate(${v.x}px, ${v.y}px) scale(${p.press})`;
  }
}

function renderPayoffAndSignoff(t, S, toView, z) {
  const P = TL.payoff;
  // Real bubble position in viewport space (top-right of the portrait).
  const sayR = sayEl.getBoundingClientRect();
  const vpR = viewport.getBoundingClientRect();
  const real = { x: sayR.left - vpR.left, y: sayR.top - vpR.top, w: sayR.width, h: sayR.height };

  // Scene dims behind the payoff line (it stays visible; the sign-off grid covers it).
  const dimU = enter(t, P.grow, DUR.long);
  camera.style.opacity = String(1 - 0.8 * dimU);

  fctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  fctx.clearRect(0, 0, L.VW, L.VH);
  const W = TL.wordmark;

  // Sign-off grid: unlit tiles spread over the scene from the payoff bubble, tile by tile.
  if (t >= P.signoff) {
    const cellPx = W.cell, tilePx = W.tile;
    const fillR = spring(clamp01((t - P.signoff) / DUR.long)) * Math.hypot(L.VW, L.VH) * 1.05;
    const c0 = { x: L.VW / 2, y: P.y };
    for (let y = W.gridY0 - cellPx; y < L.VH + cellPx; y += cellPx) {
      for (let x = W.gridX0 - cellPx; x < L.VW + cellPx; x += cellPx) {
        const d = Math.hypot(x + tilePx / 2 - c0.x, y + tilePx / 2 - c0.y);
        const jag = (fbm(x * 0.02, y * 0.02, 5.7) - 0.5) * cellPx * 5;
        const a = clamp01((fillR - d + jag) / (cellPx * 2.5));
        if (a <= 0) continue;
        fctx.fillStyle = BG; fctx.fillRect(x, y, cellPx, cellPx);
        fctx.globalAlpha = a;
        fctx.fillStyle = DEAD; fctx.fillRect(x, y, tilePx, tilePx);
        fctx.globalAlpha = 1;
      }
    }
  }

  if (t >= P.type && t < P.signoff + DUR.mid + 0.05) {
    payoff.style.display = "";
    const text = P.text.slice(0, Math.max(1, Math.floor((t - P.type) / 0.048) + 1));
    bubble.textContent = text;
    // Lift off the card (anticipation), then grow into the headline (shared element).
    const g = springA(clamp01((t - P.grow) / DUR.long));
    // Keeps drifting forward slowly once it has landed, so the hold isn't frozen.
    const hold = clamp01((t - P.grow - DUR.long) / 1.2);
    const fs = lerp(14 * z, P.size, g) * (1 + 0.035 * hold);
    bubble.style.fontSize = fs + "px";
    bubble.style.padding = `${0.43 * fs}px ${0.86 * fs}px ${0.36 * fs}px`;
    const w = bubble.offsetWidth, h = bubble.offsetHeight;
    let x = lerp(real.x, (L.VW - w) / 2, g), y = lerp(real.y, P.y - h / 2, g);
    // Sign-off: the bubble collapses into the wordmark's first tile (shape morph).
    const m = spring(clamp01((t - P.signoff) / DUR.mid));
    const first = W.tiles[0];
    const sx = lerp(1, W.tile / w, m), sy = lerp(1, W.tile / h, m);
    x = lerp(x, first.x, m); y = lerp(y, first.y, m);
    const r = 1 - m;
    bubble.style.borderRadius = `${r * 0.29 * fs}px ${r * fs}px ${r * fs}px ${r * fs}px`;
    bubble.style.color = m > 0 ? `rgba(6,6,7,${1 - Math.min(1, m * 3)})` : "";
    bubble.style.background = m > 0 ? mixColor("#fff6e8", wordFill(first.hue), m) : "";
    bubble.style.transform = `translate(${x}px, ${y}px) scale(${sx}, ${sy})`;
  } else payoff.style.display = "none";

  // Tiles leave the unlit grid, light up and stream into ROHAN; the finished
  // wordmark keeps the wall's own shimmer (the site's fbm brightness field).
  if (t >= P.signoff) {
    const tilePx = W.tile;
    const wt = (t - TL.bootT) * 1.3675;
    for (let k = 0; k < W.tiles.length; k++) {
      const tl = W.tiles[k];
      if (t < tl.at) continue;
      const u = k === 0 ? 1 : springA(clamp01((t - tl.at) / DUR.long));
      const lockU = spring(clamp01((t - P.lockup) / DUR.long));
      const x = lerp(lerp(tl.sx, tl.x, u), tl.lx, lockU), y = lerp(lerp(tl.sy, tl.y, u), tl.ly, lockU);
      const gi = Math.round(tl.x / W.cell), gj = Math.round(tl.y / W.cell);
      let b = fbm(gi * CFG.waveScale + wt * CFG.waveDriftX, gj * CFG.waveScale + wt * CFG.waveDriftY, wt * CFG.waveEvolve + 47.1);
      b = 0.86 + 0.14 * b;
      const land = clamp01((t - tl.at - DUR.long * 0.5) / 0.22);
      const pop = k === 0 ? 1 : 1 + 0.14 * Math.sin(Math.PI * land);
      fctx.fillStyle = mixColor(DEAD, wordFill(tl.hue, b), clamp01((t - tl.at) / 0.2));
      fctx.fillRect(x + tilePx * (1 - pop) / 2, y + tilePx * (1 - pop) / 2, tilePx * pop, tilePx * pop);
    }
    lockup.style.display = "";
    // Lockup lines ride up with the wordmark as one group, so they never cross it.
    const ride = (1 - spring(clamp01((t - P.lockup) / DUR.long))) * TL.wordmark.rise;
    for (const ln of lockEls) {
      const u = enter(t, ln.at, DUR.mid);
      ln.n.style.opacity = u;
      ln.n.style.transform = `translateY(${(1 - u) * 14 + ride}px)`;
    }
  } else lockup.style.display = "none";
}

// cubic-bezier(0.34, 1.56, 0.64, 1), solved numerically.
function backOut(u) {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  let lo = 0, hi = 1;
  for (let k = 0; k < 24; k++) {
    const s = (lo + hi) / 2;
    const bx = 3 * (1 - s) * (1 - s) * s * 0.34 + 3 * (1 - s) * s * s * 0.64 + s * s * s;
    if (bx < u) lo = s; else hi = s;
  }
  const s = (lo + hi) / 2;
  return 3 * (1 - s) * (1 - s) * s * 1.56 + 3 * (1 - s) * s * s * 1 + s * s * s;
}

function mixColor(a, b, u) {
  const pa = parseColor(a), pb = parseColor(b);
  return `rgb(${pa.map((v, k) => Math.round(v + (pb[k] - v) * u)).join(",")})`;
}
function parseColor(c) {
  if (c.startsWith("#")) return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  return c.match(/[\d.]+/g).slice(0, 3).map(Number);
}

window.film = { duration: TL.duration, fps: FPS, frames: SIM.N, seek, format: FORMAT, size: [L.VW, L.VH], cues: TL.cues };
window.filmReady = true;
