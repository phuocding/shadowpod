import type { ErrorCode } from '../types';

export const errorMessages: Record<ErrorCode, string> = {
  INVALID_FORMAT: 'Định dạng file không hỗ trợ. Vui lòng dùng mp3, m4a, wav, webm, hoặc ogg.',
  FILE_TOO_LARGE: 'File quá lớn. Vui lòng chọn file dưới 10MB.',
  INVALID_API_KEY: 'API key không hợp lệ. Vui lòng kiểm tra lại trong Settings.',
  QUOTA_EXCEEDED: 'Đã hết quota Deepgram. Vui lòng kiểm tra account của bạn.',
  NETWORK_ERROR: 'Mất kết nối mạng. Vui lòng kiểm tra internet và thử lại.',
  TRANSCRIBE_FAILED: 'Không thể xử lý file audio. Vui lòng thử file khác.',
  STORAGE_FULL: 'Bộ nhớ đầy. Vui lòng xóa bớt audio cũ.',
};

export function getErrorMessage(code: ErrorCode): string {
  return errorMessages[code] || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
