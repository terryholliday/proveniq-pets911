/**
 * Text Utilities
 * Normalization and sanitization for consistent text processing
 */

export function normalizeText(input: string): string {
  if (!input) return '';

  return input
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function clampScanText(input: string, maxLength = 8000): string {
  if (!input) return '';
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength);
}

export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function containsPhrase(text: string, phrase: string): boolean {
  return normalizeText(text).includes(normalizeText(phrase));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated + '...';
}
