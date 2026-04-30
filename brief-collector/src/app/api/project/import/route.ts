import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { parseBundleText } from '@/lib/bundle-parser';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, bundleText } = body;

    if (!projectName || !bundleText) {
      return NextResponse.json(
        { error: 'Missing projectName or bundleText' },
        { status: 400 }
      );
    }

    const slug = toSlug(projectName);
    const baseDir = join(homedir(), 'Documents', 'SoulSystem', slug);
    const outDir = join(baseDir, 'out');

    await mkdir(outDir, { recursive: true });

    const parsed = parseBundleText(bundleText);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: 'No files found in the pasted text. Expected <!-- File: /design/<name> --> markers.' },
        { status: 400 }
      );
    }

    const writtenFiles: string[] = [];
    for (const file of parsed) {
      await writeFile(join(outDir, file.filename), file.content, 'utf-8');
      writtenFiles.push(file.filename);
    }

    return NextResponse.json({
      path: outDir,
      baseDir,
      files: writtenFiles,
      count: writtenFiles.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[project/import]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
