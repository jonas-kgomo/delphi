import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { DEMO_KINDS } from './lib/chapters';
import { SITE_ORIGIN, absoluteImage, seoFromLocation, type SeoPage } from './lib/seo';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function setMeta(html: string, attr: 'property' | 'name' | 'rel', key: string, content: string) {
  const encoded = escapeHtml(content);
  if (attr === 'rel') {
    const re = new RegExp(`(<link\\s+rel="${key}"\\s+href=")[^"]*(")`);
    return html.replace(re, `$1${encoded}$2`);
  }
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  return html.replace(re, `$1${encoded}$2`);
}

export function patchShareHtml(html: string, page: SeoPage) {
  const url = `${SITE_ORIGIN}${page.path}`;
  const image = absoluteImage(page.image, SITE_ORIGIN);
  let next = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  next = setMeta(next, 'name', 'description', page.description);
  next = setMeta(next, 'rel', 'canonical', url);
  next = setMeta(next, 'property', 'og:title', page.title);
  next = setMeta(next, 'property', 'og:description', page.description);
  next = setMeta(next, 'property', 'og:url', url);
  next = setMeta(next, 'property', 'og:image', image);
  next = setMeta(next, 'property', 'og:image:alt', page.imageAlt ?? page.title);
  next = setMeta(next, 'name', 'twitter:title', page.title);
  next = setMeta(next, 'name', 'twitter:description', page.description);
  next = setMeta(next, 'name', 'twitter:image', image);
  return next;
}

function shareHtmlPlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'precinct-share-html',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html, ctx) {
      const raw = ctx.originalUrl || '/';
      const url = new URL(raw, 'http://local.precinct');
      return patchShareHtml(html, seoFromLocation(url.pathname, url.search));
    },
    closeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;
      const index = fs.readFileSync(indexPath, 'utf8');
      for (const kind of DEMO_KINDS) {
        const html = patchShareHtml(index, seoFromLocation(`/${kind}/`, ''));
        const dir = path.join(outDir, kind);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, 'index.html'), html);
      }
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), shareHtmlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
