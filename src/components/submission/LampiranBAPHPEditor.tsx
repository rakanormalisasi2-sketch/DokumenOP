import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RabRealisasiItem, BaphpDokumenItem, Submission } from '@/types';
import { Plus, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface LampiranBAPHPEditorProps {
  rabRealisasiItems: RabRealisasiItem[];
  onChangeRab: (items: RabRealisasiItem[]) => void;
  baphpDokumenItems: BaphpDokumenItem[];
  onChangeDokumen: (items: BaphpDokumenItem[]) => void;
  submission: Submission | null;
}

export default function LampiranBAPHPEditor({ 
    rabRealisasiItems, 
    onChangeRab, 
    baphpDokumenItems, 
    onChangeDokumen,
    submission 
}: LampiranBAPHPEditorProps) {
  
  // --- RAB Realisasi ---
  const addRabItem = () => {
    const newItem: RabRealisasiItem = {
      id: crypto.randomUUID(),
      no: rabRealisasiItems.length + 1,
      jenisPekerjaan: '',
      satuan: '',
      kontrakVolume: 0,
      kontrakBobot: 0,
      realisasiVolume: 0,
      realisasiBobot: 0,
    };
    onChangeRab([...rabRealisasiItems, newItem]);
  };

  const updateRabItem = (id: string, field: keyof RabRealisasiItem, value: any) => {
    const updated = rabRealisasiItems.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    // Recalculate numbers
    const renumbered = updated.map((item, idx) => ({ ...item, no: idx + 1 }));
    onChangeRab(renumbered);
  };

  const removeRabItem = (id: string) => {
    const updated = rabRealisasiItems.filter(item => item.id !== id);
    const renumbered = updated.map((item, idx) => ({ ...item, no: idx + 1 }));
    onChangeRab(renumbered);
  };

  const copyKontrakToRealisasi = () => {
    const updated = rabRealisasiItems.map(item => ({
      ...item,
      realisasiVolume: item.kontrakVolume,
      realisasiBobot: item.kontrakBobot
    }));
    onChangeRab(updated);
    toast.success('Disalin! Volume & Bobot Realisasi disamakan dengan Kontrak');
  };

  const totalKontrakBobot = rabRealisasiItems.reduce((sum, item) => sum + (item.kontrakBobot || 0), 0);
  const totalRealisasiBobot = rabRealisasiItems.reduce((sum, item) => sum + (item.realisasiBobot || 0), 0);

  // --- Uraian Dokumen ---
  const addDokumenItem = () => {
    const newItem: BaphpDokumenItem = {
      id: crypto.randomUUID(),
      no: baphpDokumenItems.length + 1,
      uraian: '',
      kriteriaAda: false,
      kriteriaTidakAda: false,
      catatan: ''
    };
    onChangeDokumen([...baphpDokumenItems, newItem]);
  };

  const updateDokumenItem = (id: string, field: keyof BaphpDokumenItem, value: any) => {
    const updated = baphpDokumenItems.map(item => {
      if (item.id === id) {
        // Handle mutual exclusion for checkboxes
        if (field === 'kriteriaAda' && value === true) {
           return { ...item, kriteriaAda: true, kriteriaTidakAda: false };
        }
        if (field === 'kriteriaTidakAda' && value === true) {
           return { ...item, kriteriaAda: false, kriteriaTidakAda: true };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    const renumbered = updated.map((item, idx) => ({ ...item, no: idx + 1 }));
    onChangeDokumen(renumbered);
  };

  const removeDokumenItem = (id: string) => {
    const updated = baphpDokumenItems.filter(item => item.id !== id);
    const renumbered = updated.map((item, idx) => ({ ...item, no: idx + 1 }));
    onChangeDokumen(renumbered);
  };

  const loadDefaultDokumen = () => {
      const defaultDocs = [
          'Back Up Data Volume / As Built Drawing',
          'Laporan Pengawasan/Konsultan Supervisi',
          'Laporan Harian, Laporan Mingguan, Laporan Bulanan',
          'Foto Dokumentasi 0%, 50%, 100%',
          'Request Pekerjaan, Laporan Quality Control / Job Mix',
          'Berita Acara Mutual Check 0% (MC 0%), Mutual Check 100% (MC 100%)',
          'Laporan Hasil Pengujian Kepadatan Tanah (Test Sandcone/Core Drill)',
      ];
      
      const newItems: BaphpDokumenItem[] = defaultDocs.map((doc, idx) => ({
          id: crypto.randomUUID(),
          no: idx + 1,
          uraian: doc,
          kriteriaAda: true,
          kriteriaTidakAda: false,
          catatan: ''
      }));
      
      onChangeDokumen(newItems);
      toast.success('Template Uraian Dokumen berhasil dimuat');
  };

  return (
    <Tabs defaultValue="rab" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="rab">RAB & Realisasi Fisik</TabsTrigger>
        <TabsTrigger value="dokumen">Uraian Dokumen</TabsTrigger>
      </TabsList>
      
      <TabsContent value="rab">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Data Realisasi RAB</span>
              <div className="flex gap-4 text-sm font-normal">
                <span className={Math.abs(totalKontrakBobot - 100) < 0.1 ? 'text-green-600' : 'text-amber-600'}>
                  Kontrak: {totalKontrakBobot.toFixed(2)}%
                </span>
                <span className={Math.abs(totalRealisasiBobot - 100) < 0.1 ? 'text-green-600' : 'text-amber-600'}>
                  Realisasi: {totalRealisasiBobot.toFixed(2)}%
                </span>
              </div>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
                Isi volume dan bobot realisasi. Anda dapat menyalin data dari kontrak jika realisasi 100% sama.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={copyKontrakToRealisasi} className="gap-2 text-blue-600">
                    <Copy className="w-4 h-4" /> Samakan Realisasi = Kontrak
                </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead rowSpan={2} className="w-12 text-center border-r">No</TableHead>
                    <TableHead rowSpan={2} className="min-w-[200px] border-r">Jenis Pekerjaan</TableHead>
                    <TableHead rowSpan={2} className="w-20 text-center border-r">Satuan</TableHead>
                    <TableHead colSpan={2} className="text-center border-r bg-blue-50/50">Kontrak</TableHead>
                    <TableHead colSpan={2} className="text-center border-r bg-green-50/50">Realisasi</TableHead>
                    <TableHead rowSpan={2} className="w-16"></TableHead>
                  </TableRow>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-24 text-center border-r bg-blue-50/50">Volume</TableHead>
                    <TableHead className="w-24 text-center border-r bg-blue-50/50">Bobot (%)</TableHead>
                    <TableHead className="w-24 text-center border-r bg-green-50/50">Volume</TableHead>
                    <TableHead className="w-24 text-center border-r bg-green-50/50">Bobot (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rabRealisasiItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium border-r">{item.no}</TableCell>
                      <TableCell className="border-r">
                        <Input
                          value={item.jenisPekerjaan}
                          onChange={(e) => updateRabItem(item.id, 'jenisPekerjaan', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="border-r">
                         <Input
                          value={item.satuan}
                          onChange={(e) => updateRabItem(item.id, 'satuan', e.target.value)}
                          className="text-center"
                        />
                      </TableCell>
                      <TableCell className="border-r bg-blue-50/10">
                        <Input
                          type="number"
                          step={0.01}
                          value={item.kontrakVolume || ''}
                          onChange={(e) => updateRabItem(item.id, 'kontrakVolume', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="border-r bg-blue-50/10">
                        <Input
                          type="number"
                          step={0.01}
                          value={item.kontrakBobot || ''}
                          onChange={(e) => updateRabItem(item.id, 'kontrakBobot', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="border-r bg-green-50/10">
                        <Input
                          type="number"
                          step={0.01}
                          value={item.realisasiVolume || ''}
                          onChange={(e) => updateRabItem(item.id, 'realisasiVolume', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell className="border-r bg-green-50/10">
                         <Input
                          type="number"
                          step={0.01}
                          value={item.realisasiBobot || ''}
                          onChange={(e) => updateRabItem(item.id, 'realisasiBobot', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeRabItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rabRealisasiItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Belum ada item RAB. Klik "Tambah Baris" untuk menambahkan manual.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
    
            <div className="mt-4">
              <Button variant="outline" onClick={addRabItem} className="gap-2">
                <Plus className="w-4 h-4" /> Tambah Baris RAB
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dokumen">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uraian Dokumen / Berkas</CardTitle>
            <p className="text-sm text-muted-foreground">Kelengkapan dokumen penyerta BAPHP.</p>
          </CardHeader>
          <CardContent>
             <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={loadDefaultDokumen} className="gap-2 text-blue-600">
                    <Copy className="w-4 h-4" /> Muat Template Default
                </Button>
            </div>
             <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12 text-center border-r">No</TableHead>
                    <TableHead className="min-w-[300px] border-r">Uraian Dokumen</TableHead>
                    <TableHead className="w-24 text-center border-r">Ada</TableHead>
                    <TableHead className="w-24 text-center border-r">Tidak</TableHead>
                    <TableHead className="min-w-[200px] border-r">Catatan</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baphpDokumenItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center font-medium border-r">{item.no}</TableCell>
                      <TableCell className="border-r">
                         <Input
                          value={item.uraian}
                          onChange={(e) => updateDokumenItem(item.id, 'uraian', e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="text-center border-r">
                         <Checkbox 
                            checked={item.kriteriaAda} 
                            onCheckedChange={(c) => updateDokumenItem(item.id, 'kriteriaAda', !!c)} 
                         />
                      </TableCell>
                      <TableCell className="text-center border-r">
                          <Checkbox 
                            checked={item.kriteriaTidakAda} 
                            onCheckedChange={(c) => updateDokumenItem(item.id, 'kriteriaTidakAda', !!c)} 
                         />
                      </TableCell>
                      <TableCell className="border-r">
                         <Input
                          value={item.catatan || ''}
                          onChange={(e) => updateDokumenItem(item.id, 'catatan', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeDokumenItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {baphpDokumenItems.length === 0 && (
                     <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Belum ada uraian dokumen. Klik "Muat Template Default" atau tambah manual.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
             <div className="mt-4">
              <Button variant="outline" onClick={addDokumenItem} className="gap-2">
                <Plus className="w-4 h-4" /> Tambah Baris Dokumen
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
