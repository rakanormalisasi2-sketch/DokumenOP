
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash, GripVertical } from 'lucide-react';

interface Field {
    id: string;
    label: string;
    key: string; // The {{placeholder}} key
    type: 'text' | 'date' | 'number';
}

export default function FieldManager() {
    const [persiapanFields, setPersiapanFields] = useState<Field[]>([
        { id: '1', label: 'Nomor Surat', key: 'nomor_surat', type: 'text' },
        { id: '2', label: 'Tanggal Surat', key: 'tanggal_surat', type: 'date' },
    ]);

    const [serahTerimaFields, setSerahTerimaFields] = useState<Field[]>([
        { id: '3', label: 'Nomor BAST', key: 'nomor_bast', type: 'text' },
        { id: '4', label: 'Tanggal Serah Terima', key: 'tgl_serah_terima', type: 'date' },
    ]);

    const addField = (target: 'persiapan' | 'serah_terima') => {
        // Validation/Modal logic here usually
        const newField: Field = {
            id: crypto.randomUUID(),
            label: 'New Field',
            key: 'new_field',
            type: 'text'
        };
        if (target === 'persiapan') setPersiapanFields([...persiapanFields, newField]);
        else setSerahTerimaFields([...serahTerimaFields, newField]);
    };

    const renderList = (fields: Field[], setFields: any, type: string) => (
        <div className="space-y-2 mt-4">
            {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2 p-2 bg-white border rounded shadow-sm group">
                    <GripVertical className="w-4 h-4 text-gray-300 cursor-move" />
                    <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Label</Label>
                            <Input className="h-8" value={field.label} onChange={(e) => {
                                const newF = [...fields]; newF[idx].label = e.target.value; setFields(newF);
                            }} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Key ({{`{{...}}`}})</Label>
                            <Input className="h-8 font-mono text-xs" value={field.key} onChange={(e) => {
                                const newF = [...fields]; newF[idx].key = e.target.value; setFields(newF);
                            }} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Type</Label>
                            <select
                                className="h-8 w-full border rounded text-sm bg-white px-2"
                                value={field.type}
                                onChange={(e) => {
                                    const newF = [...fields]; newF[idx].type = e.target.value as any; setFields(newF);
                                }}
                            >
                                <option value="text">Text</option>
                                <option value="date">Date</option>
                                <option value="number">Number</option>
                            </select>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        setFields(fields.filter(f => f.id !== field.id));
                    }}>
                        <Trash className="w-4 h-4" />
                    </Button>
                </div>
            ))}
            <Button variant="outline" className="w-full border-dashed gap-2 mt-2" onClick={() => addField(type as any)}>
                <Plus className="w-4 h-4" /> Tambah Field Baru
            </Button>
        </div>
    );

    return (
        <Tabs defaultValue="persiapan" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="persiapan">Dokumen Persiapan</TabsTrigger>
                <TabsTrigger value="serah_terima">Dokumen Serah Terima</TabsTrigger>
            </TabsList>
            <TabsContent value="persiapan">
                <Card>
                    <CardHeader>
                        <CardTitle>Field Dokumen Persiapan</CardTitle>
                        <CardDescription>Field ini akan muncul saat user mengisi data KAK/Kontrak.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderList(persiapanFields, setPersiapanFields, 'persiapan')}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="serah_terima">
                <Card>
                    <CardHeader>
                        <CardTitle>Field Dokumen Serah Terima</CardTitle>
                        <CardDescription>Field ini akan muncul saat user mengisi data BAST/BAPHP.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderList(serahTerimaFields, setSerahTerimaFields, 'serah_terima')}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
