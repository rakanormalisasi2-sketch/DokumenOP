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

                    const d90 = addDays(d, 90);
                    enrichedData[`${f.name}_plus_90_standar`] = format(d90, 'd MMMM yyyy', { locale: id });
                    enrichedData[`${f.name}_plus_90_lengkap`] = format(d90, 'EEEE, d MMMM yyyy', { locale: id });
                }
            } catch (e) {
                console.error('Date parse error', e);
            }
        }
    });

    return enrichedData;
}
