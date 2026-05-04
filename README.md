# @mdslabs/media-compression

Friendly browser SDK for media workflows:

- Compress videos
- Extract high-quality thumbnails
- Compress images
- Run batch pipelines
- Use optional React hooks

## Why This SDK

This package helps you build upload flows quickly without sending files to a backend for processing.

It is designed for browser apps and defaults to fast settings so users spend less time waiting.

## Start Here (2 minutes)

1. Install dependencies:

```bash
npm install @mdslabs/media-compression @ffmpeg/ffmpeg @ffmpeg/util
```

2. Copy FFmpeg assets to your public folder:

```bash
npm run copy-assets
```

3. Configure once at app startup:

```ts
import { configureVideoUtils } from "@mdslabs/media-compression";

configureVideoUtils({
  ffmpegBaseUrl: "/ffmpeg/",
});
```

4. Use the APIs:

```ts
import { compressVideo, extractThumbnail } from "@mdslabs/media-compression";

const compressed = await compressVideo(file, { profile: "performance" });
const thumbnail = await extractThumbnail(file, "normal");
```

## Installation Notes

- React hooks are optional. Install React only if you import the React subpath.

```bash
npm install react
```

- For SSR/hybrid setups, you can pass absolute asset URLs instead of ffmpegBaseUrl:

```ts
configureVideoUtils({
  ffmpegAssetUrls: {
    coreURL: "https://cdn.example.com/ffmpeg/ffmpeg-core.js",
    wasmURL: "https://cdn.example.com/ffmpeg/ffmpeg-core.wasm",
  },
});
```

## Compression Profiles (Video)

The SDK provides 4 presets, from fastest to slowest:

1. performance (default)
2. balanced
3. quality
4. best-quality

Most apps should start with performance or balanced.

```ts
import { compressVideo } from "@mdslabs/media-compression";

const output = await compressVideo(file, {
  profile: "balanced",
});
```

You can still override any field:

```ts
const output = await compressVideo(file, {
  profile: "quality",
  crf: 26,
  width: 1920,
  outputFormats: ["mp4", "webm"],
});
```

Inspect built-in presets:

```ts
import {
  VIDEO_COMPRESSION_PROFILES,
  DEFAULT_COMPRESSION_PROFILE,
} from "@mdslabs/media-compression";

console.log(DEFAULT_COMPRESSION_PROFILE);
console.log(VIDEO_COMPRESSION_PROFILES.performance);
```

## Core API Guide

### configureVideoUtils(config)

Set global defaults once.

```ts
import { configureVideoUtils } from "@mdslabs/media-compression";

configureVideoUtils({
  ffmpegBaseUrl: "/ffmpeg/",
  compressionDefaults: {
    profile: "balanced",
  },
  imageCompressionDefaults: {
    quality: 0.8,
    outputFormats: ["webp"],
  },
});
```

### compressVideo(file, options?, onProgress?)

Compress one video and get files by output format.

```ts
import { compressVideo } from "@mdslabs/media-compression";

const compressed = await compressVideo(
  file,
  {
    profile: "performance",
    outputFormats: ["mp4"],
    width: 1280,
  },
  (progress) => {
    console.log(`Video compression: ${progress}%`);
  },
);

const mp4 = compressed.mp4;
```

### compressVideos(items, maxConcurrency?)

Batch compress videos. Results preserve input order and include per-file errors.

```ts
import { compressVideos } from "@mdslabs/media-compression";

const results = await compressVideos(
  [
    { file: fileA, options: { profile: "performance" } },
    { file: fileB, options: { profile: "balanced" } },
  ],
  3,
);

for (const result of results) {
  if (result.error) {
    console.error(result.file.name, result.error.message);
    continue;
  }
  console.log(result.file.name, Object.keys(result.output ?? {}));
}
```

### extractThumbnail(file, options?)

Extract a representative JPEG thumbnail.

```ts
import { extractThumbnail } from "@mdslabs/media-compression";

const thumb = await extractThumbnail(file, {
  quality: "quality",
  config: { thumbnailMaxWidth: 1920 },
});

const url = URL.createObjectURL(thumb.blob);
```

## Pipelines

Pipelines combine steps so you can call one function instead of orchestrating multiple APIs.

Important behavior:

- Video pipeline compresses first for better throughput.
- Thumbnail extraction still uses the original video file for best image quality.

### processVideo(file, options?)

```ts
import { processVideo } from "@mdslabs/media-compression";

const result = await processVideo(file, {
  compressionOptions: { profile: "balanced", outputFormats: ["mp4"] },
  thumbnailOptions: "normal",
  onCompressionProgress: (p) => console.log(p),
});

console.log(result.compressed.mp4, result.thumbnail.timestampSeconds);
```

### processVideos(items, maxConcurrency?)

Strict mode. Throws if any item fails.

```ts
import { processVideos } from "@mdslabs/media-compression";

const results = await processVideos([
  { file: fileA, compressionOptions: { profile: "performance" } },
  { file: fileB, compressionOptions: { profile: "quality" } },
]);
```

### processVideosTolerant(items, maxConcurrency?)

Tolerant mode. Never throws at batch level.

```ts
import { processVideosTolerant } from "@mdslabs/media-compression";

const results = await processVideosTolerant([{ file: fileA }, { file: fileB }]);

for (const item of results) {
  if (item.compressionError || item.thumbnailError) {
    console.warn(item.file.name, item.compressionError, item.thumbnailError);
  }
}
```

## Image APIs

### compressImage(file, options?, onProgress?)

```ts
import { compressImage } from "@mdslabs/media-compression";

const images = await compressImage(file, {
  outputFormats: ["jpeg", "webp"],
  quality: 0.82,
  maxWidth: 1920,
});
```

### compressImages(items, maxConcurrency?)

```ts
import { compressImages } from "@mdslabs/media-compression";

const results = await compressImages([
  { file: imgA, options: { outputFormats: ["webp"] } },
  { file: imgB, options: { outputFormats: ["jpeg"], quality: 0.9 } },
]);
```

### Image pipelines

```ts
import {
  processImage,
  processImages,
  processImagesTolerant,
} from "@mdslabs/media-compression";

const single = await processImage(imgA, {
  compressionOptions: { outputFormats: ["webp"] },
});

const strictBatch = await processImages([{ file: imgA }, { file: imgB }]);
const tolerantBatch = await processImagesTolerant([
  { file: imgA },
  { file: imgB },
]);
```

## React Hooks

React hooks are exported from:

```ts
import {
  useVideoUpload,
  useImageUpload,
} from "@mdslabs/media-compression/react";
```

### useVideoUpload(options?)

```tsx
import { useVideoUpload } from "@mdslabs/media-compression/react";

function VideoUploader() {
  const upload = useVideoUpload({
    compressionOptions: { profile: "performance", outputFormats: ["mp4"] },
  });

  return (
    <>
      <input type="file" accept="video/*" onChange={upload.onFileSelect} />
      <button
        onClick={() => upload.compressSelectedVideo()}
        disabled={!upload.selectedFile || upload.isCompressing}
      >
        Compress
      </button>
      <p>{upload.compressionProgress}%</p>
    </>
  );
}
```

### useImageUpload(options?)

```tsx
import { useImageUpload } from "@mdslabs/media-compression/react";

function ImageUploader() {
  const upload = useImageUpload({
    compressionOptions: { outputFormats: ["webp"], quality: 0.82 },
  });

  return (
    <>
      <input type="file" accept="image/*" onChange={upload.onFileSelect} />
      <button
        onClick={() => upload.compressSelectedImage()}
        disabled={!upload.selectedFile || upload.isCompressing}
      >
        Compress
      </button>
      <p>{upload.compressionProgress}%</p>
    </>
  );
}
```

## What Is Exported

From @mdslabs/media-compression:

- configureVideoUtils
- compressVideo, compressVideos
- extractThumbnail
- processVideo, processVideos, processVideosTolerant
- compressImage, compressImages
- processImage, processImages, processImagesTolerant
- VIDEO_COMPRESSION_PROFILES, DEFAULT_COMPRESSION_PROFILE
- all public TypeScript types

From @mdslabs/media-compression/react:

- useVideoUpload
- useImageUpload

## Troubleshooting

If compression fails immediately:

1. Confirm FFmpeg assets exist in your public folder.
2. Confirm configureVideoUtils is called before compression.
3. Confirm your ffmpegBaseUrl or ffmpegAssetUrls are reachable.

If performance feels slow:

1. Start with profile: "performance".
2. Use outputFormats: ["mp4"] first.
3. Lower output resolution (width/maxWidth).

## Runtime Notes

- This SDK is browser-oriented and relies on File, Blob, URL, document, and Canvas APIs.
- React is an optional peer dependency, only needed for the React subpath.
