// Authentication handlers - OTP request and verification
import { signJWT } from './utils/jwt';
import { sendOTPEmail, generateOTP } from './utils/email';

interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  JWT_SECRET: string;
}

// POST /auth/request-otp
export async function handleRequestOTP(request: Request, env: Env): Promise<Response> {
  try {
    const { email } = await request.json() as { email?: string };

    if (!email || !isValidEmail(email)) {
      return jsonResponse({ error: 'Valid email required' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate previous OTPs for this email
    await env.DB.prepare(
      'UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0'
    ).bind(normalizedEmail).run();

    // Store new OTP
    await env.DB.prepare(
      'INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)'
    ).bind(normalizedEmail, code, expiresAt.toISOString()).run();

    // Send email
    if (!env.RESEND_API_KEY) {
      console.error('[Auth] RESEND_API_KEY is not set');
      return jsonResponse({ error: 'Email service not configured' }, 500);
    }

    const emailResult = await sendOTPEmail({
      to: normalizedEmail,
      code,
      apiKey: env.RESEND_API_KEY,
    });

    if (!emailResult.success) {
      return jsonResponse({ error: emailResult.error || 'Failed to send email' }, 500);
    }

    return jsonResponse({ success: true, message: 'OTP sent to email' });
  } catch (error) {
    console.error('[Auth] Request OTP error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// POST /auth/verify-otp
export async function handleVerifyOTP(request: Request, env: Env): Promise<Response> {
  try {
    const { email, code } = await request.json() as { email?: string; code?: string };

    if (!email || !code) {
      return jsonResponse({ error: 'Email and code required' }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find valid OTP
    const otp = await env.DB.prepare(`
      SELECT * FROM otp_codes
      WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
      ORDER BY created_at DESC LIMIT 1
    `).bind(normalizedEmail, code).first();

    if (!otp) {
      return jsonResponse({ error: 'Invalid or expired code' }, 401);
    }

    // Mark OTP as used
    await env.DB.prepare(
      'UPDATE otp_codes SET used = 1 WHERE id = ?'
    ).bind(otp.id).run();

    // Get or create user
    let user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(normalizedEmail).first();

    if (!user) {
      const result = await env.DB.prepare(
        'INSERT INTO users (email) VALUES (?) RETURNING *'
      ).bind(normalizedEmail).first();
      user = result;
    }

    if (!user) {
      return jsonResponse({ error: 'Failed to create user' }, 500);
    }

    // Generate JWT
    const token = await signJWT(
      { sub: normalizedEmail, userId: user.id as number },
      env.JWT_SECRET
    );

    return jsonResponse({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[Auth] Verify OTP error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// GET /auth/me - Get current user info + quota
export async function handleGetMe(userId: number, env: Env): Promise<Response> {
  try {
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    // Get current month usage
    const month = new Date().toISOString().slice(0, 7); // '2026-06'
    const usage = await env.DB.prepare(
      'SELECT minutes_used FROM usage WHERE user_id = ? AND month = ?'
    ).bind(userId, month).first();

    // Get active subscription
    const subscription = await env.DB.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY expires_at DESC LIMIT 1
    `).bind(userId).first();

    const minutesUsed = (usage?.minutes_used as number) || 0;
    const minutesQuota = (subscription?.minutes_quota as number) || 0;

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
      quota: {
        minutesUsed: Math.round(minutesUsed * 100) / 100,
        minutesQuota,
        minutesRemaining: Math.max(0, minutesQuota - minutesUsed),
        hasActiveSubscription: !!subscription,
        expiresAt: subscription?.expires_at || null,
      },
    });
  } catch (error) {
    console.error('[Auth] Get me error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

// Helpers
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
