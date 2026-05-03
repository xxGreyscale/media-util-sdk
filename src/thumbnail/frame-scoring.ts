import {
  MIN_MEAN_LUM,
  MAX_MEAN_LUM,
  MIN_STDDEV,
  BRIGHTNESS_PEAK,
  BRIGHTNESS_PENALTY_FACTOR,
  CENTER_REGION_PERCENT,
  CENTER_SHARPNESS_WEIGHT,
  FULL_SHARPNESS_WEIGHT,
} from "./constants";

/**
 * Extracts grayscale and saturation data from image pixels.
 * Uses Rec. 709 luminance and HSV saturation.
 */
export function extractGrayAndSat(
  data: Uint8ClampedArray,
  pixelCount: number,
): { gray: Float32Array; sat: Float32Array } {
  const gray = new Float32Array(pixelCount);
  const sat = new Float32Array(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4] / 255;
    const g = data[i * 4 + 1] / 255;
    const b = data[i * 4 + 2] / 255;
    // Rec. 709 luminance
    gray[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // HSV saturation
    const hi = Math.max(r, g, b);
    const lo = Math.min(r, g, b);
    sat[i] = hi > 0 ? (hi - lo) / hi : 0;
  }

  return { gray, sat };
}

/**
 * Scores a frame based on sharpness, saturation, contrast, and brightness.
 * Returns -Infinity for rejected frames (black, blown-out, flat).
 */
export function scoreFrame(
  gray: Float32Array,
  sat: Float32Array,
  width: number,
  height: number,
): number {
  const n = gray.length;

  // Mean luminance
  let sum = 0;
  for (let i = 0; i < n; i++) sum += gray[i];
  const mean = sum / n;

  // Hard-reject: near-black, blown-out, or flat (transition/fade) frames.
  if (mean < MIN_MEAN_LUM || mean > MAX_MEAN_LUM) return -Infinity;

  let varSum = 0;
  for (let i = 0; i < n; i++) varSum += (gray[i] - mean) ** 2;
  const stdDev = Math.sqrt(varSum / n);

  if (stdDev < MIN_STDDEV) return -Infinity;

  // Brightness preference: smooth peak at 0.45, penalise extremes.
  const brightnessScore = Math.max(
    0,
    1 - Math.abs(mean - BRIGHTNESS_PEAK) * BRIGHTNESS_PENALTY_FACTOR,
  );

  // Mean saturation — colourful frames tend to be more representative.
  let satSum = 0;
  for (let i = 0; i < n; i++) satSum += sat[i];
  const meanSat = satSum / n;

  // Sharpness: Tenengrad (Sobel gradient magnitude²), split into center and
  // full-frame regions. Center (inner 60% each axis) is weighted 3× because
  // that is where the subject usually appears.
  const cx0 = Math.floor(width * CENTER_REGION_PERCENT);
  const cx1 = Math.ceil(width * (1 - CENTER_REGION_PERCENT));
  const cy0 = Math.floor(height * CENTER_REGION_PERCENT);
  const cy1 = Math.ceil(height * (1 - CENTER_REGION_PERCENT));

  let tenAll = 0;
  let tenCenter = 0;
  let cntAll = 0;
  let cntCenter = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      // 3×3 Sobel kernels
      const gx =
        -gray[idx - width - 1] +
        gray[idx - width + 1] +
        -2 * gray[idx - 1] +
        2 * gray[idx + 1] +
        -gray[idx + width - 1] +
        gray[idx + width + 1];
      const gy =
        -gray[idx - width - 1] -
        2 * gray[idx - width] -
        gray[idx - width + 1] +
        gray[idx + width - 1] +
        2 * gray[idx + width] +
        gray[idx + width + 1];
      const mag2 = gx * gx + gy * gy;

      tenAll += mag2;
      cntAll++;

      if (x >= cx0 && x < cx1 && y >= cy0 && y < cy1) {
        tenCenter += mag2;
        cntCenter++;
      }
    }
  }

  const sharpAll = cntAll > 0 ? tenAll / cntAll : 0;
  const sharpCenter = cntCenter > 0 ? tenCenter / cntCenter : 0;
  // 30% full-frame + 70% center gives a good balance between subject and
  // background sharpness.
  const sharpness =
    FULL_SHARPNESS_WEIGHT * sharpAll + CENTER_SHARPNESS_WEIGHT * sharpCenter;

  // Sharpness dominates; saturation, contrast, and brightness are tiebreakers.
  return (
    sharpness * 1000 + meanSat * 0.5 + stdDev * 0.2 + brightnessScore * 0.1
  );
}
