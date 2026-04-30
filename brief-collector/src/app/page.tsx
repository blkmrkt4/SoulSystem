'use client';

import { AppProvider, useApp } from '@/lib/context';
import { TopBar } from '@/components/TopBar';
import { WizardView } from '@/components/wizard/WizardView';
import { LibraryManager } from '@/components/library/LibraryManager';
import { DraftsView } from '@/components/drafts/DraftsView';
import { ToastProvider } from '@/components/ui/Toast';

function AppContent() {
  const { state } = useApp();

  if (!state.loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <main className="flex-1">
        {state.tab === 'wizard' && <WizardView />}
        {state.tab === 'library' && <LibraryManager />}
        {state.tab === 'drafts' && <DraftsView />}
      </main>
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}
