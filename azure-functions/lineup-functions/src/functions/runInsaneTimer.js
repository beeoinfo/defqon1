import { app } from '@azure/functions';
import { runLineupJob } from '../jobs/runLineupJob.js';

app.timer('runInsaneTimer', {
  schedule: '%INSANE_LINEUP_CRON%',
  runOnStartup: false,
  handler: async (_timer, context) => {
    const result = await runLineupJob({
      siteSlug: 'insane',
      triggerType: 'timer',
      force: false,
      checkActiveWindow: true,
      context,
    });

    context.log(JSON.stringify(result));
  },
});
