import { format, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatTerbilang } from './terbilang';
import { FormField } from '@/types';

export function enrichSubmissionData(data: Record<string, any>, fields: FormField[]): Record<string, any> {
    const enrichedData = { ...data };

    fields.forEach(f => {
        // Terbilang enrichment
        if (f.type === 'terbilang' && f.linkedFieldId) {
            enrichedData[f.name] = formatTerbilang(enrichedData[f.linkedFieldId] || '', f.terbilangFormat);
        }

        // Date enrichment
        if (f.type === 'date' && enrichedData[f.name]) {
            try {
                const d = new Date(enrichedData[f.name]);
                if (!isNaN(d.getTime())) {
                    enrichedData[`${f.name}_standar`] = format(d, 'd MMMM yyyy', { locale: id });
                    enrichedData[`${f.name}_lengkap`] = format(d, 'EEEE, d MMMM yyyy', { locale: id });
                    enrichedData[`${f.name}_hari`] = format(d, 'EEEE', { locale: id });
                }
            } catch (e) {
                console.error('Date parse error', e);
            }
        }

        // Date Addition enrichment
        if (f.type === 'date_addition' && f.linkedFieldId && enrichedData[f.linkedFieldId]) {
            try {
                const baseDate = new Date(enrichedData[f.linkedFieldId]);
                if (!isNaN(baseDate.getTime())) {
                    const additionDays = f.dateAdditionDays || 0;
                    const calculatedDate = addDays(baseDate, additionDays);
                    
                    // We store the RAW date in case it's used elsewhere
                    enrichedData[f.name] = format(calculatedDate, 'yyyy-MM-dd');
                    
                    // And the formatted ones
                    enrichedData[`${f.name}_standar`] = format(calculatedDate, 'd MMMM yyyy', { locale: id });
                    enrichedData[`${f.name}_lengkap`] = format(calculatedDate, 'EEEE, d MMMM yyyy', { locale: id });
                    enrichedData[`${f.name}_hari`] = format(calculatedDate, 'EEEE', { locale: id });
                }
            } catch (e) {
                console.error('Date addition parse error', e);
            }
        }
    });

    return enrichedData;
}
