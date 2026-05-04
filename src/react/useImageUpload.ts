import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { compressImage } from "../image";
import type {
  CompressedImageOutput,
  ImageCompressionOptions,
} from "../image/types";

/**
 * Options for the useImageUpload hook.
 */
export interface UseImageUploadOptions {
  /** Compression options to apply when compressSelectedImage is called. */
  compressionOptions?: ImageCompressionOptions;
}

/**
 * React hook for image upload and compression.
 *
 * After selecting a file, call `compressSelectedImage()` to start compression.
 * Unlike the video hook, compression is NOT triggered automatically on file
 * select — images don't have a separate async step that benefits from
 * early start.
 *
 * @param options - Configuration options for the hook.
 *
 * @example
 * ```tsx
 * const upload = useImageUpload({
 *   compressionOptions: { maxWidth: 1920, quality: 0.85 },
 * });
 *
 * return (
 *   <>
 *     <input type="file" accept="image/*" onChange={upload.onFileSelect} />
 *     {upload.previewUrl && <img src={upload.previewUrl} />}
 *     <button onClick={() => upload.compressSelectedImage()}>Compress</button>
 *   </>
 * );
 * ```
 */
export function useImageUpload(options?: UseImageUploadOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedFiles, setCompressedFiles] =
    useState<CompressedImageOutput | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressionError, setCompressionError] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  // Revoke object URL when it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setSelectedFile(file);
    setCompressedFiles(null);
    setCompressionProgress(0);
    setCompressionError(null);
  };

  /**
   * Compresses the currently selected image.
   * Merges the hook-level `compressionOptions` with any call-site overrides.
   */
  const compressSelectedImage = async (
    overrideOptions?: ImageCompressionOptions,
  ): Promise<void> => {
    if (!selectedFile || isCompressing) return;

    setIsCompressing(true);
    setCompressionProgress(0);
    setCompressionError(null);

    const mergedOptions: ImageCompressionOptions = {
      ...options?.compressionOptions,
      ...overrideOptions,
    };

    try {
      const output = await compressImage(
        selectedFile,
        mergedOptions,
        (progress) => {
          setCompressionProgress(progress);
        },
      );
      setCompressedFiles(output);
    } catch (error) {
      console.error("Image compression error:", error);
      setCompressedFiles(null);
      setCompressionError(
        error instanceof Error ? error.message : "Compression failed.",
      );
    } finally {
      setIsCompressing(false);
    }
  };

  /**
   * Triggers a browser download for the compressed file in the given format.
   */
  const downloadFile = (format: string): void => {
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

  /** Returns the list of available compressed formats after a successful compression. */
  const getAvailableFormats = (): string[] => {
    if (!compressedFiles) return [];
    return Object.keys(compressedFiles);
  };

  /** Clears the selected file, preview URL and all compression state. */
  const clearSelection = (): void => {
    setSelectedFile(null);
    setCompressedFiles(null);
    setCompressionProgress(0);
    setCompressionError(null);
  };

  return {
    selectedFile,
    previewUrl,
    compressedFiles,
    isCompressing,
    compressionProgress,
    compressionError,
    onFileSelect,
    compressSelectedImage,
    downloadFile,
    getAvailableFormats,
    clearSelection,
  };
}
