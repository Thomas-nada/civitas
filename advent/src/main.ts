import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/figtree/index.css";
import "./style.css";
import { doorIcon } from "./art";
// Official Cardano starburst, from https://cardano.org/brand-assets/ (white on Cardano blue, unaltered)
import STARBURST from "./assets/cardano-starburst-white.svg?raw";
import { CAL_YEAR, NETWORKS, type Net, getOpened, isUnlocked, markOpened, peekOn, resetOpened, setNetwork, state, store } from "./config";
import { DOORS, KIND_LABEL, type Door } from "./doors";
import { renderTree } from "./doors/late";
import { mountScene } from "./scene";
import { initSound } from "./sound";
import { $, errorBox, errorMsg, esc } from "./ui";
import { connect, disconnect, installedWallets, loadMesh, networkMismatch, tryReconnect, wallet } from "./wallet";
import { SyncUnavailable, isLinked, pushSoon, syncProgress } from "./progress";

// Classic advent calendars scatter the numbers. Fixed so it looks the same every visit.
const ORDER = [7, 15, 2, 21, 10, 4, 18, 12, 1, 23, 9, 14, 5, 20, 3, 17, 24, 8, 13, 6, 19, 11, 22, 16];

const NET_LABEL: Record<Net, string> = { mainnet: "Mainnet", preprod: "Preprod", preview: "Preview" };
const FAUCET = "https://docs.cardano.org/cardano-testnets/tools/faucet";
const FREE_DOORS = DOORS.filter((d) => d.kind === "read").length;

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const app = document.getElementById("app")!;

// ---------------------------------------------------------------- small drawn icons

const ic = (d: string) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  x: ic(`<path d="M6 6l12 12M18 6 6 18"/>`),
  prev: ic(`<path d="M15 5l-7 7 7 7"/>`),
  next: ic(`<path d="M9 5l7 7-7 7"/>`),
  wallet: ic(`<path d="M4 7.5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM4 7.5V7a2 2 0 0 1 2-2h10"/><circle cx="16" cy="13" r="1.3" fill="currentColor" stroke="none"/>`),
  sound: ic(`<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z"/><path class="waves" d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/><path class="slash" d="M16 9.5l5 5M21 9.5l-5 5"/>`),
  star: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`,
};

/** The Cardano starburst, with a plain fallback so the header never ends up empty. */
function mark(): string {
  try {
    if (!STARBURST.startsWith("<svg")) throw new Error("no logo");
    return STARBURST.replace("<svg ", `<svg aria-hidden="true" focusable="false" `);
  } catch {
    return ic(`<path d="M12 4 6.5 20M12 4l5.5 16M5 11.5h14M5 15h14"/>`);
  }
}
function icon(day: number): string {
  try {
    return doorIcon(day);
  } catch {
    return `<span class="emo">${esc(DOORS[day - 1]?.emoji ?? "")}</span>`;
  }
}
/** Wallet icons come from the wallet extension: only image data URIs or https are let through. */
const iconImg = (src: string | undefined, cls = "") =>
  src && /^(data:image\/|https:\/\/)/i.test(src) ? `<img${cls ? ` class="${cls}"` : ""} src="${esc(src)}" alt="">` : "";

// ---------------------------------------------------------------- page

app.innerHTML = `
  <header class="top">
    <div class="brand">
      <span class="logo" id="mark">${mark()}</span>
      <div class="titles">
        <h1>Cardano <b>Advent</b> <span class="yr">${CAL_YEAR}</span></h1>
        <span class="chip netchip" id="netchip" hidden></span>
      </div>
    </div>
    <div class="controls">
      <input type="range" class="vol" id="vol" min="0" max="100" step="5" aria-label="Volume" hidden>
      <button type="button" class="iconbtn" id="sound" aria-label="Sound" aria-pressed="false" title="Sound">${I.sound}</button>
      <button type="button" class="wbtn" id="wbtn"></button>
    </div>
  </header>
  <p class="tagline"><b>One door a day until Christmas.</b> Each opens onto the live Cardano blockchain.</p>
  <div class="intro" id="intro" hidden>
    <p>${FREE_DOORS} of the 24 doors need no wallet. Doing everything costs about 1 ADA in network fees.</p>
    <button type="button" class="iconbtn" id="intro-x" aria-label="Dismiss">${I.x}</button>
  </div>
  <div id="banner"></div>
  <div id="scene"></div>
  <main><div class="calendar" id="cal"></div></main>
  <footer>
    <p class="muted small">Chain data via <a href="https://koios.rest" target="_blank" rel="noopener">Koios</a> · transactions built with <a href="https://meshjs.dev" target="_blank" rel="noopener">Mesh</a> · your keys never leave your wallet.</p>
    ${import.meta.env.DEV ? `<p class="devnote">dev mode: all doors unlocked · <button type="button" class="linkbtn" id="dev-reset">Reset opened doors</button></p>` : peekOn() ? `<p class="devnote">peek mode: all doors unlocked</p>` : ""}
  </footer>
  <dialog class="modal" id="modal" aria-labelledby="mtitle">
    <div class="sheet" tabindex="-1" autofocus>
      <header class="mbar">
        <div class="mtop">
          <div class="chips" id="mchips"></div>
          <div class="mctl">
            <button type="button" class="iconbtn" id="prev" aria-label="Previous door">${I.prev}</button>
            <button type="button" class="iconbtn" id="next" aria-label="Next door">${I.next}</button>
            <button type="button" class="iconbtn" data-close aria-label="Close">${I.x}</button>
          </div>
        </div>
        <div class="mhead">
          <span class="mhero" id="mhero" aria-hidden="true"></span>
          <div class="mtext"><h2 id="mtitle"></h2><p class="mteaser" id="mteaser"></p></div>
        </div>
      </header>
      <div id="mbody"></div>
    </div>
  </dialog>
  <dialog class="modal" id="wmodal" aria-labelledby="wtitle">
    <div class="sheet narrow" tabindex="-1" autofocus>
      <header class="mbar"><div class="mtop"><h3 id="wtitle"></h3><div class="mctl"><button type="button" class="iconbtn" data-close aria-label="Close">${I.x}</button></div></div></header>
      <div id="wbody"></div>
    </div>
  </dialog>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>`;

const cal = $(app, "#cal");
const mdlg = $<HTMLDialogElement>(app, "#modal");
const wdlg = $<HTMLDialogElement>(app, "#wmodal");
const toastEl = $(app, "#toast");
const topDialog = () => (wdlg.open ? wdlg : mdlg.open ? mdlg : null);

// ---------------------------------------------------------------- toast

let toastTimer: number | undefined;
function toast(msg: string) {
  // A modal dialog sits in the top layer and makes the rest of the page inert, so the
  // toast has to live inside whichever dialog is on top to be seen and announced.
  const host = topDialog() ?? app;
  if (toastEl.parentElement !== host) host.appendChild(toastEl);
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("show"), 3800);
}

// ---------------------------------------------------------------- snow

/**
 * Two canvases: the snowfall behind the page and a thin "fx" layer in front of it for the
 * gold specks that fly out of a door. The loop stops while the tab is hidden, and the
 * snowfall freezes while a dialog is open (a blurred backdrop over a moving canvas is
 * expensive on cheap phones).
 */
function snow() {
  const TAU = Math.PI * 2;
  const mk = (cls: string) => {
    const c = document.createElement("canvas");
    c.className = cls;
    c.setAttribute("aria-hidden", "true");
    return c;
  };
  const back = mk("snow");
  const fx = mk("snow fx");
  document.body.prepend(back);
  document.body.append(fx);
  const ctx = back.getContext("2d")!;
  const fctx = fx.getContext("2d")!;
  const still = reduceMotion.matches;

  type Speck = { x: number; y: number; vx: number; vy: number; r: number; gold: boolean };
  let flakes: { x: number; y: number; r: number; s: number; d: number }[] = [];
  let bursts: { t0: number; specks: Speck[] }[] = [];
  let W = 0;
  let H = 0;
  let raf = 0;
  let last = 0;
  let paused = false;
  let fxDirty = false;
  let adaUntil = 0;

  function drawFlakes(dt: number, now: number) {
    ctx.clearRect(0, 0, W, H);
    const glyph = now < adaUntil;
    ctx.beginPath();
    for (const f of flakes) {
      f.y += f.s * dt;
      f.d += 0.01 * dt;
      f.x += Math.sin(f.d) * 0.4 * dt;
      if (f.y > H + 12) (f.y = -12), (f.x = Math.random() * W);
      if (glyph) {
        // a tiny ₳: two legs and two bars
        const h = 3 + f.r * 2.4;
        ctx.moveTo(f.x - h * 0.62, f.y + h);
        ctx.lineTo(f.x, f.y - h);
        ctx.lineTo(f.x + h * 0.62, f.y + h);
        ctx.moveTo(f.x - h * 0.82, f.y + h * 0.05);
        ctx.lineTo(f.x + h * 0.82, f.y + h * 0.05);
        ctx.moveTo(f.x - h * 0.82, f.y + h * 0.48);
        ctx.lineTo(f.x + h * 0.82, f.y + h * 0.48);
      } else {
        ctx.moveTo(f.x + f.r, f.y);
        ctx.arc(f.x, f.y, f.r, 0, TAU);
      }
    }
    if (glyph) {
      ctx.strokeStyle = "rgba(255,255,255,.85)";
      ctx.lineWidth = 1.3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    } else {
      ctx.fillStyle = "rgba(255,255,255,.8)";
      ctx.fill();
    }
  }

  const LIFE = 850;
  function drawBursts(dt: number, now: number) {
    fctx.clearRect(0, 0, W, H);
    fxDirty = false;
    bursts = bursts.filter((b) => now - b.t0 < LIFE);
    for (const b of bursts) {
      const k = 1 - (now - b.t0) / LIFE;
      fctx.globalAlpha = Math.max(0, Math.min(1, k * 1.4));
      for (const gold of [true, false]) {
        fctx.beginPath();
        for (const s of b.specks) {
          if (s.gold !== gold) continue;
          const r = s.r * (0.45 + k * 0.55);
          fctx.moveTo(s.x + r, s.y);
          fctx.arc(s.x, s.y, r, 0, TAU);
        }
        fctx.fillStyle = gold ? "#ffd166" : "#fffaf0";
        fctx.fill();
      }
      for (const s of b.specks) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 0.14 * dt;
        s.vx *= 0.985;
      }
      fxDirty = true; // needs one more clear after the last speck fades
    }
    fctx.globalAlpha = 1;
  }

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(3, (now - last) / 16.7) || 1;
    last = now;
    if (!paused) drawFlakes(dt, now);
    if (bursts.length || fxDirty) drawBursts(dt, now);
    kick();
  }
  function kick() {
    if (raf || still || document.hidden) return;
    if (paused && !bursts.length && !fxDirty) return;
    raf = requestAnimationFrame((t) => {
      if (!last) last = t;
      frame(t);
    });
  }

  function fit() {
    const w = innerWidth;
    const h = innerHeight;
    if (w !== W) {
      // a real resize or a rotation: start the sky over
      W = back.width = fx.width = w;
      H = back.height = fx.height = h;
      flakes = Array.from({ length: Math.min(160, Math.floor(W / 9)) }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.8 + Math.random() * 2.4,
        s: 0.3 + Math.random() * 0.9,
        d: Math.random() * TAU,
      }));
    } else if (h > H) {
      // only the height grew (a phone's URL bar slid away): keep every flake where it is
      H = back.height = fx.height = h;
    } else return;
    if (still || paused) drawFlakes(0, performance.now()); // sizing a canvas wipes it
  }
  fit();
  addEventListener("resize", fit);
  document.addEventListener("visibilitychange", () => {
    last = 0;
    kick();
  });
  if (still) drawFlakes(0, 0);
  kick();

  return {
    /** Freeze / resume the snowfall (specks already in flight still finish). */
    pause(on: boolean) {
      paused = on;
      last = 0;
      kick();
    },
    /** A puff of gold and white specks at viewport point (x, y). */
    burst(x: number, y: number, n = 12) {
      if (still) return;
      bursts.push({
        t0: performance.now(),
        specks: Array.from({ length: n }, (_, i) => {
          const a = Math.random() * TAU;
          const v = 1.4 + Math.random() * 3.6;
          return { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.6, r: 1.4 + Math.random() * 2.2, gold: i % 3 !== 0 };
        }),
      });
      kick();
    },
    /** Easter egg: the flakes become tiny ₳ for a while. */
    ada(ms: number) {
      adaUntil = performance.now() + ms;
      if (still || paused) {
        drawFlakes(0, performance.now());
        setTimeout(() => (still || paused) && drawFlakes(0, performance.now()), ms + 50);
      }
    },
  };
}
const sky = snow();

// ---------------------------------------------------------------- calendar grid

const dayStart = (day: number) => new Date(CAL_YEAR, 11, day).getTime();

/** Today's door number, or 0 outside Dec 1 to 24 of the calendar's year. */
function todayDoor(): number {
  const n = new Date();
  return n.getFullYear() === CAL_YEAR && n.getMonth() === 11 && n.getDate() <= 24 ? n.getDate() : 0;
}

const doorEls = new Map<number, HTMLButtonElement>();

// Paper pattern and colour both come from the day number, never from the grid position,
// so the mix looks the same with 4, 6 or 8 columns. Days 16+ shift the colour by one so
// that days 15 apart (same pattern) never share a colour too.
const paper = (day: number) => `p${day % 5} c${(day * 7 + Math.floor((day - 1) / 15)) % 3}`;

function buildCalendar() {
  cal.innerHTML = ORDER.map(
    (day) =>
      `<button type="button" class="door ${paper(day)}${day === 24 ? " big" : ""}" data-day="${day}">` +
      `<span class="inside" aria-hidden="true"></span>` +
      `<span class="front" aria-hidden="true"><span class="num">${day}</span></span>` +
      `<span class="cap" aria-hidden="true"></span>` +
      `<span class="ribbon" aria-hidden="true">today</span>` +
      `<span class="star" aria-hidden="true">${I.star}</span>` +
      `</button>`,
  ).join("");
  cal.querySelectorAll<HTMLButtonElement>(".door").forEach((b) => doorEls.set(Number(b.dataset.day), b));
}

/** Bring every door's classes and label up to date, in place (focus and hover survive). */
function syncDoors() {
  const opened = getOpened();
  const today = todayDoor();
  const now = Date.now();
  for (const [day, b] of doorEls) {
    const d = DOORS[day - 1];
    const unlocked = isUnlocked(day);
    const open = unlocked && !!opened[day];
    // Opened on its own day: a gold star. Left waiting after its day: snow settles on top.
    const at = open ? new Date(opened[day]) : null;
    const onDay = !!at && at.getFullYear() === CAL_YEAR && at.getMonth() === 11 && at.getDate() === day;
    const missed = unlocked && !open && now >= dayStart(day + 1) ? Math.floor((now - dayStart(day)) / 86_400_000) : 0;

    b.classList.toggle("locked", !unlocked);
    b.classList.toggle("open", open);
    b.classList.toggle("today", day === today);
    b.classList.toggle("onday", onDay);
    b.classList.toggle("missed", missed > 0);
    if (missed > 0) b.style.setProperty("--cap", `${Math.min(14, 4 + missed * 2)}px`);
    else b.style.removeProperty("--cap");

    // What is behind a door is only put in the page once the door can be opened.
    const inside = b.firstElementChild as HTMLElement;
    if (unlocked && !inside.firstChild && d)
      inside.innerHTML = `<span class="ico">${icon(day)}</span><span class="t">${esc(d.title)}</span>`;

    const label = !unlocked
      ? `Door ${day}, locked until December ${day}`
      : open
        ? `Door ${day}, ${d?.title ?? ""}, opened`
        : `Door ${day}${day === today ? ", today's door" : ""}, not opened yet`;
    if (b.getAttribute("aria-label") !== label) b.setAttribute("aria-label", label);
  }
}

function knock(day: number, reveal = false) {
  const b = doorEls.get(day);
  if (b) {
    if (reveal) b.scrollIntoView({ block: "center" });
    b.classList.remove("shake");
    void b.offsetWidth; // restart the animation
    b.classList.add("shake");
  }
  const days = Math.ceil((dayStart(day) - Date.now()) / 86_400_000);
  toast(`Door ${day} opens on December ${day}.${days === 1 ? " One more sleep." : days > 1 ? ` ${days} more sleeps.` : ""}`);
  window.dispatchEvent(new CustomEvent("door-locked", { detail: { day } }));
}

/** Record the visit, light the tile and tell the scene and the sound. True on the first visit. */
function visit(day: number): boolean {
  const first = markOpened(day);
  syncDoors();
  if (first) pushSoon(wallet); // remember it for this wallet's other devices
  window.dispatchEvent(new CustomEvent("door-opened", { detail: { day, first } }));
  return first;
}

let swing = 0; // timer while a door leaf is swinging open
function onDoor(day: number, btn: HTMLElement) {
  if (swing) return;
  if (!isUnlocked(day)) return knock(day);
  const first = visit(day);
  if (first && !reduceMotion.matches) {
    // The leaf swings (CSS, ~520ms) and light comes up inside; the sheet follows out of the doorway.
    const r = btn.getBoundingClientRect();
    sky.burst(r.left + r.width / 2, r.top + r.height / 2, 12);
    swing = window.setTimeout(() => {
      swing = 0;
      present(DOORS[day - 1], btn);
    }, 380);
  } else present(DOORS[day - 1], btn);
}

cal.addEventListener("click", (e) => {
  const b = (e.target as Element).closest<HTMLButtonElement>(".door");
  if (b) onDoor(Number(b.dataset.day), b);
});
cal.addEventListener("pointerdown", (e) => {
  const b = (e.target as Element).closest<HTMLElement>(".door");
  if (!b || b.classList.contains("locked")) return;
  b.classList.add("press");
  const up = () => {
    b.classList.remove("press");
    removeEventListener("pointerup", up);
    removeEventListener("pointercancel", up);
  };
  addEventListener("pointerup", up);
  addEventListener("pointercancel", up);
});

// Desktop "lantern": a soft light follows the pointer and makes the foil numerals glint.
// The calendar carries the pointer position (--mx/--my); each door carries its own offset
// (--ox/--oy), so the CSS can place one shared highlight inside every door.
function lantern() {
  if (!matchMedia("(hover: hover)").matches) return;
  const place = () => {
    for (const b of doorEls.values()) {
      b.style.setProperty("--ox", `${b.offsetLeft}px`);
      b.style.setProperty("--oy", `${b.offsetTop}px`);
    }
  };
  place();
  if (typeof ResizeObserver === "function") new ResizeObserver(place).observe(cal);
  else addEventListener("resize", place);
  let lx = 0;
  let ly = 0;
  let lraf = 0;
  cal.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") return;
    const r = cal.getBoundingClientRect();
    lx = e.clientX - r.left;
    ly = e.clientY - r.top;
    lraf ||= requestAnimationFrame(() => {
      lraf = 0;
      cal.style.setProperty("--mx", `${lx.toFixed(0)}px`);
      cal.style.setProperty("--my", `${ly.toFixed(0)}px`);
    });
  });
  cal.addEventListener("pointerleave", () => {
    cancelAnimationFrame(lraf);
    lraf = 0;
    cal.style.removeProperty("--mx");
    cal.style.removeProperty("--my");
  });
}

// ---------------------------------------------------------------- dialogs + browser history

// Each open dialog owns one history entry, so Android's Back button (and the browser's)
// closes the sheet instead of leaving the site. `layers` is the stack of open dialogs;
// history.state.advent is how many of them the current entry expects to be open.
const layers: HTMLDialogElement[] = [];
const closers = new Map<HTMLDialogElement, Animation>();
const depth = () => Number((history.state as { advent?: number } | null)?.advent ?? 0);
const cleanUrl = () => location.pathname + location.search;

/** Point the sheet's transform-origin at `from`, so it grows out of (or shrinks into) it. */
function aim(sheet: HTMLElement, from: Element | null | undefined) {
  if (!from?.isConnected) return void (sheet.style.transformOrigin = "50% 50%");
  const s = sheet.getBoundingClientRect();
  const r = from.getBoundingClientRect();
  sheet.style.transformOrigin = `${r.left + r.width / 2 - s.left}px ${r.top + r.height / 2 - s.top}px`;
}

/** If `dlg` is still playing its closing animation, finish closing it right now. */
function finishClose(dlg: HTMLDialogElement) {
  const a = closers.get(dlg);
  if (!a) return;
  a.onfinish = null;
  a.cancel();
  closers.delete(dlg);
  dlg.classList.remove("closing");
  if (dlg.open) dlg.close();
}

function openLayer(dlg: HTMLDialogElement, from?: Element | null, url?: string) {
  finishClose(dlg);
  if (!dlg.open) dlg.showModal();
  layers.push(dlg);
  history.pushState({ advent: layers.length }, "", url ?? location.href);
  document.body.classList.add("noscroll");
  sky.pause(true);

  const sheet = dlg.firstElementChild as HTMLElement;
  if (typeof sheet.animate !== "function") return;
  if (reduceMotion.matches) return void sheet.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 });
  aim(sheet, from);
  sheet.animate(
    [
      { transform: "scale(.15)", opacity: 0 },
      { opacity: 1, offset: 0.45 },
      { transform: "none", opacity: 1 },
    ],
    { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
}

/** Close `dlg` (and anything stacked above it). `viaHistory`: the browser already went back. */
function dismiss(dlg: HTMLDialogElement, viaHistory = false) {
  const i = layers.indexOf(dlg);
  if (i < 0) return;
  const gone = layers.splice(i);
  if (!viaHistory && depth() > i) history.go(i - depth());
  for (const d of gone.reverse()) shrink(d);
}

function shrink(dlg: HTMLDialogElement) {
  if (dlg === mdlg) stopDoor();
  const sheet = dlg.firstElementChild as HTMLElement;
  const end = () => {
    closers.delete(dlg);
    dlg.classList.remove("closing");
    if (dlg.open) dlg.close();
  };
  if (typeof sheet.animate !== "function") return end();
  dlg.classList.add("closing"); // fades the backdrop
  let a: Animation;
  if (reduceMotion.matches) a = sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" });
  else {
    aim(sheet, dlg === mdlg ? doorEls.get(current?.day ?? 0) : $(app, "#wbtn"));
    a = sheet.animate(
      [
        { transform: "none", opacity: 1 },
        { opacity: 1, offset: 0.5 },
        { transform: "scale(.15)", opacity: 0 },
      ],
      { duration: 280, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" },
    );
  }
  closers.set(dlg, a);
  a.onfinish = () => {
    end();
    a.cancel();
  };
}

function afterClose(dlg: HTMLDialogElement) {
  if (!mdlg.open && !wdlg.open) {
    document.body.classList.remove("noscroll");
    sky.pause(false);
  }
  if (toastEl.parentElement === dlg) (topDialog() ?? app).appendChild(toastEl);
  if (dlg !== mdlg) return;
  const was = current;
  current = null;
  $(app, "#mbody").innerHTML = "";
  // The URL goes back to the plain calendar (a friend's tree link is a one-off view).
  const q = new URLSearchParams(location.search);
  q.delete("tree");
  const search = q.toString();
  const url = location.pathname + (search ? `?${search}` : "");
  if (url !== cleanUrl() || /^#day-/.test(location.hash)) history.replaceState(history.state, "", url);
  if (was?.day) doorEls.get(was.day)?.focus({ preventScroll: true });
}

for (const dlg of [mdlg, wdlg]) {
  // Esc (and Android's back gesture in newer Chrome) arrives as `cancel`: run our own close.
  dlg.addEventListener("cancel", (e) => {
    e.preventDefault();
    dismiss(dlg);
  });
  dlg.addEventListener("close", () => {
    if (dlg.open) return; // reopened before this event arrived
    const i = layers.indexOf(dlg);
    if (i >= 0) {
      // closed behind our back (the browser can force it): put the stack and history right
      layers.splice(i, 1);
      if (dlg === mdlg) stopDoor();
      if (depth() > layers.length) history.back();
    }
    afterClose(dlg);
  });
  // A click on the dimmed area closes, but only if the press started there too
  // (dragging a text selection out of the sheet must not close it).
  let downOnBackdrop = false;
  dlg.addEventListener("pointerdown", (e) => (downOnBackdrop = e.target === dlg));
  dlg.addEventListener("click", (e) => {
    const t = e.target as Element;
    if ((t === dlg && downOnBackdrop) || t.closest("[data-close]")) dismiss(dlg);
  });
}

addEventListener("popstate", () => {
  const want = depth();
  if (layers.length > want) dismiss(layers[want], true);
  // Forward into an entry whose sheet is gone: a door link re-opens through `hashchange`;
  // anything else just becomes an ordinary entry.
  else if (layers.length < want && !location.hash) history.replaceState(null, "", location.href);
});

// ---------------------------------------------------------------- door modal

/** What the door sheet is showing: a door, or (day 0) a friend's tree. */
type Shown = Pick<Door, "day" | "title" | "teaser" | "render"> & { kind?: Door["kind"] };

let current: Shown | null = null;
let cleanup: (() => void) | void;
let renderSeq = 0;

function stopDoor() {
  if (typeof cleanup === "function") cleanup();
  cleanup = undefined;
  renderSeq++; // anything still loading now writes into a detached node
}

async function renderCurrent() {
  if (!current || !layers.includes(mdlg)) return;
  stopDoor();
  const seq = renderSeq;
  const door = current;
  // Each render gets its own fresh container, so a slow, stale render that
  // finishes after the user moved on writes into a detached node, not the new door.
  const host = $(app, "#mbody");
  host.innerHTML = "";
  const body = document.createElement("div");
  host.appendChild(body);
  try {
    const c = await door.render(body);
    if (seq !== renderSeq) return typeof c === "function" ? c() : undefined; // a newer render took over
    cleanup = c;
  } catch (e) {
    console.error(e);
    if (seq !== renderSeq) return;
    body.innerHTML = errorBox(e) + `<button type="button" class="btn ghost" data-retry>Try again</button>`;
    const r = body.querySelector<HTMLButtonElement>("[data-retry]");
    if (r) r.onclick = () => renderCurrent();
  }
}

// Connecting a wallet fires wallet-changed and often network-changed back to back: render once.
let rerenderTimer: number | undefined;
function rerenderSoon() {
  clearTimeout(rerenderTimer);
  rerenderTimer = window.setTimeout(renderCurrent, 30);
}

const neighbour = (dir: -1 | 1): number => {
  if (!current?.day) return 0;
  for (let d = current.day + dir; d >= 1 && d <= 24; d += dir) if (isUnlocked(d)) return d;
  return 0;
};

function present(d: Shown, from?: Element | null) {
  if (wdlg.open && !closers.has(wdlg)) return; // the wallet sheet is in front: leave it be
  const switching = layers.includes(mdlg);
  current = d;

  const chips = d.day && d.kind ? [`Dec ${d.day}`, ...KIND_LABEL[d.kind].split(" · ")] : ["Shared with you", "Nothing to connect"];
  $(app, "#mchips").innerHTML = chips
    .map((c, i) => `<span class="chip${i === 0 ? " date" : i === 1 ? (/^free/i.test(c) || !d.day ? " free" : " cost") : ""}">${esc(c)}</span>`)
    .join("");
  $(app, "#mhero").innerHTML = icon(d.day || 22);
  $(app, "#mtitle").textContent = d.title;
  $(app, "#mteaser").textContent = d.teaser;
  const prev = $<HTMLButtonElement>(app, "#prev");
  const next = $<HTMLButtonElement>(app, "#next");
  prev.hidden = next.hidden = !d.day;
  prev.disabled = !neighbour(-1);
  next.disabled = !neighbour(1);
  $(app, "#mbody").scrollTop = 0;

  if (switching) {
    if (d.day) history.replaceState(history.state, "", `#day-${d.day}`);
    const head = $(app, ".mhead");
    if (!reduceMotion.matches && typeof head.animate === "function")
      for (const el of [head, $(app, "#mbody")]) el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
  } else openLayer(mdlg, from ?? doorEls.get(d.day), d.day ? `#day-${d.day}` : undefined);
  renderCurrent();
}

function step(dir: -1 | 1) {
  const day = neighbour(dir);
  if (!day) return;
  visit(day);
  present(DOORS[day - 1]);
}
$(app, "#prev").onclick = () => step(-1);
$(app, "#next").onclick = () => step(1);
mdlg.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  // leave the arrows alone wherever they already mean something
  if ((e.target as Element).closest("input, textarea, select, summary, [contenteditable], [role=slider], [role=tab]")) return;
  e.preventDefault();
  step(e.key === "ArrowLeft" ? -1 : 1);
});

/** Open a door from a link, a door-to-door jump or the address bar. */
function gotoDoor(day: number, reveal = false) {
  if (!(Number.isInteger(day) && day >= 1 && day <= 24)) return;
  if (!isUnlocked(day)) return knock(day, reveal);
  if (current?.day === day && layers.includes(mdlg)) return;
  visit(day);
  present(DOORS[day - 1]);
}

function openFromHash(): boolean {
  const m = location.hash.match(/^#day-(\d{1,2})$/);
  if (!m) return false;
  // The door pushes its own history entry, so take the hash off this one first:
  // Back then lands on the plain calendar.
  if (layers.includes(mdlg)) history.replaceState(history.state, "", current?.day ? `#day-${current.day}` : cleanUrl());
  else history.replaceState(null, "", cleanUrl());
  gotoDoor(Number(m[1]), true);
  return true;
}
addEventListener("hashchange", openFromHash);

window.addEventListener("open-door", (e) => gotoDoor(Number((e as CustomEvent).detail?.day)));
window.addEventListener("rerender-door", () => renderCurrent());

function openTree(who: string) {
  present({
    day: 0,
    title: "A friend's tree",
    teaser: "The ornaments a friend made on Cardano this Advent.",
    render: (el) => renderTree(el, who),
  });
}

// ---------------------------------------------------------------- wallet UI

const isMobile = (): boolean =>
  (navigator as unknown as { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile ??
  (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));

function drawHeader() {
  const b = $(app, "#wbtn");
  if (wallet) {
    const tail = wallet.changeAddress.slice(-6);
    b.innerHTML = `${iconImg(wallet.icon) || I.wallet}<span class="tail">…${esc(tail)}</span>`;
    b.setAttribute("aria-label", `Wallet ${wallet.name}, address ending ${tail}`);
  } else {
    b.innerHTML = `${I.wallet}<span>Connect</span>`;
    b.setAttribute("aria-label", "Connect a wallet");
  }
  b.classList.toggle("on", !!wallet);

  // Real money gets a label that never goes away.
  const chip = $(app, "#netchip");
  const main = !!wallet && wallet.networkId === 1;
  chip.hidden = !wallet;
  chip.classList.toggle("real", main);
  chip.textContent = !wallet ? "" : main ? "Mainnet · real ADA" : `${state.network === "mainnet" ? "Testnet" : NET_LABEL[state.network]} · test ADA`;

  const mm = networkMismatch();
  $(app, "#banner").innerHTML = mm ? `<div class="banner" role="alert">${esc(mm)}</div>` : "";
}

/** A link to this page that carries which doors are open, for moving into a wallet app's browser. */
function carryLink(): string {
  let mask = 0;
  for (const d of Object.keys(getOpened())) mask |= 1 << (Number(d) - 1);
  const u = new URL(location.origin + location.pathname);
  if (mask) u.searchParams.set("o", (mask >>> 0).toString(36));
  if (current?.day) u.hash = `day-${current.day}`;
  return u.toString();
}

/** Merge `?o=<base36 mask>` from a carried link into this browser's opened doors, then drop it. */
function importProgress() {
  const q = new URLSearchParams(location.search);
  const o = q.get("o");
  if (o === null) return;
  if (/^[0-9a-z]{1,5}$/i.test(o)) {
    const mask = parseInt(o, 36);
    if (mask < 2 ** 24) for (let day = 1; day <= 24; day++) if (mask & (1 << (day - 1)) && isUnlocked(day)) markOpened(day);
  }
  q.delete("o");
  const rest = q.toString();
  history.replaceState(history.state, "", location.pathname + (rest ? `?${rest}` : "") + location.hash);
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // in-app browsers often block the async clipboard: fall back to a selection
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    (topDialog() ?? document.body).appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      /* ignore */
    }
    ta.remove();
    return ok;
  }
}

let connecting = false;

function drawWalletSheet() {
  const body = $(app, "#wbody");
  const title = $(app, "#wtitle");
  const list = installedWallets();
  let html: string;

  if (wallet) {
    title.textContent = "Wallet connected";
    const net = wallet.networkId === 1 ? "Mainnet" : state.network === "mainnet" ? "Testnet" : NET_LABEL[state.network];
    html = `<p class="wrow">${iconImg(wallet.icon, "wicon")}<b>${esc(wallet.name)}</b><span class="chip">${net}</span></p>
      <code class="wrap">${esc(wallet.changeAddress)}</code>
      ${
        isLinked(wallet)
          ? `<p class="muted small">The doors you open are remembered for this wallet on all your devices.</p>`
          : `<p class="muted small">Sign one free message (not a transaction) and the doors you open are remembered for this wallet on all your devices.</p>
             <p><button type="button" class="btn" id="link">Remember my doors everywhere</button></p>`
      }
      <p><button type="button" class="btn ghost" id="dc">Disconnect</button></p>`;
  } else if (list.length) {
    title.textContent = "Choose a wallet";
    html = `<div class="wlist">${list
      .map((w) => `<button type="button" class="witem" data-id="${esc(w.id)}">${iconImg(w.icon) || I.wallet}<span class="wname">${esc(w.name)}</span></button>`)
      .join("")}</div><div id="werr"></div>
      <p class="muted small">Your wallet will ask before it shares anything. Your keys never leave it.</p>`;
  } else if (isMobile()) {
    title.textContent = "On a phone?";
    html = `<p>Open this page inside your wallet app's browser (Vespr, Eternl, Begin and others have one).</p>
      <p><button type="button" class="btn" id="copy">Copy link</button></p>
      <div id="copyout"></div>
      <p class="muted small">The link remembers which doors you have opened. No rush: ${FREE_DOORS} doors need no wallet.</p>`;
  } else {
    title.textContent = "No wallet yet";
    html = `<p>You'll need a Cardano wallet for ${current?.day ? "this door" : "some of the doors"}. <a href="https://www.lace.io" target="_blank" rel="noopener">Lace</a>, <a href="https://eternl.io" target="_blank" rel="noopener">Eternl</a> and <a href="https://vespr.xyz" target="_blank" rel="noopener">Vespr</a> are free and take about two minutes to set up. Come back and press Connect. No rush: ${FREE_DOORS} doors need no wallet.</p>
      <p class="muted small">Just installed one? Reload this page so it can see your wallet.</p>`;
  }

  const nets = (["preprod", "preview", "mainnet"] as Net[]).filter((n) => NETWORKS.includes(n));
  html += `<div class="netpick">
      <h4>Play with free test ADA</h4>
      <p class="muted small">Preprod and Preview are practice copies of Cardano. Set your wallet to one of them, pick up free test ADA from the <a href="${FAUCET}" target="_blank" rel="noopener">faucet</a>, then choose the same one here.${wallet ? " The calendar follows your wallet, so only change this if it guessed the wrong test network." : ""}</p>
      <label class="row" for="net">Network <select id="net">${nets.map((n) => `<option value="${n}"${n === state.network ? " selected" : ""}>${NET_LABEL[n]}${n === "mainnet" ? " (real ADA)" : ""}</option>`).join("")}</select></label>
    </div>`;
  body.innerHTML = html;

  const sel = $<HTMLSelectElement>(body, "#net");
  sel.onchange = () => setNetwork(sel.value as Net);

  const linkBtn = body.querySelector<HTMLButtonElement>("#link");
  if (linkBtn)
    linkBtn.onclick = async () => {
      linkBtn.disabled = true;
      linkBtn.innerHTML = `<span class="spin">❄</span> Waiting for your wallet…`;
      await pullProgress(true);
      if (linkBtn.isConnected) drawWalletSheet();
    };

  const dc = body.querySelector<HTMLButtonElement>("#dc");
  if (dc)
    dc.onclick = () => {
      disconnect();
      dismiss(wdlg);
    };

  const copy = body.querySelector<HTMLButtonElement>("#copy");
  if (copy)
    copy.onclick = async () => {
      const link = carryLink();
      if (await copyText(link)) {
        copy.textContent = "Copied";
        toast("Link copied. Paste it into your wallet app's browser.");
      } else $(body, "#copyout").innerHTML = `<p class="muted small">Press and hold to copy:</p><code class="wrap">${esc(link)}</code>`;
    };

  body.querySelectorAll<HTMLButtonElement>(".witem").forEach((b) => {
    b.onclick = async () => {
      if (connecting) return;
      connecting = true;
      const before = state.network;
      const name = $(b, ".wname");
      const label = name.textContent;
      const items = body.querySelectorAll<HTMLButtonElement>(".witem");
      items.forEach((x) => (x.disabled = true));
      b.classList.add("busy");
      $(body, "#werr").innerHTML = "";
      name.innerHTML = `<span class="spin">❄</span> Loading wallet tools…`;
      try {
        await loadMesh(); // the 1.7 MB wallet library (usually warm already, see boot)
        name.innerHTML = `<span class="spin">❄</span> Waiting for your wallet…`;
        await connect(b.dataset.id!); // CORE also lines the app's network up with the wallet
        const who = wallet?.name ?? "your wallet";
        dismiss(wdlg);
        toast(
          state.network !== before
            ? `Connected to ${who}. Switched to ${NET_LABEL[state.network]} to match your wallet.`
            : `Connected to ${who}.`,
        );
        // (wallet-changed asks for the one free signature if this device isn't linked yet)
      } catch (e) {
        console.error(e);
        if (b.isConnected) {
          name.textContent = label;
          b.classList.remove("busy");
          items.forEach((x) => (x.disabled = false));
          $(body, "#werr").innerHTML = errorBox(e);
        }
      } finally {
        connecting = false;
      }
    };
  });
}

function openWalletPicker() {
  if (layers.includes(wdlg)) return;
  const from = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : $(app, "#wbtn");
  drawWalletSheet();
  openLayer(wdlg, from);
}

$(app, "#wbtn").onclick = openWalletPicker;
window.addEventListener("open-wallet-picker", openWalletPicker);
window.addEventListener("wallet-changed", () => {
  drawHeader();
  if (layers.includes(wdlg) && !connecting) drawWalletSheet();
  rerenderSoon();
  // Connected (by hand or silently on page load) but not linked on this device yet: ask once.
  const w = wallet;
  if (w && !isLinked(w) && !autoAsked.has(w.rewardAddress ?? w.changeAddress)) {
    autoAsked.add(w.rewardAddress ?? w.changeAddress);
    void pullProgress(true);
  } else void pullProgress();
});

/** Wallets already asked for the sync signature on this page load (a "no" isn't asked again). */
const autoAsked = new Set<string>();

// Coming back to the tab (say after opening doors on another device): catch up.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void pullProgress();
});

/**
 * Swap opened doors with the server for this wallet, so every device knows all of them.
 * `ask`: if this device isn't linked yet, ask the wallet for its one free signature.
 */
function pullProgress(ask = false) {
  const w = wallet;
  if (!w || networkMismatch()) return Promise.resolve();
  return syncProgress(w, ask)
    .then(({ added, first }) => {
      if (wallet !== w) return;
      if (layers.includes(wdlg) && !connecting) drawWalletSheet();
      if (added.length) {
        syncDoors();
        window.dispatchEvent(new CustomEvent("progress-synced", { detail: { added } }));
        if (current?.day === 24) rerenderSoon(); // the Star counts opened doors
      }
      if (added.length)
        toast(
          added.length === 1
            ? `Door ${added[0]} is marked opened: you opened it on another device.`
            : `${added.length} doors are marked opened: you opened them on another device.`,
        );
      else if (first) toast("Done. The doors you open are now remembered for this wallet on all your devices.");
    })
    .catch((e) => {
      console.warn("progress sync", e);
      if (!ask) return;
      if (e instanceof SyncUnavailable) toast(e.message);
      else toast(`${errorMsg(e)} Your opened doors are kept on this device; you can try again from the wallet menu.`);
    });
}
window.addEventListener("network-changed", () => {
  drawHeader();
  if (layers.includes(wdlg) && !connecting) drawWalletSheet();
  rerenderSoon();
});

// ---------------------------------------------------------------- first visit, easter egg, confetti

const intro = $(app, "#intro");
intro.hidden = store.get<boolean>("intro-seen", false);
$(app, "#intro-x").onclick = () => {
  intro.hidden = true;
  store.set("intro-seen", true);
};

if (import.meta.env.DEV)
  $(app, "#dev-reset").onclick = () => {
    resetOpened();
    store.del("intro-seen");
    location.replace(location.pathname); // drop #day-N / ?o= so nothing re-opens a door
  };

// Tap the ₳ five times: it snows ₳ for twenty seconds.
let taps: number[] = [];
$(app, "#mark").addEventListener("click", () => {
  const now = Date.now();
  taps = [...taps.filter((t) => now - t < 2500), now];
  if (taps.length < 5) return;
  taps = [];
  sky.ada(20_000);
  toast(reduceMotion.matches ? "A flurry of ADA." : "It's snowing ADA!");
});

// Door code throws confetti at document.body, which is hidden behind an open dialog
// (dialogs live in the browser's top layer). Move the pieces into the dialog on top.
new MutationObserver((muts) => {
  const host = topDialog();
  if (!host) return;
  for (const m of muts)
    for (const n of m.addedNodes) if (n instanceof HTMLElement && n.classList.contains("confetti")) host.appendChild(n);
}).observe(document.body, { childList: true });

// ---------------------------------------------------------------- boot

if (depth()) history.replaceState(null, "", location.href); // a reload while a sheet was open
importProgress();
buildCalendar();
syncDoors();
lantern();
drawHeader();

try {
  mountScene($(app, "#scene"));
} catch (e) {
  console.error("scene", e);
}
try {
  initSound($<HTMLButtonElement>(app, "#sound"), app.querySelector<HTMLInputElement>("#vol"));
} catch (e) {
  console.error("sound", e);
}

const friend = new URLSearchParams(location.search).get("tree");
if (friend !== null && /^stake(_test)?1[02-9ac-hj-np-z]{30,120}$/.test(friend)) openTree(friend);
else {
  if (friend !== null) toast("That tree link looks incomplete. Ask your friend to send it again.");
  if (!openFromHash()) {
    // Bring today's door into view (after the scene has taken its space), if it isn't already.
    const b = doorEls.get(todayDoor());
    if (b)
      requestAnimationFrame(() => {
        const r = b.getBoundingClientRect();
        if (r.top < 0 || r.bottom > innerHeight) b.scrollIntoView({ block: "center" });
      });
  }
}

{
  const before = state.network;
  tryReconnect()
    .then(() => {
      if (wallet && state.network !== before) toast(`Switched to ${NET_LABEL[state.network]} to match your wallet.`);
    })
    .catch((e) => console.warn("reconnect", errorMsg(e)));
}

// Fetch the wallet library while the visitor is still looking around, if they have a wallet.
{
  const warm = () => {
    const c = navigator as unknown as { connection?: { saveData?: boolean } };
    if ((window as unknown as { cardano?: unknown }).cardano && !c.connection?.saveData) loadMesh().catch(() => {});
  };
  if (typeof requestIdleCallback === "function") requestIdleCallback(warm, { timeout: 6000 });
  else setTimeout(warm, 2500);
}

// Keep the locks honest in a tab that stays open: check now and then, when the tab comes
// back, and just after local midnight so the new door unfrosts on the stroke.
setInterval(syncDoors, 60_000 * 10);
document.addEventListener("visibilitychange", () => !document.hidden && syncDoors());
(function atMidnight() {
  const n = new Date();
  const ms = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime() - n.getTime() + 1500;
  setTimeout(() => {
    syncDoors();
    atMidnight();
  }, ms);
})();
