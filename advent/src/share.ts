// Share cards: draw a 1200×1200 PNG and hand it to the phone's share sheet,
// or download it where the Web Share API can't take files (most desktops).
import { svgDataUri } from "./art";

export interface ShareCardOpts {
  title: string;
  line?: string;
  artSvg?: string;
  footer?: string;
  filename?: string;
  text?: string;
}

const SIZE = 1200;
const DISPLAY = `"Fraunces Variable", "Fraunces", Georgia, serif`;
const BODY = `"Figtree Variable", "Figtree", system-ui, sans-serif`;

export function canShareFiles(): boolean {
  try {
    const f = new File([new Uint8Array(1)], "x.png", { type: "image/png" });
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [f] });
  } catch {
    return false;
  }
}

/** Give an SVG string explicit pixel width/height so <img> decodes it at full size. */
function sized(svg: string, px: number): string {
  return svg.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const clean = attrs.replace(/\s(width|height)="[^"]*"/g, "");
    return `<svg${clean} width="${px}" height="${px}">`;
  });
}

async function loadSvg(svg: string, px: number): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = svgDataUri(sized(svg, px));
  await img.decode();
  return img;
}

/** Wrap `text` to `maxWidth`, at most `maxLines` lines (last one ellipsised). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxWidth || !cur) cur = next;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last && ctx.measureText(last + "…").width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = last.trimEnd() + "…";
    return kept;
  }
  return lines;
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, 0, 0, SIZE);
  g.addColorStop(0, "#1a2a7a");
  g.addColorStop(0.45, "#0c1747");
  g.addColorStop(1, "#070d2b");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // warm glow behind the art
  const glow = ctx.createRadialGradient(SIZE / 2, 470, 40, SIZE / 2, 470, 520);
  glow.addColorStop(0, "rgba(255, 209, 102, 0.22)");
  glow.addColorStop(1, "rgba(255, 209, 102, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // snow: deterministic scatter so every card looks the same
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 0; i < 140; i++) {
    ctx.beginPath();
    ctx.arc(rnd() * SIZE, rnd() * SIZE, 1 + rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // snowy ground
  ctx.fillStyle = "rgba(232, 240, 251, 0.12)";
  ctx.beginPath();
  ctx.moveTo(0, SIZE - 120);
  ctx.quadraticCurveTo(SIZE * 0.3, SIZE - 175, SIZE * 0.6, SIZE - 130);
  ctx.quadraticCurveTo(SIZE * 0.85, SIZE - 95, SIZE, SIZE - 140);
  ctx.lineTo(SIZE, SIZE);
  ctx.lineTo(0, SIZE);
  ctx.closePath();
  ctx.fill();
}

async function render(o: ShareCardOpts): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't draw the picture.");

  try {
    await document.fonts?.ready;
  } catch {
    /* fall back to system fonts */
  }

  drawBackground(ctx);

  const hasArt = !!o.artSvg;
  if (o.artSvg) {
    const art = await loadSvg(o.artSvg, 640);
    const box = 620;
    // keep aspect ratio of non-square art (trees, snowmen)
    const ratio = art.naturalWidth && art.naturalHeight ? art.naturalWidth / art.naturalHeight : 1;
    const w = ratio >= 1 ? box : box * ratio;
    const h = ratio >= 1 ? box / ratio : box;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    ctx.drawImage(art, (SIZE - w) / 2, 110 + (box - h) / 2, w, h);
    ctx.restore();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // title
  let y = hasArt ? 860 : 420;
  ctx.fillStyle = "#ffd166";
  ctx.font = `700 ${hasArt ? 72 : 96}px ${DISPLAY}`;
  for (const l of wrap(ctx, o.title, SIZE - 160, 2)) {
    ctx.fillText(l, SIZE / 2, y);
    y += hasArt ? 82 : 108;
  }

  // line
  if (o.line) {
    ctx.fillStyle = "#e9eeff";
    ctx.font = `400 ${hasArt ? 38 : 48}px ${BODY}`;
    y += 6;
    for (const l of wrap(ctx, o.line, SIZE - 200, hasArt ? 2 : 6)) {
      ctx.fillText(l, SIZE / 2, y);
      y += hasArt ? 50 : 62;
    }
  }

  // footer
  ctx.fillStyle = "rgba(233, 238, 255, 0.7)";
  ctx.font = `600 30px ${BODY}`;
  ctx.fillText(o.footer ?? "cardano advent 2026 · #CardanoAdvent", SIZE / 2, SIZE - 50);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't create the picture."))), "image/png"),
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Draw a share card and share it (phones) or download it (everything else).
 * Cancelling the share sheet counts as success.
 */
export async function shareCard(o: ShareCardOpts): Promise<void> {
  const blob = await render(o);
  const filename = o.filename ?? "cardano-advent.png";
  const file = new File([blob], filename, { type: "image/png" });
  const text = o.text ?? `${o.title}${o.line ? ` · ${o.line}` : ""} #CardanoAdvent`;

  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return;
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return; // user closed the sheet
      // NotAllowedError etc. (e.g. lost user activation while drawing): fall back to download
    }
  }
  download(blob, filename);
}
