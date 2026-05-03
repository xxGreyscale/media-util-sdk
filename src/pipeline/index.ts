import { compressVideo } from "../compression";
import { compressVideos } from "../compression";
import { extractThumbnail } from "../thumbnail";
import type {
  ProcessVideoOptions,
  ProcessVideoResult,
  ProcessVideosItem,
  ProcessVideosResultItem,
  ProcessVideosTolerantResultItem,
} from "./types";

export type {
  ProcessVideoOptions,
  ProcessVideoResult,
  ProcessVideosItem,
  ProcessVideosResultItem,
  ProcessVideosTolerantResultItem,
} from "./types";

/**
 * Processes a video file by compressing it and extracting a best-frame thumbnail,
 * both operations running concurrently.
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
  const [compressed, thumbnail] = await Promise.all([
    compressVideo(
      file,
      options.compressionOptions,
      options.onCompressionProgress,
    ),
    extractThumbnail(file, options.thumbnailCoarseCount),
  ]);

  return { compressed, thumbnail };
}

/**
 * Non-UI batch pipeline that returns only compressed videos and thumbnails.
 *
 * Result shape is exactly:
 *   [{ compressedVideo, thumbnail }]
 *
 * Compression runs with up to 5 concurrent jobs (default, configurable via
 * maxConcurrency). Thumbnail extraction runs in parallel across all items.
 *
 * @param items - Files with optional per-file processing options.
 * @param maxConcurrency - Max concurrent compressions, clamped to 5 by compression module.
 * @returns Array of objects with compressed videos and thumbnails in input order.
 */
export async function processVideos(
  items: ProcessVideosItem[],
  maxConcurrency?: number,
): Promise<ProcessVideosResultItem[]> {
  const [compressionResults, thumbnails] = await Promise.all([
    compressVideos(
      items.map((item) => ({
        file: item.file,
        options: item.compressionOptions,
        onProgress: item.onCompressionProgress,
      })),
      maxConcurrency,
    ),
    Promise.all(
      items.map((item) =>
        extractThumbnail(item.file, item.thumbnailCoarseCount),
      ),
    ),
  ]);

  return compressionResults.map((result, index) => {
    if (result.error || !result.output) {
      throw new Error(
        `Failed to process file "${result.file.name}": ${result.error?.message ?? "Unknown compression error"}`,
      );
    }

    return {
      compressedVideo: result.output,
      thumbnail: thumbnails[index],
    };
  });
}

/**
 * Non-UI tolerant batch pipeline.
 *
 * Returns per-item outcomes and never throws for per-item processing failures.
 *
 * @param items - Files with optional per-file processing options.
 * @param maxConcurrency - Max concurrent compressions, clamped to 5 by compression module.
 * @returns Array of per-item results with optional data and errors.
 */
export async function processVideosTolerant(
  items: ProcessVideosItem[],
  maxConcurrency?: number,
): Promise<ProcessVideosTolerantResultItem[]> {
  const [compressionResults, thumbnailResults] = await Promise.all([
    compressVideos(
      items.map((item) => ({
        file: item.file,
        options: item.compressionOptions,
        onProgress: item.onCompressionProgress,
      })),
      maxConcurrency,
    ),
    Promise.all(
      items.map(async (item) => {
        try {
          const thumbnail = await extractThumbnail(
            item.file,
            item.thumbnailCoarseCount,
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
    ),
  ]);

  return items.map((item, index) => {
    const compression = compressionResults[index];
    const thumbnail = thumbnailResults[index];

    const compressionError = compression.error;
    const thumbnailError = thumbnail.thumbnailError;

    const error = compressionError ?? thumbnailError;

    return {
      file: item.file,
      compressedVideo: compression.output,
      thumbnail: thumbnail.thumbnail,
      compressionError,
      thumbnailError,
      error,
    };
  });
}
