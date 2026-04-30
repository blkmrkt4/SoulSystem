'use client';

import { useApp } from '@/lib/context';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { StepSection, SubStep } from '@/components/ui/StepSection';

const TOTAL_STEPS = 13;

const primaryNavOptions = [
  {
    value: 'icon-rail',
    name: 'Icon Rail',
    description: 'Narrow vertical strip with icons',
    preview: (
      <div className="flex h-full bg-surface-alt">
        <div className="w-10 bg-surface border-r border-border flex flex-col items-center gap-3 pt-4">
          <div className="w-5 h-5 rounded bg-accent opacity-60" />
          <div className="w-5 h-5 rounded bg-border" />
          <div className="w-5 h-5 rounded bg-border" />
          <div className="w-5 h-5 rounded bg-border" />
        </div>
        <div className="flex-1" />
      </div>
    ),
  },
  {
    value: 'sidebar',
    name: 'Sidebar',
    description: 'Full sidebar with labels and sections',
    preview: (
      <div className="flex h-full bg-surface-alt">
        <div className="w-24 bg-surface border-r border-border flex flex-col gap-1.5 pt-3 px-2">
          <div className="h-3 bg-accent rounded opacity-60 w-full" />
          <div className="h-3 bg-border rounded w-4/5" />
          <div className="h-3 bg-border rounded w-full" />
          <div className="h-3 bg-border rounded w-3/4" />
        </div>
        <div className="flex-1" />
      </div>
    ),
  },
  {
    value: 'top-bar',
    name: 'Top Bar',
    description: 'Horizontal nav across the top',
    preview: (
      <div className="flex flex-col h-full bg-surface-alt">
        <div className="h-9 bg-surface border-b border-border flex items-center gap-3 px-3">
          <div className="w-8 h-3 bg-accent rounded opacity-60" />
          <div className="w-8 h-3 bg-border rounded" />
          <div className="w-8 h-3 bg-border rounded" />
          <div className="w-8 h-3 bg-border rounded" />
        </div>
        <div className="flex-1" />
      </div>
    ),
  },
  {
    value: 'bottom-tabs',
    name: 'Bottom Tabs',
    description: 'Tab bar at the bottom (mobile-native)',
    preview: (
      <div className="flex flex-col h-full bg-surface-alt">
        <div className="flex-1" />
        <div className="h-10 bg-surface border-t border-border flex items-center justify-around px-3">
          <div className="w-5 h-5 rounded bg-accent opacity-60" />
          <div className="w-5 h-5 rounded bg-border" />
          <div className="w-5 h-5 rounded bg-border" />
          <div className="w-5 h-5 rounded bg-border" />
        </div>
      </div>
    ),
  },
  {
    value: 'cmdk',
    name: 'Cmd+K',
    description: 'Command palette driven, minimal chrome',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="w-28 bg-surface border border-border rounded-lg shadow-sm p-2">
          <div className="h-3 bg-border rounded mb-2 w-full" />
          <div className="h-2.5 bg-accent/20 rounded w-full mb-1" />
          <div className="h-2.5 bg-border/40 rounded w-4/5 mb-1" />
          <div className="h-2.5 bg-border/40 rounded w-full" />
        </div>
      </div>
    ),
  },
];

const tooltipOptions = [
  {
    value: 'delayed',
    name: 'Delayed',
    description: 'Shows after a short hover pause',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-text-muted font-mono">~400ms</div>
          <div className="px-3 py-1 bg-text text-surface text-xs rounded">Tooltip</div>
        </div>
      </div>
    ),
  },
  {
    value: 'instant',
    name: 'Instant',
    description: 'Appears immediately on hover',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-text-muted font-mono">0ms</div>
          <div className="px-3 py-1 bg-text text-surface text-xs rounded">Tooltip</div>
        </div>
      </div>
    ),
  },
  {
    value: 'popover',
    name: 'Popover',
    description: 'Rich content with actions',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="px-3 py-2 bg-surface border border-border rounded-lg shadow-sm">
          <div className="text-xs font-medium text-text mb-1">Title</div>
          <div className="text-[10px] text-text-muted">Description text</div>
        </div>
      </div>
    ),
  },
  {
    value: 'none',
    name: 'None',
    description: 'No tooltips, rely on labels',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="text-xs text-text-subtle font-mono">--</div>
      </div>
    ),
  },
];

const mobileOptions = [
  {
    value: 'bottom-tabs-mobile',
    name: 'Bottom Tabs',
    description: 'Persistent tab bar at the bottom',
    preview: (
      <div className="flex flex-col h-full bg-surface-alt mx-auto w-20">
        <div className="flex-1 bg-surface border-x border-t border-border rounded-t-lg mt-2" />
        <div className="h-7 bg-surface border border-border flex items-center justify-around">
          <div className="w-3 h-3 rounded-sm bg-accent opacity-60" />
          <div className="w-3 h-3 rounded-sm bg-border" />
          <div className="w-3 h-3 rounded-sm bg-border" />
        </div>
      </div>
    ),
  },
  {
    value: 'hamburger',
    name: 'Hamburger',
    description: 'Slide-out menu behind a burger icon',
    preview: (
      <div className="flex flex-col h-full bg-surface-alt mx-auto w-20">
        <div className="h-7 bg-surface border-x border-t border-border rounded-t-lg mt-2 flex items-center px-2">
          <div className="flex flex-col gap-[3px]">
            <div className="w-4 h-[2px] bg-text" />
            <div className="w-4 h-[2px] bg-text" />
            <div className="w-3 h-[2px] bg-text" />
          </div>
        </div>
        <div className="flex-1 bg-surface border-x border-b border-border" />
      </div>
    ),
  },
  {
    value: 'rail-collapses',
    name: 'Rail Collapses',
    description: 'Desktop rail collapses to icons on mobile',
    preview: (
      <div className="flex h-full bg-surface-alt mx-auto w-20">
        <div className="w-6 bg-surface border-r border-border flex flex-col items-center gap-2 pt-3">
          <div className="w-3 h-3 rounded-sm bg-accent opacity-60" />
          <div className="w-3 h-3 rounded-sm bg-border" />
          <div className="w-3 h-3 rounded-sm bg-border" />
        </div>
        <div className="flex-1" />
      </div>
    ),
  },
];

export default function StepNavigation() {
  const { state, updateNestedWizard } = useApp();
  const { navigation } = state.wizardState;

  return (
    <StepSection
      id="step-navigation"
      stepNumber={9}
      totalSteps={TOTAL_STEPS}
      label="Navigation"
      title="Navigation"
      help="How do users move through the app? Pick a primary pattern, tooltip behaviour, and mobile adaptation."
    >
      <SubStep title="Primary navigation" help="The main way users navigate between sections.">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {primaryNavOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={navigation.primary === opt.value}
              onClick={() => updateNestedWizard('navigation', 'primary', opt.value)}
              preview={opt.preview}
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Tooltip behaviour" help="How should tooltips appear on hover?">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tooltipOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={navigation.tooltip === opt.value}
              onClick={() => updateNestedWizard('navigation', 'tooltip', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Mobile pattern" help="How does navigation adapt on smaller screens?">
        <div className="grid grid-cols-3 gap-4 max-w-[600px]">
          {mobileOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={navigation.mobile === opt.value}
              onClick={() => updateNestedWizard('navigation', 'mobile', opt.value)}
              preview={opt.preview}
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>
    </StepSection>
  );
}
