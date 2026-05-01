'use client';

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { detectTensions } from '@/lib/tensions';
import { TensionContext } from '@/lib/tension-context';
import { serializeForDisk } from '@/lib/design-definition';
import StepProject from './steps/StepProject';
import StepVibe from './steps/StepVibe';
import StepInspiration from './steps/StepInspiration';
import StepFeeling from './steps/StepFeeling';
import StepColour from './steps/StepColour';
import StepTypography from './steps/StepTypography';
import StepMode from './steps/StepMode';
import StepShape from './steps/StepShape';
import StepNavigation from './steps/StepNavigation';
import StepComponents from './steps/StepComponents';
import StepRules from './steps/StepRules';
import StepLibrary from './steps/StepLibrary';
import StepAdmin from './steps/StepAdmin';
import { ExportModal } from '../export/ExportModal';

const STEPS = [
  { id: 'step-project', label: 'Project', num: 1 },
  { id: 'step-vibe', label: 'Vibe', num: 2 },
  { id: 'step-inspiration', label: 'Inspiration', num: 3 },
  { id: 'step-feeling', label: 'Feeling', num: 4 },
  { id: 'step-colour', label: 'Colour', num: 5 },
  { id: 'step-typography', label: 'Typography', num: 6 },
  { id: 'step-mode', label: 'Mode', num: 7 },
  { id: 'step-shape', label: 'Shape & feel', num: 8 },
  { id: 'step-navigation', label: 'Navigation', num: 9 },
  { id: 'step-components', label: 'Components', num: 10 },
  { id: 'step-rules', label: 'Negotiable rules', num: 11 },
  { id: 'step-library', label: 'Library', num: 12 },
  { id: 'step-admin', label: 'Admin', num: 13 },
];

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; path: string; uploadCount: number }
  | { kind: 'error'; message: string };

export function WizardView() {
  const { state, dispatch } = useApp();
  const [showExport, setShowExport] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });

  // Compute tensions on every wizard state change
  const tensions = useMemo(
    () => detectTensions(state.wizardState),
    [state.wizardState]
  );

  // Count for the action bar
  const tensionCount = tensions.length;

  // Track active step on scroll
  const updateActive = useCallback(() => {
    let active = 0;
    for (let i = 0; i < STEPS.length; i++) {
      const el = document.getElementById(STEPS[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.top < 200) active = i;
    }
    dispatch({ type: 'SET_STEP', step: active + 1 });
  }, [dispatch]);

  useEffect(() => {
    window.addEventListener('scroll', updateActive, { passive: true });
    updateActive();
    return () => window.removeEventListener('scroll', updateActive);
  }, [updateActive]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startNewDraft = () => {
    dispatch({ type: 'NEW_DRAFT' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const projectName = state.wizardState.project.name.trim();
  const canSave = projectName.length > 0 && saveStatus.kind !== 'saving';

  const handleSaveDraft = async () => {
    if (!canSave) return;
    setSaveStatus({ kind: 'saving' });
    try {
      const selectedIds = state.wizardState.library.selectedIds;
      const { definition, filesToWrite } = serializeForDisk(
        state.wizardState,
        selectedIds,
        0
      );

      const formData = new FormData();
      formData.append('definition', JSON.stringify(definition));
      for (const { diskFilename, blob } of filesToWrite) {
        formData.append(`file:${diskFilename}`, blob, diskFilename);
      }

      const res = await fetch('/api/project/save', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setSaveStatus({ kind: 'saved', path: data.path, uploadCount: data.uploadCount });
      setTimeout(() => setSaveStatus({ kind: 'idle' }), 4000);
    } catch (err) {
      setSaveStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Save failed',
      });
      setTimeout(() => setSaveStatus({ kind: 'idle' }), 5000);
    }
  };

  // Steps that have at least one tension (for rail indicators)
  const stepsWithTensions = useMemo(() => {
    const ids = new Set<string>();
    for (const t of tensions) {
      ids.add(t.steps[0]);
    }
    return ids;
  }, [tensions]);

  return (
    <TensionContext.Provider value={tensions}>
      <div className="max-w-[1200px] mx-auto px-6 py-14 pb-36 grid grid-cols-[220px_1fr] gap-14 max-[980px]:grid-cols-1 max-[980px]:gap-0">
        {/* Step rail */}
        <aside className="sticky top-[100px] h-fit self-start border-l border-border pl-1 max-[980px]:hidden">
          {STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => scrollTo(step.id)}
              className={`block w-full text-left px-4 py-2 -ml-0.5 border-l-2 text-[13px] font-medium leading-snug transition-all cursor-pointer ${
                state.activeStep === step.num
                  ? 'text-text border-l-accent bg-gradient-to-r from-accent/10 to-transparent'
                  : 'text-text-subtle border-l-transparent hover:text-text-muted'
              }`}
            >
              <span
                className="block text-[10px] text-text-subtle tracking-wider mb-0.5"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {String(step.num).padStart(2, '0')}
              </span>
              <span className="flex items-center gap-1.5">
                {step.label}
                {stepsWithTensions.has(step.id) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                )}
              </span>
            </button>
          ))}
        </aside>

        {/* Steps */}
        <main>
          <StepProject />
          <StepVibe />
          <StepInspiration />
          <StepFeeling />
          <StepColour />
          <StepTypography />
          <StepMode />
          <StepShape />
          <StepNavigation />
          <StepComponents />
          <StepRules />
          <StepLibrary />
          <StepAdmin />
        </main>
      </div>

      {/* Action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-border px-6 py-3.5 z-50"
        style={{
          background: 'color-mix(in srgb, var(--color-canvas) 92%, transparent)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-[1200px] mx-auto flex justify-between items-center gap-3">
          <div className="text-xs text-text-subtle flex items-center gap-3">
            <span>
              Step <strong className="text-text font-semibold">{state.activeStep}</strong> of 13
            </span>
            {state.wizardState.project.name && (
              <span className="text-text-muted">
                &mdash; {state.wizardState.project.name}
              </span>
            )}
            {tensionCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {tensionCount} tension{tensionCount > 1 ? 's' : ''}
              </span>
            )}
            {saveStatus.kind === 'saved' && (
              <span className="text-emerald-600">
                Saved to {saveStatus.path.replace(/^.*\/SoulSystem\//, '~/Documents/SoulSystem/')}
                {saveStatus.uploadCount > 0 && ` (${saveStatus.uploadCount} files)`}
              </span>
            )}
            {saveStatus.kind === 'error' && (
              <span className="text-danger">Save failed: {saveStatus.message}</span>
            )}
            {saveStatus.kind === 'idle' && !projectName && (
              <span className="text-amber-600">Add a project name (Step 1) to save</span>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={startNewDraft}
              className="h-10 px-4 text-sm font-medium rounded-lg border border-border-strong bg-surface text-text hover:bg-surface-alt transition-colors"
            >
              New draft
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={!canSave}
              title={
                projectName
                  ? 'Save current progress to disk — works at any stage'
                  : 'Enter a project name first'
              }
              className="h-10 px-4 text-sm font-medium rounded-lg border border-border-strong bg-surface text-text hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus.kind === 'saving'
                ? 'Saving...'
                : saveStatus.kind === 'saved'
                ? 'Saved'
                : 'Save draft'}
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="h-10 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              Generate pack &rarr;
            </button>
          </div>
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </TensionContext.Provider>
  );
}
