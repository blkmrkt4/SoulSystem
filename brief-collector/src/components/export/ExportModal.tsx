'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { buildPrompt, validateForExport, classifyFiles } from '@/lib/prompt-builder';
import { serializeForDisk } from '@/lib/design-definition';

type Phase = 'save' | 'generate' | 'import';

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const { state, getSelectedComponents, markExported } = useApp();
  const [phase, setPhase] = useState<Phase>('save');

  // Save state
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveResult, setSaveResult] = useState<{ path: string; uploadCount: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Generate state
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<{ version: number; filename: string; path: string } | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ path: string; files: string[] } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const errors = useMemo(() => validateForExport(state.wizardState), [state.wizardState]);

  const selectedComponents = useMemo(() => getSelectedComponents(), [getSelectedComponents]);

  const prompt = useMemo(
    () => (errors.length === 0 ? buildPrompt(state.wizardState, selectedComponents) : ''),
    [state.wizardState, selectedComponents, errors.length]
  );

  const fileClassification = useMemo(() => classifyFiles(state.wizardState), [state.wizardState]);

  // --- Save Design Definition ---
  const handleSave = async () => {
    setSaveLoading(true);
    setSaveError(null);
    try {
      const selectedIds = state.wizardState.library.selectedIds;
      const { definition, filesToWrite } = serializeForDisk(state.wizardState, selectedIds, 0);

      const formData = new FormData();
      formData.append('definition', JSON.stringify(definition));

      for (const { diskFilename, blob } of filesToWrite) {
        formData.append(`file:${diskFilename}`, blob, diskFilename);
      }

      const res = await fetch('/api/project/save', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setSaveResult(data);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Generate Versioned Prompt ---
  const handleGenerate = async () => {
    setGenLoading(true);
    setGenError(null);
    try {
      const slug = state.wizardState.project.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const res = await fetch('/api/project/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          prompt,
          projectName: state.wizardState.project.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setGenResult(data);

      // Copy to clipboard
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);

      if (state.draftId) await markExported(state.draftId);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generate failed');
    } finally {
      setGenLoading(false);
    }
  };

  // --- Import Bundle ---
  const handleImport = async () => {
    if (!importText.trim()) return;
    setImportLoading(true);
    setImportError(null);
    try {
      const res = await fetch('/api/project/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: state.wizardState.project.name,
          bundleText: importText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setImportResult(data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const scrollToError = (field: string) => {
    onClose();
    setTimeout(() => {
      const el = document.getElementById(field);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-red-400');
        setTimeout(() => el.classList.remove('ring-2', 'ring-red-400'), 3000);
      }
    }, 100);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: 'rgba(20, 20, 19, 0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div className="bg-surface rounded-2xl max-w-[800px] w-full max-h-[90vh] overflow-auto shadow-2xl">
        {/* Phase tabs */}
        <div className="flex border-b border-border">
          {(['save', 'generate', 'import'] as Phase[]).map((p) => (
            <button
              key={p}
              onClick={() => setPhase(p)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                phase === p
                  ? 'text-text border-b-2 border-accent'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {p === 'save' ? '1. Save definition' : p === 'generate' ? '2. Generate prompt' : '3. Import bundle'}
            </button>
          ))}
        </div>

        <div className="p-8">
          {/* ====== SAVE PHASE ====== */}
          {phase === 'save' && (
            <>
              <h2
                className="text-[28px] font-normal m-0 mb-2 tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Save Design Definition
              </h2>
              <p className="text-text-muted text-sm m-0 mb-5 leading-relaxed">
                Saves all your wizard answers and uploaded files to disk. You can load
                this back at any time to tweak and regenerate.
              </p>

              {saveResult && (
                <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                  <strong>Saved!</strong> {saveResult.uploadCount} file(s) included.
                  <span className="block text-[11px] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                    {saveResult.path}
                  </span>
                </div>
              )}
              {saveError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {saveError}
                </div>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={handleSave}
                  disabled={saveLoading || !state.wizardState.project.name.trim()}
                  className="h-10 px-5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {saveLoading ? 'Saving...' : saveResult ? 'Re-save' : 'Save to disk'}
                </button>
                {!state.wizardState.project.name.trim() && (
                  <span className="text-xs text-amber-600 self-center">
                    Enter a project name first (Step 1)
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="h-10 px-4 text-sm font-medium rounded-lg text-text-muted hover:bg-surface-alt transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </>
          )}

          {/* ====== GENERATE PHASE ====== */}
          {phase === 'generate' && (
            <>
              <h2
                className="text-[28px] font-normal m-0 mb-2 tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Generate prompt for Claude Desktop
              </h2>
              <p className="text-text-muted text-sm m-0 mb-5 leading-relaxed">
                Generates a versioned prompt file and copies it to your clipboard.
                Paste into Claude Desktop to produce the design bundle.
              </p>

              {/* Validation errors */}
              {errors.length > 0 && (
                <div className="mb-5 space-y-2">
                  <p className="text-sm text-text-muted m-0">Fix these before generating:</p>
                  {errors.map((err) => (
                    <button
                      key={err.field}
                      onClick={() => scrollToError(err.field)}
                      className="w-full text-left px-4 py-3 bg-danger/5 border border-danger/20 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <strong>Step {err.step}:</strong> {err.message}
                    </button>
                  ))}
                </div>
              )}

              {errors.length === 0 && (
                <>
                  {/* File status */}
                  {fileClassification.extracted.length > 0 &&
                    fileClassification.needsVisualAnalysis.length === 0 && (
                      <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                        All uploaded files analysed — no files need to be dragged into Claude Desktop.
                      </div>
                    )}
                  {fileClassification.needsVisualAnalysis.length > 0 && (
                    <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                      {fileClassification.needsVisualAnalysis.length} file(s) need visual analysis.
                      Drag them into Claude Desktop: {fileClassification.needsVisualAnalysis.map((f) => f.name).join(', ')}
                    </div>
                  )}

                  {genResult && (
                    <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                      <strong>Generated v{genResult.version}!</strong> Prompt copied to clipboard.
                      <span className="block text-[11px] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                        {genResult.filename}
                      </span>
                    </div>
                  )}
                  {genError && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      {genError}
                    </div>
                  )}

                  <pre
                    className="bg-surface-alt border border-border rounded-xl p-4 max-h-[240px] overflow-auto text-xs leading-relaxed text-text whitespace-pre-wrap break-words mb-4"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {prompt}
                  </pre>
                </>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={handleGenerate}
                  disabled={genLoading || errors.length > 0}
                  className="h-10 px-5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {genLoading
                    ? 'Generating...'
                    : genResult
                    ? `Generate v${genResult.version + 1}`
                    : 'Generate prompt'}
                </button>
                {copied && (
                  <span className="text-xs text-emerald-600 self-center">Copied to clipboard</span>
                )}
                <button
                  onClick={onClose}
                  className="h-10 px-4 text-sm font-medium rounded-lg text-text-muted hover:bg-surface-alt transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </>
          )}

          {/* ====== IMPORT PHASE ====== */}
          {phase === 'import' && (
            <>
              <h2
                className="text-[28px] font-normal m-0 mb-2 tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Import the design bundle
              </h2>
              <p className="text-text-muted text-sm m-0 mb-5 leading-relaxed">
                Paste Claude Desktop&apos;s full output. The Brief Collector will parse the
                file markers and write each file to your project&apos;s{' '}
                <code className="text-[11px] bg-surface-alt px-1 py-0.5 rounded">out/</code> folder.
              </p>

              {importResult && (
                <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                  <strong>Written {importResult.files.length} files:</strong>
                  <ul className="m-0 mt-2 pl-4 space-y-0.5">
                    {importResult.files.map((f) => (
                      <li key={f} className="text-[11px]" style={{ fontFamily: 'var(--font-mono)' }}>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <span className="text-[11px] mt-2 block" style={{ fontFamily: 'var(--font-mono)' }}>
                    {importResult.path}
                  </span>
                </div>
              )}
              {importError && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {importError}
                </div>
              )}

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste Claude Desktop's full output here..."
                rows={10}
                className="w-full bg-surface-alt border border-border rounded-xl p-4 text-xs leading-relaxed text-text placeholder:text-text-subtle resize-y mb-4 focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-soft"
                style={{ fontFamily: 'var(--font-mono)' }}
              />

              <div className="flex gap-2.5">
                <button
                  onClick={handleImport}
                  disabled={importLoading || !importText.trim()}
                  className="h-10 px-5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {importLoading ? 'Importing...' : importResult ? 'Re-import' : 'Import bundle'}
                </button>
                <button
                  onClick={onClose}
                  className="h-10 px-4 text-sm font-medium rounded-lg text-text-muted hover:bg-surface-alt transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
