const lineupModules = import.meta.glob('../data/**/*.json', {
  eager: true,
});

const normalizePath = (path) => String(path ?? '').replace(/\\/g, '/');

const matchesSiteDataPath = ({ path, siteSlug }) => {
  const normalizedPath = normalizePath(path);

  return normalizedPath.includes(`/data/${siteSlug}/`);
};

export const getSiteLineupModuleEntries = (site) => (
  Object.entries(lineupModules)
    .filter(([path]) => matchesSiteDataPath({ path, siteSlug: site.slug }))
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
);
