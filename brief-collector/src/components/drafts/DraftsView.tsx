'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';
import { buildPrompt } from '@/lib/prompt-builder';
import type { Draft, WizardState, DesignDefinition } from '@/lib/types';
import { deserializeFromDisk } from '@/lib/design-definition';

const VIBE_COLORS: Record<string, string> = {
  quiet: '#4A5D5C',
  technical: '#00FF94',
  editorial: '#8B4A2B',
  bold: '#FFE600',
  playful: '#7B5BD8',
  luxurious: '#C9A961',
};

interface DiskProject {
  slug: string;
  projectName: string;
  savedAt: string | null;
  version: number;
  promptCount: number;
  hasOutput: boolean;
  outputFileCount: number;
  hasDesignDefinition: boolean;
  vibe: string;
  accentColour: string;
  mode: string;
  platform: string;
  completionPct: number;
}

function completionPercent(draft: Draft): number {
  const s = draft.state;
  let filled = 0;
  const total = 6;
  if (s.project.name) filled++;
  if (s.vibe) filled++;
  if (s.colour.accent) filled++;
  if (s.mode) filled++;
  if (s.typography.display) filled++;
  if (s.admin.scope) filled++;
  return Math.round((filled / total) * 100);
}

export function DraftsView() {
  const {
    state,
    loadDraft,
    duplicateDraft,
    deleteDraftFromDB,
    loadWizardState,
    dispatch,
  } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [diskProjects, setDiskProjects] = useState<DiskProject[]>([]);
  const [diskLoading, setDiskLoading] = useState(true);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch disk projects on mount
  useEffect(() => {
    async function fetchDiskProjects() {
      try {
        const res = await fetch('/api/project/list');
        if (res.ok) {
          const data = await res.json();
          setDiskProjects(data.projects || []);
        }
      } catch {
        // Silently fail — disk projects are supplementary
      } finally {
        setDiskLoading(false);
      }
    }
    fetchDiskProjects();
  }, []);

  const activeDrafts = useMemo(
    () => state.drafts.filter((d) => !d.exported),
    [state.drafts]
  );
  const exportedDrafts = useMemo(
    () => state.drafts.filter((d) => d.exported),
    [state.drafts]
  );

  const handleOpen = (draft: Draft) => {
    loadDraft(draft);
  };

  const handleDuplicate = async (draft: Draft) => {
    await duplicateDraft(draft);
  };

  const handleDelete = async (draft: Draft) => {
    if (!confirm(`Delete draft "${draft.state.project.name || 'Untitled'}"?`))
      return;
    await deleteDraftFromDB(draft.id);
  };

  const handleExportPrompt = async (draft: Draft) => {
    const selectedComponents = state.library.filter((c) =>
      draft.state.library.selectedIds.includes(c.id)
    );
    const prompt = buildPrompt(draft.state, selectedComponents);
    await navigator.clipboard.writeText(prompt);
    setCopiedId(draft.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewDraft = () => {
    dispatch({ type: 'NEW_DRAFT' });
    dispatch({ type: 'SET_TAB', tab: 'wizard' });
  };

  // Load a project from disk
  const handleLoadFromDisk = async (slug: string, asCopy: boolean) => {
    setLoadingSlug(slug);
    try {
      const res = await fetch(`/api/project/load?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to load project');
        return;
      }
      const data = await res.json();

      if (data.format === 'design-definition') {
        // New format: reconstruct blobs from base64 data URLs
        const definition = data.definition as DesignDefinition;
        const files = data.files as Record<string, string>;

        const blobMap = new Map<string, Blob>();
        for (const [diskFilename, dataUrl] of Object.entries(files)) {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          blobMap.set(diskFilename, blob);
        }

        const wizardState = deserializeFromDisk(definition, blobMap);
        loadWizardState(wizardState, asCopy);
      } else {
        // Legacy format
        const wizardState = data.state as WizardState;
        if (!wizardState) {
          alert('No wizard state found');
          return;
        }
        loadWizardState(wizardState, asCopy);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoadingSlug(null);
    }
  };

  // Load from a JSON file
  const handleLoadFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const wizardState = data.state as WizardState;
      if (!wizardState?.project) {
        alert('Invalid brief.json — no wizard state found');
        return;
      }
      loadWizardState(wizardState, false);
    } catch {
      alert('Could not parse file as JSON');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderDraftCard = (draft: Draft) => {
    const pct = completionPercent(draft);
    const vibeColor = VIBE_COLORS[draft.state.vibe] || '#9B9890';
    const isActive = draft.id === state.draftId;

    return (
      <div
        key={draft.id}
        className={`bg-surface border rounded-[14px] overflow-hidden transition-all ${
          isActive
            ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]'
            : 'border-border hover:border-border-strong hover:shadow-[0_2px_8px_rgba(28,25,22,0.06)]'
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          {draft.state.colour.accent && (
            <div
              className="w-5 h-5 rounded-md border border-border"
              style={{ background: draft.state.colour.accent }}
            />
          )}
          {draft.state.vibe && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${vibeColor}15`, color: vibeColor }}
            >
              {draft.state.vibe}
            </span>
          )}
          {draft.state.mode && (
            <span className="text-[10px] text-text-subtle px-1.5 py-0.5 bg-surface-alt rounded">
              {draft.state.mode}
            </span>
          )}
          <span className="ml-auto text-[10px] text-text-subtle">{pct}%</span>
          <div className="w-12 h-1 bg-surface-alt rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="px-4 py-3">
          <h3 className="text-[15px] font-semibold text-text m-0 mb-1">
            {draft.state.project.name || 'Untitled draft'}
          </h3>
          <p className="text-xs text-text-subtle m-0">
            {new Date(draft.updatedAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
          {isActive && (
            <span className="inline-block mt-1.5 text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">
              Currently editing
            </span>
          )}
        </div>

        <div className="flex border-t border-border">
          <button
            onClick={() => handleOpen(draft)}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-text-muted hover:bg-surface-alt hover:text-text transition-colors border-r border-border"
          >
            Open
          </button>
          <button
            onClick={() => handleDuplicate(draft)}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-text-muted hover:bg-surface-alt hover:text-text transition-colors border-r border-border"
          >
            Duplicate
          </button>
          <button
            onClick={() => handleExportPrompt(draft)}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-text-muted hover:bg-surface-alt hover:text-text transition-colors border-r border-border"
          >
            {copiedId === draft.id ? 'Copied!' : 'Export'}
          </button>
          <button
            onClick={() => handleDelete(draft)}
            className="px-3 py-2.5 text-xs font-medium text-text-subtle hover:bg-danger/5 hover:text-danger transition-colors"
          >
            &times;
          </button>
        </div>
      </div>
    );
  };

  const renderDiskProjectCard = (project: DiskProject) => {
    const vibeColor = VIBE_COLORS[project.vibe] || '#9B9890';
    const isLoading = loadingSlug === project.slug;

    return (
      <div
        key={project.slug}
        className="bg-surface border border-border rounded-[14px] overflow-hidden hover:border-border-strong hover:shadow-[0_2px_8px_rgba(28,25,22,0.06)] transition-all"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          {project.accentColour && (
            <div
              className="w-5 h-5 rounded-md border border-border"
              style={{ background: project.accentColour }}
            />
          )}
          {project.vibe && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: `${vibeColor}15`, color: vibeColor }}
            >
              {project.vibe}
            </span>
          )}
          {project.mode && (
            <span className="text-[10px] text-text-subtle px-1.5 py-0.5 bg-surface-alt rounded">
              {project.mode}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {project.version > 0 && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                v{project.version}
              </span>
            )}
            {project.promptCount > 0 && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 bg-surface-alt text-text-subtle rounded">
                {project.promptCount} prompt{project.promptCount > 1 ? 's' : ''}
              </span>
            )}
            {project.hasOutput && (
              <span className="text-[9px] font-medium px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                {project.outputFileCount} output files
              </span>
            )}
          </div>
        </div>

        <div className="px-4 py-3">
          <h3 className="text-[15px] font-semibold text-text m-0 mb-1">
            {project.projectName}
          </h3>
          <div className="flex items-center gap-2">
            {project.savedAt && (
              <p className="text-xs text-text-subtle m-0">
                Saved{' '}
                {new Date(project.savedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            )}
            {project.platform && (
              <span className="text-[10px] text-text-subtle px-1.5 py-0.5 bg-surface-alt rounded">
                {Array.isArray(project.platform) ? project.platform.join(', ') : project.platform}
              </span>
            )}
          </div>
          <p
            className="text-[10px] text-text-subtle m-0 mt-1.5"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ~/Documents/SoulSystem/{project.slug}/
          </p>
        </div>

        <div className="flex border-t border-border">
          <button
            onClick={() => handleLoadFromDisk(project.slug, false)}
            disabled={isLoading}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-text-muted hover:bg-surface-alt hover:text-text transition-colors border-r border-border disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Open'}
          </button>
          <button
            onClick={() => handleLoadFromDisk(project.slug, true)}
            disabled={isLoading}
            className="flex-1 px-3 py-2.5 text-xs font-medium text-text-muted hover:bg-surface-alt hover:text-text transition-colors disabled:opacity-50"
          >
            Use as template
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-14">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            className="text-4xl font-normal leading-tight tracking-tight m-0 mb-3"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
          >
            Projects &amp; drafts
          </h1>
          <p className="text-base text-text-muted max-w-[620px] m-0 leading-relaxed">
            Saved projects from disk and in-progress drafts. Open any project to
            edit, or use it as a template for a new one.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-10 px-4 text-sm font-medium rounded-lg border border-border-strong bg-surface text-text hover:bg-surface-alt transition-colors"
          >
            Load from file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleLoadFromFile}
            className="hidden"
          />
          <button
            onClick={handleNewDraft}
            className="h-10 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            + New draft
          </button>
        </div>
      </div>

      {/* Saved projects from disk */}
      <div className="mb-10">
        <h2 className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
          Saved projects
          <span
            className="text-[10px] font-normal text-text-subtle normal-case tracking-normal"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ~/Documents/SoulSystem/
          </span>
        </h2>
        {diskLoading ? (
          <div className="text-sm text-text-muted py-6">Loading projects...</div>
        ) : diskProjects.length === 0 ? (
          <div className="bg-surface border border-dashed border-border-strong rounded-[14px] py-8 px-6 text-center text-text-muted text-sm">
            No exported projects yet. Complete a wizard run and export to create
            your first project.
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {diskProjects.map(renderDiskProjectCard)}
          </div>
        )}
      </div>

      {/* In-progress drafts from IndexedDB */}
      {activeDrafts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-[13px] font-semibold text-text-muted uppercase tracking-wider mb-4">
            In-progress drafts
            <span className="text-[10px] font-normal text-text-subtle ml-2 normal-case tracking-normal">
              browser only — export to save permanently
            </span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {activeDrafts.map(renderDraftCard)}
          </div>
        </div>
      )}

      {exportedDrafts.length > 0 && (
        <div>
          <h2 className="text-[13px] font-semibold text-text-subtle uppercase tracking-wider mb-4">
            Exported drafts (browser)
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {exportedDrafts.map(renderDraftCard)}
          </div>
        </div>
      )}
    </div>
  );
}
