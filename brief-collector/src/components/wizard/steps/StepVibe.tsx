'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/lib/context';
import { StepSection, SubStep } from '@/components/ui/StepSection';
import { ChoiceCard } from '@/components/ui/ChoiceCard';

const VIBES = [
  {
    value: 'quiet',
    name: 'Quiet & considered',
    description: 'Calm surfaces, refined sans-serif type, generous whitespace. Lets content breathe.',
    className: 'vibe-quiet',
    heading: 'A quiet system that scales.',
    body: 'Calm canvas, refined sans, generous whitespace.',
    cta: 'Get started',
  },
  {
    value: 'technical',
    name: 'Modern technical',
    description: 'Near-black canvas, sharp grotesque sans, mono accents. Built for power users.',
    className: 'vibe-technical',
    heading: 'Built for builders.',
    body: '// near-black canvas, sharp grotesque sans',
    cta: '$ run',
  },
  {
    value: 'editorial',
    name: 'Warm editorial',
    description: 'Earthy neutrals, considered serif display, warm undertones. Story-driven.',
    className: 'vibe-editorial',
    heading: 'Slow craft, considered.',
    body: 'Earthy neutrals and a serif display set the tone.',
    cta: 'Read on \u2192',
  },
  {
    value: 'bold',
    name: 'Bold & graphic',
    description: 'High-contrast type, saturated accent colour, decisive layout blocks.',
    className: 'vibe-bold',
    heading: 'No half-measures.',
    body: 'High-contrast type, saturated accent, decisive blocks.',
    cta: "Let\u2019s go",
  },
  {
    value: 'playful',
    name: 'Playful & friendly',
    description: 'Soft pastels, rounded shapes, expressive type. Approachable and fun.',
    className: 'vibe-playful',
    heading: 'Hello, friend!',
    body: 'Soft pastels, rounded shapes, expressive type.',
    cta: 'Say hi',
  },
  {
    value: 'luxurious',
    name: 'Luxurious & refined',
    description: 'Deep neutrals, restrained accent, fine type. Considered restraint throughout.',
    className: 'vibe-luxe',
    heading: 'A studied restraint.',
    body: 'Deep neutrals, restrained accent, fine type.',
    cta: 'Explore',
  },
];

const VIBE_DERIVE_PROMPT = `You are a design vibe analyst. Look at this image (a screenshot of a website, app, or product) and determine which single vibe category best matches it.

The categories are:
- quiet: calm, minimal, off-white canvas, refined sans, generous whitespace
- technical: near-black canvas, sharp grotesque sans, mono accents, high-contrast, precise
- editorial: earthy neutrals, serif display, magazine-like rhythm, warm undertones
- bold: saturated accent, strong type contrast, decisive blocks, sharp corners
- playful: soft pastels, rounded shapes, expressive type, bouncy, approachable
- luxurious: deep neutrals, restrained accent, fine type, slow, considered restraint

Return ONLY a JSON object with:
- "vibe": one of the six category names above
- "confidence": 0.0 to 1.0
- "reasoning": one sentence explaining why

Example: {"vibe":"technical","confidence":0.85,"reasoning":"Dark canvas with monospace accents and sharp geometric layout reads as developer tooling."}`;

export default function StepVibe() {
  const { state, updateWizard } = useApp();
  const vibe = state.wizardState.vibe;

  const [deriveStatus, setDeriveStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [deriveResult, setDeriveResult] = useState<{ vibe: string; confidence: number; reasoning: string } | null>(null);
  const [deriveError, setDeriveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState('');

  const handleDeriveFromImage = async (file: File) => {
    setDeriveStatus('loading');
    setDeriveError(null);
    setDeriveResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('slug', 'vibe-derive');
      formData.append('prompt', VIBE_DERIVE_PROMPT);

      const res = await fetch('/api/extract', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      if (data.parsed && typeof data.parsed === 'object' && 'vibe' in data.parsed) {
        const result = data.parsed as { vibe: string; confidence: number; reasoning: string };
        setDeriveResult(result);
        // Auto-select the derived vibe
        if (VIBES.some((v) => v.value === result.vibe)) {
          updateWizard('vibe', result.vibe);
        }
        setDeriveStatus('done');
      } else {
        throw new Error('Could not parse vibe from model response');
      }
    } catch (err) {
      setDeriveError(err instanceof Error ? err.message : 'Failed to derive vibe');
      setDeriveStatus('error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleDeriveFromImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeriveFromUrl = async () => {
    if (!urlInput.trim()) return;
    setDeriveStatus('loading');
    setDeriveError(null);
    setDeriveResult(null);
    try {
      // Step 1: Take a screenshot of the URL
      const screenshotRes = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const screenshotData = await screenshotRes.json();
      if (!screenshotRes.ok) throw new Error(screenshotData.error || 'Screenshot failed');

      // Step 2: Convert data URL to a File blob for the extract API
      const response = await fetch(screenshotData.screenshot);
      const blob = await response.blob();
      const file = new File([blob], 'screenshot.png', { type: 'image/png' });

      // Step 3: Run vibe analysis on the screenshot
      await handleDeriveFromImage(file);
    } catch (err) {
      setDeriveError(err instanceof Error ? err.message : 'Failed to capture URL');
      setDeriveStatus('error');
    }
  };

  return (
    <StepSection
      id="step-vibe"
      stepNumber={2}
      totalSteps={13}
      label="Vibe"
      title="What vibe fits the product?"
      help="Pick manually, or let the system derive it from an existing product screenshot."
    >
      {/* Derive from image */}
      <SubStep
        title="Derive the vibe"
        help="Upload a screenshot or enter a URL. The system will capture the page, analyse its visual design, and suggest the closest vibe."
      >
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={deriveStatus === 'loading'}
            className="h-9 px-4 text-sm font-medium rounded-lg border border-border-strong bg-surface text-text hover:bg-surface-alt transition-colors disabled:opacity-50"
          >
            {deriveStatus === 'loading' ? 'Analysing...' : 'Upload screenshot'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="text-xs text-text-subtle">or enter a URL:</span>
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDeriveFromUrl()}
            placeholder="https://linear.app"
            className="flex-1 min-w-[200px] h-9 px-3 bg-surface border border-border-strong rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
          />
          <button
            onClick={handleDeriveFromUrl}
            disabled={deriveStatus === 'loading' || !urlInput.trim()}
            className="h-9 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            Analyse
          </button>
        </div>

        {deriveStatus === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-text-muted mt-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Analysing image to determine vibe...
          </div>
        )}

        {deriveResult && (
          <div className="mt-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
            <strong>Derived vibe: {deriveResult.vibe}</strong>
            <span className="ml-2 text-xs">({Math.round(deriveResult.confidence * 100)}% confidence)</span>
            <p className="m-0 mt-1 text-xs text-emerald-600">{deriveResult.reasoning}</p>
          </div>
        )}

        {deriveError && (
          <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {deriveError}
          </div>
        )}
      </SubStep>

      {/* Manual selection */}
      <SubStep
        title="Or pick manually"
        help="Choose the overall aesthetic direction."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VIBES.map((v) => (
            <ChoiceCard
              key={v.value}
              selected={vibe === v.value}
              onClick={() => updateWizard('vibe', v.value)}
              previewHeight="tall"
              preview={
                <div className={v.className}>
                  <h4>{v.heading}</h4>
                  <p>{v.body}</p>
                  <span>{v.cta}</span>
                </div>
              }
              name={v.name}
              description={v.description}
            />
          ))}
        </div>
      </SubStep>
    </StepSection>
  );
}
