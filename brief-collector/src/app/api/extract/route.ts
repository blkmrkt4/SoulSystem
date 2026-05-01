import { NextRequest, NextResponse } from 'next/server';
import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const LOG_DIR = join(homedir(), 'Documents', 'SoulSystem', '.logs');

async function log(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const line = data
    ? `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n\n`
    : `[${timestamp}] ${message}\n\n`;

  console.log(`[extract] ${message}`, data || '');

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(join(LOG_DIR, 'extract.log'), line, 'utf-8');
  } catch {
    // Don't fail the request if logging fails
  }
}

export async function POST(request: NextRequest) {
  await log('Route hit');
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const slug = formData.get('slug') as string | null;
    const apiKey = process.env.OPENROUTER_API_KEY || null;
    const model = process.env.OPENROUTER_MODEL || null;
    const prompt = formData.get('prompt') as string | null;

    await log('Params received', {
      slug,
      model,
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.slice(0, 12) + '...' : null,
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      promptLength: prompt?.length,
    });

    if (!file || !slug || !apiKey || !model || !prompt) {
      const missing = {
        file: !file,
        slug: !slug,
        apiKey: !apiKey,
        model: !model,
        prompt: !prompt,
      };
      await log('Missing required fields', missing);
      const error = !apiKey || !model
        ? 'OPENROUTER_API_KEY / OPENROUTER_MODEL not set in .env.local — open /admin to configure'
        : 'Missing required fields: file, slug, prompt';
      return NextResponse.json({ error, missing }, { status: 400 });
    }

    // Convert file to base64 for vision API
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    };

    await log('Calling OpenRouter', {
      model,
      url: 'https://openrouter.ai/api/v1/chat/completions',
      imageSize: `${Math.round(base64.length / 1024)}KB base64`,
      mimeType,
    });

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Brief Collector',
      },
      body: JSON.stringify(requestBody),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      await log(`OpenRouter ERROR ${openRouterResponse.status}`, {
        status: openRouterResponse.status,
        statusText: openRouterResponse.statusText,
        model,
        response: errorText.slice(0, 2000),
      });
      return NextResponse.json(
        { error: `OpenRouter ${openRouterResponse.status}: ${errorText}` },
        { status: 502 }
      );
    }

    const data = await openRouterResponse.json();
    const content = data.choices?.[0]?.message?.content || '';

    await log('OpenRouter SUCCESS', {
      model: data.model,
      usage: data.usage,
      contentLength: content.length,
      contentPreview: content.slice(0, 500),
    });

    // Try to parse JSON from the response
    let parsed: unknown = null;
    try {
      const cleaned = content
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```\s*$/m, '')
        .trim();
      parsed = JSON.parse(cleaned);
      await log('JSON parsed successfully', { itemCount: Array.isArray(parsed) ? parsed.length : 'not array' });
    } catch (parseErr) {
      await log('JSON parse FAILED', {
        error: parseErr instanceof Error ? parseErr.message : 'unknown',
        rawContent: content.slice(0, 1000),
      });
      parsed = null;
    }

    return NextResponse.json({
      slug,
      raw: content,
      parsed,
      model: data.model,
      usage: data.usage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : undefined;
    await log('UNCAUGHT ERROR', { message, stack });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
