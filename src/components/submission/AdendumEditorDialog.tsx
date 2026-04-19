import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AdendumDocument, AdendumType, ADENDUM_TYPE_LABELS, Submission, FormField, DocumentTemplate } from '@/types';
import { Save, FileText, Eye, Printer, Mail, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import RichTextEditor from '@/components/editors/RichTextEditor';
import { supabase } from '@/integrations/supabase/client';

interface AdendumEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission;
  fields: FormField[];
  templates: DocumentTemplate[];
  onSaveAdendum: (adendum: Omit<AdendumDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  respondentEmail?: string;
}

export default function AdendumEditorDialog({
  open,
  onOpenChange,
  submission,
  fields,
  templates,
  onSaveAdendum,
  respondentEmail,
}: AdendumEditorDialogProps) {
  const workCategory = submission.workCategory || 'fisik';
  const [selectedType, setSelectedType] = useState<AdendumType>(
    workCategory === 'fisik' ? 'adendum_bast_fisik' : 'adendum_bast_konsultansi'
  );
  const [editorContent, setEditorContent] = useState('');
  const [activeTab, setActiveTab] = useState('type');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [savedAdendum, setSavedAdendum] = useState<{ type: AdendumType; version: number } | null>(null);

  const existingAdendums = submission.adendumDocuments || [];
  const currentVersionCount = existingAdendums.filter(a => a.type === selectedType).length;

  // Get template content and replace placeholders
  const getInitialContent = (type: AdendumType) => {
    // Map adendum type to document type
    const docTypeMap: Record<AdendumType, string> = {
      adendum_bast_fisik: 'bast_fisik',
      adendum_bast_konsultansi: 'bast_konsultansi',
      adendum_baphp_fisik: 'baphp_fisik',
      adendum_baphp_konsultansi: 'baphp_konsultansi',
      adendum_surat_perintah_fisik: 'surat_perintah_fisik',
      adendum_surat_perintah_konsultansi: 'surat_perintah_konsultansi',
      adendum_lampiran_baphp: 'lampiran_baphp',
    };

    const template = templates.find(t => t.type === docTypeMap[type]);
    let content = template?.content || getDefaultAdendumContent(type);

    // Replace placeholders with submission data
    fields.forEach(field => {
      const placeholder = new RegExp(`{{${field.name}}}`, 'g');
      const value = submission.data[field.name] || `[${field.label}]`;
      content = content.replace(placeholder, value);
    });

    return content;
  };

  const getDefaultAdendumContent = (type: AdendumType) => {
    const bastContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-weight: bold;">ADENDUM BERITA ACARA SERAH TERIMA</h2>
        <p>Nomor: {{nomor_kontrak}}/ADD/${currentVersionCount + 1}</p>
      </div>
      <p>Pada hari ini, kami yang bertanda tangan di bawah ini:</p>
      <p>Dengan ini menyatakan bahwa pekerjaan {{nama_pekerjaan}} yang dilaksanakan oleh {{nama_pelaksana}} telah mengalami perubahan sebagai berikut:</p>
      <br/>
      <p><strong>Perubahan:</strong></p>
      <p>[Tuliskan perubahan di sini]</p>
    `;
    
    const baphpContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-weight: bold;">ADENDUM BERITA ACARA PEMERIKSAAN HASIL PEKERJAAN</h2>
        <p>Nomor: {{nomor_kontrak}}/ADD-BAPHP/${currentVersionCount + 1}</p>
      </div>
      <p>Merujuk pada kontrak nomor {{nomor_kontrak}} untuk pekerjaan {{nama_pekerjaan}},</p>
      <p>dengan ini kami menyampaikan adendum sebagai berikut:</p>
      <br/>
      <p><strong>Perubahan Pemeriksaan:</strong></p>
      <p>[Tuliskan perubahan pemeriksaan di sini]</p>
    `;
    
    const spkContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-weight: bold;">ADENDUM SURAT PERINTAH KERJA</h2>
        <p>Nomor: {{nomor_kontrak}}/ADD-SPK/${currentVersionCount + 1}</p>
      </div>
      <p>Menindaklanjuti Surat Perintah Kerja untuk pekerjaan {{nama_pekerjaan}},</p>
      <p>dengan ini diberikan perintah tambahan sebagai berikut:</p>
      <br/>
      <p><strong>Perintah Tambahan:</strong></p>
      <p>[Tuliskan perintah tambahan di sini]</p>
    `;
    
    const lampiranContent = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-weight: bold;">ADENDUM LAMPIRAN BERITA ACARA PEMERIKSAAN</h2>
        <p>Nomor: {{nomor_kontrak}}/ADD-LAMP/${currentVersionCount + 1}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="border: 1px solid #000; padding: 8px;">No</th>
            <th style="border: 1px solid #000; padding: 8px;">Uraian Pekerjaan</th>
            <th style="border: 1px solid #000; padding: 8px;">Bobot (%)</th>
            <th style="border: 1px solid #000; padding: 8px;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 8px;">1</td>
            <td style="border: 1px solid #000; padding: 8px;">[Nama Pekerjaan]</td>
            <td style="border: 1px solid #000; padding: 8px;">[Bobot]</td>
            <td style="border: 1px solid #000; padding: 8px;">[Keterangan]</td>
          </tr>
        </tbody>
      </table>
    `;

    const headers: Record<AdendumType, string> = {
      adendum_bast_fisik: bastContent,
      adendum_bast_konsultansi: bastContent,
      adendum_baphp_fisik: baphpContent,
      adendum_baphp_konsultansi: baphpContent,
      adendum_surat_perintah_fisik: spkContent,
      adendum_surat_perintah_konsultansi: spkContent,
      adendum_lampiran_baphp: lampiranContent,
    };

    let content = headers[type];
    // Replace placeholders
    fields.forEach(field => {
      const placeholder = new RegExp(`{{${field.name}}}`, 'g');
      const value = submission.data[field.name] || `[${field.label}]`;
      content = content.replace(placeholder, value);
    });

    return content;
  };

  const handleTypeChange = (type: AdendumType) => {
    setSelectedType(type);
    const content = getInitialContent(type);
    setEditorContent(content);
  };

  const handleSave = (sendEmail: boolean = false) => {
    const newVersion = currentVersionCount + 1;
    const newAdendum: Omit<AdendumDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      submissionId: submission.id,
      type: selectedType,
      content: { _html: editorContent },
      version: newVersion,
    };

    onSaveAdendum(newAdendum);
    setSavedAdendum({ type: selectedType, version: newVersion });
    toast.success(`${ADENDUM_TYPE_LABELS[selectedType]} versi ${newVersion} berhasil disimpan`);
    
    if (sendEmail && respondentEmail) {
      setShowEmailConfirm(true);
    } else {
      onOpenChange(false);
    }
  };

  const sendAdendumEmail = async () => {
    if (!respondentEmail || !savedAdendum) return;

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-adendum-email', {
        body: {
          to: respondentEmail,
          respondentName: submission.respondentName,
          adendumType: ADENDUM_TYPE_LABELS[savedAdendum.type],
          documentName: submission.data.nama_pekerjaan || 'Dokumen',
          version: savedAdendum.version,
        },
      });

      if (error) throw error;
      
      toast.success(`Notifikasi adendum berhasil dikirim ke ${respondentEmail}`);
      setShowEmailConfirm(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error sending adendum email:', error);
      toast.error(`Gagal mengirim email: ${error.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Initialize content when type changes or dialog opens
  const initializeEditor = () => {
    if (activeTab === 'edit' && !editorContent) {
      const content = getInitialContent(selectedType);
      setEditorContent(content);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Buat Adendum - {submission.data.nama_pekerjaan}
            </DialogTitle>
            <DialogDescription>
              Edit dokumen adendum seperti di Google Docs. Perubahan tidak akan mempengaruhi dokumen asli.
            </DialogDescription>
          </DialogHeader>

          <Tabs 
            value={activeTab} 
            onValueChange={(v) => {
              setActiveTab(v);
              if (v === 'edit') initializeEditor();
            }} 
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="type">1. Pilih Jenis</TabsTrigger>
              <TabsTrigger value="edit">2. Edit Dokumen</TabsTrigger>
              <TabsTrigger value="history">Riwayat</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Jenis Adendum</Label>
                  <Select value={selectedType} onValueChange={(v) => handleTypeChange(v as AdendumType)}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adendum_bast_konsultansi">Adendum BAST (Konsultansi)</SelectItem>
                      <SelectItem value="adendum_baphp_konsultansi">Adendum BAPHP (Konsultansi)</SelectItem>
                      <SelectItem value="adendum_surat_perintah_konsultansi">Adendum Surat Perintah (Konsultansi)</SelectItem>
                      <SelectItem value="adendum_bast_fisik">Adendum BAST (Fisik)</SelectItem>
                      <SelectItem value="adendum_baphp_fisik">Adendum BAPHP (Fisik)</SelectItem>
                      <SelectItem value="adendum_surat_perintah_fisik">Adendum Surat Perintah (Fisik)</SelectItem>
                      <SelectItem value="adendum_lampiran_baphp">Adendum Lampiran BAPHP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card className="bg-muted/30">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Catatan:</strong> Membuat adendum akan menyimpan dokumen sebagai versi baru.
                      Dokumen asli dan adendum sebelumnya tidak akan terpengaruh.
                    </p>
                    {currentVersionCount > 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        ⚠️ Sudah ada {currentVersionCount} adendum {ADENDUM_TYPE_LABELS[selectedType]}.
                        Dokumen baru akan menjadi versi {currentVersionCount + 1}.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Button onClick={() => {
                  initializeEditor();
                  setActiveTab('edit');
                }} className="gap-2">
                  Lanjutkan ke Editor
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="flex-1 overflow-hidden flex flex-col p-2">
              <div className="flex-1 overflow-hidden">
                <RichTextEditor
                  content={editorContent}
                  onChange={setEditorContent}
                  fields={fields}
                />
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto p-4">
              {existingAdendums.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Belum ada adendum untuk pengajuan ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {existingAdendums.map((adendum) => (
                    <Card key={adendum.id} className="hover:bg-muted/30 transition-colors">
                      <CardContent className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{ADENDUM_TYPE_LABELS[adendum.type]} - Versi {adendum.version}</p>
                          <p className="text-sm text-muted-foreground">
                            Dibuat: {new Date(adendum.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="w-3 h-3" />
                            Lihat
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Printer className="w-3 h-3" />
                            Cetak
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleSave(false)} 
              className="gap-2" 
              disabled={activeTab !== 'edit' || !editorContent}
            >
              <Save className="w-4 h-4" />
              Simpan Adendum
            </Button>
            {respondentEmail && (
              <Button 
                onClick={() => handleSave(true)} 
                className="gap-2" 
                disabled={activeTab !== 'edit' || !editorContent}
              >
                <Mail className="w-4 h-4" />
                Simpan & Kirim Email
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Confirmation Dialog */}
      <Dialog open={showEmailConfirm} onOpenChange={setShowEmailConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Kirim Notifikasi Email
            </DialogTitle>
            <DialogDescription>
              Kirim notifikasi adendum ke responden?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Kepada:</span>
                <span className="font-medium">{respondentEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Responden:</span>
                <span className="font-medium">{submission.respondentName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Adendum:</span>
                <span className="font-medium">
                  {savedAdendum && `${ADENDUM_TYPE_LABELS[savedAdendum.type]} v${savedAdendum.version}`}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEmailConfirm(false);
              onOpenChange(false);
            }}>
              Lewati
            </Button>
            <Button onClick={sendAdendumEmail} disabled={isSendingEmail} className="gap-2">
              {isSendingEmail ? (
                <>
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
