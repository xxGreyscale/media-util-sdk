import type {
  OutputFormat,
  AudioFormat,
  VideoCompressionOptions,
} from "./types";
import { FORMAT_CODEC_CONFIG, AUDIO_ONLY_FORMATS } from "./constants";

/**
 * Determines if a format is audio-only.
 */
export function isAudioOnlyFormat(format: OutputFormat): boolean {
  return AUDIO_ONLY_FORMATS.includes(format as AudioFormat);
}

/**
 * Builds scale filter string from width and height.
 */
export function buildScaleFilter(
  width: number | undefined,
  height: number | undefined,
): string {
  if (width !== undefined && height !== undefined) {
    return `scale=${width}:${height}`;
  }
  if (width !== undefined) {
    return `scale=${width}:-1`;
  }
  if (height !== undefined) {
    return `scale=-1:${height}`;
  }
  return "";
}

/**
 * Adds video processing arguments to FFmpeg command.
 */
function addVideoArgs(
  args: string[],
  format: OutputFormat,
  options: VideoCompressionOptions,
): void {
  // Frame rate
  if (options.fps !== undefined) {
    args.push("-r", options.fps.toString());
  }

  // Resolution scaling
  if (options.width !== undefined || options.height !== undefined) {
    const scale = buildScaleFilter(options.width, options.height);
    if (scale) {
      args.push("-vf", scale);
    }
  } else if (options.aspectRatio !== undefined) {
    args.push("-vf", `setdar=${options.aspectRatio}`);
  }

  // Video codec
  const formatConfig = FORMAT_CODEC_CONFIG[format];
  const videoCodec =
    options.videoCodec || formatConfig.defaultVideoCodec || "libx264";
  args.push("-c:v", videoCodec);

  // Encoding preset
  if (options.preset !== undefined) {
    args.push("-preset", options.preset);
  }

  // Quality settings
  if (options.videoBitrate !== undefined) {
    args.push("-b:v", options.videoBitrate);
  } else if (options.crf !== undefined) {
    args.push("-crf", options.crf.toString());
  }

  // Format-specific options
  if (format === "mp4" && options.fastStart !== false) {
    args.push("-movflags", "+faststart");
  }
}

/**
 * Adds audio processing arguments to FFmpeg command.
 */
function addAudioArgs(
  args: string[],
  format: OutputFormat,
  options: VideoCompressionOptions,
): void {
  const formatConfig = FORMAT_CODEC_CONFIG[format];
  const audioCodec =
    options.audioCodec || formatConfig.defaultAudioCodec || "aac";

  args.push("-c:a", audioCodec);

  if (options.audioBitrate !== undefined) {
    args.push("-b:a", options.audioBitrate);
  }
}

/**
 * Adds threading arguments to FFmpeg command.
 */
function addThreadingArgs(
  args: string[],
  options: VideoCompressionOptions,
): void {
  if (options.threads !== undefined) {
    args.push("-threads", options.threads.toString());
  }
}

/**
 * Builds FFmpeg command arguments for a specific format.
 */
export function buildFFmpegCommand(
  inputName: string,
  outputName: string,
  format: OutputFormat,
  options: VideoCompressionOptions,
): string[] {
  const args: string[] = ["-i", inputName];

  if (!isAudioOnlyFormat(format)) {
    addVideoArgs(args, format, options);
  } else {
    args.push("-vn"); // Remove video stream for audio-only formats
  }

  addAudioArgs(args, format, options);
  addThreadingArgs(args, options);

  args.push(outputName);
  return args;
}
