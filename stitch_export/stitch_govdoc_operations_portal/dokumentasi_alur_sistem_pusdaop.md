# PUSDAOP: Government Document Operations Portal
## Sistem Arsitektur & Alur Kerja

### 1. Alur Utama (System Flow)
```mermaid
graph TD
    A[Public Landing Page] --> B{Login with Access Code}
    B -- Admin Code --> C[Admin Dashboard]
    B -- Respondent Code --> D[Respondent Dashboard]
    
    D --> E[Submit Dokumen Awal]
    E --> F{Admin Review}
    F -- Needs Revision --> G[Respondent Fixes Data]
    G --> E
    F -- Approved --> H[Submit Dokumen Akhir]
    
    H --> I{Admin Review}
    I -- Approved --> J[Final Document Printing]
    J --> K[Contract Download]
```

### 2. Sequence Diagram: Submission Workflow
```mermaid
sequenceDiagram
    participant R as Respondent
    participant S as System
    participant A as Admin
    
    R->>S: Submit Dokumen Awal (PDF + Form)
    S->>A: Notify New Submission
    A->>S: Review & Add Admin Fields
    alt Needs Revision
        A->>S: Status: Needs Revision + Notes
        S->>R: Notify via Dashboard
        R->>S: Resubmit Data
    else Approved
        A->>S: Status: Approved
        S->>R: Unlock Dokumen Akhir Phase
    end
    R->>S: Submit Dokumen Akhir
    A->>S: Final Approval & Attach Contract
    S->>R: Print Ready (Mail Merge)
```

### 3. Panduan Langkah-demi-Langkah
1. **Akses**: Masuk menggunakan kode akses yang diberikan admin.
2. **Pengajuan Awal**: Isi data kontrak dan unggah profil perusahaan.
3. **Verifikasi**: Admin memeriksa kelengkapan data.
4. **Pengajuan Akhir**: Setelah disetujui, lengkapi data teknis/pelaksanaan.
5. **Cetak**: Unduh dokumen format pemerintah (BAPHP, BAST) yang sudah terisi otomatis.

### 4. Referensi Status
- **Draft**: Belum dikirim.
- **Submitted**: Menunggu antrean review.
- **Under Review**: Sedang diperiksa admin.
- **Approved**: Data valid, lanjut ke tahap berikutnya.
- **Needs Revision**: Ada kesalahan, cek catatan admin.
- **Rejected**: Pengajuan ditolak.