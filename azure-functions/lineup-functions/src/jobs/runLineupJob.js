import { generateDefqon1Lineup } from '../generators/generateDefqon1Lineup.js';
import { generateInsaneLineup } from '../generators/generateInsaneLineup.js';
import { createSha256Hash } from '../lib/stableHash.js';
import { findLineupVersionByHash, loadLineupVersion } from '../lib/supabaseRepository.js';
import { getSiteConfig } from '../lib/sites.js';

const generators = {
  defqon1: generateDefqon1Lineup,
  insane: generateInsaneLineup,
};

function getComparablePayload(payload) {
  return {
    eventEditionName: payload.eventEditionName ?? null,
    mapboxLayers: payload.mapboxLayers ?? [],
    lineup: payload.lineup ?? [],
  };
}

function isEnabled(config) {
  const value = process.env[`${config.envPrefix}_LINEUP_ENABLED`];
  return String(value ?? 'true').toLowerCase() !== 'false';
}

function isInActiveWindow(config, now = new Date()) {
  const activeFromValue = process.env[`${config.envPrefix}_LINEUP_ACTIVE_FROM`];
  const activeToValue = process.env[`${config.envPrefix}_LINEUP_ACTIVE_TO`];
  const activeFrom = activeFromValue ? new Date(activeFromValue) : null;
  const activeTo = activeToValue ? new Date(activeToValue) : null;

  if (activeFrom && !Number.isNaN(activeFrom.getTime()) && now < activeFrom) return false;
  if (activeTo && !Number.isNaN(activeTo.getTime()) && now > activeTo) return false;

  return true;
}

function getSourceKind(triggerType) {
  return triggerType === 'manual' ? 'manual' : 'server';
}

export async function runLineupJob({
  siteSlug,
  triggerType = 'manual',
  checkActiveWindow = false,
  context = null,
  supabaseClient = null,
  adminUser = null,
}) {
  const config = getSiteConfig(siteSlug);
  const generator = generators[config.slug];

  if (!generator) {
    throw new Error(`No generator found for site slug: ${config.slug}`);
  }

  if (!isEnabled(config)) {
    return {
      status: 'nothing',
      action: 'disabled',
      siteSlug: config.slug,
    };
  }

  if (checkActiveWindow && !isInActiveWindow(config)) {
    return {
      status: 'nothing',
      action: 'outside_active_window',
      siteSlug: config.slug,
    };
  }

  try {
    const generated = await generator();
    const comparablePayload = getComparablePayload(generated.payload);
    const payloadHash = createSha256Hash(comparablePayload);

    const existingVersion = await findLineupVersionByHash({
      siteSlug: config.slug,
      payloadHash,
      supabaseClient,
    });

    if (existingVersion) {
      return {
        status: 'nothing',
        action: 'no_change',
        siteSlug: config.slug,
        payloadHash,
        existingVersionId: existingVersion.id,
        existingStatus: existingVersion.status,
        stats: generated.stats,
      };
    }

    const detectedChanges = {
      source: 'azure_function',
      triggerType,
      adminUserId: adminUser?.id ?? null,
      stats: generated.stats,
    };

    const lineupVersionId = await loadLineupVersion({
      siteSlug: config.slug,
      payload: generated.payload,
      payloadHash,
      sourceKind: getSourceKind(triggerType),
      sourceUrl: generated.sourceUrl ?? null,
      sourceUpdatedAt: generated.sourceUpdatedAt ?? null,
      sourceHash: generated.sourceHash ?? null,
      detectedChanges,
      versionLabel: generated.versionLabel ?? null,
      supabaseClient,
    });

    context?.log?.(`Loaded pending lineup version ${lineupVersionId} for ${config.slug}.`);

    return {
      status: 'success',
      action: 'loaded_pending',
      siteSlug: config.slug,
      lineupVersionId,
      payloadHash,
      stats: generated.stats,
    };
  } catch (error) {
    context?.error?.(error);

    return {
      status: 'error',
      action: 'failed',
      siteSlug: config.slug,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}
