/**
 * Supported output formats.
 */
export type OutputFormat =
  | "mp4"
  | "webm"
  | "mkv"
  | "avi"
  | "mov"
  | "aac"
  | "mp3"
  | "opus"
  | "flac";

export type AudioFormat = "aac" | "mp3" | "opus" | "flac";

/**
 * Compression profile presets.
 * Ordered from fastest to slowest/best-visuals.
 */
export type VideoCompressionProfile =
  | "performance"
  | "balanced"
  | "quality"
  | "best-quality";

export interface FormatCodecConfig {
  readonly defaultVideoCodec?: string;
  readonly defaultAudioCodec?: string;
}

/**
 * Compression options for video output.
 */
export interface VideoCompressionOptions {
  /** Output filename (without extension). Default: based on input filename. */
  outputFileName?: string;
  /** Output formats to generate. Default: ["mp4"]. */
  outputFormats?: OutputFormat[];
  /** Compression profile preset. Default: "performance". */
  profile?: VideoCompressionProfile;
  /** Video codec. Default: depends on output format. */
  videoCodec?: string;
  /** Video encoder preset (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow). Default: depends on selected profile. */
  preset?: string;
  /** CRF (Constant Rate Factor): 0-51, lower = better quality. Default: depends on selected profile. */
  crf?: number;
  /** Bitrate for video (e.g., "1500k", "2M"). If set, overrides CRF. */
  videoBitrate?: string;
  /** Video width in pixels. If set, maintains aspect ratio unless also specifying height. */
  width?: number;
  /** Video height in pixels. */
  height?: number;
  /** Aspect ratio (e.g., "16:9", "4:3"). */
  aspectRatio?: string;
  /** Frames per second. Default: depends on selected profile. */
  fps?: number;
  /** Audio codec. Default: depends on output format. */
  audioCodec?: string;
  /** Audio bitrate. Default: depends on selected profile. */
  audioBitrate?: string;
  /** Number of threads for encoding. Default: depends on selected profile. */
  threads?: number;
  /** Include faststart flag for faster streaming (MP4 only). Default: true. */
  fastStart?: boolean;
}

/**
 * Explicit FFmpeg asset URLs.
 * Useful when assets are hosted on a CDN or when runtime URL inference
 * is not reliable (SSR/hybrid environments).
 */
export interface FFmpegAssetUrls {
  coreURL: string;
  wasmURL: string;
}

/**
 * Configuration for the video utilities SDK.
 */
export interface VideoUtilsConfig {
  /** Path where ffmpeg-core.js and ffmpeg-core.wasm are served. */
  ffmpegBaseUrl?: string;
  /** Explicit FFmpeg asset URLs. Takes precedence over ffmpegBaseUrl. */
  ffmpegAssetUrls?: FFmpegAssetUrls;
  /** Default video compression options. */
  compressionDefaults?: VideoCompressionOptions;
  /** Default image compression options applied to every compressImage call. */
  imageCompressionDefaults?: import("../image/types").ImageCompressionOptions;
}

/**
 * Map of format name to compressed File.
 */
export interface CompressedOutput {
  [format: string]: File;
}

/**
 * A single item in a batch compression request.
 */
export interface BatchCompressionItem {
  /** The video file to compress. */
  file: File;
  /** Per-file compression options. Merged on top of global defaults. */
  options?: VideoCompressionOptions;
  /** Progress callback for this specific file (0-100). */
  onProgress?: (progress: number) => void;
}

/**
 * The result for one file in a batch compression.
 */
export interface BatchCompressionResult {
  /** The original input file. */
  file: File;
  /** Compressed outputs, if the compression succeeded. */
  output?: CompressedOutput;
  /** Error, if the compression failed. */
  error?: Error;
}
