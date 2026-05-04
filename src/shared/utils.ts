/**
 * Returns the base filename without its extension.
 * Dotfiles (e.g. ".gitignore") are returned unchanged.
 */
export function getBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}
