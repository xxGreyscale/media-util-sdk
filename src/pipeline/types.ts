import type {
  VideoCompressionOptions,
  CompressedOutput,
} from "../compression/types";
import type { ThumbnailResult, ThumbnailQuality, ThumbnailOptions } from "../thumbnail/types";
import type {
  ImageCompressionOptions,
  CompressedImageOutput,
} from "../image/types";

/**
 * Options for processing a video through both compression and thumbnail extraction.
 */
export interface ProcessVideoOptions {
  /** Compression options to apply. */
  compressionOptions?: VideoCompressionOptions;
  /**
   * Thumbnail quality preset or fine-grained options.
   * Controls how many frames are scanned and the output resolution.
   * @default "normal"
   */
  thumbnailOptions?: ThumbnailQuality | ThumbnailOptions;
  /** Progress callback for the compression step (0-100). */
  onCompressionProgress?: (progress: number) => void;
}

/**
 * Per-file options for non-UI batch processing.
 */
export interface ProcessVideosItem {
  /** The video file to process. */
  file: File;
  /** Compression options to apply for this file. */
  compressionOptions?: VideoCompressionOptions;
  /**
   * Thumbnail quality preset or fine-grained options.
   * Controls how many frames are scanned and the output resolution.
   * @default "normal"
   */
  thumbnailOptions?: ThumbnailQuality | ThumbnailOptions;
  /** Progress callback for this file's compression step (0-100). */
  onCompressionProgress?: (progress: number) => void;
}

/**
 * The result of processing a video file.
 */
export interface ProcessVideoResult {
  /** Compressed outputs keyed by format (e.g. "mp4", "webm"). */
  compressed: CompressedOutput;
  /** Best-frame thumbnail extracted from the video. */
  thumbnail: ThumbnailResult;
}

/**
 * Batch result item for non-UI workflows.
 */
export interface ProcessVideosResultItem {
  /** The source file for this result item. */
  file: File;
  /** Compressed outputs keyed by format (e.g. "mp4", "webm"). */
  compressed: CompressedOutput;
  /** Best-frame thumbnail extracted from the video. */
  thumbnail: ThumbnailResult;
}

/**
 * Tolerant batch result item for non-UI workflows.
 * This variant never throws at the batch level and reports errors per item.
 */
export interface ProcessVideosTolerantResultItem {
  /** The source file for this result item. */
  file: File;
  /** Compressed outputs keyed by format when compression succeeds. */
  compressed?: CompressedOutput;
  /** Best-frame thumbnail when extraction succeeds. */
  thumbnail?: ThumbnailResult;
  /** Compression error for this item, if compression failed. */
  compressionError?: Error;
  /** Thumbnail extraction error for this item, if thumbnail failed. */
  thumbnailError?: Error;
}

// ---------------------------------------------------------------------------
// Image pipeline types
// ---------------------------------------------------------------------------

/**
 * Options for processing an image through compression.
 */
export interface ProcessImageOptions {
  /** Compression options to apply. */
  compressionOptions?: ImageCompressionOptions;
  /** Progress callback for the compression step (0–100). */
  onCompressionProgress?: (progress: number) => void;
}

/**
 * The result of processing a single image file.
 */
export interface ProcessImageResult {
  /** Compressed outputs keyed by format (e.g. "jpeg", "webp"). */
  compressed: CompressedImageOutput;
}

/**
 * Per-file options for non-UI batch image processing.
 */
export interface ProcessImagesItem {
  /** The image file to process. */
  file: File;
  /** Compression options to apply for this file. */
  compressionOptions?: ImageCompressionOptions;
  /** Progress callback for this file's compression step (0–100). */
  onCompressionProgress?: (progress: number) => void;
}

/**
 * Batch result item for non-UI image workflows.
 */
export interface ProcessImagesResultItem {
  /** The source file. */
  file: File;
  /** Compressed outputs keyed by format. */
  compressed: CompressedImageOutput;
}

/**
 * Tolerant batch result item for non-UI image workflows.
 * Never throws at the batch level — errors are reported per item.
 */
export interface ProcessImagesTolerantResultItem {
  /** The source file for this result item. */
  file: File;
  /** Compressed outputs keyed by format when compression succeeds. */
  compressed?: CompressedImageOutput;
  /** Error for this item, if compression failed. */
  error?: Error;
}
