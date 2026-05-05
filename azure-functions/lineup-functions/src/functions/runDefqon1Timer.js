import { app } from '@azure/functions';
import { runLineupJob } from '../jobs/runLineupJob.js';

app.timer('runDefqon1Timer', {
  schedule: '%DEFQON1_LINEUP_CRON%',
  runOnStartup: false,
  handler: async (_timer, context) => {
    const result = await runLineupJob({
      siteSlug: 'defqon1',
      triggerType: 'timer',
      force: false,
      checkActiveWindow: true,
      context,
    });

    context.log(JSON.stringify(result));
  },
});
