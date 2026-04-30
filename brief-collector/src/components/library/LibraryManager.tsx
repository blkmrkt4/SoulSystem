'use client';

import { useState, useMemo, useRef } from 'react';
import { useApp } from '@/lib/context';
import type { LibraryComponent } from '@/lib/types';
import { ComponentDrawer } from './ComponentDrawer';

export function LibraryManager() {
  const { state, deleteComponentsFromDB, saveComponentToDB } = useApp();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingComponent, setEditingComponent] = useState<LibraryComponent | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'alpha' | 'used'>('recent');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let items = [...state.library];

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.sourceLibrary.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'alpha':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'used':
        items.sort((a, b) => b.usedInProjects.length - a.usedInProjects.length);
        break;
      default:
        items.sort((a, b) => b.createdAt - a.createdAt);
    }

    return items;
  }, [state.library, search, sortBy]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} component(s)?`)) return;
    await deleteComponentsFromDB(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleEdit = (component: LibraryComponent) => {
    setEditingComponent(component);
    setShowDrawer(true);
  };

  const handleAdd = () => {
    setEditingComponent(null);
    setShowDrawer(true);
  };

  const handleExport = () => {
    const data = state.library.map(({ media, ...rest }) => ({
      ...rest,
      mediaCount: media.length,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'component-library.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Omit<LibraryComponent, 'media'>[];
      for (const item of data) {
        const component: LibraryComponent = {
          ...item,
          media: [],
          id: item.id || crypto.randomUUID(),
          createdAt: item.createdAt || Date.now(),
          lastUsedAt: item.lastUsedAt || Date.now(),
          usedInProjects: item.usedInProjects || [],
          tags: item.tags || [],
          adaptedName: item.adaptedName || '',
          sourceUrl: item.sourceUrl || '',
          sourceLibrary: item.sourceLibrary || '',
          code: item.code || '',
          codeLanguage: item.codeLanguage || '',
          description: item.description || '',
          notes: item.notes || '',
          name: item.name || 'Unnamed',
        };
        await saveComponentToDB(component);
      }
    } catch {
      alert('Invalid JSON file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-14">
      <div className="mb-8">
        <h1
          className="text-4xl font-normal leading-tight tracking-tight m-0 mb-3"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          Component library
        </h1>
        <p className="text-base text-text-muted max-w-[620px] m-0 leading-relaxed">
          Your persistent collection of components. Add once, pick for any project.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or tag..."
          className="flex-1 min-w-[180px] h-9 px-3 bg-surface border border-border-strong rounded-lg text-[13px] focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'recent' | 'alpha' | 'used')}
          className="h-9 px-3 bg-surface border border-border-strong rounded-lg text-[13px] focus:outline-none focus:border-accent"
        >
          <option value="recent">Recently added</option>
          <option value="alpha">Alphabetical</option>
          <option value="used">Most used</option>
        </select>
        <button
          onClick={handleAdd}
          className="h-9 px-3.5 bg-accent text-white border-0 rounded-lg text-[13px] font-medium hover:bg-accent/90 transition-colors flex items-center gap-1.5"
        >
          + Add component
        </button>
      </div>

      {/* Bulk actions */}
      <div className="flex gap-2.5 items-center mb-4 flex-wrap">
        {selectedIds.size > 0 && (
          <>
            <span className="text-xs text-text-muted">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="h-8 px-3 text-xs font-medium rounded-md bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
            >
              Delete selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="h-8 px-3 text-xs font-medium rounded-md text-text-muted hover:bg-surface-alt transition-colors"
            >
              Clear selection
            </button>
          </>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleExport}
            className="h-8 px-3 text-xs font-medium rounded-md border border-border-strong text-text-muted hover:bg-surface-alt transition-colors"
          >
            Export library
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-3 text-xs font-medium rounded-md border border-border-strong text-text-muted hover:bg-surface-alt transition-colors"
          >
            Import library
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface border border-dashed border-border-strong rounded-[14px] py-12 px-6 text-center text-text-muted text-sm">
          <strong className="block text-text text-[15px] mb-1.5">
            {state.library.length === 0
              ? 'No components yet'
              : 'No matches'}
          </strong>
          {state.library.length === 0
            ? 'Add your first component to start building your library.'
            : 'Try a different search term.'}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
          {filtered.map((component) => (
            <div
              key={component.id}
              className={`bg-surface border rounded-xl overflow-hidden cursor-pointer transition-all relative group ${
                selectedIds.has(component.id)
                  ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]'
                  : 'border-border hover:border-border-strong hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(28,25,22,0.06)]'
              }`}
            >
              {/* Selection checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.has(component.id)}
                  onChange={() => toggleSelect(component.id)}
                  className="w-4 h-4 rounded accent-accent cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div
                onClick={() => handleEdit(component)}
                className="h-[100px] bg-surface-alt border-b border-border flex items-center justify-center text-text-subtle text-[11px]"
              >
                {component.media.length > 0 ? (
                  <img
                    src={URL.createObjectURL(component.media[0].blob)}
                    alt={component.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  component.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="px-3.5 py-3" onClick={() => handleEdit(component)}>
                <div className="text-[13px] font-semibold mb-1 text-text">
                  {component.name}
                </div>
                {component.sourceLibrary && (
                  <div
                    className="text-[10px] text-text-subtle tracking-wider"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {component.sourceLibrary}
                  </div>
                )}
                {component.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {component.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-surface-alt text-text-muted px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDrawer && (
        <ComponentDrawer
          component={editingComponent}
          onClose={() => {
            setShowDrawer(false);
            setEditingComponent(null);
          }}
        />
      )}
    </div>
  );
}
