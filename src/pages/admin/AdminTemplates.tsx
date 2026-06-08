import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DOCUMENT_TYPE_LABELS, DocumentTemplate } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  FileSpreadsheet,
  Upload,
  Edit3,
  Eye,
  Save,
  X,
  Loader2,
  File,
  Download,
  Info,
  Wand2,
  Search,
  Plus,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';
import TipTapEditor from '@/components/editors/TipTapEditor';
import LuckysheetEditor from '@/components/editors/LuckysheetEditor';
import DocumentPreview from '@/components/editors/DocumentPreview';
import { base64ToArrayBuffer } from '@/lib/docxUtils';
import LuckyExcel from 'luckyexcel';

// ... imports
import SmartDocxEditor from '@/components/editors/SmartDocxEditor';
import { NativeDocxEditor } from '@/components/editors/NativeDocxEditor';

export default function AdminTemplates() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { templates, fields, updateTemplate } = useData();
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTemplateId, setUploadingTemplateId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // State for Smart Editor Mode
  const [showSmartEditor, setShowSmartEditor] = useState(false);
  const [smartEditorFile, setSmartEditorFile] = useState<File | null>(null);
  // State for Native (OOXML) Editor Mode
  const [showNativeEditor, setShowNativeEditor] = useState(false);
  const [nativeLoading, setNativeLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // State for Add/Edit Metadata
  const [showMetaDialog, setShowMetaDialog] = useState(false);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [templateForm, setTemplateForm] = useState<Partial<DocumentTemplate>>({
    name: '',
    type: '',
    phase: 'persiapan',
    category: 'kak',
    format: 'docx',
  });

  const { removeTemplate, addTemplate, updateTemplateMeta } = useData();

  const handleOpenAddMeta = () => {
    setTemplateForm({ name: '', type: '', phase: 'persiapan', category: 'kak', format: 'docx' });
    setIsEditingMeta(false);
    setShowMetaDialog(true);
  };

  const handleOpenEditMeta = (template: DocumentTemplate) => {
    setTemplateForm({
      id: template.id,
      name: template.name,
      type: template.type,
      phase: template.phase,
      category: template.category || 'kak',
      format: template.format,
    });
    setIsEditingMeta(true);
    setShowMetaDialog(true);
  };

  const handleSaveMeta = () => {
    if (!templateForm.name || !templateForm.type) {
      toast.error('Nama dan Identifier wajib diisi');
      return;
    }

    if (isEditingMeta && templateForm.id) {
      updateTemplateMeta(templateForm.id, templateForm);
      toast.success('Template berhasil diperbarui');
    } else {
      addTemplate({
        name: templateForm.name,
        type: templateForm.type,
        phase: templateForm.phase as 'persiapan' | 'pelaksanaan',
        category: templateForm.category as DocumentTemplate['category'],
        format: templateForm.format as 'docx' | 'xlsx',
        content: '',
      });
      toast.success('Template berhasil ditambahkan');
    }
    setShowMetaDialog(false);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus template ini?')) {
      removeTemplate(id);
      toast.success('Template berhasil dihapus');
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useEffect(() => {
    const editType = searchParams.get('edit');
    if (editType && templates.length > 0) {
      const templateToEdit = templates.find(t => t.type === editType);
      if (templateToEdit) {
        handleEdit(templateToEdit);
        // Clear the query param after opening
        setSearchParams({});
      }
    }
  }, [searchParams, templates]);

  const handleEdit = async (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setShowSmartEditor(false);
    setSmartEditorFile(null);
    setShowNativeEditor(false);

    // Open native editor — initialUrl now handles data: URLs directly via base64 decode in NativeDocxEditor
    if (template.format === 'docx') {
      setNativeLoading(true);
      setShowNativeEditor(true);
    }
  };


  const getDefaultContent = (template: DocumentTemplate) => {
    if (template.format === 'xlsx') {
      // Default Luckysheet/FortuneSheet structure
      const defaultSheet = [{
        name: "Sheet1",
        celldata: [], // Empty sheet
        status: 1, // Active
        order: 0
      }];
      return JSON.stringify(defaultSheet);
    }
    // Legacy HTML fallback
    return `<h2 style="text-align: center;">TEMPLATE ${template.name.toUpperCase()}</h2>`;
  };

  const handleSave = async () => {
    if (selectedTemplate && selectedTemplate.format !== 'docx') {
      try {
        await updateTemplate(selectedTemplate.id, editContent);
        toast.success('Template berhasil disimpan');
        setSelectedTemplate(null);
      } catch (e: any) {
        console.error('Save template failed:', e);
        toast.error(`Gagal menyimpan template: ${e?.message || 'Unknown error'}`);
      }
    } else {
      // For DOCX, save is implicit via Upload or Syncfusion Save
      setSelectedTemplate(null);
    }
  };



  const handleUploadClick = (templateId: string) => {
    setUploadingTemplateId(templateId);
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    if (!selectedTemplate || !selectedTemplate.content) return;

    // For DOCX Base64
    if (selectedTemplate.format === 'docx' && selectedTemplate.content.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = selectedTemplate.content;
      link.download = `${selectedTemplate.name}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("Format file tidak didukung untuk download langsung.");
    }
  };

  // Helper function to get file extension without dot
  const getFileExtension = (fileName: string): string => {
    const parts = fileName.toLowerCase().split('.');
    return parts[parts.length - 1];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadingTemplateId) return;

    const template = templates.find(t => t.id === uploadingTemplateId);
    if (!template) return;

    const fileName = file.name.toLowerCase();
    const ext = getFileExtension(fileName);

    const docTypes = ['docx']; // Only allow DOCX for Smart Form
    const sheetTypes = ['xlsx', 'xls', 'xlm', 'xlsm', 'csv', 'ods'];

    const isDocType = docTypes.includes(ext);
    const isSheetType = sheetTypes.includes(ext);

    if (template.format === 'docx' && !isDocType) {
      toast.error('Gunakan file .DOCX (Microsoft Word)');
      return;
    }

    if (template.format === 'xlsx' && !isSheetType) {
      toast.error('Format file tidak didukung. Gunakan file spreadsheet.');
      return;
    }

    try {
      setIsConverting(true);
      if (template.format === 'docx') {
        // Smart Form: Save Base64 directly
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          try {
            await updateTemplate(template.id, base64data);
            if (selectedTemplate && selectedTemplate.id === template.id) {
              setSelectedTemplate({ ...selectedTemplate, content: base64data });
              setEditContent(base64data);
            }
            toast.success(`File "${file.name}" berhasil diupload & disimpan.`);
          } catch (e) {
            toast.error("Gagal menyimpan file.");
          } finally {
            setIsConverting(false);
          }
        };
      } else if (template.format === 'xlsx') {
        // Handle spreadsheet files using LuckyExcel for Luckysheet/FortuneSheet
        // LuckyExcel.transformExcelToLucky(file, (exportJson, luckysheetfile) => { ... })

        LuckyExcel.transformExcelToLucky(file, async (exportJson: any, luckysheetfile: any) => {
          if (exportJson.sheets && exportJson.sheets.length > 0) {
            const sheetData = JSON.stringify(exportJson.sheets);
            try {
              await updateTemplate(uploadingTemplateId, sheetData);
              if (selectedTemplate && selectedTemplate.id === uploadingTemplateId) {
                setSelectedTemplate({ ...selectedTemplate, content: sheetData });
                setEditContent(sheetData);
              }
              toast.success(`File "${file.name}" berhasil diupload & tersimpan`);
            } catch (e: any) {
              console.error('Persist template failed:', e);
              toast.error(`Gagal menyimpan template: ${e?.message || 'Unknown error'}`);
            }
            setIsConverting(false);
          } else {
            toast.error("Gagal membaca file Excel. Pastikan format valid.");
            setIsConverting(false);
          }
        }, (err: any) => {
          console.error("LuckyExcel error:", err);
          toast.error("Gagal konversi Excel. " + err);
          setIsConverting(false);
        });

        // Return early because transformExcelToLucky is callback based
        return;
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Gagal membaca file. Pastikan file tidak rusak.');
      setIsConverting(false);
    }

    // Reset
    event.target.value = '';
    setUploadingTemplateId(null);
  };

  const handlePreview = (template: DocumentTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };


  // Render Helper
  const TemplateCard = ({ template }: { template: DocumentTemplate }) => (
    <Card className="shadow-card hover:shadow-elevated transition-all">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${template.format === 'xlsx'
              ? 'bg-success/10'
              : 'bg-primary/10'
              }`}>
              {template.format === 'docx' ? (
                <FileText className="w-6 h-6 text-primary" />
              ) : (
                <FileSpreadsheet className="w-6 h-6 text-success" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>
                {template.format.toUpperCase()} • {template.category?.toUpperCase() || 'UMUM'}
                <br />
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 mt-1 inline-block">
                  {template.phase === 'persiapan' ? 'Persiapan' : 'Pelaksanaan'}
                </span>
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleOpenEditMeta(template)}>
              <Edit3 className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)} className="hover:text-destructive text-muted-foreground">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {DOCUMENT_TYPE_LABELS[template.type] || template.type}
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            Terakhir diupdate: {format(new Date(template.lastUpdated), 'dd MMM yyyy HH:mm', { locale: id })}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleEdit(template)}
            >
              <Edit3 className="w-4 h-4" />
              Kelola File
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handlePreview(template)}
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".docx,.xlsx,.xls,.csv"
          onChange={handleFileUpload}
        />

        {/* Conversion Loading Overlay */}
        {isConverting && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-foreground font-medium">Memproses file...</p>
              <p className="text-muted-foreground text-sm">Mohon tunggu sebentar</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Template</h1>
            <p className="text-muted-foreground mt-1">
              Kelola template dokumen sistem.
            </p>
          </div>
          <Button onClick={handleOpenAddMeta} className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Template Baru
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari template..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Semua Template</TabsTrigger>
            <TabsTrigger value="persiapan">Dokumen Persiapan</TabsTrigger>
            <TabsTrigger value="pelaksanaan">Dokumen Pelaksanaan</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
              {filteredTemplates.length === 0 && <p className="text-muted-foreground">Tidak ada template yang ditemukan.</p>}
            </div>
          </TabsContent>

          <TabsContent value="persiapan" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.filter(t => t.phase === 'persiapan').map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
              {filteredTemplates.filter(t => t.phase === 'persiapan').length === 0 && <p className="text-muted-foreground text-sm">Tidak ada template persiapan.</p>}
            </div>
          </TabsContent>

          <TabsContent value="pelaksanaan" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.filter(t => t.phase === 'pelaksanaan').map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
              {filteredTemplates.filter(t => t.phase === 'pelaksanaan').length === 0 && <p className="text-muted-foreground text-sm">Tidak ada template pelaksanaan.</p>}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog - Context Aware */}
        <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
          <DialogContent className={`w-full ${(showSmartEditor || showNativeEditor || selectedTemplate?.format === 'xlsx')
            ? 'max-w-[95vw] max-h-[95vh] h-[95vh]'
            : 'max-w-2xl'
            } overflow-hidden flex flex-col p-1`}>

            {showNativeEditor && selectedTemplate?.format === 'docx' ? (
              // NATIVE OOXML EDITOR
              nativeLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Memuat dokumen...</p>
                  </div>
                </div>
              ) : (
              <div className='flex-1 h-full'>
                <NativeDocxEditor
                  initialUrl={selectedTemplate?.content}
                  onSave={(blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateTemplate(selectedTemplate!.id, reader.result as string).then(() => {
                        toast.success('Dokumen berhasil disimpan');
                      }).catch(() => {
                        toast.error('Gagal menyimpan dokumen');
                      });
                    };
                    reader.readAsDataURL(blob);
                  }}
                  templateVariables={fields.map(f => f.name)}
                  onLoaded={() => setNativeLoading(false)}
                />
              </div>
              )
            ) : showSmartEditor && selectedTemplate?.format === 'docx' ? (
              // SMART EDITOR VIEW
              <SmartDocxEditor
                initialUrl={selectedTemplate.content}
                file={smartEditorFile}
                onClose={() => setShowSmartEditor(false)}
              />
            ) : (
              // STANDARD VIEW (Upload/Download Options for DOCX, or Legacy Editors)
              <>
                <DialogHeader className="shrink-0 px-6 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="flex items-center gap-2">
                        {selectedTemplate?.format === 'xlsx' ? (
                          <FileSpreadsheet className="w-5 h-5 text-success" />
                        ) : (
                          <FileText className="w-5 h-5 text-primary" />
                        )}
                        Kelola: {selectedTemplate?.name}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedTemplate?.format === 'xlsx'
                          ? 'Edit template spreadsheet langsung di sini.'
                          : 'Pilih metode edit: Editor Online atau Upload Manual.'
                        }
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden py-4 min-h-0 px-6">
                  {selectedTemplate?.format === 'docx' ? (
                    <div className="flex flex-col gap-6 py-4 h-full overflow-y-auto">

                      {/* OPTION 1: NATIVE OOXML EDITOR (Best Quality) */}
                      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="none">
                            <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="2" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="2" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                            <line x1="2" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
                          </svg>
                          Edit Dokumen (Native OOXML)
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Editor dokumen berkualitas tinggi dengan Ribbon lengkap (Layout, Insert, References, Review). Format DOCX asli tanpa konversi HTML.
                        </p>
                        <Button onClick={() => { setNativeLoading(true); setShowNativeEditor(true); }} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                          Buka Native Editor
                        </Button>
                      </div>

                      {/* OPTION 2: SMART EDITOR (Mail Merge + Auto Fill) */}
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
                          <Wand2 className="w-5 h-5 text-primary" />
                          Smart Editor (Mail Merge)
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Edit template dengan mail merge otomatis. Isi formulir data dari database ke template dokumen.
                        </p>
                        <Button onClick={() => setShowSmartEditor(true)} className="w-full sm:w-auto" variant="outline">
                          Edit Dokumen
                        </Button>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Atau Manual</span>
                        </div>
                      </div>

                      {/* OPTION 2: UPLOAD/DOWNLOAD */}
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
                          <div className="text-sm text-blue-800">
                            <p className="font-semibold mb-1">Cara Manual:</p>
                            <ol className="list-decimal pl-4 space-y-1">
                              <li>Download file template.</li>
                              <li>Edit di <strong>Microsoft Word</strong>.</li>
                              <li>Gunakan kode seperti <code>{`{{nama_pekerjaan}}`}</code>.</li>
                              <li>Upload kembali.</li>
                            </ol>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button onClick={handleDownloadTemplate} className="h-20 flex flex-col gap-2" variant="outline">
                            <Download className="w-6 h-6 opacity-50" />
                            Download File
                          </Button>
                          <Button onClick={() => selectedTemplate && handleUploadClick(selectedTemplate.id)} className="h-20 flex flex-col gap-2 relative overflow-hidden" variant="default">
                            <Upload className="w-6 h-6 opacity-50" />
                            Upload File Baru
                            {isConverting && <div className="absolute inset-0 bg-primary/80 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
                          </Button>
                        </div>
                      </div>

                      {/* MINI PREVIEW */}
                      {selectedTemplate.content && (
                        <div className="mt-4 border-t pt-4">
                          <p className="text-sm font-semibold mb-2">Preview Isi File:</p>
                          <div className="aspect-[210/297] w-full border rounded-lg bg-gray-100 overflow-hidden relative">
                            <div className="absolute inset-0 overflow-auto scale-75 origin-top">
                              <DocumentPreview
                                title="Preview Mini"
                                content={selectedTemplate.content}
                                format="docx"
                                fields={fields}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedTemplate?.format === 'xlsx' ? (
                    <LuckysheetEditor
                      content={editContent}
                      onChange={setEditContent}
                      fields={fields}
                    />
                  ) : (
                    <div className="h-full overflow-auto">
                      <TipTapEditor
                        content={editContent}
                        onChange={setEditContent}
                        fields={fields}
                      />
                    </div>
                  )}
                </div>

                <DialogFooter className="shrink-0 px-6 pb-6">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Tutup
                  </Button>
                  {selectedTemplate?.format !== 'docx' && (
                    <Button onClick={handleSave} className="gap-2">
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Full Preview Modal */}
        {showPreview && previewTemplate && (
          <DocumentPreview
            content={previewTemplate.content}
            format={previewTemplate.format}
            fields={fields}
            title={`Preview: ${previewTemplate.name}`}
            onClose={() => {
              setShowPreview(false);
              setPreviewTemplate(null);
            }}
          />
        )}
        {/* Meta Dialog */}
        <Dialog open={showMetaDialog} onOpenChange={setShowMetaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditingMeta ? 'Edit Template' : 'Tambah Template Baru'}</DialogTitle>
              <DialogDescription>
                Konfigurasi penempatan dan nama template dokumen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nama Template</Label>
                <Input
                  placeholder="Contoh: Template KAK Baru"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Identifier Tipe (Tanpa Spasi)</Label>
                <Input
                  placeholder="Contoh: kak_baru_2024"
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, type: e.target.value }))}
                  disabled={isEditingMeta} // Cannot change identifier after creation
                />
              </div>
              <div className="space-y-2">
                <Label>Fase Dokumen</Label>
                <Select
                  value={templateForm.phase}
                  onValueChange={(val: any) => setTemplateForm(prev => ({ ...prev, phase: val }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="persiapan">Dokumen Persiapan</SelectItem>
                    <SelectItem value="pelaksanaan">Dokumen Pelaksanaan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kategori Kustom</Label>
                <Select
                  value={templateForm.category as string}
                  onValueChange={(val: any) => setTemplateForm(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kak">KAK</SelectItem>
                    <SelectItem value="kontrak">Kontrak</SelectItem>
                    <SelectItem value="notadinas">Nota Dinas</SelectItem>
                    <SelectItem value="pelaksanaan">Pelaksanaan</SelectItem>
                    <SelectItem value="pencairan">Pencairan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!isEditingMeta && (
                <div className="space-y-2">
                  <Label>Format File</Label>
                  <Select
                    value={templateForm.format}
                    onValueChange={(val: any) => setTemplateForm(prev => ({ ...prev, format: val }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="docx">Microsoft Word (.docx)</SelectItem>
                      <SelectItem value="xlsx">Spreadsheet (.xlsx)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMetaDialog(false)}>Batal</Button>
              <Button onClick={handleSaveMeta}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
