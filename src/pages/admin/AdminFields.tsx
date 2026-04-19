import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/types';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit3,
  Trash2,
  GripVertical,
  Type,
  Hash,
  Calendar,
  AlignLeft,
  List,
} from 'lucide-react';

const fieldTypeIcons = {
  text: Type,
  number: Hash,
  date: Calendar,
  textarea: AlignLeft,
  select: List,
  terbilang: Type,
};

const fieldTypeLabels = {
  text: 'Teks',
  number: 'Angka',
  date: 'Tanggal',
  textarea: 'Teks Panjang',
  select: 'Pilihan',
  terbilang: 'Terbilang (Teks Ejaan Angka)',
};

export default function AdminFields() {
  const { fields, addField, updateField, deleteField } = useData();
  const [showDialog, setShowDialog] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [activeTab, setActiveTab] = useState<'persiapan' | 'pelaksanaan'>('pelaksanaan');

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text' as FormField['type'],
    placeholder: '',
    required: true,
    visibleTo: 'both' as 'both' | 'admin' | 'respondent',
    filledBy: activeTab === 'persiapan' ? 'admin' : 'respondent' as 'admin' | 'respondent',
    phase: activeTab,
    showIn: ['awal', 'akhir'] as ('awal' | 'akhir')[],
    showInAdmin: ['kak', 'kontrak', 'nota'] as ('kak' | 'kontrak' | 'nota')[],
    linkedFieldId: '',
    terbilangFormat: 'angka' as 'angka' | 'rupiah',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      type: 'text',
      placeholder: '',
      required: true,
      visibleTo: 'both',
      filledBy: activeTab === 'persiapan' ? 'admin' : 'respondent',
      phase: activeTab,
      showIn: ['awal', 'akhir'],
      showInAdmin: ['kak', 'kontrak', 'nota'],
      linkedFieldId: '',
      terbilangFormat: 'angka',
    });
    setEditingField(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (field: FormField) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      placeholder: field.placeholder || '',
      required: field.required,
      visibleTo: field.visibleTo || 'both',
      filledBy: field.filledBy || (field.phase === 'persiapan' ? 'admin' : 'respondent'),
      phase: field.phase || 'pelaksanaan',
      showIn: field.showIn || ['awal', 'akhir'],
      showInAdmin: field.showInAdmin || ['kak', 'kontrak', 'nota'],
      linkedFieldId: field.linkedFieldId || '',
      terbilangFormat: field.terbilangFormat || 'angka',
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingField) {
      updateField(editingField.id, formData);
    } else {
      addField(formData);
    }
    setShowDialog(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus field ini?')) {
      deleteField(id);
    }
  };

  const generateFieldName = (label: string) => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  // Helper to render field list
  const FieldList = ({ currentPhase }: { currentPhase: 'persiapan' | 'pelaksanaan' }) => {
    const filteredFields = fields.filter(f => f.phase === currentPhase);

    if (filteredFields.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>Belum ada field yang ditambahkan untuk dokumen {currentPhase}.</p>
          <Button variant="link" onClick={() => { setActiveTab(currentPhase); handleAdd(); }}>Tambah Field Baru</Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {filteredFields.map((field) => {
          const IconComponent = fieldTypeIcons[field.type];
          return (
            <div
              key={field.id}
              className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />

              <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10`}>
                <IconComponent className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{field.label}</span>
                  {field.required && (
                    <span className="text-xs text-destructive">*</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                    {field.name}
                  </code>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.phase === 'pelaksanaan' ? (
                      <>
                        {field.showIn?.includes('awal') && (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Dokumen Awal
                          </span>
                        )}
                        {field.showIn?.includes('akhir') && (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                            Dokumen Akhir
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {field.showInAdmin?.includes('kak') && (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            Buat KAK
                          </span>
                        )}
                        {field.showInAdmin?.includes('kontrak') && (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            Buat Kontrak
                          </span>
                        )}
                        {field.showInAdmin?.includes('nota') && (
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            Buat Nota Dinas
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(field)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(field.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Kelola Field</h1>
            <p className="text-muted-foreground mt-1">
              Tambah, edit, atau hapus field form pengisian
            </p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Field
          </Button>
        </div>

        {/* Fields List */}
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'persiapan' | 'pelaksanaan')}>
          <TabsList className="mb-4">
            <TabsTrigger value="persiapan">Dokumen Persiapan</TabsTrigger>
            <TabsTrigger value="pelaksanaan">Dokumen Pelaksanaan</TabsTrigger>
          </TabsList>

          <TabsContent value="persiapan">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Field Dokumen Persiapan</CardTitle>
                <CardDescription>
                  Field yang eksklusif diisi oleh Admin pada menu Buat Dokumen Kontrak. Field ini tidak akan muncul pada form responden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldList currentPhase="persiapan" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pelaksanaan">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Field Dokumen Pelaksanaan</CardTitle>
                <CardDescription>
                  Field yang diisi oleh responden pada fase Dokumen Awal dan Dokumen Akhir.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldList currentPhase="pelaksanaan" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Edit Field' : 'Tambah Field Baru'}
              </DialogTitle>
              <DialogDescription>
                Konfigurasikan field dan penempatannya di alur dokumen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <Label className="text-base font-semibold">Tampil Di Menu:</Label>
                {formData.phase === 'pelaksanaan' ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Pilih di fase mana responden perlu mengisi/melihat field ini. Jika di Dokumen Akhir sebuah field juga muncul dari Dokumen Awal, field tersebut akan otomatis terkunci.
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showAwal"
                          checked={formData.showIn.includes('awal')}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              showIn: checked
                                ? [...prev.showIn, 'awal']
                                : prev.showIn.filter(p => p !== 'awal')
                            }));
                          }}
                        />
                        <Label htmlFor="showAwal" className="cursor-pointer">Dokumen Awal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showAkhir"
                          checked={formData.showIn.includes('akhir')}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              showIn: checked
                                ? [...prev.showIn, 'akhir']
                                : prev.showIn.filter(p => p !== 'akhir')
                            }));
                          }}
                        />
                        <Label htmlFor="showAkhir" className="cursor-pointer">Dokumen Akhir</Label>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      Pilih di tab mana field ini akan dimunculkan saat kelola Buat Dokumen Kontrak.
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showKak"
                          checked={formData.showInAdmin?.includes('kak')}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              showInAdmin: checked
                                ? [...(prev.showInAdmin || []), 'kak']
                                : (prev.showInAdmin || []).filter(p => p !== 'kak')
                            }));
                          }}
                        />
                        <Label htmlFor="showKak" className="cursor-pointer">Buat KAK</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showKontrak"
                          checked={formData.showInAdmin?.includes('kontrak')}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              showInAdmin: checked
                                ? [...(prev.showInAdmin || []), 'kontrak']
                                : (prev.showInAdmin || []).filter(p => p !== 'kontrak')
                            }));
                          }}
                        />
                        <Label htmlFor="showKontrak" className="cursor-pointer">Buat Kontrak</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="showNota"
                          checked={formData.showInAdmin?.includes('nota')}
                          onCheckedChange={(checked) => {
                            setFormData(prev => ({
                              ...prev,
                              showInAdmin: checked
                                ? [...(prev.showInAdmin || []), 'nota']
                                : (prev.showInAdmin || []).filter(p => p !== 'nota')
                            }));
                          }}
                        />
                        <Label htmlFor="showNota" className="cursor-pointer">Buat Nota Dinas</Label>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label>Label Field</Label>
                <Input
                  placeholder="contoh: Nama Pekerjaan"
                  value={formData.label}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      label: e.target.value,
                      name: generateFieldName(e.target.value),
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Nama Field (untuk placeholder)</Label>
                <Input
                  placeholder="contoh: nama_pekerjaan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Digunakan sebagai placeholder: {`{{${formData.name || 'field_name'}}}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Tipe Field</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as FormField['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Teks</SelectItem>
                    <SelectItem value="number">Angka</SelectItem>
                    <SelectItem value="date">Tanggal</SelectItem>
                    <SelectItem value="textarea">Teks Panjang</SelectItem>
                    <SelectItem value="select">Pilihan</SelectItem>
                    <SelectItem value="terbilang">Terbilang (Otomatis dari Angka)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'terbilang' && (
                <div className="space-y-4 p-4 bg-muted/30 border rounded-lg mt-4">
                  <div className="space-y-2">
                    <Label>Pilih Field Sumber (Angka)</Label>
                    <Select
                      value={formData.linkedFieldId}
                      onValueChange={(val) => setFormData({ ...formData, linkedFieldId: val })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Field Number..." />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.filter(f => f.type === 'number').map(f => (
                          <SelectItem key={f.id} value={f.name}>{f.label} ({f.name})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Field ini akan diconvert secara otomatis menjadi ejaan teks</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Format Terbilang</Label>
                    <Select
                      value={formData.terbilangFormat}
                      onValueChange={(val) => setFormData({ ...formData, terbilangFormat: val as 'angka' | 'rupiah' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="angka">Angka Biasa (cth: Tiga Puluh)</SelectItem>
                        <SelectItem value="rupiah">Rupiah Currency (cth: Tiga Puluh Ribu Rupiah)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  placeholder="contoh: Masukkan nama pekerjaan"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                />
              </div>

              {formData.phase === 'pelaksanaan' && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Wajib Diisi</Label>
                    <p className="text-xs text-muted-foreground">
                      Field ini harus diisi oleh responden
                    </p>
                  </div>
                  <Switch
                    checked={formData.required}
                    onCheckedChange={(checked) => setFormData({ ...formData, required: checked })}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={!formData.label || !formData.name}>
                {editingField ? 'Simpan Perubahan' : 'Tambah Field'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
