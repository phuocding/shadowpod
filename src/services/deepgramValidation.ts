/**
 * Deepgram API Key Validation Service
 * Validates API key via Cloudflare Worker proxy (avoids CORS issues)
 */

const API_BASE = import.meta.env.PROD
  ? 'https://shadowpod-api.phuocding.workers.dev'
  : 'https://shadowpod-api.phuocding.workers.dev'; // Use prod API even in dev

export interface ValidationResult {
  valid: boolean;
  error?: 'invalid_key' | 'quota_exceeded' | 'network_error';
  message?: string;
}

/**
 * Validate Deepgram API key via Worker proxy
 * Returns validation result with error details if invalid
 */
export async function validateDeepgramKey(apiKey: string): Promise<ValidationResult> {
  if (!apiKey || !apiKey.trim()) {
    return { valid: false, error: 'invalid_key', message: 'API key is required' };
  }

  try {
    const response = await fetch(`${API_BASE}/api/validate-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    });

    const data = await response.json();
    return data as ValidationResult;
  } catch (error) {
    return {
      valid: false,
      error: 'network_error',
      message: 'Không thể kết nối. Kiểm tra mạng.',
    };
  }
}
