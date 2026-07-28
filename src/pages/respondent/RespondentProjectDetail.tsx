import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import RespondentLayout from '@/components/layout/RespondentLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, Save, Send, Info } from 'lucide-react';
import { toast } from 'sonner';
import { FormField } from '@/types';

export default function RespondentProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fields, submissions, updateSubmission } = useData();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [companyProfile, setCompanyProfile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});

  const project = useMemo(() => submissions.find(s => s.id === id), [submissions, id]);

  useEffect(() => {
    if (project) {
      setFormData(project.data || {});
      setCompanyProfile(project.companyProfile || null);
    }
  }, [project?.id]);

  // Filter fields based on category and visibility
  const activeFields = useMemo(() => {
    if (!project) return [];
    return fields.filter(f => {
      if (f.visibleTo === 'admin') return false; // hide admin exclusive fields
      
      const isKonsul = project.workCategory === 'konsultansi';
      const isFisik = project.workCategory === 'fisik';
      
      if (isKonsul && f.showIn?.includes('fisik') && !f.showIn?.includes('konsultansi')) return false;
      if (isFisik && f.showIn?.includes('konsultansi') && !f.showIn?.includes('fisik')) return false;
      
      return true;
    });
  }, [fields, project]);

  const persiapanFields = useMemo(() => activeFields.filter(f => f.showIn?.includes('awal')), [activeFields]);
  const pelaksanaanFields = useMemo(() => activeFields.filter(f => f.showIn?.includes('akhir')), [activeFields]);

  if (!project) return <RespondentLayout><div className="p-8">Pekerjaan tidak ditemukan.</div></RespondentLayout>;

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (name: string, file: File | null, isCompanyProfile: boolean = false) => {
    if (!file) {
      if (isCompanyProfile) setCompanyProfile(null);
      else handleInputChange(name, '');
      return;
    }
    
    if (isCompanyProfile && file.type !== 'application/pdf') {
      toast.error('Gunakan format PDF untuk Company Profile');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploadingFields(prev => ({ ...prev, [name]: true }));
    try {
      const respondentId = user?.id || 'demo';
      const timestamp = new Date().getTime();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const prefix = isCompanyProfile ? 'company_profile_' : '';
      const r2Path = `uploads/${respondentId}/${prefix}${timestamp}_${safeFileName}`;
      
      const { r2Storage, getR2PublicUrl } = await import('@/integrations/r2/client');
      await r2Storage.upload(r2Path, file, file.type);
      const link = getR2PublicUrl(r2Path);
      
      if (isCompanyProfile) {
        setCompanyProfile(link);
      } else {
        handleInputChange(name, link);
      }
      toast.success(`File ${file.name} berhasil diunggah`);
    } catch (err) {
      toast.error('Gagal mengunggah file. Pastikan Cloudflare R2 terhubung.');
    } finally {
      setUploadingFields(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSave = async (phase: 'persiapan' | 'pelaksanaan') => {
    setIsSubmitting(true);
    try {
      await updateSubmission(project.id, {
        data: { ...project.data, ...formData },
        companyProfile: companyProfile || undefined,
      });
      toast.success('Data berhasil disimpan secara lokal');
    } catch (e) {
      toast.error('Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitToAdmin = async (phase: 'persiapan' | 'pelaksanaan') => {
    // Validate required fields
    const fieldsToCheck = phase === 'persiapan' ? persiapanFields : pelaksanaanFields;
    const missingFields = fieldsToCheck
      .filter((f) => {
        if (!f.required) return false;
        const value = formData[f.name];
        if (value === undefined || value === null) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        return false;
      })
      .map((f) => f.label);

    if (phase === 'persiapan' && !companyProfile) {
      missingFields.push('Company Profile (PDF)');
    }

    if (missingFields.length > 0) {
      toast.error(`Mohon lengkapi: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const newData = { ...project.data, ...formData };
      if (phase === 'persiapan') newData._status_persiapan = 'submitted';
      if (phase === 'pelaksanaan') newData._status_pelaksanaan = 'submitted';
      
      await updateSubmission(project.id, {
        data: newData,
        companyProfile: companyProfile || undefined,
      });

      toast.success(`Dokumen ${phase} berhasil diajukan ke Admin`);
    } catch (e) {
      toast.error('Gagal mengajukan ke admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField, disabled: boolean) => {
    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.name}>
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </Label>
        
        {field.type === 'text' && (
          <Input id={field.name} placeholder={field.placeholder} value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} disabled={disabled} />
        )}
        {field.type === 'number' && (
          <Input id={field.name} type="number" placeholder={field.placeholder} value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} disabled={disabled} />
        )}
        {field.type === 'date' && (
          <Input id={field.name} type="date" value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} disabled={disabled} />
        )}
        {field.type === 'textarea' && (
          <Textarea id={field.name} placeholder={field.placeholder} value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} disabled={disabled} />
        )}
        {field.type === 'select' && field.options && (
          <Select value={formData[field.name] || ''} onValueChange={(val) => handleInputChange(field.name, val)} disabled={disabled}>
            <SelectTrigger><SelectValue placeholder="Pilih..." /></SelectTrigger>
            <SelectContent>
              {field.options.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {field.type === 'file' && (
          <div className="space-y-2">
            {formData[field.name] && (
              <a href={formData[field.name]} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline block mb-2">
                Lihat File Saat Ini
              </a>
            )}
            <Input
              type="file"
              onChange={(e) => handleFileUpload(field.name, e.target.files?.[0] || null)}
              disabled={disabled || uploadingFields[field.name]}
            />
          </div>
        )}
      </div>
    );
  };

  const statusPersiapan = project.statusPersiapan || 'draft';
  const statusPelaksanaan = project.statusPelaksanaan || 'draft';
  const isPersiapanLocked = statusPersiapan === 'submitted' || statusPersiapan === 'approved' || statusPersiapan === 'review';
  const isPelaksanaanLocked = statusPelaksanaan === 'submitted' || statusPelaksanaan === 'approved' || statusPelaksanaan === 'review';

  return (
    <RespondentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/respondent')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.data?.nama_pekerjaan || 'Proyek Tanpa Nama'}</h1>
            <p className="text-muted-foreground capitalize">Kategori: {project.workCategory || 'Semua'}</p>
          </div>
        </div>

        <Tabs defaultValue="persiapan" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="persiapan">Dokumen Persiapan</TabsTrigger>
            <TabsTrigger value="pelaksanaan">Dokumen Pelaksanaan</TabsTrigger>
          </TabsList>

          <TabsContent value="persiapan" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center bg-muted/30">
                <div>
                  <CardTitle>Dokumen Persiapan</CardTitle>
                  <CardDescription>Isi data dasar dan profil perusahaan</CardDescription>
                </div>
                <StatusBadge status={statusPersiapan} />
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                <div className="space-y-2">
                  <Label>Company Profile (PDF) <span className="text-destructive">*</span></Label>
                  {companyProfile && (
                    <a href={companyProfile} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline block mb-2">Lihat File Saat Ini</a>
                  )}
                  <Input type="file" accept="application/pdf" onChange={(e) => handleFileUpload('companyProfile', e.target.files?.[0] || null, true)} disabled={isPersiapanLocked || uploadingFields['companyProfile']} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {persiapanFields.map(f => renderField(f, isPersiapanLocked))}
                </div>

                {!isPersiapanLocked && (
                  <div className="flex justify-end gap-3 mt-8">
                    <Button variant="outline" onClick={() => handleSave('persiapan')} disabled={isSubmitting}>
                      <Save className="w-4 h-4 mr-2" /> Simpan Draft
                    </Button>
                    <Button onClick={() => handleSubmitToAdmin('persiapan')} disabled={isSubmitting}>
                      <Send className="w-4 h-4 mr-2" /> Ajukan Persiapan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pelaksanaan" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row justify-between items-center bg-muted/30">
                <div>
                  <CardTitle>Dokumen Pelaksanaan</CardTitle>
                  <CardDescription>Isi data pelaporan kegiatan dan pelaksanaan di lapangan</CardDescription>
                </div>
                <StatusBadge status={statusPelaksanaan} />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-primary/10 text-primary border border-primary/20 rounded-md p-3 mb-6 text-sm flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5" />
                  <span>Data yang sudah Anda isi pada Dokumen Persiapan akan otomatis terisi di sini jika ada field yang terhubung.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pelaksanaanFields.map(f => renderField(f, isPelaksanaanLocked))}
                </div>

                {!isPelaksanaanLocked && (
                  <div className="flex justify-end gap-3 mt-8">
                    <Button variant="outline" onClick={() => handleSave('pelaksanaan')} disabled={isSubmitting}>
                      <Save className="w-4 h-4 mr-2" /> Simpan Draft
                    </Button>
                    <Button onClick={() => handleSubmitToAdmin('pelaksanaan')} disabled={isSubmitting}>
                      <Send className="w-4 h-4 mr-2" /> Ajukan Pelaksanaan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RespondentLayout>
  );
}
