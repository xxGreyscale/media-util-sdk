import { compressVideo, compressVideos } from "../compression";
import { extractThumbnail } from "../thumbnail";
import type {
  ProcessVideoOptions,
  ProcessVideoResult,
  ProcessVideosItem,
  ProcessVideosResultItem,
  ProcessVideosTolerantResultItem,
} from "./types";

/**
 * Processes a video file by compressing it and extracting a best-frame thumbnail,
 * prioritizing compression throughput by running thumbnail extraction after
 * compression completes.
 *
 * @param file - The video file to process.
 * @param options - Compression, thumbnail, and progress options.
 * @returns Compressed outputs and the extracted thumbnail.
 *
 * @example
 * ```typescript
 * configureVideoUtils({ ffmpegBaseUrl: '/assets/ffmpeg/' });
 *
 * const { compressed, thumbnail } = await processVideo(videoFile, {
 *   compressionOptions: { outputFormats: ['mp4', 'webm'], crf: 28 },
 *   onCompressionProgress: (p) => console.log(`Compression: ${p}%`),
 * });
 *
 * const mp4 = compressed['mp4'];
 * const thumbUrl = URL.createObjectURL(thumbnail.blob);
 * ```
 */
export async function processVideo(
  file: File,
  options: ProcessVideoOptions = {},
): Promise<ProcessVideoResult> {
  const compressed = await compressVideo(
    file,
    options.compressionOptions,
    options.onCompressionProgress,
  );
  const thumbnail = await extractThumbnail(file, options.thumbnailOptions);

  return { compressed, thumbnail };
}

/**
 * Strict batch pipeline: runs compression first, then thumbnail extraction.
 * Throws if any item fails.
 *
 * Compression runs with up to 5 concurrent jobs (default, configurable via
 * `maxConcurrency`). Thumbnail extraction runs in parallel across all items.
 *
 * @param items - Files with optional per-file processing options.
 * @param maxConcurrency - Max concurrent compressions, clamped to 5 by the compression module.
 * @returns Array of results in input order.
 */
export async function processVideos(
  items: ProcessVideosItem[],
  maxConcurrency?: number,
): Promise<ProcessVideosResultItem[]> {
  const compressionResults = await compressVideos(
    items.map((item) => ({
      file: item.file,
      options: item.compressionOptions,
      onProgress: item.onCompressionProgress,
    })),
    maxConcurrency,
  );

  const thumbnails = await Promise.all(
    items.map((item) => extractThumbnail(item.file, item.thumbnailOptions)),
  );

  return compressionResults.map((result, index) => {
    if (result.error || !result.output) {
      throw new Error(
        `Failed to process file "${result.file.name}": ${result.error?.message ?? "Unknown compression error"}`,
      );
    }

    return {
      file: result.file,
      compressed: result.output,
      thumbnail: thumbnails[index],
    };
  });
}

/**
 * Tolerant batch pipeline: never throws — errors are reported per item.
 *
 * Both `compressionError` and `thumbnailError` are independently reported
 * so callers can distinguish and react to each failure in isolation.
 *
 * @param items - Files with optional per-file processing options.
 * @param maxConcurrency - Max concurrent compressions, clamped to 5 by the compression module.
 * @returns Array of per-item results with optional data and errors.
 */
export async function processVideosTolerant(
  items: ProcessVideosItem[],
  maxConcurrency?: number,
): Promise<ProcessVideosTolerantResultItem[]> {
  const compressionResults = await compressVideos(
    items.map((item) => ({
      file: item.file,
      options: item.compressionOptions,
      onProgress: item.onCompressionProgress,
    })),
    maxConcurrency,
  );

  const thumbnailResults = await Promise.all(
    items.map(async (item) => {
      try {
        const thumbnail = await extractThumbnail(
          item.file,
          item.thumbnailOptions,
        );
        return { thumbnail };
      } catch (error) {
        return {
          thumbnailError:
            error instanceof Error
              ? error
              : new Error("Thumbnail extraction failed"),
        };
      }
    }),
  );

  return items.map((item, index) => {
    const compression = compressionResults[index];
    const thumbnail = thumbnailResults[index];

    return {
      file: item.file,
      compressed: compression.output,
      thumbnail: thumbnail.thumbnail,
      compressionError: compression.error,
      thumbnailError: thumbnail.thumbnailError,
    };
  });
}
