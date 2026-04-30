'use client';

import type { ReactNode } from 'react';
import { useTensionsForStep } from '@/lib/tension-context';
import { TensionList } from './TensionCallout';

interface StepSectionProps {
  id: string;
  stepNumber: number;
  totalSteps: number;
  label: string;
  title: string;
  help?: string;
  children: ReactNode;
}

export function StepSection({
  id,
  stepNumber,
  totalSteps,
  label,
  title,
  help,
  children,
}: StepSectionProps) {
  const tensions = useTensionsForStep(id);

  return (
    <section id={id} className="mb-24 scroll-mt-[88px] last:mb-0">
      <div className="mb-8">
        <div
          className="text-[11px] text-text-subtle tracking-widest uppercase mb-2.5"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          Step {stepNumber} of {totalSteps} &middot; {label}
        </div>
        <h1
          className="text-4xl font-normal leading-[1.15] tracking-tight m-0 mb-3"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}
        >
          {title}
        </h1>
        {help && (
          <p className="text-base text-text-muted max-w-[620px] m-0 leading-relaxed">
            {help}
          </p>
        )}
        <TensionList tensions={tensions} />
      </div>
      {children}
    </section>
  );
}

interface SubStepProps {
  title: string;
  help?: string;
  children: ReactNode;
}

export function SubStep({ title, help, children }: SubStepProps) {
  return (
    <div className="mb-10">
      <h3 className="text-[17px] font-semibold m-0 mb-1.5 text-text">{title}</h3>
      {help && (
        <p className="text-[13px] text-text-muted m-0 mb-4 leading-snug max-w-[600px]">
          {help}
        </p>
      )}
      {children}
    </div>
  );
}
