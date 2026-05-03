import { FFmpeg } from "@ffmpeg/ffmpeg";
import { DEFAULT_FFMPEG_BASE_URL } from "./constants";
import type { FFmpegAssetUrls } from "./types";

let _ffmpegBaseUrl = DEFAULT_FFMPEG_BASE_URL;
let _ffmpegAssetUrls: FFmpegAssetUrls | null = null;
const ffmpeg = new FFmpeg();
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

/**
 * Sets the FFmpeg base URL for assets.
 */
export function setFFmpegBaseUrl(baseUrl: string): void {
  _ffmpegBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  _ffmpegAssetUrls = null;
}

/**
 * Sets explicit FFmpeg asset URLs.
 */
export function setFFmpegAssetUrls(urls: FFmpegAssetUrls): void {
  _ffmpegAssetUrls = urls;
}

/**
 * Gets the current FFmpeg base URL.
 */
export function getFFmpegBaseUrl(): string {
  return _ffmpegBaseUrl;
}

/**
 * Gets explicitly configured FFmpeg asset URLs, if any.
 */
export function getFFmpegAssetUrls(): FFmpegAssetUrls | null {
  return _ffmpegAssetUrls;
}

/**
 * Gets the FFmpeg instance.
 */
export function getFFmpegInstance(): FFmpeg {
  return ffmpeg;
}

/**
 * Ensures FFmpeg is loaded and ready for use.
 */
export async function ensureFfmpegLoaded(): Promise<FFmpeg> {
  if (!ffmpegLoadPromise) {
    ffmpeg.on("log", ({ type, message }) => {
      console.log(`[FFmpeg ${type}] ${message}`);
    });
    ffmpegLoadPromise = initializeFFmpeg();
  }

  return ffmpegLoadPromise;
}

/**
 * Initializes and loads FFmpeg assets.
 */
async function initializeFFmpeg(): Promise<FFmpeg> {
  try {
    const { coreURL, wasmURL } = resolveFFmpegAssetUrls();

    await ffmpeg.load({
      coreURL,
      wasmURL,
    });

    return ffmpeg;
  } catch (error) {
    ffmpegLoadPromise = null;
    throw new Error(
      `Failed to load FFmpeg from "${_ffmpegBaseUrl}". ` +
        "Ensure assets are served and configureVideoUtils() is called at startup. " +
        "If running in SSR/hybrid environments, pass absolute ffmpegAssetUrls.",
      { cause: error },
    );
  }
}

function resolveFFmpegAssetUrls(): FFmpegAssetUrls {
  if (_ffmpegAssetUrls) {
    return {
      coreURL: resolveRuntimeUrl(_ffmpegAssetUrls.coreURL),
      wasmURL: resolveRuntimeUrl(_ffmpegAssetUrls.wasmURL),
    };
  }

  const baseUrl = resolveRuntimeUrl(_ffmpegBaseUrl);
  return {
    coreURL: `${baseUrl}ffmpeg-core.js`,
    wasmURL: `${baseUrl}ffmpeg-core.wasm`,
  };
}

function resolveRuntimeUrl(value: string): string {
  const browserHref = getBrowserHref();

  if (browserHref) {
    return new URL(value, browserHref).toString();
  }

  if (isAbsoluteUrl(value)) {
    return value;
  }

  throw new Error(
    `Cannot resolve relative FFmpeg URL "${value}" outside a browser runtime. ` +
      "Use configureVideoUtils({ ffmpegAssetUrls: { coreURL, wasmURL } }) with absolute URLs.",
  );
}

function getBrowserHref(): string | null {
  const candidate = (globalThis as { location?: { href?: string } }).location
    ?.href;
  return typeof candidate === "string" ? candidate : null;
}

function isAbsoluteUrl(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url) || url.startsWith("//");
}

/**
 * Resets FFmpeg instance (useful for testing).
 */
export function resetFFmpeg(): void {
  ffmpegLoadPromise = null;
}

/**
 * Creates and loads a fresh, isolated FFmpeg instance.
 * Use this when running multiple concurrent compressions to avoid
 * shared virtual-filesystem conflicts between tasks.
 */
export async function createIsolatedFFmpegInstance(): Promise<FFmpeg> {
  const instance = new FFmpeg();

  instance.on("log", ({ type, message }) => {
    console.log(`[FFmpeg ${type}] ${message}`);
  });

  try {
    const { coreURL, wasmURL } = resolveFFmpegAssetUrls();

    await instance.load({
      coreURL,
      wasmURL,
    });

    return instance;
  } catch (error) {
    throw new Error(
      `Failed to load isolated FFmpeg instance from "${_ffmpegBaseUrl}".`,
      { cause: error },
    );
  }
}
