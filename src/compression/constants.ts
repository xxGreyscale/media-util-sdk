import type { OutputFormat, FormatCodecConfig, AudioFormat } from "./types";

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
  webm: { defaultVideoCodec: "libvpx-vp9", defaultAudioCodec: "opus" },
  mkv: { defaultVideoCodec: "libx264", defaultAudioCodec: "aac" },
  avi: { defaultVideoCodec: "mpeg4", defaultAudioCodec: "libmp3lame" },
  mov: { defaultVideoCodec: "libx264", defaultAudioCodec: "aac" },
  aac: { defaultAudioCodec: "aac" },
  mp3: { defaultAudioCodec: "libmp3lame" },
  opus: { defaultAudioCodec: "opus" },
  flac: { defaultAudioCodec: "flac" },
} as const;

export const DEFAULT_COMPRESSION_SETTINGS = {
  videoCodec: "libx264",
  preset: "medium" as const,
  crf: 35,
  fps: 24,
  audioCodec: "aac",
  audioBitrate: "128k",
  threads: 2,
  fastStart: true,
  outputFormats: ["mp4"] as const,
} as const;
