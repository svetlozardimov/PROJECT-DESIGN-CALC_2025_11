
import React, { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../hooks/useAppState';
import { formatCurrencyForTotals, calculateRowData } from '../utils/calculations';
import type { Note, Payment, MiniCalcState } from '../types';
import { XMarkIcon, PhoneIcon, EmailIcon, DragHandleIcon } from './Icons';
import { BGN_TO_EUR, manualHTML, constructionTypes, categoryNames, projectTemplates } from '../constants';

// Generic Modal Wrapper
const Modal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}> = ({ isOpen, onClose, children, title, size = '2xl' }) => {
    if (!isOpen) return null;
    
    const sizeClasses = {
        sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl'
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className={`bg-card-bg text-text-color rounded-lg shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-border-color flex-shrink-0">
                    {title && <h3 className="text-xl font-semibold text-primary">{title}</h3>}
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <XMarkIcon className="w-6 h-6 text-text-color/70" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

// --- Specific Modals ---

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Помощ / Упътване" size="3xl">
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: manualHTML }} />
    </Modal>
);

export const AuthorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    // Contact form logic can be added here
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="За автора" size="md">
            <div className="flex flex-col gap-5 text-center">
                 <div className="pb-4 border-b border-border-color">
                    <span className="text-2xl font-semibold text-primary block">инж. Светлозар Димов</span>
                    <span className="text-secondary">Проектант - Строителни конструкции</span>
                </div>
                <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3"><PhoneIcon className="w-5 h-5 text-secondary"/> <span>0883386 003</span></div>
                    <div className="flex items-center gap-3"><EmailIcon className="w-5 h-5 text-secondary"/> <span>svetlozar.dimov@gmail.com</span></div>
                </div>
                <a href="https://www.facebook.com/DimovConstructionOOD" target="_blank" rel="noopener noreferrer" className="block w-full p-3 text-center font-semibold bg-light-gray rounded-lg text-secondary hover:bg-row-alt">
                    Facebook страница на Dimov Construction
                </a>
            </div>
        </Modal>
    );
};


export const BreakdownModal: React.FC<{ isOpen: boolean; onClose: () => void; specialtyIndex: number }> = ({ isOpen, onClose, specialtyIndex }) => {
    const { state } = useAppState();
    const activeProject = state.projects[state.activeProjectIndex];
    if(!activeProject) return null;
    const specialty = activeProject.specialties[specialtyIndex];
    const data = calculateRowData(specialty, activeProject);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Справка за: ${specialty.name}`} size="lg">
            <p className="text-sm text-text-color/70 mb-4">Изпълнител: {specialty.contractorName || 'Невъведен'}</p>
            <table className="w-full text-left">
                <tbody>
                    <tr className="border-b border-border-color"><td className="py-2 pr-4 font-medium">Изчисление:</td><td className="py-2">{specialty.type === 'sqm' ? `${activeProject.area.toFixed(2)} м² x ${specialty.value.toFixed(2)} лв/м²` : "Твърда сума"}</td></tr>
                    <tr className="border-b border-border-color"><td className="py-2 pr-4 font-medium">Дължимо:</td><td className="py-2" dangerouslySetInnerHTML={{__html: formatCurrencyForTotals(data.calc_sum_bgn, activeProject)}}/></tr>
                    <tr className="border-b border-border-color"><td className="py-2 pr-4 font-medium">Платено:</td><td className="py-2" dangerouslySetInnerHTML={{__html: formatCurrencyForTotals(data.totalPaidBGN, activeProject)}}/></tr>
                    <tr className="border-b border-border-color"><td className="py-2 pr-4 font-bold">Остатък:</td><td className="py-2 font-bold" dangerouslySetInnerHTML={{__html: formatCurrencyForTotals(data.remaining_bgn, activeProject)}}/></tr>
                    <tr><td colSpan={2} className="pt-4 pb-2 text-center font-semibold text-primary bg-light-gray">Плащания</td></tr>
                    {specialty.payments.map((p, i) => (
                        <tr key={i} className="border-b border-border-color"><td className="py-2 pr-4">{p.label} ({p.date || 'няма дата'}):</td><td className="py-2">{formatCurrencyForTotals(p.amount, activeProject)} {p.note && `(${p.note})`}</td></tr>
                    ))}
                </tbody>
            </table>
        </Modal>
    );
};

const NoteItem: React.FC<{note: Note, index: number, onUpdate: (index: number, newNote: Note) => void, onDelete: (index: number) => void}> = ({ note, index, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(note.text);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleSave = () => {
        if (text.trim()) {
            onUpdate(index, { ...note, text: text.trim() });
        }
        setIsEditing(false);
    };

    useEffect(() => {
        if(isEditing) inputRef.current?.focus();
    }, [isEditing]);
    
    return (
         <li className={`flex items-center gap-2 py-2 border-b border-border-color ${note.completed ? 'opacity-50' : ''}`}>
            <DragHandleIcon className="w-5 h-5 text-text-color/50 cursor-grab"/>
            <input type="checkbox" checked={note.completed} onChange={(e) => onUpdate(index, {...note, completed: e.target.checked})} className="w-5 h-5"/>
            {isEditing ? (
                <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)} onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} className="flex-grow p-1 bg-card-bg border border-secondary rounded"/>
            ) : (
                <span onClick={() => setIsEditing(true)} className={`flex-grow cursor-pointer ${note.completed ? 'line-through' : ''}`}>{note.text}</span>
            )}
            <button onClick={() => onDelete(index)} className="p-1 rounded-full text-accent hover:bg-accent/20"><XMarkIcon className="w-5 h-5"/></button>
        </li>
    );
};

export const NoteModal: React.FC<{ isOpen: boolean; onClose: () => void; specialtyIndex: number }> = ({ isOpen, onClose, specialtyIndex }) => {
    const { state, dispatch } = useAppState();
    const activeProject = state.projects[state.activeProjectIndex];
    if (!activeProject) return null;
    const specialty = activeProject.specialties[specialtyIndex];
    const [newNote, setNewNote] = useState('');

    const handleUpdate = (noteIndex: number, updatedNote: Note) => {
        const newNotes = [...specialty.notes];
        newNotes[noteIndex] = updatedNote;
        dispatch({ type: 'UPDATE_SPECIALTY', payload: { index: specialtyIndex, field: 'notes', value: newNotes } });
    };

    const handleDelete = (noteIndex: number) => {
        const newNotes = specialty.notes.filter((_, i) => i !== noteIndex);
        dispatch({ type: 'UPDATE_SPECIALTY', payload: { index: specialtyIndex, field: 'notes', value: newNotes } });
    };

    const handleAdd = () => {
        if(newNote.trim()) {
            const newNotes = [...specialty.notes, {text: newNote.trim(), completed: false}];
            dispatch({ type: 'UPDATE_SPECIALTY', payload: { index: specialtyIndex, field: 'notes', value: newNotes } });
            setNewNote('');
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Бележки за: ${specialty.name}`} size="lg">
            <ul>{specialty.notes.map((note, i) => <NoteItem key={i} note={note} index={i} onUpdate={handleUpdate} onDelete={handleDelete} />)}</ul>
            <div className="flex gap-2 mt-4">
                <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Добави нова бележка..." className="flex-grow p-2 border border-border-color rounded bg-card-bg"/>
                <button onClick={handleAdd} className="px-4 py-2 bg-success text-white rounded">Добави</button>
            </div>
        </Modal>
    );
};

export const ProjectNoteModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppState();
    const activeProject = state.projects[state.activeProjectIndex];
    if (!activeProject) return null;
    const [newNote, setNewNote] = useState('');

     const handleUpdate = (noteIndex: number, updatedNote: Note) => {
        const newNotes = [...activeProject.projectNotes];
        newNotes[noteIndex] = updatedNote;
        dispatch({ type: 'UPDATE_PROJECT', payload: { field: 'projectNotes', value: newNotes } });
    };

    const handleDelete = (noteIndex: number) => {
        const newNotes = activeProject.projectNotes.filter((_, i) => i !== noteIndex);
        dispatch({ type: 'UPDATE_PROJECT', payload: { field: 'projectNotes', value: newNotes } });
    };

    const handleAdd = () => {
        if(newNote.trim()) {
            const newNotes = [...activeProject.projectNotes, {text: newNote.trim(), completed: false}];
            dispatch({ type: 'UPDATE_PROJECT', payload: { field: 'projectNotes', value: newNotes } });
            setNewNote('');
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Общи бележки по проекта" size="lg">
            <ul>{activeProject.projectNotes.map((note, i) => <NoteItem key={i} note={note} index={i} onUpdate={handleUpdate} onDelete={handleDelete} />)}</ul>
            <div className="flex gap-2 mt-4">
                <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Добави нова обща бележка..." className="flex-grow p-2 border border-border-color rounded bg-card-bg"/>
                <button onClick={handleAdd} className="px-4 py-2 bg-success text-white rounded">Добави</button>
            </div>
        </Modal>
    );
};

export const PaymentModal: React.FC<{ isOpen: boolean; onClose: () => void; specialtyIndex: number }> = ({ isOpen, onClose, specialtyIndex }) => {
    const { state, dispatch } = useAppState();
    const activeProject = state.projects[state.activeProjectIndex];
    if (!activeProject) return null;
    const specialty = activeProject.specialties[specialtyIndex];
    const data = calculateRowData(specialty, activeProject);
    const [payments, setPayments] = useState<Payment[]>(JSON.parse(JSON.stringify(specialty.payments)));

    const handleSave = () => {
        dispatch({ type: 'UPDATE_SPECIALTY', payload: { index: specialtyIndex, field: 'payments', value: payments } });
        onClose();
    };

    const handlePaymentChange = (pIndex: number, field: keyof Payment, value: any) => {
        const newPayments = [...payments];
        if (field === 'amount' && activeProject.currencyMode === 'eur') {
            value = parseFloat(value) * BGN_TO_EUR;
        }
        (newPayments[pIndex][field] as any) = value;
        setPayments(newPayments);
    };

    const addIntermediate = () => {
        const intermediateCount = payments.filter(p => p.label.startsWith('Междинно')).length;
        if(intermediateCount >= 5) return;
        const finalPaymentIndex = payments.findIndex(p => p.label === 'Окончателно');
        const newPayments = [...payments];
        newPayments.splice(finalPaymentIndex, 0, {label: `Междинно ${intermediateCount + 1}`, amount: 0, date: "", note: ""});
        setPayments(newPayments);
    }

    const removeIntermediate = (pIndex: number) => {
        let newPayments = payments.filter((_, i) => i !== pIndex);
        let counter = 1;
        newPayments = newPayments.map(p => p.label.startsWith('Междинно') ? {...p, label: `Междинно ${counter++}`} : p);
        setPayments(newPayments);
    }
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Плащания за: ${specialty.name}`} size="3xl">
            <div className="grid grid-cols-3 gap-4 text-center p-4 bg-light-gray rounded-md mb-6">
                <div><span className="block text-sm">Общо дължимо</span><strong className="text-lg" dangerouslySetInnerHTML={{__html: formatCurrencyForTotals(data.calc_sum_bgn, activeProject)}}/></div>
                <div><span className="block text-sm">Платено</span><strong className="text-lg" dangerouslySetInnerHTML={{__html: formatCurrencyForTotals(data.totalPaidBGN, activeProject)}}/></div>
                <div><span className="block text-sm">Остатък</span><strong className="text-lg" dangerouslySetInnerHTML={{__html: formatCurrencyForTotals(data.remaining_bgn, activeProject)}}/></div>
            </div>
            <div className="space-y-3">
                {payments.map((p, pIndex) => {
                    const amountForInput = activeProject.currencyMode === 'eur' ? p.amount / BGN_TO_EUR : p.amount;
                    return (
                        <div key={pIndex} className="grid grid-cols-[100px_1fr_1fr_2fr_40px] gap-2 items-center">
                            <label className="text-sm font-medium text-right">{p.label}</label>
                            <input type="number" step="0.01" value={amountForInput.toFixed(2)} onChange={e => handlePaymentChange(pIndex, 'amount', e.target.value)} className="p-2 border border-border-color rounded bg-card-bg"/>
                            <input type="date" value={p.date} onChange={e => handlePaymentChange(pIndex, 'date', e.target.value)} className="p-2 border border-border-color rounded bg-card-bg"/>
                            <input type="text" placeholder="Бележка..." value={p.note} onChange={e => handlePaymentChange(pIndex, 'note', e.target.value)} className="p-2 border border-border-color rounded bg-card-bg"/>
                            {p.label.startsWith('Междинно') && <button onClick={() => removeIntermediate(pIndex)} className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-lg">&times;</button>}
                        </div>
                    );
                })}
            </div>
            <div className="text-center mt-4"><button onClick={addIntermediate} className="px-4 py-2 bg-success text-white rounded">+ Добави междинно плащане</button></div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border-color">
                <button onClick={onClose} className="px-4 py-2 bg-info text-white rounded">Отказ</button>
                <button onClick={handleSave} className="px-4 py-2 bg-success text-white rounded">Запази</button>
            </div>
        </Modal>
    );
};

export const ContractorModal: React.FC<{ isOpen: boolean; onClose: () => void; specialtyIndex: number }> = ({ isOpen, onClose, specialtyIndex }) => {
    const { state, dispatch } = useAppState();
    const activeProject = state.projects[state.activeProjectIndex];
    if (!activeProject) return null;
    const specialty = activeProject.specialties[specialtyIndex];

    const [name, setName] = useState(specialty.contractorName || '');
    const [email, setEmail] = useState(activeProject.contractors[specialty.contractorName]?.email || '');
    const [phone, setPhone] = useState(activeProject.contractors[specialty.contractorName]?.phone || '');
    
    const handleSave = () => {
        dispatch({ type: 'UPDATE_SPECIALTY', payload: { index: specialtyIndex, field: 'contractorName', value: name } });
        if(name.trim()){
            dispatch({ type: 'UPDATE_PROJECT', payload: { field: 'contractors', value: {...activeProject.contractors, [name.trim()]: {email, phone}} } });
        }
        onClose();
    };

    const handleRemove = () => {
         dispatch({ type: 'UPDATE_SPECIALTY', payload: { index: specialtyIndex, field: 'contractorName', value: '' } });
         onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Изпълнител за: ${specialty.name}`} size="lg">
            <div className="space-y-4">
                <div><label className="font-medium">Име</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full p-2 border border-border-color rounded bg-card-bg"/></div>
                <div><label className="font-medium">Имейл</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-2 border border-border-color rounded bg-card-bg"/></div>
                <div><label className="font-medium">Телефон</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 w-full p-2 border border-border-color rounded bg-card-bg"/></div>
            </div>
            <div className="flex justify-between mt-6 pt-4 border-t border-border-color">
                 <button onClick={handleRemove} className="px-4 py-2 bg-accent text-white rounded">Премахни</button>
                 <div className="flex gap-3">
                     <button onClick={onClose} className="px-4 py-2 bg-info text-white rounded">Отказ</button>
                     <button onClick={handleSave} className="px-4 py-2 bg-success text-white rounded">Запази</button>
                 </div>
            </div>
        </Modal>
    );
};

export const ReportModal: React.FC<{ isOpen: boolean; onClose: () => void; reportType: 'summary' | 'contacts' | 'notes' }> = ({ isOpen, onClose, reportType }) => {
    // Report content generation logic would go here
    const content = `Report content for ${reportType}`;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Справка: ${reportType}`} size="4xl">
            <div>{content}</div>
             <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border-color">
                <button className="px-4 py-2 bg-info text-white rounded">Експорт (.txt)</button>
                <button className="px-4 py-2 bg-info text-white rounded">Принтирай</button>
            </div>
        </Modal>
    );
};

export const ProjectManagementModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    // Logic for selecting projects and exporting
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Център за управление на проекти" size="2xl">
            Project management content goes here.
        </Modal>
    );
};

export const MiniCalculatorModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useAppState();
    const activeProject = state.projects[state.activeProjectIndex];
    
    // FIX: Initialize with a complete MiniCalcState object by merging the partial state from the project with default values to satisfy the MiniCalcState type.
    const [calcState, setCalcState] = useState<MiniCalcState>(() => {
        const defaultState: MiniCalcState = {
            projectType: '', area: '', wallSections: 1, additionalLength: 0, hasCrane: false,
            hasComplexity: false, complexityPercentage: '', includeSupervision: false
        };
        return {
            ...defaultState,
            ...(activeProject?.miniCalcState || {})
        };
    });

    useEffect(() => {
        if (activeProject) {
            dispatch({ type: 'UPDATE_PROJECT', payload: { field: 'miniCalcState', value: calcState } });
        }
    }, [calcState, activeProject, dispatch]);

    const handleStateChange = (field: keyof MiniCalcState, value: any) => {
        setCalcState(prevState => ({ ...prevState, [field]: value }));
    };

    const priceDetails = useMemo(() => {
        const details = { baseCalc: 0, craneAddition: 0, complexityAddition: 0, subTotal: 0, supervision: 0, total: 0, error: false };
        const typeData = constructionTypes[calcState.projectType];
        if (!typeData) return details;

        let area = parseFloat(calcState.area) || 0;

        if (typeData.type === 'per_m2' && ((typeData.minArea && area < typeData.minArea) || (typeData.maxArea && area > typeData.maxArea))) {
            details.error = true;
        }

        details.baseCalc = typeData.basePrice;
        if (typeData.type === 'per_m2') { details.baseCalc *= area; } 
        else if (typeData.type === 'retaining_wall') {
            const wallSections = calcState.wallSections || 1;
            const additionalLength = calcState.additionalLength || 0;
            details.baseCalc *= wallSections;
            details.baseCalc += details.baseCalc * 0.2 * Math.ceil(additionalLength / 10);
        }
        
        details.subTotal = details.baseCalc;

        if (calcState.hasCrane && (calcState.projectType.startsWith('V') || calcState.projectType.startsWith('VI'))) {
            details.craneAddition = area * 1.5;
            details.subTotal += details.craneAddition;
        }
        
        if (calcState.hasComplexity) {
            const complexityPercentage = parseFloat(calcState.complexityPercentage) || 0;
            details.complexityAddition = details.subTotal * (complexityPercentage / 100);
            details.subTotal += details.complexityAddition;
        }

        if (calcState.includeSupervision) {
            details.supervision = details.subTotal * 0.15;
        }
        
        details.total = details.subTotal + details.supervision;
        return details;
    }, [calcState]);

    const handleAddToProject = () => {
        if (priceDetails.total <= 0) {
            alert("Моля, изчислете валидна цена преди да я добавите.");
            return;
        }
        if (!activeProject) return;

        const areaFromCalc = parseFloat(calcState.area);
        if(areaFromCalc > 0) {
            dispatch({ type: 'UPDATE_PROJECT', payload: { field: 'area', value: areaFromCalc } });
        }

        const skIndex = activeProject.specialties.findIndex(s => s.name === "Строителни конструкции" || s.name === "СК");

        if(skIndex !== -1) {
            dispatch({ type: 'UPDATE_SPECIALTY', payload: { index: skIndex, field: 'type', value: 'fixed' } });
            dispatch({ type: 'UPDATE_SPECIALTY', payload: { index: skIndex, field: 'value', value: priceDetails.total } });
        } else {
            const skTemplate = projectTemplates.max.find(s => s.name === "Строителни конструкции");
            if(skTemplate) {
                 const newSk = {...skTemplate, type: 'fixed', value: priceDetails.total};
                 // This needs a new action type or complex payload for inserting at specific index
                 alert("Добавянето на нова специалност не е имплементирано. Моля, добавете ръчно.");
            }
        }
        onClose();
    };

    const groupedTypes = useMemo(() => {
        const groups: { [key: string]: { key: string; name: string }[] } = {};
        Object.entries(constructionTypes).forEach(([key, value]) => {
            const category = key.split('.')[0];
            if (!groups[category]) groups[category] = [];
            groups[category].push({ key, name: value.name });
        });
        return groups;
    }, []);

    const selectedTypeData = constructionTypes[calcState.projectType];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Калкулатор себестойност част СК" size="lg">
            <div className="space-y-4">
                <div className="space-y-1">
                    <label className="font-medium">Вид строителен проект</label>
                    <select value={calcState.projectType} onChange={e => handleStateChange('projectType', e.target.value)} className="w-full p-2 border border-border-color rounded bg-card-bg">
                        <option value="">Изберете вид проект</option>
                        {Object.entries(groupedTypes).map(([category, types]) => (
                            <optgroup key={category} label={categoryNames[category] || category}>
                                {types.map(type => <option key={type.key} value={type.key}>{type.name}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>
                
                {selectedTypeData && (selectedTypeData.type === 'per_m2' || calcState.projectType.startsWith('V') || calcState.projectType.startsWith('VI')) && (
                     <div className="space-y-1"><label className="font-medium">Площ (м²)</label><input type="number" value={calcState.area} onChange={e => handleStateChange('area', e.target.value)} className="w-full p-2 border border-border-color rounded bg-card-bg" /></div>
                )}
                {selectedTypeData?.type === 'retaining_wall' && (
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1"><label className="font-medium">Брой сечения</label><input type="number" value={calcState.wallSections} onChange={e => handleStateChange('wallSections', parseInt(e.target.value))} className="w-full p-2 border border-border-color rounded bg-card-bg" /></div>
                         <div className="space-y-1"><label className="font-medium">Доп. дължина (м)</label><input type="number" value={calcState.additionalLength} onChange={e => handleStateChange('additionalLength', parseInt(e.target.value))} className="w-full p-2 border border-border-color rounded bg-card-bg" /></div>
                    </div>
                )}
                 {(calcState.projectType.startsWith('V') || calcState.projectType.startsWith('VI')) && (
                    <label className="flex items-center gap-2"><input type="checkbox" checked={calcState.hasCrane} onChange={e => handleStateChange('hasCrane', e.target.checked)}/>Добави 1,5 лв/м² за хале с кран</label>
                 )}
                 {selectedTypeData && (
                    <>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={calcState.hasComplexity} onChange={e => handleStateChange('hasComplexity', e.target.checked)}/>Добавка при сложна геометрия или терен</label>
                        {calcState.hasComplexity && (
                            <div className="space-y-1 pl-6"><label className="font-medium">Процент добавка</label><input type="number" placeholder="%" value={calcState.complexityPercentage} onChange={e => handleStateChange('complexityPercentage', e.target.value)} className="w-full p-2 border border-border-color rounded bg-card-bg" /></div>
                        )}
                    </>
                 )}
                <label className="flex items-center gap-2"><input type="checkbox" checked={calcState.includeSupervision} onChange={e => handleStateChange('includeSupervision', e.target.checked)}/>Включи авторски надзор (15%)</label>

                {priceDetails.error && <div className="p-2 text-center text-red-700 bg-red-100 rounded">ВЪВЕДИ СЪОТВЕТСТВАЩА НА КАТЕГОРИЯТА КВАДРАТУРА</div>}

                <div className="p-4 bg-light-gray rounded-md space-y-2">
                    <div className="flex justify-between"><span>Базова цена:</span><span className="font-medium">{priceDetails.subTotal.toFixed(2)} лв.</span></div>
                    {calcState.includeSupervision && <div className="flex justify-between"><span>Авторски надзор:</span><span className="font-medium">{priceDetails.supervision.toFixed(2)} лв.</span></div>}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border-color"><span>Крайна цена:</span><span>{priceDetails.total.toFixed(2)} лв.</span></div>
                    <div className="text-xs text-text-color/60 text-center pt-2">*Всички цени са без включен ДДС</div>
                </div>

            </div>
             <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border-color">
                <button className="px-4 py-2 bg-info text-white rounded">Експорт (.txt)</button>
                <button className="px-4 py-2 bg-info text-white rounded">Принтирай</button>
                <button onClick={handleAddToProject} className="px-4 py-2 bg-success text-white rounded">Добави към проекта</button>
            </div>
        </Modal>
    );
};
