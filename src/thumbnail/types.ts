/**
 * Result of thumbnail extraction.
 */
export interface ThumbnailResult {
  /** The extracted thumbnail image as a Blob. */
  blob: Blob;
  /** The timestamp in seconds where the thumbnail was captured. */
  timestampSeconds: number;
}
