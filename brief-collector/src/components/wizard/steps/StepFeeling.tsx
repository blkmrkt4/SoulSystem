'use client';

import { useApp } from '@/lib/context';
import { StepSection } from '@/components/ui/StepSection';

const TAGS = [
  'calm',
  'trustworthy',
  'bold',
  'playful',
  'serious',
  'luxurious',
  'technical',
  'friendly',
  'energetic',
  'contemplative',
  'sharp',
  'soft',
  'warm',
  'precise',
  'organic',
];

const MAX_SELECTIONS = 3;

export default function StepFeeling() {
  const { state, updateWizard } = useApp();
  const feeling = state.wizardState.feeling;

  const toggle = (tag: string) => {
    if (feeling.includes(tag)) {
      updateWizard(
        'feeling',
        feeling.filter((t) => t !== tag)
      );
    } else if (feeling.length < MAX_SELECTIONS) {
      updateWizard('feeling', [...feeling, tag]);
    }
  };

  return (
    <StepSection
      id="step-feeling"
      stepNumber={4}
      totalSteps={13}
      label="Feeling"
      title="How should the product feel?"
      help={`Pick up to ${MAX_SELECTIONS} words that describe the emotional quality.`}
    >
      <div className="flex flex-wrap gap-2.5">
        {TAGS.map((tag) => {
          const selected = feeling.includes(tag);
          const disabled = !selected && feeling.length >= MAX_SELECTIONS;

          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              disabled={disabled}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150
                ${
                  selected
                    ? 'bg-accent text-white border-accent shadow-sm'
                    : disabled
                      ? 'bg-surface border-border text-text-subtle opacity-40 cursor-not-allowed'
                      : 'bg-surface border-border text-text hover:border-border-strong hover:bg-surface-alt cursor-pointer'
                }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      {feeling.length > 0 && (
        <p className="mt-4 text-xs text-text-muted">
          Selected: {feeling.join(', ')} ({feeling.length}/{MAX_SELECTIONS})
        </p>
      )}
    </StepSection>
  );
}
