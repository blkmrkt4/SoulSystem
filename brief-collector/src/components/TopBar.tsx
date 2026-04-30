'use client';

import { useApp } from '@/lib/context';
import type { AppTab } from '@/lib/types';

const TABS: { key: AppTab; label: string }[] = [
  { key: 'wizard', label: 'Brief Creator' },
  { key: 'library', label: 'Component Library' },
  { key: 'drafts', label: 'Brief Files' },
];

const TOTAL_STEPS = 13;

export function TopBar() {
  const { state, dispatch } = useApp();

  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: 'color-mix(in srgb, var(--color-canvas) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="font-medium text-[17px] tracking-tight">Brief Collector</span>
          </div>

          <div className="flex ml-6 gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => dispatch({ type: 'SET_TAB', tab: tab.key })}
                className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                  state.tab === tab.key
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-muted hover:text-text hover:bg-surface-alt'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {state.tab === 'wizard' && (
          <div className="flex items-center gap-2.5 text-xs text-text-subtle">
            <span>
              Step <strong className="text-text font-semibold">{state.activeStep}</strong> of{' '}
              {TOTAL_STEPS}
            </span>
            <div className="w-[140px] h-1 bg-surface-alt rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-200"
                style={{
                  width: `${(state.activeStep / TOTAL_STEPS) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
