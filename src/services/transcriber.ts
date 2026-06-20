import type { Segment, DeepgramResponse, ErrorCode } from '../types';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

interface TranscribeResult {
  segments: Segment[];
  error?: ErrorCode;
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

  if (utterances && utterances.length > 0) {
    return utterances.map((utterance, index) => ({
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
  }

  // Fallback: parse from words if no utterances
  const channel = data.results?.channels?.[0];
  const alternative = channel?.alternatives?.[0];

  if (!alternative?.words?.length) {
    return [];
  }

  // Group words into sentences by punctuation
  const segments: Segment[] = [];
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

  return segments;
}
