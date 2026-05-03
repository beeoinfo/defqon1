import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveSiteRegistryEntry } from './src/sites/siteRegistry.js'

const siteHtmlPlugin = (mode) => {
  const env = loadEnv(mode, process.cwd(), '')
  const site = resolveSiteRegistryEntry(env.VITE_SITE_SLUG)
  const siteFaviconPath = `/${site.slug}/${site.assets.favicon}`
  const siteFaviconFile = path.resolve(process.cwd(), 'public', site.slug, site.assets.favicon)
  const fallbackFaviconPath = `/${site.assets.favicon}`
  const resolvedFaviconPath = fs.existsSync(siteFaviconFile) ? siteFaviconPath : fallbackFaviconPath
  const faviconPath = `${resolvedFaviconPath}?site=${site.slug}`

  return {
    name: 'site-html',
    transformIndexHtml(html) {
      return html
        .replace('__SITE_NAME__', site.name)
        .replace('__SITE_FAVICON__', faviconPath)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), siteHtmlPlugin(mode)],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    cssMinify: 'esbuild',
  },
}))
