'use client';

import { useApp } from '@/lib/context';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { StepSection, SubStep } from '@/components/ui/StepSection';

const TOTAL_STEPS = 13;

const scopeOptions = [
  {
    value: 'full',
    name: 'Full',
    description: 'Complete admin dashboard with all features',
    preview: (
      <div className="flex h-full bg-surface-alt">
        <div className="w-16 bg-surface border-r border-border flex flex-col gap-1 pt-2 px-1">
          <div className="h-2 bg-accent/40 rounded w-full" />
          <div className="h-2 bg-border rounded w-4/5" />
          <div className="h-2 bg-border rounded w-full" />
          <div className="h-2 bg-border rounded w-3/4" />
          <div className="h-2 bg-border rounded w-full" />
        </div>
        <div className="flex-1 p-2">
          <div className="h-2 bg-border rounded w-1/2 mb-2" />
          <div className="grid grid-cols-2 gap-1">
            <div className="h-6 bg-surface border border-border rounded" />
            <div className="h-6 bg-surface border border-border rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    value: 'minimal',
    name: 'Minimal',
    description: 'Essential settings only, lightweight',
    preview: (
      <div className="flex flex-col h-full bg-surface-alt p-3 justify-center">
        <div className="space-y-2">
          <div className="h-2 bg-border rounded w-1/3" />
          <div className="h-5 bg-surface border border-border rounded w-full" />
          <div className="h-2 bg-border rounded w-1/4" />
          <div className="h-5 bg-surface border border-border rounded w-full" />
        </div>
      </div>
    ),
  },
  {
    value: 'none',
    name: 'None',
    description: 'No admin panel needed',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="text-xl text-text-subtle font-mono">--</div>
      </div>
    ),
  },
];

const extraSections = [
  { value: 'feature-flags', label: 'Feature Flags', description: 'Toggle features per user or environment' },
  { value: 'branding', label: 'Branding', description: 'Logo, colours, and white-labelling' },
  { value: 'audit-log', label: 'Audit Log', description: 'Track who did what and when' },
  { value: 'webhooks', label: 'Webhooks', description: 'Outbound event notifications' },
  { value: 'api-keys', label: 'API Keys', description: 'Manage keys for external integrations' },
  { value: 'email', label: 'Email Templates', description: 'Transactional email configuration' },
  { value: 'jobs', label: 'Background Jobs', description: 'Monitor queues and scheduled tasks' },
];

export default function StepAdmin() {
  const { state, updateNestedWizard, updateWizard } = useApp();
  const { admin, anythingElse } = state.wizardState;

  const toggleExtra = (value: string) => {
    const next = admin.extras.includes(value)
      ? admin.extras.filter((e) => e !== value)
      : [...admin.extras, value];
    updateNestedWizard('admin', 'extras', next);
  };

  return (
    <StepSection
      id="step-admin"
      stepNumber={13}
      totalSteps={TOTAL_STEPS}
      label="Admin"
      title="Admin & wrap-up"
      help="Define the admin experience and share anything else we should know."
    >
      <SubStep title="Admin scope" help="How much admin functionality does this project need?">
        <div className="grid grid-cols-3 gap-4 max-w-[600px]">
          {scopeOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={admin.scope === opt.value}
              onClick={() => updateNestedWizard('admin', 'scope', opt.value)}
              preview={opt.preview}
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Optional admin sections" help="Pick any extra sections the admin panel should include.">
        <div className="flex flex-wrap gap-2 max-w-[620px]">
          {extraSections.map((section) => {
            const selected = admin.extras.includes(section.value);
            return (
              <button
                key={section.value}
                onClick={() => toggleExtra(section.value)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm transition-all duration-150
                  ${
                    selected
                      ? 'bg-accent-soft border-accent text-accent font-medium'
                      : 'bg-surface border-border text-text-muted hover:border-border-strong hover:text-text'
                  }`}
              >
                {selected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {section.label}
              </button>
            );
          })}
        </div>
        {admin.extras.length > 0 && (
          <div className="mt-3 text-xs text-text-subtle">
            {admin.extras.length} section{admin.extras.length !== 1 ? 's' : ''} selected
          </div>
        )}
      </SubStep>

      <SubStep title="Anything else" help="Anything we missed? Final thoughts, edge cases, dreams, concerns -- all welcome.">
        <textarea
          value={anythingElse}
          onChange={(e) => updateWizard('anythingElse', e.target.value)}
          placeholder="e.g. We need to support RTL languages, the CEO loves dark mode, we have an existing Figma file at..."
          rows={5}
          className="w-full max-w-[620px] px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] transition-all resize-y"
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </SubStep>
    </StepSection>
  );
}
