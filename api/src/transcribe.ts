// Transcribe handler - Deepgram proxy with quota checking

interface Env {
  DB: D1Database;
  DEEPGRAM_API_KEY: string;
}

interface TranscribeRequest {
  audioUrl?: string;
  audioBase64?: string;
  mimeType?: string;
}

// POST /api/transcribe
export async function handleTranscribe(
  request: Request,
  userId: number,
  env: Env
): Promise<Response> {
  try {
    // Check quota first
    const quotaCheck = await checkQuota(userId, env);
    if (!quotaCheck.hasQuota) {
      return jsonResponse({
        error: 'Quota exceeded',
        quota: quotaCheck,
      }, 403);
    }

    const body = await request.json() as TranscribeRequest;

    // Prepare audio data
    let audioData: ArrayBuffer;
    let contentType: string;

    if (body.audioBase64) {
      // Decode base64 audio
      const binaryString = atob(body.audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioData = bytes.buffer;
      contentType = body.mimeType || 'audio/mp3';
    } else if (body.audioUrl) {
      // Fetch audio from URL
      const audioResponse = await fetch(body.audioUrl);
      if (!audioResponse.ok) {
        return jsonResponse({ error: 'Failed to fetch audio' }, 400);
      }
      audioData = await audioResponse.arrayBuffer();
      contentType = audioResponse.headers.get('content-type') || 'audio/mp3';
    } else {
      return jsonResponse({ error: 'audioBase64 or audioUrl required' }, 400);
    }

    // Estimate duration (rough estimate: 1MB ≈ 1 minute for mp3)
    const estimatedMinutes = audioData.byteLength / (1024 * 1024);

    // Call Deepgram API
    const deepgramResponse = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-3&language=en&smart_format=true&punctuate=true&utterances=true&paragraphs=true&utt_split=0.8&numerals=true',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${env.DEEPGRAM_API_KEY}`,
          'Content-Type': contentType,
        },
        body: audioData,
      }
    );

    if (!deepgramResponse.ok) {
      const error = await deepgramResponse.text();
      console.error('[Transcribe] Deepgram error:', error);
      return jsonResponse({ error: 'Transcription failed' }, 500);
    }

    const result = await deepgramResponse.json();

    // Get actual duration from Deepgram response
    const actualMinutes = (result.metadata?.duration || estimatedMinutes * 60) / 60;

    // Update usage
    await updateUsage(userId, actualMinutes, env);

    // Return transcript with updated quota
    const newQuota = await checkQuota(userId, env);

    return jsonResponse({
      success: true,
      transcript: result,
      usage: {
        minutesUsed: actualMinutes,
        quota: newQuota,
      },
    });
  } catch (error) {
    console.error('[Transcribe] Error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
}

async function checkQuota(userId: number, env: Env): Promise<{
  hasQuota: boolean;
  minutesUsed: number;
  minutesQuota: number;
  minutesRemaining: number;
}> {
  const month = new Date().toISOString().slice(0, 7);

  // Get usage
  const usage = await env.DB.prepare(
    'SELECT minutes_used FROM usage WHERE user_id = ? AND month = ?'
  ).bind(userId, month).first();

  // Get subscription
  const subscription = await env.DB.prepare(`
    SELECT minutes_quota FROM subscriptions
    WHERE user_id = ? AND expires_at > datetime('now')
    ORDER BY expires_at DESC LIMIT 1
  `).bind(userId).first();

  const minutesUsed = (usage?.minutes_used as number) || 0;
  const minutesQuota = (subscription?.minutes_quota as number) || 0;
  const minutesRemaining = Math.max(0, minutesQuota - minutesUsed);

  return {
    hasQuota: minutesRemaining > 0,
    minutesUsed,
    minutesQuota,
    minutesRemaining,
  };
}

async function updateUsage(userId: number, minutes: number, env: Env): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);

  // Upsert usage record
  await env.DB.prepare(`
    INSERT INTO usage (user_id, month, minutes_used)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, month) DO UPDATE SET
    minutes_used = minutes_used + excluded.minutes_used
  `).bind(userId, month, minutes).run();
}

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
