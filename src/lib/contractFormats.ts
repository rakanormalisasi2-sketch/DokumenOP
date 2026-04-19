
export const CONTRACT_FORMATS = [
    {
        category: '1. Metode Tender & Seleksi (Kompetitif)',
        items: [
            {
                subcategory: 'Tender (Barang)',
                types: [
                    { id: 'iv_1_tender_pasca_barang', label: 'IV.1 Tender Pasca Barang', template: 'tpl_iv_1' },
                    { id: 'iv_2_a_tender_pra_barang_kual', label: 'IV.2.A Tender Pra Barang (Kualifikasi)', template: 'tpl_iv_2_a' },
                    { id: 'iv_2_b_tender_pra_barang_tender', label: 'IV.2.B Tender Pra Barang (Tender)', template: 'tpl_iv_2_b' },
                    { id: 'iv_3_tender_cepat_barang', label: 'IV.3 Tender Cepat Barang', template: 'tpl_iv_3' },
                ]
            },
            {
                subcategory: 'Tender (Jasa Lainnya)',
                types: [
                    { id: 'iv_4_tender_pasca_jasa', label: 'IV.4 Tender Pasca Jasa Lain', template: 'tpl_iv_4' },
                    { id: 'iv_5_a_tender_pra_jasa_kual', label: 'IV.5.A Tender Pra Jasa Lain (Kualifikasi)', template: 'tpl_iv_5_a' },
                    { id: 'iv_5_b_tender_pra_jasa_tender', label: 'IV.5.B Tender Pra Jasa Lain (Tender)', template: 'tpl_iv_5_b' },
                    { id: 'iv_6_tender_cepat_jasa', label: 'IV.6 Tender Cepat Jasa Lain', template: 'tpl_iv_6' },
                ]
            },
            {
                subcategory: 'Seleksi (Jasa Konsultansi)',
                types: [
                    { id: 'iv_7_a_seleksi_badan_kual', label: 'IV.7.A Seleksi Badan (Kualifikasi)', template: 'tpl_iv_7_a' },
                    { id: 'iv_7_b_seleksi_badan_seleksi', label: 'IV.7.B Seleksi Badan (Seleksi)', template: 'tpl_iv_7_b' },
                    { id: 'iv_8_seleksi_perorangan', label: 'IV.8 Seleksi Perorangan', template: 'tpl_iv_8' },
                ]
            }
        ]
    },
    {
        category: '2. Metode Penunjukan Langsung (Khusus)',
        items: [
            {
                subcategory: 'Barang',
                types: [
                    { id: 'iv_9_a_pl_barang_kual', label: 'IV.9.A PL Barang (Kualifikasi)', template: 'tpl_iv_9_a' },
                    { id: 'iv_9_b_pl_barang_pl', label: 'IV.9.B PL Barang (Penunjukan)', template: 'tpl_iv_9_b' }
                ]
            },
            {
                subcategory: 'Jasa Lainnya',
                types: [
                    { id: 'iv_10_a_pl_jasa_kual', label: 'IV.10.A PL Jasa Lain (Kualifikasi)', template: 'tpl_iv_10_a' },
                    { id: 'iv_10_b_pl_jasa_pl', label: 'IV.10.B PL Jasa Lain (Penunjukan)', template: 'tpl_iv_10_b' }
                ]
            },
            {
                subcategory: 'Jasa Konsultansi',
                types: [
                    { id: 'iv_11_a_pl_konsul_badan_kual', label: 'IV.11.A PL Konsul Badan (Kualifikasi)', template: 'tpl_iv_11_a' },
                    { id: 'iv_11_b_pl_konsul_badan_pl', label: 'IV.11.B PL Konsul Badan (Penunjukan)', template: 'tpl_iv_11_b' },
                    { id: 'iv_12_a_pl_konsul_org_kual', label: 'IV.12.A PL Konsul Orang (Kualifikasi)', template: 'tpl_iv_12_a' },
                    { id: 'iv_12_b_pl_konsul_org_pl', label: 'IV.12.B PL Konsul Orang (Penunjukan)', template: 'tpl_iv_12_b' }
                ]
            }
        ]
    },
    {
        category: '3. Metode Pengadaan Langsung (Sederhana)',
        items: [
            {
                subcategory: 'Non-Konstruksi',
                types: [
                    { id: 'iv_13_pengadaan_langsung_barang', label: 'IV.13 Pengadaan Langsung Barang', template: 'tpl_iv_13' },
                    { id: 'iv_14_pengadaan_langsung_jasa', label: 'IV.14 Pengadaan Langsung Jasa Lain', template: 'tpl_iv_14' },
                    { id: 'iv_15_pengadaan_langsung_konsul_badan', label: 'IV.15 Pengadaan Langsung Konsul Badan', template: 'tpl_iv_15' },
                    { id: 'iv_16_pengadaan_langsung_konsul_org', label: 'IV.16 Pengadaan Langsung Konsul Orang', template: 'tpl_iv_16' },
                ]
            },
            {
                subcategory: 'Konstruksi (JKK/PK)',
                types: [
                    { id: 'v_1_jkk_perorangan', label: 'V.1 Pengadaan Langsung JKK Perorangan', template: 'tpl_v_1' },
                    { id: 'v_2_jkk_badan', label: 'V.2 Pengadaan Langsung JKK Badan Usaha', template: 'tpl_v_2' },
                    { id: 'v_3_pk_perorangan', label: 'V.3 Pengadaan Langsung PK Perorangan', template: 'tpl_v_3' },
                ]
            }
        ]
    }
];
