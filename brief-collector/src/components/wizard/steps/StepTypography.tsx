'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/context';
import { StepSection, SubStep } from '@/components/ui/StepSection';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { getAllExtractedFonts } from '@/lib/extraction';
import { useFieldHasTension } from '@/lib/tension-context';

const DISPLAY_OPTIONS = [
  {
    value: 'elegant-serif',
    name: 'Elegant serif',
    description: 'Refined, high-contrast serif with delicate details.',
    fontFamily: "'Fraunces', 'Georgia', serif",
    weight: 300,
    style: 'italic' as const,
    sample: 'Refined clarity',
  },
  {
    value: 'classic-serif',
    name: 'Classic serif',
    description: 'Traditional, authoritative serif with sturdy forms.',
    fontFamily: "'Playfair Display', 'Georgia', serif",
    weight: 500,
    style: 'normal' as const,
    sample: 'Timeless form',
  },
  {
    value: 'grotesque-sans',
    name: 'Grotesque sans',
    description: 'Sharp, modern geometric sans for technical products.',
    fontFamily: "'Space Grotesk', 'Arial', sans-serif",
    weight: 700,
    style: 'normal' as const,
    sample: 'Built to scale',
  },
  {
    value: 'humanist-sans',
    name: 'Humanist sans',
    description: 'Warm, approachable sans with open counters.',
    fontFamily: "'Manrope', 'Helvetica Neue', sans-serif",
    weight: 600,
    style: 'normal' as const,
    sample: 'Friendly & clear',
  },
  {
    value: 'display-impact',
    name: 'Display impact',
    description: 'Bold, oversized display type for maximum presence.',
    fontFamily: "'Manrope', 'Impact', sans-serif",
    weight: 800,
    style: 'normal' as const,
    sample: 'MAKE IT LOUD',
  },
];

const BODY_OPTIONS = [
  {
    value: 'refined-sans',
    name: 'Refined sans',
    description: 'Clean, tight-set sans-serif for dense UI text.',
    fontFamily: "'Inter Tight', 'Inter', sans-serif",
    weight: 400,
    sample:
      'A refined sans that reads clearly at small sizes across dense interfaces and long-form content.',
  },
  {
    value: 'warm-sans',
    name: 'Warm sans',
    description: 'Friendly, slightly rounded sans for approachable text.',
    fontFamily: "'Manrope', 'Helvetica Neue', sans-serif",
    weight: 400,
    sample:
      'A warm, humanist sans-serif that feels friendly and approachable in body copy and UI labels.',
  },
  {
    value: 'text-serif',
    name: 'Text serif',
    description: 'Readable serif for editorial and long-form content.',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    weight: 400,
    sample:
      'A sturdy text serif for editorial layouts, long reads, and products with a literary sensibility.',
  },
];

function TypePreview({
  fontFamily,
  weight,
  style,
  sample,
  size,
}: {
  fontFamily: string;
  weight: number;
  style?: string;
  sample: string;
  size: 'display' | 'body';
}) {
  return (
    <div className="h-full flex items-center px-5 bg-surface-alt/50">
      <p
        className={`m-0 leading-snug ${size === 'display' ? 'text-[22px] tracking-tight' : 'text-[13px] leading-relaxed text-text-muted'}`}
        style={{
          fontFamily,
          fontWeight: weight,
          fontStyle: style || 'normal',
        }}
      >
        {sample}
      </p>
    </div>
  );
}

export default function StepTypography() {
  const { state, updateNestedWizard, updateWizard } = useApp();
  const typography = state.wizardState.typography;
  const extractions = state.wizardState.extractions;
  const displayHasTension = useFieldHasTension('typography.display');

  const extractedFonts = useMemo(
    () => getAllExtractedFonts(extractions.results),
    [extractions.results]
  );

  const displayFonts = extractedFonts.filter(
    (f) => f.role === 'display' || f.role === 'accent'
  );
  const bodyFonts = extractedFonts.filter(
    (f) => f.role === 'body' || f.role === 'mono'
  );
  // If none matched roles, show all as suggestions
  const hasRoleMatch = displayFonts.length > 0 || bodyFonts.length > 0;
  const allFonts = hasRoleMatch ? [] : extractedFonts;

  return (
    <StepSection
      id="step-typography"
      stepNumber={6}
      totalSteps={13}
      label="Typography"
      title="Set the typographic tone"
      help="Choose the personality for headings and body text. These set the default font pairings."
    >
      {/* Extracted fonts section */}
      {extractedFonts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Identified from your references
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] text-text-subtle">
                {extractions.useExtractedFonts ? 'Using identified' : 'Ignored'}
              </span>
              <button
                onClick={() =>
                  updateWizard('extractions', {
                    ...extractions,
                    useExtractedFonts: !extractions.useExtractedFonts,
                  })
                }
                className={`w-9 h-5 rounded-full relative transition-colors ${
                  extractions.useExtractedFonts ? 'bg-accent' : 'bg-border-strong'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    extractions.useExtractedFonts ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </button>
            </label>
          </div>

          {extractions.useExtractedFonts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {(hasRoleMatch ? [...displayFonts, ...bodyFonts] : allFonts).map(
                (font, i) => {
                  const fontValue = `extracted:${font.googleFontsMatch || font.name}`;
                  const isSelected =
                    typography.display === fontValue ||
                    typography.body === fontValue;

                  return (
                    <div
                      key={`${font.name}-${i}`}
                      className={`bg-surface border rounded-[14px] p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft)]'
                          : 'border-border hover:border-border-strong'
                      }`}
                      onClick={() => {
                        // Set as display or body depending on the font's role
                        if (
                          font.role === 'body' ||
                          font.role === 'mono'
                        ) {
                          updateNestedWizard(
                            'typography',
                            'body',
                            fontValue
                          );
                        } else {
                          updateNestedWizard(
                            'typography',
                            'display',
                            fontValue
                          );
                        }
                      }}
                    >
                      <p
                        className="text-xl leading-tight mb-2 text-text"
                        style={{
                          fontFamily: `'${font.googleFontsMatch || font.name}', sans-serif`,
                          fontWeight: parseInt(font.weight || '400'),
                          fontStyle: font.style || 'normal',
                        }}
                      >
                        {font.googleFontsMatch || font.name}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {font.role && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded font-medium">
                            {font.role}
                          </span>
                        )}
                        {font.confidence != null && (
                          <span className="text-[10px] text-text-subtle">
                            {Math.round(font.confidence * 100)}% match
                          </span>
                        )}
                        {font.weight && (
                          <span
                            className="text-[10px] text-text-subtle"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            w{font.weight}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      <SubStep
        title="Display type personality"
        help="Used for headings, hero text, and page titles."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DISPLAY_OPTIONS.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={typography.display === opt.value}
              onClick={() =>
                updateNestedWizard('typography', 'display', opt.value)
              }
              previewHeight="normal"
              preview={
                <TypePreview
                  fontFamily={opt.fontFamily}
                  weight={opt.weight}
                  style={opt.style}
                  sample={opt.sample}
                  size="display"
                />
              }
              name={opt.name}
              description={opt.description}
              hasTension={typography.display === opt.value && displayHasTension}
            />
          ))}
        </div>
      </SubStep>

      <SubStep
        title="Body type personality"
        help="Used for paragraphs, labels, and UI text."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BODY_OPTIONS.map((opt) => (
            <ChoiceCard
              key={opt.value}
              selected={typography.body === opt.value}
              onClick={() =>
                updateNestedWizard('typography', 'body', opt.value)
              }
              previewHeight="normal"
              preview={
                <TypePreview
                  fontFamily={opt.fontFamily}
                  weight={opt.weight}
                  sample={opt.sample}
                  size="body"
                />
              }
              name={opt.name}
              description={opt.description}
            />
          ))}
        </div>
      </SubStep>
    </StepSection>
  );
}
