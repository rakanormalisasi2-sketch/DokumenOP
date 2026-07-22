import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Submission, FormField, DOCUMENT_TYPE_LABELS, DocumentType, WorkCategory } from '@/types';
import { Plus, Trash2, Save, Printer, Eye, MessageSquare, Edit, CheckCircle } from 'lucide-react';
import DocumentPreview from '@/components/editors/DocumentPreview';
import { useData } from '@/contexts/DataContext';
import DOMPurify from 'dompurify';



interface SubmissionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission;
  fields: FormField[];
  onUpdateSubmission: (id: string, data: Partial<Submission>) => void;
  onUpdateField: (id: string, updates: Partial<FormField>) => void;
  onAddField: (field: Omit<FormField, 'id' | 'order'>) => void;
  isAdmin?: boolean;
}

export default function SubmissionDetailDialog({
  open,
  onOpenChange,
  submission,
  fields,
  onUpdateSubmission,
  onUpdateField,
  onAddField,
  isAdmin = false,
}: SubmissionDetailDialogProps) {
  const { resolveErrorReport, templates } = useData();
  const [editedData, setEditedData] = useState<Record<string, string>>(submission.data);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocType, setPreviewDocType] = useState<DocumentType>('baphp_fisik');
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  // State for Document Dates
  const [editingDates, setEditingDates] = useState(submission.documentDates || {});

  // Update local data
  const handleDataChange = (fieldName: string, value: string) => {
    setEditedData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleDateUpdate = (docKey: string, field: 'nomor' | 'tanggal', value: string) => {
    setEditingDates(prev => ({
      ...prev,
      [docKey]: {
        ...prev[docKey],
        [field]: value
      }
    }));
  };

  // Update handleSave to include dates
  const handleSave = () => {
    onUpdateSubmission(submission.id, {
      data: editedData,
      documentDates: editingDates
    });
  };

  // Toggle field visibility
  const toggleFieldVisibility = (fieldId: string, currentVisibility: 'respondent' | 'admin' | 'both') => {
    const newVisibility = currentVisibility === 'both' ? 'admin' :
      currentVisibility === 'admin' ? 'respondent' : 'both';
    onUpdateField(fieldId, { visibleTo: newVisibility });
  };

  // Toggle who fills the field
  const toggleFilledBy = (fieldId: string, currentFilledBy: 'respondent' | 'admin') => {
    const newFilledBy = currentFilledBy === 'respondent' ? 'admin' : 'respondent';
    onUpdateField(fieldId, { filledBy: newFilledBy });
  };

  // Add new field
  const handleAddField = () => {
    if (!newFieldName || !newFieldLabel) return;

    onAddField({
      name: newFieldName.toLowerCase().replace(/\s+/g, '_'),
      label: newFieldLabel,
      type: 'text',
      required: false,
      visibleTo: 'both',
      filledBy: 'respondent',
      phase: 'pelaksanaan',
      showIn: ['awal', 'akhir'], // Default to both phases when added ad-hoc
    });

    setNewFieldName('');
    setNewFieldLabel('');
    setShowAddField(false);
  };

  // Print document
  const handlePrint = (docType: DocumentType) => {
    setPreviewDocType(docType);
    setShowPreview(true);
  };

  const workCategory: WorkCategory = submission.workCategory || 'fisik';
  const availableTemplates = isAdmin
    ? templates
    : templates.filter(t => t.category === 'pelaksanaan' || t.category === 'pencairan' || t.phase === 'pelaksanaan');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Detail Pengajuan - {submission.data.nama_pekerjaan || 'Tanpa Nama'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="data" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="data">Data Pengajuan</TabsTrigger>
              {submission.companyProfile && <TabsTrigger value="company">Company Profile</TabsTrigger>}
              {isAdmin && <TabsTrigger value="dates">Pengaturan Tanggal</TabsTrigger>}
              <TabsTrigger value="print">Cetak Dokumen</TabsTrigger>
              <TabsTrigger value="report">
                Catatan & Koreksi
                {submission.errorReports && submission.errorReports.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-2 bg-warning text-warning-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                    {submission.errorReports.filter(r => r.status === 'pending').length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Date Settings Tab */}
            {isAdmin && (
              <TabsContent value="dates" className="flex-1 overflow-auto p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Pengaturan Tanggal & Nomor Dokumen</h3>
                  <p className="text-sm text-gray-500">Atur nomor dan tanggal untuk surat-surat output.</p>

                  {/* BAPHP */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-6">
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">BAPHP ({workCategory})</Label>
                      <div className="grid gap-2">
                        <Label>Nomor Surat</Label>
                        <Input
                          value={editingDates?.[`baphp_${workCategory}`]?.nomor || ''}
                          onChange={(e) => handleDateUpdate(`baphp_${workCategory}`, 'nomor', e.target.value)}
                          placeholder="No. BAPHP"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Tanggal Surat</Label>
                        <Input
                          type="date"
                          value={editingDates?.[`baphp_${workCategory}`]?.tanggal || ''}
                          onChange={(e) => handleDateUpdate(`baphp_${workCategory}`, 'tanggal', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* SPP */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Surat Perintah Pemeriksaan ({workCategory})</Label>
                      <div className="grid gap-2">
                        <Label>Nomor Surat</Label>
                        <Input
                          value={editingDates?.[`spp_${workCategory}`]?.nomor || ''}
                          onChange={(e) => handleDateUpdate(`spp_${workCategory}`, 'nomor', e.target.value)}
                          placeholder="No. SPP"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Tanggal Surat</Label>
                        <Input
                          type="date"
                          value={editingDates?.[`spp_${workCategory}`]?.tanggal || ''}
                          onChange={(e) => handleDateUpdate(`spp_${workCategory}`, 'tanggal', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* BAST */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">BAST ({workCategory})</Label>
                      <div className="grid gap-2">
                        <Label>Nomor Surat</Label>
                        <Input
                          value={editingDates?.[`bast_${workCategory}`]?.nomor || ''}
                          onChange={(e) => handleDateUpdate(`bast_${workCategory}`, 'nomor', e.target.value)}
                          placeholder="No. BAST"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Tanggal Surat</Label>
                        <Input
                          type="date"
                          value={editingDates?.[`bast_${workCategory}`]?.tanggal || ''}
                          onChange={(e) => handleDateUpdate(`bast_${workCategory}`, 'tanggal', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Company Profile Tab */}
            {submission.companyProfile && (
              <TabsContent value="company" className="flex-1 overflow-auto p-6">
                <div className="h-full flex flex-col gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">Dokumen Company Profile</h3>
                    <p className="text-sm text-muted-foreground">Dokumen PDF yang diunggah oleh responden pada tahap Dokumen Awal.</p>
                  </div>
                  <div className="flex-1 border rounded-lg overflow-hidden bg-muted/30 min-h-[500px]">
                    <iframe
                      src={submission.companyProfile}
                      sandbox="allow-same-origin"
                      referrerPolicy="no-referrer"
                      className="w-full h-full min-h-[500px]"
                      title="Company Profile PDF Viewer"
                    />
                  </div>
                </div>
              </TabsContent>
            )}

            {/* Data Tab - Spreadsheet-like view */}
            <TabsContent value="data" className="flex-1 overflow-auto">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12">No</TableHead>
                      <TableHead className="min-w-[150px]">Field</TableHead>
                      <TableHead className="min-w-[200px]">Label</TableHead>
                      <TableHead className="min-w-[250px]">Nilai</TableHead>
                      {isAdmin && (
                        <>
                          <TableHead className="w-32 text-center">Terlihat Oleh</TableHead>
                          <TableHead className="w-32 text-center">Diisi Oleh</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-mono text-xs">{field.name}</TableCell>
                        <TableCell className="font-medium">{field.label}</TableCell>
                        <TableCell>
                          {field.type === 'textarea' ? (
                            <Textarea
                              value={editedData[field.name] || ''}
                              onChange={(e) => handleDataChange(field.name, e.target.value)}
                              className="min-h-[60px]"
                              disabled={!isAdmin && field.filledBy === 'admin'}
                            />
                          ) : (
                            <Input
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              value={editedData[field.name] || ''}
                              onChange={(e) => handleDataChange(field.name, e.target.value)}
                              disabled={!isAdmin && field.filledBy === 'admin'}
                            />
                          )}
                        </TableCell>
                        {isAdmin && (
                          <>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => toggleFieldVisibility(field.id, field.visibleTo)}
                              >
                                {field.visibleTo === 'both' ? '👁 Semua' :
                                  field.visibleTo === 'admin' ? '🔒 Admin' : '👤 Responden'}
                              </Button>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => toggleFilledBy(field.id, field.filledBy)}
                              >
                                {field.filledBy === 'respondent' ? '👤 Responden' : '🔒 Admin'}
                              </Button>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}

                    {/* Add new field row */}
                    {isAdmin && showAddField && (
                      <TableRow className="bg-primary/5">
                        <TableCell className="text-center text-muted-foreground">+</TableCell>
                        <TableCell>
                          <Input
                            placeholder="nama_field"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className="font-mono text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Label Field"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                          />
                        </TableCell>
                        <TableCell colSpan={3}>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleAddField}>
                              <Save className="w-4 h-4 mr-1" />
                              Simpan
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowAddField(false)}>
                              Batal
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {isAdmin && !showAddField && (
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setShowAddField(true)}
                >
                  <Plus className="w-4 h-4" />
                  Tambah Field Baru
                </Button>
              )}
            </TabsContent>

            {/* Print Tab */}
            <TabsContent value="print" className="flex-1 overflow-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
                {availableTemplates.map((template) => {
                  const docType = template.type as DocumentType;
                  return (
                    <Button
                      key={template.id}
                      variant="outline"
                      className="h-auto py-6 flex-col gap-2"
                      onClick={() => handlePrint(docType)}
                      disabled={!isAdmin && submission.status !== 'approved'}
                    >
                      <Printer className="w-8 h-8" />
                      <span className="text-sm text-center">{template.name}</span>
                    </Button>
                  );
                })}

                <Button
                  variant="default"
                  className="h-auto py-6 flex-col gap-2"
                  onClick={() => {
                    // Print all documents
                    availableTemplates.forEach(template => handlePrint(template.type as DocumentType));
                  }}
                  disabled={!isAdmin && submission.status !== 'approved'}
                >
                  <Printer className="w-8 h-8" />
                  <span className="text-sm text-center">Cetak Semua</span>
                </Button>
              </div>

              {!isAdmin && submission.status !== 'approved' && (
                <div className="text-center text-muted-foreground py-4">
                  Dokumen hanya dapat dicetak setelah disetujui admin.
                </div>
              )}
            </TabsContent>

            {/* Report Tab - Saling Koreksi */}
            <TabsContent value="report" className="flex-1 overflow-auto p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Catatan & Laporan Koreksi</h3>
                <div className="text-right">
                  {!isAdmin && (
                    <p className="text-sm text-muted-foreground">Gunakan tombol <Eye className="w-3 h-3 inline mx-1" /> Preview lalu klik Lapor Kesalahan untuk menambah catatan baru.</p>
                  )}
                </div>
              </div>

              {!submission.errorReports || submission.errorReports.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 border border-dashed rounded-lg">
                  <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">Belum ada catatan atau koreksi untuk dokumen ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submission.errorReports.map((report) => (
                    <div key={report.id} className={`border rounded-xl p-4 transition-all shadow-sm ${report.status === 'resolved' ? 'bg-muted/30 opacity-80' : 'bg-background border-warning/40'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{DOCUMENT_TYPE_LABELS[report.documentType]}</span>
                            {report.status === 'resolved' ? (
                              <span className="text-[10px] font-medium bg-success/10 text-success px-2 py-0.5 rounded-full">Selesai Diperbaiki</span>
                            ) : (
                              <span className="text-[10px] font-medium bg-warning/10 text-warning px-2 py-0.5 rounded-full">Menunggu Perbaikan</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Oleh: {report.reportedByName} • {new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {isAdmin && report.status === 'pending' && (
                          <Button size="sm" onClick={() => resolveErrorReport(submission.id, report.id)} className="gap-2 bg-success hover:bg-success/90 shrink-0">
                            <CheckCircle className="w-4 h-4" />
                            Tandai Selesai
                          </Button>
                        )}
                      </div>

                      <div className="mt-4 space-y-3">
                        {report.comment && (
                          <div className="bg-primary/5 p-3 rounded-lg text-sm border-l-2 border-primary">
                            <span className="font-medium block mb-1">Catatan Umum:</span>
                            {report.comment}
                          </div>
                        )}

                        {report.annotations && report.annotations.length > 0 && (
                          <div className="text-sm bg-muted/40 p-3 rounded-lg">
                            <span className="font-medium mb-2 block">Detail Anotasi:</span>
                            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground marker:text-muted-foreground/50">
                              {report.annotations.map(a => (
                                <li key={a.id}>
                                  {a.type === 'highlight' && <span className="text-yellow-600 font-medium">Teks yang ditandai stabilo</span>}
                                  {a.type === 'strikethrough' && <span className="text-destructive font-medium line-through">Teks yang dicoret</span>}
                                  {a.type === 'comment' && <span className="italic text-foreground">"{a.comment}"</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {report.screenshotPdf && (
                          <div className="pt-2">
                            <Button variant="outline" size="sm" onClick={() => {
                              const win = window.open('', '_blank');
                              if (win) {
                                win.document.write(`<html><head><title>Anotasi Dokumen - ${DOCUMENT_TYPE_LABELS[report.documentType]}</title><style>body{font-family:sans-serif;padding:20px;background:#f3f4f6;} .preview-content{max-width:210mm;min-height:297mm;background:white;margin:auto;box-shadow:0 0 10px rgba(0,0,0,0.1);padding:40px;}</style></head><body><div class="preview-content">${DOMPurify.sanitize(report.screenshotPdf)}</div></body></html>`);
                                win.document.close();
                              }
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Buka Dokumen Beranotasi
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Preview: {DOCUMENT_TYPE_LABELS[previewDocType]}</span>
              {isAdmin && (
                <Button variant="outline" size="sm" className="gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Template
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <DocumentPreview
            content={`<div style="padding: 20px;"><h2>${DOCUMENT_TYPE_LABELS[previewDocType]}</h2><p>Data: ${Object.entries(editedData).map(([k, v]) => `${k}: ${v}`).join(', ')}</p></div>`}
            format="docx"
            fields={fields}
            title={DOCUMENT_TYPE_LABELS[previewDocType]}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
