import type { ImageOutputFormat } from "./types";

export const DEFAULT_IMAGE_OUTPUT_FORMATS: ImageOutputFormat[] = ["webp"];

export const DEFAULT_IMAGE_QUALITY = 0.82;

/**
 * MIME type mappings for supported image output formats.
 */
export const IMAGE_MIME_TYPES: Record<ImageOutputFormat, string> = {
  jpeg: "image/jpeg",
  webp: "image/webp",
  png: "image/png",
} as const;

/**
 * File extension mappings for supported image output formats.
 */
export const IMAGE_FORMAT_EXTENSIONS: Record<ImageOutputFormat, string> = {
  jpeg: "jpg",
  webp: "webp",
  png: "png",
} as const;

/**
 * MIME types used by HEIC/HEIF files (iPhone photos).
 */
export const HEIC_MIME_TYPES = [
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
] as const;

/**
 * File extensions used by HEIC/HEIF files (iPhone photos).
 */
export const HEIC_EXTENSIONS = [".heic", ".heif", ".heics", ".heix"] as const;

/**
 * Lossless formats — quality and targetSizeKB via quality adjustment do not apply.
 */
export const LOSSLESS_FORMATS: ImageOutputFormat[] = ["png"];

/**
 * Number of binary-search iterations when targeting a specific file size.
 */
export const TARGET_SIZE_SEARCH_ITERATIONS = 10;
