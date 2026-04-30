import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { getAllDiskFilenames } from '@/lib/design-definition';
import type { DesignDefinition } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    const safeSlug = slug.replace(/[^a-z0-9-]/gi, '');
    if (!safeSlug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const baseDir = join(homedir(), 'Documents', 'SoulSystem', safeSlug);

    // Try new format first (design-definition.json)
    const defPath = join(baseDir, 'design-definition.json');
    try {
      const raw = await readFile(defPath, 'utf-8');
      const definition: DesignDefinition = JSON.parse(raw);

      // Read all referenced upload files as base64
      const filenames = getAllDiskFilenames(definition);
      const uploadsDir = join(baseDir, 'uploads');
      const files: Record<string, string> = {};

      for (const diskFilename of filenames) {
        try {
          const filePath = join(uploadsDir, diskFilename);
          const buffer = await readFile(filePath);
          // Determine MIME type from the definition's file refs
          const allRefs = [
            ...definition.state.inspiration.files,
            ...definition.state.inspiration.fonts,
            ...definition.state.inspiration.swatches,
          ];
          const ref = allRefs.find((r) => r.diskFilename === diskFilename);
          const mimeType = ref?.type || 'application/octet-stream';
          files[diskFilename] = `data:${mimeType};base64,${buffer.toString('base64')}`;
        } catch {
          // File missing on disk — skip, blob will be empty on deserialize
        }
      }

      return NextResponse.json({
        format: 'design-definition',
        definition,
        files,
      });
    } catch {
      // design-definition.json not found, try legacy format
    }

    // Fall back to legacy in/brief.json
    const legacyPath = join(baseDir, 'in', 'brief.json');
    try {
      const raw = await readFile(legacyPath, 'utf-8');
      const data = JSON.parse(raw);
      return NextResponse.json({
        format: 'legacy',
        ...data,
      });
    } catch {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
