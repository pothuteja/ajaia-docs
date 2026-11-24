import { marked } from 'marked';

export const ALLOWED_EXTENSIONS = ['.txt', '.md'] as const;
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx).toLowerCase();
}

export function isSupportedFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
}

export function stripExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? filename : filename.slice(0, idx);
}

/**
 * Converts uploaded .txt or .md content into HTML for the rich-text editor.
 */
export function parseUploadedFileContent(filename: string, rawText: string): string {
  const ext = getFileExtension(filename);

  if (ext === '.md') {
    return marked.parse(rawText, { async: false }) as string;
  }

  // For .txt files, escape HTML characters and wrap each line in a <p> tag
  const escaped = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split(/\r?\n/);
  return lines
    .map((line) => (line.trim() === '' ? '<p></p>' : `<p>${line}</p>`))
    .join('');
}