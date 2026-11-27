import { store } from "./config";
import { onBlock, type Tip } from "./koios";

// Opt-in sound, generated with Web Audio (no audio files). Off by default; the choice is
// remembered. An AudioContext is only ever created inside a user gesture: the click that
// turns sound on, or the first tap/key press after a reload when it was left on.

export type SfxName = "open" | "knock" | "block" | "confirm";

const KEY = "sound";
const PEAK = 0.14;

// First 24 notes of the chorus of "Jingle Bells" (James Lord Pierpont, 1857, public domain),
// one per door: E E E | E E E | E G C D E | F F F F | F E E E | E D D E | D
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const F5 = 698.46;
const G5 = 783.99;
const TUNE = [E5, E5, E5, E5, E5, E5, E5, G5, C5, D5, E5, F5, F5, F5, F5, F5, E5, E5, E5, E5, D5, D5, E5, D5];
/** Length of each note in beats, for playing the whole phrase in tempo. */
const BEATS = [1, 1, 2, 1, 1, 2, 1, 1, 1.5, 0.5, 4, 1, 1, 1.5, 0.5, 1, 1, 1, 1, 1, 1, 1, 1, 2];
const BEAT = 0.27;

type Ctor = typeof AudioContext;
const audioCtor = (): Ctor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
};

let on = false;
let ctx: AudioContext | null = null;
let out: GainNode | null = null;
const MASTER = 0.9;
const VOL_KEY = "volume";
const clamp01 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0.7);
/** Listener's volume, 0–1, remembered. The master gain is MASTER × vol. */
let vol = clamp01(store.get<unknown>(VOL_KEY, 0.7));
let noise: AudioBuffer | null = null;
let phraseUntil = 0;

/** Create (or wake) the audio graph. Only call from a user gesture. */
function wake(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = audioCtor();
      if (!AC) return null;
      const c = new AC();
      // master gain → short limiter → speakers
      const master = c.createGain();
      master.gain.value = MASTER * vol;
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -16;
      limiter.knee.value = 8;
      limiter.ratio.value = 12;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.2;
      master.connect(limiter);
      limiter.connect(c.destination);
      const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      ctx = c;
      out = master;
      noise = buf;
    }
    if (ctx.state !== "running") void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/**
 * The context, if sound is on and one already exists (it is never created here: only the
 * toggle click and the gesture listeners in initSound do that). `nudge` = this sound follows
 * a click, so a context the browser put to sleep may be asked to resume.
 */
function ready(nudge: boolean): AudioContext | null {
  if (!on || !ctx) return null;
  if (ctx.state === "running") return ctx;
  if (!nudge) return null;
  void ctx.resume().catch(() => {});
  return ctx;
}

/** Run a sound recipe; audio must never break the page. */
function play(nudge: boolean, fn: (c: AudioContext, dest: AudioNode, t: number) => void) {
  try {
    const c = ready(nudge);
    if (c && out) fn(c, out, c.currentTime + 0.02);
  } catch {
    /* silent */
  }
}

// ---------------------------------------------------------------- voices

/** A small bell: three sine partials, each with its own exponential decay. */
function bell(c: AudioContext, dest: AudioNode, f: number, t: number, vol = PEAK, len = 1) {
  const ratios = [1, 2.76, 5.4];
  const gains = [1, 0.4, 0.2];
  const decays = [1.4, 0.9, 0.5];
  const norm = vol / 1.6; // the partial gains add up to 1.6
  ratios.forEach((r, i) => {
    const end = t + decays[i] * len;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f * r;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gains[i] * norm, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(end + 0.05);
  });
}

/** A burst of band-passed white noise. */
function hiss(c: AudioContext, dest: AudioNode, t: number, dur: number, freq: number, q: number, vol: number) {
  if (!noise) return;
  const src = c.createBufferSource();
  src.buffer = noise;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp);
  bp.connect(g);
  g.connect(dest);
  // start somewhere different in the buffer each time so the bursts don't sound identical
  src.start(t, Math.random() * 0.3, dur + 0.05);
}

/** A soft wooden knock: a short low thump plus a tick of filtered noise. */
function knock(c: AudioContext, dest: AudioNode, t: number) {
  // 120 Hz is the knock; the quieter octave above is what small phone speakers can actually play
  for (const [f, vol] of [[120, 0.1], [240, 0.04]]) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.08);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
    o.connect(g);
    g.connect(dest);
    o.start(t);
    o.stop(t + 0.12);
  }
  hiss(c, dest, t, 0.03, 1700, 1.2, 0.2);
}

/** A very quiet sleigh-bell shake: three short bursts of bright noise. */
function sleigh(c: AudioContext, dest: AudioNode, t: number) {
  [0, 0.11, 0.22].forEach((dt, i) => hiss(c, dest, t + dt, 0.06, 6000 + i * 350, 5, 0.12));
}

/** A rising three-note bell arpeggio. */
function arpeggio(c: AudioContext, dest: AudioNode, t: number) {
  [G5, C5 * 2, E5 * 2].forEach((f, i) => bell(c, dest, f, t + i * 0.13, 0.11, 0.9));
}

/** Door N rings note N. Door 24 then plays the whole phrase in tempo, and a closing chord. */
function doorNote(c: AudioContext, dest: AudioNode, t: number, day: number) {
  bell(c, dest, TUNE[day - 1], t);
  if (day !== TUNE.length || t < phraseUntil) return;
  let at = t + 1.1;
  TUNE.forEach((f, i) => {
    bell(c, dest, f, at, 0.09, 0.55);
    at += BEATS[i] * BEAT;
  });
  // the 24 notes stop on a D, so let it come home to C
  [C5, E5, G5, C5 * 2].forEach((f) => bell(c, dest, f, at, 0.05, 1.3));
  phraseUntil = at + 2;
}

// ---------------------------------------------------------------- background music

// Public-domain carols (the tunes are centuries old or 1857), played by the same small bells
// over a soft bass. Notes are "name+octave:beats"; one bass note per bar.
interface Song { beat: number; bar: number; pickup: number; mel: string; bass: string }
const SONGS: Song[] = [
  {
    // Jingle Bells (chorus), J. L. Pierpont 1857
    beat: 0.3, bar: 4, pickup: 0,
    mel: `E5 E5 E5:2 E5 E5 E5:2 E5 G5 C5:1.5 D5:.5 E5:4 F5 F5 F5:1.5 F5:.5 F5 E5 E5 E5:.5 E5:.5 E5 D5 D5 E5 D5:2 G5:2
          E5 E5 E5:2 E5 E5 E5:2 E5 G5 C5:1.5 D5:.5 E5:4 F5 F5 F5:1.5 F5:.5 F5 E5 E5 E5:.5 E5:.5 G5 G5 F5 D5 C5:4`,
    bass: "C3 C3 C3 C3 F3 C3 D3 G3 C3 C3 C3 C3 F3 C3 G3 C3",
  },
  {
    // Deck the Halls, traditional Welsh
    beat: 0.3, bar: 4, pickup: 0,
    mel: `G5:1.5 F5:.5 E5 D5 C5 D5 E5 C5 D5:.5 E5:.5 F5:.5 D5:.5 E5:1.5 D5:.5 C5 B4 C5:2
          G5:1.5 F5:.5 E5 D5 C5 D5 E5 C5 D5:.5 E5:.5 F5:.5 D5:.5 E5:1.5 D5:.5 C5 B4 C5:2
          D5:1.5 E5:.5 F5 D5 E5:1.5 F5:.5 G5 D5 E5:.5 F#5:.5 G5 A5:.5 B5:.5 C6 B5 A5 G5:2
          G5:1.5 F5:.5 E5 D5 C5 D5 E5 C5 A5:.5 A5:.5 A5:.5 A5:.5 G5:1.5 F5:.5 E5 D5 C5:2`,
    bass: "C3 F3 G3 C3 C3 F3 G3 C3 G3 C3 D3 G3 C3 F3 F3 C3",
  },
  {
    // We Wish You a Merry Christmas, traditional English
    beat: 0.34, bar: 3, pickup: 1,
    mel: `G4 C5 C5:.5 D5:.5 C5:.5 B4:.5 A4 A4 A4 D5 D5:.5 E5:.5 D5:.5 C5:.5 B4 G4 G4
          E5 E5:.5 F5:.5 E5:.5 D5:.5 C5 A4 G4:.5 G4:.5 A4 D5 B4 C5:3`,
    bass: "C3 F3 D3 G3 E3 F3 G3 C3",
  },
];
const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const hz = (n: string): number => {
  const m = /^([A-G])(#?)(\d)$/.exec(n);
  return m ? 440 * 2 ** ((12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] ? 1 : 0) - 69) / 12) : 0;
};
const notes = (s: string): [number, number][] =>
  s.trim().split(/\s+/).map((tok) => {
    const [n, b] = tok.split(":");
    return [hz(n), Number(b || 1)];
  });

/** A soft, low triangle note for the bass line. */
function pad(c: AudioContext, dest: AudioNode, f: number, t: number, dur: number) {
  const o = c.createOscillator();
  const lp = c.createBiquadFilter();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.value = f;
  lp.type = "lowpass";
  lp.frequency.value = 600;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
  o.connect(lp);
  lp.connect(g);
  g.connect(dest);
  o.start(t);
  o.stop(t + dur);
}

let music: { gain: GainNode; timer: number } | null = null;

/** Play carol `i`, then the next one, forever (until stopMusic). Each song gets its own gain node. */
function startMusic(i = 0) {
  stopMusic();
  try {
    const c = ready(true);
    if (!c || !out) return;
    const g = c.createGain();
    g.gain.value = 0.6;
    g.connect(out);
    const s = SONGS[i % SONGS.length];
    const t0 = c.currentTime + 0.4;
    let t = t0;
    for (const [f, b] of notes(s.mel)) {
      if (f) bell(c, g, f, t, 0.075, Math.min(1.1, 0.4 + b * 0.18));
      t += b * s.beat;
    }
    let bt = t0 + s.pickup * s.beat;
    for (const [f] of notes(s.bass)) {
      if (f) pad(c, g, f, bt, s.bar * s.beat);
      bt += s.bar * s.beat;
    }
    const next = Math.max(t, bt) + 2.2 - c.currentTime;
    music = { gain: g, timer: window.setTimeout(() => startMusic(i + 1), next * 1000) };
  } catch {
    /* silent */
  }
}

function stopMusic() {
  if (!music) return;
  clearTimeout(music.timer);
  const g = music.gain;
  music = null;
  try {
    if (ctx) g.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => g.disconnect(), 1500);
  } catch {
    /* silent */
  }
}

// ---------------------------------------------------------------- public

/** Play a sound on demand. Does nothing while sound is off (or before the first user gesture). */
export function sfx(name: SfxName): void {
  play(false, (c, dest, t) => {
    if (name === "open") bell(c, dest, E5, t);
    else if (name === "knock") knock(c, dest, t);
    else if (name === "block") sleigh(c, dest, t);
    else if (name === "confirm") arpeggio(c, dest, t);
  });
}

const ICON_ON = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor"/><path d="M15.6 9.2a4 4 0 0 1 0 5.6"/><path d="M18.4 6.6a7.8 7.8 0 0 1 0 10.8"/></svg>`;
const ICON_OFF = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>`;

let started = false;

export function initSound(toggle: HTMLButtonElement, slider?: HTMLInputElement | null): void {
  if (started || !toggle) return;
  started = true;

  const supported = !!audioCtor();
  on = supported && store.get<unknown>(KEY, false) === true;

  const draw = () => {
    toggle.innerHTML = on ? ICON_ON : ICON_OFF;
    toggle.setAttribute("aria-pressed", String(on));
    toggle.setAttribute("aria-label", supported ? "Sound" : "Sound is not available in this browser");
    toggle.title = !supported ? "Sound is not available in this browser" : on ? "Sound is on" : "Sound is off";
    toggle.classList.toggle("on", on);
    if (slider) slider.hidden = !on;
  };
  if (!toggle.hasAttribute("type")) toggle.type = "button";
  if (!supported) toggle.disabled = true;
  if (slider) {
    const paint = () => slider.style.setProperty("--v", `${Math.round(vol * 100)}%`);
    slider.value = String(Math.round(vol * 100));
    paint();
    slider.addEventListener("input", () => {
      vol = clamp01(Number(slider.value) / 100);
      store.set(VOL_KEY, vol);
      paint();
      slider.title = `Volume ${Math.round(vol * 100)}%`;
      try {
        if (on && ctx && out) {
          out.gain.cancelScheduledValues(ctx.currentTime);
          out.gain.setTargetAtTime(MASTER * vol, ctx.currentTime, 0.03);
        }
      } catch {
        /* silent */
      }
    });
    slider.title = `Volume ${Math.round(vol * 100)}%`;
  }
  draw();

  // Left on last time (or put to sleep by the browser): wake the audio on a real gesture.
  // Capture phase, so it is ready before the same click opens a door.
  const gesture = (e: Event) => {
    if (!on || (ctx && ctx.state === "running")) return;
    if (e.type === "keydown" && !["Enter", " "].includes((e as KeyboardEvent).key)) return;
    wake();
    if (!music) startMusic(0);
  };
  if (supported) for (const g of ["pointerup", "touchend", "click", "keydown"]) window.addEventListener(g, gesture, true);

  let sleep = 0;
  toggle.addEventListener("click", () => {
    if (!supported) return;
    on = !on;
    store.set(KEY, on);
    draw();
    try {
      clearTimeout(sleep);
      if (on) {
        const c = wake(); // inside this click, so the browser allows it
        if (!c || !out) return;
        out.gain.cancelScheduledValues(c.currentTime);
        out.gain.setTargetAtTime(MASTER * vol, c.currentTime, 0.02);
        // a little "it works" chime
        play(true, (cc, dest, t) => {
          bell(cc, dest, E5, t, 0.1, 0.8);
          bell(cc, dest, G5, t + 0.12, 0.1, 0.8);
        });
        startMusic(0);
      } else if (ctx && out) {
        // fade out whatever is ringing, then let the audio hardware rest
        out.gain.cancelScheduledValues(ctx.currentTime);
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
        phraseUntil = 0;
        stopMusic();
        sleep = window.setTimeout(() => {
          if (!on && ctx && ctx.state === "running") void ctx.suspend().catch(() => {});
        }, 12_000);
      }
    } catch {
      /* silent */
    }
  });

  window.addEventListener("door-opened", (e) => {
    const day = Number((e as CustomEvent<{ day?: number }>).detail?.day);
    if (!Number.isInteger(day) || day < 1 || day > TUNE.length) return;
    play(true, (c, dest, t) => doorNote(c, dest, t, day));
  });
  window.addEventListener("door-locked", () => play(true, knock));
  window.addEventListener("tx-confirmed", () => play(false, arpeggio));

  // New blocks: a quiet sleigh-bell shake. Not for the first tip we hear about, not after a
  // network switch (a backwards or huge jump), and not while the tab is hidden.
  let seen = false;
  let lastHeight = 0;
  try {
    onBlock((tip: Tip) => {
      const h = Number(tip?.block_height);
      if (!Number.isFinite(h) || h <= 0 || (seen && h === lastHeight)) return;
      const isNew = seen && h > lastHeight && h - lastHeight < 500;
      seen = true;
      lastHeight = h;
      if (isNew && !document.hidden) play(false, sleigh);
    });
  } catch (err) {
    console.warn("sound: no block feed", err);
  }
}
