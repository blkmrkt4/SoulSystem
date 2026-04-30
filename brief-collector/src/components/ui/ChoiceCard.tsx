'use client';

import type { ReactNode } from 'react';

interface ChoiceCardProps {
  selected: boolean;
  onClick: () => void;
  preview?: ReactNode;
  previewHeight?: 'short' | 'normal' | 'tall';
  name: string;
  description?: string;
  children?: ReactNode;
  hasTension?: boolean;
}

export function ChoiceCard({
  selected,
  onClick,
  preview,
  previewHeight = 'normal',
  name,
  description,
  hasTension,
}: ChoiceCardProps) {
  const heights = { short: 'h-[100px]', normal: 'h-[140px]', tall: 'h-[180px]' };

  return (
    <div
      onClick={onClick}
      className={`bg-surface border rounded-[14px] overflow-hidden cursor-pointer transition-all duration-200 flex flex-col relative
        ${
          selected
            ? 'border-accent shadow-[0_0_0_3px_var(--color-accent-soft),0_2px_8px_rgba(28,25,22,0.06)]'
            : 'border-border hover:border-border-strong hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(28,25,22,0.06)]'
        }`}
    >
      {/* Tension warning badge */}
      {selected && hasTension && (
        <div
          className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center text-xs font-bold shadow-sm"
          title="This choice conflicts with another selection — see the tension warning above"
        >
          !
        </div>
      )}
      {preview && (
        <div className={`${heights[previewHeight]} border-b border-border overflow-hidden relative`}>
          {preview}
        </div>
      )}
      <div className="px-4 py-3.5 pb-4">
        <h3
          className="text-[17px] font-medium leading-tight tracking-tight m-0 mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {name}
        </h3>
        {description && (
          <p className="text-xs text-text-muted leading-snug m-0">{description}</p>
        )}
      </div>
    </div>
  );
}
