import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  let browser;
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log(`[screenshot] Capturing ${parsedUrl.href}`);

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set a reasonable viewport — desktop-sized for design analysis
    await page.setViewport({ width: 1440, height: 900 });

    // Navigate with a timeout
    await page.goto(parsedUrl.href, {
      waitUntil: 'networkidle2',
      timeout: 20000,
    });

    // Wait a moment for any animations/transitions to settle
    await new Promise((r) => setTimeout(r, 1500));

    // Take a full-page screenshot (capped at a reasonable height)
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false, // Just the viewport — full page can be enormous
    });

    await browser.close();
    browser = undefined;

    // Return as base64 data URL
    const base64 = Buffer.from(screenshot).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    console.log(`[screenshot] Captured ${parsedUrl.href} — ${Math.round(base64.length / 1024)}KB`);

    return NextResponse.json({
      url: parsedUrl.href,
      screenshot: dataUrl,
      width: 1440,
      height: 900,
    });
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    const message = err instanceof Error ? err.message : 'Screenshot failed';
    console.error('[screenshot]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
