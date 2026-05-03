/**
 * Frames evaluated in the coarse pass.
 */
export const COARSE_COUNT = 32;

/**
 * Frames per successive refinement pass (two passes).
 */
export const REFINE_COUNTS: readonly [number, number] = [16, 8];

/**
 * Analysis canvas width — larger = better gradient resolution.
 */
export const ANALYSIS_WIDTH = 480;

/**
 * Max width of the exported thumbnail image.
 */
export const THUMBNAIL_MAX_WIDTH = 1280;

/**
 * JPEG quality for the exported thumbnail.
 */
export const THUMBNAIL_QUALITY = 0.92;

/**
 * Hard-reject frames outside this luminance range (black frames, blown-out).
 */
export const MIN_MEAN_LUM = 0.06;
export const MAX_MEAN_LUM = 0.93;

/**
 * Hard-reject frames with near-zero luminance variance (fades, solid frames).
 */
export const MIN_STDDEV = 0.02;

/**
 * Percentage margin to skip from start/end of video (often black/credit frames).
 */
export const VIDEO_MARGIN_PERCENT = 0.05;

/**
 * Brightness preference peak value (0.45 luminance).
 */
export const BRIGHTNESS_PEAK = 0.45;

/**
 * Brightness penalty factor (higher = steeper penalty away from peak).
 */
export const BRIGHTNESS_PENALTY_FACTOR = 2.8;

/**
 * Center region as percentage of canvas (0.2 = inner 60% each axis).
 */
export const CENTER_REGION_PERCENT = 0.2;

/**
 * Weight of center sharpness vs full-frame sharpness.
 */
export const CENTER_SHARPNESS_WEIGHT = 0.7;
export const FULL_SHARPNESS_WEIGHT = 0.3;
