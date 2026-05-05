const lineupModules = import.meta.glob('../data/**/*.json', {
});

const normalizePath = (path) => String(path ?? '').replace(/\\/g, '/');

const matchesSiteDataPath = ({ path, siteSlug }) => {
  const normalizedPath = normalizePath(path);

  return normalizedPath.includes(`/data/${siteSlug}/`);
};

export const getSiteLineupModuleEntries = async (site) => {
  const matchingEntries = Object.entries(lineupModules)
    .filter(([path]) => matchesSiteDataPath({ path, siteSlug: site.slug }))
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath));

  return Promise.all(
    matchingEntries.map(async ([path, loadModule]) => [path, await loadModule()])
  );
};
