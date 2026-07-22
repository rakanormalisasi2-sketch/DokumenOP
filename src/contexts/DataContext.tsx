import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { FormField, Submission, DocumentTemplate, DocumentType, DocumentStatus, DocumentErrorReport, AdendumDocument, AccessRequest, ContractDraft } from '@/types';
import { templateStorage } from '@/lib/templateStorage';
import { r2Storage } from '@/integrations/r2/client';
import { CONTRACT_FORMATS } from '@/lib/contractFormats';
import { supabase } from '@/integrations/supabase/client';

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
        } else {
          // Auto-seed Supabase if empty (first run)
          const insertFields = initialFields.map(f => ({
            id: f.id, name: f.name, label: f.label, type: f.type, placeholder: f.placeholder,
            options: f.options, required: f.required, item_order: f.order,
            visible_to: f.visibleTo, filled_by: f.filledBy, phase: f.phase,
            show_in: f.showIn, show_in_admin: f.showInAdmin, linked_field_id: f.linkedFieldId,
            terbilang_format: f.terbilangFormat, date_addition_days: f.dateAdditionDays
          }));
          await supabase.from('app_fields').insert(insertFields);
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
            contractFile: s.contract_file
          })) as Submission[];
          setSubmissions(parsed);
        }

        if (requestsRes.data) {
          const parsed = requestsRes.data.map((r: any) => ({
            ...r,
            requestDate: new Date(r.request_date),
            approvedAt: r.approved_at ? new Date(r.approved_at) : undefined,
            approvedBy: r.approved_by
          })) as AccessRequest[];
          setAccessRequests(parsed);
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

    // Supabase Realtime Subscriptions — each table only refetches itself
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_fields' }, fetchFields)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, fetchSubmissions)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_templates' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contract_drafts' }, fetchDrafts)
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
    
    // Optimistic Update
    setFields((prev) => [...prev, newField]);

    // DB Update
    try {
      await supabase.from('app_fields').insert({
        id, name: field.name, label: field.label, type: field.type, placeholder: field.placeholder,
        options: field.options, required: field.required, item_order: order,
        visible_to: field.visibleTo, filled_by: field.filledBy, phase: field.phase,
        show_in: field.showIn, show_in_admin: field.showInAdmin, linked_field_id: field.linkedFieldId,
        terbilang_format: field.terbilangFormat, date_addition_days: field.dateAdditionDays
      });
    } catch (e) {
      console.error(e);
    }
  }, [fields.length]);

  const updateField = useCallback(async (id: string, fieldData: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...fieldData } : f)));
    
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
      await supabase.from('app_fields').update(updates).eq('id', id);
    }
  }, []);

  const deleteField = useCallback(async (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    await supabase.from('app_fields').delete().eq('id', id);
  }, []);

  const addSubmission = useCallback(async (submission: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = crypto.randomUUID();
    const newSubmission: Submission = {
      ...submission, id, createdAt: new Date(), updatedAt: new Date(),
    };
    setSubmissions((prev) => [...prev, newSubmission]);

    await supabase.from('submissions').insert({
      id, respondent_id: submission.respondentId, respondent_name: submission.respondentName,
      submission_phase: submission.submissionPhase, status: submission.status,
      data: submission.data, document_type: submission.documentType, work_category: submission.workCategory,
      kak_type: submission.kakType, durasi_pelaksanaan: submission.durasiPelaksanaan,
      company_profile: submission.companyProfile, contract_file: submission.contractFile,
      created_at: newSubmission.createdAt.toISOString(), updated_at: newSubmission.updatedAt.toISOString()
    });
  }, []);

  const updateSubmission = useCallback(async (id: string, data: Partial<Submission>) => {
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, ...data, updatedAt: new Date() } : s));
    
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

    await supabase.from('submissions').update(updates).eq('id', id);
  }, []);

  const updateSubmissionStatus = useCallback((id: string, status: DocumentStatus, feedback?: string) => {
    updateSubmission(id, { status, adminFeedback: feedback });
  }, [updateSubmission]);

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
    await supabase.from('access_requests').insert({
      id, name: request.name, email: request.email, status: 'pending', request_date: newRequest.requestDate.toISOString()
    });
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
    addField, updateField, deleteField,
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
