import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import RespondentLayout from '@/components/layout/RespondentLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { DocumentType, Submission } from '@/types';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Postcode,
  Filter,
  Eye,
  Printer,
  MessageSquare,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Verified,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import DocumentPreview from '@/components/editors/DocumentPreview';
import DocumentAnnotator from '@/components/submission/DocumentAnnotator';
import { SubmissionStepper } from '@/components/submission/SubmissionStepper';
import { toast } from 'sonner';

export default function RespondentDashboard() {
  const { user } = useAuth();
  const { submissions, templates, fields, addErrorReport } = useData();
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [printSubmission, setPrintSubmission] = useState<Submission | null>(null);
  const [previewType, setPreviewType] = useState<DocumentType | null>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);

  // Filter submissions for current respondent only
  const mySubmissions = useMemo(
    () => submissions.filter((s) => s.respondentId === user?.id),
    [submissions, user?.id]
  );

  // Filter 1 year limit
  const recentSubmissions = useMemo(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return mySubmissions
      .filter((s) => new Date(s.createdAt) >= oneYearAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [mySubmissions]);

  const latestSubmission = useMemo(() => recentSubmissions[0], [recentSubmissions]);

  const stats = useMemo(
    () => ({
      pending: mySubmissions.filter((s) => s.status === 'submitted' || s.status === 'review').length,
      approved: mySubmissions.filter((s) => s.status === 'approved').length,
      revision: mySubmissions.filter((s) => s.status === 'revision').length,
    }),
    [mySubmissions]
  );

  const handlePrintClick = (submission: Submission) => {
    setPrintSubmission(submission);
    setShowPrintDialog(true);
  };

  const handleSelectPrintType = (type: DocumentType) => {
    setPreviewType(type);
    setShowPrintDialog(false);
  };

  const getTemplateForType = (type: DocumentType) => {
    return templates.find((t) => t.type === type);
  };

  return (
    <RespondentLayout>
      {/* Page Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
        <div>
          <h1 className="font-headline-lg text-3xl font-bold text-primary">Dashboard Pengajuan</h1>
          <p className="font-body-md text-base text-on-surface-variant mt-1">Pantau status dan riwayat pengajuan dokumen proyek Anda.</p>
        </div>
        <Link to="/respondent/dokumen-awal" className="self-start sm:self-auto">
          <button className="bg-secondary text-on-secondary font-label-md text-sm px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-on-secondary-fixed-variant transition-colors shadow-sm">
            <FileText className="w-5 h-5" />
            <span>Buat Pengajuan Dokumen Awal</span>
          </button>
        </Link>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Timeline Stepper Widget (Spans 2 columns on large screens) */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col shadow-sm">
          <h3 className="font-title-lg text-lg font-semibold text-primary mb-6">Status Pengajuan Terkini</h3>
          {latestSubmission ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              <div className="flex items-center w-full max-w-2xl mx-auto">
                {/* Step 1: Submitted */}
                <div className="flex flex-col items-center relative flex-1">
                  <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center z-10 border-4 border-surface-container-lowest shadow-sm">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="font-label-md text-sm text-primary mt-3 text-center">Submitted</span>
                </div>
                {/* Connector 1 */}
                <div className={`h-[2px] flex-1 -mx-4 z-0 mb-8 ${latestSubmission.status !== 'submitted' ? 'bg-secondary' : 'bg-surface-variant'}`}></div>
                {/* Step 2: Under Review */}
                <div className="flex flex-col items-center relative flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-surface-container-lowest shadow-sm ${latestSubmission.status === 'review' ? 'bg-secondary-container text-on-secondary-container ring-2 ring-secondary ring-offset-2' : latestSubmission.status === 'approved' ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className={`font-label-md text-sm mt-3 text-center ${latestSubmission.status === 'review' ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>Under Review</span>
                </div>
                {/* Connector 2 */}
                <div className={`h-[2px] flex-1 -mx-4 z-0 mb-8 ${latestSubmission.status === 'approved' ? 'bg-secondary' : 'bg-surface-variant'}`}></div>
                {/* Step 3: Approved */}
                <div className="flex flex-col items-center relative flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-surface-container-lowest shadow-sm ${latestSubmission.status === 'approved' ? 'bg-secondary text-on-secondary' : 'bg-surface-variant text-on-surface-variant'}`}>
                    <Verified className="w-5 h-5" />
                  </div>
                  <span className={`font-label-md text-sm mt-3 text-center ${latestSubmission.status === 'approved' ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>Approved</span>
                </div>
              </div>
              <div className="mt-8 bg-surface-container-low w-full p-4 rounded-lg font-body-sm text-sm text-on-surface-variant border border-outline-variant border-dashed">
                <span className="font-bold text-primary">Proyek: {latestSubmission.data.nama_pekerjaan || 'Tanpa Judul'}</span> - Status: <span className="uppercase">{latestSubmission.status}</span>. Diperbarui pada {format(new Date(latestSubmission.updatedAt), 'dd MMM yyyy HH:mm', { locale: id })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant font-body-sm text-sm p-8">
              Belum ada pengajuan.
            </div>
          )}
        </div>

        {/* Quick Stats / Info Widget */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h3 className="font-title-lg text-lg font-semibold text-primary mb-4">Ringkasan Dokumen</h3>
            <ul className="space-y-4">
              <li className="flex justify-between items-center pb-3 border-b border-surface-variant">
                <span className="font-body-sm text-sm text-on-surface-variant flex items-center gap-2"><Clock className="w-4 h-4" /> Menunggu Review</span>
                <span className="font-label-md text-sm font-bold text-primary bg-surface-container px-2 py-1 rounded min-w-[28px] text-center">{stats.pending}</span>
              </li>
              <li className="flex justify-between items-center pb-3 border-b border-surface-variant">
                <span className="font-body-sm text-sm text-on-surface-variant flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-error" /> Perlu Revisi</span>
                <span className="font-label-md text-sm font-bold text-error bg-error-container/50 px-2 py-1 rounded min-w-[28px] text-center">{stats.revision}</span>
              </li>
              <li className="flex justify-between items-center pb-3 border-b border-surface-variant">
                <span className="font-body-sm text-sm text-on-surface-variant flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> Disetujui</span>
                <span className="font-label-md text-sm font-bold text-secondary bg-secondary-container/30 px-2 py-1 rounded min-w-[28px] text-center">{stats.approved}</span>
              </li>
            </ul>
          </div>
          <Link to="/respondent/history" className="w-full mt-6">
            <button className="w-full border border-outline-variant text-secondary font-label-md text-sm py-2.5 rounded-lg hover:bg-surface-container-low transition-colors">
              Lihat Semua Statistik
            </button>
          </Link>
        </div>
      </div>

      {/* Data Table Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden flex flex-col mt-6 shadow-sm">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h2 className="font-title-lg text-lg font-semibold text-primary">Riwayat Submission</h2>
          <div className="flex space-x-2">
            <button className="p-2 text-on-surface-variant hover:text-secondary rounded-lg border border-outline-variant bg-surface-container-lowest transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="py-3 px-6 font-label-md text-sm text-primary font-bold">Nama Proyek</th>
                <th className="py-3 px-6 font-label-md text-sm text-primary font-bold">Tgl. Pengajuan</th>
                <th className="py-3 px-6 font-label-md text-sm text-primary font-bold">Status</th>
                <th className="py-3 px-6 font-label-md text-sm text-primary font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-sm text-on-surface">
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-on-surface-variant">Belum ada pengajuan.</td>
                </tr>
              ) : (
                recentSubmissions.slice(0, 5).map((submission) => (
                  <tr key={submission.id} className="border-b border-surface-variant hover:bg-surface-bright transition-colors group">
                    <td className="py-4 px-6 font-medium text-primary">{submission.data.nama_pekerjaan || 'Tanpa Judul'}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{format(new Date(submission.createdAt), 'dd MMM yyyy', { locale: id })}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="py-4 px-6 flex justify-end space-x-2">
                      <button 
                        onClick={() => setSelectedSubmission(submission)}
                        className="p-2 text-secondary hover:bg-secondary-container/20 rounded-lg transition-colors border border-transparent"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {submission.status === 'revision' && (
                        <button className="bg-surface-container-lowest border border-outline-variant text-secondary px-4 py-2 rounded-lg font-label-md text-[13px] hover:bg-surface-container-low transition-colors">
                          Lihat Catatan
                        </button>
                      )}
                      {submission.status === 'approved' && (
                        <button 
                          onClick={() => handlePrintClick(submission)}
                          className="bg-secondary text-on-secondary px-4 py-2 rounded-lg font-label-md text-[13px] hover:bg-on-secondary-fixed-variant transition-colors"
                        >
                          Cetak
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.data.nama_pekerjaan}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 py-4">
              <div className="mb-2">
                <SubmissionStepper status={selectedSubmission.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status Pengecekan</span>
                <StatusBadge status={selectedSubmission.status} />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Data yang Diisi</h4>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {fields.map((field) => (
                    <div key={field.id} className="flex justify-between py-2 border-b border-dashed">
                      <span className="text-sm text-muted-foreground">{field.label}</span>
                      <span className="text-sm font-medium text-right max-w-[60%]">
                        {selectedSubmission.data[field.name] || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubmission.status === 'approved' && (
                <div className="pt-4 border-t">
                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      setPrintSubmission(selectedSubmission);
                      setSelectedSubmission(null);
                      setShowPrintDialog(true);
                    }}
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Dokumen
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Selection Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Dokumen untuk Dicetak</DialogTitle>
            <DialogDescription>
              Pilih jenis dokumen yang ingin Anda cetak. KAK hanya dapat dicetak oleh admin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {templates.filter(t => t.category === 'pelaksanaan' || t.category === 'pencairan' || t.phase === 'pelaksanaan').map((template) => {
              const isSpreadsheet = template.format === 'xlsx';
              return (
                <Button
                  key={template.id}
                  variant="outline"
                  className="justify-start gap-3 h-14"
                  onClick={() => handleSelectPrintType(template.type as DocumentType)}
                >
                  {isSpreadsheet ? (
                    <FileSpreadsheet className="w-5 h-5 text-success" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                  <div className="text-left w-full truncate">
                    <p className="font-medium truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Format: {isSpreadsheet ? 'Spreadsheet' : 'Dokumen'}
                    </p>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Preview */}
      {previewType && printSubmission && !showAnnotator && (
        <DocumentPreview
          content={getTemplateForType(previewType)?.content || ''}
          format={getTemplateForType(previewType)?.format || 'docx'}
          submission={printSubmission}
          fields={fields}
          title={getTemplateForType(previewType)?.name || 'Dokumen'}
          documentType={previewType}
          isAdmin={false}
          onClose={() => {
            setPreviewType(null);
            setPrintSubmission(null);
          }}
          onReportError={() => setShowAnnotator(true)}
        />
      )}

      {/* Document Annotator for Reporting Errors */}
      {showAnnotator && previewType && printSubmission && (
        <DocumentAnnotator
          content={getTemplateForType(previewType)?.content || ''}
          format={getTemplateForType(previewType)?.format || 'docx'}
          submission={printSubmission}
          fields={fields}
          documentType={previewType}
          onSubmitReport={(report) => {
            addErrorReport(report);
            toast.success('Laporan kesalahan berhasil dikirim ke admin');
          }}
          onClose={() => {
            setShowAnnotator(false);
            setPreviewType(null);
            setPrintSubmission(null);
          }}
        />
      )}
    </RespondentLayout>
  );
}
