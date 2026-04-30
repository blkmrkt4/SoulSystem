'use client';

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type {
  WizardState,
  LibraryComponent,
  Draft,
  AppTab,
  UploadedFile,
  ExtractionResult,
  AdminSettings,
} from './types';
import { DEFAULT_WIZARD_STATE } from './types';
import * as db from './db';
import { runExtraction } from './extraction';

interface AppState {
  tab: AppTab;
  wizardState: WizardState;
  draftId: string | null;
  library: LibraryComponent[];
  drafts: Draft[];
  activeStep: number;
  loaded: boolean;
}

type Action =
  | { type: 'SET_TAB'; tab: AppTab }
  | { type: 'SET_WIZARD_STATE'; state: Partial<WizardState> }
  | { type: 'SET_FULL_WIZARD_STATE'; state: WizardState; draftId: string }
  | { type: 'NEW_DRAFT' }
  | { type: 'SET_LIBRARY'; library: LibraryComponent[] }
  | { type: 'ADD_COMPONENT'; component: LibraryComponent }
  | { type: 'UPDATE_COMPONENT'; component: LibraryComponent }
  | { type: 'REMOVE_COMPONENTS'; ids: string[] }
  | { type: 'SET_DRAFTS'; drafts: Draft[] }
  | { type: 'SET_STEP'; step: number }
  | { type: 'LOADED' }
  | { type: 'SET_DRAFT_ID'; id: string };

/** Backfill fields added after a draft was saved (e.g. extractions) */
function migrateWizardState(ws: WizardState): WizardState {
  return {
    ...DEFAULT_WIZARD_STATE,
    ...ws,
    extractions: ws.extractions ?? { results: [], useExtractedColors: true, useExtractedFonts: true },
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, tab: action.tab };
    case 'SET_WIZARD_STATE':
      return {
        ...state,
        wizardState: { ...state.wizardState, ...action.state },
      };
    case 'SET_FULL_WIZARD_STATE':
      return {
        ...state,
        wizardState: migrateWizardState(action.state),
        draftId: action.draftId,
        tab: 'wizard',
        activeStep: 1,
      };
    case 'NEW_DRAFT':
      return {
        ...state,
        wizardState: { ...DEFAULT_WIZARD_STATE },
        draftId: crypto.randomUUID(),
        activeStep: 1,
      };
    case 'SET_LIBRARY':
      return { ...state, library: action.library };
    case 'ADD_COMPONENT':
      return { ...state, library: [...state.library, action.component] };
    case 'UPDATE_COMPONENT':
      return {
        ...state,
        library: state.library.map((c) =>
          c.id === action.component.id ? action.component : c
        ),
      };
    case 'REMOVE_COMPONENTS':
      return {
        ...state,
        library: state.library.filter((c) => !action.ids.includes(c.id)),
      };
    case 'SET_DRAFTS':
      return { ...state, drafts: action.drafts };
    case 'SET_STEP':
      return { ...state, activeStep: action.step };
    case 'LOADED':
      return { ...state, loaded: true };
    case 'SET_DRAFT_ID':
      return { ...state, draftId: action.id };
    default:
      return state;
  }
}

const initialState: AppState = {
  tab: 'wizard',
  wizardState: { ...DEFAULT_WIZARD_STATE },
  draftId: null,
  library: [],
  drafts: [],
  activeStep: 1,
  loaded: false,
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  updateWizard: <K extends keyof WizardState>(
    key: K,
    value: WizardState[K]
  ) => void;
  updateNestedWizard: <
    K extends keyof WizardState,
    SK extends keyof WizardState[K]
  >(
    key: K,
    subKey: SK,
    value: WizardState[K][SK]
  ) => void;
  saveComponentToDB: (component: LibraryComponent) => Promise<void>;
  deleteComponentsFromDB: (ids: string[]) => Promise<void>;
  loadDraft: (draft: Draft) => void;
  duplicateDraft: (draft: Draft) => Promise<void>;
  deleteDraftFromDB: (id: string) => Promise<void>;
  markExported: (draftId: string) => Promise<void>;
  getSelectedComponents: () => LibraryComponent[];
  triggerExtraction: (file: UploadedFile, slugs: string[]) => Promise<void>;
  loadWizardState: (wizardState: WizardState, asCopy?: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data from IndexedDB on mount
  useEffect(() => {
    async function load() {
      const [library, drafts, activeDraftId] = await Promise.all([
        db.getAllComponents(),
        db.getAllDrafts(),
        db.getMeta('activeDraftId'),
      ]);
      dispatch({ type: 'SET_LIBRARY', library });
      dispatch({ type: 'SET_DRAFTS', drafts });

      if (activeDraftId) {
        const draft = await db.getDraft(activeDraftId);
        if (draft) {
          dispatch({
            type: 'SET_FULL_WIZARD_STATE',
            state: draft.state,
            draftId: draft.id,
          });
        } else {
          const newId = crypto.randomUUID();
          dispatch({ type: 'SET_DRAFT_ID', id: newId });
        }
      } else {
        const newId = crypto.randomUUID();
        dispatch({ type: 'SET_DRAFT_ID', id: newId });
      }

      dispatch({ type: 'LOADED' });
    }
    load();
  }, []);

  // Auto-save wizard state to IndexedDB with debounce
  const wizardStateRef = useRef(state.wizardState);
  const draftIdRef = useRef(state.draftId);
  wizardStateRef.current = state.wizardState;
  draftIdRef.current = state.draftId;

  useEffect(() => {
    if (!state.loaded || !state.draftId) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const id = draftIdRef.current;
      if (!id) return;
      const existing = await db.getDraft(id);
      const draft: Draft = {
        id,
        state: wizardStateRef.current,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
        exported: existing?.exported || false,
      };
      await db.saveDraft(draft);
      await db.setMeta('activeDraftId', id);

      // Refresh drafts list
      const drafts = await db.getAllDrafts();
      dispatch({ type: 'SET_DRAFTS', drafts });
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.wizardState, state.draftId, state.loaded]);

  const updateWizard = useCallback(
    <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
      dispatch({ type: 'SET_WIZARD_STATE', state: { [key]: value } });
    },
    []
  );

  const updateNestedWizard = useCallback(
    <K extends keyof WizardState, SK extends keyof WizardState[K]>(
      key: K,
      subKey: SK,
      value: WizardState[K][SK]
    ) => {
      dispatch({
        type: 'SET_WIZARD_STATE',
        state: {
          [key]: {
            ...(wizardStateRef.current[key] as Record<string, unknown>),
            [subKey]: value,
          },
        } as Partial<WizardState>,
      });
    },
    []
  );

  const saveComponentToDB = useCallback(
    async (component: LibraryComponent) => {
      await db.saveComponent(component);
      const existing = state.library.find((c) => c.id === component.id);
      if (existing) {
        dispatch({ type: 'UPDATE_COMPONENT', component });
      } else {
        dispatch({ type: 'ADD_COMPONENT', component });
      }
    },
    [state.library]
  );

  const deleteComponentsFromDB = useCallback(async (ids: string[]) => {
    await db.deleteComponents(ids);
    dispatch({ type: 'REMOVE_COMPONENTS', ids });
  }, []);

  const loadDraft = useCallback(
    (draft: Draft) => {
      dispatch({
        type: 'SET_FULL_WIZARD_STATE',
        state: draft.state,
        draftId: draft.id,
      });
    },
    []
  );

  const duplicateDraft = useCallback(async (draft: Draft) => {
    const newId = crypto.randomUUID();
    const newDraft: Draft = {
      id: newId,
      state: {
        ...draft.state,
        project: {
          ...draft.state.project,
          name: draft.state.project.name
            ? `${draft.state.project.name} (copy)`
            : '',
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      exported: false,
    };
    await db.saveDraft(newDraft);
    const drafts = await db.getAllDrafts();
    dispatch({ type: 'SET_DRAFTS', drafts });
    dispatch({
      type: 'SET_FULL_WIZARD_STATE',
      state: newDraft.state,
      draftId: newId,
    });
  }, []);

  const deleteDraftFromDB = useCallback(async (id: string) => {
    await db.deleteDraft(id);
    const drafts = await db.getAllDrafts();
    dispatch({ type: 'SET_DRAFTS', drafts });
  }, []);

  const markExported = useCallback(async (draftId: string) => {
    const draft = await db.getDraft(draftId);
    if (draft) {
      draft.exported = true;
      await db.saveDraft(draft);
      const drafts = await db.getAllDrafts();
      dispatch({ type: 'SET_DRAFTS', drafts });
    }
  }, []);

  const getSelectedComponents = useCallback(() => {
    return state.library.filter((c) =>
      state.wizardState.library.selectedIds.includes(c.id)
    );
  }, [state.library, state.wizardState.library.selectedIds]);

  const triggerExtraction = useCallback(
    async (file: UploadedFile, slugs: string[]) => {
      const settings: AdminSettings = await db.getAdminSettings();

      for (const slug of slugs) {
        // Mark as running
        const pendingResult: ExtractionResult = {
          slug,
          sourceFileId: file.id,
          sourceFileName: file.name,
          status: 'running',
        };

        const currentExtractions = wizardStateRef.current.extractions;
        const updatedResults = [
          ...currentExtractions.results.filter(
            (r) => !(r.sourceFileId === file.id && r.slug === slug)
          ),
          pendingResult,
        ];
        dispatch({
          type: 'SET_WIZARD_STATE',
          state: {
            extractions: { ...currentExtractions, results: updatedResults },
          },
        });

        // Run extraction
        const result = await runExtraction(
          file.blob,
          file.name,
          file.id,
          slug,
          settings
        );

        // Update with result
        const latestExtractions = wizardStateRef.current.extractions;
        const finalResults = [
          ...latestExtractions.results.filter(
            (r) => !(r.sourceFileId === file.id && r.slug === slug)
          ),
          result,
        ];
        dispatch({
          type: 'SET_WIZARD_STATE',
          state: {
            extractions: { ...latestExtractions, results: finalResults },
          },
        });
      }
    },
    []
  );

  const loadWizardState = useCallback(
    (wizardState: WizardState, asCopy = false) => {
      const newId = crypto.randomUUID();
      const ws = asCopy
        ? {
            ...wizardState,
            project: {
              ...wizardState.project,
              name: wizardState.project.name
                ? `${wizardState.project.name} (copy)`
                : '',
            },
          }
        : wizardState;

      dispatch({
        type: 'SET_FULL_WIZARD_STATE',
        state: ws,
        draftId: newId,
      });
      dispatch({ type: 'SET_TAB', tab: 'wizard' });
    },
    []
  );

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        updateWizard,
        updateNestedWizard,
        saveComponentToDB,
        deleteComponentsFromDB,
        loadDraft,
        duplicateDraft,
        deleteDraftFromDB,
        markExported,
        getSelectedComponents,
        triggerExtraction,
        loadWizardState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
