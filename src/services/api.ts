// ShadowPod API Client
const API_URL = import.meta.env.VITE_API_URL || 'https://shadowpod-api.phuocding.workers.dev';

// Get stored JWT token
function getToken(): string | null {
  return localStorage.getItem('shadowpod_token');
}

// Set JWT token
export function setToken(token: string): void {
  localStorage.setItem('shadowpod_token', token);
}

// Clear JWT token
export function clearToken(): void {
  localStorage.removeItem('shadowpod_token');
}

// Check if user is logged in
export function isLoggedIn(): boolean {
  return !!getToken();
}

// API fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth endpoints
export async function requestOTP(email: string): Promise<{ success: boolean; message: string }> {
  return apiFetch('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOTP(email: string, code: string): Promise<{
  success: boolean;
  token: string;
  user: { id: number; email: string };
}> {
  return apiFetch('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export interface UserQuota {
  minutesUsed: number;
  minutesQuota: number;
  minutesRemaining: number;
  hasActiveSubscription: boolean;
  expiresAt: string | null;
}

export interface UserInfo {
  user: {
    id: number;
    email: string;
    createdAt: string;
  };
  quota: UserQuota;
}

export async function getMe(): Promise<UserInfo> {
  return apiFetch('/auth/me');
}

// Transcribe endpoint
export async function transcribeWithAPI(audioBase64: string, mimeType: string): Promise<{
  success: boolean;
  transcript: any;
  usage: { minutesUsed: number; quota: UserQuota };
}> {
  return apiFetch('/api/transcribe', {
    method: 'POST',
    body: JSON.stringify({ audioBase64, mimeType }),
  });
}
