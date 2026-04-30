'use client';

import type { Tension } from '@/lib/tensions';

export function TensionCallout({ tension }: { tension: Tension }) {
  return (
    <div className="mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm leading-relaxed">
      <div className="flex items-start gap-2.5">
        <span className="text-amber-500 text-base leading-none mt-0.5 shrink-0">&#9888;</span>
        <div>
          <span className="font-semibold text-amber-900 text-[13px]">{tension.title}</span>
          <p className="m-0 mt-1 text-amber-800 text-[13px] leading-relaxed">{tension.message}</p>
        </div>
      </div>
    </div>
  );
}

export function TensionList({ tensions }: { tensions: Tension[] }) {
  if (tensions.length === 0) return null;
  return (
    <div className="space-y-2">
      {tensions.map((t) => (
        <TensionCallout key={t.id} tension={t} />
      ))}
    </div>
  );
}
