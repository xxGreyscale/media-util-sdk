import type { ThumbnailConfig, ThumbnailQuality } from "./types";

/**
 * Thumbnail extraction presets.
 *
 * Each entry is a fully-resolved {@link ThumbnailConfig} covering frame
 * selection, analysis resolution, output quality, and scoring thresholds.
 *
 * Use the preset name as the second argument to `extractThumbnail`:
 * ```typescript
 * await extractThumbnail(file, "performance");
 * await extractThumbnail(file, "best-quality");
 * ```
 *
 * Or combine it with field overrides:
 * ```typescript
 * await extractThumbnail(file, {
 *   quality: "quality",
 *   config: { thumbnailMaxWidth: 3840 },
 * });
 * ```
 *
 * | Preset         | Coarse | Refinement | Analysis | Output max | ~Seeks |
 * |----------------|--------|------------|----------|------------|--------|
 * | `performance`  | 8      | 4 + 2      | 240 px   | 960 px     | ~14    |
 * | `normal`       | 32     | 16 + 8     | 480 px   | 1 280 px   | ~56    |
 * | `quality`      | 48     | 24 + 12    | 640 px   | 1 920 px   | ~84    |
 * | `best-quality` | 64     | 32 + 16    | 960 px   | 2 560 px   | ~112   |
 */
export const THUMBNAIL_PRESETS: Readonly<Record<ThumbnailQuality, ThumbnailConfig>> =
  {
    /**
     * Fastest preset. Fewest seeks and smallest analysis canvas.
     * Best for bulk uploads or situations where thumbnail latency matters
     * more than selecting the perfect frame.
     */
    performance: {
      coarseCount: 8,
      refineCounts: [4, 2],
      analysisWidth: 240,
      thumbnailMaxWidth: 960,
      thumbnailQuality: 0.85,
      videoMarginPercent: 0.05,
      minMeanLum: 0.06,
      maxMeanLum: 0.93,
      minStdDev: 0.02,
      brightnessPeak: 0.45,
      brightnessPenaltyFactor: 2.8,
      centerRegionPercent: 0.2,
      centerSharpnessWeight: 0.7,
      fullSharpnessWeight: 0.3,
    },

    /**
     * Balanced default. Matches the classic SDK defaults.
     * Suitable for most upload workflows.
     */
    normal: {
      coarseCount: 32,
      refineCounts: [16, 8],
      analysisWidth: 480,
      thumbnailMaxWidth: 1280,
      thumbnailQuality: 0.92,
      videoMarginPercent: 0.05,
      minMeanLum: 0.06,
      maxMeanLum: 0.93,
      minStdDev: 0.02,
      brightnessPeak: 0.45,
      brightnessPenaltyFactor: 2.8,
      centerRegionPercent: 0.15,
      centerSharpnessWeight: 0.8,
      fullSharpnessWeight: 0.2,
    },

    /**
     * High-quality preset. More frames, larger analysis canvas, bigger output.
     * Noticeably slower than `normal`.
     */
    quality: {
      coarseCount: 48,
      refineCounts: [24, 12],
      analysisWidth: 640,
      thumbnailMaxWidth: 1920,
      thumbnailQuality: 0.95,
      videoMarginPercent: 0.05,
      minMeanLum: 0.06,
      maxMeanLum: 0.93,
      minStdDev: 0.02,
      brightnessPeak: 0.45,
      brightnessPenaltyFactor: 2.8,
      centerRegionPercent: 0.12,
      centerSharpnessWeight: 0.85,
      fullSharpnessWeight: 0.15,
    },

    /**
     * Maximum quality preset. Scans the most frames at the highest analysis
     * resolution and produces the largest output. Sacrifices performance to
     * find the most representative, sharpest frame possible.
     */
    "best-quality": {
      coarseCount: 64,
      refineCounts: [32, 16],
      analysisWidth: 960,
      thumbnailMaxWidth: 2560,
      thumbnailQuality: 0.98,
      videoMarginPercent: 0.05,
      minMeanLum: 0.06,
      maxMeanLum: 0.93,
      minStdDev: 0.02,
      brightnessPeak: 0.45,
      brightnessPenaltyFactor: 2.8,
      centerRegionPercent: 0.1,
      centerSharpnessWeight: 0.9,
      fullSharpnessWeight: 0.1,
    },
  } as const;

/** Default configuration — resolves to the `normal` preset. */
export const DEFAULT_THUMBNAIL_CONFIG: ThumbnailConfig =
  THUMBNAIL_PRESETS.normal;

