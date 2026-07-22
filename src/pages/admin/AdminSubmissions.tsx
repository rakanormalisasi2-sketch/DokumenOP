import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import {
  DOCUMENT_TYPE_LABELS,
  DocumentStatus,
  Submission,
  DocumentType,
  WorkforceRequirement,
  SchedulePhase,
  STATUS_LABELS,
  PaperSize,
  AdendumDocument,
  LampiranBAPHPItem,
  WorkCategory,
} from '@/types';
import SubmissionDetailDialog from '@/components/submission/SubmissionDetailDialog';
import WorkforceForm from '@/components/kak/WorkforceForm';
import ScheduleGantt from '@/components/kak/ScheduleGantt';
import LampiranBAPHPEditor from '@/components/submission/LampiranBAPHPEditor';
import AdendumEditorDialog from '@/components/submission/AdendumEditorDialog';
import PrintDialog from '@/components/submission/PrintDialog';
import DocumentPreview from '@/components/editors/DocumentPreview';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  MessageSquare,
  Printer,
  Calendar,
  Download,
  FileText,
  Trash2,
  FilePlus,
  FileSpreadsheet,
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

export default function AdminSubmissions() {
  const navigate = useNavigate();
  const { submissions, fields, templates, updateSubmissionStatus, updateSubmission, updateField, addField, deleteSubmission } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<Submission | null>(null);

  // KAK Print Dialog
  const [showKakPrintDialog, setShowKakPrintDialog] = useState(false);
  const [kakType, setKakType] = useState<'kak_perencanaan' | 'kak_konsultansi'>('kak_perencanaan');
  const [workforceRequirements, setWorkforceRequirements] = useState<WorkforceRequirement[]>([]);
  const [schedulePhases, setSchedulePhases] = useState<SchedulePhase[]>([]);
  const [durasiPelaksanaan, setDurasiPelaksanaan] = useState(30);

  // Lampiran BAPHP Dialog
  const [showLampiranBaphpDialog, setShowLampiranBaphpDialog] = useState(false);
  const [lampiranBaphpItems, setLampiranBaphpItems] = useState<LampiranBAPHPItem[]>([]);

  // Adendum Dialog
  const [showAdendumDialog, setShowAdendumDialog] = useState(false);

  // Print Dialog
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  // Preview Dialog
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewDocType, setPreviewDocType] = useState<DocumentType>('baphp_fisik');

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch =
        s.respondentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.data.nama_pekerjaan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.data.nomor_kontrak?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchQuery, statusFilter]);

  const handleApprove = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDocumentDate(format(new Date(), 'yyyy-MM-dd'));
    setFeedbackDialog(true);
  };

  const handleReject = (submission: Submission) => {
    setSelectedSubmission(submission);
    setFeedback('');
    setDocumentDate('');
    setFeedbackDialog(true);
  };

  const confirmAction = (action: 'approve' | 'revision') => {
    if (!selectedSubmission) return;

    if (action === 'approve') {
      updateSubmission(selectedSubmission.id, { documentDate });
      updateSubmissionStatus(selectedSubmission.id, 'approved');
    } else {
      updateSubmissionStatus(selectedSubmission.id, 'revision', feedback);
    }

    setFeedbackDialog(false);
    setSelectedSubmission(null);
    setFeedback('');
    setDocumentDate('');
  };

  const handleViewDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowDetailDialog(true);
  };

  // handlePrintKak moved to MassDocumentGenerator in AdminContractDocs

  const handleSaveKakData = () => {
    if (!selectedSubmission) return;

    updateSubmission(selectedSubmission.id, {
      kakType,
      workforceRequirements,
      schedulePhases,
      durasiPelaksanaan,
    });

    toast.success('Data KAK berhasil disimpan');
    setShowKakPrintDialog(false);

    // Open preview
    setPreviewDocType(kakType);
    setShowPreviewDialog(true);
  };

  // Handle Lampiran BAPHP
  const handleOpenLampiranBaphp = (submission: Submission) => {
    setSelectedSubmission(submission);
    setLampiranBaphpItems(submission.lampiranBaphpItems || []);
    setShowLampiranBaphpDialog(true);
  };

  const handleSaveLampiranBaphp = () => {
    if (!selectedSubmission) return;

    updateSubmission(selectedSubmission.id, {
      lampiranBaphpItems,
    });

    toast.success('Lampiran BAPHP berhasil disimpan');
    setShowLampiranBaphpDialog(false);

    // Open preview
    setPreviewDocType('lampiran_baphp');
    setShowPreviewDialog(true);
  };

  // Handle Adendum
  const handleOpenAdendum = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowAdendumDialog(true);
  };

  const handleSaveAdendum = (adendum: AdendumDocument) => {
    if (!selectedSubmission) return;

    const existingAdendums = selectedSubmission.adendumDocuments || [];
    updateSubmission(selectedSubmission.id, {
      adendumDocuments: [...existingAdendums, adendum],
    });
  };

  // Handle Print
  const handleOpenPrintDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowPrintDialog(true);
  };

  const handlePrint = (docTypes: DocumentType[], paperSize: PaperSize, format: 'print' | 'pdf') => {
    if (!selectedSubmission) return;

    // Build print content
    const printContent = docTypes.map(docType => {
      return `
        <div class="page" style="page-break-after: always;">
          <h2 style="text-align: center;">${DOCUMENT_TYPE_LABELS[docType]}</h2>
          <hr/>
          <table style="width: 100%; border-collapse: collapse;">
            ${fields.map(field => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; width: 30%;">${field.label}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${selectedSubmission.data[field.name] || '-'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    }).join('');

    // Paper size styles
    const paperStyles: Record<PaperSize, string> = {
      'A4': 'width: 210mm; min-height: 297mm;',
      'F4': 'width: 215mm; min-height: 330mm;',
      'Letter': 'width: 8.5in; min-height: 11in;',
      'Legal': 'width: 8.5in; min-height: 14in;',
    };

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Cetak Dokumen - ${DOMPurify.sanitize(selectedSubmission.data.nama_pekerjaan || '')}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px;
              }
              .page {
                ${paperStyles[paperSize]}
                margin: 0 auto 20px;
                padding: 40px;
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              table { margin-top: 20px; }
              @media print {
                .page { 
                  box-shadow: none; 
                  margin: 0;
                  ${paperStyles[paperSize]}
                }
                @page { 
                  size: ${paperSize}; 
                  margin: 20mm;
                }
              }
            </style>
          </head>
          <body>
            ${DOMPurify.sanitize(printContent)}
          </body>
        </html>
      `);
      printWindow.document.close();

      if (format === 'print') {
        printWindow.print();
      } else {
        // For PDF, user can use browser's print to PDF feature
        toast.info('Gunakan "Save as PDF" pada dialog print untuk menyimpan sebagai PDF');
        printWindow.print();
      }
    }

    setShowPrintDialog(false);
  };

  const handlePreview = (docType: DocumentType) => {
    setPreviewDocType(docType);
    setShowPreviewDialog(true);
  };

  const handleUpdateSubmission = (id: string, data: Partial<Submission>) => {
    updateSubmission(id, data);
  };

  const handleDeleteClick = (e: React.MouseEvent, submission: Submission) => {
    e.stopPropagation();
    setSubmissionToDelete(submission);
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (submissionToDelete) {
      deleteSubmission(submissionToDelete.id);
      setDeleteDialog(false);
      setSubmissionToDelete(null);
    }
  };

  const handleExportExcel = () => {
    // Build export data with all field values
    const exportData = filteredSubmissions.map((submission, index) => {
      const row: Record<string, any> = {
        'No': index + 1,
        'Responden': submission.respondentName,
        'Tipe Dokumen': submission.documentType ? DOCUMENT_TYPE_LABELS[submission.documentType] : '-',
        'Tanggal Dibuat': format(new Date(submission.createdAt), 'dd/MM/yyyy', { locale: idLocale }),
        'Tanggal Update': format(new Date(submission.updatedAt), 'dd/MM/yyyy', { locale: idLocale }),
        'Status': STATUS_LABELS[submission.status] || submission.status,
      };

      // Add all field data dynamically
      fields.forEach((field) => {
        row[field.label] = submission.data[field.name] || '-';
      });

      // Add KAK data if available
      if (submission.kakType) {
        row['Tipe KAK'] = submission.kakType === 'kak_perencanaan' ? 'Perencanaan' : 'Konsultansi';
      }
      if (submission.durasiPelaksanaan) {
        row['Durasi Pelaksanaan (Hari)'] = submission.durasiPelaksanaan;
      }
      if (submission.documentDate) {
        row['Tanggal Dokumen'] = submission.documentDate;
      }
      if (submission.adminFeedback) {
        row['Feedback Admin'] = submission.adminFeedback;
      }

      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Pengajuan');

    // Generate filename with date
    const filename = `Data_Pengajuan_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Data Pengajuan</h1>
            <p className="text-muted-foreground mt-1">Kelola semua pengajuan dokumen - klik baris untuk melihat detail</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, pekerjaan, atau nomor kontrak..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="submitted">Diajukan</SelectItem>
                  <SelectItem value="review">Dalam Review</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="revision">Perlu Revisi</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Pekerjaan</TableHead>
                    <TableHead>Responden</TableHead>
                    <TableHead>Tipe Dokumen</TableHead>
                    <TableHead>No. Kontrak</TableHead>
                    <TableHead>Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission, index) => (
                    <TableRow
                      key={submission.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => handleViewDetail(submission)}
                    >
                      <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{submission.data.nama_pekerjaan || '-'}</span>
                          {submission.submissionPhase === 'awal' && (
                            <span className="text-[10px] font-semibold tracking-wide bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full uppercase">
                              Awal
                            </span>
                          )}
                          {submission.submissionPhase === 'akhir' && (
                            <span className="text-[10px] font-semibold tracking-wide bg-green-100 text-green-800 px-2 py-0.5 rounded-full uppercase">
                              Akhir
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{submission.respondentName}</TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {submission.documentType ? DOCUMENT_TYPE_LABELS[submission.documentType] : '-'}
                        </span>
                      </TableCell>
                      <TableCell>{submission.data.nomor_kontrak || '-'}</TableCell>
                      <TableCell>
                        {submission.data.nilai_kontrak
                          ? `Rp ${Number(submission.data.nilai_kontrak).toLocaleString('id-ID')}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={submission.status} />
                      </TableCell>
                      <TableCell>
                        {format(new Date(submission.updatedAt), 'dd/MM/yyyy', { locale: idLocale })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Lihat Detail"
                            onClick={() => handleViewDetail(submission)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(submission.status === 'submitted' || submission.status === 'review') && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success hover:text-success"
                                title="Setujui"
                                onClick={() => handleApprove(submission)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-warning hover:text-warning"
                                title="Minta Revisi"
                                onClick={() => handleReject(submission)}
                              >
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Cetak Dokumen"
                            onClick={() => handleOpenPrintDialog(submission)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {(submission.status === 'submitted' || submission.status === 'approved') && (
                            <>
                              {/* "Cetak KAK" Button Removed - Moved to "Buat Dokumen Kontrak" */}
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Lampiran BAPHP"
                                onClick={() => handleOpenLampiranBaphp(submission)}
                              >
                                <FileSpreadsheet className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Buat Adendum"
                                onClick={() => handleOpenAdendum(submission)}
                              >
                                <FilePlus className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            title="Hapus"
                            onClick={(e) => handleDeleteClick(e, submission)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSubmissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Tidak ada data pengajuan yang ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Submission Detail Dialog */}
        {selectedSubmission && (
          <SubmissionDetailDialog
            open={showDetailDialog}
            onOpenChange={setShowDetailDialog}
            submission={selectedSubmission}
            fields={fields}
            onUpdateSubmission={handleUpdateSubmission}
            onUpdateField={updateField}
            onAddField={addField}
            isAdmin={true}
          />
        )}

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {documentDate ? 'Setujui Dokumen' : 'Kirim Feedback'}
              </DialogTitle>
              <DialogDescription>
                {selectedSubmission?.data.nama_pekerjaan} - {selectedSubmission?.respondentName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {documentDate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tanggal Dokumen</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={documentDate}
                      onChange={(e) => setDocumentDate(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {!documentDate && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catatan Revisi</label>
                  <Textarea
                    placeholder="Tuliskan catatan atau koreksi yang diperlukan..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackDialog(false)}>
                Batal
              </Button>
              <Button
                variant={documentDate ? 'default' : 'default'}
                onClick={() => confirmAction(documentDate ? 'approve' : 'revision')}
                className={documentDate ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {documentDate ? 'Setujui' : 'Kirim Feedback'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* KAK Print Dialog with Workforce & Schedule */}
        <Dialog open={showKakPrintDialog} onOpenChange={setShowKakPrintDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cetak KAK - {selectedSubmission?.data.nama_pekerjaan}</DialogTitle>
              <DialogDescription>
                Lengkapi data kebutuhan tenaga kerja dan jadwal pelaksanaan sebelum mencetak
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="type" className="flex-1 overflow-hidden flex flex-col">
              <TabsList>
                <TabsTrigger value="type">Tipe KAK</TabsTrigger>
                <TabsTrigger value="workforce">Tenaga Kerja</TabsTrigger>
                <TabsTrigger value="schedule">Jadwal Pelaksanaan</TabsTrigger>
              </TabsList>

              <TabsContent value="type" className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  <label className="text-sm font-medium">Pilih Tipe KAK</label>
                  <Select value={kakType} onValueChange={(v) => setKakType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kak_perencanaan">KAK Perencanaan</SelectItem>
                      <SelectItem value="kak_konsultansi">KAK Konsultansi Keilmuan</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {kakType === 'kak_perencanaan'
                      ? 'KAK Perencanaan digunakan untuk pekerjaan perencanaan konstruksi.'
                      : 'KAK Konsultansi Keilmuan digunakan untuk pekerjaan konsultansi teknis.'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="workforce" className="flex-1 overflow-auto">
                <WorkforceForm
                  requirements={workforceRequirements}
                  onChange={setWorkforceRequirements}
                />
              </TabsContent>

              <TabsContent value="schedule" className="flex-1 overflow-auto">
                <ScheduleGantt
                  phases={schedulePhases}
                  onChange={setSchedulePhases}
                  totalDuration={durasiPelaksanaan}
                  onDurationChange={setDurasiPelaksanaan}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setShowKakPrintDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveKakData} className="gap-2">
                <Printer className="w-4 h-4" />
                Simpan & Preview KAK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Data Pengajuan?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus data pengajuan "{submissionToDelete?.data.nama_pekerjaan || 'ini'}"?
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Lampiran BAPHP Dialog */}
        <Dialog open={showLampiranBaphpDialog} onOpenChange={setShowLampiranBaphpDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Lampiran BAPHP - {selectedSubmission?.data.nama_pekerjaan}</DialogTitle>
              <DialogDescription>
                Tambahkan item pekerjaan dan bobot presentase. Total bobot harus 100%.
              </DialogDescription>
            </DialogHeader>
            <LampiranBAPHPEditor
              items={lampiranBaphpItems}
              onChange={setLampiranBaphpItems}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLampiranBaphpDialog(false)}>Batal</Button>
              <Button onClick={handleSaveLampiranBaphp} className="gap-2">
                <Printer className="w-4 h-4" />
                Simpan & Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adendum Dialog */}
        {selectedSubmission && (
          <AdendumEditorDialog
            open={showAdendumDialog}
            onOpenChange={setShowAdendumDialog}
            submission={selectedSubmission}
            fields={fields}
            templates={templates}
            onSaveAdendum={handleSaveAdendum}
          />
        )}

        {/* Print Dialog */}
        {selectedSubmission && (
          <PrintDialog
            open={showPrintDialog}
            onOpenChange={setShowPrintDialog}
            submission={selectedSubmission}
            fields={fields}
            isAdmin={true}
            onPrint={handlePrint}
            onPreview={handlePreview}
          />
        )}

        {/* Preview Dialog */}
        {showPreviewDialog && selectedSubmission && (
          <DocumentPreview
            content={templates.find(t => t.type === previewDocType)?.content || `<h2 style="text-align: center;">${DOCUMENT_TYPE_LABELS[previewDocType]}</h2>
              <p style="text-align: center;">${selectedSubmission.data.nama_pekerjaan}</p>
              <hr/>
              <table style="width: 100%;">
                ${fields.map(f => `<tr><td style="width: 30%;">${f.label}</td><td>: ${selectedSubmission.data[f.name] || '-'}</td></tr>`).join('')}
              </table>`}
            format="docx"
            submission={selectedSubmission}
            fields={fields}
            title={`Preview: ${DOCUMENT_TYPE_LABELS[previewDocType]}`}
            documentType={previewDocType}
            isAdmin={true}
            onClose={() => setShowPreviewDialog(false)}
            onEditTemplate={() => {
              setShowPreviewDialog(false);
              navigate(`/admin/templates?edit=${previewDocType}`);
            }}
            onSendToRespondent={(base64Data) => {
              handleUpdateSubmission(selectedSubmission.id, { contractFile: base64Data });
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
