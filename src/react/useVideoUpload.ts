import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { compressVideo } from "../compression";
import type {
  CompressedOutput,
  VideoCompressionOptions,
} from "../compression/types";
import { extractThumbnail } from "../thumbnail";
import type { ThumbnailResult } from "../thumbnail/types";

/**
 * Options for the useVideoUpload hook.
 */
export interface UseVideoUploadOptions {
  /** Compression options to apply when compressing videos. */
  compressionOptions?: VideoCompressionOptions;
}

/**
 * React hook for video upload, compression, and thumbnail extraction.
 *
 * @param options - Configuration options for the hook
 *
 * @example
 * const upload = useVideoUpload({
 *   compressionOptions: { width: 1920, crf: 28 }
 * });
 */
export function useVideoUpload(options?: UseVideoUploadOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [durationInSeconds, setDurationInSeconds] = useState<number | null>(
    null,
  );
  const [compressedFiles, setCompressedFiles] =
    useState<CompressedOutput | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<ThumbnailResult | null>(null);
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState(false);

  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  const thumbnailUrl = useMemo(() => {
    if (!thumbnail) return null;
    return URL.createObjectURL(thumbnail.blob);
  }, [thumbnail]);

  useEffect(() => {
    return () => {
      if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
    };
  }, [thumbnailUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setDurationInSeconds(null);
    setCompressedFiles(null);
    setCompressionProgress(0);
    setCompressionError(null);
    setThumbnail(null);

    if (file) {
      setIsExtractingThumbnail(true);
      extractThumbnail(file)
        .then(setThumbnail)
        .catch((err: unknown) => {
          console.warn("Thumbnail extraction failed:", err);
        })
        .finally(() => {
          setIsExtractingThumbnail(false);
        });
    }
  };

  const onPreviewLoaded = (duration: number) => {
    setDurationInSeconds(duration);
  };

  const compressSelectedVideo = async () => {
    if (!selectedFile || isCompressing) {
      return;
    }

    setIsCompressing(true);
    setCompressionProgress(0);
    setCompressionError(null);

    try {
      const output = await compressVideo(
        selectedFile,
        options?.compressionOptions,
        (progress) => {
          setCompressionProgress(progress);
        },
      );
      setCompressedFiles(output);
    } catch (error) {
      console.error("Compression error:", error);
      setCompressedFiles(null);
      setCompressionError(
        error instanceof Error ? error.message : "Compression failed.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadFile = (format: string) => {
    if (!compressedFiles) return;
    const file = compressedFiles[format];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadThumbnail = () => {
    if (!thumbnail || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^.]+$/, "");
    const url = URL.createObjectURL(thumbnail.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${baseName}-thumbnail.jpg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setDurationInSeconds(null);
    setCompressedFiles(null);
    setCompressionProgress(0);
    setCompressionError(null);
    setThumbnail(null);
  };

  const getAvailableFormats = (): string[] => {
    if (!compressedFiles) return [];
    return Object.keys(compressedFiles);
  };

  return {
    selectedFile,
    previewUrl,
    durationInSeconds,
    compressedFiles,
    isCompressing,
    compressionProgress,
    compressionError,
    thumbnail,
    thumbnailUrl,
    isExtractingThumbnail,
    onFileSelect,
    onPreviewLoaded,
    compressSelectedVideo,
    downloadFile,
    downloadThumbnail,
    getAvailableFormats,
    clearSelection,
  };
}
