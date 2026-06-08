import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import RespondentLayout from '@/components/layout/RespondentLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/StatusBadge';
import { DOCUMENT_TYPE_LABELS, RESPONDENT_PRINTABLE_TYPES, DocumentType, Submission } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  FileSpreadsheet,
  Eye,
  Printer,
  MessageSquare,
  Edit3,
  AlertTriangle,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { format, isAfter, isBefore, subMonths, subYears } from 'date-fns';
import { id } from 'date-fns/locale';
import DocumentPreview from '@/components/editors/DocumentPreview';
import DocumentAnnotator from '@/components/submission/DocumentAnnotator';
import { SubmissionStepper } from '@/components/submission/SubmissionStepper';
import { toast } from 'sonner';

export default function RespondentHistory() {
  const { user } = useAuth();
  const { submissions, fields, templates, addErrorReport } = useData();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printSubmission, setPrintSubmission] = useState<Submission | null>(null);
  const [previewType, setPreviewType] = useState<DocumentType | null>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);

  // Read URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  // Filters & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('terbaru');

  // Filter submissions for current respondent only
  const mySubmissions = submissions.filter(s => s.respondentId === user?.id);

  // Apply All Filters using useMemo
  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...mySubmissions];

    // 1. Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        result = result.filter(s => s.status === 'submitted' || s.status === 'review');
      } else {
        result = result.filter(s => s.status === statusFilter);
      }
    }

    // 2. Date Filter
    const today = new Date();
    if (dateFilter !== 'all') {
      result = result.filter(s => {
        const subDate = new Date(s.createdAt);
        if (dateFilter === '7days') return isAfter(subDate, new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));
        if (dateFilter === '30days') return isAfter(subDate, subMonths(today, 1));
        if (dateFilter === '1year') return isAfter(subDate, subYears(today, 1));
        return true;
      });
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => {
        const titleMatch = (s.data.nama_pekerjaan || '').toLowerCase().includes(query);
        const noMatch = (s.data.nomor_kontrak || '').toLowerCase().includes(query);
        return titleMatch || noMatch;
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'terbaru') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'terlama') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'nama_asc') return (a.data.nama_pekerjaan || '').localeCompare(b.data.nama_pekerjaan || '');
      if (sortBy === 'nama_desc') return (b.data.nama_pekerjaan || '').localeCompare(a.data.nama_pekerjaan || '');
      return 0;
    });

    return result;
  }, [mySubmissions, statusFilter, dateFilter, searchQuery, sortBy]);

  // Update URL internally when status filter changes
  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
    if (val === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', val);
    }
    setSearchParams(searchParams);
  };

  const getTemplateForType = (type: DocumentType) => {
    return templates.find(t => t.type === type);
  };

  const handlePrintClick = (submission: Submission) => {
    setPrintSubmission(submission);
    setShowPrintDialog(true);
  };

  const handleSelectPrintType = (type: DocumentType) => {
    setPreviewType(type);
    setShowPrintDialog(false);
  };

  return (
    <RespondentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Riwayat Pengajuan</h1>
            <p className="text-muted-foreground">Kelola dan lacak data yang telah Anda ajukan</p>
          </div>
        </div>

        {/* Filters Toolbar */}
        <Card className="shadow-card overflow-visible">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Universal Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama pekerjaan atau nomor kontrak..."
                  className="pl-9 w-full bg-background"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  <Select value={statusFilter} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full sm:w-[150px] bg-background">
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="pending">Menunggu Review</SelectItem>
                      <SelectItem value="approved">Disetujui</SelectItem>
                      <SelectItem value="revision">Perlu Revisi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-[150px] bg-background">
                    <SelectValue placeholder="Semua Waktu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="7days">7 Hari Terakhir</SelectItem>
                    <SelectItem value="30days">30 Hari Terakhir</SelectItem>
                    <SelectItem value="1year">1 Tahun Terakhir</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[160px] bg-background">
                    <SelectValue placeholder="Urutkan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terbaru">Terbaru</SelectItem>
                    <SelectItem value="terlama">Terlama</SelectItem>
                    <SelectItem value="nama_asc">Nama (A-Z)</SelectItem>
                    <SelectItem value="nama_desc">Nama (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <div className="space-y-4">
          {filteredAndSortedSubmissions.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">Pencarian Tidak Ditemukan</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Tidak ada data riwayat yang cocok dengan kriteria filter, status, pencarian, atau waktu yang Anda pilih.
                </p>
                {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
                  <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => {
                      setSearchQuery('');
                      handleStatusChange('all');
                      setDateFilter('all');
                    }}
                  >
                    Reset Filter
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedSubmissions.map((submission) => (
              <Card key={submission.id} className="shadow-card hover:shadow-elevated transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {submission.data.nama_pekerjaan || 'Tanpa Judul'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Data Kontrak
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            No: {submission.data.nomor_kontrak || '-'}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(submission.createdAt), 'dd MMM yyyy', { locale: id })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={submission.status} />
                      <div className="flex items-center gap-1">
                        {submission.contractFile && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-success border-success hover:bg-success/10 gap-2 mr-2"
                            asChild
                          >
                            <a href={submission.contractFile} download={`Kontrak_${submission.data.nama_pekerjaan || 'Final'}.docx`}>
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">Hasil Kontrak</span>
                            </a>
                          </Button>
                        )}
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
                        {submission.status === 'revision' && (
                          <Button variant="ghost" size="icon" className="text-warning">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Feedback for revision */}
                  {submission.status === 'revision' && submission.adminFeedback && (
                    <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-warning mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-warning">Catatan Admin</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {submission.adminFeedback}
                          </p>
                          <a href="https://wa.me/6281234567890?text=Halo%20Admin%2C%20saya%20ingin%20bertanya%20terkait%20revisi%20dokumen%20saya." target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
                            <Button variant="default" size="sm" className="bg-[#25D366] hover:bg-[#20bd5a] text-white gap-2">
                              <MessageSquare className="w-4 h-4" />
                              Hubungi Admin via WhatsApp
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
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
                  <div className="space-y-2">
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
      </div>
    </RespondentLayout>
  );
}
