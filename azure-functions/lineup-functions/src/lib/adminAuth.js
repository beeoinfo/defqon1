import { getSupabaseUserClient } from './supabaseRepository.js';

function getBearerToken(request) {
  const authorization = request.headers.get('authorization') ?? '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function requireSupabaseAdmin(request) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      body: {
        status: 'error',
        action: 'unauthorized',
        message: 'Missing Supabase access token.',
      },
    };
  }

  const supabaseClient = getSupabaseUserClient(accessToken);
  const { data: userData, error: userError } = await supabaseClient.auth.getUser(accessToken);

  if (userError || !userData?.user) {
    return {
      ok: false,
      status: 401,
      body: {
        status: 'error',
        action: 'unauthorized',
        message: 'Invalid or expired Supabase access token.',
      },
    };
  }

  const { data: isAdmin, error: adminError } = await supabaseClient.rpc('is_current_user_admin');

  if (adminError) {
    return {
      ok: false,
      status: 403,
      body: {
        status: 'error',
        action: 'forbidden',
        message: 'Unable to verify admin access.',
      },
    };
  }

  if (isAdmin !== true) {
    return {
      ok: false,
      status: 403,
      body: {
        status: 'error',
        action: 'forbidden',
        message: 'Admin access required.',
      },
    };
  }

  return {
    ok: true,
    supabaseClient,
    user: userData.user,
  };
}
