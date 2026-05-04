import type { ThumbnailResult, ThumbnailQuality, ThumbnailOptions, ThumbnailConfig } from "./types";
import { THUMBNAIL_PRESETS, DEFAULT_THUMBNAIL_CONFIG } from "./constants";
import {
  seekTo,
  canvasToBlob,
  scoreTimestamps,
  generateCoarseTimestamps,
  performRefinementPasses,
} from "./video-helpers";

/**
 * Resolves a `ThumbnailQuality` string or `ThumbnailOptions` object into
 * a fully-populated `ThumbnailConfig`, applying any field overrides on top
 * of the selected (or default) preset.
 */
function resolveConfig(
  options?: ThumbnailQuality | ThumbnailOptions,
): ThumbnailConfig {
  const preset =
    typeof options === "string"
      ? THUMBNAIL_PRESETS[options]
      : options?.quality
        ? THUMBNAIL_PRESETS[options.quality]
        : DEFAULT_THUMBNAIL_CONFIG;

  const overrides = typeof options === "object" ? options.config : undefined;
  return overrides ? { ...preset, ...overrides } : preset;
}

/**
 * Extracts the most representative frame from a video as a JPEG thumbnail.
 *
 * Uses a three-pass strategy:
 *   1. **Coarse scan** — evaluates N evenly-spaced frames across the video.
 *   2. **First refinement** — narrows the search around the best coarse frame.
 *   3. **Second refinement** — narrows further for sub-second precision.
 *
 * Each frame is scored by:
 *   - Tenengrad sharpness (Sobel gradient magnitude²), center-weighted
 *   - Hard rejection of near-black, blown-out, and flat/transition frames
 *   - Saturation bonus (more colourful = more representative)
 *   - Brightness preference (peaks at mid-tone luminance)
 *
 * @param file    The video file to extract a thumbnail from.
 * @param options Quality preset or fine-grained options. Defaults to `"normal"`.
 * @returns       A JPEG blob and the timestamp (seconds) it was captured at.
 *
 * @throws Error if video metadata cannot be loaded or duration is invalid.
 *
 * @example
 * ```typescript
 * // Use a preset
 * const result = await extractThumbnail(file, "best-quality");
 * const url = URL.createObjectURL(result.blob);
 *
 * // Preset + overrides
 * const result = await extractThumbnail(file, {
 *   quality: "quality",
 *   config: { thumbnailMaxWidth: 3840 },
 * });
 * ```
 */
export async function extractThumbnail(
  file: File,
  options?: ThumbnailQuality | ThumbnailOptions,
): Promise<ThumbnailResult> {
  const config = resolveConfig(options);
  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "metadata";

    await new Promise<void>((resolve, reject) => {
      video.addEventListener("loadedmetadata", () => resolve(), { once: true });
      video.addEventListener(
        "error",
        () =>
          reject(new Error("Failed to load video for thumbnail extraction")),
        { once: true },
      );
      video.src = objectUrl;
    });

    const { duration, videoWidth, videoHeight } = video;

    if (!isFinite(duration) || duration <= 0) {
      throw new Error("Could not determine video duration.");
    }

    const {
      margin,
      usable,
      timestamps: coarseTimestamps,
    } = generateCoarseTimestamps(duration, config);

    const aspectRatio = videoWidth / videoHeight;
    const analysisH = Math.max(1, Math.round(config.analysisWidth / aspectRatio));
    const analysisCanvas = document.createElement("canvas");
    analysisCanvas.width = config.analysisWidth;
    analysisCanvas.height = analysisH;
    const analysisCtx = analysisCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;

    // Pass 1 — coarse scan
    let { bestScore, bestTimestamp } = await scoreTimestamps(
      coarseTimestamps,
      video,
      analysisCtx,
      config.analysisWidth,
      analysisH,
      config,
    );

    // Passes 2 & 3 — progressively narrower refinement around the winner
    const refinedResult = await performRefinementPasses(
      bestTimestamp,
      bestScore,
      margin,
      usable,
      video,
      analysisCtx,
      config.analysisWidth,
      analysisH,
      config,
    );
    bestScore = refinedResult.bestScore;
    bestTimestamp = refinedResult.bestTimestamp;

    // Capture full-resolution thumbnail at the best timestamp.
    const outW = Math.min(videoWidth, config.thumbnailMaxWidth);
    const outH = Math.round(outW / aspectRatio);
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = outW;
    thumbCanvas.height = outH;
    const thumbCtx = thumbCanvas.getContext("2d")!;

    await seekTo(video, bestTimestamp);
    thumbCtx.drawImage(video, 0, 0, outW, outH);

    const blob = await canvasToBlob(thumbCanvas, config.thumbnailQuality);
    return { blob, timestampSeconds: bestTimestamp };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// Re-export public types
export type {
  ThumbnailResult,
  ThumbnailQuality,
  ThumbnailConfig,
  ThumbnailOptions,
} from "./types";
