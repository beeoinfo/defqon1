import { loadLocalSettings } from '../lib/localSettings.js';
import { runLineupJob } from '../jobs/runLineupJob.js';

loadLocalSettings();

const siteSlug = process.argv[2];
if (!siteSlug) {
  console.error('Usage: node src/local/runLineup.js <defqon1|insane>');
  process.exit(1);
}

const result = await runLineupJob({
  siteSlug,
  triggerType: 'manual',
});

console.log(JSON.stringify(result, null, 2));

if (result.status === 'error') {
  process.exit(1);
}
