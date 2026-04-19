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
  UploadCloud,
  FileCheck2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function RespondentDokumenAwal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fields, addSubmission } = useData();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [companyProfile, setCompanyProfile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter fields that are designated for "Dokumen Awal"
  const awalFields = fields.filter(f => f.showIn?.includes('awal'));

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Gunakan format PDF untuk Company Profile');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCompanyProfile(event.target?.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate required fields
    const missingFields = awalFields
      .filter((f) => f.required && !formData[f.name])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      toast.error(`Field wajib belum diisi: ${missingFields.join(', ')}`);
      setIsSubmitting(false);
      return;
    }

    if (!companyProfile) {
      toast.error('Dokumen Company Profile wajib diunggah');
      setIsSubmitting(false);
      return;
    }

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    addSubmission({
      respondentId: user?.id || 'demo-respondent',
      respondentName: formData.nama_pelaksana || 'Responden Demo',
      status: 'submitted',
      submissionPhase: 'awal',
      companyProfile: companyProfile,
      data: formData,
    });

    toast.success('Dokumen Awal berhasil diajukan');
    navigate('/respondent/dokumen-awal?status=pending');
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
            <h1 className="text-2xl font-heading font-bold">Dokumen Awal</h1>
            <p className="text-muted-foreground">
              Isi data dasar perusahaan dan lampirkan Company Profile Anda. Data ini akan direview oleh admin sebelum berlanjut ke tahap berikutnya.
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Dokumen Perlu Persetujuan Awal</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pengajuan ini masuk ke dalam tahap Dokumen Awal. Jika Disetujui oleh admin, field di bawah ini akan terkunci secara otomatis dan Anda bisa melanjutkan mengisi "Dokumen Akhir".
                </p>
                <div className="bg-primary/10 text-primary border border-primary/20 rounded-md p-3 mt-3 text-sm flex items-start gap-2">
                  <span className="font-semibold">Info:</span>
                  <span>Data yang Anda isi pada formulir ini akan digunakan sebagai dasar otomatisasi pembuatan Dokumen Kontrak dan Launching. Pastikan data yang dimasukkan akurat.</span>
                </div>
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
              {awalFields.map((field) => (
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

              {/* Upload Company Profile Section */}
              <div className="space-y-2 pt-4 border-t mt-4">
                <Label>
                  Dokumen Company Profile (PDF)
                  <span className="text-destructive ml-1">*</span>
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors ${companyProfile ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                >
                  {companyProfile ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileCheck2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{fileName}</p>
                        <p className="text-sm text-muted-foreground cursor-pointer hover:underline mt-1" onClick={() => { setCompanyProfile(null); setFileName(null); }}>
                          Ganti File
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                        <UploadCloud className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium">Drag & drop file PDF di sini</p>
                      <p className="text-sm text-muted-foreground mb-4">Ukuran maksimal 5MB</p>
                      <label htmlFor="companyProfileUpload">
                        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('companyProfileUpload')?.click()}>
                          Pilih File PDF
                        </Button>
                      </label>
                    </>
                  )}
                  <input
                    id="companyProfileUpload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

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
