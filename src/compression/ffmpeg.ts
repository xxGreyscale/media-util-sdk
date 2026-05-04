// FFmpeg infrastructure is shared across the video and image modules.
// All implementation lives in shared/ffmpeg.ts; this file re-exports it so
// intra-module imports (./ffmpeg) continue to resolve without change.
export {
  setFFmpegBaseUrl,
  setFFmpegAssetUrls,
  getFFmpegBaseUrl,
  getFFmpegAssetUrls,
  getFFmpegInstance,
  ensureFfmpegLoaded,
  resetFFmpeg,
  createIsolatedFFmpegInstance,
} from "../shared/ffmpeg";


