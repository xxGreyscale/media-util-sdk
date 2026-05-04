import type { VideoCompressionOptions, OutputFormat } from "./types";
import {
  DEFAULT_COMPRESSION_PROFILE,
  VIDEO_COMPRESSION_PROFILES,
} from "./constants";

/**
 * Parses compression arguments from VideoCompressionOptions.
 */
export function parseCompressionArgs(
  options: VideoCompressionOptions,
): VideoCompressionOptions {
  const profile = options.profile ?? DEFAULT_COMPRESSION_PROFILE;
  const profileDefaults = VIDEO_COMPRESSION_PROFILES[profile];

  return {
    ...profileDefaults,
    ...options,
    profile,
    outputFormats: options.outputFormats ??
      profileDefaults.outputFormats ?? ["mp4"],
    fps: options.fps ?? profileDefaults.fps ?? 24,
    threads: options.threads ?? profileDefaults.threads ?? 2,
    fastStart: options.fastStart ?? profileDefaults.fastStart ?? true,
  };
}

/**
 * Gets available output formats based on options.
 */
export function getAvailableFormats(
  options?: VideoCompressionOptions,
): OutputFormat[] {
  const profile = options?.profile ?? DEFAULT_COMPRESSION_PROFILE;
  const profileDefaults = VIDEO_COMPRESSION_PROFILES[profile];

  return options?.outputFormats ?? profileDefaults.outputFormats ?? ["mp4"];
}
