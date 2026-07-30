import * as XLSX from 'xlsx';

export interface RabItem {
  id: string;
  jenisPekerjaan: string;
  satuan: string;
  volume: number;
  hargaTotal: number;
  bobotPersen: number;
}

export const parseRabExcel = (file: File): Promise<RabItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays to find data
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const parsedItems: RabItem[] = [];
        let totalHarga = 0;
        
        let startParsing = false;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          if (!startParsing && row.some(cell => typeof cell === 'string' && cell.toLowerCase().includes('pekerjaan'))) {
            startParsing = true;
            continue; // Skip header row
          }
          
          if (startParsing) {
            const jenisPekerjaan = String(row[1] || '').trim();
            if (!jenisPekerjaan) continue;
            
            const satuan = String(row[2] || '').trim();
            const volume = parseFloat(String(row[3]).replace(/,/g, '')) || 0;
            const harga = parseFloat(String(row[4]).replace(/,/g, '')) || 0;
            
            if (jenisPekerjaan) {
              parsedItems.push({
                id: Math.random().toString(36).substr(2, 9),
                jenisPekerjaan,
                satuan,
                volume,
                hargaTotal: harga,
                bobotPersen: 0
              });
              totalHarga += harga;
            }
          }
        }
        
        // Kalkulasi bobot
        if (totalHarga > 0) {
          parsedItems.forEach(item => {
            item.bobotPersen = Number(((item.hargaTotal / totalHarga) * 100).toFixed(4));
          });
        } else {
            parsedItems.forEach(item => {
                item.bobotPersen = Number((item.hargaTotal).toFixed(4));
            });
        }
        
        resolve(parsedItems);
      } catch (err) {
        reject(new Error('Gagal memproses file Excel. Pastikan format sesuai.'));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsBinaryString(file);
  });
};
