
import type { Specialty, Project } from '../types';
import { BGN_TO_EUR } from '../constants';

export const calculateRowData = (specialty: Specialty, project: Project) => {
    const valueInBGN = parseFloat(String(specialty.value)) || 0;
    const area = parseFloat(String(project.area)) || 0;
    
    // In the state, `specialty.value` is always in BGN.
    const calculatedSumBGN = (specialty.type === "sqm") ? valueInBGN * area : valueInBGN;
    
    const totalPaidBGN = Array.isArray(specialty.payments)
        ? specialty.payments.reduce((acc, p) => acc + (parseFloat(String(p.amount)) || 0), 0)
        : 0;

    const remainingBGN = calculatedSumBGN - totalPaidBGN;
    const progress = calculatedSumBGN > 0 ? (totalPaidBGN / calculatedSumBGN) * 100 : (totalPaidBGN > 0 ? 100 : 0);
    
    return {
        calc_sum_bgn: calculatedSumBGN,
        totalPaidBGN: totalPaidBGN,
        remaining_bgn: remainingBGN,
        progress: progress
    };
};


export const formatCurrency = (amount: number, project: Project): string => {
    const bgn = amount || 0;
    const eur = bgn / BGN_TO_EUR;
    switch (project.currencyMode) {
        case 'bgn_eur': return `${bgn.toFixed(2)} лв<br><span class="text-xs text-gray-500">(${eur.toFixed(2)} €)</span>`;
        case 'eur': return `${eur.toFixed(2)} €`;
        default: return `${bgn.toFixed(2)} лв`;
    }
};

export const formatCurrencyForTotals = (amount: number, project: Project): string => {
    const bgn = amount || 0;
    const eur = bgn / BGN_TO_EUR;
    switch (project.currencyMode) {
        case 'bgn_eur': return `${bgn.toFixed(2)} лв (${eur.toFixed(2)} €)`;
        case 'eur': return `${eur.toFixed(2)} €`;
        default: return `${bgn.toFixed(2)} лв`;
    }
};
