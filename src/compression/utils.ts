import type { VideoCompressionOptions, OutputFormat } from "./types";

/**
 * Extracts base filename without extension.
 */
export function getBaseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

/**
 * Parses compression arguments from VideoCompressionOptions.
 */
export function parseCompressionArgs(
  options: VideoCompressionOptions,
): VideoCompressionOptions {
  return {
    ...options,
    fps: options.fps ?? 24,
    threads: options.threads ?? 2,
    fastStart: options.fastStart !== false,
  };
}

/**
 * Gets available output formats based on options.
 */
export function getAvailableFormats(
  options?: VideoCompressionOptions,
): OutputFormat[] {
  return options?.outputFormats ?? ["mp4"];
}
