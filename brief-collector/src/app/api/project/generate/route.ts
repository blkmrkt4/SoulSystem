import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled';
}

function toSafeFilename(name: string): string {
  // Preserve casing but strip filesystem-unsafe characters
  return name.replace(/[<>:"/\\|?*]/g, '').trim() || 'Untitled';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug: providedSlug, prompt, projectName } = body;

    if (!prompt || !projectName) {
      return NextResponse.json(
        { error: 'Missing prompt or projectName' },
        { status: 400 }
      );
    }

    const slug = providedSlug || toSlug(projectName);
    const baseDir = join(homedir(), 'Documents', 'SoulSystem', slug);
    const defPath = join(baseDir, 'design-definition.json');

    // Read current definition to get/increment version
    let version = 1;
    try {
      const raw = await readFile(defPath, 'utf-8');
      const definition = JSON.parse(raw);
      version = (definition.version || 0) + 1;

      // Update the version in the definition
      definition.version = version;
      await writeFile(defPath, JSON.stringify(definition, null, 2), 'utf-8');
    } catch {
      // No definition file yet — version stays at 1
    }

    // Write the versioned prompt file
    const safeName = toSafeFilename(projectName);
    const filename = `${safeName}-GenerationPrompt-${version}.md`;
    await writeFile(join(baseDir, filename), prompt, 'utf-8');

    return NextResponse.json({
      version,
      filename,
      path: join(baseDir, filename),
      slug,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[project/generate]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
