// Renders the app icons from one SVG. Run: npm run icons
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const BG = "#0B0C0B";
const TRACK = "#262A27";
const GOLD = "#D6B36A";

// Same thin arc as the speed dial on the Jízda screen (300×300 box).
// `scale` shrinks the mark for maskable icons, whose safe zone is the inner 80 %.
function iconSvg({ scale = 1, rounded = false } = {}) {
  const s = 0.7 * scale;
  const offset = (300 - 300 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" rx="${rounded ? 66 : 0}" fill="${BG}"/>
  <g transform="translate(${offset} ${offset + 19 * s}) scale(${s})" fill="none" stroke-width="16" stroke-linecap="round">
    <path d="M59.5 240.5 A128 128 0 1 1 240.5 240.5" stroke="${TRACK}"/>
    <path d="M59.5 240.5 A128 128 0 0 1 111.4 28.0" stroke="${GOLD}"/>
  </g>
</svg>`;
}

const png = (svg, size) => sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

const outputs = [
  ["public/icons/icon-192.png", png(iconSvg(), 192)],
  ["public/icons/icon-512.png", png(iconSvg(), 512)],
  ["public/icons/maskable-512.png", png(iconSvg({ scale: 0.78 }), 512)],
  ["app/apple-icon.png", png(iconSvg(), 180)],
  ["app/icon.svg", Promise.resolve(iconSvg({ rounded: true }))],
];

for (const [path, data] of outputs) {
  await writeFile(path, await data);
  console.log("wrote", path);
}
