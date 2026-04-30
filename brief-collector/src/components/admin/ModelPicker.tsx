'use client';

import { useEffect, useState, useMemo, useRef } from 'react';

interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
  };
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
  };
}

type ModalityFilter = 'all' | 'vision' | 'text-only';
type SortBy = 'recommended' | 'price-asc' | 'price-desc' | 'context-desc' | 'name';

const RECOMMENDED_VISION_MODELS = new Set([
  'qwen/qwen2.5-vl-72b-instruct',
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash-preview',
  'google/gemini-2.5-flash-preview-05-20',
  'anthropic/claude-sonnet-4',
  'openai/gpt-4.1-mini',
  'qwen/qwen2.5-vl-32b-instruct',
]);

function formatPrice(perToken: string): string {
  const n = parseFloat(perToken);
  if (n === 0) return 'Free';
  // Price is per token, show per 1M tokens
  const perMillion = n * 1_000_000;
  if (perMillion < 0.01) return '<$0.01/M';
  if (perMillion < 1) return `$${perMillion.toFixed(2)}/M`;
  return `$${perMillion.toFixed(1)}/M`;
}

function formatContext(ctx: number): string {
  if (ctx >= 1_000_000) return `${(ctx / 1_000_000).toFixed(1)}M`;
  if (ctx >= 1_000) return `${Math.round(ctx / 1_000)}k`;
  return String(ctx);
}

export function ModelPicker({
  value,
  onChange,
  apiKey,
}: {
  value: string;
  onChange: (modelId: string) => void;
  apiKey: string;
}) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalityFilter, setModalityFilter] = useState<ModalityFilter>('vision');
  const [sortBy, setSortBy] = useState<SortBy>('recommended');
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch models
  useEffect(() => {
    async function fetchModels() {
      setLoading(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setModels(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch models');
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, [apiKey]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const filtered = useMemo(() => {
    let items = [...models];

    // Modality filter
    if (modalityFilter === 'vision') {
      items = items.filter((m) =>
        m.architecture?.input_modalities?.includes('image')
      );
    } else if (modalityFilter === 'text-only') {
      items = items.filter(
        (m) => !m.architecture?.input_modalities?.includes('image')
      );
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (m) =>
          m.id.toLowerCase().includes(q) ||
          m.name.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'recommended':
        items.sort((a, b) => {
          const aRec = RECOMMENDED_VISION_MODELS.has(a.id) ? 0 : 1;
          const bRec = RECOMMENDED_VISION_MODELS.has(b.id) ? 0 : 1;
          if (aRec !== bRec) return aRec - bRec;
          return parseFloat(a.pricing.prompt) - parseFloat(b.pricing.prompt);
        });
        break;
      case 'price-asc':
        items.sort(
          (a, b) => parseFloat(a.pricing.prompt) - parseFloat(b.pricing.prompt)
        );
        break;
      case 'price-desc':
        items.sort(
          (a, b) => parseFloat(b.pricing.prompt) - parseFloat(a.pricing.prompt)
        );
        break;
      case 'context-desc':
        items.sort((a, b) => b.context_length - a.context_length);
        break;
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return items;
  }, [models, modalityFilter, search, sortBy]);

  const selectedModel = models.find((m) => m.id === value);
  const hasVision = selectedModel?.architecture?.input_modalities?.includes('image');

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected model display / trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full text-left px-3 py-2.5 bg-surface border rounded-lg text-sm transition-colors flex items-center gap-3 ${
          open
            ? 'border-accent ring-[3px] ring-accent-soft'
            : 'border-border-strong hover:border-border-strong'
        }`}
      >
        <div className="flex-1 min-w-0">
          {selectedModel ? (
            <div>
              <div className="font-medium text-text truncate">{selectedModel.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] text-text-subtle"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {selectedModel.id}
                </span>
                <span className="text-[10px] text-text-subtle">
                  {formatPrice(selectedModel.pricing.prompt)} in
                </span>
                <span className="text-[10px] text-text-subtle">
                  {formatContext(selectedModel.context_length)} ctx
                </span>
                {hasVision && (
                  <span className="text-[9px] px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                    Vision
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-text-muted truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                {value || 'Select a model...'}
              </div>
              {value && !selectedModel && !loading && (
                <div className="text-[10px] text-amber-600 mt-0.5">
                  Model not found in OpenRouter catalogue
                </div>
              )}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-text-subtle shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Vision warning */}
      {selectedModel && !hasVision && (
        <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          This model does not support image input. Colour and font extraction require a vision model.
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Search + filters */}
          <div className="p-3 border-b border-border space-y-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              autoFocus
              className="w-full px-3 py-2 bg-surface-alt border border-border rounded-lg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent"
            />
            <div className="flex items-center gap-2 flex-wrap">
              {/* Modality filter */}
              {(['vision', 'all', 'text-only'] as ModalityFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setModalityFilter(f)}
                  className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                    modalityFilter === f
                      ? 'bg-accent/10 text-accent border-accent/30'
                      : 'bg-surface-alt border-border text-text-muted hover:bg-surface-alt'
                  }`}
                >
                  {f === 'vision' ? 'Vision' : f === 'text-only' ? 'Text only' : 'All'}
                </button>
              ))}

              <span className="text-border-strong">|</span>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-2 py-1 text-[11px] bg-surface-alt border border-border rounded-md text-text-muted focus:outline-none"
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Cheapest first</option>
                <option value="price-desc">Most expensive first</option>
                <option value="context-desc">Largest context</option>
                <option value="name">Alphabetical</option>
              </select>

              <span className="ml-auto text-[10px] text-text-subtle">
                {filtered.length} model{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Model list */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-text-muted">Loading models...</div>
            ) : error ? (
              <div className="p-6 text-center text-sm text-red-600">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-text-muted">No models match your filters</div>
            ) : (
              filtered.map((model) => {
                const isVision = model.architecture?.input_modalities?.includes('image');
                const isRec = RECOMMENDED_VISION_MODELS.has(model.id);
                const isSelected = model.id === value;
                const promptPrice = parseFloat(model.pricing.prompt);

                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      onChange(model.id);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 border-b border-border last:border-b-0 transition-colors ${
                      isSelected
                        ? 'bg-accent/5'
                        : 'hover:bg-surface-alt'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-text truncate">
                            {model.name}
                          </span>
                          {isRec && (
                            <span className="text-[9px] px-1 py-0.5 bg-accent/10 text-accent rounded font-medium shrink-0">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[10px] text-text-subtle truncate mt-0.5"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {model.id}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        {isVision && (
                          <span className="text-[9px] px-1 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">
                            Vision
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          promptPrice === 0
                            ? 'bg-emerald-50 text-emerald-600'
                            : promptPrice * 1_000_000 < 1
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-surface-alt text-text-muted'
                        }`}>
                          {formatPrice(model.pricing.prompt)}
                        </span>
                        <span className="text-[10px] text-text-subtle">
                          {formatContext(model.context_length)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
