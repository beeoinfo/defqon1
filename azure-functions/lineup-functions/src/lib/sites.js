export const SITE_SLUGS = {
  DEFQON1: 'defqon1',
  INSANE: 'insane',
};

export const SITE_CONFIG = {
  [SITE_SLUGS.DEFQON1]: {
    slug: SITE_SLUGS.DEFQON1,
    name: 'DEFQON.1',
    envPrefix: 'DEFQON1',
  },
  [SITE_SLUGS.INSANE]: {
    slug: SITE_SLUGS.INSANE,
    name: 'Insane',
    envPrefix: 'INSANE',
  },
};

export function normalizeSiteSlug(siteSlug) {
  return String(siteSlug ?? '').trim().toLowerCase();
}

export function getSiteConfig(siteSlug) {
  const normalizedSiteSlug = normalizeSiteSlug(siteSlug);
  const config = SITE_CONFIG[normalizedSiteSlug];

  if (!config) {
    throw new Error(`Unsupported site slug: ${siteSlug}`);
  }

  return config;
}
