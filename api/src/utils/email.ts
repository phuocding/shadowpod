// Resend email integration for OTP delivery

interface SendOTPOptions {
  to: string;
  code: string;
  apiKey: string;
}

interface ResendResponse {
  id?: string;
  error?: { message: string };
}

interface SendOTPResult {
  success: boolean;
  error?: string;
}

export async function sendOTPEmail({ to, code, apiKey }: SendOTPOptions): Promise<SendOTPResult> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShadowPod <noreply@hergan.co>',
        to: [to],
        subject: `Your ShadowPod login code: ${code}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="color: #1ed760; font-size: 24px; margin-bottom: 24px;">ShadowPod</h1>
            <p style="color: #333; font-size: 16px; margin-bottom: 24px;">
              Enter this code to sign in to your account:
            </p>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">
                ${code}
              </span>
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 8px;">
              This code expires in 10 minutes.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this code, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
            <p style="color: #999; font-size: 12px;">
              ShadowPod - Your Personal Listening Gym
            </p>
          </div>
        `,
      }),
    });

    const result: ResendResponse = await response.json();

    if (!response.ok || result.error) {
      const errorMsg = result.error?.message || `HTTP ${response.status}`;
      console.error('[Email] Failed to send:', errorMsg);
      return { success: false, error: errorMsg };
    }

    console.log('[Email] Sent successfully:', result.id);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email] Error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

export function generateOTP(): string {
  // Generate 6-digit OTP
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}
