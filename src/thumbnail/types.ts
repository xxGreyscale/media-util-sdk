/**
 * Result of thumbnail extraction.
 */
export interface ThumbnailResult {
  /** The extracted thumbnail image as a Blob. */
  blob: Blob;
  /** The timestamp in seconds where the thumbnail was captured. */
  timestampSeconds: number;
}

/**
 * Quality preset for thumbnail extraction.
 *
 * Each preset is a pre-configured bundle that trades frame-selection accuracy
 * for speed. From fastest to slowest:
 *
 * | Preset         | Coarse frames | Refinement  | Analysis | Output max | ~Seeks |
 * |----------------|--------------|-------------|----------|------------|--------|
 * | `performance`  | 8            | 4 + 2       | 240 px   | 960 px     | ~14    |
 * | `normal`       | 32           | 16 + 8      | 480 px   | 1 280 px   | ~56    |
 * | `quality`      | 48           | 24 + 12     | 640 px   | 1 920 px   | ~84    |
 * | `best-quality` | 64           | 32 + 16     | 960 px   | 2 560 px   | ~112   |
 *
 * **`performance`** — fewest seeks, smallest analysis canvas. Best for bulk
 * workflows where latency matters more than picking the perfect frame.
 *
 * **`normal`** — balanced default suitable for most upload pipelines.
 *
 * **`quality`** — more frames, larger canvas, bigger output. Noticeably slower
 * than `normal`.
 *
 * **`best-quality`** — maximum accuracy. Sacrifices performance to find the
 * most representative, sharpest frame at the highest output resolution.
 *
 * @default "normal"
 */
export type ThumbnailQuality =
  | "performance"
  | "normal"
  | "quality"
  | "best-quality";

/**
 * Full configuration that drives every aspect of thumbnail extraction.
 *
 * All four quality presets are expressed as `ThumbnailConfig` objects.
 * You can override individual fields via {@link ThumbnailOptions.config}.
 */
export interface ThumbnailConfig {
  // ─── Frame selection ─────────────────────────────────────────────────────

  /** Number of frames evaluated in the initial (coarse) scan pass. */
  coarseCount: number;
  /**
   * Frame counts for the two successive refinement passes `[pass2, pass3]`.
   * Refinement progressively narrows the search window around the best
   * coarse timestamp to sub-second precision.
   */
  refineCounts: readonly [number, number];

  // ─── Analysis resolution ─────────────────────────────────────────────────

  /**
   * Width of the off-screen canvas used for frame scoring.
   * Larger values produce more accurate sharpness estimates (Tenengrad/Sobel)
   * at the cost of more pixel data processed per frame.
   */
  analysisWidth: number;

  // ─── Output ──────────────────────────────────────────────────────────────

  /** Maximum width of the exported thumbnail in pixels. */
  thumbnailMaxWidth: number;
  /** JPEG quality for the exported thumbnail, from 0 (lowest) to 1 (highest). */
  thumbnailQuality: number;

  // ─── Temporal margins ────────────────────────────────────────────────────

  /**
   * Fraction of total video duration to skip at each end.
   * Avoids black screens and credit frames typical at the very start/end.
   */
  videoMarginPercent: number;

  // ─── Frame rejection thresholds ──────────────────────────────────────────

  /** Minimum mean luminance (0–1). Frames below are rejected as near-black. */
  minMeanLum: number;
  /** Maximum mean luminance (0–1). Frames above are rejected as blown-out. */
  maxMeanLum: number;
  /**
   * Minimum luminance standard deviation.
   * Frames below this are rejected as flat or transition frames.
   */
  minStdDev: number;

  // ─── Brightness scoring ──────────────────────────────────────────────────

  /** Luminance value at which the brightness score peaks (0–1). */
  brightnessPeak: number;
  /**
   * Steepness of the brightness penalty away from `brightnessPeak`.
   * Higher values make the scorer more selective about frame exposure.
   */
  brightnessPenaltyFactor: number;

  // ─── Sharpness region weighting ──────────────────────────────────────────

  /**
   * Margin (as a fraction of each axis) that defines the center region.
   * The center zone spans `(1 − 2 × centerRegionPercent)` of each dimension.
   * Example: `0.15` → inner 70 % of each axis.
   */
  centerRegionPercent: number;
  /**
   * Weight given to the center-zone sharpness score (0–1).
   * `centerSharpnessWeight + fullSharpnessWeight` must equal `1`.
   */
  centerSharpnessWeight: number;
  /**
   * Weight given to the full-frame sharpness score (0–1).
   * `centerSharpnessWeight + fullSharpnessWeight` must equal `1`.
   */
  fullSharpnessWeight: number;
}

/**
 * Options accepted by {@link extractThumbnail}.
 *
 * Pass a quality preset string as shorthand, or an options object combining
 * an optional preset with fine-grained field overrides.
 *
 * @example
 * ```typescript
 * // Shorthand — just name a preset
 * await extractThumbnail(file, "performance");
 * await extractThumbnail(file, "best-quality");
 *
 * // Preset + overrides
 * await extractThumbnail(file, {
 *   quality: "quality",
 *   config: { thumbnailMaxWidth: 3840, thumbnailQuality: 0.99 },
 * });
 *
 * // Only field overrides — base preset defaults to "normal"
 * await extractThumbnail(file, { config: { coarseCount: 20 } });
 * ```
 */
export interface ThumbnailOptions {
  /**
   * Quality preset to use as the base configuration.
   * @default "normal"
   */
  quality?: ThumbnailQuality;
  /**
   * Fine-grained overrides applied on top of the chosen (or default) preset.
   * Only the specified fields are overridden; all others come from the preset.
   */
  config?: Partial<ThumbnailConfig>;
}
