'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { StepSection } from '@/components/ui/StepSection';
import type { LibraryComponent } from '@/lib/types';

const TOTAL_STEPS = 13;

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const tag = input.trim().toLowerCase();
      if (!tags.includes(tag)) {
        onChange([...tags, tag]);
      }
      setInput('');
    }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-surface border border-border rounded-xl min-h-[42px] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-soft text-accent text-xs rounded-md"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="text-accent/60 hover:text-accent text-sm leading-none"
          >
            x
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? 'Type and press Enter...' : ''}
        className="flex-1 min-w-[80px] bg-transparent text-sm text-text placeholder:text-text-subtle outline-none"
      />
    </div>
  );
}

function AddComponentDrawer({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (component: LibraryComponent) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    adaptedName: '',
    sourceUrl: '',
    sourceLibrary: '',
    description: '',
    code: '',
    codeLanguage: 'tsx',
    notes: '',
    tags: [] as string[],
  });

  const update = (key: string, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    const component: LibraryComponent = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      adaptedName: form.adaptedName.trim(),
      sourceUrl: form.sourceUrl.trim(),
      sourceLibrary: form.sourceLibrary.trim(),
      code: form.code,
      codeLanguage: form.codeLanguage,
      description: form.description.trim(),
      notes: form.notes.trim(),
      tags: form.tags,
      media: [],
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      usedInProjects: [],
    };
    onSave(component);
    setForm({
      name: '',
      adaptedName: '',
      sourceUrl: '',
      sourceLibrary: '',
      description: '',
      code: '',
      codeLanguage: 'tsx',
      notes: '',
      tags: [],
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-text/20" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-canvas border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-canvas border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h2
            className="text-lg font-semibold text-text m-0"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Add component
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
          >
            x
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-text mb-1">
              Name <span className="text-danger">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. DataTable"
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Adapted name</label>
            <input
              value={form.adaptedName}
              onChange={(e) => update('adaptedName', e.target.value)}
              placeholder="e.g. ProjectTable"
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Source URL</label>
            <input
              value={form.sourceUrl}
              onChange={(e) => update('sourceUrl', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Source library</label>
            <input
              value={form.sourceLibrary}
              onChange={(e) => update('sourceLibrary', e.target.value)}
              placeholder="e.g. shadcn/ui, Radix"
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="What does this component do?"
              rows={2}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Code</label>
            <textarea
              value={form.code}
              onChange={(e) => update('code', e.target.value)}
              placeholder="Paste component code..."
              rows={6}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all resize-y"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any notes or caveats..."
              rows={2}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">Tags</label>
            <TagInput tags={form.tags} onChange={(tags) => update('tags', tags)} />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="w-full px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save to library
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LibraryCard({
  component,
  selected,
  onClick,
}: {
  component: LibraryComponent;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col
        ${
          selected
            ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]'
            : 'border-border hover:border-border-strong hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(28,25,22,0.06)]'
        }`}
    >
      <div className="h-24 bg-surface-alt border-b border-border flex items-center justify-center relative">
        {component.media.length > 0 ? (
          <div className="text-xs text-text-subtle">Preview</div>
        ) : (
          <div
            className="text-2xl font-light text-text-subtle"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {'</>'}
          </div>
        )}
        {selected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <h4 className="text-sm font-medium text-text m-0 truncate">{component.name}</h4>
        {component.sourceLibrary && (
          <p className="text-[11px] text-text-subtle m-0 mt-0.5 truncate">
            {component.sourceLibrary}
          </p>
        )}
        {component.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {component.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 bg-surface-alt text-[10px] text-text-muted rounded"
              >
                {tag}
              </span>
            ))}
            {component.tags.length > 3 && (
              <span className="text-[10px] text-text-subtle">+{component.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StepLibrary() {
  const { state, updateNestedWizard, saveComponentToDB } = useApp();
  const { selectedIds } = state.wizardState.library;
  const library = state.library;

  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return library;
    const q = search.toLowerCase();
    return library.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [library, search]);

  const selectedComponents = useMemo(
    () => library.filter((c) => selectedIds.includes(c.id)),
    [library, selectedIds]
  );

  const toggleSelection = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];
    updateNestedWizard('library', 'selectedIds', next);
  };

  const handleAddComponent = async (component: LibraryComponent) => {
    await saveComponentToDB(component);
  };

  return (
    <StepSection
      id="step-library"
      stepNumber={12}
      totalSteps={TOTAL_STEPS}
      label="Library"
      title="Component library"
      help="Select existing components to include in this project, or add new ones to your library."
    >
      <div className="flex gap-6">
        {/* Main area */}
        <div className="flex-1 min-w-0">
          {/* Search + add */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search components by name or tag..."
                className="w-full pl-9 pr-3 py-2.5 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity shrink-0"
            >
              + Add component
            </button>
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-text-muted m-0">
                {library.length === 0
                  ? 'No components in your library yet. Add one to get started.'
                  : 'No components match your search.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((component) => (
                <LibraryCard
                  key={component.id}
                  component={component}
                  selected={selectedIds.includes(component.id)}
                  onClick={() => toggleSelection(component.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-56 shrink-0 hidden lg:block">
          <div className="sticky top-24 bg-surface border border-border rounded-xl p-4">
            <h4
              className="text-xs font-semibold text-text-subtle uppercase tracking-widest m-0 mb-3"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Selected ({selectedComponents.length})
            </h4>
            {selectedComponents.length === 0 ? (
              <p className="text-xs text-text-subtle m-0">
                Click components to add them to this project.
              </p>
            ) : (
              <ul className="space-y-1.5 m-0 p-0 list-none">
                {selectedComponents.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 text-xs text-text group"
                  >
                    <span className="truncate flex-1">{c.name}</span>
                    <button
                      onClick={() => toggleSelection(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-subtle hover:text-danger text-xs transition-opacity"
                    >
                      x
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <AddComponentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={handleAddComponent}
      />
    </StepSection>
  );
}
