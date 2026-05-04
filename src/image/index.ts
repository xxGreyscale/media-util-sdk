import type {
  ImageCompressionOptions,
  CompressedImageOutput,
  BatchImageCompressionItem,
  BatchImageCompressionResult,
} from "./types";
import { DEFAULT_IMAGE_OUTPUT_FORMATS, DEFAULT_IMAGE_QUALITY } from "./constants";
import { isHeicFile, getBaseName } from "./utils";
import { compressWithCanvas } from "./canvas-compress";
import { compressWithFFmpeg } from "./ffmpeg-compress";
import { ConcurrencyLimiter } from "../compression/concurrency";

export type {
  ImageCompressionOptions,
  CompressedImageOutput,
  BatchImageCompressionItem,
  BatchImageCompressionResult,
} from "./types";
export type { ImageOutputFormat } from "./types";

/** Module-level defaults, settable via configureVideoUtils. */
let _imageDefaults: ImageCompressionOptions = {};

/**
 * Updates the module-level default image compression options.
 * Called internally by configureVideoUtils.
 */
export function setImageDefaults(defaults: ImageCompressionOptions): void {
  _imageDefaults = { ..._imageDefaults, ...defaults };
}

/**
 * Merges module defaults with call-site options and fills missing values
 * with library defaults.
 */
function resolveOptions(options?: ImageCompressionOptions): ImageCompressionOptions {
  return {
    outputFormats: DEFAULT_IMAGE_OUTPUT_FORMATS,
    quality: DEFAULT_IMAGE_QUALITY,
    ..._imageDefaults,
    ...options,
  };
}

/**
 * Compresses a single image file.
 *
 * - HEIC/HEIF inputs (iPhone photos) are routed directly to FFmpeg.
 * - All other inputs use the Canvas API.
 * - If Canvas cannot decode the file (e.g. exotic format), FFmpeg is used
 *   as a transparent fallback.
 *
 * @param file       The image file to compress.
 * @param options    Compression options. Merged on top of global defaults.
 * @param onProgress Progress callback receiving a value from 0 to 100.
 * @returns          A map of format name → compressed File.
 */
export async function compressImage(
  file: File,
  options?: ImageCompressionOptions,
  onProgress?: (progress: number) => void,
): Promise<CompressedImageOutput> {
  const resolved = resolveOptions(options);
  const outputFileName =
    resolved.outputFileName ?? `${getBaseName(file.name)}-compressed`;

  // HEIC/HEIF: Canvas cannot decode these on most browsers — go straight to FFmpeg.
  if (isHeicFile(file)) {
    return compressWithFFmpeg(file, resolved, outputFileName, onProgress);
  }

  // All other formats: try Canvas first.
  try {
    return await compressWithCanvas(file, resolved, outputFileName, onProgress);
  } catch {
    // Canvas could not decode the file — fall back to FFmpeg.
    return compressWithFFmpeg(file, resolved, outputFileName, onProgress);
  }
}

/**
 * Compresses multiple image files concurrently with a concurrency cap.
 * Never throws — errors are captured per result item.
 *
 * @param items          Array of files and per-file options.
 * @param maxConcurrency Maximum number of concurrent compressions. Default: 5.
 * @returns              Array of results in the same order as the input.
 */
export async function compressImages(
  items: BatchImageCompressionItem[],
  maxConcurrency = 5,
): Promise<BatchImageCompressionResult[]> {
  const limiter = new ConcurrencyLimiter(maxConcurrency);

  const tasks = items.map((item) =>
    limiter.run(async (): Promise<BatchImageCompressionResult> => {
      try {
        const output = await compressImage(
          item.file,
          item.options,
          item.onProgress,
        );
        return { file: item.file, output };
      } catch (err) {
        return {
          file: item.file,
          error: err instanceof Error ? err : new Error(String(err)),
        };
      }
    }),
  );

  return Promise.all(tasks);
}
