'use client';

import { useApp } from '@/lib/context';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { StepSection, SubStep } from '@/components/ui/StepSection';
import { useFieldHasTension } from '@/lib/tension-context';

const TOTAL_STEPS = 13;

const buttonOptions = [
  {
    value: 'rounded',
    name: 'Rounded',
    description: 'Soft corners, friendly feel',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-lg">
          Button
        </div>
      </div>
    ),
  },
  {
    value: 'pill',
    name: 'Pill',
    description: 'Fully rounded, modern & playful',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-full">
          Button
        </div>
      </div>
    ),
  },
  {
    value: 'sharp',
    name: 'Sharp',
    description: 'Square corners, precise & editorial',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-none">
          Button
        </div>
      </div>
    ),
  },
  {
    value: 'text',
    name: 'Text',
    description: 'No background, underline or color only',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <span className="text-accent text-sm font-medium underline underline-offset-4">
          Button
        </span>
      </div>
    ),
  },
];

const densityOptions = [
  {
    value: 'comfortable',
    name: 'Comfortable',
    description: 'Generous whitespace, airy layouts',
    preview: (
      <div className="flex flex-col gap-3 items-center justify-center h-full bg-surface-alt px-6">
        <div className="w-full h-3 bg-border rounded" />
        <div className="w-3/4 h-3 bg-border rounded" />
        <div className="w-full h-3 bg-border rounded" />
      </div>
    ),
  },
  {
    value: 'compact',
    name: 'Compact',
    description: 'Dense, data-rich, efficient',
    preview: (
      <div className="flex flex-col gap-1 items-center justify-center h-full bg-surface-alt px-6">
        <div className="w-full h-2.5 bg-border rounded" />
        <div className="w-3/4 h-2.5 bg-border rounded" />
        <div className="w-full h-2.5 bg-border rounded" />
        <div className="w-5/6 h-2.5 bg-border rounded" />
        <div className="w-full h-2.5 bg-border rounded" />
      </div>
    ),
  },
];

const shadowOptions = [
  {
    value: 'soft',
    name: 'Soft',
    description: 'Diffused, subtle depth',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="w-20 h-14 bg-surface rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)]" />
      </div>
    ),
  },
  {
    value: 'warm',
    name: 'Warm',
    description: 'Coloured tint, cozy feel',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="w-20 h-14 bg-surface rounded-lg shadow-[0_4px_16px_rgba(180,120,60,0.15)]" />
      </div>
    ),
  },
  {
    value: 'sharp',
    name: 'Sharp',
    description: 'Hard-edge offset shadows',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="w-20 h-14 bg-surface rounded-lg shadow-[4px_4px_0px_rgba(0,0,0,0.15)]" />
      </div>
    ),
  },
  {
    value: 'none',
    name: 'None',
    description: 'Flat, border-driven hierarchy',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="w-20 h-14 bg-surface rounded-lg border border-border" />
      </div>
    ),
  },
];

const motionOptions = [
  {
    value: 'snappy',
    name: 'Snappy',
    description: 'Instant, no-nonsense transitions',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="text-2xl font-mono text-text-muted tracking-tight">
          100ms
        </div>
      </div>
    ),
  },
  {
    value: 'considered',
    name: 'Considered',
    description: 'Smooth, purposeful easing',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="text-2xl font-mono text-text-muted tracking-tight">
          250ms
        </div>
      </div>
    ),
  },
  {
    value: 'bouncy',
    name: 'Bouncy',
    description: 'Spring physics, delightful overshoot',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="text-2xl font-mono text-text-muted tracking-tight">
          ~
        </div>
      </div>
    ),
  },
  {
    value: 'luxe',
    name: 'Luxe',
    description: 'Slow, cinematic reveals',
    preview: (
      <div className="flex items-center justify-center h-full bg-surface-alt">
        <div className="text-2xl font-mono text-text-muted tracking-tight">
          600ms
        </div>
      </div>
    ),
  },
];

export default function StepShape() {
  const { state, updateNestedWizard } = useApp();
  const { shape } = state.wizardState;
  const buttonTension = useFieldHasTension('shape.button');
  const shadowTension = useFieldHasTension('shape.shadow');
  const motionTension = useFieldHasTension('shape.motion');
  const densityTension = useFieldHasTension('shape.density');

  return (
    <StepSection
      id="step-shape"
      stepNumber={8}
      totalSteps={TOTAL_STEPS}
      label="Shape & Feel"
      title="Shape & feel"
      help="How does the interface feel in your hands? These choices affect every surface, button, and interaction."
    >
      <SubStep title="Button shape" help="Pick the default button style.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {buttonOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={shape.button === opt.value}
              hasTension={shape.button === opt.value && buttonTension}
              onClick={() => updateNestedWizard('shape', 'button', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Density" help="How tightly packed should content be?">
        <div className="grid grid-cols-2 gap-4 max-w-[480px]">
          {densityOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={shape.density === opt.value}
              hasTension={shape.density === opt.value && densityTension}
              onClick={() => updateNestedWizard('shape', 'density', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Shadow philosophy" help="How should depth and elevation be communicated?">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {shadowOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={shape.shadow === opt.value}
              hasTension={shape.shadow === opt.value && shadowTension}
              onClick={() => updateNestedWizard('shape', 'shadow', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>

      <SubStep title="Motion personality" help="What should transitions and animations feel like?">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {motionOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={shape.motion === opt.value}
              hasTension={shape.motion === opt.value && motionTension}
              onClick={() => updateNestedWizard('shape', 'motion', opt.value)}
              preview={opt.preview}
              previewHeight="short"
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>
    </StepSection>
  );
}
