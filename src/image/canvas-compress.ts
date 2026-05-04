import type { ImageCompressionOptions, CompressedImageOutput } from "./types";
import type { ImageOutputFormat } from "./types";
import {
  IMAGE_MIME_TYPES,
  IMAGE_FORMAT_EXTENSIONS,
  LOSSLESS_FORMATS,
  TARGET_SIZE_SEARCH_ITERATIONS,
  DEFAULT_IMAGE_QUALITY,
} from "./constants";
import { computeOutputDimensions } from "./utils";

/**
 * Converts a canvas to a Blob for the given MIME type and quality.
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`canvas.toBlob returned null for "${mimeType}"`));
      },
      mimeType,
      quality,
    );
  });
}

/**
 * Finds the highest quality value that produces an output ≤ targetBytes
 * via binary search. Falls back to the best result found even if none fit.
 *
 * PNG is lossless and quality has no effect — callers must skip this for PNG.
 */
async function binarySearchQuality(
  canvas: HTMLCanvasElement,
  mimeType: string,
  targetBytes: number,
): Promise<Blob> {
  let lo = 0.05;
  let hi = 1.0;
  let bestBlob: Blob | null = null;

  for (let i = 0; i < TARGET_SIZE_SEARCH_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, mimeType, mid);
    if (blob.size <= targetBytes) {
      // Fits — try higher quality.
      bestBlob = blob;
      lo = mid;
    } else {
      // Too large — lower quality.
      hi = mid;
    }
  }

  // If nothing fit, return the smallest possible output.
  return bestBlob ?? (await canvasToBlob(canvas, mimeType, lo));
}

/**
 * Compresses an image using the browser Canvas API.
 *
 * Throws a `DOMException` or `TypeError` if the file cannot be decoded
 * (e.g. HEIC/HEIF on browsers that don't support it). Callers should
 * catch this and fall back to FFmpeg.
 */
export async function compressWithCanvas(
  file: File,
  options: ImageCompressionOptions,
  outputFileName: string,
  onProgress?: (progress: number) => void,
): Promise<CompressedImageOutput> {
  // createImageBitmap throws for unsupported formats (e.g. HEIC) →
  // caller catches and routes to FFmpeg.
  const bitmap = await createImageBitmap(file);

  const { w, h } = computeOutputDimensions(bitmap.width, bitmap.height, options);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  // alpha: false → the canvas has no alpha channel.
  // This lets browsers encode PNG as 24-bit RGB instead of 32-bit RGBA,
  // which significantly reduces PNG output size for opaque source images.
  // Transparent areas in the source are composited onto white (not black).
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    bitmap.close();
    throw new Error("Failed to get 2D canvas context for image compression.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const formats = options.outputFormats ?? ["webp"];
  const quality = options.quality ?? DEFAULT_IMAGE_QUALITY;
  const targetBytes =
    options.targetSizeKB !== undefined
      ? options.targetSizeKB * 1024
      : undefined;

  const results: CompressedImageOutput = {};

  for (let i = 0; i < formats.length; i++) {
    const format: ImageOutputFormat = formats[i];
    const mimeType = IMAGE_MIME_TYPES[format];
    const ext = IMAGE_FORMAT_EXTENSIONS[format];
    const isLossless = LOSSLESS_FORMATS.includes(format);

    let blob: Blob;

    if (targetBytes !== undefined && !isLossless) {
      blob = await binarySearchQuality(canvas, mimeType, targetBytes);
    } else {
      // For lossless formats, quality is passed but browsers ignore it.
      blob = await canvasToBlob(canvas, mimeType, quality);
    }

    results[format] = new File([blob], `${outputFileName}.${ext}`, {
      type: mimeType,
      lastModified: Date.now(),
    });

    onProgress?.(Math.round(((i + 1) / formats.length) * 100));
  }

  return results;
}
