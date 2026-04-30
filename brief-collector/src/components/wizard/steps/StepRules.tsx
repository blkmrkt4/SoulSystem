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

interface RuleGroup {
  label: string;
  rules: RuleItem[];
}

const RULE_GROUPS: RuleGroup[] = [
  {
    label: 'Visual tells',
    rules: [
      { key: 'glassmorphism', name: 'Glassmorphism', description: 'Frosted-glass backgrounds with blur and transparency', previewClass: 'pp-glass' },
      { key: 'gradient-text', name: 'Gradient text', description: 'Text filled with colour gradients', previewClass: 'pp-gradient-text' },
      { key: 'glow', name: 'Glow effects', description: 'Luminous halos around elements', previewClass: 'pp-glow' },
      { key: 'centered', name: 'Centered layout', description: 'Content centred on the page with max-width', previewClass: 'pp-centered' },
      { key: 'pure-bw', name: 'Pure B&W', description: 'Strictly #000 and #FFF, no tinted neutrals', previewClass: 'pp-pure' },
      { key: 'side-tab', name: 'Side-tab accent', description: 'Thick coloured stripe on one side of a card — the #1 AI tell', previewClass: 'pp-side-tab' },
      { key: 'icon-tile', name: 'Icon tile above heading', description: 'Icon-in-rounded-square stacked above a heading', previewClass: 'pp-icon-tile' },
      { key: 'dark-neon', name: 'Dark mode + neon accents', description: 'Cyan, magenta, electric green over near-black. The "lazy cool" look', previewClass: 'pp-glow' },
      { key: 'emoji-as-icon', name: 'Emoji as icon', description: 'Reaching for emoji when a real icon set should be used', previewClass: '' },
      { key: 'floating-badges', name: 'Floating badge stacks', description: 'Multiple "New" / "Beta" / "Featured" pills above every card', previewClass: '' },
      { key: 'identical-card-grids', name: 'Identical card grids', description: 'Same-sized cards with icon + heading + text repeated endlessly', previewClass: '' },
      { key: 'hero-metric-layout', name: 'Hero metric layout', description: 'Big number, small label, three stats, gradient accent — the AI dashboard default', previewClass: '' },
      { key: 'sparklines-decorative', name: 'Sparklines as decoration', description: 'Tiny charts that look sophisticated but convey no real information', previewClass: '' },
      { key: 'rounded-rect-generic-shadow', name: 'Generic rounded-rect cards', description: 'Rounded rectangles with forgettable drop shadows — the safest, most AI-default shape', previewClass: '' },
      { key: 'three-card-trio', name: 'Three-card feature trio', description: 'Three balanced feature cards immediately under a hero', previewClass: '' },
      { key: 'avatar-initials', name: 'Avatar initials circles', description: 'Auto-generated initial circles as user placeholders — specific to AI dashboards', previewClass: '' },
    ],
  },
  {
    label: 'Typography tells',
    rules: [
      { key: 'inter', name: 'Inter everywhere', description: 'Using Inter for all text — "the Comic Sans of AI"', previewClass: 'pp-inter' },
      { key: 'monospace-as-technical', name: 'Monospace as "technical"', description: 'Using monospace to signal developer vibes instead of real type choices', previewClass: '' },
      { key: 'single-font', name: 'Single font for everything', description: 'One font family across headings, body, labels, buttons — no pairing', previewClass: '' },
      { key: 'flat-type-hierarchy', name: 'Flat type hierarchy', description: 'Heading, subheading, body all at nearly the same size — no contrast', previewClass: '' },
      { key: 'overused-fonts', name: 'Overused AI fonts', description: 'Roboto, Open Sans, Geist, Mona Sans, Plus Jakarta — the monoculture', previewClass: '' },
    ],
  },
  {
    label: 'Motion tells',
    rules: [
      { key: 'bouncy', name: 'Bounce / elastic motion', description: 'Spring physics that feels dated and tacky — use exponential easing instead', previewClass: 'pp-bouncy' },
    ],
  },
  {
    label: 'Interaction tells',
    rules: [
      { key: 'modals', name: 'Modal-heavy interactions', description: 'Modals for non-destructive actions — use side-sheets or inline panels instead', previewClass: 'pp-modal' },
      { key: 'every-button-primary', name: 'Every button is primary', description: 'When everything shouts equally, nothing reads as primary', previewClass: '' },
      { key: 'redundant-ux-writing', name: 'Redundant UX writing', description: 'Label + sublabel + helper text all saying the same thing in different words', previewClass: '' },
      { key: 'amputating-mobile', name: 'Amputating features on mobile', description: '"Not available on mobile" — adapt the interface, don\'t strip it', previewClass: '' },
      { key: 'generic-hero-copy', name: 'Generic hero copy', description: '"Build the Future" / "Boost your productivity" — placeholder phrasing that ships', previewClass: '' },
    ],
  },
  {
    label: 'Hard-locked (always banned)',
    rules: [
      { key: 'nested-cards', name: 'Nested cards', description: 'Cards inside cards inside cards — always banned, not toggleable', previewClass: 'pp-cardceptn', locked: true },
    ],
  },
];

const QUALITY_FLOOR = [
  'No nested cards (cards inside cards)',
  'WCAG AA contrast minimum (4.5:1 body, 3:1 large)',
  'Body text minimum 14px',
  'Line height minimum 1.3 on multi-line text',
  'Letter spacing on body text must not exceed 0.05em',
  'No justified text without hyphenation',
  'Line length capped at 75ch',
  'No gray text on coloured backgrounds',
  'Minimum 8px padding inside bordered containers',
  'No skipped heading levels (h1 → h3 with no h2)',
  'Animate transform/opacity only — never width/height/padding/margin',
  'Every component has empty/loading/error states',
  'If dual mode: both light and dark equally polished from day one',
  'Errors expressed in plain language, not codes',
  'Destructive actions must have undo or escape hatch',
];

const DARK_PATTERNS = [
  'Sycophantic AI agreement — assistant always agrees even when wrong',
  'Unending suggestion loop — no natural endpoint, user never feels done',
  'Sneaking via summarization — AI subtly alters tone or stance during rewriting',
  'Hallucinated dark patterns — model autonomously hides cancel buttons or creates forced continuity',
  'Hidden cancel / opt-out — microscopic gray "no thanks" under a giant accept button',
  'Fake scarcity — dynamically generated "Only 1 item left" messaging',
];

function RulePreview({ className }: { className: string }) {
  if (!className) {
    return (
      <div className="w-full h-full bg-surface-alt rounded flex items-center justify-center text-[10px] text-text-subtle">
        AI
      </div>
    );
  }
  if (className === 'pp-pure') {
    return (
      <div className={className}>
        <div className="pp-pure-l" style={{ height: '50%' }} />
        <div className="pp-pure-d" style={{ height: '50%' }} />
      </div>
    );
  }
  return <div className={`${className} w-full h-full rounded`} />;
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
      onClick={disabled ? undefined : onChange}
      className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-accent' : 'bg-border-strong'}`}
      aria-pressed={checked}
      disabled={disabled}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'left-[18px]' : 'left-0.5'
        }`}
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
      help="Toggle design patterns on or off. Off = banned in this project. On = allowed. The quality floor and dark patterns below are always enforced."
    >
      {/* Toggleable rules by group */}
      {RULE_GROUPS.map((group) => (
        <div key={group.label} className="mb-6">
          <h3 className="text-[11px] font-semibold text-text-subtle uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            {group.label}
          </h3>
          <div className="space-y-1 max-w-[700px]">
            {group.rules.map((rule) => {
              const isLocked = rule.locked === true;
              const isChecked = isLocked ? false : !!currentRules[rule.key];

              return (
                <div
                  key={rule.key}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-surface transition-colors
                    ${isLocked ? 'opacity-40' : 'hover:border-border-strong'}`}
                >
                  <div className="shrink-0 w-10 h-10 flex items-center justify-center overflow-hidden rounded">
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
        </div>
      ))}

      {/* Quality floor */}
      <div className="mt-8 max-w-[700px]">
        <h3 className="text-[11px] font-semibold text-text-subtle uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
          Quality floor — always enforced
        </h3>
        <div className="bg-surface-alt border-l-[3px] border-accent rounded-r-xl px-5 py-4">
          <ul className="m-0 p-0 list-none space-y-1.5">
            {QUALITY_FLOOR.map((item) => (
              <li key={item} className="text-xs text-text-muted flex items-start gap-2">
                <span className="text-accent mt-0.5 shrink-0">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI dark patterns */}
      <div className="mt-6 max-w-[700px]">
        <h3 className="text-[11px] font-semibold text-text-subtle uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
          AI dark patterns — always forbidden
        </h3>
        <div className="bg-red-50 border-l-[3px] border-danger rounded-r-xl px-5 py-4">
          <ul className="m-0 p-0 list-none space-y-1.5">
            {DARK_PATTERNS.map((item) => (
              <li key={item} className="text-xs text-red-700 flex items-start gap-2">
                <span className="text-danger mt-0.5 shrink-0">&#10007;</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </StepSection>
  );
}
