import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Submission } from '@/types';

export const generateLampiranBaphpExcel = async (submission: Submission) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Lampiran BAPHP');

  // Set column widths
  sheet.columns = [
    { width: 5 },   // A: No
    { width: 40 },  // B: Jenis Pekerjaan / Uraian
    { width: 10 },  // C: Satuan / Ada
    { width: 15 },  // D: Vol Kontrak / Tidak
    { width: 15 },  // E: Bobot Kontrak / Catatan
    { width: 15 },  // F: Vol Realisasi
    { width: 15 },  // G: Bobot Realisasi
  ];

  // Helper for styling
  const centerStyle: Partial<ExcelJS.Style> = {
    alignment: { horizontal: 'center', vertical: 'middle' },
    font: { name: 'Arial', size: 10 }
  };
  const boldCenterStyle: Partial<ExcelJS.Style> = {
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    font: { name: 'Arial', size: 10, bold: true }
  };
  const borderStyle: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };

  // 1. Header (Title)
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'LAMPIRAN BERITA ACARA PEMERIKSAAN HASIL PEKERJAAN (BAPHP)';
  titleCell.font = { name: 'Arial', size: 12, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 2. Info Proyek
  sheet.getCell('A3').value = 'Nama Pekerjaan';
  sheet.getCell('B3').value = `: ${submission.data.nama_pekerjaan || '-'}`;
  sheet.getCell('A4').value = 'Nomor Kontrak';
  sheet.getCell('B4').value = `: ${submission.data.nomor_kontrak || '-'}`;
  sheet.getCell('A5').value = 'Lokasi';
  sheet.getCell('B5').value = `: ${submission.data.lokasi || '-'}`;
  sheet.getCell('A6').value = 'Penyedia Jasa';
  sheet.getCell('B6').value = `: ${submission.respondentName || '-'}`;

  // Style info proyek
  ['A3','A4','A5','A6'].forEach(cell => {
      sheet.getCell(cell).font = { name: 'Arial', size: 10, bold: true };
  });
  ['B3','B4','B5','B6'].forEach(cell => {
      sheet.getCell(cell).font = { name: 'Arial', size: 10 };
  });

  // 3. RAB Table
  sheet.getCell('A8').value = 'I. REALISASI FISIK PEKERJAAN';
  sheet.getCell('A8').font = { name: 'Arial', size: 10, bold: true };

  const rabHeaderRow1 = 10;
  const rabHeaderRow2 = 11;
  
  // Headers Table 1
  sheet.mergeCells(`A${rabHeaderRow1}:A${rabHeaderRow2}`);
  sheet.getCell(`A${rabHeaderRow1}`).value = 'No';
  sheet.mergeCells(`B${rabHeaderRow1}:B${rabHeaderRow2}`);
  sheet.getCell(`B${rabHeaderRow1}`).value = 'Jenis Pekerjaan';
  sheet.mergeCells(`C${rabHeaderRow1}:C${rabHeaderRow2}`);
  sheet.getCell(`C${rabHeaderRow1}`).value = 'Satuan';
  
  sheet.mergeCells(`D${rabHeaderRow1}:E${rabHeaderRow1}`);
  sheet.getCell(`D${rabHeaderRow1}`).value = 'Kontrak';
  sheet.getCell(`D${rabHeaderRow2}`).value = 'Volume';
  sheet.getCell(`E${rabHeaderRow2}`).value = 'Bobot (%)';

  sheet.mergeCells(`F${rabHeaderRow1}:G${rabHeaderRow1}`);
  sheet.getCell(`F${rabHeaderRow1}`).value = 'Realisasi';
  sheet.getCell(`F${rabHeaderRow2}`).value = 'Volume';
  sheet.getCell(`G${rabHeaderRow2}`).value = 'Bobot (%)';

  // Style headers
  for (let c = 1; c <= 7; c++) {
    const cell1 = sheet.getCell(rabHeaderRow1, c);
    const cell2 = sheet.getCell(rabHeaderRow2, c);
    cell1.style = { ...boldCenterStyle, border: borderStyle };
    cell2.style = { ...boldCenterStyle, border: borderStyle };
  }

  let currentRow = rabHeaderRow2 + 1;
  const rabItems = submission.rabRealisasiItems || [];
  
  let totalBobotKontrak = 0;
  let totalBobotRealisasi = 0;

  rabItems.forEach((item, index) => {
    const row = sheet.getRow(currentRow);
    row.values = [
      index + 1,
      item.jenisPekerjaan,
      item.satuan,
      item.kontrakVolume,
      item.kontrakBobot,
      item.realisasiVolume,
      item.realisasiBobot
    ];
    
    totalBobotKontrak += (item.kontrakBobot || 0);
    totalBobotRealisasi += (item.realisasiBobot || 0);

    for (let c = 1; c <= 7; c++) {
      const cell = row.getCell(c);
      cell.border = borderStyle;
      cell.font = { name: 'Arial', size: 10 };
      if (c === 1 || c === 3 || c > 3) cell.alignment = { horizontal: 'center' };
    }
    currentRow++;
  });

  // RAB Total
  sheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const totalCellRab = sheet.getCell(`A${currentRow}`);
  totalCellRab.value = 'TOTAL';
  totalCellRab.style = { ...boldCenterStyle, border: borderStyle };
  
  const tkV = sheet.getCell(`D${currentRow}`);
  tkV.style = { border: borderStyle };
  const tkB = sheet.getCell(`E${currentRow}`);
  tkB.value = totalBobotKontrak;
  tkB.style = { ...boldCenterStyle, border: borderStyle };
  
  const trV = sheet.getCell(`F${currentRow}`);
  trV.style = { border: borderStyle };
  const trB = sheet.getCell(`G${currentRow}`);
  trB.value = totalBobotRealisasi;
  trB.style = { ...boldCenterStyle, border: borderStyle };

  currentRow += 3;

  // 4. Dokumen Table
  sheet.getCell(`A${currentRow}`).value = 'II. KELENGKAPAN DOKUMEN';
  sheet.getCell(`A${currentRow}`).font = { name: 'Arial', size: 10, bold: true };
  
  currentRow += 2;
  const docHeaderRow = currentRow;
  
  sheet.getCell(`A${docHeaderRow}`).value = 'No';
  sheet.getCell(`B${docHeaderRow}`).value = 'Uraian Dokumen';
  sheet.getCell(`C${docHeaderRow}`).value = 'Ada';
  sheet.getCell(`D${docHeaderRow}`).value = 'Tidak';
  sheet.mergeCells(`E${docHeaderRow}:G${docHeaderRow}`);
  sheet.getCell(`E${docHeaderRow}`).value = 'Catatan';

  for (let c = 1; c <= 7; c++) {
    const cell = sheet.getCell(docHeaderRow, c);
    cell.style = { ...boldCenterStyle, border: borderStyle };
  }

  currentRow++;
  const docItems = submission.baphpDokumenItems || [];

  docItems.forEach((item, index) => {
    sheet.getCell(`A${currentRow}`).value = index + 1;
    sheet.getCell(`B${currentRow}`).value = item.uraian;
    sheet.getCell(`C${currentRow}`).value = item.kriteriaAda ? '✓' : '';
    sheet.getCell(`D${currentRow}`).value = item.kriteriaTidakAda ? '✓' : '';
    
    sheet.mergeCells(`E${currentRow}:G${currentRow}`);
    sheet.getCell(`E${currentRow}`).value = item.catatan || '';

    for (let c = 1; c <= 7; c++) {
      const cell = sheet.getCell(currentRow, c);
      cell.border = borderStyle;
      cell.font = { name: 'Arial', size: 10 };
      if (c === 1 || c === 3 || c === 4) cell.alignment = { horizontal: 'center' };
    }
    currentRow++;
  });

  currentRow += 4;

  // 5. Tanda Tangan
  sheet.mergeCells(`A${currentRow}:C${currentRow}`);
  sheet.getCell(`A${currentRow}`).value = 'Penyedia Jasa';
  sheet.getCell(`A${currentRow}`).style = centerStyle;

  sheet.mergeCells(`E${currentRow}:G${currentRow}`);
  sheet.getCell(`E${currentRow}`).value = 'Pejabat Pembuat Komitmen';
  sheet.getCell(`E${currentRow}`).style = centerStyle;

  currentRow += 5; // Space for signature

  sheet.mergeCells(`A${currentRow}:C${currentRow}`);
  sheet.getCell(`A${currentRow}`).value = `( ${submission.data.nama_direktur || '......................'} )`;
  sheet.getCell(`A${currentRow}`).style = { ...centerStyle, font: { name: 'Arial', size: 10, bold: true, underline: true } };

  sheet.mergeCells(`E${currentRow}:G${currentRow}`);
  sheet.getCell(`E${currentRow}`).value = `( ${submission.data.nama_ppk || '......................'} )`;
  sheet.getCell(`E${currentRow}`).style = { ...centerStyle, font: { name: 'Arial', size: 10, bold: true, underline: true } };

  currentRow++;
  sheet.mergeCells(`E${currentRow}:G${currentRow}`);
  sheet.getCell(`E${currentRow}`).value = `NIP. ${submission.data.nip_ppk || '......................'}`;
  sheet.getCell(`E${currentRow}`).style = centerStyle;

  // Generate File
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `Lampiran_BAPHP_${submission.data.nama_pekerjaan?.replace(/[^a-z0-9]/gi, '_') || 'Dokumen'}.xlsx`;
  
  saveAs(blob, filename);
};
