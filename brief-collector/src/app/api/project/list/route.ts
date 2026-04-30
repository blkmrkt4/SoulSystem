import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export interface DiskProject {
  slug: string;
  projectName: string;
  savedAt: string | null;
  version: number;
  promptCount: number;
  hasOutput: boolean;
  outputFileCount: number;
  hasDesignDefinition: boolean;
  vibe: string;
  accentColour: string;
  mode: string;
  platform: string;
  completionPct: number;
}

function completionPercent(state: Record<string, unknown>): number {
  let filled = 0;
  const total = 6;
  const project = state.project as Record<string, string> | undefined;
  if (project?.name) filled++;
  if (state.vibe) filled++;
  const colour = state.colour as Record<string, string> | undefined;
  if (colour?.accent) filled++;
  if (state.mode) filled++;
  const typography = state.typography as Record<string, string> | undefined;
  if (typography?.display) filled++;
  const admin = state.admin as Record<string, string> | undefined;
  if (admin?.scope) filled++;
  return Math.round((filled / total) * 100);
}

export async function GET() {
  try {
    const baseDir = join(homedir(), 'Documents', 'SoulSystem');

    let entries: string[];
    try {
      entries = await readdir(baseDir);
    } catch {
      return NextResponse.json({ projects: [] });
    }

    const projects: DiskProject[] = [];

    for (const entry of entries) {
      const entryPath = join(baseDir, entry);
      const entryStat = await stat(entryPath).catch(() => null);
      if (!entryStat?.isDirectory()) continue;

      let wizardState: Record<string, unknown> = {};
      let savedAt: string | null = null;
      let version = 0;
      let hasDesignDefinition = false;

      // Try new format first
      const defPath = join(entryPath, 'design-definition.json');
      try {
        const raw = await readFile(defPath, 'utf-8');
        const definition = JSON.parse(raw);
        wizardState = definition.state || {};
        savedAt = definition.savedAt || null;
        version = definition.version || 0;
        hasDesignDefinition = true;
      } catch {
        // Try legacy format
        const legacyPath = join(entryPath, 'in', 'brief.json');
        try {
          const raw = await readFile(legacyPath, 'utf-8');
          const data = JSON.parse(raw);
          wizardState = data.state || {};
          savedAt = data.exportedAt || null;
        } catch {
          // No definition at all — skip
          continue;
        }
      }

      // Count generation prompt files
      let promptCount = 0;
      try {
        const allFiles = await readdir(entryPath);
        promptCount = allFiles.filter((f) => f.includes('-GenerationPrompt-')).length;
      } catch {}

      // Check for output files
      const outDir = join(entryPath, 'out');
      let outputFileCount = 0;
      try {
        const outFiles = await readdir(outDir);
        outputFileCount = outFiles.length;
      } catch {}

      const project = (wizardState.project as Record<string, string>) || {};
      const colour = (wizardState.colour as Record<string, string>) || {};

      projects.push({
        slug: entry,
        projectName: project.name || entry,
        savedAt,
        version,
        promptCount,
        hasOutput: outputFileCount > 0,
        outputFileCount,
        hasDesignDefinition,
        vibe: (wizardState.vibe as string) || '',
        accentColour: colour.accent || '',
        mode: (wizardState.mode as string) || '',
        platform: project.platform || '',
        completionPct: completionPercent(wizardState),
      });
    }

    projects.sort((a, b) => {
      if (a.savedAt && b.savedAt) {
        return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      }
      if (a.savedAt) return -1;
      if (b.savedAt) return 1;
      return a.projectName.localeCompare(b.projectName);
    });

    return NextResponse.json({ projects });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
