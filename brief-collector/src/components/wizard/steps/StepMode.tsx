'use client';

import { useApp } from '@/lib/context';
import { StepSection } from '@/components/ui/StepSection';
import { ChoiceCard } from '@/components/ui/ChoiceCard';

function ModePreviewLight() {
  return (
    <div className="h-full flex items-center justify-center bg-[#FAFAF7] px-5">
      <div className="w-full max-w-[180px]">
        <div className="h-2.5 w-3/4 rounded bg-[#1A1916]/80 mb-2" />
        <div className="h-2 w-full rounded bg-[#1A1916]/15 mb-1" />
        <div className="h-2 w-5/6 rounded bg-[#1A1916]/15 mb-3" />
        <div className="h-5 w-16 rounded bg-[#2B6CB0] " />
      </div>
    </div>
  );
}

function ModePreviewDark() {
  return (
    <div className="h-full flex items-center justify-center bg-[#0E0E0D] px-5">
      <div className="w-full max-w-[180px]">
        <div className="h-2.5 w-3/4 rounded bg-[#EDEBE4]/80 mb-2" />
        <div className="h-2 w-full rounded bg-[#EDEBE4]/15 mb-1" />
        <div className="h-2 w-5/6 rounded bg-[#EDEBE4]/15 mb-3" />
        <div className="h-5 w-16 rounded bg-[#6B9FD8]" />
      </div>
    </div>
  );
}

function ModePreviewDual() {
  return (
    <div className="h-full flex">
      <div className="flex-1 flex items-center justify-center bg-[#FAFAF7] px-3">
        <div className="w-full max-w-[80px]">
          <div className="h-2 w-3/4 rounded bg-[#1A1916]/80 mb-1.5" />
          <div className="h-1.5 w-full rounded bg-[#1A1916]/15 mb-0.5" />
          <div className="h-1.5 w-5/6 rounded bg-[#1A1916]/15 mb-2" />
          <div className="h-4 w-10 rounded bg-[#2B6CB0]" />
        </div>
      </div>
      <div className="w-px bg-border" />
      <div className="flex-1 flex items-center justify-center bg-[#0E0E0D] px-3">
        <div className="w-full max-w-[80px]">
          <div className="h-2 w-3/4 rounded bg-[#EDEBE4]/80 mb-1.5" />
          <div className="h-1.5 w-full rounded bg-[#EDEBE4]/15 mb-0.5" />
          <div className="h-1.5 w-5/6 rounded bg-[#EDEBE4]/15 mb-2" />
          <div className="h-4 w-10 rounded bg-[#6B9FD8]" />
        </div>
      </div>
    </div>
  );
}

function ModePreviewAuto() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-1">
        <div className="flex-1 flex items-center justify-center bg-[#FAFAF7] px-3">
          <div className="w-full max-w-[80px]">
            <div className="h-2 w-3/4 rounded bg-[#1A1916]/80 mb-1.5" />
            <div className="h-1.5 w-full rounded bg-[#1A1916]/15 mb-0.5" />
            <div className="h-4 w-10 rounded bg-[#2B6CB0] mt-1.5" />
          </div>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 flex items-center justify-center bg-[#0E0E0D] px-3">
          <div className="w-full max-w-[80px]">
            <div className="h-2 w-3/4 rounded bg-[#EDEBE4]/80 mb-1.5" />
            <div className="h-1.5 w-full rounded bg-[#EDEBE4]/15 mb-0.5" />
            <div className="h-4 w-10 rounded bg-[#6B9FD8] mt-1.5" />
          </div>
        </div>
      </div>
      <div className="text-center py-1 bg-surface-alt border-t border-border">
        <span
          className="text-[9px] text-text-subtle tracking-wider uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          follows OS
        </span>
      </div>
    </div>
  );
}

const MODES = [
  {
    value: 'light',
    name: 'Light',
    description: 'A single light theme with warm off-white surfaces.',
    preview: <ModePreviewLight />,
  },
  {
    value: 'dark',
    name: 'Dark',
    description: 'A single dark theme with near-black surfaces.',
    preview: <ModePreviewDark />,
  },
  {
    value: 'dual',
    name: 'Dual',
    description: 'Both light and dark themes, user-toggled.',
    preview: <ModePreviewDual />,
  },
  {
    value: 'auto',
    name: 'Auto',
    description: 'Both themes, defaulting to OS preference.',
    preview: <ModePreviewAuto />,
  },
];

export default function StepMode() {
  const { state, updateWizard } = useApp();
  const mode = state.wizardState.mode;

  return (
    <StepSection
      id="step-mode"
      stepNumber={7}
      totalSteps={13}
      label="Mode"
      title="Light, dark, or both?"
      help="Choose how the product handles colour modes. This affects every surface and text colour."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {MODES.map((m) => (
          <ChoiceCard
            key={m.value}
            selected={mode === m.value}
            onClick={() => updateWizard('mode', m.value)}
            previewHeight="tall"
            preview={m.preview}
            name={m.name}
            description={m.description}
          />
        ))}
      </div>
    </StepSection>
  );
}
