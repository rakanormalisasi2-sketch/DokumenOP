
import React, { useState } from 'react';
import { CONTRACT_FORMATS } from '@/lib/contractFormats';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash, ScrollText } from 'lucide-react';
import { toast } from 'sonner';

export default function ContractGenerator() {
    const [selectedFormat, setSelectedFormat] = useState<string>('');
    const [inputMode, setInputMode] = useState<'single' | 'mass'>('single');

    // Mass Data Storage (In-Memory for now, should be persisted)
    const [massData, setMassData] = useState<any[]>([{ id: 1, nama_pekerjaan: '' }]); // Start with 1 row

    // Placeholder Fields (Mockup - should come from FieldManager context)
    const fields = [
        { id: 'nama_pekerjaan', label: 'Nama Pekerjaan' },
        { id: 'nomor_kontrak', label: 'Nomor Kontrak' },
        { id: 'nilai_kontrak', label: 'Nilai Kontrak' },
        { id: 'pelaksana', label: 'Pelaksana' },
    ];

    const handleMassChange = (id: number, field: string, value: string) => {
        setMassData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const addRow = () => {
        setMassData(prev => [...prev, { id: Math.max(...prev.map(r => r.id), 0) + 1 }]);
    };

    const removeRow = (id: number) => {
        if (massData.length > 1) {
            setMassData(prev => prev.filter(r => r.id !== id));
        }
    };

    // Flatten logic for Select
    const getAllFormats = () => {
        return CONTRACT_FORMATS.flatMap(cat =>
            cat.items.flatMap(sub =>
                sub.types.map(t => ({
                    ...t,
                    group: `${cat.category} - ${sub.subcategory}`
                }))
            )
        );
    };

    const flattenedFormats = getAllFormats();

    return (
        <div className="space-y-6">
            {/* Format Selector */}
            <div className="space-y-2">
                <Label>Pilih Format Kontrak</Label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Jenis Kontrak (27 Format Available)" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {CONTRACT_FORMATS.map((cat, idx) => (
                            <SelectGroup key={idx}>
                                <SelectLabel className="font-bold text-gray-900 bg-gray-100">{cat.category}</SelectLabel>
                                {cat.items.map((sub, sIdx) => (
                                    <React.Fragment key={sIdx}>
                                        <SelectLabel className="pl-4 text-xs font-semibold text-gray-500 uppercase">{sub.subcategory}</SelectLabel>
                                        {sub.types.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="pl-6 cursor-pointer">
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedFormat && (
                <div className="space-y-4 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border">
                        <span className="text-sm font-medium ml-2">Mode Input:</span>
                        <div className="flex gap-2">
                            <Button
                                variant={inputMode === 'single' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setInputMode('single')}
                            >
                                Single Entry
                            </Button>
                            <Button
                                variant={inputMode === 'mass' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setInputMode('mass')}
                            >
                                Mass Entry (Tabel)
                            </Button>
                        </div>
                    </div>

                    {inputMode === 'single' ? (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {fields.map(f => (
                                        <div key={f.id} className="space-y-2">
                                            <Label htmlFor={f.id}>{f.label}</Label>
                                            <Input id={f.id} placeholder={`Masukkan ${f.label}`} />
                                        </div>
                                    ))}
                                </div>
                                <Button className="w-full gap-2"><ScrollText className="w-4 h-4" /> Generate Dokumen</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="border rounded-lg overflow-auto max-h-[500px]">
                                    <Table>
                                        <TableHeader className="bg-gray-50 sticky top-0">
                                            <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                {fields.map(f => (
                                                    <TableHead key={f.id} className="min-w-[150px]">{f.label}</TableHead>
                                                ))}
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {massData.map((row, idx) => (
                                                <TableRow key={row.id}>
                                                    <TableCell>{idx + 1}</TableCell>
                                                    {fields.map(f => (
                                                        <TableCell key={f.id} className="p-2">
                                                            <Input
                                                                className="h-8 shadow-none border-transparent focus:border-gray-200"
                                                                value={row[f.id] || ''}
                                                                onChange={(e) => handleMassChange(row.id, f.id, e.target.value)}
                                                                placeholder="..."
                                                            />
                                                        </TableCell>
                                                    ))}
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => removeRow(row.id)}>
                                                            <Trash className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="flex justify-between">
                                    <Button variant="outline" onClick={addRow} className="gap-2"><Plus className="w-4 h-4" /> Tambah Baris</Button>
                                    <Button className="gap-2"><ScrollText className="w-4 h-4" /> Generate All ({massData.length})</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
