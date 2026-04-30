'use client';

import { useApp } from '@/lib/context';
import { StepSection } from '@/components/ui/StepSection';

const TOTAL_STEPS = 13;

interface RuleItem {
  key: string;
  name: string;
  description: string;
  previewClass: string;
  locked?: boolean;
}

const rules: RuleItem[] = [
  {
    key: 'glassmorphism',
    name: 'Glassmorphism',
    description: 'Frosted-glass backgrounds with blur and transparency',
    previewClass: 'pp-glass',
  },
  {
    key: 'gradient-text',
    name: 'Gradient Text',
    description: 'Text filled with colour gradients',
    previewClass: 'pp-gradient-text',
  },
  {
    key: 'glow',
    name: 'Glow Effects',
    description: 'Luminous halos around elements',
    previewClass: 'pp-glow',
  },
  {
    key: 'centered',
    name: 'Centered Layout',
    description: 'Content centred on the page with max-width',
    previewClass: 'pp-centered',
  },
  {
    key: 'bouncy',
    name: 'Bouncy Animations',
    description: 'Spring physics with playful overshoot',
    previewClass: 'pp-bouncy',
  },
  {
    key: 'pure-bw',
    name: 'Pure B&W',
    description: 'Strictly black and white, no grays',
    previewClass: 'pp-pure',
  },
  {
    key: 'inter',
    name: 'Inter Everywhere',
    description: 'Use Inter for all text, no display font',
    previewClass: 'pp-inter',
  },
  {
    key: 'side-tab',
    name: 'Side Tabs',
    description: 'Vertical tab navigation within sections',
    previewClass: 'pp-side-tab',
  },
  {
    key: 'icon-tile',
    name: 'Icon Tiles',
    description: 'Large tappable icon grid for actions',
    previewClass: 'pp-icon-tile',
  },
  {
    key: 'modals',
    name: 'Modal Dialogs',
    description: 'Pop-up dialogs for confirmations and forms',
    previewClass: 'pp-modal',
  },
  {
    key: 'nested-cards',
    name: 'Nested Cards',
    description: 'Cards inside cards -- always enabled',
    previewClass: 'pp-cardceptn',
    locked: true,
  },
];

const alwaysOnRules = ['nested-cards'];

function RulePreview({ className }: { className: string }) {
  if (className === 'pp-glass') {
    return (
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/40 to-white/10 border border-white/30 backdrop-blur-sm shadow-sm" />
    );
  }
  if (className === 'pp-gradient-text') {
    return (
      <div
        className="text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text"
        style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
      >
        Abc
      </div>
    );
  }
  if (className === 'pp-glow') {
    return (
      <div className="w-8 h-8 rounded-full bg-accent/60 shadow-[0_0_12px_4px_var(--color-accent-soft)]" />
    );
  }
  if (className === 'pp-centered') {
    return (
      <div className="w-10 h-10 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-dashed border-border rounded flex items-center justify-center">
          <div className="w-2 h-2 bg-accent rounded-sm" />
        </div>
      </div>
    );
  }
  if (className === 'pp-bouncy') {
    return (
      <div className="w-6 h-6 rounded-full bg-accent animate-bounce" style={{ animationDuration: '0.6s' }} />
    );
  }
  if (className === 'pp-pure') {
    return (
      <div className="w-10 h-10 flex">
        <div className="pp-pure-l w-5 h-10 bg-black rounded-l" />
        <div className="pp-pure-d w-5 h-10 bg-white border border-border rounded-r" />
      </div>
    );
  }
  if (className === 'pp-inter') {
    return (
      <div className="text-sm font-medium text-text" style={{ fontFamily: 'Inter, sans-serif' }}>
        Aa
      </div>
    );
  }
  if (className === 'pp-side-tab') {
    return (
      <div className="flex w-10 h-10">
        <div className="w-3 bg-surface border-r border-border flex flex-col gap-1 pt-1 items-center">
          <div className="w-1.5 h-1.5 bg-accent rounded-sm" />
          <div className="w-1.5 h-1.5 bg-border rounded-sm" />
          <div className="w-1.5 h-1.5 bg-border rounded-sm" />
        </div>
        <div className="flex-1 bg-surface-alt" />
      </div>
    );
  }
  if (className === 'pp-icon-tile') {
    return (
      <div className="grid grid-cols-2 gap-0.5 w-10 h-10">
        <div className="bg-accent/20 rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-accent rounded-sm" />
        </div>
        <div className="bg-border/30 rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-border rounded-sm" />
        </div>
        <div className="bg-border/30 rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-border rounded-sm" />
        </div>
        <div className="bg-border/30 rounded-sm flex items-center justify-center">
          <div className="w-2 h-2 bg-border rounded-sm" />
        </div>
      </div>
    );
  }
  if (className === 'pp-modal') {
    return (
      <div className="w-10 h-10 relative flex items-center justify-center bg-surface-alt rounded">
        <div className="absolute inset-0 bg-text/10 rounded" />
        <div className="w-7 h-5 bg-surface border border-border rounded shadow-sm relative z-10" />
      </div>
    );
  }
  if (className === 'pp-cardceptn') {
    return (
      <div className="w-10 h-10 bg-surface border border-border rounded p-1">
        <div className="w-full h-full bg-surface-alt border border-border rounded" />
      </div>
    );
  }
  return <div className="w-10 h-10 bg-border/20 rounded" />;
}

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        ${checked ? 'bg-accent' : 'bg-border'}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

export default function StepRules() {
  const { state, updateWizard } = useApp();
  const currentRules = state.wizardState.rules;

  const toggleRule = (key: string) => {
    updateWizard('rules', {
      ...currentRules,
      [key]: !currentRules[key],
    });
  };

  return (
    <StepSection
      id="step-rules"
      stepNumber={11}
      totalSteps={TOTAL_STEPS}
      label="Rules"
      title="Negotiable rules"
      help="Toggle design patterns on or off. These are preferences, not hard constraints -- they help set the tone."
    >
      <div className="space-y-1 max-w-[700px]">
        {rules.map((rule) => {
          const isLocked = rule.locked === true;
          const isChecked = isLocked ? true : !!currentRules[rule.key];

          return (
            <div
              key={rule.key}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-surface transition-colors
                ${isLocked ? 'opacity-40' : 'hover:border-border-strong'}
              `}
            >
              <div className="shrink-0 w-10 h-10 flex items-center justify-center">
                <RulePreview className={rule.previewClass} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text">{rule.name}</div>
                <div className="text-xs text-text-muted">{rule.description}</div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className={`text-[10px] font-medium ${
                  isLocked
                    ? 'text-text-subtle'
                    : isChecked
                    ? 'text-emerald-600'
                    : 'text-text-subtle'
                }`}>
                  {isLocked ? 'Always banned' : isChecked ? 'Allowed' : 'Banned'}
                </span>
                <ToggleSwitch
                  checked={isChecked}
                  onChange={() => toggleRule(rule.key)}
                  disabled={isLocked}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 max-w-[700px] px-4 py-3 bg-surface-alt border border-border rounded-xl">
        <div
          className="text-[11px] text-text-subtle uppercase tracking-widest mb-1"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Always on
        </div>
        <p className="text-xs text-text-muted m-0">
          <span className="font-medium text-text">Nested cards</span> -- cards inside cards is always enabled and cannot be turned off.
        </p>
      </div>
    </StepSection>
  );
}
