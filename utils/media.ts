import { getBackendOrigin } from '@/components/api/client';

export const FALLBACK_POST_IMAGE = 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800';

/**
 * Resolves any media URL so it always points to the current active backend server.
 * Handles:
 * - Relative upload paths: /uploads/example.jpg -> http://<active-ip>:5000/uploads/example.jpg
 * - Stale IP uploads: http://10.254.208.254:5000/uploads/xyz.jpg -> http://<active-ip>:5000/uploads/xyz.jpg
 * - Local camera/picker URIs: file://... or content://... -> unchanged
 * - External remote URLs: https://images.unsplash.com/... -> unchanged
 */
export const resolveMediaUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!trimmed) return '';

  // Local device paths (e.g. freshly snapped photo or picked from camera roll)
  if (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('ph:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Check if this is an AgroMarket uploaded file (relative or stale absolute IP)
  const uploadsIndex = trimmed.indexOf('/uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = trimmed.substring(uploadsIndex); // "/uploads/agromarket-..."
    const origin = getBackendOrigin();
    return `${origin}${relativePath}`;
  }

  // Regular external URL
  return trimmed;
};

/**
 * Accurately determines if a media item is a video or a photo.
 * Avoids false positives on local photo URIs (file:///...jpg or content://...jpeg).
 */
export const isVideoMedia = (url?: string | null, isVideoFlag?: boolean): boolean => {
  if (isVideoFlag === true) return true;
  if (!url || typeof url !== 'string') return false;

  const clean = url.split('?')[0].split('#')[0].toLowerCase();

  const videoExtensions = ['.mp4', '.mov', '.mkv', '.webm', '.3gp', '.avi', '.m4v'];
  for (const ext of videoExtensions) {
    if (clean.endsWith(ext)) return true;
  }

  // Check for common video indicator in mime or path (e.g. "video/mp4" or "/videos/")
  if (clean.includes('/video/') || clean.includes('video-upload')) {
    return true;
  }

  return false;
};
