import type {
  VideoCompressionOptions,
  VideoUtilsConfig,
  CompressedOutput,
} from "./types";
import type { BatchCompressionItem, BatchCompressionResult } from "./types";
import { DEFAULT_COMPRESSION_SETTINGS } from "./constants";
import {
  setFFmpegBaseUrl,
  setFFmpegAssetUrls,
  getFFmpegInstance,
  createIsolatedFFmpegInstance,
} from "./ffmpeg";
import { CompressionTask } from "./compression-task";
import { parseCompressionArgs } from "./utils";
import { ConcurrencyLimiter } from "./concurrency";
import { setImageDefaults } from "../image";
export {
  VIDEO_COMPRESSION_PROFILES,
  DEFAULT_COMPRESSION_PROFILE,
} from "./constants";

const MAX_BATCH_CONCURRENCY = 5;

let _compressionDefaults: VideoCompressionOptions = {};

/**
 * Configure the video utilities SDK.
 * Must be called once at application startup.
 */
export function configureVideoUtils(config: VideoUtilsConfig): void {
  if (config.ffmpegBaseUrl) {
    setFFmpegBaseUrl(config.ffmpegBaseUrl);
  }
  if (config.ffmpegAssetUrls) {
    setFFmpegAssetUrls(config.ffmpegAssetUrls);
  }
  if (config.compressionDefaults) {
    _compressionDefaults = config.compressionDefaults;
  }
  if (config.imageCompressionDefaults) {
    setImageDefaults(config.imageCompressionDefaults);
  }
}

/**
 * Compresses a video file into specified formats.
 *
 * @param inputFile - The video file to compress.
 * @param options - Compression options. Defaults from SDK config are applied.
 * @param onProgress - Optional callback for compression progress (0-100).
 * @returns Map of format names to compressed File objects.
 *
 * @throws Error if FFmpeg fails to load or if compression fails.
 *
 * @example
 * ```typescript
 * configureVideoUtils({
 *   ffmpegBaseUrl: '/assets/ffmpeg/',
 *   compressionDefaults: { crf: 30 }
 * });
 *
 * const compressed = await compressVideo(
 *   videoFile,
 *   {
 *     outputFormats: ['mp4', 'webm'],
 *     preset: 'veryfast',
 *     fps: 30
 *   },
 *   (progress) => console.log(`${progress}% complete`)
 * );
 *
 * for (const [format, file] of Object.entries(compressed)) {
 *   console.log(`${format}: ${file.size} bytes`);
 * }
 * ```
 */
export async function compressVideo(
  inputFile: File,
  options: VideoCompressionOptions = {},
  onProgress?: (progress: number) => void,
): Promise<CompressedOutput> {
  const mergedOptions = {
    ...DEFAULT_COMPRESSION_SETTINGS,
    ..._compressionDefaults,
    ...options,
  } as VideoCompressionOptions;

  const parsedOptions = parseCompressionArgs(mergedOptions);
  const task = new CompressionTask(inputFile, parsedOptions, onProgress);

  return task.execute();
}

/**
 * Gets the FFmpeg instance (advanced use).
 */
export function getFFmpeg() {
  return getFFmpegInstance();
}

/**
 * Compresses multiple video files in parallel, up to 5 at a time.
 * Each file gets its own isolated FFmpeg instance to avoid conflicts.
 * Results preserve input order. Failed items include the error instead of throwing.
 *
 * @param items - Files and per-file options to compress.
 * @param maxConcurrency - Maximum concurrent compressions (default: 5, max: 5).
 * @returns Array of results in the same order as the input items.
 *
 * @example
 * ```typescript
 * const results = await compressVideos([
 *   { file: videoA, options: { outputFormats: ['mp4'] } },
 *   { file: videoB, onProgress: (p) => console.log(p) },
 * ]);
 *
 * for (const result of results) {
 *   if (result.error) console.error(result.file.name, result.error);
 *   else console.log(result.file.name, result.output);
 * }
 * ```
 */
export async function compressVideos(
  items: BatchCompressionItem[],
  maxConcurrency = MAX_BATCH_CONCURRENCY,
): Promise<BatchCompressionResult[]> {
  const limiter = new ConcurrencyLimiter(
    Math.min(maxConcurrency, MAX_BATCH_CONCURRENCY),
  );

  const results = await Promise.all(
    items.map((item) =>
      limiter.run(async (): Promise<BatchCompressionResult> => {
        const mergedOptions = {
          ...DEFAULT_COMPRESSION_SETTINGS,
          ..._compressionDefaults,
          ...item.options,
        } as VideoCompressionOptions;

        const parsedOptions = parseCompressionArgs(mergedOptions);

        // Each concurrent task gets its own FFmpeg instance to avoid
        // shared virtual-filesystem conflicts.
        let ffmpegInstance;
        try {
          ffmpegInstance = await createIsolatedFFmpegInstance();
        } catch (error) {
          return {
            file: item.file,
            error:
              error instanceof Error
                ? error
                : new Error("Failed to create FFmpeg instance"),
          };
        }

        try {
          const task = new CompressionTask(
            item.file,
            parsedOptions,
            item.onProgress,
          );
          const output = await task.execute(ffmpegInstance);
          return { file: item.file, output };
        } catch (error) {
          return {
            file: item.file,
            error:
              error instanceof Error ? error : new Error("Compression failed"),
          };
        }
      }),
    ),
  );

  return results;
}
