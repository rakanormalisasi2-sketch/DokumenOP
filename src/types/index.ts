export type UserRole = 'admin' | 'respondent';

export type DocumentStatus = 'draft' | 'submitted' | 'review' | 'approved' | 'rejected' | 'revision';

export type DocumentType =
  | 'kak_perencanaan'
  | 'kak_konsultansi'
  | 'surat_perintah_fisik'
  | 'surat_perintah_konsultansi'
  | 'baphp_fisik'
  | 'baphp_konsultansi'
  | 'bast_fisik'
  | 'bast_konsultansi'
  | 'lampiran_baphp';

export type AdendumType =
  | 'adendum_bast_fisik'
  | 'adendum_bast_konsultansi'
  | 'adendum_baphp_fisik'
  | 'adendum_baphp_konsultansi'
  | 'adendum_surat_perintah_fisik'
  | 'adendum_surat_perintah_konsultansi'
  | 'adendum_lampiran_baphp';

export type PaperSize = 'A4' | 'F4' | 'Letter' | 'Legal';

export type WorkCategory = 'fisik' | 'konsultansi';

export interface User {
  id: string;
  role: UserRole;
  code?: string;
  name?: string;
  email?: string;
  createdAt: Date;
}

export type AccessRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  requestDate: Date;
  status: AccessRequestStatus;
  code?: string;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'terbilang';
  placeholder?: string;
  options?: string[];
  required: boolean;
  order: number;
  visibleTo: 'respondent' | 'admin' | 'both';
  filledBy: 'respondent' | 'admin';
  phase: 'persiapan' | 'pelaksanaan';
  showIn: ('awal' | 'akhir')[]; // Untuk pelaksanaan
  showInAdmin?: ('kak' | 'kontrak' | 'nota')[]; // Untuk persiapan (dokumen kontrak admin)
  // Khusus untuk type 'terbilang'
  linkedFieldId?: string; // Menyimpan ID field yang dirujuk
  terbilangFormat?: 'angka' | 'rupiah'; // Format ejaan terbilang
}

export interface WorkforceRequirement {
  id: string;
  position: 'team_leader' | 'surveyor' | 'drafter' | 'estimator' | 'tenaga_administrasi';
  jumlahOrang: number;
  pendidikan: string;
  jurusan: string;
  keahlian: string;
  pengalaman: number;
  statusTenagaAhli: string;
}

export interface SchedulePhase {
  id: string;
  name: string;
  durationDays: number;
  startDay: number;
  splits?: { days: number; description: string }[];
}

// Lampiran BAPHP item for dynamic rows
export interface LampiranBAPHPItem {
  id: string;
  no: number;
  namaPekerjaan: string;
  bobotPersen: number;
  keterangan?: string;
}

// Adendum document structure
export interface AdendumDocument {
  id: string;
  submissionId: string;
  type: AdendumType;
  parentDocumentId?: string; // Reference to original document
  content: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface Submission {
  id: string;
  respondentId: string;
  respondentName: string;
  submissionPhase: 'awal' | 'akhir'; // Identifies which workflow phase this is in
  status: DocumentStatus;
  data: Record<string, string>; // The dynamic field data

  // Base64 document attachments
  companyProfile?: string; // Uploaded by respondent in 'awal'
  contractFile?: string; // Sent by admin to respondent -> final PDF outcome

  documentType?: DocumentType;
  workCategory?: WorkCategory; // Fisik or Konsultansi
  adminFeedback?: string;
  documentDate?: string;
  createdAt: Date;
  updatedAt: Date;
  // KAK specific data
  kakType?: 'kak_perencanaan' | 'kak_konsultansi';
  workforceRequirements?: WorkforceRequirement[];
  schedulePhases?: SchedulePhase[];
  durasiPelaksanaan?: number;
  // Lampiran BAPHP items
  lampiranBaphpItems?: LampiranBAPHPItem[];
  // Adendum documents
  adendumDocuments?: AdendumDocument[];
  // Error reports from respondents
  errorReports?: DocumentErrorReport[];

  // Document specific dates (Nomor & Tanggal)
  documentDates?: {
    [key in DocumentType]?: { nomor: string; tanggal: string };
  };
}

// Untuk menyimpan data isian Buat Dokumen Kontrak / Generate Masal Admin
export interface ContractDraft {
  id: string;
  type: 'kak' | 'kontrak' | 'nota';
  lastUpdated: Date;
  data: Record<string, string>; // Single row data
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType | AdendumType | string; // Configurable string for 27 types
  category?: WorkCategory | 'kak' | 'kontrak' | 'notadinas' | 'pelaksanaan' | 'pencairan';
  phase: 'persiapan' | 'pelaksanaan'; // New grouping
  content: string;
  format: 'docx' | 'xlsx';
  lastUpdated: Date;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  kak_perencanaan: 'KAK Perencanaan',
  kak_konsultansi: 'KAK Konsultansi Keilmuan',
  surat_perintah_fisik: 'Surat Perintah (Fisik)',
  surat_perintah_konsultansi: 'Surat Perintah (Konsultansi)',
  baphp_fisik: 'BAPHP (Fisik)',
  baphp_konsultansi: 'BAPHP (Konsultansi)',
  bast_fisik: 'BAST (Fisik)',
  bast_konsultansi: 'BAST (Konsultansi)',
  lampiran_baphp: 'Lampiran BAPHP',
};

export const ADENDUM_TYPE_LABELS: Record<AdendumType, string> = {
  adendum_bast_fisik: 'Adendum BAST (Fisik)',
  adendum_bast_konsultansi: 'Adendum BAST (Konsultansi)',
  adendum_baphp_fisik: 'Adendum BAPHP (Fisik)',
  adendum_baphp_konsultansi: 'Adendum BAPHP (Konsultansi)',
  adendum_surat_perintah_fisik: 'Adendum Surat Perintah (Fisik)',
  adendum_surat_perintah_konsultansi: 'Adendum Surat Perintah (Konsultansi)',
  adendum_lampiran_baphp: 'Adendum Lampiran BAPHP',
};

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  submitted: 'Diajukan',
  review: 'Dalam Review',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  revision: 'Perlu Revisi',
};

export const PAPER_SIZE_LABELS: Record<PaperSize, string> = {
  A4: 'A4 (210 x 297 mm)',
  F4: 'F4/Folio (215 x 330 mm)',
  Letter: 'Letter (8.5 x 11 in)',
  Legal: 'Legal (8.5 x 14 in)',
};

// Document types that respondent can print (after approval)
export const RESPONDENT_PRINTABLE_TYPES: DocumentType[] = [
  'baphp_fisik', 'baphp_konsultansi',
  'lampiran_baphp',
  'bast_fisik', 'bast_konsultansi',
  'surat_perintah_fisik', 'surat_perintah_konsultansi'
];

// KAK is admin-only for printing
export const ADMIN_ONLY_PRINT_TYPES: DocumentType[] = ['kak_perencanaan', 'kak_konsultansi'];

export const POSITION_LABELS: Record<WorkforceRequirement['position'], string> = {
  team_leader: 'Team Leader',
  surveyor: 'Surveyor',
  drafter: 'Drafter',
  estimator: 'Estimator',
  tenaga_administrasi: 'Tenaga Administrasi',
};

export const PENDIDIKAN_OPTIONS = [
  'SMA/SMK',
  'D1',
  'D2',
  'D3',
  'D4/Sarjana Terapan',
  'S1/Sarjana',
  'S2/Magister',
  'S3/Doktor',
];

export const JURUSAN_OPTIONS = [
  'Tidak Ada / Umum',
  'Teknik Sipil',
  'Teknik Pengairan',
  'Teknik Jalan',
  'Teknik Bangunan',
  'Teknik Arsitektur',
  'Teknik Geodesi',
  'Teknik Lingkungan',
  'Teknik Struktur',
  'Teknik Geoteknik',
  'Perencanaan Wilayah dan Kota',
  'Gambar Bangunan',
  'Konstruksi Bangunan',
  'Desain Interior',
  'Lainnya (Teknik)',
];

export const KEAHLIAN_OPTIONS = [
  'Tenaga Ahli Muda / Jenjang 7',
  'Tenaga Ahli Madya / Jenjang 8',
  'Tenaga Ahli Utama / Jenjang 9',
  'Teknisi',
  'Operator',
  'Administrasi',
];

export const DEFAULT_SCHEDULE_PHASES = [
  { name: 'Survey Lokasi Pekerjaan', durationDays: 3 },
  { name: 'Pengolahan Data', durationDays: 5 },
  { name: 'Diskusi Teknis', durationDays: 2 },
  { name: 'Pelaporan Hasil', durationDays: 4 },
];

export interface AnnotationMark {
  id: string;
  type: 'highlight' | 'strikethrough' | 'comment';
  startOffset: number;
  endOffset: number;
  color: string;
  comment?: string;
}

export interface DocumentErrorReport {
  id: string;
  submissionId: string;
  documentType: DocumentType | AdendumType | string;
  reportedBy?: string;
  reportedByName?: string;
  comment?: string;
  annotations?: AnnotationMark[];
  screenshotPdf?: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
}
