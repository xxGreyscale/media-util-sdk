export { configureVideoUtils, compressVideo } from "./compression";
export type {
  CompressedOutput,
  VideoCompressionOptions,
  VideoUtilsConfig,
  FFmpegAssetUrls,
  OutputFormat,
  BatchCompressionItem,
  BatchCompressionResult,
} from "./compression/types";
export { compressVideos } from "./compression";

export { extractThumbnail } from "./thumbnail";
export type { ThumbnailResult } from "./thumbnail/types";

export { processVideo, processVideos, processVideosTolerant } from "./pipeline";
export type {
  ProcessVideoOptions,
  ProcessVideoResult,
  ProcessVideosItem,
  ProcessVideosResultItem,
  ProcessVideosTolerantResultItem,
} from "./pipeline/types";
