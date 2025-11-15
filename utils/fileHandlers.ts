
import type { AppState, Project } from '../types';
import { Dispatch } from 'react';

const generateFilename = (extension: string, name: string) => {
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `${date}_${safeName}.${extension}`;
};

export const handleFileExport = (state: AppState) => {
    if (!state.projects || state.projects.length === 0) {
        alert("Няма проекти за запазване.");
        return;
    }
    const fileName = generateFilename('json', state.workspaceName);
    const data = JSON.stringify({ ...state, isDirty: false, lastFileName: fileName }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.click();
    URL.revokeObjectURL(a.href);
};

export const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>, dispatch: Dispatch<any>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        try {
            const importedData = JSON.parse(event.target?.result as string);
            if (!importedData.projects || !Array.isArray(importedData.projects)) {
                throw new Error("Невалиден файл за работно пространство.");
            }
            dispatch({ type: 'IMPORT_STATE', payload: { state: importedData, fileName: file.name } });
        } catch (err: any) {
            alert("Грешка при отваряне: " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
};


export const handleProjectImport = (e: React.ChangeEvent<HTMLInputElement>, dispatch: Dispatch<any>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        try {
            const importedProject: Project = JSON.parse(event.target?.result as string);
            if (!importedProject.specialties || !Array.isArray(importedProject.specialties)) {
                throw new Error("Невалиден проектен файл.");
            }
            dispatch({ type: 'IMPORT_PROJECT', payload: importedProject });
             alert(`Проект "${importedProject.projectName || 'Неозаглавен'}" беше успешно добавен.`);
        } catch(err: any) {
            alert("Грешка при импортиране: " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}
