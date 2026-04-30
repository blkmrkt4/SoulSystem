# Part 2 — Generation Specification

> **What this is.** A specification document that tells the Brief Collector application (Part 1) exactly what its output prompt must look like. When you build the Brief Collector with Claude Code, hand this file to Claude Code along with the Brief Collector spec. This file is the contract: it says "the final prompt you produce must contain these sections, in this order, with this level of detail."
>
> **Why it exists.** The whole point of the two-part architecture is consistency. Every time you run the Brief Collector, the output prompt has the same shape. Same sections. Same level of detail. That means Claude Desktop produces consistent style guides every time, because the input is always structured identically.
>
> **How to use it.** When you build the Brief Collector with Claude Code, say: *"Read generation-specification.md before generating any output. The final prompt your application produces must conform to this spec exactly."*

---

## The deliverables Claude Desktop must produce

When the user pastes the Brief Collector's output into Claude Desktop, Claude Desktop produces a **bundle of files**. The bundle is structured for context economy — the orchestrator file is small and references the rest, so Claude Code only loads what it needs.

### File 1 — DESIGN.md (the orchestrator)

The lean entry point. Claude Code reads this first; it points to everything else.

**Required structure:**

```
# DESIGN.md — <Project Name>

## How Claude Code should use this file
A short instruction block telling Claude Code:
- Read this file first before any other design file
- Load referenced component files only when working on those components
- Reference tokens by name, not value
- Validate against anti-patterns before showing output
- Both modes from the start (if dual mode)
- Empty/loading/error states required for every component

## Project context
Three or four lines: name, description, platform, audience.

## Aesthetic principles
Three to five principles drawn from the user's vibe and feeling choices. Each principle is a sentence — not a paragraph.

## Token references
Pointer to tokens.md (separate file). One-line summary of what's there.

## Component references
A list of component files, each on its own line:
- component-button.md — primary button style for this project
- component-navigation-rail.md — Supabase-style icon rail (from library)
- component-card-flip-21stdev.md — card flip animation (from library)
- ...

## Anti-patterns
The full do-not list, with this project's overrides applied.

## Rules
- Locked rules (always on)
- Negotiable rules — allowed in this project
- Negotiable rules — banned in this project

## Working with AI agents
Brief instructions on how Claude Code should approach this codebase.

## Changelog
Date, version, what changed.
```

**Critical:** DESIGN.md must NOT contain full component code. It contains references. The full component definitions live in their own files.

### File 2 — tokens.md

All design tokens in one file. Colour, typography, spacing, radius, shadow, motion, breakpoints, z-index. Loaded only when Claude Code is setting up the design system foundation.

### File 3 onward — component-*.md files

One file per component. **File naming convention:** `component-<kebab-case-name>.md`.

Examples:
- `component-button.md`
- `component-navigation-rail.md`
- `component-form-input.md`
- `component-card-flip-21stdev.md` (a library component, kept its source-derived suffix)

Each component file contains:

```
# component-<name>.md

## What it is
One sentence describing the component.

## Source (if from library)
- URL: https://21st.dev/...
- Original name: ...
- Adapted name: ...

## Visual specification
- Sizes, variants, states
- Reference to tokens by name (e.g. accent_primary, space-4)

## Code
- Full implementation, ready to drop into a project
- Adapted to use this project's tokens
- Comments where the user might want to customise

## Accessibility
- Keyboard, screen reader, focus management

## Usage
- When to use it
- When NOT to use it
- Example calls

## Variants
- All variants explicitly listed with code
```

### File 4 — mood-board.html

Self-contained HTML file. Single file, all CSS inline. Renders every choice live with a light/dark toggle if dual mode. NOT referenced from DESIGN.md — it's for human use only, kept in `/design/mood-board.html`.

### File 5 — ADMIN-SCAFFOLDING.md (if admin enabled)

Architectural pattern for the admin layer. Routes, middleware, audit log, slug-binding, LLM client abstraction. Same structure as the user's existing admin spec template.

### File 6 — CLAUDE.md (the project root file)

This is the file Claude Code looks for first when entering a project. It's the entry point that points to DESIGN.md.

```
# CLAUDE.md

## How to work with this project

When working on this project, you must:

1. Read DESIGN.md before writing any code that affects the user interface
2. Load only the component-*.md files relevant to the work you're doing
3. Reference design tokens by name, not value (see tokens.md)
4. Validate every UI choice against the anti-patterns list in DESIGN.md
5. If working on the admin area, also read ADMIN-SCAFFOLDING.md

## File locations

- /design/DESIGN.md — design system orchestrator
- /design/tokens.md — all design tokens
- /design/components/component-*.md — individual component specs
- /design/mood-board.html — visual reference (human use only)
- /design/ADMIN-SCAFFOLDING.md — admin architecture (if admin enabled)

## Project-specific notes

<filled in by Claude Desktop based on user's "anything else" answer>
```

---

## The exact structure of the prompt the Brief Collector outputs

The Brief Collector must output a single prompt with these sections, in this order. Sections that don't apply to a given project are omitted (not left blank).

```
## INSTRUCTION TO CLAUDE DESKTOP

You are a senior design systems specialist. The user has completed a structured wizard. Your job is to produce a complete bundle of design files based on their answers.

The bundle must follow this structure exactly:
- CLAUDE.md (project root entry)
- DESIGN.md (orchestrator — references components, doesn't contain them)
- tokens.md (all design tokens)
- component-<name>.md (one per chosen component, including library components)
- ADMIN-SCAFFOLDING.md (if admin enabled)
- mood-board.html (self-contained, all CSS inline)

For library components selected by the user (from 21st.dev or similar):
- Adapt the code to use this project's tokens (replace hardcoded colours, fonts, spacing with token references)
- Keep the visual behaviour identical to the source
- Cite the source URL in the component file

Push back on tensions in the answers. If two choices contradict (e.g. "luxurious & refined" vibe with "snappy" motion), surface it before writing the spec.

Output each file as a separate code block, clearly labelled. I'll save them into a project repo.

---

## PROJECT CONTEXT
[Filled from wizard step 1]
- Name
- Description
- Platform
- Audience

## AESTHETIC
[Filled from wizard steps 2, 4, 6, 8]
- Vibe (chosen) + one-line rationale
- Feeling words (chosen)
- Display type personality (chosen)
- Body type personality (chosen)
- Button shape (chosen)
- Density (chosen)
- Shadow philosophy (chosen)
- Motion personality (chosen)
- Mode (chosen)

## COLOUR
[Filled from wizard step 5]
- Accent primary (hex)
- Accent secondary (hex or none)
- Pasted hex codes (raw)
- Reference: extract palette from inspiration files

## INSPIRATION
[Filled from wizard step 3]
- URLs (list)
- Visual reference files: <count>, <names>
- Colour swatch files: <count>, <names>
- Font reference files: <count>, <names>

(Note to Claude Desktop: the user will drag the actual files into the conversation alongside this prompt. Analyse them.)

## NAVIGATION & COMPONENTS
[Filled from wizard steps 9, 10]
- Primary navigation pattern
- Tooltip behaviour
- Mobile navigation
- Form layout
- Empty state style
- Loading style
- Notification style

## LIBRARY COMPONENTS SELECTED FOR THIS PROJECT
[Filled from wizard component library picker]

For each component the user picked from their library, include:
- Adapted name (the project-specific name the user chose, or the original)
- Source URL
- Original code snippet (verbatim)
- Screenshot/video reference (filename if uploaded)
- User notes about how to use it

The expectation: produce one component-<name>.md file per item in this list, with the code adapted to this project's tokens.

## HARD LIMITS
[Filled from wizard step 10]
User-specific anti-patterns. Free text.

## RULES
[Filled from wizard step 11]
- Always-on (locked, list verbatim)
- Negotiable, allowed (list)
- Negotiable, banned (list)

## ADMIN
[Filled from wizard step 12]
- Scope (full/minimal/none)
- Optional sections enabled
- Reference: the user's standard admin pattern (routes at /admin, slug-binding, audit log, LLM abstraction)

## ANYTHING ELSE
[Filled from wizard step 12]
Free text catch-all.

---

## OUTPUT REQUIREMENTS

Produce the file bundle in this order:

1. CLAUDE.md
2. DESIGN.md
3. tokens.md
4. component-*.md (one for each chosen component, including library imports)
5. ADMIN-SCAFFOLDING.md (if admin not "none")
6. mood-board.html

Each file in its own clearly labelled code block. Use file path comments at the top of each block (e.g. `<!-- File: /design/DESIGN.md -->`).

DESIGN.md must reference but not contain component code. Component code lives in component-*.md files only.

When done, end with a short summary of what was produced and any tensions or decisions Claude Desktop had to make.
```

---

## Critical rules for the Brief Collector's output

These are non-negotiable for the Brief Collector itself. The application must enforce them before outputting the prompt.

### Required formatting
- Plain text / markdown — no HTML, no rich formatting
- All section headers in the prompt as `## SECTION NAME` (uppercase, with `##`)
- Lists with `-` bullets, not `*`
- Code blocks fenced with triple backticks and a language tag where applicable

### Required content checks before output
The Brief Collector must validate before generating:

1. **Project name is non-empty** — required for file naming
2. **At least one of vibe / accent / mode / typography is set** — otherwise the prompt has no aesthetic direction
3. **If admin is enabled, the admin scope is set** — full / minimal must be explicit
4. **Library components have at least a name** — code or URL or description, but a name minimum

If any check fails, the Brief Collector shows a blocking error pointing to the missing field.

### Required reflection in the prompt
For every wizard answer, the prompt must include both:
- The user's literal choice
- The implication for the design system

Example:
```
Vibe: warm-editorial
  Implication: serif display, off-white-with-warmth canvas, 
  generous spacing, motion duration 280-320ms, narrative tone in copy.
```

This means Claude Desktop doesn't have to guess what "warm-editorial" means — the Brief Collector has already translated.

### Library component handling

When the user adds a component to their library, the Brief Collector captures:
- A name (required)
- An adapted name (optional — if they want to rename it for their use)
- A source URL (optional)
- Pasted code (optional)
- Screenshot / video upload (optional)
- User notes (optional)
- Tags (optional — for filtering in the picker UI)

When the user reaches the wizard's library step, they see the full library and pick which components are relevant for this project. Only picked components appear in the output prompt's `LIBRARY COMPONENTS SELECTED FOR THIS PROJECT` section.

The library itself persists in localStorage (or a JSON file if the Brief Collector is desktop-native), keyed by component name. Adding a component once makes it available in every future project's wizard run.

### File naming convention enforcement

Component files must follow `component-<kebab-case-name>.md`. The Brief Collector enforces this:
- Strip whitespace, replace with hyphens
- Lowercase everything
- Strip non-alphanumeric except hyphens
- Prefix with `component-`

So if the user names a component "Hopper Scroll Effect", it becomes `component-hopper-scroll-effect.md`.

If the user provides a source URL from a known library (21st.dev, magicui.design, etc.), append the source as a suffix: `component-hopper-scroll-effect-21stdev.md`. This way two scroll effects from different sources don't collide.

---

## Worked example

Imagine the user has filled in:
- Project: "MeetingMemory" — meditation-app-style audio recorder
- Vibe: quiet-and-considered
- Accent: #4A5D5C (sage)
- Mode: dual
- Library components selected:
  - "Audio waveform visualiser" from 21st.dev
  - "Card stack reveal" from magicui.design
  - User's own "Soft pulse listening indicator"

The Brief Collector outputs a prompt that ends with:

```
## LIBRARY COMPONENTS SELECTED FOR THIS PROJECT

### audio-waveform-visualiser
- Adapted name: waveform
- Source: https://21st.dev/components/waveform-...
- Original code:
  ```tsx
  [pasted code here]
  ```
- Screenshot: waveform-demo.png (uploaded by user)
- User notes: "Use during recording. Should reflect amplitude in real-time."

### card-stack-reveal
- Adapted name: session-card-stack
- Source: https://magicui.design/...
- Original code: [pasted]
- Screenshot: stack-reveal-demo.mp4 (uploaded by user)
- User notes: "Use for past sessions list — top card peeks behind."

### soft-pulse-listening-indicator
- Source: (user's own)
- Original code: [pasted]
- User notes: "Use when the app is actively listening. Single dot, slow opacity pulse."
```

Claude Desktop receives this and produces:
- `component-waveform.md` with code adapted to use accent_primary instead of the source's hardcoded blue
- `component-session-card-stack.md` with the stack adapted to use the project's radius and shadow tokens
- `component-soft-pulse-listening-indicator.md` essentially as-pasted but with token references

DESIGN.md's component reference list contains:
```
## Component references
- component-button.md — rounded buttons matching the quiet-and-considered vibe
- component-navigation-rail.md — Supabase-style icon rail
- component-form-input.md — stacked layout form inputs
- component-waveform.md — audio waveform visualiser (from library)
- component-session-card-stack.md — card stack reveal (from library)
- component-soft-pulse-listening-indicator.md — listening indicator (user's own)
```

Claude Code, working on the recording screen, only loads `component-waveform.md` and `component-soft-pulse-listening-indicator.md`. It doesn't load the others. Context economy.

---

## How to ensure consistency across projects

This is the whole reason for the two-part architecture. By making the Brief Collector enforce structure, every project gets:

1. **The same files** — CLAUDE.md, DESIGN.md, tokens.md, component-*.md, ADMIN-SCAFFOLDING.md if applicable, mood-board.html
2. **The same naming** — component-<kebab-case>.md
3. **The same orchestration** — DESIGN.md references, doesn't contain
4. **The same library reuse** — components selected from the global library appear identically in every project that uses them

Claude Code, working on any of your projects, encounters the same structure. It learns the pattern once. Onboarding new projects becomes mechanical.

---

## What this spec doesn't cover

- The visual design of the Brief Collector itself (that's in the Brief Collector spec)
- The wizard flow (already designed in the wizard HTML)
- The Claude Desktop conversation flow (Claude Desktop adapts to whatever it receives)

This spec covers only one thing: **the shape of the output prompt and the file bundle Claude Desktop should produce**. Get that right and everything else follows.
