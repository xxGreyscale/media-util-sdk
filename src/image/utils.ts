import type { ImageCompressionOptions } from "./types";
import { HEIC_MIME_TYPES, HEIC_EXTENSIONS } from "./constants";

export { getBaseName } from "../shared/utils";

/**
 * Detects whether a file is a HEIC/HEIF image (typical on iPhone).
 * Checks the MIME type first, then falls back to the file extension.
 */
export function isHeicFile(file: File): boolean {
  if (HEIC_MIME_TYPES.includes(file.type as (typeof HEIC_MIME_TYPES)[number])) {
    return true;
  }
  const lower = file.name.toLowerCase();
  return HEIC_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Computes the output canvas dimensions given source dimensions and options.
 *
 * Priority:
 *  1. `width` + `height` set → exact size (may stretch).
 *  2. Only `width` set → preserve aspect ratio from width.
 *  3. Only `height` set → preserve aspect ratio from height.
 *  4. `maxWidth` / `maxHeight` → scale down proportionally, never upscale.
 *  5. Otherwise → keep original dimensions.
 */
export function computeOutputDimensions(
  srcW: number,
  srcH: number,
  options: ImageCompressionOptions,
): { w: number; h: number } {
  const { width, height, maxWidth, maxHeight } = options;

  // 1. Exact dimensions.
  if (width !== undefined && height !== undefined) {
    return { w: width, h: height };
  }

  // 2. Width-only — preserve aspect ratio.
  if (width !== undefined) {
    return { w: width, h: Math.round(srcH * (width / srcW)) };
  }

  // 3. Height-only — preserve aspect ratio.
  if (height !== undefined) {
    return { w: Math.round(srcW * (height / srcH)), h: height };
  }

  // 4. Max-dimension constraints — scale down proportionally, never upscale.
  let ratio = 1;
  if (maxWidth !== undefined) {
    ratio = Math.min(ratio, maxWidth / srcW);
  }
  if (maxHeight !== undefined) {
    ratio = Math.min(ratio, maxHeight / srcH);
  }
  // Cap at 1 to prevent upscaling.
  ratio = Math.min(ratio, 1);

  return {
    w: Math.round(srcW * ratio),
    h: Math.round(srcH * ratio),
  };
}
