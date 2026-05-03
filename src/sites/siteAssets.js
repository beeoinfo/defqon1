import { DEFAULT_SITE_SLUG } from './siteRegistry';
import { activeSite } from './siteDefinitions';

const siteLogoModules = import.meta.glob('../assets/*/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

const getSiteAsset = ({ modules, siteSlug, fileName }) => {
  const expectedPath = `../assets/${siteSlug}/${fileName}`;
  const defaultPath = `../assets/${DEFAULT_SITE_SLUG}/${fileName}`;

  return modules[expectedPath] ?? modules[defaultPath] ?? '';
};

export const activeSiteAssets = {
  logoSrc: getSiteAsset({
    modules: siteLogoModules,
    siteSlug: activeSite.slug,
    fileName: activeSite.assets.logo,
  }),
};
