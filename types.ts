
export interface Payment {
    label: string;
    amount: number;
    date: string;
    note: string;
}

export interface Note {
    text: string;
    completed: boolean;
}

export interface Specialty {
    name: string;
    type: 'sqm' | 'fixed';
    value: number;
    isPaid: boolean;
    notes: Note[];
    contractorName: string;
    payments: Payment[];
}

export interface ContractorDetails {
    email: string;
    phone: string;
}

export interface MiniCalcState {
    projectType: string;
    area: string;
    wallSections: number;
    additionalLength: number;
    hasCrane: boolean;
    hasComplexity: boolean;
    complexityPercentage: string;
    includeSupervision: boolean;
}

export interface Project {
    projectName: string;
    vazlozhitel: string;
    izpalnitel: string;
    area: number;
    currencyMode: 'bgn_eur' | 'eur' | 'bgn';
    projectPhase: string;
    showAdvanceCheck: boolean;
    bonusCheck: boolean;
    bonusType: 'percent' | 'fixed';
    bonusPercent: number;
    bonusAmount: number;
    bonusAdvance: number;
    bonusIsPaidCheck: boolean;
    logoSrc: string;
    specialties: Specialty[];
    contractors: { [key: string]: ContractorDetails };
    projectNotes: Note[];
    filters: {
        activeOnly: boolean;
    };
    miniCalcState: Partial<MiniCalcState>;
    creationDate: string;
    isArchived: boolean;
}

export interface ProjectListState {
    searchTerm: string;
    sortBy: 'creationDate' | 'projectName';
    sortOrder: 'asc' | 'desc';
    showArchived: boolean;
}

export interface AppState {
    workspaceName: string;
    projects: Project[];
    activeProjectIndex: number;
    theme: string;
    sidebarState: { [key: string]: boolean };
    projectListState: ProjectListState;
    isDirty: boolean;
    lastModified: string;
    lastFileName: string;
}
