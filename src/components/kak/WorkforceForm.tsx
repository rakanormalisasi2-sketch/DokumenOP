import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import {
  WorkforceRequirement,
  POSITION_LABELS,
  PENDIDIKAN_OPTIONS,
  JURUSAN_OPTIONS,
  KEAHLIAN_OPTIONS,
} from '@/types';

interface WorkforceFormProps {
  requirements: WorkforceRequirement[];
  onChange: (requirements: WorkforceRequirement[]) => void;
}

export default function WorkforceForm({ requirements, onChange }: WorkforceFormProps) {
  const [newPosition, setNewPosition] = useState<WorkforceRequirement['position']>('team_leader');

  const addRequirement = () => {
    const newReq: WorkforceRequirement = {
      id: crypto.randomUUID(),
      position: newPosition,
      jumlahOrang: 1,
      pendidikan: 'S1/Sarjana',
      jurusan: 'Teknik Sipil',
      keahlian: 'Tenaga Ahli Muda / Jenjang 7',
      pengalaman: 2,
      statusTenagaAhli: '-',
    };
    onChange([...requirements, newReq]);
  };

  const updateRequirement = (id: string, field: keyof WorkforceRequirement, value: any) => {
    onChange(
      requirements.map((req) =>
        req.id === id ? { ...req, [field]: value } : req
      )
    );
  };

  const removeRequirement = (id: string) => {
    onChange(requirements.filter((req) => req.id !== id));
  };

  // Group by position type
  const tenagaAhli = useMemo(
    () => requirements.filter(r => r.position === 'team_leader'),
    [requirements]
  );
  const tenagaPendukung = useMemo(
    () => requirements.filter(r => r.position !== 'team_leader'),
    [requirements]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Kebutuhan Tenaga Kerja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new requirement */}
        <div className="flex items-end gap-4">
          <div className="flex-1 space-y-2">
            <Label>Tambah Posisi</Label>
            <Select value={newPosition} onValueChange={(v) => setNewPosition(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POSITION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addRequirement} className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah
          </Button>
        </div>

        {/* Requirements table */}
        {requirements.length > 0 && (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center" rowSpan={2}>Posisi</TableHead>
                  <TableHead className="text-center" colSpan={5}>Kualifikasi</TableHead>
                  <TableHead className="text-center" rowSpan={2}>Aksi</TableHead>
                </TableRow>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-center text-xs">Tingkat Pendidikan</TableHead>
                  <TableHead className="text-center text-xs">Jurusan</TableHead>
                  <TableHead className="text-center text-xs">Keahlian</TableHead>
                  <TableHead className="text-center text-xs">Pengalaman</TableHead>
                  <TableHead className="text-center text-xs">Status Tenaga Ahli</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Tenaga Ahli Section */}
                {tenagaAhli.length > 0 && (
                  <>
                    <TableRow className="bg-blue-50">
                      <TableCell colSpan={7} className="font-semibold text-sm">Tenaga Ahli:</TableCell>
                    </TableRow>
                    {tenagaAhli.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="font-medium">{POSITION_LABELS[req.position]}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">(</span>
                              <Input
                                type="number"
                                min="1"
                                value={req.jumlahOrang}
                                onChange={(e) => updateRequirement(req.id, 'jumlahOrang', parseInt(e.target.value) || 1)}
                                className="w-16 h-6 text-xs"
                              />
                              <span className="text-xs text-muted-foreground">Orang)</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={req.pendidikan} 
                            onValueChange={(v) => updateRequirement(req.id, 'pendidikan', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PENDIDIKAN_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={req.jurusan} 
                            onValueChange={(v) => updateRequirement(req.id, 'jurusan', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {JURUSAN_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={req.keahlian} 
                            onValueChange={(v) => updateRequirement(req.id, 'keahlian', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {KEAHLIAN_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">Min.</span>
                            <Input
                              type="number"
                              min="0"
                              value={req.pengalaman}
                              onChange={(e) => updateRequirement(req.id, 'pengalaman', parseInt(e.target.value) || 0)}
                              className="w-14 h-6 text-xs"
                            />
                            <span className="text-xs">th</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={req.statusTenagaAhli}
                            onChange={(e) => updateRequirement(req.id, 'statusTenagaAhli', e.target.value)}
                            className="h-6 text-xs"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeRequirement(req.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}

                {/* Tenaga Pendukung Section */}
                {tenagaPendukung.length > 0 && (
                  <>
                    <TableRow className="bg-green-50">
                      <TableCell colSpan={7} className="font-semibold text-sm">Tenaga Pendukung:</TableCell>
                    </TableRow>
                    {tenagaPendukung.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="font-medium">{POSITION_LABELS[req.position]}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">(</span>
                              <Input
                                type="number"
                                min="1"
                                value={req.jumlahOrang}
                                onChange={(e) => updateRequirement(req.id, 'jumlahOrang', parseInt(e.target.value) || 1)}
                                className="w-16 h-6 text-xs"
                              />
                              <span className="text-xs text-muted-foreground">Orang)</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={req.pendidikan} 
                            onValueChange={(v) => updateRequirement(req.id, 'pendidikan', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PENDIDIKAN_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={req.jurusan} 
                            onValueChange={(v) => updateRequirement(req.id, 'jurusan', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {JURUSAN_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={req.keahlian} 
                            onValueChange={(v) => updateRequirement(req.id, 'keahlian', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {KEAHLIAN_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">Min.</span>
                            <Input
                              type="number"
                              min="0"
                              value={req.pengalaman}
                              onChange={(e) => updateRequirement(req.id, 'pengalaman', parseInt(e.target.value) || 0)}
                              className="w-14 h-6 text-xs"
                            />
                            <span className="text-xs">th</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={req.statusTenagaAhli}
                            onChange={(e) => updateRequirement(req.id, 'statusTenagaAhli', e.target.value)}
                            className="h-6 text-xs"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeRequirement(req.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {requirements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada data tenaga kerja. Klik tombol "Tambah" untuk menambahkan.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
