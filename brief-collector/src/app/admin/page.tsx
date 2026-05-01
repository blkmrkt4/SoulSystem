'use client';

import { useEffect, useState } from 'react';
import type { AdminSettings, ExtractionSlug } from '@/lib/types';
import { DEFAULT_ADMIN_SETTINGS } from '@/lib/types';
import { getAdminSettings, saveAdminSettings } from '@/lib/db';
import { ModelPicker } from '@/components/admin/ModelPicker';

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; envPath?: string }
  | { kind: 'error'; message: string };

export default function AdminPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [envPath, setEnvPath] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [dbSettings, envRes] = await Promise.all([
        getAdminSettings(),
        fetch('/api/admin/env').then((r) => r.json()).catch(() => ({})),
      ]);
      // .env.local is the source of truth for the API key and model — always override IndexedDB.
      dbSettings.openRouterApiKey = envRes.apiKey || '';
      if (envRes.model) dbSettings.model = envRes.model;
      if (envRes.envPath) setEnvPath(envRes.envPath);
      setSettings(dbSettings);
    }
    load();
  }, []);

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-text-muted">
        Loading...
      </div>
    );
  }

  const handleSave = async () => {
    setSaveState({ kind: 'saving' });
    try {
      // Write the API key + model to .env.local first. The route also mutates
      // process.env so the running server picks up the change immediately.
      const res = await fetch('/api/admin/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: settings.openRouterApiKey,
          model: settings.model,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Other admin settings (extraction prompts, etc.) still live in IndexedDB.
      await saveAdminSettings(settings);

      if (data.envPath) setEnvPath(data.envPath);
      setSaveState({ kind: 'saved', envPath: data.envPath });
      setTimeout(() => setSaveState({ kind: 'idle' }), 4000);
    } catch (err) {
      setSaveState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Save failed',
      });
    }
  };

  const updateSlug = (index: number, partial: Partial<ExtractionSlug>) => {
    const next = [...settings.extractionSlugs];
    next[index] = { ...next[index], ...partial };
    setSettings({ ...settings, extractionSlugs: next });
  };

  const addSlug = () => {
    setSettings({
      ...settings,
      extractionSlugs: [
        ...settings.extractionSlugs,
        {
          slug: `custom-${Date.now()}`,
          label: 'New extraction',
          prompt: '',
          enabled: true,
        },
      ],
    });
  };

  const removeSlug = (index: number) => {
    const next = settings.extractionSlugs.filter((_, i) => i !== index);
    setSettings({ ...settings, extractionSlugs: next });
  };

  const resetDefaults = () => {
    if (confirm('Reset all prompts to defaults? Your API key will be kept.')) {
      setSettings({
        ...DEFAULT_ADMIN_SETTINGS,
        openRouterApiKey: settings.openRouterApiKey,
      });
    }
  };

  const testConnection = async () => {
    if (!settings.openRouterApiKey) {
      setTestStatus('No API key set');
      return;
    }
    setTestStatus('Testing...');
    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${settings.openRouterApiKey}` },
      });
      if (res.ok) {
        setTestStatus('Connected successfully');
      } else {
        const text = await res.text();
        setTestStatus(`Error ${res.status}: ${text.slice(0, 100)}`);
      }
    } catch (err) {
      setTestStatus(`Network error: ${err instanceof Error ? err.message : 'unknown'}`);
    }
    setTimeout(() => setTestStatus(null), 4000);
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-14">
      <div className="mb-8">
        <a
          href="/"
          className="text-xs text-text-subtle hover:text-accent transition-colors mb-4 inline-block"
        >
          &larr; Back to Brief Collector
        </a>
        <h1
          className="text-4xl font-normal leading-tight tracking-tight m-0 mb-3"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Admin settings
        </h1>
        <p className="text-base text-text-muted max-w-[620px] m-0 leading-relaxed">
          Configure the AI extraction pipeline. Uploads in the wizard are sent to
          OpenRouter for colour and font analysis.
        </p>
      </div>

      {/* API Key */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text mb-1">OpenRouter API key</h2>
        <p className="text-sm text-text-muted mb-3">
          Get one at{' '}
          <span className="text-text-subtle" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            openrouter.ai/keys
          </span>
          . Saved to{' '}
          <span className="text-text-subtle" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            .env.local
          </span>
          {' '}on the server — applied immediately.
        </p>
        <div className="flex gap-2 max-w-lg">
          <input
            type="password"
            value={settings.openRouterApiKey}
            onChange={(e) =>
              setSettings({ ...settings, openRouterApiKey: e.target.value })
            }
            placeholder="sk-or-v1-..."
            className="flex-1 px-3 py-2.5 bg-surface border border-border-strong rounded-lg text-sm focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <button
            onClick={testConnection}
            className="px-4 py-2.5 text-sm font-medium rounded-lg border border-border-strong bg-surface text-text hover:bg-surface-alt transition-colors"
          >
            Test
          </button>
        </div>
        {testStatus && (
          <p
            className={`text-xs mt-2 ${
              testStatus.startsWith('Connected')
                ? 'text-success'
                : testStatus === 'Testing...'
                ? 'text-text-muted'
                : 'text-danger'
            }`}
          >
            {testStatus}
          </p>
        )}
      </section>

      {/* Model */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text mb-1">Model</h2>
        <p className="text-sm text-text-muted mb-3">
          The model used for image analysis. Filter to vision models for
          colour/font extraction. Defaults to Qwen 2.5 VL 72B.
        </p>
        <div className="max-w-lg">
          <ModelPicker
            value={settings.model}
            onChange={(model) => setSettings({ ...settings, model })}
            apiKey={settings.openRouterApiKey}
          />
        </div>
      </section>

      {/* Extraction slugs */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-text">Extraction prompts</h2>
          <button
            onClick={resetDefaults}
            className="text-xs text-text-subtle hover:text-text transition-colors"
          >
            Reset to defaults
          </button>
        </div>
        <p className="text-sm text-text-muted mb-4">
          Each slug is a type of extraction. The prompt is sent alongside the
          uploaded image. Add new slugs to support new extraction types without
          code changes.
        </p>

        <div className="space-y-4">
          {settings.extractionSlugs.map((slug, i) => (
            <div
              key={i}
              className="bg-surface border border-border rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="text"
                  value={slug.slug}
                  onChange={(e) => updateSlug(i, { slug: e.target.value })}
                  className="px-2 py-1.5 bg-surface-alt border border-border rounded-md text-xs w-40 focus:outline-none focus:border-accent"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <input
                  type="text"
                  value={slug.label}
                  onChange={(e) => updateSlug(i, { label: e.target.value })}
                  placeholder="Display label"
                  className="flex-1 px-2 py-1.5 bg-surface-alt border border-border rounded-md text-sm focus:outline-none focus:border-accent"
                />
                <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slug.enabled}
                    onChange={(e) => updateSlug(i, { enabled: e.target.checked })}
                    className="accent-accent"
                  />
                  Enabled
                </label>
                <button
                  onClick={() => removeSlug(i)}
                  className="text-text-subtle hover:text-danger text-sm transition-colors"
                >
                  &times;
                </button>
              </div>
              <textarea
                value={slug.prompt}
                onChange={(e) => updateSlug(i, { prompt: e.target.value })}
                rows={6}
                className="w-full px-3 py-2.5 bg-surface-alt border border-border rounded-lg text-xs text-text leading-relaxed resize-y focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={addSlug}
          className="mt-3 px-3 py-2 text-xs font-medium text-text-muted bg-surface-alt border border-dashed border-border rounded-lg hover:border-accent hover:text-accent transition-colors"
        >
          + Add extraction type
        </button>
      </section>

      {/* Save */}
      <div
        className="sticky bottom-0 py-4 flex gap-3 items-center justify-end border-t border-border"
        style={{
          background: 'color-mix(in srgb, var(--color-canvas) 92%, transparent)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {saveState.kind === 'saved' && (
          <span className="text-xs text-emerald-600">
            Wrote{' '}
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {saveState.envPath?.replace(/^.*\/brief-collector\//, '') || '.env.local'}
            </span>
          </span>
        )}
        {saveState.kind === 'error' && (
          <span className="text-xs text-danger">Save failed: {saveState.message}</span>
        )}
        {saveState.kind === 'idle' && envPath && (
          <span className="text-xs text-text-subtle" style={{ fontFamily: 'var(--font-mono)' }}>
            {envPath.replace(/^.*\/brief-collector\//, '')}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saveState.kind === 'saving'}
          className="h-10 px-5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {saveState.kind === 'saving'
            ? 'Saving...'
            : saveState.kind === 'saved'
            ? 'Saved'
            : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
