export interface MediaFile {
  type: 'image' | 'video';
  filename: string;
  blob: Blob;
}

export interface LibraryComponent {
  id: string;
  name: string;
  adaptedName: string;
  sourceUrl: string;
  sourceLibrary: string;
  code: string;
  codeLanguage: string;
  description: string;
  notes: string;
  tags: string[];
  media: MediaFile[];
  createdAt: number;
  lastUsedAt: number;
  usedInProjects: string[];
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  blob: Blob;
  category: 'inspiration' | 'swatches' | 'fonts' | 'component';
}

export interface WizardState {
  project: {
    name: string;
    description: string;
    platform: string[];
    register: 'brand' | 'product' | '';
    audience: string;
  };
  vibe: string;
  inspiration: {
    urls: string;
    files: UploadedFile[];
    hexes: string;
    fonts: UploadedFile[];
    swatches: UploadedFile[];
    antiReferences: string;
  };
  feeling: string[];
  colour: {
    accent: string;
    secondary: string;
  };
  typography: {
    display: string;
    body: string;
  };
  mode: string;
  shape: {
    button: string;
    density: string;
    shadow: string;
    motion: string;
  };
  navigation: {
    primary: string;
    tooltip: string;
    mobile: string;
  };
  components: {
    form: string;
    empty: string;
    loading: string;
    notification: string;
  };
  hardLimits: string;
  rules: Record<string, boolean>;
  library: {
    selectedIds: string[];
  };
  admin: {
    scope: string;
    extras: string[];
  };
  anythingElse: string;
  extractions: Extractions;
}

export interface Draft {
  id: string;
  state: WizardState;
  createdAt: number;
  updatedAt: number;
  exported: boolean;
}

export const DEFAULT_WIZARD_STATE: WizardState = {
  project: { name: '', description: '', platform: [], register: '', audience: '' },
  vibe: '',
  inspiration: { urls: '', files: [], hexes: '', fonts: [], swatches: [], antiReferences: '' },
  feeling: [],
  colour: { accent: '', secondary: '' },
  typography: { display: '', body: '' },
  mode: '',
  shape: { button: '', density: '', shadow: '', motion: '' },
  navigation: { primary: '', tooltip: '', mobile: '' },
  components: { form: '', empty: '', loading: '', notification: '' },
  hardLimits: '',
  rules: {
    // Visual tells
    glassmorphism: false,
    'gradient-text': false,
    glow: false,
    centered: false,
    'pure-bw': false,
    'side-tab': false,
    'icon-tile': false,
    'dark-neon': false,
    'emoji-as-icon': false,
    'floating-badges': false,
    'identical-card-grids': false,
    'hero-metric-layout': false,
    'sparklines-decorative': false,
    'rounded-rect-generic-shadow': false,
    'three-card-trio': false,
    // Typography tells
    inter: false,
    'monospace-as-technical': false,
    'single-font': false,
    'flat-type-hierarchy': false,
    'overused-fonts': false,
    // Motion tells
    bouncy: false,
    // Interaction tells
    modals: false,
    'every-button-primary': false,
    'redundant-ux-writing': false,
    'amputating-mobile': false,
    'generic-hero-copy': false,
    'avatar-initials': false,
  },
  library: { selectedIds: [] },
  admin: { scope: '', extras: [] },
  anythingElse: '',
  extractions: { results: [], useExtractedColors: true, useExtractedFonts: true },
};

export type AppTab = 'wizard' | 'library' | 'drafts';

// --- Extraction types ---

export interface ExtractedColor {
  hex: string;
  name?: string;
  role?: string; // e.g. "primary", "accent", "background", "muted"
}

export interface ExtractedFont {
  name: string;
  weight?: string;
  style?: string;
  role?: string; // e.g. "display", "body", "mono"
  googleFontsMatch?: string; // closest Google Fonts equivalent
  confidence?: number; // 0-1
}

export interface ExtractionResult {
  slug: string;
  sourceFileId: string;
  sourceFileName: string;
  status: 'pending' | 'running' | 'done' | 'error';
  error?: string;
  colors?: ExtractedColor[];
  fonts?: ExtractedFont[];
  raw?: string; // raw model response for debugging
  extractedAt?: number;
}

export interface Extractions {
  results: ExtractionResult[];
  useExtractedColors: boolean;
  useExtractedFonts: boolean;
}

// --- Admin settings ---

export interface ExtractionSlug {
  slug: string;
  label: string;
  prompt: string;
  enabled: boolean;
}

export interface AdminSettings {
  openRouterApiKey: string;
  model: string;
  extractionSlugs: ExtractionSlug[];
}

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  openRouterApiKey: '',
  model: 'qwen/qwen2.5-vl-72b-instruct',
  extractionSlugs: [
    {
      slug: 'color-extraction',
      label: 'Colour extraction',
      enabled: true,
      prompt: `You are a colour extraction specialist. Analyse the uploaded image and extract every distinct colour you can identify.

Return a JSON array of colour objects. Each object must have:
- "hex": the hex colour code (e.g. "#2B6CB0")
- "name": a short human-readable name (e.g. "slate blue", "warm cream")
- "role": one of "primary", "accent", "secondary", "background", "muted", "highlight", or "neutral"

Return ONLY the JSON array, no explanation. Example:
[{"hex":"#2B6CB0","name":"slate blue","role":"primary"},{"hex":"#F5F0E8","name":"warm cream","role":"background"}]`,
    },
    {
      slug: 'font-identification',
      label: 'Font identification',
      enabled: true,
      prompt: `You are a typography identification specialist. Analyse the uploaded image and identify any fonts or typefaces visible.

Return a JSON array of font objects. Each object must have:
- "name": the font name as best you can identify it
- "weight": the weight (e.g. "400", "700", "bold")
- "style": "normal" or "italic"
- "role": one of "display", "body", "mono", or "accent"
- "googleFontsMatch": the closest available Google Font (must be a real Google Font name)
- "confidence": 0.0 to 1.0, how confident you are in the identification

Return ONLY the JSON array, no explanation. Example:
[{"name":"Fraunces","weight":"400","style":"italic","role":"display","googleFontsMatch":"Fraunces","confidence":0.9}]`,
    },
  ],
};

export const DEFAULT_EXTRACTIONS: Extractions = {
  results: [],
  useExtractedColors: true,
  useExtractedFonts: true,
};

// --- Design Definition types (disk-safe) ---

export interface SerializedFileRef {
  id: string;
  name: string;
  size: number;
  type: string;
  category: UploadedFile['category'];
  diskFilename: string;
}

/** The serialized inspiration section with file refs instead of blobs */
export interface SerializedInspiration {
  urls: string;
  files: SerializedFileRef[];
  hexes: string;
  fonts: SerializedFileRef[];
  swatches: SerializedFileRef[];
}

/** The on-disk representation of a complete design definition */
export interface DesignDefinition {
  version: number;
  savedAt: string;
  state: Omit<WizardState, 'inspiration'> & {
    inspiration: SerializedInspiration;
  };
  selectedComponentIds: string[];
}
