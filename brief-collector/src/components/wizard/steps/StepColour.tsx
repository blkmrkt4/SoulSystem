'use client';

import { useMemo } from 'react';
import { useApp } from '@/lib/context';
import { StepSection, SubStep } from '@/components/ui/StepSection';
import { getAllExtractedColors } from '@/lib/extraction';

const PRESET_COLOURS = [
  { hex: '#2B6CB0', name: 'Slate blue' },
  { hex: '#4A5D5C', name: 'Sage' },
  { hex: '#8B4A2B', name: 'Terracotta' },
  { hex: '#2D5F3F', name: 'Forest' },
  { hex: '#7B5BD8', name: 'Iris' },
  { hex: '#C9A961', name: 'Gold' },
  { hex: '#C73E3E', name: 'Crimson' },
  { hex: '#1A1916', name: 'Near-black' },
  { hex: '#FFE600', name: 'Electric yellow' },
  { hex: '#3A6F8F', name: 'Ocean' },
  { hex: '#6B5544', name: 'Walnut' },
  { hex: '#00A86B', name: 'Emerald' },
];

function isLight(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

function ColourTile({
  hex,
  name,
  selected,
  onClick,
  size = 'normal',
}: {
  hex: string;
  name?: string;
  selected: boolean;
  onClick: () => void;
  size?: 'normal' | 'small';
}) {
  const light = isLight(hex);
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 transition-all duration-150 relative group flex flex-col items-start justify-end overflow-hidden
        ${size === 'small' ? 'h-16' : 'aspect-square'}
        ${
          selected
            ? 'border-text shadow-[0_0_0_2px_var(--color-canvas),0_0_0_4px_var(--color-text)] scale-[1.03]'
            : 'border-transparent hover:scale-[1.03] hover:shadow-md'
        }`}
      style={{ backgroundColor: hex }}
      aria-label={`Select colour ${name || hex}`}
    >
      {selected && (
        <svg
          className={`w-5 h-5 absolute top-2 right-2 ${light ? 'text-black/70' : 'text-white/90'}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
      <div className={`p-2 w-full ${light ? 'text-black/60' : 'text-white/70'}`}>
        {name && (
          <div className="text-[10px] font-medium leading-tight truncate">{name}</div>
        )}
        <div
          className="text-[9px] opacity-70"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {hex}
        </div>
      </div>
    </button>
  );
}

function ColourPickerSection({
  value,
  onChange,
  label,
  extractedColors,
  useExtracted,
  onToggleExtracted,
  presets,
}: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
  extractedColors: { hex: string; name?: string; role?: string }[];
  useExtracted: boolean;
  onToggleExtracted?: (v: boolean) => void;
  presets: { hex: string; name: string }[];
}) {
  const hasExtracted = extractedColors.length > 0;

  return (
    <div>
      {/* Extracted colours */}
      {hasExtracted && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              From your uploads
            </span>
            {onToggleExtracted && (
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] text-text-subtle">
                  {useExtracted ? 'Using extracted' : 'Ignored'}
                </span>
                <button
                  onClick={() => onToggleExtracted(!useExtracted)}
                  className={`w-9 h-5 rounded-full relative transition-colors ${
                    useExtracted ? 'bg-accent' : 'bg-border-strong'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      useExtracted ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
            )}
          </div>
          {useExtracted && (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {extractedColors.map((c, i) => (
                <ColourTile
                  key={`${c.hex}-${i}`}
                  hex={c.hex}
                  name={c.name}
                  selected={value.toUpperCase() === c.hex.toUpperCase()}
                  onClick={() => onChange(c.hex)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Presets */}
      <div className="mb-4">
        {hasExtracted && (
          <span className="block text-xs font-semibold text-text-subtle uppercase tracking-wider mb-2">
            Presets
          </span>
        )}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {presets.map((c) => (
            <ColourTile
              key={c.hex}
              hex={c.hex}
              name={c.name}
              selected={value.toUpperCase() === c.hex.toUpperCase()}
              onClick={() => onChange(c.hex)}
            />
          ))}
        </div>
      </div>

      {/* Custom hex input */}
      <div className="flex items-center gap-3 max-w-xs">
        <label className="text-xs text-text-muted whitespace-nowrap">Custom</label>
        <div className="flex items-center gap-2 flex-1">
          {value && /^#[0-9A-Fa-f]{6}$/.test(value) && (
            <div
              className="w-8 h-8 rounded-lg border border-border shrink-0"
              style={{ backgroundColor: value }}
            />
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#2B6CB0"
            className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-colors"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function StepColour() {
  const { state, updateNestedWizard, updateWizard } = useApp();
  const colour = state.wizardState.colour;
  const extractions = state.wizardState.extractions;

  const extractedColors = useMemo(
    () => getAllExtractedColors(extractions.results),
    [extractions.results]
  );

  return (
    <StepSection
      id="step-colour"
      stepNumber={5}
      totalSteps={13}
      label="Colour"
      title="Pick the accent that defines this project."
      help="One colour for primary buttons, key data, active states. Everything else is derived. Pick from your extracted palette, the presets, or type a custom hex."
    >
      <SubStep
        title="Primary accent"
        help="The main interactive colour — buttons, links, focus rings, active states."
      >
        <ColourPickerSection
          value={colour.accent}
          onChange={(hex) => updateNestedWizard('colour', 'accent', hex)}
          label="Primary accent"
          extractedColors={extractedColors}
          useExtracted={extractions.useExtractedColors}
          onToggleExtracted={(v) =>
            updateWizard('extractions', {
              ...extractions,
              useExtractedColors: v,
            })
          }
          presets={PRESET_COLOURS}
        />
      </SubStep>

      <SubStep
        title="Secondary accent (optional)"
        help="Most projects don't need one. If yours has a clear second category — completion states, premium tier, an alternate context — pick it here."
      >
        <ColourPickerSection
          value={colour.secondary}
          onChange={(hex) => updateNestedWizard('colour', 'secondary', hex)}
          label="Secondary accent"
          extractedColors={extractedColors}
          useExtracted={extractions.useExtractedColors}
          presets={PRESET_COLOURS}
        />
        {colour.secondary && (
          <button
            onClick={() => updateNestedWizard('colour', 'secondary', '')}
            className="mt-3 text-xs text-text-subtle hover:text-text transition-colors"
          >
            Clear secondary accent
          </button>
        )}
      </SubStep>
    </StepSection>
  );
}
