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
    const definitionStr = formData.get('definition') as string | null;

    if (!definitionStr) {
      return NextResponse.json({ error: 'Missing definition' }, { status: 400 });
    }

    const definition = JSON.parse(definitionStr);
    const projectName = definition.state?.project?.name;
    if (!projectName) {
      return NextResponse.json({ error: 'Missing project name in definition' }, { status: 400 });
    }

    const slug = toSlug(projectName);
    const baseDir = join(homedir(), 'Documents', 'SoulSystem', slug);
    const uploadsDir = join(baseDir, 'uploads');

    await mkdir(uploadsDir, { recursive: true });

    // Write the design definition
    await writeFile(
      join(baseDir, 'design-definition.json'),
      JSON.stringify(definition, null, 2),
      'utf-8'
    );

    // Write uploaded files
    let uploadCount = 0;
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file:') && value instanceof File) {
        const diskFilename = key.slice(5); // strip "file:" prefix
        const bytes = await value.arrayBuffer();
        await writeFile(join(uploadsDir, diskFilename), Buffer.from(bytes));
        uploadCount++;
      }
    }

    return NextResponse.json({
      slug,
      path: baseDir,
      uploadCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[project/save]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
