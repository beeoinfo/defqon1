import { resolveSiteRegistryEntry } from './siteRegistry';

export const resolveSiteDefinition = (siteSlug) => resolveSiteRegistryEntry(siteSlug);

export const activeSite = resolveSiteDefinition(import.meta.env.VITE_SITE_SLUG);
