import type { Detector, Match } from '../core/types.js';

// Practical, not full RFC 5322: what people actually write in running text.
// Local part: letters, digits and . _ % + - (no leading, trailing or double dot).
// Domain: labels of letters, digits and hyphens (not at the edges), TLD of 2+ letters.
const LOCAL = String.raw`[A-Za-z0-9_%+-]+(?:\.[A-Za-z0-9_%+-]+)*`;
const LABEL = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?';
const EMAIL = new RegExp(
  String.raw`(?<![A-Za-z0-9._%+-])${LOCAL}@(?:${LABEL}\.)+[A-Za-z]{2,63}(?![A-Za-z0-9-]|\.[A-Za-z0-9])`,
  'g',
);

// "logo@2x.png" has the shape of an address, but the "TLD" is a file extension.
// Only extensions that are not real TLDs belong here (no .zip, .mov, .md: those are real TLDs).
const FILE_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'bmp',
  'ico',
  'tif',
  'tiff',
  'heic',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'csv',
  'json',
  'xml',
  'html',
  'htm',
  'css',
  'js',
  'ts',
  'yml',
  'yaml',
  'log',
  'mp3',
  'mp4',
  'wav',
]);

// Pattern only, no checksum. The "@" plus a letter TLD is distinctive, but file names with an
// extension missing from the list below still slip through.
const SCORE = 0.8;

function hasFileExtension(value: string): boolean {
  return FILE_EXTENSIONS.has(value.slice(value.lastIndexOf('.') + 1).toLowerCase());
}

export const emailDetector: Detector = {
  type: 'EMAIL',
  find(text: string): Match[] {
    const matches: Match[] = [];
    for (const m of text.matchAll(EMAIL)) {
      const value = m[0];
      const local = value.slice(0, value.indexOf('@'));
      if (local.length > 64 || value.length > 254) continue;
      if (hasFileExtension(value)) continue;
      matches.push({
        type: 'EMAIL',
        start: m.index,
        end: m.index + value.length,
        value,
        score: SCORE,
      });
    }
    return matches;
  },
};
