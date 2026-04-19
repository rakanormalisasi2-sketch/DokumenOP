import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LampiranBAPHPItem } from '@/types';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface LampiranBAPHPEditorProps {
  items: LampiranBAPHPItem[];
  onChange: (items: LampiranBAPHPItem[]) => void;
}

export default function LampiranBAPHPEditor({ items, onChange }: LampiranBAPHPEditorProps) {
  const [localItems, setLocalItems] = useState<LampiranBAPHPItem[]>(items);

  const addItem = () => {
    const newItem: LampiranBAPHPItem = {
      id: crypto.randomUUID(),
      no: localItems.length + 1,
      namaPekerjaan: '',
      bobotPersen: 0,
      keterangan: '',
    };
    const updated = [...localItems, newItem];
    setLocalItems(updated);
    onChange(updated);
  };

  const updateItem = (id: string, field: keyof LampiranBAPHPItem, value: string | number) => {
    const updated = localItems.map((item, idx) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    // Recalculate numbers
    const renumbered = updated.map((item, idx) => ({ ...item, no: idx + 1 }));
    setLocalItems(renumbered);
    onChange(renumbered);
  };

  const removeItem = (id: string) => {
    const updated = localItems.filter(item => item.id !== id);
    const renumbered = updated.map((item, idx) => ({ ...item, no: idx + 1 }));
    setLocalItems(renumbered);
    onChange(renumbered);
  };

  const totalBobot = localItems.reduce((sum, item) => sum + (item.bobotPersen || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Lampiran BAPHP - Daftar Pekerjaan</span>
          <span className={`text-sm font-normal ${totalBobot === 100 ? 'text-green-600' : 'text-amber-600'}`}>
            Total Bobot: {totalBobot.toFixed(2)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead className="min-w-[300px]">Nama Pekerjaan</TableHead>
                <TableHead className="w-32 text-center">Bobot (%)</TableHead>
                <TableHead className="min-w-[150px]">Keterangan</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {localItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center font-medium">{item.no}</TableCell>
                  <TableCell>
                    <Input
                      value={item.namaPekerjaan}
                      onChange={(e) => updateItem(item.id, 'namaPekerjaan', e.target.value)}
                      placeholder="Masukkan nama pekerjaan..."
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      value={item.bobotPersen || ''}
                      onChange={(e) => updateItem(item.id, 'bobotPersen', parseFloat(e.target.value) || 0)}
                      className="text-center"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.keterangan || ''}
                      onChange={(e) => updateItem(item.id, 'keterangan', e.target.value)}
                      placeholder="Keterangan..."
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {localItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Belum ada item. Klik "Tambah Baris" untuk menambahkan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" onClick={addItem} className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Baris
          </Button>
          
          {totalBobot !== 100 && localItems.length > 0 && (
            <p className="text-sm text-amber-600">
              ⚠️ Total bobot harus 100%. Saat ini: {totalBobot.toFixed(2)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
