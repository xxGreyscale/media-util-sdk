import type {
  OutputFormat,
  FormatCodecConfig,
  VideoCompressionOptions,
  VideoCompressionProfile,
} from "./types";

export const DEFAULT_FFMPEG_BASE_URL = "/ffmpeg/";

export const AUDIO_ONLY_FORMATS = ["aac", "mp3", "opus", "flac"] as const;

/**
 * MIME type mappings for supported formats.
 */
export const MIME_TYPES: Record<OutputFormat, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  mov: "video/quicktime",
  aac: "audio/aac",
  mp3: "audio/mpeg",
  opus: "audio/opus",
  flac: "audio/flac",
} as const;

/**
 * Codec configurations for each format.
 */
export const FORMAT_CODEC_CONFIG: Record<OutputFormat, FormatCodecConfig> = {
  mp4: { defaultVideoCodec: "libx264", defaultAudioCodec: "aac" },
  webm: { defaultVideoCodec: "libvpx", defaultAudioCodec: "opus" },
  mkv: { defaultVideoCodec: "libx264", defaultAudioCodec: "aac" },
  avi: { defaultVideoCodec: "mpeg4", defaultAudioCodec: "libmp3lame" },
  mov: { defaultVideoCodec: "libx264", defaultAudioCodec: "aac" },
  aac: { defaultAudioCodec: "aac" },
  mp3: { defaultAudioCodec: "libmp3lame" },
  opus: { defaultAudioCodec: "opus" },
  flac: { defaultAudioCodec: "flac" },
} as const;

export const VIDEO_COMPRESSION_PROFILES: Readonly<
  Record<VideoCompressionProfile, Readonly<Partial<VideoCompressionOptions>>>
> = {
  // Fastest preset for browser-side workloads.
  performance: {
    outputFormats: ["mp4"],
    videoCodec: "libx264",
    preset: "ultrafast",
    crf: 36,
    fps: 24,
    audioCodec: "aac",
    audioBitrate: "96k",
    threads: 1,
    fastStart: true,
  },
  // Good speed/size/quality compromise.
  balanced: {
    outputFormats: ["mp4"],
    videoCodec: "libx264",
    preset: "veryfast",
    crf: 32,
    fps: 24,
    audioCodec: "aac",
    audioBitrate: "128k",
    threads: 2,
    fastStart: true,
  },
  // Quality-oriented profile still practical in browser.
  quality: {
    outputFormats: ["mp4"],
    videoCodec: "libx264",
    preset: "medium",
    crf: 28,
    fps: 30,
    audioCodec: "aac",
    audioBitrate: "128k",
    threads: 2,
    fastStart: true,
  },
  // Slowest profile focused on visual quality.
  "best-quality": {
    outputFormats: ["mp4"],
    videoCodec: "libx264",
    preset: "slow",
    crf: 23,
    fps: 30,
    audioCodec: "aac",
    audioBitrate: "160k",
    threads: 2,
    fastStart: true,
  },
} as const;

export const DEFAULT_COMPRESSION_PROFILE: VideoCompressionProfile =
  "performance";

export const DEFAULT_COMPRESSION_SETTINGS: Readonly<VideoCompressionOptions> = {
  profile: DEFAULT_COMPRESSION_PROFILE,
  videoCodec: "libx264",
  preset: "ultrafast",
  crf: 36,
  fps: 24,
  audioCodec: "aac",
  audioBitrate: "96k",
  threads: 1,
  fastStart: true,
  outputFormats: ["mp4"] as const,
} as const;
