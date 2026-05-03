import type {
  VideoCompressionOptions,
  CompressedOutput,
} from "../compression/types";
import type { ThumbnailResult } from "../thumbnail/types";

/**
 * Options for processing a video through both compression and thumbnail extraction.
 */
export interface ProcessVideoOptions {
  /** Compression options to apply. */
  compressionOptions?: VideoCompressionOptions;
  /**
   * Number of frames to evaluate in the coarse thumbnail scan.
   * Higher = better selection, slower. Default: 32.
   */
  thumbnailCoarseCount?: number;
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
  /** Number of frames for thumbnail coarse scan (default: 32). */
  thumbnailCoarseCount?: number;
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
  /** Compressed outputs keyed by format. */
  compressedVideo: CompressedOutput;
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
  compressedVideo?: CompressedOutput;
  /** Best-frame thumbnail when extraction succeeds. */
  thumbnail?: ThumbnailResult;
  /** Compression error for this item, if compression failed. */
  compressionError?: Error;
  /** Thumbnail extraction error for this item, if thumbnail failed. */
  thumbnailError?: Error;
  /** Convenience combined error when either step fails. */
  error?: Error;
}
