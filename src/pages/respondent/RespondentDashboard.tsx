import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import RespondentLayout from '@/components/layout/RespondentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { DocumentType, Submission } from '@/types';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  FileSpreadsheet,
  Eye,
  MessageSquare,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

  const [sortBy, setSortBy] = useState<'terbaru' | 'terlama' | 'status'>('terbaru');

  // Filter submissions for current respondent only
  const mySubmissions = submissions.filter(s => s.respondentId === user?.id);

  // Filter 1 year limit
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentSubmissions = mySubmissions.filter(s => new Date(s.createdAt) >= oneYearAgo);

  // Apply sorting/grouping to recent
  const sortedSubmissions = [...recentSubmissions].sort((a, b) => {
    if (sortBy === 'terbaru') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'terlama') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'status') return a.status.localeCompare(b.status);
    return 0;
  });

  const stats = {
    total: mySubmissions.length,
    pending: mySubmissions.filter((s) => s.status === 'submitted' || s.status === 'review').length,
    approved: mySubmissions.filter((s) => s.status === 'approved').length,
    revision: mySubmissions.filter((s) => s.status === 'revision').length,
  };

  const handlePrintClick = (submission: Submission) => {
    setPrintSubmission(submission);
    setShowPrintDialog(true);
  };

  const handleSelectPrintType = (type: DocumentType) => {
    setPreviewType(type);
    setShowPrintDialog(false);
  };

  const getTemplateForType = (type: DocumentType) => {
    return templates.find(t => t.type === type);
  };

  return (
    <RespondentLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="gradient-hero rounded-2xl p-8 text-primary-foreground">
          <h1 className="text-3xl font-heading font-bold mb-2">
            Selamat Datang di Portal Dokumen
          </h1>
          <p className="text-primary-foreground/80 mb-6">
            Ajukan data kontrak dan pantau status pengajuan Anda
          </p>
          <Link to="/respondent/submit">
            <Button variant="secondary" size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Ajukan Data Baru
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/respondent/history" className="block outline-none hover:opacity-90 transition-opacity">
            <Card className="shadow-card h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pengajuan</p>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/respondent/history?status=pending" className="block outline-none hover:opacity-90 transition-opacity">
            <Card className="shadow-card h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Menunggu Review</p>
                    <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                  </div>
                  <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/respondent/history?status=approved" className="block outline-none hover:opacity-90 transition-opacity">
            <Card className="shadow-card h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Disetujui</p>
                    <p className="text-2xl font-bold mt-1">{stats.approved}</p>
                  </div>
                  <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/respondent/history?status=revision" className="block outline-none hover:opacity-90 transition-opacity">
            <Card className="shadow-card h-full">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Perlu Revisi</p>
                    <p className="text-2xl font-bold mt-1">{stats.revision}</p>
                  </div>
                  <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Submissions */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Pengajuan Terbaru (1 Tahun Terakhir)</CardTitle>
                <CardDescription>Pantau status data yang telah diajukan</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terbaru">Terbaru</SelectItem>
                    <SelectItem value="terlama">Terlama</SelectItem>
                    <SelectItem value="status">Berdasarkan Status</SelectItem>
                  </SelectContent>
                </Select>
                <Link to="/respondent/history">
                  <Button variant="ghost" className="gap-2">
                    Lihat Semua
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sortedSubmissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Belum ada pengajuan di tahun ini</p>
                <Link to="/respondent/dokumen-awal">
                  <Button>Ajukan Dokumen Awal</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedSubmissions.slice(0, 5).map((submission) => (
                  <div
                    key={submission.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/60 transition-colors border"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {submission.data.nama_pekerjaan || 'Tanpa Judul'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            No: {submission.data.nomor_kontrak || '-'}
                          </span>
                          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(submission.createdAt), 'dd MMM yyyy', { locale: id })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={submission.status} />
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {submission.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrintClick(submission)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Revision Alert */}
        {mySubmissions.filter((s) => s.status === 'revision').length > 0 && (
          <Card className="shadow-card border-warning/50 bg-warning/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Data Perlu Revisi</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ada data yang memerlukan perbaikan. Silakan periksa feedback dari admin.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link to="/respondent/history?status=revision" className="inline-block">
                      <Button variant="outline" size="sm">
                        Lihat Detail
                      </Button>
                    </Link>
                    <a href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20terkait%20revisi%20dokumen%20saya." target="_blank" rel="noopener noreferrer">
                      <Button variant="default" size="sm" className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Hubungi Admin
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
      </div>
    </RespondentLayout>
  );
}
