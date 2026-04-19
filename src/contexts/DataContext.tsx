import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { FormField, Submission, DocumentTemplate, DocumentType, DocumentStatus, DocumentErrorReport, AdendumDocument, AccessRequest, ContractDraft } from '@/types';
import { templateStorage } from '@/lib/templateStorage';
import { CONTRACT_FORMATS } from '@/lib/contractFormats';

interface DataContextType {
  fields: FormField[];
  submissions: Submission[];
  templates: DocumentTemplate[];
  accessRequests: AccessRequest[];
  contractDrafts: ContractDraft[];

  addField: (field: Omit<FormField, 'id' | 'order'>) => void;
  updateField: (id: string, field: Partial<FormField>) => void;
  deleteField: (id: string) => void;
  addSubmission: (submission: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSubmission: (id: string, data: Partial<Submission>) => void;
  updateSubmissionStatus: (id: string, status: DocumentStatus, feedback?: string) => void;
  deleteSubmission: (id: string) => void;
  getSubmissionsByRespondent: (respondentId: string) => Submission[];
  addTemplate: (template: Omit<DocumentTemplate, 'id' | 'lastUpdated'>) => void;
  updateTemplate: (id: string, content: string) => Promise<void>;
  updateTemplateMeta: (id: string, updates: Partial<DocumentTemplate>) => void;
  removeTemplate: (id: string) => void;
  // Error reports
  addErrorReport: (report: Omit<DocumentErrorReport, 'id' | 'createdAt' | 'status'>) => void;
  resolveErrorReport: (submissionId: string, reportId: string) => void;
  getErrorReports: (submissionId: string) => DocumentErrorReport[];
  // Adendum
  addAdendum: (submissionId: string, adendum: Omit<AdendumDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAdendum: (submissionId: string, adendumId: string, content: Record<string, string>) => void;
  // Access requests
  addAccessRequest: (request: Omit<AccessRequest, 'id' | 'requestDate' | 'status'>) => void;
  updateAccessRequest: (id: string, data: Partial<AccessRequest>) => void;
  getAccessRequestByEmail: (email: string) => AccessRequest | undefined;

  // Contract Drafts
  addContractDraft: (draft: Omit<ContractDraft, 'id' | 'lastUpdated'>) => void;
  updateContractDraft: (id: string, data: Partial<ContractDraft>) => void;
  deleteContractDraft: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialFields: FormField[] = [
  // --- Pelaksanaan Fields ---
  { id: '1', name: 'nama_pekerjaan', label: 'Nama Pekerjaan', type: 'text', required: true, order: 1, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '2', name: 'nama_pelaksana', label: 'Nama Pelaksana (CV/PT)', type: 'text', required: true, order: 2, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '3', name: 'nomor_kontrak', label: 'Nomor Kontrak', type: 'text', required: true, order: 3, visibleTo: 'both', filledBy: 'admin', phase: 'persiapan', showIn: [], showInAdmin: ['kak', 'kontrak'] },
  { id: '4', name: 'nilai_kontrak', label: 'Nilai Kontrak (Rp)', type: 'number', required: true, order: 4, visibleTo: 'both', filledBy: 'admin', phase: 'persiapan', showIn: [], showInAdmin: ['kontrak'] },
  { id: '5', name: 'tanggal_mulai', label: 'Tanggal Mulai', type: 'date', required: true, order: 5, visibleTo: 'both', filledBy: 'admin', phase: 'persiapan', showIn: [], showInAdmin: ['kontrak'] },
  { id: '6', name: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date', required: true, order: 6, visibleTo: 'both', filledBy: 'admin', phase: 'persiapan', showIn: [], showInAdmin: ['kontrak'] },
  { id: '7', name: 'lokasi_pekerjaan', label: 'Lokasi Pekerjaan', type: 'text', required: true, order: 7, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '8', name: 'deskripsi', label: 'Deskripsi Pekerjaan', type: 'textarea', required: false, order: 8, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
];

const defaultTemplates: DocumentTemplate[] = [
  // --- Dokumen Persiapan ---
  { id: '1', name: 'Template KAK Perencanaan', type: 'kak_perencanaan', phase: 'persiapan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '2', name: 'Template KAK Konsultansi', type: 'kak_konsultansi', phase: 'persiapan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: 'nd_1', name: 'Template Nota Dinas', type: 'nota_dinas', phase: 'persiapan', content: '', format: 'docx', lastUpdated: new Date() },

  // --- Dokumen Pelaksanaan (Existing) ---
  { id: '3', name: 'Template Surat Perintah (Fisik)', type: 'surat_perintah_fisik', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '4', name: 'Template Surat Perintah (Konsultansi)', type: 'surat_perintah_konsultansi', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '5', name: 'Template BAPHP (Fisik)', type: 'baphp_fisik', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '6', name: 'Template BAPHP (Konsultansi)', type: 'baphp_konsultansi', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '7', name: 'Template BAST (Fisik)', type: 'bast_fisik', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '8', name: 'Template BAST (Konsultansi)', type: 'bast_konsultansi', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '9', name: 'Template Lampiran BAPHP', type: 'lampiran_baphp', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'xlsx', lastUpdated: new Date() },

  // --- Dokumen Persiapan (27 Format Kontrak) ---
  ...CONTRACT_FORMATS.flatMap(category =>
    category.items.flatMap(item =>
      item.types.map(type => ({
        id: type.template, // Using template key as ID for uniqueness
        name: type.label,
        type: type.id, // e.g. 'tender_barang_pasca'
        phase: 'persiapan' as const,
        content: '',
        format: 'docx' as const,
        lastUpdated: new Date()
      }))
    )
  )
];

const sampleSubmissions: Submission[] = [
  {
    id: '1',
    respondentId: 'resp1',
    respondentName: 'PT Maju Bersama',
    status: 'submitted',
    submissionPhase: 'akhir',
    documentType: 'kak_perencanaan',
    workCategory: 'konsultansi',
    data: {
      nama_pekerjaan: 'Pengadaan Alat Tulis Kantor',
      nama_pelaksana: 'PT Maju Bersama',
      nomor_kontrak: 'KTR/2024/001',
      nilai_kontrak: '50000000',
      tanggal_mulai: '2024-02-01',
      tanggal_selesai: '2024-03-01',
      lokasi_pekerjaan: 'Jakarta Pusat',
      deskripsi: 'Pengadaan ATK untuk kebutuhan kantor semester 1',
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    respondentId: 'resp2',
    respondentName: 'CV Karya Mandiri',
    status: 'approved',
    submissionPhase: 'awal',
    documentType: 'surat_perintah_fisik',
    workCategory: 'fisik',
    data: {
      nama_pekerjaan: 'Pemeliharaan AC Gedung',
      nama_pelaksana: 'CV Karya Mandiri',
      lokasi_pekerjaan: 'Gedung Utama Lt.1-5',
      deskripsi: 'Pemeliharaan berkala AC split dan central',
    },
    documentDate: '2024-01-18',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    respondentId: 'resp3',
    respondentName: 'PT Teknologi Nusantara',
    status: 'revision',
    submissionPhase: 'akhir',
    documentType: 'baphp_konsultansi',
    workCategory: 'konsultansi',
    adminFeedback: 'Mohon lengkapi detail spesifikasi teknis dan lampirkan dokumen pendukung.',
    data: {
      nama_pekerjaan: 'Pengembangan Sistem Informasi',
      nama_pelaksana: 'PT Teknologi Nusantara',
      nomor_kontrak: 'KTR/2024/003',
      nilai_kontrak: '150000000',
      tanggal_mulai: '2024-01-05',
      tanggal_selesai: '2024-04-05',
      lokasi_pekerjaan: 'Data Center',
      deskripsi: 'Pengembangan sistem informasi kepegawaian',
    },
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-20'),
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [submissions, setSubmissions] = useState<Submission[]>(sampleSubmissions);
  const [templates, setTemplates] = useState<DocumentTemplate[]>(defaultTemplates);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [contractDrafts, setContractDrafts] = useState<ContractDraft[]>([]);

  // Hydrate template contents from Cloud Storage so it works across tabs/devices.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Migrate legacy localStorage templates (best-effort)
      try {
        const legacy = localStorage.getItem('document_templates');
        if (legacy) {
          const parsed = JSON.parse(legacy) as { id: string; content?: string; format?: DocumentTemplate['format'] }[];
          await Promise.all(
            parsed
              .filter((t) => t?.id && typeof t?.content === 'string' && t.content.length > 0)
              .map(async (t) => {
                const fallbackFormat = defaultTemplates.find((d) => d.id === t.id)?.format;
                const format = (t.format ?? fallbackFormat) as DocumentTemplate['format'] | undefined;
                if (!format) return;
                await templateStorage.saveTemplateContent({ templateId: t.id, format, content: t.content! });
              })
          );
          localStorage.removeItem('document_templates');
        }
      } catch (e) {
        console.error('Legacy template migration failed:', e);
      }

      try {
        // Skip R2 loading if not configured (graceful fallback for fresh deployment)
        if (r2Storage.isConfigured()) {
          const loaded = await templateStorage.loadAllTemplateContents(defaultTemplates);
          if (cancelled) return;
          setTemplates((prev) =>
            prev.map((t) => {
              const content = loaded[t.id];
              return content ? { ...t, content } : t;
            })
          );
        } else {
          console.info('[DataContext] R2 not configured, skipping template hydration');
        }
      } catch (e) {
        console.error('Failed to load templates from storage:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);


  const addField = useCallback((field: Omit<FormField, 'id' | 'order'>) => {
    const newField: FormField = {
      ...field,
      id: crypto.randomUUID(),
      order: fields.length + 1,
    };
    setFields((prev) => [...prev, newField]);
  }, [fields.length]);

  const updateField = useCallback((id: string, fieldData: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...fieldData } : f))
    );
  }, []);

  const deleteField = useCallback((id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addSubmission = useCallback((submission: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSubmission: Submission = {
      ...submission,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSubmissions((prev) => [...prev, newSubmission]);
  }, []);

  const updateSubmission = useCallback((id: string, data: Partial<Submission>) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...data, updatedAt: new Date() } : s
      )
    );
  }, []);

  const updateSubmissionStatus = useCallback((id: string, status: DocumentStatus, feedback?: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status, adminFeedback: feedback, updatedAt: new Date() }
          : s
      )
    );
  }, []);

  const deleteSubmission = useCallback((id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSubmissionsByRespondent = useCallback((respondentId: string) => {
    return submissions.filter((s) => s.respondentId === respondentId);
  }, [submissions]);

  const addTemplate = useCallback((template: Omit<DocumentTemplate, 'id' | 'lastUpdated'>) => {
    const newTemplate: DocumentTemplate = {
      ...template,
      id: crypto.randomUUID(),
      lastUpdated: new Date()
    };
    setTemplates((prev) => [...prev, newTemplate]);
  }, []);

  const updateTemplate = useCallback(async (id: string, content: string) => {
    let format: DocumentTemplate['format'] | null = null;

    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        format = t.format;
        return { ...t, content, lastUpdated: new Date() };
      })
    );

    if (!format) {
      throw new Error('Template tidak ditemukan');
    }

    await templateStorage.saveTemplateContent({ templateId: id, format, content });
  }, []);

  const updateTemplateMeta = useCallback((id: string, updates: Partial<DocumentTemplate>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, lastUpdated: new Date() } : t))
    );
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addErrorReport = useCallback((report: Omit<DocumentErrorReport, 'id' | 'createdAt' | 'status'>) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === report.submissionId
          ? {
            ...s,
            errorReports: [
              ...(s.errorReports || []),
              {
                ...report,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                status: 'pending' as const,
              },
            ],
            updatedAt: new Date(),
          }
          : s
      )
    );
  }, []);

  const resolveErrorReport = useCallback((submissionId: string, reportId: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
            ...s,
            errorReports: s.errorReports?.filter((r) => r.id !== reportId) || [],
            updatedAt: new Date(),
          }
          : s
      )
    );
  }, []);

  const getErrorReports = useCallback((submissionId: string) => {
    const submission = submissions.find((s) => s.id === submissionId);
    return submission?.errorReports || [];
  }, [submissions]);

  const addAdendum = useCallback((submissionId: string, adendum: Omit<AdendumDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
            ...s,
            adendumDocuments: [
              ...(s.adendumDocuments || []),
              {
                ...adendum,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            updatedAt: new Date(),
          }
          : s
      )
    );
  }, []);

  const updateAdendum = useCallback((submissionId: string, adendumId: string, content: Record<string, string>) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
            ...s,
            adendumDocuments: s.adendumDocuments?.map((a) =>
              a.id === adendumId ? { ...a, content, updatedAt: new Date() } : a
            ) || [],
            updatedAt: new Date(),
          }
          : s
      )
    );
  }, []);

  // Access request functions
  const addAccessRequest = useCallback((request: Omit<AccessRequest, 'id' | 'requestDate' | 'status'>) => {
    const newRequest: AccessRequest = {
      ...request,
      id: crypto.randomUUID(),
      requestDate: new Date(),
      status: 'pending',
    };
    setAccessRequests((prev) => [...prev, newRequest]);
  }, []);

  const updateAccessRequest = useCallback((id: string, data: Partial<AccessRequest>) => {
    setAccessRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...data } : r))
    );
  }, []);

  const getAccessRequestByEmail = useCallback((email: string) => {
    return accessRequests.find((r) => r.email === email);
  }, [accessRequests]);

  // Contract Draft functions
  const addContractDraft = useCallback((draft: Omit<ContractDraft, 'id' | 'lastUpdated'>) => {
    const newDraft: ContractDraft = {
      ...draft,
      id: crypto.randomUUID(),
      lastUpdated: new Date(),
    };
    setContractDrafts((prev) => [...prev, newDraft]);
  }, []);

  const updateContractDraft = useCallback((id: string, data: Partial<ContractDraft>) => {
    setContractDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data, lastUpdated: new Date() } : d))
    );
  }, []);

  const deleteContractDraft = useCallback((id: string) => {
    setContractDrafts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const value: DataContextType = {
    fields,
    submissions,
    templates,
    accessRequests,
    addField,
    updateField,
    deleteField,
    addSubmission,
    updateSubmission,
    updateSubmissionStatus,
    deleteSubmission,
    getSubmissionsByRespondent,
    addTemplate,
    updateTemplate,
    updateTemplateMeta,
    removeTemplate,
    addErrorReport,
    resolveErrorReport,
    getErrorReports,
    addAdendum,
    updateAdendum,
    addAccessRequest,
    updateAccessRequest,
    getAccessRequestByEmail,
    contractDrafts,
    addContractDraft,
    updateContractDraft,
    deleteContractDraft,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
