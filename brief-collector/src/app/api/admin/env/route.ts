import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env.local');

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.OPENROUTER_API_KEY,
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || '',
  });
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey, model } = await request.json();

    // Read existing .env.local or start fresh
    let content = '';
    try {
      content = await readFile(ENV_PATH, 'utf-8');
    } catch {
      // File doesn't exist yet
    }

    // Update or add each key
    content = upsertEnvVar(content, 'OPENROUTER_API_KEY', apiKey || '');
    content = upsertEnvVar(content, 'OPENROUTER_MODEL', model || '');

    await writeFile(ENV_PATH, content, 'utf-8');

    // Update process.env so the current server session picks it up immediately
    if (apiKey) process.env.OPENROUTER_API_KEY = apiKey;
    if (model) process.env.OPENROUTER_MODEL = model;

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
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
