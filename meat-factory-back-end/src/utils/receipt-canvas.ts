import path from "path";
import {
  createCanvas,
  GlobalFonts,
  loadImage,
  type Image,
} from "@napi-rs/canvas";

// Receipts are drawn as a 1-bit bitmap and sent to the printer as a raster
// image — so any glyph we can render prints, regardless of the printer's font
// ROM (this SPRT unit only has Latin + Chinese fonts, no Cyrillic / Ө Ү).

const FONT = "RcptMono";
// Repo-root assets/ (not src/) so it's found whether we run via ts-node
// (npm run dev) or the compiled dist/ — both start from the project root.
GlobalFonts.registerFromPath(
  path.join(process.cwd(), "assets", "DejaVuSansMono.ttf"),
  FONT,
);

// 80mm printer: 72mm printable ≈ 576 dots.
const WIDTH = 576;
const FONT_PX = 22;
const LINE_H = 30;
const PAD_Y = 10;

// Monospace advance at FONT_PX → how many chars fit on a line.
const ADVANCE = (() => {
  const c = createCanvas(10, 10).getContext("2d");
  c.font = `${FONT_PX}px ${FONT}`;
  return c.measureText("0").width || FONT_PX * 0.6;
})();
export const RECEIPT_COLS = Math.max(24, Math.floor(WIDTH / ADVANCE));

export type RLine = {
  text?: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  scale?: 1 | 2; // 2 = big title
  rule?: boolean; // full-width divider
  gap?: number; // blank vertical px
  img?: Image; // centred image (e.g. a signature), decoded via decodeImage()
  imgH?: number; // its drawn height in px (width scales to keep aspect)
};

// Decode image bytes (PNG/JPEG) for embedding in a receipt via an `img` RLine.
export function decodeImage(buf: Buffer): Promise<Image> {
  return loadImage(buf);
}

function heightOf(lines: RLine[]): number {
  let h = PAD_Y;
  for (const l of lines) {
    if (l.img && l.imgH) h += l.imgH;
    else if (l.gap) h += l.gap;
    else h += LINE_H * (l.scale ?? 1);
  }
  return h + PAD_Y;
}

function paint(lines: RLine[]) {
  const height = heightOf(lines);
  const canvas = createCanvas(WIDTH, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = "#000000";
  ctx.textBaseline = "top";

  let y = PAD_Y;
  for (const l of lines) {
    if (l.img && l.imgH) {
      let w = l.img.width * (l.imgH / l.img.height);
      let h = l.imgH;
      if (w > WIDTH) {
        h *= WIDTH / w;
        w = WIDTH;
      }
      ctx.drawImage(l.img, (WIDTH - w) / 2, y, w, h);
      y += l.imgH;
      continue;
    }
    if (l.gap) {
      y += l.gap;
      continue;
    }
    const scale = l.scale ?? 1;
    const rowH = LINE_H * scale;
    if (l.rule) {
      ctx.fillRect(0, y + rowH / 2 - 1, WIDTH, 2);
      y += rowH;
      continue;
    }
    const px = FONT_PX * scale;
    ctx.font = `${l.bold ? "bold " : ""}${px}px ${FONT}`;
    const text = l.text ?? "";
    const w = ctx.measureText(text).width;
    let x = 0;
    if (l.align === "center") x = (WIDTH - w) / 2;
    else if (l.align === "right") x = WIDTH - w;
    ctx.fillText(text, Math.max(0, x), y + (rowH - px) / 2);
    y += rowH;
  }
  return canvas;
}

// PNG bytes — for the on-screen print preview.
export function receiptPng(lines: RLine[]): Buffer {
  return paint(lines).toBuffer("image/png");
}

// Packed 1bpp raster (MSB first, 1 = black) — for the ESC/POS GS v 0 command.
export function receiptRaster(lines: RLine[]): {
  widthBytes: number;
  height: number;
  data: Buffer;
} {
  const canvas = paint(lines);
  const { width, height } = canvas;
  const px = canvas.getContext("2d").getImageData(0, 0, width, height).data;
  const widthBytes = Math.ceil(width / 8);
  const data = Buffer.alloc(widthBytes * height);
  for (let yy = 0; yy < height; yy++) {
    for (let xx = 0; xx < width; xx++) {
      const p = (yy * width + xx) * 4;
      const lum = 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
      if (lum < 160) data[yy * widthBytes + (xx >> 3)] |= 0x80 >> (xx & 7);
    }
  }
  return { widthBytes, height, data };
}
