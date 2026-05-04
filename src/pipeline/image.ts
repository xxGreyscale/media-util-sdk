import { compressImage, compressImages } from "../image";
import type {
  ProcessImageOptions,
  ProcessImageResult,
  ProcessImagesItem,
  ProcessImagesResultItem,
  ProcessImagesTolerantResultItem,
} from "./types";

/**
 * Compresses a single image file.
 *
 * @param file    The image file to process.
 * @param options Compression and progress options.
 * @returns       Compressed outputs keyed by format.
 */
export async function processImage(
  file: File,
  options: ProcessImageOptions = {},
): Promise<ProcessImageResult> {
  const compressed = await compressImage(
    file,
    options.compressionOptions,
    options.onCompressionProgress,
  );
  return { compressed };
}

/**
 * Strict batch image pipeline.
 * Throws if any item fails.
 *
 * Compression runs with up to 5 concurrent jobs (configurable via
 * `maxConcurrency`).
 *
 * @param items          Files with optional per-file options.
 * @param maxConcurrency Max concurrent compressions. Default: 5.
 * @returns              Array of results in input order.
 */
export async function processImages(
  items: ProcessImagesItem[],
  maxConcurrency?: number,
): Promise<ProcessImagesResultItem[]> {
  const results = await compressImages(
    items.map((item) => ({
      file: item.file,
      options: item.compressionOptions,
      onProgress: item.onCompressionProgress,
    })),
    maxConcurrency,
  );

  return results.map((result) => {
    if (result.error || !result.output) {
      throw new Error(
        `Failed to process image "${result.file.name}": ${result.error?.message ?? "Unknown error"}`,
      );
    }
    return { file: result.file, compressed: result.output };
  });
}

/**
 * Tolerant batch image pipeline.
 * Never throws — errors are reported per item.
 *
 * @param items          Files with optional per-file options.
 * @param maxConcurrency Max concurrent compressions. Default: 5.
 * @returns              Array of per-item results with optional data and errors.
 */
export async function processImagesTolerant(
  items: ProcessImagesItem[],
  maxConcurrency?: number,
): Promise<ProcessImagesTolerantResultItem[]> {
  const results = await compressImages(
    items.map((item) => ({
      file: item.file,
      options: item.compressionOptions,
      onProgress: item.onCompressionProgress,
    })),
    maxConcurrency,
  );

  return results.map((result) => ({
    file: result.file,
    compressed: result.output,
    error: result.error,
  }));
}
