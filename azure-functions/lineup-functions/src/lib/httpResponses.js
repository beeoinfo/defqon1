import { loadLocalSettings } from './localSettings.js';

function getAllowedOrigins() {
  loadLocalSettings();

  return String(process.env.ADMIN_ALLOWED_ORIGINS ?? '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function resolveAllowedOrigin(request) {
  const requestOrigin = request.headers.get('origin') ?? '';
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.includes('*')) return '*';
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;

  return allowedOrigins[0] ?? '*';
}

export function getCorsHeaders(request) {
  const allowedOrigin = resolveAllowedOrigin(request);

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export function createPreflightResponse(request) {
  return {
    status: 204,
    headers: getCorsHeaders(request),
  };
}

export function createJsonResponse(request, status, body) {
  return {
    status,
    headers: getCorsHeaders(request),
    jsonBody: body,
  };
}
