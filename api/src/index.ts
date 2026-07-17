// ShadowPod API - Cloudflare Workers Entry Point
import { handleRequestOTP, handleVerifyOTP, handleGetMe } from './auth';
import { handleTranscribe } from './transcribe';
import { verifyJWT } from './utils/jwt';

interface Env {
  DB: D1Database;
  DEEPGRAM_API_KEY: string;
  RESEND_API_KEY: string;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
}

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://shadowpod.vercel.app',
  'https://shadowing-webapp-sandy.vercel.app',
];

function getAllowedOrigin(request: Request): string {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return ALLOWED_ORIGINS[0]; // fallback
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowedOrigin = getAllowedOrigin(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(allowedOrigin);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response: Response;

      // Public routes (no auth required)
      if (path === '/auth/request-otp' && request.method === 'POST') {
        response = await handleRequestOTP(request, env);
      } else if (path === '/auth/verify-otp' && request.method === 'POST') {
        response = await handleVerifyOTP(request, env);
      } else if (path === '/api/validate-key' && request.method === 'POST') {
        response = await handleValidateKey(request);
      } else if (path === '/health') {
        response = jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }
      // Protected routes (auth required)
      else {
        const authResult = await authenticate(request, env);
        if (!authResult.success) {
          response = jsonResponse({ error: 'Unauthorized' }, 401);
        } else if (path === '/auth/me' && request.method === 'GET') {
          response = await handleGetMe(authResult.userId!, env);
        } else if (path === '/api/transcribe' && request.method === 'POST') {
          response = await handleTranscribe(request, authResult.userId!, env);
        } else {
          response = jsonResponse({ error: 'Not found' }, 404);
        }
      }

      // Add CORS headers to response
      return addCORSHeaders(response, allowedOrigin);
    } catch (error) {
      console.error('[API] Unhandled error:', error);
      return addCORSHeaders(
        jsonResponse({ error: 'Internal server error' }, 500),
        allowedOrigin
      );
    }
  },
};

// Authentication middleware
async function authenticate(
  request: Request,
  env: Env
): Promise<{ success: boolean; userId?: number }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false };
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);

  if (!payload) {
    return { success: false };
  }

  return { success: true, userId: payload.userId };
}

// CORS handling
function handleCORS(origin: string): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function addCORSHeaders(response: Response, origin: string): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', origin);
  newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Validate user's Deepgram API key by proxying to Deepgram
async function handleValidateKey(request: Request): Promise<Response> {
  try {
    const { apiKey } = await request.json() as { apiKey?: string };

    if (!apiKey || !apiKey.trim()) {
      return jsonResponse({ valid: false, error: 'invalid_key', message: 'API key is required' }, 400);
    }

    const response = await fetch('https://api.deepgram.com/v1/projects', {
      method: 'GET',
      headers: {
        'Authorization': `Token ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return jsonResponse({ valid: true });
    }

    if (response.status === 401) {
      return jsonResponse({ valid: false, error: 'invalid_key', message: 'Key không hợp lệ. Vui lòng kiểm tra lại.' });
    }

    if (response.status === 403) {
      return jsonResponse({ valid: false, error: 'quota_exceeded', message: 'Key đã hết dung lượng (Quota). Vui lòng nạp thêm.' });
    }

    return jsonResponse({ valid: false, error: 'unknown', message: `Lỗi không xác định (${response.status})` });
  } catch (error) {
    console.error('[API] Validate key error:', error);
    return jsonResponse({ valid: false, error: 'network_error', message: 'Không thể kết nối đến Deepgram' }, 500);
  }
}
