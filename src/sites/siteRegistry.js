export const DEFAULT_SITE_SLUG = 'defqon1';

export const DEFAULT_SITE_THEME = {
  primary: '#bc9b5e',
  secondary: '#ef4444',
};

export const DEFAULT_SITE_ASSETS = {
  logo: 'logo.svg',
  favicon: 'favicon.svg',
};

export const SITE_REGISTRY = {
  defqon1: {
    slug: 'defqon1',
    name: 'DEFQON.1',
    assets: {
      logo: 'logo.svg',
      favicon: 'favicon.svg',
    },
    theme: {
      primary: '#bc9b5e',
      secondary: '#ef4444',
    },
  },
  insane: {
    slug: 'insane',
    name: 'Insane',
    assets: {
      logo: 'LOGO_2026_INSANE-150x150.png',
      favicon: 'favicon.ico',
    },
    theme: {
      primary: '#7562ad',
      secondary: '#e99b8b',
    },
  },
};

export const normalizeSiteSlug = (value) => (
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
);

export const resolveSiteRegistryEntry = (siteSlug) => {
  const normalizedSlug = normalizeSiteSlug(siteSlug) || DEFAULT_SITE_SLUG;
  const definition = SITE_REGISTRY[normalizedSlug] ?? SITE_REGISTRY[DEFAULT_SITE_SLUG];

  return {
    ...definition,
    assets: {
      ...DEFAULT_SITE_ASSETS,
      ...(definition.assets ?? {}),
    },
    theme: {
      ...DEFAULT_SITE_THEME,
      ...(definition.theme ?? {}),
    },
    requestedSlug: normalizedSlug,
  };
};
