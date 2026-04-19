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

export function formatTerbilang(angka: number | string, format: 'angka' | 'rupiah' = 'angka'): string {
    const rawValue = String(angka).replace(/[^0-9]/g, ''); // strip non-numeric just in case
    if (!rawValue) return '';

    const parsedNumber = parseInt(rawValue, 10);
    if (isNaN(parsedNumber)) return '';

    const ejaan = angkaTerbilang(parsedNumber);

    if (format === 'rupiah') {
        return ejaan + ' Rupiah';
    }

    return ejaan;
}
