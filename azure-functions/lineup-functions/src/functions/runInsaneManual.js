import { app } from '@azure/functions';

import { runLineupJob } from '../jobs/runLineupJob.js';
import { requireSupabaseAdmin } from '../lib/adminAuth.js';
import { createJsonResponse, createPreflightResponse } from '../lib/httpResponses.js';

app.http('runInsaneManual', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'lineup/insane/run',
  handler: async (request, context) => {
    if (request.method === 'OPTIONS') {
      return createPreflightResponse(request);
    }

    const authResult = await requireSupabaseAdmin(request);

    if (!authResult.ok) {
      return createJsonResponse(request, authResult.status, authResult.body);
    }

    const result = await runLineupJob({
      siteSlug: 'insane',
      triggerType: 'manual',
      checkActiveWindow: false,
      context,
      supabaseClient: authResult.supabaseClient,
      adminUser: authResult.user,
    });

    return createJsonResponse(request, result.status === 'error' ? 500 : 200, result);
  },
});
