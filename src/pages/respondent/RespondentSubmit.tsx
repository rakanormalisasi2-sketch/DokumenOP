import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import RespondentLayout from '@/components/layout/RespondentLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Send,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

import { uploadToGoogleDrive } from '@/lib/gdrive';
import { toast } from 'sonner';

export default function RespondentSubmit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fields, addSubmission } = useData();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (name: string, file: File | null) => {
    if (!file) {
      handleInputChange(name, '');
      return;
    }
    setUploadingFields(prev => ({ ...prev, [name]: true }));
    try {
      const folderName = formData.nama_pelaksana || formData.nama_perusahaan || user?.name || 'Dokumen_Uploads';
      const link = await uploadToGoogleDrive(file, folderName);
      handleInputChange(name, link);
      toast.success(`File ${file.name} berhasil diunggah.`);
    } catch (err) {
      toast.error(`Gagal mengunggah file. Pastikan Google Drive terhubung.`);
    } finally {
      setUploadingFields(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    const missingFields = fields
      .filter((f) => f.required && !formData[f.name])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      toast.error(`Field wajib belum diisi: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    addSubmission({
      respondentId: user?.id || 'demo-respondent',
      respondentName: formData.nama_pelaksana || 'Responden Demo',
      status: 'submitted',
      data: formData,
    });

    toast.success('Data berhasil diajukan');
    navigate('/respondent/history');
    setIsSubmitting(false);
  };

  return (
    <RespondentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">Ajukan Data</h1>
            <p className="text-muted-foreground">
              Isi form berikut untuk mengajukan data kontrak. Data ini akan digunakan untuk semua dokumen (BAPHP, Lampiran BAPHP, BAST, Surat Perintah).
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Satu Data untuk Semua Template</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Data yang Anda isi akan digunakan sebagai sumber mail merge untuk semua jenis dokumen. 
                  Setelah disetujui admin, Anda dapat mencetak BAPHP, Lampiran BAPHP, BAST, dan Surat Perintah.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Data Kontrak</CardTitle>
              <CardDescription>
                Lengkapi semua field yang diperlukan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      rows={4}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={formData[field.name] || ''}
                      onValueChange={(value) => handleInputChange(field.name, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder || 'Pilih...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'file' ? (
                    <div className="flex flex-col space-y-2">
                      <Input
                        id={field.name}
                        type="file"
                        onChange={(e) => handleFileUpload(field.name, e.target.files?.[0] || null)}
                        disabled={uploadingFields[field.name]}
                      />
                      {uploadingFields[field.name] && <p className="text-xs text-blue-500 animate-pulse">Mengunggah ke Google Drive...</p>}
                      {formData[field.name] && !uploadingFields[field.name] && (
                        <p className="text-xs text-green-600 truncate flex items-center gap-1">
                           <FileText className="w-3 h-3" /> <a href={formData[field.name]} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-700">File berhasil diunggah (Lihat)</a>
                        </p>
                      )}
                    </div>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Ajukan Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </RespondentLayout>
  );
}
