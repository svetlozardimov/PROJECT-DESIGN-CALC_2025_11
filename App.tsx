
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppState, AppStateProvider } from './hooks/useAppState';
import type { Project, Specialty } from './types';
import { calculateRowData, formatCurrency, formatCurrencyForTotals } from './utils/calculations';
import { handleFileExport, handleFileImport, handleProjectImport } from './utils/fileHandlers';
import { PHASES } from './constants';
import { AuthorIcon, ArchiveIcon, UnarchiveIcon, DeleteIcon, DuplicateIcon, RenameIcon, NoteIcon, BreakdownIcon, ContractorIcon, MenuIcon, DragHandleIcon, DuplicateRowIcon, DeleteRowIcon, CheckmarkIcon, XMarkIcon, ChevronDownIcon, EditIcon } from './components/Icons';
import { AuthorModal, BreakdownModal, ContractorModal, HelpModal, MiniCalculatorModal, NoteModal, PaymentModal, ProjectManagementModal, ProjectNoteModal, ReportModal } from './components/Modals';

// Utility Button Component
const ActionButton: React.FC<{
    onClick?: () => void;
    children: React.ReactNode;
    className?: string;
    title?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}> = ({ onClick, children, className = '', title = '', type = 'button', disabled = false }) => (
    <button
        type={type}
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`w-full px-4 py-2 text-sm font-semibold text-white rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {children}
    </button>
);

// Collapsible Section Component
const SidebarSection: React.FC<{ title: string; sectionId: string; children: React.ReactNode }> = ({ title, sectionId, children }) => {
    const { state, dispatch } = useAppState();
    const isCollapsed = state.sidebarState[sectionId] ?? false;

    const toggleCollapse = () => {
        dispatch({ type: 'TOGGLE_SIDEBAR_SECTION', payload: sectionId });
    };

    return (
        <div className="mb-2 border border-border-color rounded-lg overflow-hidden bg-light-gray">
            <div
                className="flex justify-between items-center p-3 cursor-pointer select-none"
                onClick={toggleCollapse}
            >
                <h2 className="m-0 p-0 text-base font-bold border-none text-secondary">{title}</h2>
                <ChevronDownIcon className={`w-5 h-5 text-text-color transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
            </div>
            <div className={`transition-all duration-400 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
                <div className="p-4 pt-0">{children}</div>
            </div>
        </div>
    );
};


// Main Application
const AppContent: React.FC = () => {
    const { state, dispatch } = useAppState();
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [modalData, setModalData] = useState<any>(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const importFileRef = useRef<HTMLInputElement>(null);
    const importProjectFileRef = useRef<HTMLInputElement>(null);
    const logoUploadRef = useRef<HTMLInputElement>(null);

    const activeProject = useMemo(() => {
        if (state.activeProjectIndex === -1 || !state.projects || state.projects.length === 0) {
            return null;
        }
        return state.projects[state.activeProjectIndex];
    }, [state.activeProjectIndex, state.projects]);

    useEffect(() => {
        document.body.className = state.theme;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (state.isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [state.theme, state.isDirty]);

    const openModal = (modal: string, data?: any) => {
        setModalData(data);
        setActiveModal(modal);
    };

    const closeModal = () => {
        setActiveModal(null);
        setModalData(null);
    };
    
    // Handlers
    const handleWorkspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        dispatch({ type: 'UPDATE_WORKSPACE_NAME', payload: e.target.value });
    };

    const handleCreateNewWorkspace = () => {
        if (confirm("Сигурни ли сте? Всички незапазени промени в текущото работно пространство ще бъдат загубени.")) {
            dispatch({ type: 'CREATE_NEW_WORKSPACE' });
        }
    };
    
    const handleAddNewProject = () => {
        dispatch({ type: 'ADD_PROJECT', payload: { name: `Нов проект ${state.projects.length + 1}` } });
    };
    
    const handleToggleTheme = () => {
        dispatch({ type: 'TOGGLE_THEME' });
    };

    const handleProjectUpdate = (field: keyof Project, value: any) => {
        dispatch({ type: 'UPDATE_PROJECT', payload: { field, value } });
    };
    
    const handleSpecialtyUpdate = (index: number, field: keyof Specialty, value: any) => {
        dispatch({ type: 'UPDATE_SPECIALTY', payload: { index, field, value } });
    };

    const StatusNotification = () => {
        const { isDirty, lastModified, lastFileName } = state;
        const dateString = new Date(lastModified).toLocaleString('bg-BG');

        if (isDirty) {
            return (
                <div className="p-2 mb-4 text-sm text-center text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-md" dangerouslySetInnerHTML={{ __html: `<strong>Внимание!</strong> Имате незапазени промени. Данните се пазят в локалната памет на браузъра (Последна промяна: ${dateString}).<br>Препоръчително е да запазите работното пространство във файл!` }} />
            );
        }
        return (
            <div className="p-2 mb-4 text-sm text-center text-green-800 bg-green-100 border border-green-200 rounded-md" dangerouslySetInnerHTML={{ __html: `<strong>Успешно!</strong> Данните са синхронизирани със файл: <strong>${lastFileName || 'ново работно пространство'}</strong><br>(Последно запазване: ${dateString})` }} />
        );
    };

    const ProjectListItem: React.FC<{ project: Project; index: number }> = ({ project, index }) => {
        const isActive = state.activeProjectIndex === index;

        const handleAction = (e: React.MouseEvent, action: string) => {
            e.stopPropagation();
            switch(action) {
                case 'rename': {
                    const newName = prompt("Въведете ново име на проекта:", project.projectName);
                    if (newName && newName.trim()) {
                        dispatch({type: 'RENAME_PROJECT', payload: {index, newName: newName.trim()}});
                    }
                    break;
                }
                case 'duplicate':
                    dispatch({type: 'DUPLICATE_PROJECT', payload: index});
                    break;
                case 'archive':
                    dispatch({type: 'TOGGLE_ARCHIVE_PROJECT', payload: index});
                    break;
                case 'delete':
                    if (confirm(`Сигурни ли сте, че искате да изтриете "${project.projectName}"? Тази операция е необратима!`)) {
                        dispatch({type: 'DELETE_PROJECT', payload: index});
                    }
                    break;
            }
        };

        return (
            <div
                onClick={() => dispatch({type: 'SET_ACTIVE_PROJECT', payload: index})}
                className={`flex items-center p-2 rounded-md cursor-pointer transition-colors duration-200 border border-border-color group ${isActive ? 'bg-secondary text-white' : 'hover:bg-row-alt'} ${project.isArchived ? 'opacity-60' : ''}`}
            >
                <DragHandleIcon className={`w-5 h-5 mr-2 opacity-50 ${isActive ? 'text-white' : 'text-text-color'}`} />
                <span className="flex-grow overflow-hidden text-ellipsis whitespace-nowrap">{project.projectName}</span>
                <div className={`ml-auto flex items-center space-x-1 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button title="Преименувай" onClick={(e) => handleAction(e, 'rename')} className="p-1 rounded-full hover:bg-black/10"><RenameIcon className="w-4 h-4" /></button>
                    <button title="Дублирай" onClick={(e) => handleAction(e, 'duplicate')} className="p-1 rounded-full hover:bg-black/10"><DuplicateIcon className="w-4 h-4" /></button>
                    <button title={project.isArchived ? 'Възстанови' : 'Архивирай'} onClick={(e) => handleAction(e, 'archive')} className="p-1 rounded-full hover:bg-black/10">{project.isArchived ? <UnarchiveIcon className="w-4 h-4" /> : <ArchiveIcon className="w-4 h-4" />}</button>
                    <button title="Изтрий" onClick={(e) => handleAction(e, 'delete')} className="p-1 rounded-full hover:bg-red-500/20 text-accent"><DeleteIcon className="w-4 h-4" /></button>
                </div>
            </div>
        );
    };

    const sortedProjects = useMemo(() => {
        const { searchTerm, sortBy, sortOrder, showArchived } = state.projectListState;
        let projects = state.projects.map((p, index) => ({...p, originalIndex: index}));
        if(!showArchived) projects = projects.filter(p => !p.isArchived);
        if(searchTerm) projects = projects.filter(p => p.projectName.toLowerCase().includes(searchTerm.toLowerCase()));

        projects.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];
            if(typeof valA === 'string') return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            return sortOrder === 'asc' ? new Date(valA).getTime() - new Date(valB).getTime() : new Date(valB).getTime() - new Date(valA).getTime();
        });
        return projects;
    }, [state.projects, state.projectListState]);


    const SpecialtyRow: React.FC<{specialty: Specialty, index: number}> = ({specialty, index}) => {
        if (!activeProject) return null;
        const rowData = calculateRowData(specialty, activeProject);
        const [isMenuOpen, setIsMenuOpen] = useState(false);
        // FIX: The ref is attached to a `<td>` element, so its type should be `HTMLTableCellElement`.
        const menuRef = useRef<HTMLTableCellElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                    setIsMenuOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const valueForInput = activeProject.currencyMode === 'eur' ? (specialty.value / 1.95583) : specialty.value;

        return (
            <tr className={`${specialty.isPaid ? 'bg-gray-200 text-gray-500 line-through' : 'even:bg-row-alt'} hover:bg-secondary/10`}>
                <td className="p-2 border border-border-color text-center no-print"><DragHandleIcon className="w-5 h-5 mx-auto text-gray-400 cursor-grab" /></td>
                <td className="p-2 border border-border-color">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-2 space-y-1">
                            <button onClick={() => dispatch({type: 'DUPLICATE_SPECIALTY', payload: index})} title="Дублирай ред" className="block p-1 rounded hover:bg-info/20"><DuplicateRowIcon className="w-4 h-4 text-info" /></button>
                            <button onClick={() => { if(confirm(`Изтриване на "${specialty.name}"?`)) dispatch({type: 'DELETE_SPECIALTY', payload: index})}} title="Изтрий ред" className="block p-1 rounded hover:bg-accent/20"><DeleteRowIcon className="w-4 h-4 text-accent" /></button>
                        </div>
                        <div>
                             <input type="text" value={specialty.name} onChange={e => handleSpecialtyUpdate(index, 'name', e.target.value)} className="w-full bg-transparent font-semibold focus:outline-none focus:bg-secondary/10 p-1 rounded-sm"/>
                            <button onClick={() => openModal('contractor', {index})} className="flex items-center text-xs text-secondary italic mt-1 hover:underline">
                                <ContractorIcon className="w-3 h-3 mr-1" />
                                {specialty.contractorName || 'Добави изпълнител'}
                            </button>
                        </div>
                    </div>
                </td>
                <td className="p-2 border border-border-color text-center">
                    <button 
                        onClick={() => handleSpecialtyUpdate(index, 'type', specialty.type === 'sqm' ? 'fixed' : 'sqm')}
                        className="px-2 py-1 text-xs font-semibold text-white rounded bg-info hover:bg-info/80"
                    >
                        {specialty.type === 'sqm' ? 'на м²' : 'твърда'}
                    </button>
                </td>
                <td className="p-2 border border-border-color text-right">
                    {specialty.type === 'sqm' && (
                        <input type="number" step="0.01" value={Number(valueForInput).toFixed(2)} onChange={e => handleSpecialtyUpdate(index, 'value', activeProject.currencyMode === 'eur' ? parseFloat(e.target.value) * 1.95583 : parseFloat(e.target.value))} className="w-full text-right bg-transparent focus:outline-none focus:bg-secondary/10 p-1 rounded-sm"/>
                    )}
                </td>
                <td className="p-2 border border-border-color text-right">
                    {specialty.type === 'fixed' && (
                         <input type="number" step="0.01" value={Number(valueForInput).toFixed(2)} onChange={e => handleSpecialtyUpdate(index, 'value', activeProject.currencyMode === 'eur' ? parseFloat(e.target.value) * 1.95583 : parseFloat(e.target.value))} className="w-full text-right bg-transparent focus:outline-none focus:bg-secondary/10 p-1 rounded-sm"/>
                    )}
                </td>
                <td className="p-2 border border-border-color text-right font-semibold" dangerouslySetInnerHTML={{__html: formatCurrency(rowData.calc_sum_bgn, activeProject)}} />
                 {activeProject.showAdvanceCheck && (
                    <>
                        <td className="p-0 border border-border-color text-right relative cursor-pointer" onClick={() => openModal('payment', {index})}>
                            <div className="absolute top-0 left-0 h-full bg-info/20" style={{width: `${Math.min(rowData.progress, 100)}%`}}></div>
                            <div className="relative p-2 flex justify-between items-center" dangerouslySetInnerHTML={{__html: `${formatCurrency(rowData.totalPaidBGN, activeProject)} <span class="no-print"><EditIcon class="w-3 h-3 text-gray-500"/></span>`}}/>
                        </td>
                        <td className="p-2 border border-border-color text-right" dangerouslySetInnerHTML={{__html: formatCurrency(rowData.remaining_bgn, activeProject)}}/>
                    </>
                 )}
                 <td className="p-2 border border-border-color text-center"><input type="checkbox" checked={specialty.isPaid} onChange={e => handleSpecialtyUpdate(index, 'isPaid', e.target.checked)} className="w-5 h-5"/></td>
                 <td className="p-2 border border-border-color text-center no-print relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-gray-200"><MenuIcon className="w-5 h-5 text-gray-600"/></button>
                    {isMenuOpen && (
                        <div className="absolute right-4 top-10 w-40 bg-card-bg border border-border-color rounded-md shadow-lg z-10 text-left">
                            <a href="#" onClick={(e) => { e.preventDefault(); openModal('breakdown', {index}); setIsMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-text-color hover:bg-row-alt"><BreakdownIcon className="w-4 h-4"/> Справка</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); openModal('note', {index}); setIsMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2 text-sm text-text-color hover:bg-row-alt"><NoteIcon className="w-4 h-4"/> Бележки</a>
                        </div>
                    )}
                 </td>
            </tr>
        )
    };
    
    const Totals = () => {
        if (!activeProject) return null;
        const { baseTotal, paidTotal, finalRemaining, pricePerSqmBase, pricePerSqmBonus, totalWithBonus, bonusAmount } = useMemo(() => {
            let baseTotal = 0, paidTotal = 0, baseRemaining = 0;
            activeProject.specialties.forEach(s => {
                const data = calculateRowData(s, activeProject);
                baseTotal += data.calc_sum_bgn;
                if (s.isPaid) paidTotal += data.calc_sum_bgn;
                else {
                    paidTotal += data.totalPaidBGN;
                    baseRemaining += data.remaining_bgn;
                }
            });

            const bonusAmount = activeProject.bonusCheck ? (activeProject.bonusType === 'percent' ? baseTotal * (activeProject.bonusPercent / 100) : activeProject.bonusAmount) : 0;
            const totalWithBonus = baseTotal + bonusAmount;
            const bonusAdvance = activeProject.bonusAdvance || 0;
            
            let bonusRemaining = 0;
            if (activeProject.bonusIsPaidCheck) {
                paidTotal += bonusAmount;
            } else {
                paidTotal += bonusAdvance;
                bonusRemaining = bonusAmount - bonusAdvance;
            }
            const finalRemaining = baseRemaining + bonusRemaining;
            const pricePerSqmBase = activeProject.area > 0 ? baseTotal / activeProject.area : 0;
            const pricePerSqmBonus = activeProject.area > 0 ? totalWithBonus / activeProject.area : 0;
            
            return { baseTotal, paidTotal, finalRemaining, pricePerSqmBase, pricePerSqmBonus, totalWithBonus, bonusAmount };

        }, [activeProject]);

        return (
            <div className="mt-6 p-4 bg-light-gray rounded-lg border-l-4 border-success">
                 <div className="text-lg font-bold text-primary">Цена на м²: {formatCurrencyForTotals(pricePerSqmBase, activeProject)}/м²</div>
                 <div className="text-lg font-bold text-success">Общо по проект: {formatCurrencyForTotals(baseTotal, activeProject)}</div>
                 {activeProject.bonusCheck && bonusAmount > 0 && (
                     <>
                        <div className="text-lg font-bold text-accent">Цена на м² с бонус: {formatCurrencyForTotals(pricePerSqmBonus, activeProject)}/м²</div>
                        <div className="text-lg font-bold text-accent">Общо с бонус: {formatCurrencyForTotals(totalWithBonus, activeProject)}</div>
                    </>
                 )}
                 {activeProject.showAdvanceCheck && (
                    <div className="mt-2 pt-2 border-t border-border-color">
                         <div className="text-lg font-bold text-paid-total">Общо платени суми: {formatCurrencyForTotals(paidTotal, activeProject)}</div>
                         <div className="text-lg font-bold text-warning">Общо остатък: {formatCurrencyForTotals(finalRemaining, activeProject)}</div>
                    </div>
                 )}
                 <p className="text-center text-sm italic text-dark-gray/70 mt-4">Всички цени са без ДДС.</p>
            </div>
        )
    };


    return (
        <div className="bg-bg-color text-text-color min-h-screen p-2 sm:p-4 lg:p-6 relative">
            <div className={`grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 transition-all duration-300 ${!isSidebarVisible ? 'lg:grid-cols-[0px_1fr]' : ''}`}>
                {/* SIDEBAR */}
                <aside className={`transition-all duration-300 ${!isSidebarVisible ? 'opacity-0 -ml-[420px]' : 'opacity-100 ml-0'}`}>
                    <div className="bg-card-bg p-4 rounded-lg shadow-lg space-y-2 sticky top-6">
                        <SidebarSection title="Работно пространство" sectionId="workspace-section">
                            <div className="space-y-3">
                                <input type="text" placeholder="Име на простр." value={state.workspaceName} onChange={handleWorkspaceNameChange} className="w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"/>
                                <div className="grid grid-cols-2 gap-2">
                                    <ActionButton onClick={handleCreateNewWorkspace} className="bg-secondary hover:bg-secondary/80">Ново</ActionButton>
                                    <ActionButton onClick={() => importFileRef.current?.click()} className="bg-info hover:bg-info/80">Отвори</ActionButton>
                                    <ActionButton onClick={() => handleFileExport(state)} className="bg-success hover:bg-success/80">Запази</ActionButton>
                                    <ActionButton onClick={() => openModal('projectManagement')} className="bg-warning hover:bg-warning/80">Организирай</ActionButton>
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="Проекти" sectionId="project-list-section">
                           <div className="flex gap-2 mb-2">
                                <input type="text" placeholder="Търсене..." value={state.projectListState.searchTerm} onChange={e => dispatch({type: 'SET_PROJECT_SEARCH', payload: e.target.value})} className="w-full p-2 border border-border-color rounded-md bg-card-bg text-sm focus:ring-2 focus:ring-secondary"/>
                                <button title="Сортирай по дата" onClick={() => dispatch({type: 'SET_PROJECT_SORT', payload: 'creationDate'})} className={`p-2 border rounded ${state.projectListState.sortBy === 'creationDate' ? 'bg-secondary text-white' : ''}`}>📅</button>
                                <button title="Сортирай по име" onClick={() => dispatch({type: 'SET_PROJECT_SORT', payload: 'projectName'})} className={`p-2 border rounded ${state.projectListState.sortBy === 'projectName' ? 'bg-secondary text-white' : ''}`}>🔤</button>
                           </div>
                           <label className="flex items-center gap-2 mb-2 text-sm">
                                <input type="checkbox" checked={state.projectListState.showArchived} onChange={e => dispatch({type: 'SET_PROJECT_SHOW_ARCHIVED', payload: e.target.checked})}/>
                                Покажи архивираните 📂
                           </label>
                           <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                {sortedProjects.map(p => <ProjectListItem key={p.originalIndex} project={p} index={p.originalIndex} />)}
                           </div>
                           <div className="grid grid-cols-2 gap-2 mt-4">
                               <ActionButton onClick={handleAddNewProject} className="bg-success hover:bg-success/80">Добави</ActionButton>
                               <ActionButton onClick={() => importProjectFileRef.current?.click()} className="bg-info hover:bg-info/80">Импортирай</ActionButton>
                           </div>
                        </SidebarSection>
                        
                        {activeProject && (
                            <>
                                <SidebarSection title="Настройки на проекта" sectionId="project-settings-section">
                                    <div className="space-y-4">
                                        <div><label className="text-sm font-medium">Име на обекта</label><input type="text" value={activeProject.projectName} onChange={e => handleProjectUpdate('projectName', e.target.value)} className="mt-1 w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"/></div>
                                        <div><label className="text-sm font-medium">Възложител</label><input type="text" value={activeProject.vazlozhitel} onChange={e => handleProjectUpdate('vazlozhitel', e.target.value)} className="mt-1 w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"/></div>
                                        <div><label className="text-sm font-medium">Изпълнител</label><input type="text" value={activeProject.izpalnitel} onChange={e => handleProjectUpdate('izpalnitel', e.target.value)} className="mt-1 w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"/></div>
                                        <div><label className="text-sm font-medium">Етап на проектиране</label><ActionButton onClick={() => {const currentIndex = PHASES.indexOf(activeProject.projectPhase); handleProjectUpdate('projectPhase', PHASES[(currentIndex + 1) % PHASES.length])}} className="mt-1 bg-info hover:bg-info/80">{activeProject.projectPhase}</ActionButton></div>
                                        <div>
                                            <label className="text-sm font-medium">Лого на изпълнител</label>
                                            {activeProject.logoSrc && <img src={activeProject.logoSrc} alt="Лого" className="max-h-16 my-2 mx-auto border border-border-color p-1"/>}
                                            <div className="grid grid-cols-2 gap-2">
                                                <ActionButton onClick={() => logoUploadRef.current?.click()} className="bg-info hover:bg-info/80">Качи</ActionButton>
                                                <ActionButton onClick={() => handleProjectUpdate('logoSrc', '')} className="bg-accent hover:bg-accent/80">Премахни</ActionButton>
                                            </div>
                                        </div>
                                        <div><label className="text-sm font-medium">Валута</label><select value={activeProject.currencyMode} onChange={e => handleProjectUpdate('currencyMode', e.target.value)} className="mt-1 w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"><option value="bgn_eur">Лева (с Евро)</option><option value="eur">Само Евро</option><option value="bgn">Само Лева</option></select></div>
                                        <label className="flex items-center gap-2"><input type="checkbox" checked={activeProject.showAdvanceCheck} onChange={e => handleProjectUpdate('showAdvanceCheck', e.target.checked)}/> Покажи колони за плащания</label>
                                    </div>
                                </SidebarSection>
                                <SidebarSection title="Екип-бонус" sectionId="bonus-section">
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2"><input type="checkbox" checked={activeProject.bonusCheck} onChange={e => handleProjectUpdate('bonusCheck', e.target.checked)}/> Добави екип-бонус</label>
                                        {activeProject.bonusCheck && (
                                            <div className="space-y-3 pl-2 border-l-2 border-border-color">
                                                <select value={activeProject.bonusType} onChange={e => handleProjectUpdate('bonusType', e.target.value)} className="w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"><option value="percent">Процент (%)</option><option value="fixed">Твърда сума</option></select>
                                                {activeProject.bonusType === 'percent' ? 
                                                    <div><label className="text-sm font-medium">Процент (%)</label><input type="number" step="0.01" value={activeProject.bonusPercent} onChange={e => handleProjectUpdate('bonusPercent', parseFloat(e.target.value))} className="mt-1 w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"/></div> :
                                                    <div><label className="text-sm font-medium">Сума</label><input type="number" step="0.01" value={activeProject.bonusAmount} onChange={e => handleProjectUpdate('bonusAmount', parseFloat(e.target.value))} className="mt-1 w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"/></div>
                                                }
                                                <div><label className="text-sm font-medium">Платен аванс по бонус</label><input type="number" step="0.01" value={activeProject.bonusAdvance} onChange={e => handleProjectUpdate('bonusAdvance', parseFloat(e.target.value))} className="mt-1 w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"/></div>
                                                <label className="flex items-center gap-2"><input type="checkbox" checked={activeProject.bonusIsPaidCheck} onChange={e => handleProjectUpdate('bonusIsPaidCheck', e.target.checked)}/> Бонусът е изплатен</label>
                                            </div>
                                        )}
                                    </div>
                                </SidebarSection>
                                <SidebarSection title="Шаблони, Справки и Помощ" sectionId="actions-section">
                                    <div className="space-y-4">
                                        <div><label className="text-sm font-medium">Стартов шаблон</label><select onChange={e => dispatch({type:'LOAD_TEMPLATE', payload: e.target.value})} className="mt-1 w-full p-2 border border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"><option value="" disabled selected>Смяна на шаблон...</option><option value="max">Шаблон Всички</option><option value="min">Шаблон Основни</option><option value="type1">Шаблон Тип 1</option></select></div>
                                        <div><label className="text-sm font-medium">Общи бележки</label><ActionButton onClick={() => openModal('projectNote')} className="mt-1 bg-secondary hover:bg-secondary/80">Преглед / Редакция</ActionButton></div>
                                        <div>
                                            <label className="text-sm font-medium">Справки</label>
                                            <div className="grid grid-cols-3 gap-2 mt-1">
                                                <ActionButton onClick={() => openModal('report', {type: 'summary'})} className="bg-secondary hover:bg-secondary/80">Обща</ActionButton>
                                                <ActionButton onClick={() => openModal('report', {type: 'contacts'})} className="bg-secondary hover:bg-secondary/80">Контакти</ActionButton>
                                                <ActionButton onClick={() => openModal('report', {type: 'notes'})} className="bg-secondary hover:bg-secondary/80">Бележки</button>
                                            </div>
                                        </div>
                                        <ActionButton onClick={() => openModal('help')} className="bg-info hover:bg-info/80">Помощ / Упътване</ActionButton>
                                    </div>
                                </SidebarSection>
                            </>
                        )}
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="bg-card-bg p-6 rounded-lg shadow-lg relative min-w-0">
                     <button title="Меню" onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="absolute top-6 left-6 z-20 w-10 h-10 bg-secondary text-white rounded-full shadow-md"><MenuIcon className="w-5 h-5 mx-auto"/></button>
                     <button title="Смени темата" onClick={handleToggleTheme} className="absolute top-6 right-6 z-20 w-10 h-10 bg-secondary text-white rounded-full shadow-md">🎨</button>
                     
                    {!activeProject ? (
                         <div className="text-center py-16">
                            <h2 className="text-2xl font-light uppercase tracking-widest text-primary border-none">Калкулатор за изчисляване на цена за проектиране</h2>
                            <span className="block text-xs font-mono text-gray-400 mt-2">BETA BUILD (React Version)</span>
                            <p className="mt-8 text-text-color/80">За да започнете, отворете съществуващо работно пространство или създайте ново от менюто вляво.</p>
                        </div>
                    ) : (
                        <div>
                             <StatusNotification />
                             <div className="text-center mb-4">
                                <label className="text-xl font-semibold text-primary">Квадратура (м²)</label>
                                <input type="number" step="0.01" min="0" value={activeProject.area} onChange={e => handleProjectUpdate('area', parseFloat(e.target.value))} className="block mx-auto mt-2 max-w-xs text-2xl text-center p-2 border-b-2 border-border-color rounded-md bg-card-bg focus:ring-2 focus:ring-secondary"/>
                             </div>
                             <div className="flex justify-between items-center my-4 p-3 bg-light-gray rounded-md">
                                 <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={activeProject.filters.activeOnly} onChange={e => handleProjectUpdate('filters', {...activeProject.filters, activeOnly: e.target.checked})}/>Покажи само активните</label>
                                 <ActionButton onClick={() => openModal('miniCalc')} className="bg-info hover:bg-info/80 w-auto">🧮 Калкулатор себестойност част СК</ActionButton>
                             </div>

                             <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-header-bg text-white">
                                            <th className="p-2 border border-border-color no-print w-10">№</th>
                                            <th className="p-2 border border-border-color text-left min-w-[250px]">Специалност / Изпълнител</th>
                                            <th className="p-2 border border-border-color w-28">Тип сума</th>
                                            <th className="p-2 border border-border-color w-32">Цена на м²</th>
                                            <th className="p-2 border border-border-color w-32">Твърда сума</th>
                                            <th className="p-2 border border-border-color w-36">Изчислена сума</th>
                                            {activeProject.showAdvanceCheck && (
                                                <>
                                                    <th className="p-2 border border-border-color w-36">Платено</th>
                                                    <th className="p-2 border border-border-color w-36">Остатък</th>
                                                </>
                                            )}
                                            <th className="p-2 border border-border-color w-12"><CheckmarkIcon className="w-5 h-5 mx-auto"/></th>
                                            <th className="p-2 border border-border-color w-16 no-print">...</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeProject.specialties
                                            .filter(s => !(activeProject.filters.activeOnly && s.isPaid))
                                            .map((s, idx) => <SpecialtyRow key={idx} specialty={s} index={activeProject.specialties.indexOf(s)} />)
                                        }
                                    </tbody>
                                </table>
                            </div>

                             <div className="text-right mt-4 no-print">
                                 <ActionButton onClick={() => dispatch({type: 'ADD_SPECIALTY'})} className="bg-success hover:bg-success/80 w-auto">Добави ред</ActionButton>
                             </div>

                             <Totals />
                             
                             <div className="text-center mt-6 no-print">
                                 <ActionButton onClick={() => window.print()} className="bg-secondary hover:bg-secondary/80 w-auto">Принтирай справка</ActionButton>
                             </div>
                        </div>
                    )}
                </main>
            </div>
            {/* FOOTER */}
            <footer className="fixed bottom-0 left-0 right-0 text-center p-2 bg-bg-color/80 text-xs text-text-color/60 backdrop-blur-sm flex items-center justify-center gap-4">
                <span>&copy; {new Date().getFullYear()} инж. Светлозар Димов. Всички права запазени.</span>
                 <button onClick={() => openModal('author')} title="За автора" className="p-1 rounded-full hover:bg-black/10"><AuthorIcon className="w-5 h-5 text-text-color/70"/></button>
            </footer>

            {/* MODALS */}
            {activeModal === 'miniCalc' && <MiniCalculatorModal isOpen={true} onClose={closeModal} />}
            {activeModal === 'author' && <AuthorModal isOpen={true} onClose={closeModal} />}
            {activeModal === 'help' && <HelpModal isOpen={true} onClose={closeModal} />}
            {activeModal === 'projectManagement' && <ProjectManagementModal isOpen={true} onClose={closeModal} />}
            {activeProject && activeModal === 'projectNote' && <ProjectNoteModal isOpen={true} onClose={closeModal} />}
            {activeProject && modalData?.index !== undefined && (
                <>
                    {activeModal === 'breakdown' && <BreakdownModal isOpen={true} onClose={closeModal} specialtyIndex={modalData.index} />}
                    {activeModal === 'payment' && <PaymentModal isOpen={true} onClose={closeModal} specialtyIndex={modalData.index} />}
                    {activeModal === 'contractor' && <ContractorModal isOpen={true} onClose={closeModal} specialtyIndex={modalData.index} />}
                    {activeModal === 'note' && <NoteModal isOpen={true} onClose={closeModal} specialtyIndex={modalData.index} />}
                </>
            )}
            {activeProject && activeModal === 'report' && <ReportModal isOpen={true} onClose={closeModal} reportType={modalData.type} />}


            {/* File Inputs */}
            <input type="file" ref={importFileRef} accept=".json" style={{ display: 'none' }} onChange={(e) => handleFileImport(e, dispatch)} />
            <input type="file" ref={importProjectFileRef} accept=".json" style={{ display: 'none' }} onChange={(e) => handleProjectImport(e, dispatch)} />
            {activeProject && <input type="file" ref={logoUploadRef} accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files?.[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = (re) => handleProjectUpdate('logoSrc', re.target?.result);
                    reader.readAsDataURL(file);
                }
            }} />}

             {/* Print Header */}
             {activeProject && (
                <div id="printHeader" className="hidden">
                    <div className="text-center mb-4">{activeProject.logoSrc && <img src={activeProject.logoSrc} alt="Лого" className="max-h-24 mx-auto"/>}</div>
                    <div className="text-center my-4">
                        <h2 className="text-xl font-bold">{activeProject.projectName}</h2>
                        <p>РЗП: {activeProject.area.toFixed(2)} м²</p>
                        <p className="font-semibold">Етап: {activeProject.projectPhase}</p>
                    </div>
                    <div className="flex justify-between text-sm mt-4 border-b pb-2">
                        <div><strong>Възложител:</strong> {activeProject.vazlozhitel}</div>
                        <div className="text-right"><strong>Изпълнител:</strong> {activeProject.izpalnitel}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Main App component with Provider
const App: React.FC = () => (
    <AppStateProvider>
        <AppContent />
    </AppStateProvider>
);

export default App;
