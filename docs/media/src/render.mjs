// Renders docs/media/demo.gif and docs/media/social-preview.png from the HTML sources here.
// Needs Playwright (Chromium) and ffmpeg on the machine. Not a project dependency.
// Usage: node docs/media/src/render.mjs  (global Playwright: NODE_PATH=$(npm root -g) node …)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS lookup, so a global install found via NODE_PATH works too.
const { chromium } = createRequire(import.meta.url)('playwright');

const here = dirname(fileURLToPath(import.meta.url));
const media = join(here, '..');
const fps = 25;

const browser = await chromium.launch();

const social = await browser.newPage({ viewport: { width: 1280, height: 640 } });
await social.goto(`file://${join(here, 'social.html')}`);
await social.waitForTimeout(200);
await social.screenshot({ path: join(media, 'social-preview.png') });

const page = await browser.newPage({ viewport: { width: 1200, height: 600 } });
await page.goto(`file://${join(here, 'demo.html')}`);
await page.waitForTimeout(300);
const frames = mkdtempSync(join(tmpdir(), 'blackbar-demo-'));
const total = await page.evaluate(() => window.DURATION * 25);
for (let i = 0; i < total; i++) {
  await page.evaluate((t) => window.render(t), i / fps);
  await page.screenshot({ path: join(frames, `${String(i).padStart(4, '0')}.png`) });
}
await browser.close();

execFileSync('ffmpeg', [
  '-y',
  '-loglevel',
  'error',
  '-framerate',
  String(fps),
  '-i',
  join(frames, '%04d.png'),
  '-vf',
  'fps=20,scale=1000:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
  '-loop',
  '0',
  join(media, 'demo.gif'),
]);
rmSync(frames, { recursive: true });
console.log('Rendered docs/media/demo.gif and docs/media/social-preview.png');
