# Part 1 — Brief Collector Application Spec

> **What this is.** The build specification for the Brief Collector — a local application you'll build with Claude Code, then run on your machine forever after. It collects all the design decisions for a new project (via the wizard you've already designed), maintains your global component library, and outputs a single structured prompt you paste into Claude Desktop.
>
> **What this is not.** The wizard UI itself — that's been designed already in `design-wizard.html`. The application's job is to wrap that wizard in persistent local storage, add the component library feature, and output prompts that conform to `generation-specification.md`.
>
> **How to use it.** Hand this file to Claude Code along with `generation-specification.md` and `design-wizard.html`. Tell Claude Code: *"Build me a local desktop application that implements this spec. Use the existing wizard as the starting UI. Read generation-specification.md before deciding what the output prompt looks like."*

---

## Why this exists

You'll start projects regularly. Each one needs a coherent design system. Each one might pull from a growing library of components you've collected. Without this app, you'd be re-entering the same answers, re-pasting the same components, re-typing the same prompt structure. With it, each new project takes 10 minutes of clicking through a wizard, and the output prompt is always perfectly structured for Claude Desktop.

The application has one job: **collect everything, output a perfect prompt**. It does no generation itself. All the heavy lifting happens in Claude Desktop on your Max subscription. The Brief Collector pays nothing in API costs because it makes no API calls.

---

## Tech stack recommendation

When you ask Claude Code to build this, suggest:

- **Framework:** Next.js with App Router (or Tauri if you want a true desktop app — but Next.js is faster to build)
- **Storage:** IndexedDB for local persistence (handles file blobs better than localStorage)
- **Styling:** Tailwind CSS, plus the wizard's existing inline CSS as a starting point
- **Run mode:** `npm run dev` on `localhost:3000`. No deployment needed, no domain, no auth. Just runs locally when you need it.

If you'd rather not run a Node process, Claude Code can build it as a single self-contained HTML file with everything in one place. Less powerful (no real file system access), but simpler — same as the existing wizard with library features added.

Either path works. Decide based on whether you want the app to be a binary you double-click, or a tab you keep bookmarked.

---

## Application structure

The app is one wizard, one library manager, and one export view.

```
┌─────────────────────────────────────────────┐
│  TOP BAR                                    │
│  - Brand                                    │
│  - Tab switcher: [Wizard] [Library] [Drafts]│
│  - Progress indicator (when in wizard)      │
└─────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼────┐   ┌─────▼────┐   ┌─────▼────┐
   │ WIZARD  │   │ LIBRARY  │   │ DRAFTS   │
   │ 12 steps│   │ Manager  │   │ Past     │
   │ + lib   │   │ Add /    │   │ projects │
   │ picker  │   │ edit /   │   │ Open or  │
   │         │   │ tag /    │   │ duplicate│
   │         │   │ delete   │   │          │
   └─────────┘   └──────────┘   └──────────┘
```

### Tab 1 — Wizard

Use the existing `design-wizard.html` as the starting point. Twelve steps already designed. The only change: insert a new step between "Negotiable rules" (step 11) and "Admin" (step 12) — call it **"Library components"** and treat it as step 12, pushing Admin to 13. New flow has 13 steps.

The new library step is described in detail below.

### Tab 2 — Library manager

A persistent local store of components you've collected. Independent of any project. Add components here once; they become available in the wizard's library picker step for every future project.

### Tab 3 — Drafts

Every wizard run gets saved as a draft. Open a past project to review or duplicate it. Useful when you're starting a new project that's similar to an old one — duplicate, tweak, regenerate.

---

## The library step (the new wizard step)

This is the centrepiece of the application. Goes between current step 11 (Negotiable rules) and current step 12 (Admin), making the new flow 13 steps total.

### What the user sees

A grid of every component currently in their library. Each component card shows:
- A thumbnail (the screenshot/video if uploaded, otherwise a placeholder)
- The component's adapted name
- Tags (if any)
- A "preview" button that opens a side panel showing the full code and any media

Above the grid: a search box, a tag filter, and a sort dropdown (recently added / alphabetical / most-used).

To the right of the grid: a "Selected for this project" panel showing what the user has picked so far for this project. Drag-and-drop or click-to-toggle.

Below: an "Add new component" button that opens the same form used in the Library tab. Adding a new component from inside the wizard immediately makes it available for picking, without leaving the flow.

### What gets exported to the prompt

Only the components the user picks for this project. Each picked component's full data (name, source URL, code, screenshot/video filename, notes) goes into the prompt under the `LIBRARY COMPONENTS SELECTED FOR THIS PROJECT` section, formatted as specified in `generation-specification.md`.

The library data structure that lives in IndexedDB:

```javascript
{
  id: 'cmp_abc123',                    // generated UUID
  name: 'Audio waveform visualiser',   // display name
  adaptedName: 'waveform',             // user's project-specific rename, optional
  sourceUrl: 'https://21st.dev/...',   // optional
  sourceLibrary: '21stdev',            // auto-detected from URL
  code: '...',                         // pasted code, optional
  codeLanguage: 'tsx',                 // auto-detected
  description: 'A real-time audio waveform that reflects amplitude.',
  notes: 'Use during recording sessions.',
  tags: ['audio', 'animation', 'recording'],
  media: [                             // screenshots, videos
    { type: 'image', filename: 'waveform.png', blob: <Blob> },
    { type: 'video', filename: 'waveform-demo.mp4', blob: <Blob> }
  ],
  createdAt: 1714389600000,
  lastUsedAt: 1714390000000,
  usedInProjects: ['proj_xyz789']      // for the "most used" sort
}
```

### The "Add component" form

Required field:
- **Name** (text input, defaults to derived from URL if URL is pasted first)

All optional:
- **Source URL** (text input — when pasted, the form attempts to fetch the page title and detect the source library)
- **Adapted name** (the kebab-case name to use in this project; auto-derived from name)
- **Description** (textarea, one or two lines)
- **Code** (large textarea with monospace font; language auto-detected from content)
- **Screenshot/video upload** (multiple files allowed, drag-drop)
- **Notes** (textarea — when to use, when not to)
- **Tags** (chip input — type a tag, press enter to add)

Save button at the bottom. Component lands in IndexedDB and immediately appears in the library grid.

### Importing from URL

A "smart paste" feature: if the user pastes a URL into the form, attempt to fetch the page metadata. From `21st.dev`, `magicui.design`, `aceternity.com`, `shadcn-ui.com`, and similar known sources, extract:
- The component title (auto-fills name)
- The component description if present
- The featured screenshot if accessible

This is a nicety, not required — but it speeds up the common case. If fetching fails (CORS, no metadata), the form just stays empty and the user fills it in manually.

For Tauri builds, this works without CORS issues. For Next.js, it'll need a server-side fetch route to bypass CORS.

---

## Library tab — the standalone manager

Same component grid as the wizard's library step. Plus:

- **Bulk actions:** select multiple, delete, retag
- **Edit:** click a component to open the full edit form (same as Add)
- **Export library:** dump the entire library to a JSON file for backup or transfer to another machine
- **Import library:** load a previously exported JSON

The library is local-first. It never goes to a server. If the user wants it on multiple machines, they export, copy the file, and import on the other machine.

---

## Drafts tab

Every wizard run autosaves to IndexedDB on every step change. The Drafts tab lists them.

Each draft card shows:
- Project name (or "Untitled draft" if the user didn't fill it in)
- Date saved
- A snapshot — vibe, accent colour, mode, completion percentage
- Actions: Open, Duplicate, Export prompt, Delete

"Open" loads the draft into the wizard. "Duplicate" creates a copy with a new ID — useful when starting a related project. "Export prompt" regenerates and copies the prompt without re-walking the wizard.

---

## The export view

Reached from the wizard's final step (after the new library step plus Admin). Same modal as the existing wizard, but the export now includes:
- The full structured prompt (per `generation-specification.md`)
- A "Save uploaded files locally" button — bundles all uploaded inspiration files, screenshots, and component media into a zip the user can drag into Claude Desktop alongside the prompt
- A "Copy prompt only" button
- A "Download as JSON" button — for backup
- A "Mark this draft as exported" button — moves it from "active drafts" to "exported projects" for later reference

---

## Critical behaviours

### Persistence
- Every keystroke, click, and toggle in the wizard saves to IndexedDB within ~500ms
- Library is independent of drafts — adding a component to the library doesn't affect any specific project
- Closing and reopening the app restores the last active draft

### File handling
- Inspiration uploads (images, screenshots, palette swatches) save to IndexedDB as Blobs
- The blobs travel with the draft and the export bundle
- The prompt references files by name; Claude Desktop sees them when the user drags them in

### Validation gates
The Brief Collector blocks export if:
- Project name is empty
- Vibe is unset
- Accent colour is unset
- Mode is unset
- Admin scope is unset
- Any picked library component has no name

When blocked, scroll to the offending field and highlight it.

### The output prompt structure
**Read generation-specification.md.** The prompt structure is defined there. The Brief Collector must produce prompts that conform exactly to that spec.

---

## What Claude Code should NOT build

Out of scope. Don't add these unless explicitly asked later:

- User authentication
- Any kind of cloud sync (the data lives locally; export/import is the sharing mechanism)
- Live preview of the design system as the user fills the wizard out (that happens in Claude Desktop)
- API calls to Claude or any LLM (the whole point is zero generation cost)
- Image vision analysis (that happens in Claude Desktop when the user drags files in)
- A built-in component preview using the actual code (just show the screenshot/video they uploaded; running arbitrary user code is a security headache)

---

## Build order for Claude Code

If Claude Code asks how to sequence the build, suggest this order:

1. **Set up the Next.js / Tauri scaffold.** Empty app, top bar, three empty tabs.
2. **Port the existing wizard HTML into a Wizard component.** Get all 12 existing steps rendering. Wire state to React state (or Zustand, etc.).
3. **Add IndexedDB persistence.** Auto-save on every state change. Load on mount.
4. **Build the Drafts tab.** List, open, duplicate, delete. Verify persistence works.
5. **Build the Library tab — empty state and add form.** Get the schema working. Add a component, verify it persists.
6. **Add the library step to the wizard.** Picker grid. Selection panel. Connect to the same library store.
7. **Implement the smart-paste URL feature.** Optional — start with manual entry only, add URL parsing later.
8. **Build the export view.** Generate the prompt per generation-specification.md. Bundle uploaded files into a zip.
9. **Polish.** Empty states, validation gates, scroll-to-error on export block.

Each step takes 30 minutes to a few hours of Claude Code time. Total build: 4–8 hours of conversation, depending on how polished you want it.

---

## A note on the relationship between this spec and the wizard HTML

The wizard HTML (`design-wizard.html`) is the visual / interaction reference. Use it as a faithful starting point for the Wizard tab. Don't redesign the existing 12 steps — they're already validated. Just port them into the React structure and add the new library step.

If Claude Code thinks the wizard HTML needs any modification (responsive issues, accessibility gaps), it should flag those and ask before changing — not silently rework things.

---

## What success looks like

You sit down to start a new project. You open the Brief Collector. You either:
- Walk through the wizard fresh, picking from your accumulated library along the way
- Or duplicate an old draft, tweak it, regenerate

Either way, in 10–15 minutes you have a perfectly structured prompt. You paste it into Claude Desktop. Claude Desktop produces the bundle: CLAUDE.md, DESIGN.md, tokens.md, component-*.md files, mood-board.html, ADMIN-SCAFFOLDING.md if applicable. You save them into a new project repo. You hand the project to Claude Code with the instruction *"Read CLAUDE.md to start."* It builds the product, conforming to your design system every time.

The whole loop costs you nothing in API spend. Both Claude Code (the build) and Claude Desktop (the generation) run on your Max subscription. The Brief Collector itself runs locally and makes no network calls except optional URL fetches when adding components.

That's the system. Build the Brief Collector once, use it for every project after.
