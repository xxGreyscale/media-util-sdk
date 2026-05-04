import { fetchFile } from "@ffmpeg/util";
import type { ImageCompressionOptions, CompressedImageOutput } from "./types";
import type { ImageOutputFormat } from "./types";
import { IMAGE_MIME_TYPES, IMAGE_FORMAT_EXTENSIONS, DEFAULT_IMAGE_QUALITY } from "./constants";
import { ensureFfmpegLoaded, getFFmpegInstance } from "../shared/ffmpeg";

/**
 * Maps a 0–1 quality value to FFmpeg's JPEG -q:v scale (1–31, lower = better).
 * quality=1  → q=1  (highest quality)
 * quality=0  → q=31 (lowest quality)
 */
function qualityToFFmpegQv(quality: number): number {
  const clamped = Math.min(1, Math.max(0, quality));
  return Math.round(1 + (1 - clamped) * 30);
}

/**
 * Builds the FFmpeg arguments for transcoding an image to a target format.
 */
function buildImageFFmpegArgs(
  inputName: string,
  outputName: string,
  format: ImageOutputFormat,
  quality: number,
): string[] {
  const args: string[] = ["-i", inputName];

  if (format === "webp") {
    args.push("-c:v", "libwebp");
    // Map 0–1 to libwebp quality 0–100.
    args.push("-quality", String(Math.round(quality * 100)));
  } else if (format === "jpeg") {
    args.push("-q:v", String(qualityToFFmpegQv(quality)));
  }
  // PNG: no extra args needed — FFmpeg will encode losslessly.

  args.push(outputName);
  return args;
}

/**
 * Compresses / converts an image using FFmpeg WASM.
 *
 * This is used as:
 *  1. Primary path for HEIC/HEIF files (Canvas cannot decode them on most browsers).
 *  2. Fallback when `createImageBitmap` fails in the Canvas path.
 *
 * Note: `targetSizeKB` is not supported in the FFmpeg path. The output file size
 * is determined by the quality option and FFmpeg's codec behaviour.
 */
export async function compressWithFFmpeg(
  file: File,
  options: ImageCompressionOptions,
  outputFileName: string,
  onProgress?: (progress: number) => void,
): Promise<CompressedImageOutput> {
  await ensureFfmpegLoaded();
  const ffmpeg = getFFmpegInstance();

  const formats = options.outputFormats ?? ["webp"];
  const quality = options.quality ?? DEFAULT_IMAGE_QUALITY;

  // Preserve the original extension so FFmpeg knows the input format.
  const inputExt = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf("."))
    : "";
  const inputName = `__img_input${inputExt}`;
  const filesToCleanup: string[] = [inputName];

  const progressHandler = ({ progress }: { progress: number }) => {
    if (onProgress) {
      const clamped = Math.min(1, Math.max(0, progress));
      onProgress(Math.round(clamped * 100));
    }
  };

  ffmpeg.on("progress", progressHandler);

  try {
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile(inputName, fileData);

    const results: CompressedImageOutput = {};

    for (let i = 0; i < formats.length; i++) {
      const format: ImageOutputFormat = formats[i];
      const ext = IMAGE_FORMAT_EXTENSIONS[format];
      const mimeType = IMAGE_MIME_TYPES[format];
      const outputName = `${outputFileName}.${ext}`;
      filesToCleanup.push(outputName);

      const args = buildImageFFmpegArgs(inputName, outputName, format, quality);
      const exitCode = await ffmpeg.exec(args);

      if (exitCode !== 0) {
        throw new Error(
          `FFmpeg image encoding failed for format "${format}" (exit code ${exitCode}).`,
        );
      }

      const fileData = (await ffmpeg.readFile(outputName)) as Uint8Array;
      results[format] = new File([fileData.slice()], outputName, {
        type: mimeType,
        lastModified: Date.now(),
      });

      onProgress?.(Math.round(((i + 1) / formats.length) * 100));
    }

    return results;
  } finally {
    ffmpeg.off("progress", progressHandler);
    for (const name of filesToCleanup) {
      try {
        await ffmpeg.deleteFile(name);
      } catch {
        /* ignore */
      }
    }
  }
}
