import type { Segment, DeepgramResponse, ErrorCode } from '../types';
import { transcribeWithAPI, type UserQuota } from './api';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

interface TranscribeResult {
  segments: Segment[];
  error?: ErrorCode;
  quota?: UserQuota;
}

export async function transcribe(
  audioBlob: Blob,
  apiKey: string
): Promise<TranscribeResult> {
  try {
    const response = await fetch(
      `${DEEPGRAM_API_URL}?model=nova-2&smart_format=true&punctuate=true&utterances=true&language=en`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': audioBlob.type || 'audio/mpeg',
        },
        body: audioBlob,
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { segments: [], error: 'INVALID_API_KEY' };
      }
      if (response.status === 402) {
        return { segments: [], error: 'QUOTA_EXCEEDED' };
      }
      return { segments: [], error: 'TRANSCRIBE_FAILED' };
    }

    const data: DeepgramResponse = await response.json();
    const segments = parseDeepgramResponse(data);

    return { segments };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { segments: [], error: 'NETWORK_ERROR' };
    }
    return { segments: [], error: 'TRANSCRIBE_FAILED' };
  }
}

function parseDeepgramResponse(data: DeepgramResponse): Segment[] {
  const utterances = data.results?.utterances;
  let segments: Segment[] = [];

  if (utterances && utterances.length > 0) {
    segments = utterances.map((utterance, index) => ({
      id: index,
      text: utterance.transcript,
      startTime: utterance.start,
      endTime: utterance.end,
      words: utterance.words.map((w) => ({
        text: w.punctuated_word || w.word,
        startTime: w.start,
        endTime: w.end,
        confidence: w.confidence,
      })),
    }));
  } else {
    // Fallback: parse from words if no utterances
    const channel = data.results?.channels?.[0];
    const alternative = channel?.alternatives?.[0];

    if (!alternative?.words?.length) {
      return [];
    }

    // Group words into sentences by punctuation
    let currentSegment: Segment | null = null;

    alternative.words.forEach((word, index) => {
      const wordText = word.punctuated_word || word.word;

      if (!currentSegment) {
        currentSegment = {
          id: segments.length,
          text: wordText,
          startTime: word.start,
          endTime: word.end,
          words: [{
            text: wordText,
            startTime: word.start,
            endTime: word.end,
            confidence: word.confidence,
          }],
        };
      } else {
        currentSegment.text += ' ' + wordText;
        currentSegment.endTime = word.end;
        currentSegment.words.push({
          text: wordText,
          startTime: word.start,
          endTime: word.end,
          confidence: word.confidence,
        });
      }

      // End segment on sentence-ending punctuation
      if (wordText.match(/[.!?]$/) || index === alternative.words.length - 1) {
        segments.push(currentSegment);
        currentSegment = null;
      }
    });
  }

  // Normalize first segment to start at 0
  if (segments.length > 0 && segments[0].startTime > 0) {
    segments[0].startTime = 0;
    if (segments[0].words.length > 0) {
      segments[0].words[0].startTime = 0;
    }
  }

  return segments;
}

// Transcribe using server API (no key exposed to client)
export async function transcribeWithServerAPI(
  audioBlob: Blob
): Promise<TranscribeResult> {
  try {
    // Convert blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const response = await transcribeWithAPI(base64, audioBlob.type || 'audio/mpeg');

    if (!response.success) {
      return { segments: [], error: 'TRANSCRIBE_FAILED' };
    }

    const segments = parseDeepgramResponse(response.transcript);

    return {
      segments,
      quota: response.usage?.quota
    };
  } catch (error: any) {
    console.error('[Transcriber] Server API error:', error);

    if (error.message?.includes('quota')) {
      return { segments: [], error: 'QUOTA_EXCEEDED' };
    }
    if (error.message?.includes('auth') || error.message?.includes('401')) {
      return { segments: [], error: 'INVALID_API_KEY' };
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { segments: [], error: 'NETWORK_ERROR' };
    }

    return { segments: [], error: 'TRANSCRIBE_FAILED' };
  }
}
