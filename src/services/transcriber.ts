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
      `${DEEPGRAM_API_URL}?model=nova-3&language=en&smart_format=true&punctuate=true&utterances=true&paragraphs=true&utt_split=0.8&numerals=true`,
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

    // DEBUG: Log raw Deepgram response
    console.log('[Transcriber] Raw Deepgram response:', JSON.stringify(data, null, 2));

    const segments = parseDeepgramResponse(data);

    // DEBUG: Log parsed segments with timing comparison
    console.log('[Transcriber] Parsed segments:');
    segments.forEach((seg, i) => {
      const firstWord = seg.words[0];
      const lastWord = seg.words[seg.words.length - 1];
      console.log(`  Seg ${i}: "${seg.text.substring(0, 40)}..."`);
      console.log(`    utterance: ${seg.startTime.toFixed(2)}s → ${seg.endTime.toFixed(2)}s`);
      if (firstWord && lastWord) {
        console.log(`    words[0]:  ${firstWord.startTime.toFixed(2)}s | words[-1]: ${lastWord.endTime.toFixed(2)}s`);
        console.log(`    GAP start: ${(seg.startTime - firstWord.startTime).toFixed(2)}s | GAP end: ${(seg.endTime - lastWord.endTime).toFixed(2)}s`);
      }
    });

    return { segments };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { segments: [], error: 'NETWORK_ERROR' };
    }
    return { segments: [], error: 'TRANSCRIBE_FAILED' };
  }
}

function parseDeepgramResponse(data: DeepgramResponse): Segment[] {
  // IMPORTANT: Always use channel words, NOT utterances
  // Deepgram utterances may have normalized/different timestamps
  // Channel words have accurate absolute timestamps matching the audio file
  const channel = data.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  if (!alternative?.words?.length) {
    return [];
  }

  const segments: Segment[] = [];
  let currentSegment: Segment | null = null;

  // Group words into sentences by punctuation
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
