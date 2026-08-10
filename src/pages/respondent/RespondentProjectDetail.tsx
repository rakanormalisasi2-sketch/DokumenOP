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
import { motion, AnimatePresence } from 'framer-motion';

const FIELDS_PER_PAGE = 15;

export default function RespondentProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fields, submissions, updateSubmission } = useData();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [companyProfile, setCompanyProfile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFields, setUploadingFields] = useState<Record<string, boolean>>({});
  const [localSuggestions, setLocalSuggestions] = useState<Record<string, string[]>>({});
  const [currentPagePersiapan, setCurrentPagePersiapan] = useState(0);
  const [currentPagePelaksanaan, setCurrentPagePelaksanaan] = useState(0);

  const project = useMemo(() => submissions.find(s => s.id === id), [submissions, id]);

  useEffect(() => {
    if (project) {
      setFormData(project.data || {});
      setCompanyProfile(project.companyProfile || null);
    }
  }, [project?.id]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('pusdaop_field_suggestions') || '{}');
      setLocalSuggestions(stored);
    } catch (e) {
      console.error('Failed to parse local suggestions', e);
    }
  }, []);

  const saveSuggestions = (data: Record<string, string>) => {
    try {
      const suggestions = JSON.parse(localStorage.getItem('pusdaop_field_suggestions') || '{}');
      let hasChanges = false;
      
      Object.keys(data).forEach(key => {
        const val = typeof data[key] === 'string' ? data[key].trim() : '';
        if (val && val.length > 2) {
          if (!suggestions[key]) suggestions[key] = [];
          if (!suggestions[key].includes(val)) {
            suggestions[key].push(val);
            // keep up to 10 latest unique values
            if (suggestions[key].length > 10) suggestions[key].shift();
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        localStorage.setItem('pusdaop_field_suggestions', JSON.stringify(suggestions));
        setLocalSuggestions(suggestions);
      }
    } catch (e) {
      console.error('Failed to save local suggestions', e);
    }
  };

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

  const handleFileUpload = async (name: string, file: File | null, isCompanyProfile: boolean = false, fieldType?: string) => {
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
      // Jika ini adalah upload RAB khusus
      if (fieldType === 'rab_excel_upload') {
        const { parseRabExcel } = await import('@/lib/rabParser');
        const parsedData = await parseRabExcel(file);
        if (parsedData.length === 0) {
          toast.error('Tidak ditemukan data RAB pada file ini. Pastikan format tabel benar.');
          setUploadingFields(prev => ({ ...prev, [name]: false }));
          return;
        }
        // Simpan data JSON RAB ke dalam formData dengan suffix _data
        setFormData(prev => ({ ...prev, [`${name}_data`]: JSON.stringify(parsedData) }));
        toast.success(`Berhasil mengekstrak ${parsedData.length} baris RAB`);
      }

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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal mengunggah file. Pastikan Cloudflare R2 terhubung.');
    } finally {
      setUploadingFields(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSave = async (phase: 'persiapan' | 'pelaksanaan') => {
    setIsSubmitting(true);
    try {
      const mergedData = { ...project.data, ...formData };
      await updateSubmission(project.id, {
        data: mergedData,
        companyProfile: companyProfile || undefined,
      });
      saveSuggestions(mergedData);
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
        
        // Lewati validasi untuk field yang di-generate otomatis
        if (f.type === 'terbilang' || f.type === 'date_addition') return false;

        const value = formData[f.name];
        if (value === undefined || value === null) return true;
        if (typeof value === 'string' && value.trim() === '') return true;
        return false;
      })
      .map((f) => f.label);



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
        status: 'submitted',
        companyProfile: companyProfile || undefined,
      });
      saveSuggestions(newData);

      toast.success(`Dokumen ${phase} berhasil diajukan ke Admin`);
    } catch (e) {
      toast.error('Gagal mengajukan ke admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestUnlock = async (phase: 'persiapan' | 'pelaksanaan') => {
    const reason = window.prompt('Masukkan alasan mengapa Anda perlu mengubah dokumen ini:');
    if (!reason) return;
    
    setIsSubmitting(true);
    try {
      const newData = { ...project.data, ...formData };
      if (phase === 'persiapan') {
        newData._status_persiapan = 'review';
        newData._unlock_request_persiapan = reason;
      }
      if (phase === 'pelaksanaan') {
        newData._status_pelaksanaan = 'review';
        newData._unlock_request_pelaksanaan = reason;
      }
      
      await updateSubmission(project.id, {
        data: newData,
        status: 'review',
      });

      toast.success('Permintaan perubahan berhasil dikirim ke Admin. Menunggu persetujuan.');
    } catch (e) {
      toast.error('Gagal mengirim permintaan perubahan');
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
          <>
            <Input id={field.name} list={`suggestions-${field.name}`} placeholder={field.placeholder} value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value)} disabled={disabled} autoComplete="off" />
            {localSuggestions[field.name] && localSuggestions[field.name].length > 0 && (
              <datalist id={`suggestions-${field.name}`}>
                {localSuggestions[field.name].map((sug, idx) => (
                  <option key={idx} value={sug} />
                ))}
              </datalist>
            )}
          </>
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
        {(field.type === 'file' || field.type === 'rab_excel_upload') && (
          <div className="space-y-2">
            {formData[field.name] && (
              <a href={formData[field.name]} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline block mb-2">
                Lihat File Saat Ini
              </a>
            )}
            {field.type === 'rab_excel_upload' && formData[`${field.name}_data`] && (
               <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md mb-2">
                 ✅ Data RAB berhasil diekstrak (Siap untuk BAPHP)
               </div>
            )}
            <Input
              type="file"
              accept={field.type === 'rab_excel_upload' ? ".xlsx, .xls" : undefined}
              onChange={(e) => handleFileUpload(field.name, e.target.files?.[0] || null, false, field.type)}
              disabled={disabled || uploadingFields[field.name]}
            />
            {field.type === 'rab_excel_upload' && (
              <p className="text-xs text-muted-foreground mt-1">
                Upload file Excel (.xlsx). Sistem akan otomatis membaca data untuk lampiran BAPHP.
              </p>
            )}
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
                
                {(() => {
                  const totalPersiapanPages = Math.ceil(persiapanFields.length / FIELDS_PER_PAGE);
                  const currentPersiapanFields = persiapanFields.slice(
                    currentPagePersiapan * FIELDS_PER_PAGE,
                    (currentPagePersiapan + 1) * FIELDS_PER_PAGE
                  );

                  return (
                    <>
                      {totalPersiapanPages > 1 && (
                        <div className="mb-6">
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>Langkah {currentPagePersiapan + 1} dari {totalPersiapanPages}</span>
                            <span>{Math.round(((currentPagePersiapan + 1) / totalPersiapanPages) * 100)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${((currentPagePersiapan + 1) / totalPersiapanPages) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentPagePersiapan}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="grid grid-cols-1 gap-6"
                        >
                          {currentPersiapanFields.map(f => renderField(f, isPersiapanLocked))}
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                        <div>
                          {totalPersiapanPages > 1 && (
                            <Button 
                              variant="outline" 
                              onClick={() => setCurrentPagePersiapan(p => Math.max(0, p - 1))}
                              disabled={currentPagePersiapan === 0}
                            >
                              Sebelumnya
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          {currentPagePersiapan < totalPersiapanPages - 1 ? (
                            <Button onClick={() => setCurrentPagePersiapan(p => Math.min(totalPersiapanPages - 1, p + 1))}>
                              Selanjutnya
                            </Button>
                          ) : (
                            <>
                              {!isPersiapanLocked ? (
                                <>
                                  <Button variant="outline" onClick={() => handleSave('persiapan')} disabled={isSubmitting}>
                                    <Save className="w-4 h-4 mr-2" /> Simpan Draft
                                  </Button>
                                  <Button onClick={() => handleSubmitToAdmin('persiapan')} disabled={isSubmitting}>
                                    <Send className="w-4 h-4 mr-2" /> Ajukan Persiapan
                                  </Button>
                                </>
                              ) : (
                                <div className="flex flex-col items-end gap-2">
                                  <p className="text-sm text-muted-foreground">Dokumen persiapan telah diajukan/dikunci.</p>
                                  {statusPersiapan === 'approved' && (
                                    <Button variant="secondary" onClick={() => handleRequestUnlock('persiapan')} disabled={isSubmitting}>
                                      Ajukan Perubahan
                                    </Button>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

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

                {(() => {
                  const totalPelaksanaanPages = Math.ceil(pelaksanaanFields.length / FIELDS_PER_PAGE);
                  const currentPelaksanaanFields = pelaksanaanFields.slice(
                    currentPagePelaksanaan * FIELDS_PER_PAGE,
                    (currentPagePelaksanaan + 1) * FIELDS_PER_PAGE
                  );

                  return (
                    <>
                      {totalPelaksanaanPages > 1 && (
                        <div className="mb-6">
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <span>Langkah {currentPagePelaksanaan + 1} dari {totalPelaksanaanPages}</span>
                            <span>{Math.round(((currentPagePelaksanaan + 1) / totalPelaksanaanPages) * 100)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${((currentPagePelaksanaan + 1) / totalPelaksanaanPages) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentPagePelaksanaan}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                          className="grid grid-cols-1 gap-6"
                        >
                          {currentPelaksanaanFields.map(f => renderField(f, isPelaksanaanLocked))}
                        </motion.div>
                      </AnimatePresence>

                      <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
                        <div>
                          {totalPelaksanaanPages > 1 && (
                            <Button 
                              variant="outline" 
                              onClick={() => setCurrentPagePelaksanaan(p => Math.max(0, p - 1))}
                              disabled={currentPagePelaksanaan === 0}
                            >
                              Sebelumnya
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          {currentPagePelaksanaan < totalPelaksanaanPages - 1 ? (
                            <Button onClick={() => setCurrentPagePelaksanaan(p => Math.min(totalPelaksanaanPages - 1, p + 1))}>
                              Selanjutnya
                            </Button>
                          ) : (
                            <>
                              {!isPelaksanaanLocked ? (
                                <>
                                  <Button variant="outline" onClick={() => handleSave('pelaksanaan')} disabled={isSubmitting}>
                                    <Save className="w-4 h-4 mr-2" /> Simpan Draft
                                  </Button>
                                  <Button onClick={() => handleSubmitToAdmin('pelaksanaan')} disabled={isSubmitting}>
                                    <Send className="w-4 h-4 mr-2" /> Ajukan Pelaksanaan
                                  </Button>
                                </>
                              ) : (
                                <div className="flex flex-col items-end gap-2">
                                  <p className="text-sm text-muted-foreground">Dokumen pelaksanaan telah diajukan/dikunci.</p>
                                  {statusPelaksanaan === 'approved' && (
                                    <Button variant="secondary" onClick={() => handleRequestUnlock('pelaksanaan')} disabled={isSubmitting}>
                                      Ajukan Perubahan
                                    </Button>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RespondentLayout>
  );
}
