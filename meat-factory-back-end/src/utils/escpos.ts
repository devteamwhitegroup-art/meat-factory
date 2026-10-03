// Minimal ESC/POS byte assembler. Receipts are rendered as raster images
// (see receipt-canvas.ts) so the printer's built-in fonts / code pages are
// irrelevant — this only needs init, raster, feed and cut.

const ESC = 0x1b;
const GS = 0x1d;

export class Escpos {
  private chunks: Buffer[] = [];

  raw(...bytes: number[]): this {
    this.chunks.push(Buffer.from(bytes));
    return this;
  }

  init(): this {
    return this.raw(ESC, 0x40);
  }

  feed(n = 1): this {
    return this.raw(ESC, 0x64, n);
  }

  // GS V 66 0 — partial cut.
  cut(): this {
    return this.raw(GS, 0x56, 66, 0);
  }

  // GS v 0 — raster bit image, packed 1bpp MSB-first, 1 = black. Split into
  // horizontal bands so a tall receipt doesn't overrun the printer's buffer.
  raster(widthBytes: number, height: number, data: Buffer): this {
    const BAND = 200;
    for (let off = 0; off < height; off += BAND) {
      const h = Math.min(BAND, height - off);
      this.chunks.push(
        Buffer.from([
          GS,
          0x76,
          0x30,
          0,
          widthBytes & 0xff,
          (widthBytes >> 8) & 0xff,
          h & 0xff,
          (h >> 8) & 0xff,
        ]),
      );
      this.chunks.push(
        data.subarray(off * widthBytes, (off + h) * widthBytes),
      );
    }
    return this;
  }

  done(): Buffer {
    return Buffer.concat(this.chunks);
  }
}
