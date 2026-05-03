import {
  ANALYSIS_WIDTH,
  REFINE_COUNTS,
  VIDEO_MARGIN_PERCENT,
} from "./constants";
import { extractGrayAndSat, scoreFrame } from "./frame-scoring";

/**
 * Seeks to a specific time in the video and waits for the seek to complete.
 */
export function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const handler = () => {
      video.removeEventListener("seeked", handler);
      resolve();
    };
    video.addEventListener("seeked", handler);
    video.currentTime = time;
  });
}

/**
 * Converts a canvas to a JPEG Blob with specified quality.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("canvas.toBlob returned null"));
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Scores a list of timestamps and returns the best one.
 */
export async function scoreTimestamps(
  timestamps: number[],
  video: HTMLVideoElement,
  analysisCtx: CanvasRenderingContext2D,
  analysisW: number,
  analysisH: number,
): Promise<{ bestScore: number; bestTimestamp: number }> {
  let bestScore = -Infinity;
  let bestTimestamp = timestamps[0];

  for (const ts of timestamps) {
    await seekTo(video, ts);
    analysisCtx.drawImage(video, 0, 0, analysisW, analysisH);
    const { data } = analysisCtx.getImageData(0, 0, analysisW, analysisH);
    const { gray, sat } = extractGrayAndSat(data, analysisW * analysisH);
    const score = scoreFrame(gray, sat, analysisW, analysisH);
    if (score > bestScore) {
      bestScore = score;
      bestTimestamp = ts;
    }
  }

  return { bestScore, bestTimestamp };
}

/**
 * Generates timestamps for a coarse scan pass.
 */
export function generateCoarseTimestamps(
  duration: number,
  coarseCount: number,
): { margin: number; usable: number; timestamps: number[] } {
  const margin = duration * VIDEO_MARGIN_PERCENT;
  const usable = duration - margin * 2;
  const effectiveCoarse = Math.max(1, coarseCount);

  const timestamps = Array.from({ length: effectiveCoarse }, (_, i) =>
    effectiveCoarse === 1
      ? margin + usable / 2
      : margin + (usable / (effectiveCoarse - 1)) * i,
  );

  return { margin, usable, timestamps };
}

/**
 * Generates timestamps for a refinement pass.
 */
export function generateRefineTimestamps(
  start: number,
  end: number,
  refineCount: number,
): number[] {
  // Strictly interior points to avoid redundant re-scoring of bestTimestamp.
  return Array.from(
    { length: refineCount },
    (_, i) => start + ((end - start) / (refineCount + 1)) * (i + 1),
  );
}

/**
 * Performs the refinement passes and returns the best timestamp.
 */
export async function performRefinementPasses(
  bestTimestamp: number,
  bestScore: number,
  margin: number,
  usable: number,
  effectiveCoarse: number,
  video: HTMLVideoElement,
  analysisCtx: CanvasRenderingContext2D,
  analysisW: number,
  analysisH: number,
): Promise<{ bestScore: number; bestTimestamp: number }> {
  let currentBestTimestamp = bestTimestamp;
  let currentBestScore = bestScore;

  let stepSize = effectiveCoarse > 1 ? usable / (effectiveCoarse - 1) : usable;

  for (const refineCount of REFINE_COUNTS) {
    const half = stepSize / 2;
    const start = Math.max(margin, currentBestTimestamp - half);
    const end = Math.min(margin + usable, currentBestTimestamp + half);

    const refineTimestamps = generateRefineTimestamps(start, end, refineCount);

    const result = await scoreTimestamps(
      refineTimestamps,
      video,
      analysisCtx,
      analysisW,
      analysisH,
    );

    if (result.bestScore > currentBestScore) {
      currentBestScore = result.bestScore;
      currentBestTimestamp = result.bestTimestamp;
    }

    // Narrow the window for the next pass.
    stepSize = (end - start) / (refineCount + 1);
  }

  return { bestScore: currentBestScore, bestTimestamp: currentBestTimestamp };
}
