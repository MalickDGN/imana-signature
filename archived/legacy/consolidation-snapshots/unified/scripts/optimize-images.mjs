import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const output = resolve("assets/images/optimized");
await mkdir(output, { recursive: true });

const sources = [
  ["hero", "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=90&w=1600", 1200, 80],
  ["heritage", "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=90&w=1200", 900, 78],
  ["prestige", "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=90&w=1200", 900, 78],
  ["evasion", "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=90&w=1200", 900, 78],
  ["manifesto", "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&q=90&w=1600", 1200, 80],
  ["journal-featured", "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?auto=format&fit=crop&q=90&w=1400", 1000, 78],
  ["journal-lasting", "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=90&w=1000", 800, 76],
  ["product-dark", "https://images.unsplash.com/photo-1748543668676-ea8241cb3886?auto=format&fit=crop&q=90&w=1200", 900, 80],
  ["product-light", "https://images.unsplash.com/photo-1748543668646-e81cda0890f3?auto=format&fit=crop&q=90&w=1200", 900, 80],
  ["product-floral", "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&q=90&w=1200", 900, 80],
];

for (const [name, url, width, quality] of sources) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} pour ${url}`);
  const input = Buffer.from(await response.arrayBuffer());
  const image = await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toBuffer();
  await writeFile(resolve(output, `${name}.webp`), image);
  console.log(`${name}.webp — ${Math.round(image.length / 1024)} Ko`);
}
