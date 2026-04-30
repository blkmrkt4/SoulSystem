export interface ParsedFile {
  filename: string;
  content: string;
}

/**
 * Parse Claude Desktop's output into individual files.
 * Splits on <!-- File: /design/<name> --> markers.
 * Strips surrounding markdown code fences from each file's content.
 */
export function parseBundleText(text: string): ParsedFile[] {
  const files: ParsedFile[] = [];

  // Match <!-- File: /design/SOMETHING --> or <!-- File: SOMETHING -->
  const markerRegex = /<!--\s*File:\s*(?:\/design\/)?([\w./-]+)\s*-->/gi;
  const markers: { filename: string; index: number }[] = [];

  let match;
  while ((match = markerRegex.exec(text)) !== null) {
    markers.push({
      filename: match[1],
      index: match.index + match[0].length,
    });
  }

  if (markers.length === 0) return files;

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index - (text.slice(0, markers[i + 1].index).lastIndexOf('<!--') - markers[i].index > 0 ? text.slice(start, markers[i + 1].index).lastIndexOf('<!--') : 0) : text.length;

    // Get the raw content between this marker and the next
    const nextMarkerStart = i + 1 < markers.length
      ? text.lastIndexOf('<!--', markers[i + 1].index)
      : text.length;
    let raw = text.slice(start, nextMarkerStart).trim();

    // Strip outer markdown code fence if present
    // Pattern: ```language\n...\n```
    raw = stripCodeFence(raw);

    if (raw) {
      files.push({
        filename: markers[i].filename,
        content: raw,
      });
    }
  }

  return files;
}

function stripCodeFence(text: string): string {
  // Match opening fence: ```optional-language
  const openFence = /^```[\w]*\s*\n?/;
  // Match closing fence: ```
  const closeFence = /\n?```\s*$/;

  if (openFence.test(text) && closeFence.test(text)) {
    return text.replace(openFence, '').replace(closeFence, '').trim();
  }

  return text;
}
