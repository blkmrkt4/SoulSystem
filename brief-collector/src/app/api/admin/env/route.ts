import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env.local');

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.OPENROUTER_API_KEY,
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || '',
    envPath: ENV_PATH,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, model } = await request.json();

    let content = '';
    try {
      content = await readFile(ENV_PATH, 'utf-8');
    } catch {
      // File doesn't exist yet — will be created.
    }

    content = upsertEnvVar(content, 'OPENROUTER_API_KEY', apiKey || '');
    content = upsertEnvVar(content, 'OPENROUTER_MODEL', model || '');

    await writeFile(ENV_PATH, content, 'utf-8');

    // Mutate process.env so the next request in this process sees the new value
    // even if the dev-server restart triggered by writing .env.local hasn't
    // completed yet.
    if (typeof apiKey === 'string') process.env.OPENROUTER_API_KEY = apiKey;
    if (typeof model === 'string') process.env.OPENROUTER_MODEL = model;

    console.log(
      `[admin/env] wrote ${ENV_PATH} (apiKey=${apiKey ? apiKey.slice(0, 12) + '…' : 'empty'}, model=${model || 'empty'})`
    );

    return NextResponse.json({ ok: true, envPath: ENV_PATH });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[admin/env] save failed:', message);
    return NextResponse.json({ error: message, envPath: ENV_PATH }, { status: 500 });
  }
}

function upsertEnvVar(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(content)) {
    return content.replace(regex, line);
  }
  // Add with a comment header if the file is empty
  if (!content.trim()) {
    return `# Brief Collector — auto-managed by admin settings\n${line}\n`;
  }
  return content.trimEnd() + '\n' + line + '\n';
}
