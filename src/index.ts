export { configureVideoUtils, compressVideo } from "./compression";
export {
  VIDEO_COMPRESSION_PROFILES,
  DEFAULT_COMPRESSION_PROFILE,
} from "./compression";
export type {
  CompressedOutput,
  VideoCompressionOptions,
  VideoCompressionProfile,
  VideoUtilsConfig,
  FFmpegAssetUrls,
  OutputFormat,
  BatchCompressionItem,
  BatchCompressionResult,
} from "./compression/types";
export { compressVideos } from "./compression";

export { extractThumbnail } from "./thumbnail";
export type {
  ThumbnailResult,
  ThumbnailQuality,
  ThumbnailConfig,
  ThumbnailOptions,
} from "./thumbnail/types";

export { processVideo, processVideos, processVideosTolerant } from "./pipeline";
export type {
  ProcessVideoOptions,
  ProcessVideoResult,
  ProcessVideosItem,
  ProcessVideosResultItem,
  ProcessVideosTolerantResultItem,
} from "./pipeline/types";

export { compressImage, compressImages } from "./image";
export type {
  CompressedImageOutput,
  ImageCompressionOptions,
  ImageOutputFormat,
  BatchImageCompressionItem,
  BatchImageCompressionResult,
} from "./image/types";

export { processImage, processImages, processImagesTolerant } from "./pipeline";
export type {
  ProcessImageOptions,
  ProcessImageResult,
  ProcessImagesItem,
  ProcessImagesResultItem,
  ProcessImagesTolerantResultItem,
} from "./pipeline/types";
