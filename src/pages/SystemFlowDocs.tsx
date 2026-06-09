import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Network, RefreshCw, ListOrdered, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mermaid from 'mermaid';

const SystemFlowDocs = () => {
  const navigate = useNavigate();
  const diagramRef1 = useRef<HTMLDivElement>(null);
  const diagramRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
    mermaid.contentLoaded();
  }, []);

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const systemOverviewDiagram = `graph TD
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
    J --> K[Contract Download]`;

  const detailedSequenceDiagram = `sequenceDiagram
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
    S->>R: Print Ready (Mail Merge)`;

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen">
      {/* TopNavBar */}
      <nav className="flex justify-between items-center w-full px-4 md:px-8 h-16 bg-surface-container-lowest border-b border-outline-variant sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-title-lg text-title-lg font-black text-primary">PUSDAOP</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="p-4 md:p-8 max-w-[1280px] mx-auto flex flex-col gap-6 pb-12">
        {/* Header Section with KOP style */}
        <header className="bg-surface-container-lowest p-6 md:p-8 rounded-lg border border-outline-variant shadow-sm flex flex-col items-center text-center relative mb-4">
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-primary"></div>
          <div className="absolute bottom-[-5px] left-0 w-full h-[1px] bg-primary"></div>
          
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4 border border-outline-variant">
            <Network className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display-lg text-3xl md:text-5xl text-primary mb-2 font-bold">Alur Sistem PUSDAOP</h1>
          <p className="font-body-lg text-lg text-on-surface-variant max-w-2xl mb-4">Sistem Arsitektur & Alur Kerja Pemerintah untuk Operasi Dokumen</p>
        </header>

        <div className="flex justify-end gap-2 mb-2">
          <button 
            onClick={() => downloadAsText(systemOverviewDiagram + '\n\n' + detailedSequenceDiagram, 'alur-sistem.mmd')}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-sm px-4 py-2 rounded hover:bg-surface-container-high transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Unduh .mmd
          </button>
          <button 
            onClick={() => downloadAsText(writtenFlow, 'alur-sistem.txt')}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-sm px-4 py-2 rounded hover:bg-surface-container-high transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Unduh .txt
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Diagrams */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Section 1: Alur Utama */}
            <section className="bg-surface-container-lowest p-4 md:p-6 rounded-lg border border-outline-variant shadow-sm">
              <h2 className="font-headline-md text-xl md:text-2xl text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2 font-semibold">
                <Network className="w-6 h-6 text-secondary" />
                1. Alur Utama (System Flow)
              </h2>
              <div className="bg-surface p-4 rounded border border-outline-variant overflow-x-auto flex justify-center">
                <div className="mermaid text-center text-sm">{systemOverviewDiagram}</div>
              </div>
            </section>

            {/* Section 2: Sequence Diagram */}
            <section className="bg-surface-container-lowest p-4 md:p-6 rounded-lg border border-outline-variant shadow-sm">
              <h2 className="font-headline-md text-xl md:text-2xl text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2 font-semibold">
                <RefreshCw className="w-6 h-6 text-secondary" />
                2. Sequence Diagram: Submission Workflow
              </h2>
              <div className="bg-surface p-4 rounded border border-outline-variant overflow-x-auto flex justify-center">
                <div className="mermaid text-center text-sm">{detailedSequenceDiagram}</div>
              </div>
            </section>
          </div>

          {/* Right Column: Guide & Reference */}
          <div className="flex flex-col gap-6">
            {/* Section 3: Panduan Langkah */}
            <section className="bg-surface-container-lowest p-4 md:p-6 rounded-lg border border-outline-variant shadow-sm">
              <h2 className="font-title-lg text-lg md:text-xl text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2 font-semibold">
                <ListOrdered className="w-5 h-5 text-secondary" />
                3. Panduan Langkah-demi-Langkah
              </h2>
              <ol className="space-y-4 font-body-sm text-sm text-on-surface-variant relative pl-2">
                <li className="relative pl-6 border-l-2 border-outline-variant pb-2">
                  <span className="absolute left-[-9px] top-0 bg-surface-container-lowest border-2 border-secondary rounded-full w-4 h-4"></span>
                  <strong className="text-on-surface font-label-md">Akses:</strong> Masuk menggunakan kode akses yang diberikan admin.
                </li>
                <li className="relative pl-6 border-l-2 border-outline-variant pb-2">
                  <span className="absolute left-[-9px] top-0 bg-surface-container-lowest border-2 border-secondary rounded-full w-4 h-4"></span>
                  <strong className="text-on-surface font-label-md">Pengajuan Awal:</strong> Isi data kontrak dan unggah profil perusahaan.
                </li>
                <li className="relative pl-6 border-l-2 border-outline-variant pb-2">
                  <span className="absolute left-[-9px] top-0 bg-surface-container-lowest border-2 border-secondary rounded-full w-4 h-4"></span>
                  <strong className="text-on-surface font-label-md">Verifikasi:</strong> Admin memeriksa kelengkapan data.
                </li>
                <li className="relative pl-6 border-l-2 border-outline-variant pb-2">
                  <span className="absolute left-[-9px] top-0 bg-surface-container-lowest border-2 border-secondary rounded-full w-4 h-4"></span>
                  <strong className="text-on-surface font-label-md">Pengajuan Akhir:</strong> Setelah disetujui, lengkapi data teknis/pelaksanaan.
                </li>
                <li className="relative pl-6 border-l-2 border-transparent">
                  <span className="absolute left-[-9px] top-0 bg-secondary rounded-full w-4 h-4 flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </span>
                  <strong className="text-on-surface font-label-md">Cetak:</strong> Unduh dokumen format pemerintah (BAPHP, BAST) yang sudah terisi otomatis.
                </li>
              </ol>
            </section>

            {/* Section 4: Referensi Status */}
            <section className="bg-surface-container-lowest p-4 md:p-6 rounded-lg border border-outline-variant shadow-sm">
              <h2 className="font-title-lg text-lg md:text-xl text-primary mb-4 border-b border-outline-variant pb-2 flex items-center gap-2 font-semibold">
                <Info className="w-5 h-5 text-secondary" />
                4. Referensi Status
              </h2>
              <ul className="space-y-2 font-body-sm text-sm">
                <li className="flex items-start gap-2 p-2 rounded bg-surface">
                  <span className="mt-1 w-2 h-2 rounded-full bg-outline flex-shrink-0"></span>
                  <div>
                    <strong className="text-on-surface">Draft:</strong> <span className="text-on-surface-variant">Belum dikirim.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded bg-surface">
                  <span className="mt-1 w-2 h-2 rounded-full bg-secondary-container flex-shrink-0"></span>
                  <div>
                    <strong className="text-on-surface">Submitted:</strong> <span className="text-on-surface-variant">Menunggu antrean review.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded bg-surface">
                  <span className="mt-1 w-2 h-2 rounded-full bg-tertiary-fixed-dim flex-shrink-0"></span>
                  <div>
                    <strong className="text-on-surface">Under Review:</strong> <span className="text-on-surface-variant">Sedang diperiksa admin.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded bg-surface border-l-4 border-green-500">
                  <span className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                  <div>
                    <strong className="text-green-700">Approved:</strong> <span className="text-on-surface-variant">Data valid, lanjut ke tahap berikutnya.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded bg-surface border-l-4 border-error">
                  <span className="mt-1 w-2 h-2 rounded-full bg-error flex-shrink-0"></span>
                  <div>
                    <strong className="text-error">Needs Revision:</strong> <span className="text-on-surface-variant">Ada kesalahan, cek catatan admin.</span>
                  </div>
                </li>
                <li className="flex items-start gap-2 p-2 rounded bg-surface">
                  <span className="mt-1 w-2 h-2 rounded-full bg-on-surface-variant flex-shrink-0"></span>
                  <div>
                    <strong className="text-on-surface">Rejected:</strong> <span className="text-on-surface-variant">Pengajuan ditolak.</span>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

const writtenFlow = `
═══════════════════════════════════════════════════════════════
              ALUR SISTEM MANAJEMEN DOKUMEN (DOCMS)
═══════════════════════════════════════════════════════════════

FASE 1: REGISTRASI & AKSES SISTEM
─────────────────────────────────
1. User mengakses website melalui Landing Page
2. User klik tombol "Masuk" untuk login
3. User memasukkan Kode Akses yang diberikan admin
4. Sistem memvalidasi kode
5. User diarahkan ke dashboard sesuai role

FASE 2: RESPONDEN MENGAJUKAN DOKUMEN
────────────────────────────────────
1. Responden mengisi form pengajuan awal
2. Klik Submit untuk mengirim pengajuan ke Admin
3. Admin menerima notifikasi

FASE 3: ADMIN MEREVIEW PENGAJUAN
────────────────────────────────
1. Admin mereview data
2. Admin mengambil keputusan (Approved/Needs Revision)
3. Jika Approved, lanjut ke Dokumen Akhir

FASE 4: PENGISIAN DOKUMEN AKHIR
───────────────────────────────
1. Responden melengkapi data tambahan
2. Admin melakukan final approval
3. Sistem generate dokumen

FASE 5: CETAK & DOWNLOAD
────────────────────────
1. Mail-merge otomatis dijalankan
2. Dokumen BAPHP, BAST dll siap didownload
`;

export default SystemFlowDocs;

