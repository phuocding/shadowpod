// JWT utilities for ShadowPod API
// Using Web Crypto API (available in Workers)

interface JWTPayload {
  sub: string;  // user email
  userId: number;
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();

async function createHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(data: ArrayBuffer | string): string {
  const str = typeof data === 'string'
    ? btoa(data)
    : btoa(String.fromCharCode(...new Uint8Array(data)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  const padded = str + '==='.slice(0, (4 - str.length % 4) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInHours: number = 24 * 7  // 7 days default
): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInHours * 3600,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const message = `${headerB64}.${payloadB64}`;

  const key = await createHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureB64 = base64UrlEncode(signature);

  return `${message}.${signatureB64}`;
}

export async function verifyJWT(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const message = `${headerB64}.${payloadB64}`;
    const key = await createHmacKey(secret);

    // Decode signature
    const signatureStr = base64UrlDecode(signatureB64);
    const signature = new Uint8Array(signatureStr.length);
    for (let i = 0; i < signatureStr.length; i++) {
      signature[i] = signatureStr.charCodeAt(i);
    }

    const valid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(message));
    if (!valid) return null;

    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadB64));

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
