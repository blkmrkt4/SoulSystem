import type { WizardState } from './types';

export interface Tension {
  id: string;
  /** Which step sections this tension should appear near (first = primary) */
  steps: string[];
  /** Short label */
  title: string;
  /** Explanation + how to reconcile */
  message: string;
  /** Which fields are involved (for highlighting) */
  fields: string[];
}

type TensionRule = (state: WizardState) => Tension | null;

function hasPlatform(state: WizardState, ...platforms: string[]): boolean {
  const p = state.project.platform;
  const arr = Array.isArray(p) ? p : [p].filter(Boolean);
  return platforms.some((v) => arr.includes(v));
}

// --- Helpers ---

function hasFeeling(state: WizardState, ...words: string[]): boolean {
  return words.some((w) => state.feeling.includes(w));
}

function isLightAccent(hex: string): boolean {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Relative luminance approximation
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6;
}

function contrastOnWhite(hex: string): number {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return 21;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  // Contrast ratio against white (luminance = 1)
  return (1 + 0.05) / (lum + 0.05);
}

// --- Rules ---

const rules: TensionRule[] = [
  // Vibe vs feeling words
  (s) => {
    if (s.vibe === 'technical' && hasFeeling(s, 'playful', 'friendly', 'warm')) {
      const words = s.feeling.filter((f) => ['playful', 'friendly', 'warm'].includes(f));
      return {
        id: 'vibe-vs-feeling-technical-soft',
        steps: ['step-feeling', 'step-vibe'],
        title: 'Technical vibe + soft feelings',
        message: `"${words.join(', ')}" pulls against your technical vibe. This can work as restrained warmth in micro-interactions and copy tone — the surface stays tight and precise, personality shows in details. If that's not the intent, reconsider one.`,
        fields: ['vibe', 'feeling'],
      };
    }
    return null;
  },

  (s) => {
    if (s.vibe === 'quiet' && hasFeeling(s, 'bold', 'energetic')) {
      const words = s.feeling.filter((f) => ['bold', 'energetic'].includes(f));
      return {
        id: 'vibe-vs-feeling-quiet-bold',
        steps: ['step-feeling', 'step-vibe'],
        title: 'Quiet vibe + bold feelings',
        message: `"${words.join(', ')}" conflicts with quiet-and-considered. Quiet systems whisper; bold ones shout. This can reconcile as "quietly confident" — strong decisions, no excess — but it's an unusual pairing.`,
        fields: ['vibe', 'feeling'],
      };
    }
    return null;
  },

  (s) => {
    if (s.vibe === 'luxurious' && hasFeeling(s, 'playful', 'energetic')) {
      const words = s.feeling.filter((f) => ['playful', 'energetic'].includes(f));
      return {
        id: 'vibe-vs-feeling-luxe-playful',
        steps: ['step-feeling', 'step-vibe'],
        title: 'Luxurious vibe + playful energy',
        message: `Luxury is slow and restrained; "${words.join(', ')}" is fast and expressive. These fight each other. Either the luxury is a front for something energetic underneath, or one of these needs to give.`,
        fields: ['vibe', 'feeling'],
      };
    }
    return null;
  },

  // Button shape vs shadow philosophy
  (s) => {
    if (s.shape.button === 'pill' && s.shape.shadow === 'sharp') {
      return {
        id: 'pill-sharp-shadow',
        steps: ['step-shape'],
        title: 'Pill buttons + sharp shadows',
        message: `Pill buttons typically live with softer ecosystems. Pairing with hard-edged shadows reads as intentional contrast — workable if the pill radius stays tight on buttons only and sharp shadow is used for elevation signals, not ambient depth.`,
        fields: ['shape.button', 'shape.shadow'],
      };
    }
    return null;
  },

  (s) => {
    if (s.shape.button === 'sharp' && s.shape.shadow === 'soft') {
      return {
        id: 'sharp-button-soft-shadow',
        steps: ['step-shape'],
        title: 'Sharp buttons + soft shadows',
        message: `Zero-radius buttons are decisive and editorial; soft shadows are gentle. This can feel indecisive — consider matching sharp buttons with hard-edged or no shadows for consistency.`,
        fields: ['shape.button', 'shape.shadow'],
      };
    }
    return null;
  },

  // Motion vs vibe/feeling
  (s) => {
    if (s.shape.motion === 'bouncy' && (s.vibe === 'technical' || s.vibe === 'luxurious')) {
      return {
        id: 'bouncy-motion-serious-vibe',
        steps: ['step-shape', 'step-vibe'],
        title: 'Bouncy motion + serious vibe',
        message: `Spring animations feel playful and casual. Your ${s.vibe} vibe expects precise (snappy) or slow (luxe) motion. Bouncy will undercut the gravity of the system unless tightly constrained to specific moments.`,
        fields: ['shape.motion', 'vibe'],
      };
    }
    return null;
  },

  (s) => {
    if (s.shape.motion === 'luxe' && (s.vibe === 'technical' || s.vibe === 'bold')) {
      return {
        id: 'luxe-motion-fast-vibe',
        steps: ['step-shape', 'step-vibe'],
        title: 'Slow motion + fast vibe',
        message: `Luxe motion (320–480ms) feels deliberate and premium. Your ${s.vibe} vibe expects speed and decisiveness. Slow transitions will frustrate power users — consider snappy or considered instead.`,
        fields: ['shape.motion', 'vibe'],
      };
    }
    return null;
  },

  // Density vs vibe
  (s) => {
    if (s.shape.density === 'compact' && s.vibe === 'luxurious') {
      return {
        id: 'compact-luxe',
        steps: ['step-shape', 'step-vibe'],
        title: 'Compact density + luxurious vibe',
        message: `Luxury breathes — generous whitespace is its signature. Compact density packs things tight. These contradict unless the product is a luxury data tool (rare). Consider comfortable density.`,
        fields: ['shape.density', 'vibe'],
      };
    }
    return null;
  },

  (s) => {
    if (s.shape.density === 'comfortable' && s.vibe === 'technical') {
      // This is mild — only flag if they also chose compact-leaning signals
      return null;
    }
    return null;
  },

  // Colour accessibility: accent on light mode
  (s) => {
    if (!s.colour.accent || !s.mode) return null;
    const needsLight = s.mode === 'light' || s.mode === 'dual' || s.mode === 'auto';
    if (needsLight && isLightAccent(s.colour.accent)) {
      const ratio = contrastOnWhite(s.colour.accent);
      if (ratio < 3) {
        return {
          id: 'accent-contrast-fail',
          steps: ['step-colour', 'step-mode'],
          title: 'Accent colour fails contrast on light',
          message: `${s.colour.accent} has only ${ratio.toFixed(1)}:1 contrast on white — below WCAG AA (4.5:1 for text, 3:1 for large text). On light mode, this accent can only be used as a fill/background with dark text on top, or for decorative elements. You'll need a darker variant for interactive text and small UI.`,
          fields: ['colour.accent', 'mode'],
        };
      }
    }
    return null;
  },

  // Typography vs vibe
  (s) => {
    if (s.typography.display === 'display-impact' && (s.vibe === 'quiet' || s.vibe === 'luxurious')) {
      return {
        id: 'impact-display-quiet-vibe',
        steps: ['step-typography', 'step-vibe'],
        title: 'Heavy display type + quiet/luxurious vibe',
        message: `Impact display type (bold, uppercase, tight) shouts. Your ${s.vibe} vibe expects restraint. This will dominate every page and fight the intended tone. Consider elegant or classic serif instead.`,
        fields: ['typography.display', 'vibe'],
      };
    }
    return null;
  },

  (s) => {
    if (
      (s.typography.display === 'elegant-serif' || s.typography.display === 'classic-serif') &&
      s.vibe === 'technical'
    ) {
      return {
        id: 'serif-display-technical',
        steps: ['step-typography', 'step-vibe'],
        title: 'Serif display + technical vibe',
        message: `Serifs read as editorial and traditional. Technical products typically use grotesque or geometric sans for display. This can work as a deliberate contrast (Linear's occasional serif flourishes) but it's unusual — make sure it's intentional.`,
        fields: ['typography.display', 'vibe'],
      };
    }
    return null;
  },

  // Navigation vs platform
  (s) => {
    if (s.navigation.primary === 'bottom-tabs' && hasPlatform(s, 'web', 'desktop')) {
      return {
        id: 'bottom-tabs-desktop',
        steps: ['step-navigation'],
        title: 'Bottom tabs on desktop',
        message: `Bottom tabs work great on mobile but waste prime desktop real estate. On web/desktop, users expect navigation at the top or left. Consider a sidebar or top bar for desktop, with bottom tabs reserved for the mobile breakpoint.`,
        fields: ['navigation.primary', 'project.platform'],
      };
    }
    return null;
  },

  (s) => {
    if (s.navigation.primary === 'cmdk' && hasPlatform(s, 'ios', 'android')) {
      return {
        id: 'cmdk-mobile',
        steps: ['step-navigation'],
        title: 'Command palette on mobile',
        message: `⌘K command palettes are keyboard-first — they don't work well as the primary navigation on touch devices. Consider bottom tabs or a hamburger drawer for mobile.`,
        fields: ['navigation.primary', 'project.platform'],
      };
    }
    return null;
  },

  // Glassmorphism + dark mode
  (s) => {
    if (s.rules.glassmorphism && s.mode === 'dark') {
      return {
        id: 'glass-dark-only',
        steps: ['step-rules', 'step-mode'],
        title: 'Glassmorphism on dark-only mode',
        message: `Frosted glass effects need contrast between the blurred background and the surface. On dark-only apps, this often results in muddy, low-contrast panels. Test carefully — you may need brighter, more saturated backgrounds for glass to read well.`,
        fields: ['rules.glassmorphism', 'mode'],
      };
    }
    return null;
  },

  // Playful vibe but snappy motion
  (s) => {
    if (s.vibe === 'playful' && s.shape.motion === 'snappy') {
      return {
        id: 'playful-snappy',
        steps: ['step-shape', 'step-vibe'],
        title: 'Playful vibe + snappy motion',
        message: `Playful products typically use bouncy or considered motion to reinforce their personality. Snappy (120–180ms) feels clinical and precise — it'll undercut the friendliness. Consider bouncy or at least considered.`,
        fields: ['shape.motion', 'vibe'],
      };
    }
    return null;
  },

  // Notification style vs vibe
  (s) => {
    if (s.components.notification === 'modal' && s.vibe !== 'bold') {
      return {
        id: 'modal-notifications',
        steps: ['step-components'],
        title: 'Modal notifications for non-destructive actions',
        message: `Modal confirmations block the user and break flow. They're best reserved for destructive or irreversible actions. For general feedback, toasts or inline messages are less disruptive.`,
        fields: ['components.notification'],
      };
    }
    return null;
  },

  // Dual accent conflict
  (s) => {
    if (s.colour.accent && s.colour.secondary && s.colour.accent === s.colour.secondary) {
      return {
        id: 'same-accent',
        steps: ['step-colour'],
        title: 'Primary and secondary accent are identical',
        message: `Both accents are the same colour. A secondary accent should be visually distinct to create meaningful separation between categories.`,
        fields: ['colour.accent', 'colour.secondary'],
      };
    }
    return null;
  },
];

/**
 * Run all tension rules against the current wizard state.
 * Returns only the tensions that fired (non-null).
 */
export function detectTensions(state: WizardState): Tension[] {
  const tensions: Tension[] = [];
  for (const rule of rules) {
    const result = rule(state);
    if (result) tensions.push(result);
  }
  return tensions;
}

/**
 * Get tensions relevant to a specific step section ID.
 */
export function getTensionsForStep(tensions: Tension[], stepId: string): Tension[] {
  return tensions.filter((t) => t.steps[0] === stepId);
}
