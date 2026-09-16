/* Generate branded gradient placeholder webp images for media slots that
 * ship without final photography. Replace files in /public/images to update. */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const base = path.join(__dirname, "..", "public", "images");
const images = [
  { file: "hero-business-systems.webp", w: 2400, h: 1350, from: "#04101F", via: "#0B2545", to: "#123663" },
  { file: "system-in-action.webp", w: 2400, h: 1100, from: "#071A33", via: "#0B2545", to: "#1C4A7E" },
  { file: "free-hospital-kpi-dashboard.webp", w: 1600, h: 1000, from: "#04101F", via: "#0B2545", to: "#2C5F8A" },
  { file: path.join("products", "executive-dashboard.webp"), w: 1600, h: 1000, from: "#04101F", via: "#0B2545", to: "#DAA520" },
  { file: path.join("products", "finance-dashboard.webp"), w: 1600, h: 1000, from: "#04101F", via: "#123663", to: "#8FB3CC" },
  { file: path.join("products", "sales-dashboard.webp"), w: 1600, h: 1000, from: "#071A33", via: "#1C4A7E", to: "#DAA520" },
  { file: path.join("products", "hr-dashboard.webp"), w: 1600, h: 1000, from: "#04101F", via: "#0B2545", to: "#3E6990" },
  { file: path.join("products", "healthcare-dashboard.webp"), w: 1600, h: 1000, from: "#071A33", via: "#123663", to: "#8FB3CC" },
  { file: path.join("industries", "healthcare.webp"), w: 1600, h: 900, from: "#04101F", via: "#123663", to: "#3E6990" },
  { file: path.join("industries", "ngos.webp"), w: 1600, h: 900, from: "#04101F", via: "#0B2545", to: "#DAA520" },
  { file: path.join("industries", "finance.webp"), w: 1600, h: 900, from: "#071A33", via: "#0B2545", to: "#8FB3CC" },
  { file: path.join("industries", "education.webp"), w: 1600, h: 900, from: "#04101F", via: "#1C4A7E", to: "#3E6990" },
  { file: path.join("industries", "sme.webp"), w: 1600, h: 900, from: "#071A33", via: "#123663", to: "#DAA520" },
];

const svg = (w, h, from, via, to) => Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="0.6" stop-color="${via}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <pattern id="p" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M72 0H0V72" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#p)"/>
</svg>`);

(async () => {
  for (const img of images) {
    const dest = path.join(base, img.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await sharp(svg(img.w, img.h, img.from, img.via, img.to)).webp({ quality: 82 }).toFile(dest);
    console.log("WROTE", img.file);
  }
})().catch((e) => { console.error(e); process.exit(1); });
