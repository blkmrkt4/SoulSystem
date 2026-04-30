'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { useApp } from '@/lib/context';
import { StepSection, SubStep } from '@/components/ui/StepSection';
import type { UploadedFile } from '@/lib/types';
import { useToast } from '@/components/ui/Toast';

function FileUploadGrid({
  files,
  category,
  accept,
  onAdd,
  onRemove,
  onRetry,
  extractionStatus,
}: {
  files: UploadedFile[];
  category: UploadedFile['category'];
  accept: string;
  onAdd: (file: UploadedFile) => void;
  onRemove: (id: string) => void;
  onRetry?: (file: UploadedFile) => void;
  extractionStatus?: Record<string, 'running' | 'done' | 'error'>;
}) {
  const inputId = `upload-${category}-${useMemo(() => Math.random().toString(36).slice(2), [])}`;

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList) return;
      Array.from(fileList).forEach((f) => {
        const uploaded: UploadedFile = {
          id: crypto.randomUUID(),
          name: f.name,
          size: f.size,
          type: f.type,
          blob: f,
          category,
        };
        onAdd(uploaded);
      });
      e.target.value = '';
    },
    [category, onAdd]
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {files.map((f) => (
        <FilePreview
          key={f.id}
          file={f}
          onRemove={() => onRemove(f.id)}
          onRetry={onRetry ? () => onRetry(f) : undefined}
          status={extractionStatus?.[f.id]}
        />
      ))}
      <input
        type="file"
        accept={accept}
        multiple
        className="hidden"
        id={inputId}
        onChange={handleUpload}
      />
      <label
        htmlFor={inputId}
        className="flex flex-col items-center justify-center gap-1.5 min-h-[120px] border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-border-strong hover:bg-surface-alt/50 transition-colors"
      >
        <svg
          className="w-6 h-6 text-text-subtle"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        <span className="text-xs text-text-subtle">Add file</span>
      </label>
    </div>
  );
}

function FilePreview({
  file,
  onRemove,
  onRetry,
  status,
}: {
  file: UploadedFile;
  onRemove: () => void;
  onRetry?: () => void;
  status?: 'running' | 'done' | 'error';
}) {
  const url = useMemo(() => URL.createObjectURL(file.blob), [file.blob]);

  return (
    <div className="relative group border border-border rounded-xl overflow-hidden bg-surface-alt">
      {file.type.startsWith('image/') ? (
        <img
          src={url}
          alt={file.name}
          className="w-full h-[120px] object-cover"
        />
      ) : (
        <div className="w-full h-[120px] flex items-center justify-center p-3">
          <span
            className="text-xs text-text-muted truncate text-center"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {file.name}
          </span>
        </div>
      )}

      {/* Extraction status badge */}
      {status && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
          <div
            className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
              status === 'running'
                ? 'bg-amber-100 text-amber-700'
                : status === 'done'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {status === 'running'
              ? 'Extracting...'
              : status === 'done'
              ? 'Extracted'
              : 'Error'}
          </div>
          {(status === 'done' || status === 'error') && onRetry && (
            <button
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-surface/90 text-text-muted hover:text-text border border-border backdrop-blur-sm transition-colors"
            >
              Re-extract
            </button>
          )}
        </div>
      )}

      <button
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-surface/80 backdrop-blur-sm border border-border text-text-muted hover:text-text flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${file.name}`}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export default function StepInspiration() {
  const { state, updateNestedWizard, triggerExtraction, updateWizard } = useApp();
  const inspiration = state.wizardState.inspiration;
  const extractions = state.wizardState.extractions;
  const { showToast } = useToast();
  const [urlAnalysing, setUrlAnalysing] = useState(false);
  const [urlAnalysed, setUrlAnalysed] = useState<Set<string>>(new Set());

  // Toast when extraction completes
  const prevDoneCountRef = useRef(
    extractions.results.filter((r) => r.status === 'done').length
  );
  useEffect(() => {
    const doneResults = extractions.results.filter((r) => r.status === 'done');
    if (doneResults.length > prevDoneCountRef.current) {
      const newest = doneResults[doneResults.length - 1];
      if (newest.colors && newest.colors.length > 0) {
        showToast(`${newest.colors.length} colours extracted — added to your palette in Step 5 (Colour).`);
      }
      if (newest.fonts && newest.fonts.length > 0) {
        showToast(`${newest.fonts.length} font(s) identified — added to suggestions in Step 6 (Typography).`);
      }
    }
    prevDoneCountRef.current = doneResults.length;
  }, [extractions.results, showToast]);

  // Build extraction status map for UI badges
  const extractionStatus = useMemo(() => {
    const map: Record<string, 'running' | 'done' | 'error'> = {};
    for (const r of extractions.results) {
      const current = map[r.sourceFileId];
      // Show worst status if multiple slugs ran on same file
      if (!current || r.status === 'running' || (r.status === 'error' && current === 'done')) {
        map[r.sourceFileId] = r.status === 'pending' ? 'running' : r.status as 'running' | 'done' | 'error';
      }
    }
    return map;
  }, [extractions.results]);

  const addFileWithExtraction = useCallback(
    (key: 'files' | 'swatches' | 'fonts') => (file: UploadedFile) => {
      updateNestedWizard('inspiration', key, [...inspiration[key], file]);

      // Determine which extraction slugs to run based on file category
      const slugs: string[] = [];
      if (key === 'swatches') {
        slugs.push('color-extraction');
      } else if (key === 'fonts') {
        slugs.push('font-identification');
      } else if (key === 'files') {
        // Inspiration images: extract colors too
        slugs.push('color-extraction');
      }

      if (slugs.length > 0) {
        triggerExtraction(file, slugs);
      }
    },
    [inspiration, updateNestedWizard, triggerExtraction]
  );

  const removeFile = useCallback(
    (key: 'files' | 'swatches' | 'fonts') => (id: string) => {
      updateNestedWizard(
        'inspiration',
        key,
        inspiration[key].filter((f) => f.id !== id)
      );
      // Also clean up extraction results for this file
      const cleanedResults = extractions.results.filter(
        (r) => r.sourceFileId !== id
      );
      if (cleanedResults.length !== extractions.results.length) {
        updateNestedWizard('extractions', 'results' as never, cleanedResults as never);
      }
    },
    [inspiration, extractions.results, updateNestedWizard]
  );

  const retryExtraction = useCallback(
    (key: 'files' | 'swatches' | 'fonts') => (file: UploadedFile) => {
      const slugs: string[] = [];
      if (key === 'swatches') slugs.push('color-extraction');
      else if (key === 'fonts') slugs.push('font-identification');
      else if (key === 'files') slugs.push('color-extraction');
      if (slugs.length > 0) triggerExtraction(file, slugs);
    },
    [triggerExtraction]
  );

  // Analyse reference URLs
  const analyseUrls = useCallback(async () => {
    const urls = inspiration.urls
      .split(/[\n,]/)
      .map((u) => u.trim())
      .filter((u) => u && /^https?:\/\//i.test(u));

    if (urls.length === 0) return;

    setUrlAnalysing(true);
    const newAnalysed = new Set(urlAnalysed);
    let totalColors = 0;

    for (const url of urls) {
      if (urlAnalysed.has(url)) continue;
      try {
        const res = await fetch('/api/analyse-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, mode: 'color' }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(`Failed to analyse ${url}: ${data.error}`);
          continue;
        }

        // Add extracted colors to the extractions
        if (Array.isArray(data.parsed) && data.parsed.length > 0) {
          const result = {
            slug: 'color-extraction',
            sourceFileId: `url:${url}`,
            sourceFileName: url,
            status: 'done' as const,
            colors: data.parsed,
            extractedAt: Date.now(),
          };
          const current = state.wizardState.extractions;
          updateWizard('extractions', {
            ...current,
            results: [
              ...current.results.filter(
                (r) => !(r.sourceFileId === `url:${url}` && r.slug === 'color-extraction')
              ),
              result,
            ],
          });
          totalColors += data.parsed.length;
        }

        newAnalysed.add(url);
      } catch (err) {
        showToast(`Error analysing ${url}: ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }

    setUrlAnalysed(newAnalysed);
    setUrlAnalysing(false);
    if (totalColors > 0) {
      showToast(`${totalColors} colours extracted from ${urls.length} URL(s) — added to your palette in Step 5.`);
    }
  }, [inspiration.urls, urlAnalysed, state.wizardState.extractions, updateWizard, showToast]);

  // Summary of what's been extracted
  const colorCount = extractions.results.filter(
    (r) => r.slug === 'color-extraction' && r.status === 'done' && r.colors
  ).reduce((acc, r) => acc + (r.colors?.length || 0), 0);

  const fontCount = extractions.results.filter(
    (r) => r.slug === 'font-identification' && r.status === 'done' && r.fonts
  ).reduce((acc, r) => acc + (r.fonts?.length || 0), 0);

  const runningCount = extractions.results.filter(
    (r) => r.status === 'running'
  ).length;

  const errors = extractions.results.filter((r) => r.status === 'error');
  const uniqueErrors = [...new Set(errors.map((e) => e.error || 'Unknown error'))];

  return (
    <StepSection
      id="step-inspiration"
      stepNumber={3}
      totalSteps={13}
      label="Inspiration"
      title="Show us what inspires you"
      help="Screenshots, URLs, swatches, fonts — anything that communicates the direction. Uploads are automatically analysed to extract colours and fonts for later steps."
    >
      {/* Extraction summary */}
      {(colorCount > 0 || fontCount > 0 || runningCount > 0 || uniqueErrors.length > 0) && (
        <div className="mb-6 space-y-2">
          {(colorCount > 0 || fontCount > 0 || runningCount > 0) && (
            <div className="px-4 py-3 bg-accent/5 border border-accent/20 rounded-xl text-sm text-text-muted flex items-center gap-3 flex-wrap">
              {runningCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Analysing {runningCount} file{runningCount > 1 ? 's' : ''}...
                </span>
              )}
              {colorCount > 0 && (
                <span>
                  {colorCount} colour{colorCount > 1 ? 's' : ''} extracted
                </span>
              )}
              {fontCount > 0 && (
                <span>
                  {fontCount} font{fontCount > 1 ? 's' : ''} identified
                </span>
              )}
            </div>
          )}
          {uniqueErrors.length > 0 && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span className="font-semibold">Extraction failed: </span>
              {uniqueErrors.map((err, i) => (
                <span key={i}>
                  {err}
                  {err.includes('/admin') && (
                    <a href="/admin" className="underline ml-1 font-medium">
                      Open admin settings
                    </a>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <SubStep
        title="Visual references"
        help="Upload screenshots, mood boards, or design references. Colours will be extracted automatically."
      >
        <FileUploadGrid
          files={inspiration.files}
          category="inspiration"
          accept="image/*"
          onAdd={addFileWithExtraction('files')}
          onRemove={removeFile('files')}
          onRetry={retryExtraction('files')}
          extractionStatus={extractionStatus}
        />
      </SubStep>

      <SubStep
        title="Reference URLs"
        help="Paste links to sites whose design you like — one per line. Click Analyse to extract colours from each."
      >
        <textarea
          value={inspiration.urls}
          onChange={(e) =>
            updateNestedWizard('inspiration', 'urls', e.target.value)
          }
          placeholder={"https://linear.app\nhttps://vercel.com"}
          rows={4}
          className="w-full max-w-lg px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-colors resize-y"
          style={{ fontFamily: 'var(--font-mono)' }}
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={analyseUrls}
            disabled={urlAnalysing || !inspiration.urls.trim()}
            className="h-9 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {urlAnalysing ? 'Analysing...' : 'Analyse URLs'}
          </button>
          {urlAnalysed.size > 0 && (
            <span className="text-xs text-emerald-600">
              {urlAnalysed.size} URL{urlAnalysed.size > 1 ? 's' : ''} analysed
            </span>
          )}
          {urlAnalysing && (
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Capturing and analysing...
            </span>
          )}
        </div>
      </SubStep>

      <SubStep
        title="Colour swatches"
        help="Upload swatch images — colours are extracted automatically. Or paste hex values below."
      >
        <FileUploadGrid
          files={inspiration.swatches}
          category="swatches"
          accept="image/*"
          onAdd={addFileWithExtraction('swatches')}
          onRemove={removeFile('swatches')}
          onRetry={retryExtraction('swatches')}
          extractionStatus={extractionStatus}
        />
        <div className="mt-4">
          <label
            htmlFor="hex-input"
            className="block text-xs text-text-muted mb-1.5"
          >
            Hex values (comma or newline separated)
          </label>
          <textarea
            id="hex-input"
            value={inspiration.hexes}
            onChange={(e) =>
              updateNestedWizard('inspiration', 'hexes', e.target.value)
            }
            placeholder={"#2B6CB0, #4A5D5C, #8B4A2B"}
            rows={2}
            className="w-full max-w-lg px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-colors resize-y"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </SubStep>

      <SubStep
        title="Font references"
        help="Upload screenshots of type you like — fonts are identified automatically."
      >
        <FileUploadGrid
          files={inspiration.fonts}
          category="fonts"
          accept="image/*,.ttf,.otf,.woff,.woff2"
          onAdd={addFileWithExtraction('fonts')}
          onRemove={removeFile('fonts')}
          onRetry={retryExtraction('fonts')}
          extractionStatus={extractionStatus}
        />
      </SubStep>
    </StepSection>
  );
}
