import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const projectName = formData.get('projectName') as string | null;
    const prompt = formData.get('prompt') as string | null;
    const briefJson = formData.get('briefJson') as string | null;

    if (!projectName || !prompt) {
      return NextResponse.json(
        { error: 'Missing projectName or prompt' },
        { status: 400 }
      );
    }

    const slug = toSlug(projectName);
    const baseDir = join(homedir(), 'Documents', 'SoulSystem', slug);
    const inDir = join(baseDir, 'in');

    await mkdir(inDir, { recursive: true });

    // Write the prompt
    await writeFile(join(inDir, 'brief.md'), prompt, 'utf-8');

    // Write the JSON export
    if (briefJson) {
      await writeFile(join(inDir, 'brief.json'), briefJson, 'utf-8');
    }

    // Write any uploaded files that need visual analysis
    let fileCount = 0;
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file:') && value instanceof File) {
        const bytes = await value.arrayBuffer();
        await writeFile(join(inDir, value.name), Buffer.from(bytes));
        fileCount++;
      }
    }

    return NextResponse.json({
      path: inDir,
      baseDir,
      fileCount,
      slug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[project/export]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
