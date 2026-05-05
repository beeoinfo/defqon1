import { createClient } from '@supabase/supabase-js';

import { loadLocalSettings } from './localSettings.js';

let serviceClient = null;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createSupabaseClient({ accessToken = null, useServiceRole = false } = {}) {
  loadLocalSettings();

  const supabaseUrl = getRequiredEnv('SUPABASE_URL');
  const supabaseKey = useServiceRole
    ? getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')
    : getRequiredEnv('SUPABASE_ANON_KEY');

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export function getSupabaseServiceClient() {
  if (serviceClient) return serviceClient;

  serviceClient = createSupabaseClient({ useServiceRole: true });
  return serviceClient;
}

export function getSupabaseUserClient(accessToken) {
  if (!accessToken) {
    throw new Error('Missing Supabase access token.');
  }

  return createSupabaseClient({ accessToken });
}

export async function findLineupVersionByHash({ siteSlug, payloadHash, supabaseClient = null }) {
  const supabase = supabaseClient ?? getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('lineup_versions')
    .select('id, status, imported_at')
    .eq('site_slug', siteSlug)
    .eq('payload_hash', payloadHash)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function loadLineupVersion({
  siteSlug,
  payload,
  payloadHash,
  sourceKind = 'server',
  sourceUrl = null,
  sourceUpdatedAt = null,
  sourceHash = null,
  detectedChanges = {},
  versionLabel = null,
  supabaseClient = null,
}) {
  const supabase = supabaseClient ?? getSupabaseServiceClient();
  const { data, error } = await supabase.rpc('load_lineup_version', {
    site_slug_input: siteSlug,
    payload_input: payload,
    payload_hash_input: payloadHash,
    source_kind_input: sourceKind,
    source_url_input: sourceUrl,
    source_updated_at_input: sourceUpdatedAt,
    source_hash_input: sourceHash,
    detected_changes_input: detectedChanges,
    version_label_input: versionLabel,
  });

  if (error) throw error;
  return data;
}
