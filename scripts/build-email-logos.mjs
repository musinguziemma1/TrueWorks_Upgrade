// One-off script: convert public/images/logo-horizontal*.svg into PNGs that
// email clients (including Outlook desktop) can render reliably.
// Run from repo root: node scripts/build-email-logos.mjs
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "public", "images");

const TARGETS = [
  { svg: "logo-horizontal-white.svg", png: "logo-email-dark.png" },
  { svg: "logo-horizontal.svg",        png: "logo-email-light.png" },
];

const RENDER_WIDTHS = [600, 1200]; // 1x and 2x for retina

for (const { svg, png } of TARGETS) {
  const svgPath = path.join(SRC, svg);
  const svgBuf = await fs.readFile(svgPath);
  for (const w of RENDER_WIDTHS) {
    const outBase = path.join(SRC, png.replace(/\.png$/, w === 600 ? "" : `@${w / 600}x`) + ".png");
    await sharp(svgBuf, { density: 384 })
      .resize({ width: w })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(outBase);
    console.log("wrote", path.relative(ROOT, outBase));
  }
}
console.log("done");
