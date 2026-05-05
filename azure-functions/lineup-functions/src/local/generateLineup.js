import { generateDefqon1Lineup } from '../generators/generateDefqon1Lineup.js';
import { generateInsaneLineup } from '../generators/generateInsaneLineup.js';

const generators = {
  defqon1: generateDefqon1Lineup,
  insane: generateInsaneLineup,
};

const siteSlug = String(process.argv[2] ?? '').trim().toLowerCase();
const generator = generators[siteSlug];

if (!generator) {
  console.error('Usage: node src/local/generateLineup.js <defqon1|insane>');
  process.exit(1);
}

const result = await generator();
console.log(JSON.stringify({
  siteSlug: result.siteSlug,
  versionLabel: result.versionLabel,
  sourceUrl: result.sourceUrl,
  sourceUpdatedAt: result.sourceUpdatedAt,
  stats: result.stats,
  payloadPreview: {
    eventEditionName: result.payload.eventEditionName,
    updatedAt: result.payload.updatedAt,
    dayCount: result.payload.lineup?.length ?? 0,
  },
}, null, 2));
