import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ArrowLeft, FileText, Users, Settings, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SystemFlowDocs = () => {
  const navigate = useNavigate();
  const diagramRef1 = useRef<HTMLDivElement>(null);
  const diagramRef2 = useRef<HTMLDivElement>(null);

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
    subgraph Start["🚀 MULAI"]
        A[Landing Page]
        B[Login dengan Kode Akses]
    end

    subgraph RespondentPhase1["👤 FASE RESPONDEN - PENGAJUAN"]
        R1[Dashboard Responden]
        R2[Isi Form Pengajuan]
        R3[Pilih Kategori Pekerjaan<br/>Fisik / Konsultansi]
        R4[Isi Data Pekerjaan]
        R5[Simpan sebagai Draft]
        R6[Submit Pengajuan]
        R7[Status: SUBMITTED]
    end

    subgraph AdminPhase["👨‍💼 FASE ADMIN - REVIEW"]
        AD1[Dashboard Admin]
        AD2[Lihat Daftar Pengajuan]
        AD3[Review Detail Pengajuan]
        AD4{Keputusan Review}
        AD5[✅ APPROVED]
        AD6[❌ REJECTED]
        AD7[🔄 REVISION]
        AD8[Kelola Template Dokumen]
        AD9[Edit Template di Editor]
        AD10[Setup Mail-Merge Fields]
    end

    subgraph RespondentPhase2["👤 FASE RESPONDEN - HASIL"]
        RR1[Notifikasi Status Update]
        RR2[Lihat Status di Dashboard]
        RR3{Status Pengajuan?}
        RR4[Revisi Data Pengajuan]
        RR5[Preview Dokumen]
        RR6[Cetak Dokumen PDF]
        RR7[Download Hasil]
        RR8[Lapor Kesalahan<br/>jika ada]
    end

    subgraph End["🏁 SELESAI"]
        E1[Dokumen Tercetak]
        E2[Proses Selesai]
    end

    A --> B
    B -->|Kode Responden| R1
    B -->|Kode Admin| AD1
    
    R1 --> R2
    R2 --> R3
    R3 --> R4
    R4 --> R5
    R5 --> R6
    R6 --> R7
    R7 -.->|Notifikasi ke Admin| AD2

    AD1 --> AD2
    AD1 --> AD8
    AD8 --> AD9
    AD9 --> AD10
    AD2 --> AD3
    AD3 --> AD4
    AD4 -->|Setujui| AD5
    AD4 -->|Tolak| AD6
    AD4 -->|Minta Revisi| AD7
    
    AD5 -.->|Notifikasi| RR1
    AD6 -.->|Notifikasi| RR1
    AD7 -.->|Notifikasi| RR1

    RR1 --> RR2
    RR2 --> RR3
    RR3 -->|REVISION| RR4
    RR4 --> R4
    RR3 -->|REJECTED| E2
    RR3 -->|APPROVED| RR5
    RR5 --> RR6
    RR6 --> RR7
    RR7 --> E1
    RR5 --> RR8
    RR8 -.->|Laporan ke Admin| AD3
    E1 --> E2`;

  const detailedSequenceDiagram = `sequenceDiagram
    autonumber
    
    participant R as 👤 Responden
    participant SYS as 🖥️ Sistem
    participant DB as 💾 Database
    participant A as 👨‍💼 Admin
    participant DOC as 📄 Dokumen

    Note over R,DOC: ═══════ FASE 1: REGISTRASI & LOGIN ═══════
    
    R->>SYS: Akses Website
    SYS->>R: Tampilkan Landing Page
    R->>SYS: Klik "Masuk"
    SYS->>R: Tampilkan Form Login
    R->>SYS: Input Kode Akses (122333)
    SYS->>DB: Validasi Kode
    DB->>SYS: Kode Valid (Responden)
    SYS->>R: Redirect ke Dashboard Responden

    Note over R,DOC: ═══════ FASE 2: PENGAJUAN DOKUMEN ═══════
    
    R->>SYS: Klik "Ajukan Dokumen Baru"
    SYS->>R: Tampilkan Form Pengajuan
    R->>SYS: Pilih Kategori: Fisik/Konsultansi
    SYS->>DB: Ambil Fields sesuai Kategori
    DB->>SYS: Return Form Fields
    SYS->>R: Tampilkan Form Fields
    R->>SYS: Isi Data Pekerjaan
    R->>SYS: Klik "Simpan Draft"
    SYS->>DB: Simpan (Status: DRAFT)
    R->>SYS: Klik "Submit Pengajuan"
    SYS->>DB: Update (Status: SUBMITTED)
    SYS->>A: Kirim Notifikasi Email

    Note over R,DOC: ═══════ FASE 3: REVIEW ADMIN ═══════
    
    A->>SYS: Login dengan Kode Admin
    SYS->>A: Redirect ke Dashboard Admin
    A->>SYS: Buka Menu "Pengajuan"
    SYS->>DB: Ambil Daftar Pengajuan
    DB->>SYS: Return Submissions
    SYS->>A: Tampilkan Daftar Pengajuan
    A->>SYS: Klik Detail Pengajuan
    SYS->>A: Tampilkan Detail + Data
    A->>SYS: Lengkapi Data Admin-Only
    
    alt Setujui Pengajuan
        A->>SYS: Klik "Setujui"
        SYS->>DB: Update (Status: APPROVED)
        SYS->>R: Kirim Notifikasi Email
    else Tolak Pengajuan
        A->>SYS: Klik "Tolak" + Alasan
        SYS->>DB: Update (Status: REJECTED)
        SYS->>R: Kirim Notifikasi Email
    else Minta Revisi
        A->>SYS: Klik "Revisi" + Catatan
        SYS->>DB: Update (Status: REVISION)
        SYS->>R: Kirim Notifikasi Email
    end

    Note over R,DOC: ═══════ FASE 4: KELOLA TEMPLATE (ADMIN) ═══════
    
    A->>SYS: Buka Menu "Template"
    SYS->>DB: Ambil Daftar Template
    SYS->>A: Tampilkan Template List
    A->>SYS: Klik "Edit Template"
    SYS->>A: Buka Word-like Editor
    A->>SYS: Edit Tabel, Gambar, TextBox
    A->>SYS: Tambah Placeholder {{field_name}}
    A->>SYS: Simpan Template
    SYS->>DB: Update Template Content

    Note over R,DOC: ═══════ FASE 5: RESPONDEN CETAK HASIL ═══════
    
    R->>SYS: Login ke Dashboard
    SYS->>R: Tampilkan Status: APPROVED ✅
    R->>SYS: Buka "Riwayat Pengajuan"
    SYS->>DB: Ambil Submissions + Templates
    R->>SYS: Klik "Cetak Dokumen"
    SYS->>DOC: Load Template
    SYS->>DOC: Mail-Merge Data ke Template
    DOC->>SYS: Dokumen Ter-merge
    SYS->>R: Tampilkan Preview
    R->>SYS: Klik "Print"
    SYS->>R: Generate PDF
    R->>R: Download/Print Dokumen

    Note over R,DOC: ═══════ FASE 6: LAPOR KESALAHAN (OPSIONAL) ═══════
    
    R->>SYS: Klik "Lapor Kesalahan"
    SYS->>R: Tampilkan Form Anotasi
    R->>SYS: Tandai Kesalahan + Komentar
    SYS->>DB: Simpan Error Report
    SYS->>A: Kirim Notifikasi
    A->>SYS: Review Laporan
    A->>SYS: Perbaiki Data/Template
    SYS->>R: Notifikasi Sudah Diperbaiki`;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold">📊 Dokumentasi Alur Sistem</h1>
              <p className="text-muted-foreground">Sistem Manajemen Dokumen (DOCMS)</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Role Pengguna</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">9</p>
                <p className="text-sm text-muted-foreground">Jenis Dokumen</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Settings className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-muted-foreground">Status Dokumen</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Printer className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">7</p>
                <p className="text-sm text-muted-foreground">Adendum Types</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagram 1: System Overview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🔷 Flowchart Alur Sistem Lengkap
            </CardTitle>
            <Button 
              onClick={() => downloadAsText(systemOverviewDiagram, 'flowchart-sistem-docms.mmd')}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Mermaid
            </Button>
          </CardHeader>
          <CardContent>
            <div ref={diagramRef1} className="bg-muted p-4 rounded-lg overflow-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">{systemOverviewDiagram}</pre>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              💡 Tip: Buka <a href="https://mermaid.live" target="_blank" rel="noopener noreferrer" className="text-primary underline">mermaid.live</a> dan paste kode di atas untuk melihat diagram visual dan export sebagai PNG/SVG.
            </p>
          </CardContent>
        </Card>

        {/* Diagram 2: Sequence Diagram */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🔷 Sequence Diagram Detail
            </CardTitle>
            <Button 
              onClick={() => downloadAsText(detailedSequenceDiagram, 'sequence-diagram-docms.mmd')}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Mermaid
            </Button>
          </CardHeader>
          <CardContent>
            <div ref={diagramRef2} className="bg-muted p-4 rounded-lg overflow-auto">
              <pre className="text-xs whitespace-pre-wrap font-mono">{detailedSequenceDiagram}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Written Flow */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>📝 Alur Sistem Tertulis</CardTitle>
            <Button 
              onClick={() => downloadAsText(writtenFlow, 'alur-sistem-docms.txt')}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download TXT
            </Button>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none dark:prose-invert">
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  FASE 1: REGISTRASI & AKSES SISTEM
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>User mengakses website melalui Landing Page</li>
                  <li>User klik tombol "Masuk" untuk login</li>
                  <li>User memasukkan <strong>Kode Akses</strong> yang diberikan admin</li>
                  <li>Sistem memvalidasi kode:
                    <ul className="list-disc list-inside ml-4">
                      <li><code>bidangop</code> → Masuk sebagai Admin</li>
                      <li><code>122333</code> → Masuk sebagai Responden</li>
                    </ul>
                  </li>
                  <li>User diarahkan ke dashboard sesuai role</li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">
                  FASE 2: RESPONDEN MENGAJUKAN DOKUMEN
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Responden membuka Dashboard dan klik "Ajukan Dokumen Baru"</li>
                  <li>Memilih kategori pekerjaan: <strong>Fisik</strong> atau <strong>Konsultansi</strong></li>
                  <li>Mengisi form pengajuan sesuai field yang tersedia</li>
                  <li>Dapat menyimpan sebagai <strong>Draft</strong> untuk dilanjutkan nanti</li>
                  <li>Klik <strong>Submit</strong> untuk mengirim pengajuan ke Admin</li>
                  <li>Status berubah menjadi <strong>"Diajukan"</strong></li>
                  <li>Admin menerima notifikasi email tentang pengajuan baru</li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  FASE 3: ADMIN MEREVIEW PENGAJUAN
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Admin login dan membuka menu "Pengajuan"</li>
                  <li>Melihat daftar semua pengajuan dengan filter status</li>
                  <li>Klik detail untuk melihat data pengajuan</li>
                  <li>Admin dapat melengkapi field khusus admin (yang tidak diisi responden)</li>
                  <li>Admin mengambil keputusan:
                    <ul className="list-disc list-inside ml-4">
                      <li>✅ <strong>Setujui</strong> → Status jadi "Disetujui"</li>
                      <li>❌ <strong>Tolak</strong> → Status jadi "Ditolak" + alasan</li>
                      <li>🔄 <strong>Revisi</strong> → Status jadi "Perlu Revisi" + catatan</li>
                    </ul>
                  </li>
                  <li>Responden menerima notifikasi email tentang status</li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                  FASE 4: ADMIN MENGELOLA TEMPLATE
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Admin membuka menu "Template Dokumen"</li>
                  <li>Memilih template yang ingin diedit (BAPHP, BAST, Surat Perintah, dll)</li>
                  <li>Editor Word-like terbuka dengan fitur:
                    <ul className="list-disc list-inside ml-4">
                      <li>Insert/Edit Tabel dengan border options</li>
                      <li>Insert Gambar (resize, move, floating)</li>
                      <li>Insert TextBox (positioning bebas)</li>
                      <li>Format teks (font, size, color, alignment)</li>
                    </ul>
                  </li>
                  <li>Menambahkan placeholder dengan format <code>{"{{nama_field}}"}</code></li>
                  <li>Simpan template untuk digunakan saat cetak</li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                  FASE 5: RESPONDEN MENCETAK HASIL
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Responden login dan melihat status pengajuan di Dashboard</li>
                  <li>Jika status <strong>"Perlu Revisi"</strong>:
                    <ul className="list-disc list-inside ml-4">
                      <li>Responden memperbaiki data sesuai catatan admin</li>
                      <li>Submit ulang pengajuan</li>
                    </ul>
                  </li>
                  <li>Jika status <strong>"Disetujui"</strong>:
                    <ul className="list-disc list-inside ml-4">
                      <li>Buka menu "Riwayat Pengajuan"</li>
                      <li>Pilih pengajuan yang sudah approved</li>
                      <li>Klik "Cetak Dokumen"</li>
                    </ul>
                  </li>
                  <li>Sistem melakukan <strong>Mail-Merge</strong>:
                    <ul className="list-disc list-inside ml-4">
                      <li>Load template yang sudah disiapkan admin</li>
                      <li>Replace semua placeholder dengan data pengajuan</li>
                      <li>Format teks mengikuti template</li>
                    </ul>
                  </li>
                  <li>Preview dokumen ditampilkan</li>
                  <li>Klik "Print" untuk cetak atau download PDF</li>
                </ol>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  FASE 6: LAPOR KESALAHAN (OPSIONAL)
                </h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Jika responden menemukan kesalahan pada dokumen hasil</li>
                  <li>Klik tab "Lapor Kesalahan" di dialog detail</li>
                  <li>Tandai bagian yang salah dengan anotasi</li>
                  <li>Tulis komentar penjelasan</li>
                  <li>Submit laporan ke admin</li>
                  <li>Admin menerima notifikasi dan memperbaiki</li>
                  <li>Responden dapat mencetak ulang setelah diperbaiki</li>
                </ol>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Document Types Reference */}
        <Card>
          <CardHeader>
            <CardTitle>📄 Referensi Jenis Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">Kategori: FISIK</h4>
                <ul className="text-sm space-y-1">
                  <li>• KAK Perencanaan</li>
                  <li>• Surat Perintah (Fisik)</li>
                  <li>• BAPHP (Fisik)</li>
                  <li>• BAST (Fisik)</li>
                  <li>• Lampiran BAPHP</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-green-600">Kategori: KONSULTANSI</h4>
                <ul className="text-sm space-y-1">
                  <li>• KAK Konsultansi Keilmuan</li>
                  <li>• Surat Perintah (Konsultansi)</li>
                  <li>• BAPHP (Konsultansi)</li>
                  <li>• BAST (Konsultansi)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Flow */}
        <Card>
          <CardHeader>
            <CardTitle>🔄 Alur Status Dokumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full">Draft</span>
              <span>→</span>
              <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 rounded-full">Diajukan</span>
              <span>→</span>
              <span className="px-3 py-1 bg-yellow-200 dark:bg-yellow-800 rounded-full">Review</span>
              <span>→</span>
              <div className="flex flex-col gap-1">
                <span className="px-3 py-1 bg-green-200 dark:bg-green-800 rounded-full">✅ Disetujui</span>
                <span className="px-3 py-1 bg-red-200 dark:bg-red-800 rounded-full">❌ Ditolak</span>
                <span className="px-3 py-1 bg-orange-200 dark:bg-orange-800 rounded-full">🔄 Revisi</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
4. Sistem memvalidasi kode:
   - "bidangop" → Masuk sebagai Admin
   - "122333" → Masuk sebagai Responden
5. User diarahkan ke dashboard sesuai role

FASE 2: RESPONDEN MENGAJUKAN DOKUMEN
────────────────────────────────────
1. Responden membuka Dashboard dan klik "Ajukan Dokumen Baru"
2. Memilih kategori pekerjaan: Fisik atau Konsultansi
3. Mengisi form pengajuan sesuai field yang tersedia
4. Dapat menyimpan sebagai Draft untuk dilanjutkan nanti
5. Klik Submit untuk mengirim pengajuan ke Admin
6. Status berubah menjadi "Diajukan"
7. Admin menerima notifikasi email tentang pengajuan baru

FASE 3: ADMIN MEREVIEW PENGAJUAN
────────────────────────────────
1. Admin login dan membuka menu "Pengajuan"
2. Melihat daftar semua pengajuan dengan filter status
3. Klik detail untuk melihat data pengajuan
4. Admin dapat melengkapi field khusus admin
5. Admin mengambil keputusan:
   - ✅ Setujui → Status jadi "Disetujui"
   - ❌ Tolak → Status jadi "Ditolak" + alasan
   - 🔄 Revisi → Status jadi "Perlu Revisi" + catatan
6. Responden menerima notifikasi email tentang status

FASE 4: ADMIN MENGELOLA TEMPLATE
────────────────────────────────
1. Admin membuka menu "Template Dokumen"
2. Memilih template yang ingin diedit
3. Editor Word-like dengan fitur:
   - Insert/Edit Tabel dengan border options
   - Insert Gambar (resize, move, floating)
   - Insert TextBox (positioning bebas)
   - Format teks (font, size, color, alignment)
4. Menambahkan placeholder {{nama_field}}
5. Simpan template untuk digunakan saat cetak

FASE 5: RESPONDEN MENCETAK HASIL
────────────────────────────────
1. Responden login dan melihat status pengajuan
2. Jika "Perlu Revisi": perbaiki data, submit ulang
3. Jika "Disetujui":
   - Buka menu "Riwayat Pengajuan"
   - Pilih pengajuan yang sudah approved
   - Klik "Cetak Dokumen"
4. Sistem melakukan Mail-Merge:
   - Load template admin
   - Replace placeholder dengan data
   - Format mengikuti template
5. Preview dokumen ditampilkan
6. Klik Print untuk cetak/download PDF

FASE 6: LAPOR KESALAHAN (OPSIONAL)
──────────────────────────────────
1. Jika responden menemukan kesalahan pada dokumen
2. Klik tab "Lapor Kesalahan"
3. Tandai bagian yang salah dengan anotasi
4. Tulis komentar penjelasan
5. Submit laporan ke admin
6. Admin memperbaiki, responden cetak ulang

═══════════════════════════════════════════════════════════════
                     JENIS DOKUMEN
═══════════════════════════════════════════════════════════════

KATEGORI FISIK:
- KAK Perencanaan
- Surat Perintah (Fisik)
- BAPHP (Fisik)
- BAST (Fisik)
- Lampiran BAPHP

KATEGORI KONSULTANSI:
- KAK Konsultansi Keilmuan
- Surat Perintah (Konsultansi)
- BAPHP (Konsultansi)
- BAST (Konsultansi)

═══════════════════════════════════════════════════════════════
                     STATUS DOKUMEN
═══════════════════════════════════════════════════════════════

Draft → Diajukan → Review → Disetujui/Ditolak/Revisi

═══════════════════════════════════════════════════════════════
`;

export default SystemFlowDocs;
