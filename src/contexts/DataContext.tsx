import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { FormField, Submission, DocumentTemplate, DocumentType, DocumentStatus, DocumentErrorReport, AdendumDocument, AccessRequest, ContractDraft } from '@/types';
import { templateStorage } from '@/lib/templateStorage';
import { r2Storage } from '@/integrations/r2/client';
import { CONTRACT_FORMATS } from '@/lib/contractFormats';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataContextType {
  fields: FormField[];
  submissions: Submission[];
  templates: DocumentTemplate[];
  accessRequests: AccessRequest[];
  contractDrafts: ContractDraft[];

  addField: (field: Omit<FormField, 'id' | 'order'>) => void;
  updateField: (id: string, field: Partial<FormField>) => void;
  updateFieldOrder: (id1: string, order1: number, id2: string, order2: number) => void;
  reorderFields: (newOrderedList: FormField[]) => void;
  deleteField: (id: string) => void;
  addSubmission: (submission: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSubmission: (id: string, data: Partial<Submission>) => void;
  updateSubmissionStatus: (id: string, status: DocumentStatus, feedback?: string, phase?: 'persiapan' | 'pelaksanaan' | 'general') => void;
  deleteSubmission: (id: string) => void;
  getSubmissionsByRespondent: (respondentId: string) => Submission[];
  addTemplate: (template: Omit<DocumentTemplate, 'id' | 'lastUpdated'>) => void;
  updateTemplate: (id: string, content: string) => Promise<void>;
  updateTemplateMeta: (id: string, updates: Partial<DocumentTemplate>) => void;
  removeTemplate: (id: string) => void;
  addErrorReport: (report: Omit<DocumentErrorReport, 'id' | 'createdAt' | 'status'>) => void;
  resolveErrorReport: (submissionId: string, reportId: string) => void;
  getErrorReports: (submissionId: string) => DocumentErrorReport[];
  addAdendum: (submissionId: string, adendum: Omit<AdendumDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAdendum: (submissionId: string, adendumId: string, content: Record<string, string>) => void;
  addAccessRequest: (request: Omit<AccessRequest, 'id' | 'requestDate' | 'status'>) => void;
  updateAccessRequest: (id: string, data: Partial<AccessRequest>) => void;
  getAccessRequestByEmail: (email: string) => AccessRequest | undefined;
  addContractDraft: (draft: Omit<ContractDraft, 'id' | 'lastUpdated'>) => void;
  updateContractDraft: (id: string, data: Partial<ContractDraft>) => void;
  deleteContractDraft: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Legacy Defaults
const initialFields: FormField[] = [
  { id: '1', name: 'nama_pekerjaan', label: 'nama pekerjaan', type: 'text', required: true, order: 1, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '2', name: 'nama_perusahaan', label: 'nama perusahaan', type: 'text', required: true, order: 2, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '3', name: 'nama_pejabat_perusahaan', label: 'nama pejabat perusahaan', type: 'text', required: true, order: 3, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '4', name: 'jabatan_penanggung_jawab', label: 'jabatan penanggung jawab', type: 'text', required: true, order: 4, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '5', name: 'no_spk', label: 'No SPK(Kontrak)', type: 'text', required: true, order: 5, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '6', name: 'tanggal_spk', label: 'Tanggal SPK', type: 'date', required: true, order: 6, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '7', name: 'no_adendum_1', label: 'No Adendum 1', type: 'text', required: false, order: 7, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '8', name: 'tanggal_adendum_1', label: 'Tanggal Adendum 1', type: 'date', required: false, order: 8, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '9', name: 'no_adendum_2', label: 'No Adendum 2', type: 'text', required: false, order: 9, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '10', name: 'tanggal_adendum_2', label: 'Tanggal Adendum 2', type: 'date', required: false, order: 10, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '11', name: 'nilai_kontrak', label: 'Nilai Kontrak', type: 'number', required: true, order: 11, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '12', name: 'no_spmk', label: 'NO SPMK', type: 'text', required: true, order: 12, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '13', name: 'tanggal_spmk', label: 'Tanggal SPMK', type: 'date', required: true, order: 13, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '14', name: 'alamat_perusahaan', label: 'Alamat Perusahaan', type: 'textarea', required: true, order: 14, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '15', name: 'masa_pelaksanaan', label: 'Masa Pelaksanaan (hari)', type: 'number', required: true, order: 15, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '16', name: 'tanggal_selesai', label: 'Tanggal Selesai', type: 'date', required: true, order: 16, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '17', name: 'pelaksanaan_penyebutan', label: 'Pelaksanaan (penyebutan)', type: 'text', required: true, order: 17, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '18', name: 'no_surat_permohonan_pemeriksaan', label: 'No Surat Permohonan Pemeriksaan penyedia', type: 'text', required: true, order: 18, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '19', name: 'tanggal_surat_permohonan', label: 'Tanggal surat permohonan pemeriksaan pekerjaan', type: 'date', required: true, order: 19, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '20', name: 'no_surat_perintah_pemeriksaan', label: 'No Surat Perintah Pemeriksaan Pekerjaan (PPK)', type: 'text', required: true, order: 20, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '21', name: 'tanggal_surat_perintah', label: 'Tanggal Surat Perintah Pemeriksaan Pekerjaan (PPK)', type: 'date', required: true, order: 21, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '22', name: 'nama_perusahaan_konsultan', label: 'Nama Perusahaan Konsultan', type: 'text', required: true, order: 22, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '23', name: 'nama_pejabat_konsultan', label: 'nama pejabat perusahaan konsultan', type: 'text', required: true, order: 23, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '24', name: 'jabatan_pejabat_konsultan', label: 'jabatan pejabatan perusahaan konsultan', type: 'text', required: true, order: 24, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '25', name: 'alamat_konsultan', label: 'alamat konsultan', type: 'textarea', required: true, order: 25, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '26', name: 'no_surat_baphp', label: 'No surat BAPHP', type: 'text', required: true, order: 26, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '27', name: 'tanggal_baphp', label: 'Tanggal BAPHP', type: 'date', required: true, order: 27, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '28', name: 'ejaan_tanggal_baphp', label: 'Ejaan Tanggal BAPHP', type: 'text', required: false, order: 28, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '29', name: 'no_bast', label: 'NO BAST', type: 'text', required: true, order: 29, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '30', name: 'tanggal_bast', label: 'Tanggal BAST', type: 'date', required: true, order: 30, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] },
  { id: '31', name: 'ejaan_tanggal_bast', label: 'Ejaan Tanggal BAST', type: 'text', required: false, order: 31, visibleTo: 'both', filledBy: 'respondent', phase: 'pelaksanaan', showIn: ['awal', 'akhir'] }
];

const defaultTemplates: DocumentTemplate[] = [
  { id: '1', name: 'Template KAK Perencanaan', type: 'kak_perencanaan', phase: 'persiapan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '2', name: 'Template KAK Konsultansi', type: 'kak_konsultansi', phase: 'persiapan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: 'nd_1', name: 'Template Nota Dinas', type: 'nota_dinas', phase: 'persiapan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '3', name: 'Template Surat Perintah (Fisik)', type: 'surat_perintah_fisik', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '4', name: 'Template Surat Perintah (Konsultansi)', type: 'surat_perintah_konsultansi', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '5', name: 'Template BAPHP (Fisik)', type: 'baphp_fisik', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '6', name: 'Template BAPHP (Konsultansi)', type: 'baphp_konsultansi', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '7', name: 'Template BAST (Fisik)', type: 'bast_fisik', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '8', name: 'Template BAST (Konsultansi)', type: 'bast_konsultansi', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'docx', lastUpdated: new Date() },
  { id: '9', name: 'Template Lampiran BAPHP', type: 'lampiran_baphp', category: 'pelaksanaan', phase: 'pelaksanaan', content: '', format: 'xlsx', lastUpdated: new Date() },
  ...CONTRACT_FORMATS.flatMap(category =>
    category.items.flatMap(item =>
      item.types.map(type => ({
        id: type.template, name: type.label, type: type.id, phase: 'persiapan' as const, content: '', format: 'docx' as const, lastUpdated: new Date()
      }))
    )
  )
];

const sampleSubmissions: Submission[] = [];

// LocalStorage cache for instant load (Optimistic UI performance trick)
const safeLocalStorageGet = <T,>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage`, e);
  }
  return defaultVal;
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [fields, setFields] = useState<FormField[]>(() => safeLocalStorageGet('pusdaop_fields', initialFields));
  const [submissions, setSubmissions] = useState<Submission[]>(() => safeLocalStorageGet('pusdaop_submissions', sampleSubmissions));
  const [templates, setTemplates] = useState<DocumentTemplate[]>(() => safeLocalStorageGet('pusdaop_templates', defaultTemplates));
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(() => safeLocalStorageGet('pusdaop_accessRequests', []));
  const [contractDrafts, setContractDrafts] = useState<ContractDraft[]>(() => safeLocalStorageGet('pusdaop_contractDrafts', []));

  // 1. Supabase Fetch/Hydration
  // Request deduplication — prevent parallel fetches from the same client
  let fetchInProgress = false;

  useEffect(() => {
    let isMounted = true;
    // Abort controller for timeout protection (prevents hanging requests)
    let abortController = new AbortController();
    const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

    const withTimeout = <T,>(promise: Promise<T>): Promise<T> => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), FETCH_TIMEOUT_MS)
      );
      return Promise.race([promise, timeout]);
    };

    const fetchAllData = async () => {
      if (fetchInProgress) return; // Deduplicate concurrent calls
      fetchInProgress = true;
      try {
        const [fieldsRes, submissionsRes, templatesRes, requestsRes, draftsRes] = await Promise.all([
          supabase.from('app_fields').select('*').order('item_order'),
          supabase.from('submissions').select('*'),
          supabase.from('document_templates').select('*'),
          supabase.from('access_requests').select('*'),
          supabase.from('contract_drafts').select('*')
        ]);

        if (!isMounted) return;
        if (fieldsRes.data && fieldsRes.data.length > 0) {
          const parsedFields = fieldsRes.data.map((f: any) => ({
            ...f,
            order: f.item_order,
            visibleTo: f.visible_to,
            filledBy: f.filled_by,
            showIn: f.show_in || [],
            showInAdmin: f.show_in_admin || [],
            linkedFieldId: f.linked_field_id,
            terbilangFormat: f.terbilang_format,
            dateAdditionDays: f.date_addition_days
          })) as FormField[];
          setFields(parsedFields);
        } else if (fieldsRes.data && fieldsRes.data.length === 0) {
          // ONLY seed if the table is completely empty — NEVER delete existing data
          console.log('[DataContext] app_fields is empty, seeding default 31 fields...');
          const insertFields = initialFields.map(f => ({
            id: f.id, name: f.name, label: f.label, type: f.type, placeholder: f.placeholder,
            options: f.options, required: f.required, item_order: f.order, visible_to: f.visibleTo,
            filled_by: f.filledBy, phase: f.phase, show_in: f.showIn, show_in_admin: f.showInAdmin,
            linked_field_id: f.linkedFieldId, terbilang_format: f.terbilangFormat,
            date_addition_days: f.dateAdditionDays
          }));
          const { error: insertErr } = await supabase.from('app_fields').insert(insertFields);
          if (insertErr) {
            console.error('[DataContext] Failed to seed fields:', insertErr);
          }
          setFields(initialFields);
        } else if (fieldsRes.error) {
          console.error('[DataContext] Failed to fetch fields:', fieldsRes.error);
          // Keep localStorage cache as fallback
        }

        if (templatesRes.data && templatesRes.data.length > 0) {
          const parsedTemplates = templatesRes.data.map((t: any) => ({
            ...t,
            lastUpdated: new Date(t.last_updated),
            content: '' // content is in R2
          })) as DocumentTemplate[];
          setTemplates(parsedTemplates);
        } else {
          const insertTemplates = defaultTemplates.map(t => ({
            id: t.id, name: t.name, type: t.type, category: t.category, phase: t.phase,
            format: t.format, last_updated: t.lastUpdated.toISOString()
          }));
          await supabase.from('document_templates').insert(insertTemplates);
        }

        if (submissionsRes.data) {
          const parsed = submissionsRes.data.map((s: any) => ({
            ...s,
            respondentId: s.respondent_id,
            respondentName: s.respondent_name,
            submissionPhase: s.submission_phase,
            documentType: s.document_type,
            workCategory: s.work_category,
            adminFeedback: s.admin_feedback,
            documentDate: s.document_date,
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.updated_at),
            kakType: s.kak_type,
            workforceRequirements: s.workforce_requirements,
            schedulePhases: s.schedule_phases,
            durasiPelaksanaan: s.durasi_pelaksanaan,
            lampiranBaphpItems: s.lampiran_baphp_items,
            adendumDocuments: s.adendum_documents,
            errorReports: s.error_reports,
            documentDates: s.document_dates,
            companyProfile: s.company_profile,
            contractFile: s.contract_file,
            statusPersiapan: s.data?._status_persiapan || s.status || 'draft',
            statusPelaksanaan: s.data?._status_pelaksanaan || s.status || 'draft'
          })) as Submission[];
          setSubmissions(parsed);
        }

        if (requestsRes.data) {
          console.log('[DataContext] access_requests fetched:', requestsRes.data.length, 'rows');
          const parsed = requestsRes.data.map((r: any) => ({
            ...r,
            requestDate: new Date(r.request_date),
            approvedAt: r.approved_at ? new Date(r.approved_at) : undefined,
            approvedBy: r.approved_by
          })) as AccessRequest[];
          setAccessRequests(parsed);
        }
        if (requestsRes.error) {
          console.error('[DataContext] access_requests fetch error:', requestsRes.error);
        }

        if (draftsRes.data) {
          const parsed = draftsRes.data.map((d: any) => ({
            ...d,
            lastUpdated: new Date(d.last_updated)
          })) as ContractDraft[];
          setContractDrafts(parsed);
        }

        // Hydrate R2 contents AFTER Supabase metadata is loaded
        if (r2Storage.isConfigured() && templatesRes.data) {
           const parsedTemplates = templatesRes.data.map((t: any) => ({
            ...t,
            lastUpdated: new Date(t.last_updated),
            content: ''
          })) as DocumentTemplate[];
          const loaded = await templateStorage.loadAllTemplateContents(parsedTemplates);
          if (!isMounted) return;
          setTemplates((prev) =>
            prev.map((t) => {
              const content = loaded[t.id];
              return content ? { ...t, content } : t;
            })
          );
        }

      } catch (err) {
        console.error("Supabase initial fetch failed:", err);
      } finally {
        fetchInProgress = false;
      }
    };

    fetchAllData();

    // Targeted fetch functions — only refetch the changed table
    const fetchFields = async () => {
      if (!isMounted) return;
      const { data } = await supabase.from('app_fields').select('*').order('item_order');
      if (data && isMounted) {
        setFields(data.map((f: any) => ({
          ...f, order: f.item_order, visibleTo: f.visible_to, filledBy: f.filled_by,
          showIn: f.show_in || [], showInAdmin: f.show_in_admin || [],
          linkedFieldId: f.linked_field_id, terbilangFormat: f.terbilang_format,
          dateAdditionDays: f.date_addition_days
        })) as FormField[]);
      }
    };

    const fetchSubmissions = async () => {
      if (!isMounted) return;
      const { data } = await supabase.from('submissions').select('*');
      if (data && isMounted) {
        setSubmissions(data.map((s: any) => ({
          ...s, respondentId: s.respondent_id, respondentName: s.respondent_name,
          submissionPhase: s.submission_phase, documentType: s.document_type,
          statusPersiapan: s.data?._status_persiapan || s.status || 'draft',
          statusPelaksanaan: s.data?._status_pelaksanaan || s.status || 'draft',
          workCategory: s.work_category, adminFeedback: s.admin_feedback,
          documentDate: s.document_date, createdAt: new Date(s.created_at),
          updatedAt: new Date(s.updated_at), kakType: s.kak_type,
          workforceRequirements: s.workforce_requirements, schedulePhases: s.schedule_phases,
          durasiPelaksanaan: s.durasi_pelaksanaan, lampiranBaphpItems: s.lampiran_baphp_items,
          adendumDocuments: s.adendum_documents, errorReports: s.error_reports,
          documentDates: s.document_dates, companyProfile: s.company_profile,
          contractFile: s.contract_file
        })) as Submission[]);
      }
    };

    const fetchDrafts = async () => {
      if (!isMounted) return;
      const { data } = await supabase.from('contract_drafts').select('*');
      if (data && isMounted) {
        setContractDrafts(data.map((d: any) => ({
          ...d, lastUpdated: new Date(d.last_updated)
        })) as ContractDraft[]);
      }
    };

    const fetchAccessRequests = async () => {
      if (!isMounted) return;
      const { data, error } = await supabase.from('access_requests').select('*');
      if (error) {
        console.error('[DataContext] realtime access_requests fetch error:', error);
        return;
      }
      if (data && isMounted) {
        setAccessRequests(data.map((r: any) => ({
          ...r,
          requestDate: new Date(r.request_date),
          approvedAt: r.approved_at ? new Date(r.approved_at) : undefined,
          approvedBy: r.approved_by
        })) as AccessRequest[]);
      }
    };

    // Supabase Realtime Subscriptions — each table only refetches itself
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_fields' }, fetchFields)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, fetchSubmissions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_templates' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contract_drafts' }, fetchDrafts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'access_requests' }, fetchAccessRequests)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []); // Only run once on mount

  // Sync to LocalStorage (as cache for instant loading)
  useEffect(() => { localStorage.setItem('pusdaop_fields', JSON.stringify(fields)); }, [fields]);
  useEffect(() => { localStorage.setItem('pusdaop_submissions', JSON.stringify(submissions)); }, [submissions]);
  useEffect(() => { 
    const meta = templates.map(({ content, ...rest }) => ({ ...rest, content: '' }));
    localStorage.setItem('pusdaop_templates', JSON.stringify(meta)); 
  }, [templates]);
  useEffect(() => { localStorage.setItem('pusdaop_accessRequests', JSON.stringify(accessRequests)); }, [accessRequests]);
  useEffect(() => { localStorage.setItem('pusdaop_contractDrafts', JSON.stringify(contractDrafts)); }, [contractDrafts]);

  // MUTATORS (Optimistic UI + Supabase integration)

  const addField = useCallback(async (field: Omit<FormField, 'id' | 'order'>) => {
    const id = crypto.randomUUID();
    const order = fields.length + 1;
    const newField: FormField = { ...field, id, order };
    
    // Backup state for rollback
    setFields((prev) => {
      const next = [...prev, newField];
      
      // We run the async DB update immediately
      supabase.from('app_fields').insert({
        id, name: field.name, label: field.label, type: field.type, placeholder: field.placeholder,
        options: field.options, required: field.required, item_order: order,
        visible_to: field.visibleTo, filled_by: field.filledBy, phase: field.phase,
        show_in: field.showIn, show_in_admin: field.showInAdmin, linked_field_id: field.linkedFieldId,
        terbilang_format: field.terbilangFormat, date_addition_days: field.dateAdditionDays
      }).then(({ error }) => {
        if (error) {
          console.error('Insert Field Error:', error);
          toast.error(`Gagal menyimpan field: ${error.message}`);
          // Rollback
          setFields(prev);
        } else {
          toast.success('Field berhasil ditambahkan');
        }
      });
      
      return next; // Optimistic return
    });
  }, [fields.length]);

  const updateField = useCallback(async (id: string, fieldData: Partial<FormField>) => {
    setFields((prev) => {
      const original = prev;
      const next = prev.map((f) => (f.id === id ? { ...f, ...fieldData } : f));
      
      const updates: any = {};
      if (fieldData.name !== undefined) updates.name = fieldData.name;
      if (fieldData.label !== undefined) updates.label = fieldData.label;
      if (fieldData.type !== undefined) updates.type = fieldData.type;
      if (fieldData.placeholder !== undefined) updates.placeholder = fieldData.placeholder;
      if (fieldData.options !== undefined) updates.options = fieldData.options;
      if (fieldData.required !== undefined) updates.required = fieldData.required;
      if (fieldData.order !== undefined) updates.item_order = fieldData.order;
      if (fieldData.visibleTo !== undefined) updates.visible_to = fieldData.visibleTo;
      if (fieldData.filledBy !== undefined) updates.filled_by = fieldData.filledBy;
      if (fieldData.phase !== undefined) updates.phase = fieldData.phase;
      if (fieldData.showIn !== undefined) updates.show_in = fieldData.showIn;
      if (fieldData.showInAdmin !== undefined) updates.show_in_admin = fieldData.showInAdmin;
      if (fieldData.linkedFieldId !== undefined) updates.linked_field_id = fieldData.linkedFieldId;
      if (fieldData.terbilangFormat !== undefined) updates.terbilang_format = fieldData.terbilangFormat;
      if (fieldData.dateAdditionDays !== undefined) updates.date_addition_days = fieldData.dateAdditionDays;

      if (Object.keys(updates).length > 0) {
        supabase.from('app_fields').update(updates).eq('id', id).then(({ error }) => {
          if (error) {
            console.error('Update Field Error:', error);
            toast.error(`Gagal memperbarui field: ${error.message}`);
            // Rollback
            setFields(original);
          } else {
            toast.success('Field berhasil diperbarui');
          }
        });
      }
      return next;
    });
  }, []);

  const updateFieldOrder = useCallback(async (id1: string, order1: number, id2: string, order2: number) => {
    setFields((prev) => {
      const original = prev;
      const next = prev.map(f => {
        if (f.id === id1) return { ...f, order: order1 };
        if (f.id === id2) return { ...f, order: order2 };
        return f;
      }).sort((a, b) => a.order - b.order); // Keep it sorted locally

      Promise.all([
        supabase.from('app_fields').update({ item_order: order1 }).eq('id', id1),
        supabase.from('app_fields').update({ item_order: order2 }).eq('id', id2)
      ]).then((results) => {
        const error = results.find(r => r.error)?.error;
        if (error) {
          console.error('Update Field Order Error:', error);
          toast.error(`Gagal merubah urutan: ${error.message}`);
          setFields(original);
        }
      });
      return next;
    });
  }, []);

  const reorderFields = useCallback(async (reorderedFields: FormField[]) => {
    setFields((prev) => {
      const original = prev;
      const newOrders = new Map(reorderedFields.map((f, i) => [f.id, i + 1]));
      
      const next = prev.map(f => {
        if (newOrders.has(f.id)) {
          return { ...f, order: newOrders.get(f.id)! };
        }
        return f;
      }).sort((a, b) => a.order - b.order);

      const updates = reorderedFields.map((f, i) => 
        supabase.from('app_fields').update({ item_order: i + 1 }).eq('id', f.id)
      );

      Promise.all(updates).then(results => {
        const error = results.find(r => r.error)?.error;
        if (error) {
           console.error('Reorder Fields Error:', error);
           toast.error('Gagal menyimpan urutan baru');
           setFields(original);
        }
      });
      
      return next;
    });
  }, []);

  const deleteField = useCallback(async (id: string) => {
    setFields((prev) => {
      const original = prev;
      const next = prev.filter((f) => f.id !== id);
      
      supabase.from('app_fields').delete().eq('id', id).then(({ error }) => {
        if (error) {
          console.error('Delete Field Error:', error);
          toast.error(`Gagal menghapus field: ${error.message}`);
          // Rollback
          setFields(original);
        } else {
          toast.success('Field berhasil dihapus');
        }
      });
      return next;
    });
  }, []);

  const addSubmission = useCallback(async (submission: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = crypto.randomUUID();
    
    // Ensure the data has the internal statuses for unified project flow
    const dataWithStatuses = {
      ...submission.data,
      _status_persiapan: submission.data?._status_persiapan || 'draft',
      _status_pelaksanaan: submission.data?._status_pelaksanaan || 'draft'
    };

    const newSubmission: Submission = {
      ...submission,
      id,
      data: dataWithStatuses,
      statusPersiapan: dataWithStatuses._status_persiapan,
      statusPelaksanaan: dataWithStatuses._status_pelaksanaan,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSubmissions((prev) => [...prev, newSubmission]);

    const { error: insertError } = await supabase.from('submissions').insert({
      id, respondent_id: submission.respondentId, respondent_name: submission.respondentName,
      submission_phase: submission.submissionPhase, status: submission.status,
      data: dataWithStatuses, document_type: submission.documentType, work_category: submission.workCategory,
      kak_type: submission.kakType, durasi_pelaksanaan: submission.durasiPelaksanaan,
      company_profile: submission.companyProfile, contract_file: submission.contractFile,
      created_at: newSubmission.createdAt.toISOString(), updated_at: newSubmission.updatedAt.toISOString()
    });

    if (insertError) {
      console.error('[DataContext] addSubmission FAILED:', insertError);
      toast.error(`Gagal menyimpan ke database: ${insertError.message}. Periksa koneksi atau hubungi admin.`);
    } else {
      console.log('[DataContext] addSubmission SUCCESS, id:', id);
    }

    return id;
  }, []);

  const updateSubmission = useCallback(async (id: string, data: Partial<Submission>) => {
    setSubmissions((prev) => prev.map((s) => {
      if (s.id === id) {
        // Automatically sync virtual statuses if data changes
        const statusPersiapan = data.data?._status_persiapan || s.data?._status_persiapan || 'draft';
        const statusPelaksanaan = data.data?._status_pelaksanaan || s.data?._status_pelaksanaan || 'draft';
        return { 
          ...s, 
          ...data,
          statusPersiapan,
          statusPelaksanaan,
          updatedAt: new Date() 
        };
      }
      return s;
    }));
    
    const updates: any = { updated_at: new Date().toISOString() };
    if (data.status !== undefined) updates.status = data.status;
    if (data.data !== undefined) updates.data = data.data;
    if (data.adminFeedback !== undefined) updates.admin_feedback = data.adminFeedback;
    if (data.contractFile !== undefined) updates.contract_file = data.contractFile;
    if (data.errorReports !== undefined) updates.error_reports = data.errorReports;
    if (data.adendumDocuments !== undefined) updates.adendum_documents = data.adendumDocuments;
    if (data.workforceRequirements !== undefined) updates.workforce_requirements = data.workforceRequirements;
    if (data.schedulePhases !== undefined) updates.schedule_phases = data.schedulePhases;
    if (data.lampiranBaphpItems !== undefined) updates.lampiran_baphp_items = data.lampiranBaphpItems;
    if (data.documentDates !== undefined) updates.document_dates = data.documentDates;
    if (data.companyProfile !== undefined) updates.company_profile = data.companyProfile;
    if (data.workCategory !== undefined) updates.work_category = data.workCategory;
    if (data.kakType !== undefined) updates.kak_type = data.kakType;
    if (data.durasiPelaksanaan !== undefined) updates.durasi_pelaksanaan = data.durasiPelaksanaan;

    // Sync statusPersiapan/statusPelaksanaan into data JSON for persistence
    if (data.statusPersiapan !== undefined && !data.data) {
      const currentSub = submissions.find(s => s.id === id);
      if (currentSub) {
        updates.data = { ...currentSub.data, _status_persiapan: data.statusPersiapan };
      }
    }
    if (data.statusPelaksanaan !== undefined && !data.data) {
      const currentSub = submissions.find(s => s.id === id);
      if (currentSub) {
        updates.data = { ...(updates.data || currentSub.data), _status_pelaksanaan: data.statusPelaksanaan };
      }
    }

    const { error: updateError } = await supabase.from('submissions').update(updates).eq('id', id);
    if (updateError) {
      console.error('[DataContext] updateSubmission FAILED:', updateError);
      toast.error(`Gagal memperbarui data: ${updateError.message}. Data mungkin hanya tersimpan lokal.`);
    } else {
      console.log('[DataContext] updateSubmission SUCCESS, id:', id);
    }
  }, [submissions]);

  const updateSubmissionStatus = useCallback(async (
    id: string, 
    status: DocumentStatus, 
    feedback?: string,
    phase: 'persiapan' | 'pelaksanaan' | 'general' = 'general'
  ) => {
    const originalSubmissions = submissions;
    
    setSubmissions((prev) => prev.map((s) => {
      if (s.id === id) {
        const newData = { ...s.data };
        if (phase === 'persiapan') newData._status_persiapan = status;
        if (phase === 'pelaksanaan') newData._status_pelaksanaan = status;

        return { 
          ...s, 
          status: phase === 'general' ? status : s.status, 
          statusPersiapan: phase === 'persiapan' ? status : s.statusPersiapan,
          statusPelaksanaan: phase === 'pelaksanaan' ? status : s.statusPelaksanaan,
          adminFeedback: feedback, 
          data: newData,
          updatedAt: new Date() 
        };
      }
      return s;
    }));

    const updatePayload: any = { admin_feedback: feedback, updated_at: new Date().toISOString() };
    if (phase === 'general') updatePayload.status = status;

    // We also need to get the existing data from the store to update it fully
    const sub = submissions.find(s => s.id === id);
    if (sub && phase !== 'general') {
      const newData = { ...sub.data };
      if (phase === 'persiapan') newData._status_persiapan = status;
      if (phase === 'pelaksanaan') newData._status_pelaksanaan = status;
      updatePayload.data = newData;
    }

    const { error } = await supabase
      .from('submissions')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('Update Submission Status Error:', error);
      toast.error(`Gagal mengupdate status: ${error.message}`);
      setSubmissions(originalSubmissions); // rollback
    }
  }, [submissions]);

  const deleteSubmission = useCallback(async (id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
    await supabase.from('submissions').delete().eq('id', id);
  }, []);

  const getSubmissionsByRespondent = useCallback((respondentId: string) => {
    return submissions.filter((s) => s.respondentId === respondentId);
  }, [submissions]);

  const addTemplate = useCallback(async (template: Omit<DocumentTemplate, 'id' | 'lastUpdated'>) => {
    const id = crypto.randomUUID();
    const newTemplate: DocumentTemplate = { ...template, id, lastUpdated: new Date() };
    setTemplates((prev) => [...prev, newTemplate]);

    await supabase.from('document_templates').insert({
      id, name: template.name, type: template.type, category: template.category,
      phase: template.phase, format: template.format, last_updated: newTemplate.lastUpdated.toISOString()
    });
  }, []);

  const updateTemplate = useCallback(async (id: string, content: string) => {
    const template = templates.find((t) => t.id === id);
    if (!template) throw new Error('Template tidak ditemukan');
    const format = template.format;

    setTemplates((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      return { ...t, content, lastUpdated: new Date() };
    }));

    await templateStorage.saveTemplateContent({ templateId: id, format, content });
    await supabase.from('document_templates').update({ last_updated: new Date().toISOString() }).eq('id', id);
  }, [templates]);

  const updateTemplateMeta = useCallback(async (id: string, updates: Partial<DocumentTemplate>) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates, lastUpdated: new Date() } : t)));
    
    const dbUpdates: any = { last_updated: new Date().toISOString() };
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.phase !== undefined) dbUpdates.phase = updates.phase;
    if (updates.format !== undefined) dbUpdates.format = updates.format;

    await supabase.from('document_templates').update(dbUpdates).eq('id', id);
  }, []);

  const removeTemplate = useCallback(async (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('document_templates').delete().eq('id', id);
  }, []);

  const addErrorReport = useCallback((report: Omit<DocumentErrorReport, 'id' | 'createdAt' | 'status'>) => {
    const submission = submissions.find(s => s.id === report.submissionId);
    if (!submission) return;
    const newReports = [...(submission.errorReports || []), { ...report, id: crypto.randomUUID(), createdAt: new Date(), status: 'pending' as const }];
    updateSubmission(report.submissionId, { errorReports: newReports });
  }, [submissions, updateSubmission]);

  const resolveErrorReport = useCallback((submissionId: string, reportId: string) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;
    const newReports = submission.errorReports?.filter((r) => r.id !== reportId) || [];
    updateSubmission(submissionId, { errorReports: newReports });
  }, [submissions, updateSubmission]);

  const getErrorReports = useCallback((submissionId: string) => {
    const submission = submissions.find((s) => s.id === submissionId);
    return submission?.errorReports || [];
  }, [submissions]);

  const addAdendum = useCallback((submissionId: string, adendum: Omit<AdendumDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;
    const newAdendums = [...(submission.adendumDocuments || []), { ...adendum, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() }];
    updateSubmission(submissionId, { adendumDocuments: newAdendums });
  }, [submissions, updateSubmission]);

  const updateAdendum = useCallback((submissionId: string, adendumId: string, content: Record<string, string>) => {
    const submission = submissions.find(s => s.id === submissionId);
    if (!submission) return;
    const newAdendums = submission.adendumDocuments?.map(a => a.id === adendumId ? { ...a, content, updatedAt: new Date() } : a) || [];
    updateSubmission(submissionId, { adendumDocuments: newAdendums });
  }, [submissions, updateSubmission]);

  const addAccessRequest = useCallback(async (request: Omit<AccessRequest, 'id' | 'requestDate' | 'status'>) => {
    const id = crypto.randomUUID();
    const newRequest: AccessRequest = { ...request, id, requestDate: new Date(), status: 'pending' };
    setAccessRequests((prev) => [...prev, newRequest]);
    const { error } = await supabase.from('access_requests').insert({
      id, name: request.name, email: request.email, status: 'pending', request_date: newRequest.requestDate.toISOString()
    });
    if (error) {
      console.error('[DataContext] addAccessRequest FAILED:', error);
      toast.error(`Gagal menyimpan permintaan akses: ${error.message}`);
    }
  }, []);

  const updateAccessRequest = useCallback(async (id: string, data: Partial<AccessRequest>) => {
    setAccessRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    const updates: any = {};
    if (data.status !== undefined) updates.status = data.status;
    if (data.code !== undefined) updates.code = data.code;
    if (data.approvedAt !== undefined) updates.approved_at = data.approvedAt.toISOString();
    if (data.approvedBy !== undefined) updates.approved_by = data.approvedBy;
    await supabase.from('access_requests').update(updates).eq('id', id);
  }, []);

  const getAccessRequestByEmail = useCallback((email: string) => {
    return accessRequests.find((r) => r.email === email);
  }, [accessRequests]);

  const addContractDraft = useCallback(async (draft: Omit<ContractDraft, 'id' | 'lastUpdated'>) => {
    const id = crypto.randomUUID();
    const newDraft: ContractDraft = { ...draft, id, lastUpdated: new Date() };
    setContractDrafts((prev) => [...prev, newDraft]);
    await supabase.from('contract_drafts').insert({
      id, type: draft.type, data: draft.data, last_updated: newDraft.lastUpdated.toISOString()
    });
  }, []);

  const updateContractDraft = useCallback(async (id: string, data: Partial<ContractDraft>) => {
    setContractDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...data, lastUpdated: new Date() } : d)));
    const updates: any = { last_updated: new Date().toISOString() };
    if (data.type !== undefined) updates.type = data.type;
    if (data.data !== undefined) updates.data = data.data;
    await supabase.from('contract_drafts').update(updates).eq('id', id);
  }, []);

  const deleteContractDraft = useCallback(async (id: string) => {
    setContractDrafts((prev) => prev.filter((d) => d.id !== id));
    await supabase.from('contract_drafts').delete().eq('id', id);
  }, []);

  const value: DataContextType = {
    fields, submissions, templates, accessRequests,
    addField, updateField, updateFieldOrder, reorderFields, deleteField,
    addSubmission, updateSubmission, updateSubmissionStatus, deleteSubmission, getSubmissionsByRespondent,
    addTemplate, updateTemplate, updateTemplateMeta, removeTemplate,
    addErrorReport, resolveErrorReport, getErrorReports,
    addAdendum, updateAdendum,
    addAccessRequest, updateAccessRequest, getAccessRequestByEmail,
    contractDrafts, addContractDraft, updateContractDraft, deleteContractDraft,
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
