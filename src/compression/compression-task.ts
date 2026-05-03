import { fetchFile } from "@ffmpeg/util";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import type {
  OutputFormat,
  VideoCompressionOptions,
  CompressedOutput,
} from "./types";
import { MIME_TYPES } from "./constants";
import { ensureFfmpegLoaded, getFFmpegInstance } from "./ffmpeg";
import { buildFFmpegCommand } from "./ffmpeg-args";
import { getBaseName } from "./utils";

/**
 * Encapsulates a single compression task with progress tracking.
 */
export class CompressionTask {
  private readonly inputFile: File;
  private readonly options: VideoCompressionOptions;
  private readonly progressCallback: ((progress: number) => void) | undefined;
  private readonly inputName: string;
  private readonly outputFileName: string;
  private readonly filesToCleanup: string[] = [];
  private passOffset = 0;

  constructor(
    inputFile: File,
    options: VideoCompressionOptions,
    progressCallback?: (progress: number) => void,
  ) {
    this.inputFile = inputFile;
    this.options = options;
    this.progressCallback = progressCallback;
    this.inputName = inputFile.name;
    this.outputFileName =
      options.outputFileName || `${getBaseName(inputFile.name)}-compressed`;
  }

  async execute(ffmpegOverride?: FFmpeg): Promise<CompressedOutput> {
    const instance = ffmpegOverride ?? (await ensureFfmpegLoaded());
    const results: CompressedOutput = {};
    const progressHandler = this.createProgressHandler();

    instance.on("progress", progressHandler);

    try {
      await this.uploadInputFile(instance);
      await this.processAllFormats(instance, results);
      this.progressCallback?.(100);
      return results;
    } finally {
      instance.off("progress", progressHandler);
      await this.cleanup(instance);
    }
  }

  private async uploadInputFile(instance: FFmpeg): Promise<void> {
    const fileData = await fetchFile(this.inputFile);
    await instance.writeFile(this.inputName, fileData);
    this.filesToCleanup.push(this.inputName);
  }

  private async processAllFormats(
    instance: FFmpeg,
    results: CompressedOutput,
  ): Promise<void> {
    const formats = this.options.outputFormats || ["mp4"];
    const totalPasses = formats.length;
    const passScale = 100 / totalPasses;

    for (let i = 0; i < formats.length; i++) {
      this.passOffset = (i / totalPasses) * 100;

      const format = formats[i];
      const outputName = `${this.outputFileName}.${format}`;
      this.filesToCleanup.push(outputName);

      await this.encodeFormat(instance, format, outputName, results);
    }
  }

  private async encodeFormat(
    instance: FFmpeg,
    format: OutputFormat,
    outputName: string,
    results: CompressedOutput,
  ): Promise<void> {
    const args = buildFFmpegCommand(
      this.inputName,
      outputName,
      format,
      this.options,
    );

    const exitCode = await instance.exec(args);

    if (exitCode !== 0) {
      throw new Error(
        `FFmpeg encoding failed for format "${format}" (exit code ${exitCode}).`,
      );
    }

    const fileData = (await instance.readFile(outputName)) as Uint8Array;
    results[format] = new File([fileData.slice()], outputName, {
      type: MIME_TYPES[format] || `application/${format}`,
      lastModified: Date.now(),
    });
  }

  private createProgressHandler(): (event: { progress: number }) => void {
    const passScale = 100 / (this.options.outputFormats?.length || 1);

    return ({ progress }: { progress: number }) => {
      if (this.progressCallback) {
        const clamped = Math.min(1, Math.max(0, progress));
        this.progressCallback(
          Math.round(this.passOffset + clamped * passScale),
        );
      }
    };
  }

  private async cleanup(instance: FFmpeg): Promise<void> {
    for (const fileName of this.filesToCleanup) {
      try {
        await instance.deleteFile(fileName);
      } catch {
        /* ignore */
      }
    }
  }
}
