
import React, { createContext, useContext, useReducer, useEffect, Dispatch } from 'react';
import type { AppState, Project, Specialty } from '../types';
import { THEMES, projectTemplates } from '../constants';

type Action =
    | { type: 'INITIALIZE_STATE'; payload: AppState }
    | { type: 'CREATE_NEW_WORKSPACE' }
    | { type: 'UPDATE_WORKSPACE_NAME'; payload: string }
    | { type: 'TOGGLE_THEME' }
    | { type: 'TOGGLE_SIDEBAR_SECTION'; payload: string }
    | { type: 'ADD_PROJECT'; payload: { name: string } }
    | { type: 'DELETE_PROJECT'; payload: number }
    | { type: 'RENAME_PROJECT'; payload: { index: number; newName: string } }
    | { type: 'DUPLICATE_PROJECT'; payload: number }
    | { type: 'TOGGLE_ARCHIVE_PROJECT'; payload: number }
    | { type: 'SET_ACTIVE_PROJECT'; payload: number }
    | { type: 'UPDATE_PROJECT'; payload: { field: keyof Project; value: any } }
    | { type: 'ADD_SPECIALTY' }
    | { type: 'DELETE_SPECIALTY'; payload: number }
    | { type: 'DUPLICATE_SPECIALTY'; payload: number }
    | { type: 'UPDATE_SPECIALTY'; payload: { index: number; field: keyof Specialty; value: any } }
    | { type: 'LOAD_TEMPLATE'; payload: string }
    | { type: 'IMPORT_STATE'; payload: { state: AppState; fileName: string } }
    | { type: 'IMPORT_PROJECT'; payload: Project }
    | { type: 'SET_PROJECT_SEARCH'; payload: string }
    | { type: 'SET_PROJECT_SORT'; payload: 'creationDate' | 'projectName' }
    | { type: 'SET_PROJECT_SHOW_ARCHIVED'; payload: boolean }
    | { type: 'SAVE_TO_FILE' };

const AppStateContext = createContext<{ state: AppState; dispatch: Dispatch<Action> } | undefined>(undefined);

const createNewProject = (name: string): Project => ({
    projectName: name,
    vazlozhitel: "", izpalnitel: "", area: 1000,
    currencyMode: "bgn_eur", projectPhase: "Технически проект",
    showAdvanceCheck: true, bonusCheck: false,
    bonusType: 'percent', bonusPercent: 10, bonusAmount: 0,
    bonusAdvance: 0, bonusIsPaidCheck: false, logoSrc: "",
    specialties: JSON.parse(JSON.stringify(projectTemplates.min)),
    contractors: {}, projectNotes: [],
    filters: { activeOnly: false },
    miniCalcState: {},
    creationDate: new Date().toISOString(),
    isArchived: false,
});

const createNewWorkspace = (): AppState => ({
    workspaceName: "Ново работно пространство",
    projects: [createNewProject("Нов проект 1")],
    activeProjectIndex: 0,
    theme: 'theme-light',
    sidebarState: { "workspace-section": false, "project-list-section": false, "project-settings-section": false, "bonus-section": true, "actions-section": false },
    projectListState: { searchTerm: '', sortBy: 'creationDate', sortOrder: 'desc', showArchived: false },
    isDirty: false,
    lastModified: new Date().toISOString(),
    lastFileName: '',
});

const appReducer = (state: AppState, action: Action): AppState => {
    const newState = { ...state, isDirty: true, lastModified: new Date().toISOString() };
    const activeProject = newState.projects[newState.activeProjectIndex];

    switch (action.type) {
        case 'INITIALIZE_STATE':
            return action.payload;
        case 'CREATE_NEW_WORKSPACE':
            return { ...createNewWorkspace(), isDirty: false };
        case 'UPDATE_WORKSPACE_NAME':
            return { ...newState, workspaceName: action.payload };
        case 'TOGGLE_THEME': {
            const currentIndex = THEMES.indexOf(newState.theme);
            return { ...newState, theme: THEMES[(currentIndex + 1) % THEMES.length] };
        }
        case 'TOGGLE_SIDEBAR_SECTION': {
            const newSidebarState = { ...newState.sidebarState };
            newSidebarState[action.payload] = !newSidebarState[action.payload];
            return { ...newState, sidebarState: newSidebarState };
        }
        case 'ADD_PROJECT':
            newState.projects.push(createNewProject(action.payload.name));
            newState.activeProjectIndex = newState.projects.length - 1;
            return newState;
        case 'DELETE_PROJECT': {
            newState.projects.splice(action.payload, 1);
            if(newState.activeProjectIndex === action.payload) {
                 newState.activeProjectIndex = Math.max(0, action.payload - 1);
                 if (newState.projects.length === 0) newState.activeProjectIndex = -1;
            } else if (newState.activeProjectIndex > action.payload) {
                newState.activeProjectIndex--;
            }
            return newState;
        }
        case 'RENAME_PROJECT':
            newState.projects[action.payload.index].projectName = action.payload.newName;
            return newState;
        case 'DUPLICATE_PROJECT': {
            const projectToDuplicate = JSON.parse(JSON.stringify(newState.projects[action.payload]));
            projectToDuplicate.projectName += " - Копие";
            projectToDuplicate.creationDate = new Date().toISOString();
            newState.projects.splice(action.payload + 1, 0, projectToDuplicate);
            newState.activeProjectIndex = action.payload + 1;
            return newState;
        }
        case 'TOGGLE_ARCHIVE_PROJECT':
            newState.projects[action.payload].isArchived = !newState.projects[action.payload].isArchived;
            return newState;
        case 'SET_ACTIVE_PROJECT':
            return { ...newState, activeProjectIndex: action.payload };
        case 'UPDATE_PROJECT':
            if (activeProject) {
                (activeProject[action.payload.field] as any) = action.payload.value;
            }
            return newState;
        case 'ADD_SPECIALTY':
            if (activeProject) {
                const newSpecialty = JSON.parse(JSON.stringify(projectTemplates.min[3]));
                newSpecialty.name = "Нова специалност";
                newSpecialty.value = 0;
                activeProject.specialties.push(newSpecialty);
            }
            return newState;
        case 'DELETE_SPECIALTY':
            if(activeProject) activeProject.specialties.splice(action.payload, 1);
            return newState;
        case 'DUPLICATE_SPECIALTY':
            if(activeProject) {
                const duplicated = JSON.parse(JSON.stringify(activeProject.specialties[action.payload]));
                duplicated.name += " - Копие";
                activeProject.specialties.splice(action.payload + 1, 0, duplicated);
            }
            return newState;
        case 'UPDATE_SPECIALTY':
            if (activeProject) {
                const specialty = activeProject.specialties[action.payload.index];
                if (specialty) {
                    (specialty[action.payload.field] as any) = action.payload.value;
                }
            }
            return newState;
        case 'LOAD_TEMPLATE':
            if (activeProject && projectTemplates[action.payload]) {
                if(confirm('Сигурни ли сте? Това ще замени текущия списък със специалности.')){
                    activeProject.specialties = JSON.parse(JSON.stringify(projectTemplates[action.payload]));
                }
            }
            return newState;
        case 'IMPORT_STATE':
            return { ...action.payload.state, isDirty: false, lastFileName: action.payload.fileName };
        case 'IMPORT_PROJECT':
            newState.projects.push(action.payload);
            newState.activeProjectIndex = newState.projects.length - 1;
            return newState;
        case 'SET_PROJECT_SEARCH':
            return { ...newState, projectListState: { ...newState.projectListState, searchTerm: action.payload } };
        case 'SET_PROJECT_SORT': {
            const { sortBy, sortOrder } = newState.projectListState;
            const newSortBy = action.payload;
            const newSortOrder = sortBy === newSortBy ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc';
            return { ...newState, projectListState: { ...newState.projectListState, sortBy: newSortBy, sortOrder: newSortOrder } };
        }
        case 'SET_PROJECT_SHOW_ARCHIVED':
            return { ...newState, projectListState: { ...newState.projectListState, showArchived: action.payload } };
        case 'SAVE_TO_FILE':
            return { ...newState, isDirty: false };
        default:
            return state;
    }
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, createNewWorkspace());

    useEffect(() => {
        try {
            const savedStateJSON = localStorage.getItem('calculatorWorkspace');
            if (savedStateJSON) {
                const loadedState = JSON.parse(savedStateJSON);
                dispatch({ type: 'INITIALIZE_STATE', payload: loadedState });
            }
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('calculatorWorkspace', JSON.stringify(state));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [state]);

    // FIX: Replaced JSX with React.createElement because this is a .ts file, not a .tsx file.
    // The TypeScript parser was trying to interpret the JSX as operators, causing syntax errors.
    return React.createElement(AppStateContext.Provider, { value: { state, dispatch } }, children);
};

export const useAppState = () => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppStateProvider');
    }
    return context;
};
