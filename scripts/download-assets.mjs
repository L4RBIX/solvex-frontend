import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const assets = [
  // Hero
  { url: 'https://wope.com/images/hero/hero-background-bottom.png', dest: 'public/images/hero/hero-background-bottom.png' },
  // Research section
  { url: 'https://wope.com/images/research/hero-video-desktop-preview.png', dest: 'public/images/research/hero-video-desktop-preview.png' },
  { url: 'https://wope.com/images/research/card-detailed-desktop.svg', dest: 'public/images/research/card-detailed-desktop.svg' },
  { url: 'https://wope.com/images/research/card-detailed-light1.png', dest: 'public/images/research/card-detailed-light1.png' },
  { url: 'https://wope.com/images/research/card-detailed-light2.png', dest: 'public/images/research/card-detailed-light2.png' },
  { url: 'https://wope.com/images/research/card-detailed-icon1.png', dest: 'public/images/research/card-detailed-icon1.png' },
  { url: 'https://wope.com/images/research/card-detailed-icon2.png', dest: 'public/images/research/card-detailed-icon2.png' },
  { url: 'https://wope.com/images/research/card-detailed-icon3.png', dest: 'public/images/research/card-detailed-icon3.png' },
  { url: 'https://wope.com/images/research/card-explore-light1.png', dest: 'public/images/research/card-explore-light1.png' },
  { url: 'https://wope.com/images/research/card-explore-light2.png', dest: 'public/images/research/card-explore-light2.png' },
  { url: 'https://wope.com/images/research/card-explore-table2.svg', dest: 'public/images/research/card-explore-table2.svg' },
  // CTA
  { url: 'https://wope.com/images/cta/cta-background.png', dest: 'public/images/cta/cta-background.png' },
  // Footer
  { url: 'https://wope.com/images/footer/grid.svg', dest: 'public/images/footer/grid.svg' },
  // Favicon
  { url: 'https://wope.com/favicon.ico', dest: 'public/seo/favicon.ico' },
  { url: 'https://wope.com/favicon.svg', dest: 'public/seo/favicon.svg' },
  // Logo SVGs for companies (try common paths)
  { url: 'https://wope.com/images/logos/qnb.svg', dest: 'public/images/logos/qnb.svg' },
  { url: 'https://wope.com/images/logos/bmw.svg', dest: 'public/images/logos/bmw.svg' },
  { url: 'https://wope.com/images/logos/delivery-hero.svg', dest: 'public/images/logos/delivery-hero.svg' },
  { url: 'https://wope.com/images/logos/mediamarkt.svg', dest: 'public/images/logos/mediamarkt.svg' },
  { url: 'https://wope.com/images/logos/bayer.svg', dest: 'public/images/logos/bayer.svg' },
  { url: 'https://wope.com/images/logos/amazon.svg', dest: 'public/images/logos/amazon.svg' },
];

async function download(url, dest) {
  const fullPath = join(ROOT, dest);
  const dir = dirname(fullPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  try {
    const res = await fetch(url);
    if (!res.ok) { console.log(`SKIP ${url} (${res.status})`); return; }
    const buf = await res.arrayBuffer();
    writeFileSync(fullPath, Buffer.from(buf));
    console.log(`OK   ${dest}`);
  } catch (e) {
    console.log(`ERR  ${url}: ${e.message}`);
  }
}

// Batch 4 at a time
for (let i = 0; i < assets.length; i += 4) {
  await Promise.all(assets.slice(i, i + 4).map(a => download(a.url, a.dest)));
}
console.log('Done');
