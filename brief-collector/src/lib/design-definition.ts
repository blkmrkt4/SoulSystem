import type {
  WizardState,
  UploadedFile,
  DesignDefinition,
  SerializedFileRef,
} from './types';

function getExtension(file: UploadedFile): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const mimeMap: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
  };
  return mimeMap[file.type] || 'bin';
}

function serializeFile(file: UploadedFile): SerializedFileRef {
  return {
    id: file.id,
    name: file.name,
    size: file.size,
    type: file.type,
    category: file.category,
    diskFilename: `${file.id}.${getExtension(file)}`,
  };
}

export interface SerializeResult {
  definition: DesignDefinition;
  filesToWrite: { diskFilename: string; blob: Blob }[];
}

/**
 * Convert in-memory WizardState (with blobs) to disk-safe DesignDefinition
 * plus a list of blobs that need to be written to the uploads/ directory.
 */
export function serializeForDisk(
  state: WizardState,
  selectedComponentIds: string[],
  currentVersion: number
): SerializeResult {
  const filesToWrite: { diskFilename: string; blob: Blob }[] = [];

  const serializeFiles = (files: UploadedFile[]): SerializedFileRef[] => {
    return files.map((f) => {
      const ref = serializeFile(f);
      if (f.blob) {
        filesToWrite.push({ diskFilename: ref.diskFilename, blob: f.blob });
      }
      return ref;
    });
  };

  const { inspiration, ...restState } = state;

  const definition: DesignDefinition = {
    version: currentVersion,
    savedAt: new Date().toISOString(),
    state: {
      ...restState,
      inspiration: {
        urls: inspiration.urls,
        hexes: inspiration.hexes,
        files: serializeFiles(inspiration.files),
        fonts: serializeFiles(inspiration.fonts),
        swatches: serializeFiles(inspiration.swatches),
      },
    },
    selectedComponentIds,
  };

  return { definition, filesToWrite };
}

/**
 * Reconstruct a full WizardState from a DesignDefinition and a map of
 * diskFilename → Blob (loaded from the uploads/ directory).
 */
export function deserializeFromDisk(
  definition: DesignDefinition,
  blobMap: Map<string, Blob>
): WizardState {
  const deserializeFiles = (refs: SerializedFileRef[]): UploadedFile[] => {
    return refs.map((ref) => ({
      id: ref.id,
      name: ref.name,
      size: ref.size,
      type: ref.type,
      category: ref.category,
      blob: blobMap.get(ref.diskFilename) || new Blob(),
    }));
  };

  const { inspiration, ...restState } = definition.state;

  return {
    ...restState,
    inspiration: {
      urls: inspiration.urls,
      hexes: inspiration.hexes,
      files: deserializeFiles(inspiration.files),
      fonts: deserializeFiles(inspiration.fonts),
      swatches: deserializeFiles(inspiration.swatches),
    },
  } as WizardState;
}

/**
 * Collect all disk filenames referenced in a DesignDefinition,
 * so the load route knows which files to read from uploads/.
 */
export function getAllDiskFilenames(definition: DesignDefinition): string[] {
  const insp = definition.state.inspiration;
  return [
    ...insp.files.map((f) => f.diskFilename),
    ...insp.fonts.map((f) => f.diskFilename),
    ...insp.swatches.map((f) => f.diskFilename),
  ];
}
