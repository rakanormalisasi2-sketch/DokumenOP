/**
 * Convert a number to Indonesian spelled-out words (Terbilang).
 */
export function angkaTerbilang(angka: number | string): string {
    const number = Number(angka);
    if (isNaN(number) || number === 0) return 'Nol';

    const bilangan = [
        '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
    ];

    let result = '';

    if (number < 12) {
        result = bilangan[number];
    } else if (number < 20) {
        result = angkaTerbilang(number - 10) + ' Belas';
    } else if (number < 100) {
        result = angkaTerbilang(Math.floor(number / 10)) + ' Puluh ' + angkaTerbilang(number % 10);
    } else if (number < 200) {
        result = 'Seratus ' + angkaTerbilang(number - 100);
    } else if (number < 1000) {
        result = angkaTerbilang(Math.floor(number / 100)) + ' Ratus ' + angkaTerbilang(number % 100);
    } else if (number < 2000) {
        result = 'Seribu ' + angkaTerbilang(number - 1000);
    } else if (number < 1000000) {
        result = angkaTerbilang(Math.floor(number / 1000)) + ' Ribu ' + angkaTerbilang(number % 1000);
    } else if (number < 1000000000) {
        result = angkaTerbilang(Math.floor(number / 1000000)) + ' Juta ' + angkaTerbilang(number % 1000000);
    } else if (number < 1000000000000) {
        result = angkaTerbilang(Math.floor(number / 1000000000)) + ' Milyar ' + angkaTerbilang(number % 1000000000);
    } else if (number < 1000000000000000) {
        result = angkaTerbilang(Math.floor(number / 1000000000000)) + ' Trilyun ' + angkaTerbilang(number % 1000000000000);
    }

    return result.trim().replace(/\s+/g, ' ');
}

const BULAN_INDONESIA = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const HARI_INDONESIA = [
    'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export function formatTanggalTerbilang(dateString: string, formatType: 'tanggal' | 'tanggal_hari' | 'hari_saja' | 'bulan_saja' | 'tahun_saja' | 'tanggal_saja' = 'tanggal'): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const hariIndex = date.getDay();
    const hari = HARI_INDONESIA[hariIndex];
    const tanggal = date.getDate();
    const bulanIndex = date.getMonth();
    const bulan = BULAN_INDONESIA[bulanIndex];
    const tahun = date.getFullYear();

    const tanggalTerbilang = angkaTerbilang(tanggal);
    const tahunTerbilang = angkaTerbilang(tahun);

    switch (formatType) {
        case 'hari_saja':
            return hari;
        case 'bulan_saja':
            return bulan;
        case 'tahun_saja':
            return tahunTerbilang;
        case 'tanggal_saja':
            return tanggalTerbilang;
        case 'tanggal_hari':
            return `${hari}, ${tanggalTerbilang} ${bulan} ${tahunTerbilang}`;
        case 'tanggal':
        default:
            return `${tanggalTerbilang} ${bulan} ${tahunTerbilang}`;
    }
}

export function formatTerbilang(angkaOrDate: number | string, format: 'angka' | 'rupiah' | 'tanggal' | 'tanggal_hari' | 'hari_saja' | 'bulan_saja' | 'tahun_saja' | 'tanggal_saja' = 'angka'): string {
    if (['tanggal', 'tanggal_hari', 'hari_saja', 'bulan_saja', 'tahun_saja', 'tanggal_saja'].includes(format)) {
        return formatTanggalTerbilang(String(angkaOrDate), format as any);
    }

    const rawValue = String(angkaOrDate).replace(/[^0-9]/g, ''); // strip non-numeric just in case
    if (!rawValue) return '';

    const parsedNumber = parseInt(rawValue, 10);
    if (isNaN(parsedNumber)) return '';

    const ejaan = angkaTerbilang(parsedNumber);

    if (format === 'rupiah') {
        return ejaan + ' Rupiah';
    }

    return ejaan;
}
