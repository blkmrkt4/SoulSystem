'use client';

import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useApp } from '@/lib/context';
import type { LibraryComponent, MediaFile } from '@/lib/types';

interface ComponentDrawerProps {
  component: LibraryComponent | null;
  onClose: () => void;
}

function detectSourceLibrary(url: string): string {
  if (!url) return '';
  if (url.includes('21st.dev')) return '21stdev';
  if (url.includes('magicui.design')) return 'magicui';
  if (url.includes('aceternity.com')) return 'aceternity';
  if (url.includes('shadcn')) return 'shadcn';
  return '';
}

function detectCodeLanguage(code: string): string {
  if (!code) return '';
  if (code.includes('tsx') || code.includes('React') || code.includes('jsx'))
    return 'tsx';
  if (code.includes('import') && code.includes('from')) return 'ts';
  if (code.includes('<template>') || code.includes('v-')) return 'vue';
  return 'tsx';
}

export function ComponentDrawer({ component, onClose }: ComponentDrawerProps) {
  const { saveComponentToDB, deleteComponentsFromDB } = useApp();
  const isEditing = !!component;

  const [name, setName] = useState(component?.name || '');
  const [adaptedName, setAdaptedName] = useState(component?.adaptedName || '');
  const [sourceUrl, setSourceUrl] = useState(component?.sourceUrl || '');
  const [sourceLibrary, setSourceLibrary] = useState(
    component?.sourceLibrary || ''
  );
  const [description, setDescription] = useState(component?.description || '');
  const [code, setCode] = useState(component?.code || '');
  const [notes, setNotes] = useState(component?.notes || '');
  const [tags, setTags] = useState<string[]>(component?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [media, setMedia] = useState<MediaFile[]>(component?.media || []);

  const nameRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const [urlFetching, setUrlFetching] = useState(false);
  const [urlFetched, setUrlFetched] = useState(false);

  const handleUrlChange = (url: string) => {
    setSourceUrl(url);
    const detected = detectSourceLibrary(url);
    if (detected) setSourceLibrary(detected);
  };

  const handleUrlAnalyse = async () => {
    if (!sourceUrl.trim() || urlFetching) return;
    setUrlFetching(true);
    try {
      const res = await fetch('/api/analyse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl.trim(), mode: 'component' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // Auto-fill fields from the analysis
      if (data.parsed && typeof data.parsed === 'object') {
        const result = data.parsed as { name?: string; description?: string; tags?: string[] };
        if (result.name && !name) {
          setName(result.name);
          setAdaptedName(deriveAdapted(result.name));
        }
        if (result.description && !description) {
          setDescription(result.description);
        }
        if (result.tags && tags.length === 0) {
          setTags(result.tags.map((t: string) => t.toLowerCase()));
        }
      }

      // Add screenshot as media
      if (data.screenshot) {
        const response = await fetch(data.screenshot);
        const blob = await response.blob();
        const mediaFile: MediaFile = {
          type: 'image',
          filename: 'screenshot.png',
          blob,
        };
        setMedia((prev) => [...prev, mediaFile]);
      }

      setUrlFetched(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to analyse URL');
    } finally {
      setUrlFetching(false);
    }
  };

  const handleNameChange = (n: string) => {
    setName(n);
    if (!adaptedName || adaptedName === deriveAdapted(name)) {
      setAdaptedName(deriveAdapted(n));
    }
  };

  const deriveAdapted = (n: string) =>
    n
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(',', '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const mediaFile: MediaFile = {
        type: file.type.startsWith('video/') ? 'video' : 'image',
        filename: file.name,
        blob: file,
      };
      setMedia((prev) => [...prev, mediaFile]);
    });
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!name.trim()) {
      nameRef.current?.focus();
      return;
    }

    const comp: LibraryComponent = {
      id: component?.id || crypto.randomUUID(),
      name: name.trim(),
      adaptedName: adaptedName || deriveAdapted(name),
      sourceUrl,
      sourceLibrary: sourceLibrary || detectSourceLibrary(sourceUrl),
      code,
      codeLanguage: detectCodeLanguage(code),
      description,
      notes,
      tags,
      media,
      createdAt: component?.createdAt || Date.now(),
      lastUsedAt: Date.now(),
      usedInProjects: component?.usedInProjects || [],
    };

    await saveComponentToDB(comp);
    onClose();
  };

  const handleDelete = async () => {
    if (!component) return;
    if (!confirm(`Delete "${component.name}"?`)) return;
    await deleteComponentsFromDB([component.id]);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[150]"
        style={{
          background: 'rgba(20, 20, 19, 0.4)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-[600px] bg-canvas border-l border-border shadow-2xl z-[160] overflow-y-auto flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-7 py-6 border-b border-border flex items-center justify-between">
          <h2
            className="text-2xl font-normal m-0 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isEditing ? 'Edit component' : 'Add a component'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-base hover:bg-surface-alt transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 pb-24 flex-1">
          {/* Source URL */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Source URL{' '}
              <span className="text-text-subtle font-normal normal-case tracking-normal ml-1.5">
                optional, paste from 21st.dev, magicui, etc.
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://21st.dev/components/..."
                className="flex-1 bg-surface border border-border-strong rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
              />
              <button
                onClick={handleUrlAnalyse}
                disabled={urlFetching || !sourceUrl.trim()}
                className="h-[42px] px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 shrink-0"
              >
                {urlFetching ? 'Fetching...' : urlFetched ? 'Re-fetch' : 'Fetch'}
              </button>
            </div>
            {urlFetched && (
              <div className="text-[11px] text-emerald-600 mt-1">
                Page analysed — name, description, tags, and screenshot auto-filled.
              </div>
            )}
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Name{' '}
              <span className="text-text-subtle font-normal normal-case tracking-normal ml-1.5">
                required
              </span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Magnetic cursor effect"
              className="w-full bg-surface border border-border-strong rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
            />
          </div>

          {/* Adapted name */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Adapted name{' '}
              <span className="text-text-subtle font-normal normal-case tracking-normal ml-1.5">
                optional, auto-derived
              </span>
            </label>
            <input
              type="text"
              value={adaptedName}
              onChange={(e) => setAdaptedName(e.target.value)}
              placeholder="e.g. cursor (kebab-case for filenames)"
              className="w-full bg-surface border border-border-strong rounded-lg px-3 py-2.5 text-sm text-text focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
            />
            <div className="text-xs text-text-muted mt-1">
              Becomes{' '}
              <code className="text-[10px] bg-surface-alt px-1 py-0.5 rounded">
                component-{adaptedName || deriveAdapted(name) || '<name>'}.md
              </code>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Description{' '}
              <span className="text-text-subtle font-normal normal-case tracking-normal ml-1.5">
                optional
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One or two lines: what it does, visual style."
              rows={2}
              className="w-full bg-surface border border-border-strong rounded-lg px-3 py-2.5 text-sm text-text resize-y min-h-[70px] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
            />
          </div>

          {/* Code */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Code{' '}
              <span className="text-text-subtle font-normal normal-case tracking-normal ml-1.5">
                optional, paste full snippet
              </span>
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// paste the component code here"
              rows={8}
              className="w-full bg-surface-alt border border-border-strong rounded-lg px-3 py-2.5 text-xs text-text resize-y min-h-[200px] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          {/* Media */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Screenshots / videos{' '}
              <span className="text-text-subtle font-normal normal-case tracking-normal ml-1.5">
                optional
              </span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {media.map((m, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-surface-alt"
                >
                  {m.type === 'image' ? (
                    <img
                      src={URL.createObjectURL(m.blob)}
                      alt={m.filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-text-subtle">
                      {m.filename}
                    </div>
                  )}
                  <button
                    onClick={() =>
                      setMedia((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => mediaInputRef.current?.click()}
              className="px-3 py-2 text-xs text-text-muted bg-surface-alt border border-dashed border-border rounded-lg hover:border-accent hover:bg-accent/5 transition-colors"
            >
              + Add screenshot or video
            </button>
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaUpload}
              className="hidden"
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Notes{' '}
              <span className="text-text-subtle font-normal normal-case tracking-normal ml-1.5">
                when to use, when not to
              </span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Use during recording sessions. Don't use when audio is muted."
              rows={2}
              className="w-full bg-surface border border-border-strong rounded-lg px-3 py-2.5 text-sm text-text resize-y min-h-[70px] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
            />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 items-center bg-surface border border-border-strong rounded-lg px-2 py-2 min-h-[42px] focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent-soft">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-accent/10 text-accent px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="bg-transparent border-0 text-accent cursor-pointer text-sm leading-none p-0"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? 'Add tag and press Enter' : ''}
                className="flex-1 border-0 outline-none bg-transparent text-[13px] text-text min-w-[60px]"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 border-t border-border px-7 py-4 flex gap-2.5 justify-end"
          style={{
            background:
              'color-mix(in srgb, var(--color-canvas) 92%, transparent)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isEditing && (
            <button
              onClick={handleDelete}
              className="h-10 px-4 text-sm font-medium rounded-lg text-danger hover:bg-danger/10 transition-colors mr-auto"
            >
              Delete
            </button>
          )}
          <button
            onClick={onClose}
            className="h-10 px-4 text-sm font-medium rounded-lg text-text-muted hover:bg-surface-alt transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-10 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            {isEditing ? 'Save changes' : 'Save to library'}
          </button>
        </div>
      </div>
    </>
  );
}
