import type { WizardState, LibraryComponent, UploadedFile } from './types';
import { getAllExtractedColors, getAllExtractedFonts } from './extraction';

const VIBE_IMPLICATIONS: Record<string, string> = {
  quiet: 'soft-minimal aesthetic, off-white canvas, refined sans, light shadows, generous whitespace, motion 200-280ms ease-out',
  technical: 'near-black canvas, sharp grotesque sans, high-contrast accent, mono accents, motion 120-180ms ease-out, precise spacing',
  editorial: 'earthy neutrals canvas with warmth, serif display, generous whitespace, magazine-like rhythm, motion 280-320ms emphatic ease',
  bold: 'saturated accent, strong type contrast, decisive blocks, sharp corners, motion 150-200ms decisive',
  playful: 'soft pastels, rounded shapes, expressive type, bouncy motion (hard rule against bounce relaxes), motion 240ms with spring',
  luxurious: 'deep neutrals, restrained accent (often metallic), fine type, slow motion 320-480ms, generous spacing',
};

export function toKebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface FileClassification {
  extracted: UploadedFile[];
  needsVisualAnalysis: UploadedFile[];
}

/** Split uploaded files into those already extracted vs those that still need Claude Desktop to see */
export function classifyFiles(state: WizardState): FileClassification {
  const results = state.extractions?.results || [];
  const extracted: UploadedFile[] = [];
  const needsVisualAnalysis: UploadedFile[] = [];

  const allFiles = [
    ...state.inspiration.files,
    ...state.inspiration.swatches,
    ...state.inspiration.fonts,
  ];

  for (const file of allFiles) {
    const hasSuccessfulExtraction = results.some(
      (r) => r.sourceFileId === file.id && r.status === 'done'
    );
    if (hasSuccessfulExtraction) {
      extracted.push(file);
    } else {
      needsVisualAnalysis.push(file);
    }
  }

  return { extracted, needsVisualAnalysis };
}

function getSourceSuffix(sourceLibrary: string): string {
  if (!sourceLibrary || sourceLibrary === 'custom') return '';
  return '-' + sourceLibrary.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

export function buildComponentFilename(component: LibraryComponent): string {
  const adapted = toKebab(component.adaptedName || component.name);
  const suffix = getSourceSuffix(component.sourceLibrary);
  return `component-${adapted}${suffix}.md`;
}

export interface ValidationError {
  field: string;
  message: string;
  step: number;
}

export function validateForExport(state: WizardState): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!state.project.name.trim()) {
    errors.push({ field: 'project-name', message: 'Project name is required', step: 1 });
  }
  if (!state.vibe) {
    errors.push({ field: 'step-vibe', message: 'Vibe must be selected', step: 2 });
  }
  if (!state.colour.accent) {
    errors.push({ field: 'step-colour', message: 'Accent colour must be set', step: 5 });
  }
  if (!state.mode) {
    errors.push({ field: 'step-mode', message: 'Mode must be selected', step: 7 });
  }
  if (state.admin.scope && state.admin.scope !== 'none' && !state.admin.scope) {
    errors.push({ field: 'step-admin', message: 'Admin scope must be set', step: 13 });
  }

  return errors;
}

export function buildPrompt(
  state: WizardState,
  selectedComponents: LibraryComponent[]
): string {
  const s = state;
  const enabledRules = Object.entries(s.rules)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const disabledRules = Object.entries(s.rules)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  let librarySection = '';
  if (selectedComponents.length === 0) {
    librarySection = '(none — no library components selected for this project)';
  } else {
    librarySection = selectedComponents
      .map((c) => {
        const filename = buildComponentFilename(c);
        const adapted = toKebab(c.adaptedName || c.name);
        const mediaFiles = c.media.map((m) => m.filename).join(', ');

        return `### ${c.name}
- File to produce: \`${filename}\`
- Adapted name: ${c.adaptedName || adapted}
- Source: ${c.sourceUrl || '(custom)'}
- Tags: ${c.tags.length > 0 ? c.tags.join(', ') : '(none)'}
- Notes: ${c.notes || '(none)'}${
          mediaFiles ? `\n- Media references: ${mediaFiles}` : ''
        }${
          c.code
            ? `\n- Original code:\n\`\`\`${c.codeLanguage || ''}\n${c.code}\n\`\`\``
            : ''
        }`;
      })
      .join('\n\n');
  }

  const { extracted, needsVisualAnalysis } = classifyFiles(s);

  return `## INSTRUCTION TO CLAUDE DESKTOP

You are a senior design systems specialist. The user has completed a structured wizard. Your job is to produce a complete bundle of design files based on their answers.

CRITICAL: Use ONLY the information provided in this prompt. Do NOT use any prior knowledge, memory, or assumptions about the project, the user, or the product. If something is not stated below, leave it out or ask — do not fill gaps from memory. The project name, description, and audience below are the complete context. Do not invent product features, brand voice, taglines, or domain knowledge beyond what is written here.

The bundle must follow this structure exactly:
- CLAUDE.md (project root entry)
- DESIGN.md (orchestrator — references components, doesn't contain them)
- tokens.md (all design tokens)
- component-<name>.md (one per chosen library component, plus core components for chosen patterns)
- ADMIN-SCAFFOLDING.md (if admin enabled)
- mood-board.html (self-contained, all CSS inline)

Rules for the bundle:
- DESIGN.md must REFERENCE component files by name, not contain their code
- Each library component selected by the user gets its own file: component-<adapted-name>[-source].md
- Adapt library component code to use this project's tokens (replace hardcoded colours, fonts, spacing with token references)
- Core components (button, input, card, navigation) also each get their own component-*.md file
- Output each file as a separate code block, clearly labelled with a path comment at the top: <!-- File: /design/<name> -->
- End with a short summary of what was produced and any tensions or decisions you had to make
- Push back on tensions in the user's answers before generating

---

## PROJECT CONTEXT

- Name: ${s.project.name || '(unnamed)'}
- Description: ${s.project.description || '(none provided)'}
- Platform: ${Array.isArray(s.project.platform) ? s.project.platform.join(', ') : s.project.platform || '(not set)'}
- Register: **${s.project.register || '(not set)'}**${s.project.register === 'brand' ? '\n  Implication: design IS the product — expressive type, strong art direction, asymmetric layouts, motion as expression' : s.project.register === 'product' ? '\n  Implication: design SERVES the product — familiar conventions, restrained palettes, fixed type scales, motion as feedback only' : ''}
- Audience: ${s.project.audience || '(not specified)'}

## AESTHETIC

- Vibe: **${s.vibe}**
  - Implication: ${VIBE_IMPLICATIONS[s.vibe] || 'see vibe choice'}
- Feeling words: ${s.feeling.join(', ') || '(none selected)'}
- Display type personality: **${s.typography.display || '(not set)'}**
- Body type personality: **${s.typography.body || '(not set)'}**
- Button shape: **${s.shape.button || '(not set)'}**
- Density: **${s.shape.density || '(not set)'}**
- Shadow philosophy: **${s.shape.shadow || '(not set)'}**
- Motion personality: **${s.shape.motion || '(not set)'}**
- Mode: **${s.mode || '(not set)'}**

## COLOUR

- Accent primary: ${s.colour.accent || '(not set)'}
- Accent secondary: ${s.colour.secondary || '(none)'}
- Pasted hex codes: ${s.inspiration.hexes || '(none)'}
${(() => {
    const colors = s.extractions?.useExtractedColors !== false
      ? getAllExtractedColors(s.extractions?.results || [])
      : [];
    if (colors.length === 0) return '\nReference: extract additional palette cues from inspiration files when available.';
    return `
Extracted palette (from uploaded swatches/inspiration):
${colors.map(c => `- ${c.hex}${c.name ? ` (${c.name})` : ''}${c.role ? ` — ${c.role}` : ''}`).join('\n')}

Use these extracted colours as the primary palette reference. Derive neutral, surface, and semantic colours from them.`;
  })()}

## TYPOGRAPHY — IDENTIFIED FONTS
${(() => {
    const fonts = s.extractions?.useExtractedFonts !== false
      ? getAllExtractedFonts(s.extractions?.results || [])
      : [];
    if (fonts.length === 0) return '\n(No fonts identified from uploads — use the personality choices below.)';
    return `
Fonts identified from uploaded references:
${fonts.map(f => `- **${f.name}**${f.googleFontsMatch && f.googleFontsMatch !== f.name ? ` (Google Fonts: ${f.googleFontsMatch})` : ''} — ${f.role || 'unspecified role'}, weight ${f.weight || '400'}${f.confidence != null ? `, ${Math.round(f.confidence * 100)}% confidence` : ''}`).join('\n')}

Prefer these identified fonts when building the token set. Fall back to the personality choices below where identification confidence is low.`;
  })()}

## INSPIRATION

URLs:
${s.inspiration.urls || '(none)'}
${needsVisualAnalysis.length > 0 ? `
Files requiring visual analysis (drag these into Claude Desktop alongside this prompt):
${needsVisualAnalysis.map(f => `- ${f.name}`).join('\n')}` : ''}${extracted.length > 0 ? `
${extracted.length} file(s) already analysed — extracted colours and fonts are included in the sections above.` : ''}${needsVisualAnalysis.length === 0 && extracted.length > 0 ? `

All uploaded references have been analysed. No files need to be dragged into this conversation.` : ''}
${s.inspiration.antiReferences ? `
## ANTI-REFERENCES

What this design should explicitly NOT look like:
${s.inspiration.antiReferences}
` : ''}
## NAVIGATION & COMPONENTS

- Primary navigation: **${s.navigation.primary || '(not set)'}**
- Tooltip behaviour: **${s.navigation.tooltip || '(not set)'}**
- Mobile navigation: **${s.navigation.mobile || '(not set)'}**
- Form layout: **${s.components.form || '(not set)'}**
- Empty state style: **${s.components.empty || '(not set)'}**
- Loading style: **${s.components.loading || '(not set)'}**
- Notification style: **${s.components.notification || '(not set)'}**

## LIBRARY COMPONENTS SELECTED FOR THIS PROJECT

${librarySection}

## HARD LIMITS (USER-SPECIFIC ANTI-PATTERNS)

${s.hardLimits || '(none specified)'}

## RULES

QUALITY FLOOR (locked, always enforced):
- No nested cards (cards inside cards)
- WCAG AA contrast minimum (4.5:1 body, 3:1 large)
- Body text minimum 14px
- Line height minimum 1.3 on multi-line text
- Letter spacing on body text must not exceed 0.05em
- No justified text without hyphenation
- Line length capped at 75ch
- No gray text on coloured backgrounds
- Minimum 8px padding inside bordered containers
- No skipped heading levels (h1 → h3 with no h2)
- Animate transform/opacity only — never width/height/padding/margin
- Every component has empty/loading/error states
- If dual mode: both light and dark equally polished from day one
- Errors expressed in plain language, not codes
- Destructive actions must have undo or escape hatch

AI DARK PATTERNS (always forbidden):
- Sycophantic AI agreement — assistant always agrees even when wrong
- Unending suggestion loop — no natural endpoint, user never feels done
- Sneaking via summarization — AI subtly alters tone or stance during rewriting
- Hallucinated dark patterns — model autonomously hides cancel buttons or creates forced continuity
- Hidden cancel / opt-out — microscopic gray "no thanks" under a giant accept button
- Fake scarcity — dynamically generated urgency messaging

NEGOTIABLE — ALLOWED in this project (user toggled on):
${enabledRules.length > 0 ? enabledRules.map((r) => `- ${r}`).join('\n') : '- (none)'}

NEGOTIABLE — BANNED in this project (user left off):
${disabledRules.length > 0 ? disabledRules.map((r) => `- ${r}`).join('\n') : '- (none)'}

## ADMIN

Scope: **${s.admin.scope || '(not set)'}**${
    s.admin.scope && s.admin.scope !== 'none'
      ? `

Standard sections enabled:
- LLM configuration (primary + backup model, failover rules, test playground)
- Prompt + model binding (slug-based, with versioning and rollback)${
          s.admin.scope === 'full'
            ? `
- User & role management (invite, suspend, change role)
- Usage analytics & cost tracking (per-LLM, per-user, per-slug)
- Content/output moderation (review queue, thresholds, override lists)`
            : '\n- (minimal admin — no user mgmt, usage, moderation)'
        }

Optional sections enabled: ${s.admin.extras.length > 0 ? s.admin.extras.join(', ') : '(none)'}

Architecture (fixed across all projects — don't redesign):
- Admin lives at /admin URL path
- Role-based middleware on every /admin/* route
- Audit log on every write action
- Slug-based prompt binding: products call llm.generate(slug, variables)
- LLM client abstraction handles model selection, failover, logging
- Same design tokens as consumer app, with compact density on tables`
      : ''
  }

## ANYTHING ELSE FROM THE USER

${s.anythingElse || '(nothing additional)'}

---

## OUTPUT REQUIREMENTS

Produce the file bundle in this order:

1. **CLAUDE.md** — project root entry telling Claude Code how to navigate the design files
2. **DESIGN.md** — orchestrator that REFERENCES component files (does not contain code)
3. **tokens.md** — all design tokens
4. **Core component files** — at minimum: component-button.md, component-input.md, component-${s.navigation.primary || 'navigation'}.md, component-card.md, component-form.md
5. **Library component files** — one per item in the LIBRARY COMPONENTS SELECTED section above, with code adapted to use this project's tokens
${s.admin.scope && s.admin.scope !== 'none' ? '6. **ADMIN-SCAFFOLDING.md** — admin architecture spec\n' : ''}${s.admin.scope && s.admin.scope !== 'none' ? '7' : '6'}. **mood-board.html** — single self-contained file rendering every choice live, with light/dark toggle if dual mode

Each file in its own clearly labelled code block. Use file path comments at the top: \`<!-- File: /design/DESIGN.md -->\`.

DESIGN.md must reference but not contain component code. Component code lives in component-*.md files only.

Push back if my choices conflict — better to surface tensions now than after the spec is written.

When done, end with a short summary of what was produced and any tensions or decisions you had to make.

Ready when you are.`;
}
