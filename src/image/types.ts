/**
 * Supported image output formats.
 */
export type ImageOutputFormat = "jpeg" | "webp" | "png";

/**
 * Compression options for image output.
 */
export interface ImageCompressionOptions {
  /** Output filename (without extension). Default: based on input filename. */
  outputFileName?: string;
  /** Output formats to generate. Default: ["webp"]. */
  outputFormats?: ImageOutputFormat[];
  /**
   * Image quality from 0 to 1 (0 = lowest, 1 = lossless-like).
   * Applies to JPEG and WebP. Ignored for PNG (lossless format).
   * Default: 0.82.
   */
  quality?: number;
  /**
   * Target output file size in kilobytes per format.
   * When set, quality is automatically adjusted via binary search to
   * produce an output ≤ targetSizeKB. Ignored for PNG (lossless).
   */
  targetSizeKB?: number;
  /** Maximum output width in pixels. Image is scaled down proportionally. Never upscaled. */
  maxWidth?: number;
  /** Maximum output height in pixels. Image is scaled down proportionally. Never upscaled. */
  maxHeight?: number;
  /** Exact output width in pixels. Combined with height = exact resize (may stretch). */
  width?: number;
  /** Exact output height in pixels. Combined with width = exact resize (may stretch). */
  height?: number;
}

/**
 * Map of format name to compressed File.
 */
export interface CompressedImageOutput {
  [format: string]: File;
}

/**
 * A single item in a batch image compression request.
 */
export interface BatchImageCompressionItem {
  /** The image file to compress. */
  file: File;
  /** Per-file compression options. Merged on top of global defaults. */
  options?: ImageCompressionOptions;
  /** Progress callback for this specific file (0–100). */
  onProgress?: (progress: number) => void;
}

/**
 * The result for one file in a batch image compression.
 */
export interface BatchImageCompressionResult {
  /** The original input file. */
  file: File;
  /** Compressed outputs, if the compression succeeded. */
  output?: CompressedImageOutput;
  /** Error, if the compression failed. */
  error?: Error;
}
