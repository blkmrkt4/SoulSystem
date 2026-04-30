'use client';

import { useApp } from '@/lib/context';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { StepSection, SubStep } from '@/components/ui/StepSection';

const TOTAL_STEPS = 13;

const formOptions = [
  {
    value: 'stacked',
    name: 'Stacked',
    description: 'Labels above inputs, one per row',
    preview: (
      <div className="flex flex-col gap-2 p-4 h-full bg-surface-alt justify-center">
        <div className="h-2 w-10 bg-text-subtle rounded" />
        <div className="h-5 w-full bg-surface border border-border rounded" />
        <div className="h-2 w-12 bg-text-subtle rounded" />
        <div className="h-5 w-full bg-surface border border-border rounded" />
      </div>
    ),
  },
  {
    value: 'inline',
    name: 'Inline',
    description: 'Label and input side by side',
    preview: (
      <div className="flex flex-col gap-2 p-4 h-full bg-surface-alt justify-center">
        <div className="flex items-center gap-2">
          <div className="h-2 w-10 bg-text-subtle rounded shrink-0" />
          <div className="h-5 flex-1 bg-surface border border-border rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-12 bg-text-subtle rounded shrink-0" />
          <div className="h-5 flex-1 bg-surface border border-border rounded" />
        </div>
      </div>
    ),
  },
  {
    value: 'floating',
    name: 'Floating',
    description: 'Label floats inside the input',
    preview: (
      <div className="flex flex-col gap-2 p-4 h-full bg-surface-alt justify-center">
        <div className="h-7 w-full bg-surface border border-border rounded relative">
          <span className="absolute top-0.5 left-2 text-[8px] text-text-subtle">Label</span>
        </div>
        <div className="h-7 w-full bg-surface border border-border rounded relative">
          <span className="absolute top-0.5 left-2 text-[8px] text-text-subtle">Label</span>
        </div>
      </div>
    ),
  },
];

const emptyOptions = [
  {
    value: 'text-cta',
    name: 'Text + CTA',
    description: 'Simple message with an action button',
    preview: (
      <div className="flex flex-col items-center justify-center h-full bg-surface-alt gap-2">
        <div className="text-xs text-text-muted">No items yet</div>
        <div className="px-3 py-1 bg-accent text-white text-[10px] rounded">Create one</div>
      </div>
    ),
  },
  {
    value: 'illustrated',
    name: 'Illustrated',
    description: 'Illustration or icon with explanation',
    preview: (
      <div className="flex flex-col items-center justify-center h-full bg-surface-alt gap-2">
        <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center">
          <div className="w-5 h-5 rounded bg-accent/30" />
        </div>
        <div className="text-[10px] text-text-muted">Nothing here</div>
      </div>
    ),
  },
  {
    value: 'skeleton',
    name: 'Skeleton',
    description: 'Ghost rows hinting at future content',
    preview: (
      <div className="flex flex-col gap-2 p-4 h-full bg-surface-alt justify-center">
        <div className="h-4 w-full bg-border/50 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-border/30 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-border/20 rounded animate-pulse" />
      </div>
    ),
  },
];

const loadingOptions = [
  {
    value: 'skeleton',
    name: 'Skeleton',
    description: 'Placeholder shimmer matching layout',
    preview: (
      <div className="flex flex-col gap-2 p-4 h-full bg-surface-alt justify-center">
        <div className="h-3 w-full bg-border/40 rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-border/30 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-border/40 rounded animate-pulse" />
      </div>
    ),
  },
  {
    value: 'spinner',
    name: 'Spinner',
    description: 'Centered spinning indicator',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    ),
  },
  {
    value: 'progress',
    name: 'Progress',
    description: 'Horizontal bar showing completion',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt px-6">
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div className="w-3/5 h-full bg-accent rounded-full" />
        </div>
      </div>
    ),
  },
  {
    value: 'overlay',
    name: 'Overlay',
    description: 'Full-screen or section overlay',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt relative">
        <div className="absolute inset-0 bg-surface/60" />
        <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin relative z-10" />
      </div>
    ),
  },
];

const notificationOptions = [
  {
    value: 'toast',
    name: 'Toast',
    description: 'Floating message, auto-dismisses',
    preview: (
      <div className="flex items-end justify-end h-full bg-surface-alt p-3">
        <div className="px-3 py-2 bg-surface border border-border rounded-lg shadow-sm">
          <div className="text-[10px] text-text">Saved</div>
        </div>
      </div>
    ),
  },
  {
    value: 'banner',
    name: 'Banner',
    description: 'Full-width strip at top or bottom',
    preview: (
      <div className="flex flex-col h-full bg-surface-alt">
        <div className="h-7 bg-accent-soft border-b border-accent/20 flex items-center px-3">
          <div className="text-[10px] text-accent font-medium">Update available</div>
        </div>
        <div className="flex-1" />
      </div>
    ),
  },
  {
    value: 'inline',
    name: 'Inline',
    description: 'Message appears in context',
    preview: (
      <div className="flex flex-col gap-2 p-4 h-full bg-surface-alt justify-center">
        <div className="h-4 w-full bg-border/40 rounded" />
        <div className="px-2 py-1.5 bg-accent-soft/50 border border-accent/20 rounded text-[10px] text-accent">
          Field updated
        </div>
        <div className="h-4 w-3/4 bg-border/40 rounded" />
      </div>
    ),
  },
  {
    value: 'modal',
    name: 'Modal',
    description: 'Dialog for important alerts',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt relative">
        <div className="absolute inset-0 bg-text/10" />
        <div className="px-4 py-3 bg-surface border border-border rounded-lg shadow-lg relative z-10">
          <div className="text-[10px] font-medium text-text">Alert</div>
        </div>
      </div>
    ),
  },
];

export default function StepComponents() {
  const { state, updateNestedWizard, updateWizard } = useApp();
  const { components, hardLimits } = state.wizardState;

  return (
    <StepSection
      id="step-components"
      stepNumber={10}
      totalSteps={TOTAL_STEPS}
      label="Components"
      title="Components"
      help="Define the default patterns for common UI elements. These become your system defaults."
    >
      <SubStep title="Form layout" help="How should form fields be arranged?">
        <div className="grid grid-cols-3 gap-4 max-w-[600px]">
          {formOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={components.form === opt.value}
              onClick={() => updateNestedWizard('components', 'form', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Empty state style" help="What do users see when there's no data?">
        <div className="grid grid-cols-3 gap-4 max-w-[600px]">
          {emptyOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={components.empty === opt.value}
              onClick={() => updateNestedWizard('components', 'empty', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Loading style" help="How should loading states look?">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {loadingOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={components.loading === opt.value}
              onClick={() => updateNestedWizard('components', 'loading', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Notification style" help="How should feedback and alerts be shown?">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {notificationOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={components.notification === opt.value}
              onClick={() => updateNestedWizard('components', 'notification', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Hard limits" help="Any non-negotiable constraints? Maximum bundle size, accessibility standards, browser support, etc.">
        <textarea
          value={hardLimits}
          onChange={(e) => updateWizard('hardLimits', e.target.value)}
          placeholder="e.g. Must support IE11, WCAG AA minimum, no animations for vestibular sensitivity..."
          rows={4}
          className="w-full max-w-[620px] px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all resize-y"
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </SubStep>
    </StepSection>
  );
}
