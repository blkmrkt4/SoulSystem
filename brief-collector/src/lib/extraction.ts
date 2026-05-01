import type { AdminSettings, ExtractionResult, ExtractedColor, ExtractedFont } from './types';

export async function runExtraction(
  file: File | Blob,
  fileName: string,
  fileId: string,
  slug: string,
  settings: AdminSettings
): Promise<ExtractionResult> {
  const slugConfig = settings.extractionSlugs.find((s) => s.slug === slug);
  if (!slugConfig || !slugConfig.enabled) {
    return {
      slug,
      sourceFileId: fileId,
      sourceFileName: fileName,
      status: 'error',
      error: `Extraction slug "${slug}" not found or disabled`,
    };
  }

  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('slug', slug);
  formData.append('prompt', slugConfig.prompt);

  try {
    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        slug,
        sourceFileId: fileId,
        sourceFileName: fileName,
        status: 'error',
        error: data.error || `HTTP ${response.status}`,
        raw: JSON.stringify(data),
      };
    }

    const result: ExtractionResult = {
      slug,
      sourceFileId: fileId,
      sourceFileName: fileName,
      status: 'done',
      raw: data.raw,
      extractedAt: Date.now(),
    };

    if (slug === 'color-extraction' && Array.isArray(data.parsed)) {
      result.colors = data.parsed as ExtractedColor[];
    } else if (slug === 'font-identification' && Array.isArray(data.parsed)) {
      result.fonts = data.parsed as ExtractedFont[];
    } else if (data.parsed === null) {
      result.status = 'error';
      result.error = 'Could not parse model response as JSON';
    }

    return result;
  } catch (err) {
    return {
      slug,
      sourceFileId: fileId,
      sourceFileName: fileName,
      status: 'error',
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/** Get all extracted colors across all results, deduped by hex */
export function getAllExtractedColors(results: ExtractionResult[]): ExtractedColor[] {
  const seen = new Set<string>();
  const colors: ExtractedColor[] = [];
  for (const r of results) {
    if (r.status !== 'done' || !r.colors) continue;
    for (const c of r.colors) {
      const hex = c.hex.toUpperCase();
      if (!seen.has(hex)) {
        seen.add(hex);
        colors.push({ ...c, hex });
      }
    }
  }
  return colors;
}

/** Get all extracted fonts across all results, deduped by name */
export function getAllExtractedFonts(results: ExtractionResult[]): ExtractedFont[] {
  const seen = new Set<string>();
  const fonts: ExtractedFont[] = [];
  for (const r of results) {
    if (r.status !== 'done' || !r.fonts) continue;
    for (const f of r.fonts) {
      const key = f.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        fonts.push(f);
      }
    }
  }
  return fonts.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}
