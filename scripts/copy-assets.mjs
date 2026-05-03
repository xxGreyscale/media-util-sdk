#!/usr/bin/env node
/**
 * Copies ffmpeg-core.js and ffmpeg-core.wasm from node_modules into a target
 * directory so they can be served as static assets.
 *
 * Usage:
 *   node scripts/copy-assets.mjs [outDir]
 *
 * Defaults outDir to "public/ffmpeg" relative to cwd (typical Vite layout).
 */

import { copyFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const outDir = resolve(process.cwd(), process.argv[2] ?? "public/ffmpeg");

async function main() {
  await mkdir(outDir, { recursive: true });

  const coreJs = require.resolve("@ffmpeg/core");
  const coreWasm = require.resolve("@ffmpeg/core/wasm");

  const targets = [
    { src: coreJs, file: "ffmpeg-core.js" },
    { src: coreWasm, file: "ffmpeg-core.wasm" },
  ];

  for (const target of targets) {
    const dest = join(outDir, target.file);
    await copyFile(target.src, dest);
    console.log(`Copied ${target.file} -> ${dest}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
