import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const COLOR_PROMPT = `You are a colour extraction specialist. Analyse this screenshot of a website and extract the key colours used in its design.

Return a JSON array of colour objects. Each object must have:
- "hex": the hex colour code (e.g. "#2B6CB0")
- "name": a short human-readable name (e.g. "slate blue", "warm cream")
- "role": one of "primary", "accent", "secondary", "background", "muted", "highlight", or "neutral"

Return ONLY the JSON array, no explanation.`;

const COMPONENT_PROMPT = `You are a UI component analyst. Analyse this screenshot of a component library page.

Return a JSON object with:
- "name": the component name as displayed on the page
- "description": a one-line description of what this component does
- "tags": an array of 2-5 relevant tags (e.g. ["animation", "cards", "hover"])

Return ONLY the JSON object, no explanation.`;

export async function POST(request: NextRequest) {
  let browser;
  try {
    const { url, mode } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'qwen/qwen2.5-vl-72b-instruct';

    if (!apiKey) {
      return NextResponse.json(
        { error: 'No API key configured — set OPENROUTER_API_KEY in .env.local or /admin' },
        { status: 400 }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log(`[analyse-url] Capturing ${parsedUrl.href} (mode=${mode})`);

    // Step 1: Screenshot
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(parsedUrl.href, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));

    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    await browser.close();
    browser = undefined;

    const base64 = Buffer.from(screenshot).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    // Step 2: Send to LLM
    const prompt = mode === 'component' ? COMPONENT_PROMPT : COLOR_PROMPT;

    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Brief Collector',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error(`[analyse-url] LLM error ${llmResponse.status}:`, errorText.slice(0, 500));
      return NextResponse.json(
        { error: `LLM error ${llmResponse.status}: ${errorText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const llmData = await llmResponse.json();
    const content = llmData.choices?.[0]?.message?.content || '';

    let parsed: unknown = null;
    try {
      const cleaned = content
        .replace(/^```(?:json)?\s*/m, '')
        .replace(/\s*```\s*$/m, '')
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = null;
    }

    console.log(`[analyse-url] Success: ${parsedUrl.href} → ${content.length} chars`);

    return NextResponse.json({
      url: parsedUrl.href,
      screenshot: dataUrl,
      parsed,
      raw: content,
    });
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    const message = err instanceof Error ? err.message : 'Analysis failed';
    console.error('[analyse-url]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
