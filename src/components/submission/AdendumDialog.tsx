import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AdendumDocument, AdendumType, ADENDUM_TYPE_LABELS, Submission, FormField } from '@/types';
import { Save, FileText, Printer, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface AdendumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission;
  fields: FormField[];
  onSaveAdendum: (adendum: AdendumDocument) => void;
}

export default function AdendumDialog({
  open,
  onOpenChange,
  submission,
  fields,
  onSaveAdendum,
}: AdendumDialogProps) {
  const workCategory = submission.workCategory || 'fisik';
  const [selectedType, setSelectedType] = useState<AdendumType>(
    workCategory === 'fisik' ? 'adendum_bast_fisik' : 'adendum_bast_konsultansi'
  );
  const [adendumContent, setAdendumContent] = useState<Record<string, string>>({ ...submission.data });
  const [additionalNotes, setAdditionalNotes] = useState('');

  const existingAdendums = submission.adendumDocuments || [];
  const currentVersionCount = existingAdendums.filter(a => a.type === selectedType).length;

  const handleContentChange = (fieldName: string, value: string) => {
    setAdendumContent(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = () => {
    const newAdendum: AdendumDocument = {
      id: crypto.randomUUID(),
      submissionId: submission.id,
      type: selectedType,
      content: { ...adendumContent, _additionalNotes: additionalNotes },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: currentVersionCount + 1,
    };

    onSaveAdendum(newAdendum);
    toast.success(`${ADENDUM_TYPE_LABELS[selectedType]} berhasil disimpan`);
    onOpenChange(false);
  };

  const handlePreview = () => {
    // Open preview
    toast.info('Preview akan ditampilkan...');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Buat Adendum - {submission.data.nama_pekerjaan}
          </DialogTitle>
          <DialogDescription>
            Buat dokumen adendum berdasarkan data yang sudah ada. Perubahan tidak akan mempengaruhi dokumen asli.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="type" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="type">Pilih Jenis</TabsTrigger>
            <TabsTrigger value="edit">Edit Data</TabsTrigger>
            <TabsTrigger value="history">Riwayat Adendum</TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Jenis Adendum</Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as AdendumType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workCategory === 'fisik' ? (
                      <>
                        <SelectItem value="adendum_bast_fisik">Adendum BAST (Fisik)</SelectItem>
                        <SelectItem value="adendum_baphp_fisik">Adendum BAPHP (Fisik)</SelectItem>
                        <SelectItem value="adendum_surat_perintah_fisik">Adendum Surat Perintah (Fisik)</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="adendum_bast_konsultansi">Adendum BAST (Konsultansi)</SelectItem>
                        <SelectItem value="adendum_baphp_konsultansi">Adendum BAPHP (Konsultansi)</SelectItem>
                        <SelectItem value="adendum_surat_perintah_konsultansi">Adendum Surat Perintah (Konsultansi)</SelectItem>
                      </>
                    )}
                    <SelectItem value="adendum_lampiran_baphp">Adendum Lampiran BAPHP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Catatan:</strong> Membuat adendum akan menyimpan salinan data saat ini sebagai dokumen baru.
                    Dokumen asli tidak akan terpengaruh. Anda dapat mengedit adendum kapan saja setelah disimpan.
                  </p>
                  {currentVersionCount > 0 && (
                    <p className="text-sm text-amber-600 mt-2">
                      ⚠️ Sudah ada {currentVersionCount} adendum {ADENDUM_TYPE_LABELS[selectedType]} untuk pengajuan ini.
                      Adendum baru akan menjadi versi {currentVersionCount + 1}.
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>Catatan Tambahan</Label>
                <Textarea
                  placeholder="Tuliskan alasan atau catatan untuk adendum ini..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edit" className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Edit data yang akan digunakan dalam adendum. Perubahan hanya berlaku untuk adendum ini.
              </p>
              <div className="grid gap-4">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={adendumContent[field.name] || ''}
                        onChange={(e) => handleContentChange(field.name, e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <Input
                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                        value={adendumContent[field.name] || ''}
                        onChange={(e) => handleContentChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
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

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="outline" onClick={handlePreview} className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Simpan Adendum
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
