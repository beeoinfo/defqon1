import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveSiteRegistryEntry } from './src/sites/siteRegistry.js'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const assetVersion = '20260510'
const maskableAssetVersion = '20260510-maskable'

const getSiteAppName = (site) => `${site.name === 'DEFQON.1' ? 'Defqon.1' : site.name} Companion`

const getVersionedSiteAssetPath = (site, fileName) => `./${site.slug}/${fileName}?v=${assetVersion}`

const siteHtmlPlugin = (mode) => {
  const env = loadEnv(mode, projectRoot, '')
  const site = resolveSiteRegistryEntry(env.VITE_SITE_SLUG)
  const appName = getSiteAppName(site)
  const getAssetPath = (fileName) => {
    const siteAssetFile = path.resolve(projectRoot, 'public', site.slug, fileName)

    return fs.existsSync(siteAssetFile)
      ? getVersionedSiteAssetPath(site, fileName)
      : `./${fileName}?v=${assetVersion}`
  }

  return {
    name: 'site-html',
    transformIndexHtml(html) {
      return html
        .replaceAll('__SITE_NAME__', site.name)
        .replaceAll('__SITE_APP_NAME__', appName)
        .replaceAll('__SITE_FAVICON_PNG__', getAssetPath('favicon-96x96.png'))
        .replaceAll('__SITE_FAVICON_SVG__', getAssetPath('favicon.svg'))
        .replaceAll('__SITE_FAVICON_ICO__', getAssetPath('favicon.ico'))
        .replaceAll('__SITE_THEME_COLOR__', site.theme.primary)
        .replaceAll('__SITE_APPLE_TOUCH_ICON__', getAssetPath('apple-touch-icon.png'))
        .replaceAll('__SITE_MANIFEST__', getAssetPath('site.webmanifest'))
    },
  }
}

const buildSiteManifest = (site) => {
  const faviconIcon = site.assets.favicon.endsWith('.svg')
    ? [{
        src: `/${site.slug}/${site.assets.favicon}?v=${assetVersion}`,
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      }]
    : []

  return {
    id: `/${site.slug}/`,
    name: getSiteAppName(site),
    short_name: getSiteAppName(site),
    description: `${site.name} festival companion for line-ups, favorites, tribe activity and maps.`,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    background_color: '#0b1110',
    theme_color: site.theme.primary,
    orientation: 'portrait',
    categories: ['music', 'entertainment', 'navigation'],
    icons: [
      ...faviconIcon,
      {
        src: `/${site.slug}/web-app-manifest-192x192.png?v=${assetVersion}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/${site.slug}/web-app-manifest-512x512.png?v=${assetVersion}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: `/${site.slug}/web-app-maskable-192x192.png?v=${maskableAssetVersion}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: `/${site.slug}/web-app-maskable-512x512.png?v=${maskableAssetVersion}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}

const sitePwaManifestPlugin = (mode) => {
  const env = loadEnv(mode, projectRoot, '')
  const site = resolveSiteRegistryEntry(env.VITE_SITE_SLUG)
  const manifest = JSON.stringify(buildSiteManifest(site), null, 2)

  return {
    name: 'site-pwa-manifest',
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_request, response) => {
        response.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')
        response.end(manifest)
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: manifest,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), siteHtmlPlugin(mode), sitePwaManifestPlugin(mode)],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    cssMinify: 'esbuild',
  },
}))
