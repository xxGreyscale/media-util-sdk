import type { ThumbnailResult } from "./types";
import {
  COARSE_COUNT,
  ANALYSIS_WIDTH,
  THUMBNAIL_MAX_WIDTH,
  THUMBNAIL_QUALITY,
} from "./constants";
import {
  seekTo,
  canvasToBlob,
  scoreTimestamps,
  generateCoarseTimestamps,
  performRefinementPasses,
} from "./video-helpers";

/**
 * Three-pass thumbnail extractor. A coarse scan (32 frames) finds the best
 * region; two successive refinement passes (16 + 8 frames) zoom in on the
 * winner to sub-second precision.
 *
 * Scoring combines:
 *   - Tenengrad sharpness (Sobel gradient magnitude²), center-weighted 70/30
 *   - Hard rejection of near-black, blown-out, and flat/transition frames
 *   - Saturation bonus (more colourful = more representative)
 *   - Brightness preference (peak at 0.45 luminance)
 *
 * @param file - The video file to extract a thumbnail from
 * @param coarseCount - Number of frames to scan in the coarse pass (default: 32)
 * @returns ThumbnailResult with blob and timestamp
 *
 * @throws Error if video metadata cannot be loaded or duration is invalid
 *
 * @example
 * ```typescript
 * const result = await extractThumbnail(videoFile);
 * const url = URL.createObjectURL(result.blob);
 * ```
 */
export async function extractThumbnail(
  file: File,
  coarseCount = COARSE_COUNT,
): Promise<ThumbnailResult> {
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
    } = generateCoarseTimestamps(duration, coarseCount);

    const aspectRatio = videoWidth / videoHeight;
    const analysisH = Math.max(1, Math.round(ANALYSIS_WIDTH / aspectRatio));
    const analysisCanvas = document.createElement("canvas");
    analysisCanvas.width = ANALYSIS_WIDTH;
    analysisCanvas.height = analysisH;
    const analysisCtx = analysisCanvas.getContext("2d", {
      willReadFrequently: true,
    })!;

    // Pass 1 — coarse scan
    let { bestScore, bestTimestamp } = await scoreTimestamps(
      coarseTimestamps,
      video,
      analysisCtx,
      ANALYSIS_WIDTH,
      analysisH,
    );

    // Passes 2 & 3 — progressively narrower refinement around the winner
    const effectiveCoarse = Math.max(1, coarseCount);
    const refinedResult = await performRefinementPasses(
      bestTimestamp,
      bestScore,
      margin,
      usable,
      effectiveCoarse,
      video,
      analysisCtx,
      ANALYSIS_WIDTH,
      analysisH,
    );
    bestScore = refinedResult.bestScore;
    bestTimestamp = refinedResult.bestTimestamp;

    // Capture full-resolution thumbnail at the best timestamp.
    const outW = Math.min(videoWidth, THUMBNAIL_MAX_WIDTH);
    const outH = Math.round(outW / aspectRatio);
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = outW;
    thumbCanvas.height = outH;
    const thumbCtx = thumbCanvas.getContext("2d")!;

    await seekTo(video, bestTimestamp);
    thumbCtx.drawImage(video, 0, 0, outW, outH);

    const blob = await canvasToBlob(thumbCanvas, THUMBNAIL_QUALITY);
    return { blob, timestampSeconds: bestTimestamp };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// Re-export public types
export type { ThumbnailResult } from "./types";
