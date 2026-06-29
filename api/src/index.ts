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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(env);
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
      return addCORSHeaders(response, env);
    } catch (error) {
      console.error('[API] Unhandled error:', error);
      return addCORSHeaders(
        jsonResponse({ error: 'Internal server error' }, 500),
        env
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
function handleCORS(env: Env): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function addCORSHeaders(response: Response, env: Env): Response {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', env.CORS_ORIGIN);
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
