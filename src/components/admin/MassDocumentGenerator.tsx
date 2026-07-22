
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField, DocumentTemplate } from '@/types';
import { Download, Upload, FileText, Check, Trash2, Loader2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { formatTerbilang } from '@/lib/terbilang';
import { enrichSubmissionData } from '@/lib/enrichData';
import { useData } from '@/contexts/DataContext';
import DOMPurify from 'dompurify';

interface MassDocumentGeneratorProps {
    title: string;
    description: string;
    mode: 'kak' | 'kontrak' | 'nota';
    templates: DocumentTemplate[];
    fields: FormField[];
}

export default function MassDocumentGenerator({
    title,
    description,
    mode,
    templates,
    fields,
}: MassDocumentGeneratorProps) {
    const { contractDrafts, addContractDraft, deleteContractDraft, submissions } = useData();
    const modeDrafts = contractDrafts.filter(d => d.type === mode);

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [manualData, setManualData] = useState<Record<string, string>>({});
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>('none');

    const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter fields to show as columns/inputs. 
    // Persiapan fields have showInAdmin property, and Pelaksanaan might have showIn
    const preparationFields = fields.filter(f =>
        (f.phase === 'persiapan' && f.showInAdmin?.includes(mode)) ||
        (f.phase === 'pelaksanaan' && f.showIn.includes('awal')) // Or however we want them
    );

    const handleManualChange = (key: string, value: string) => {
        setManualData(prev => ({ ...prev, [key]: value }));
    };

    const downloadExcelTemplate = () => {
        // Create headers from fields
        const headers = preparationFields.map(f => f.label);
        const keys = preparationFields.map(f => f.name);

        // Add a detailed instruction row or just headers
        // Row 1: Keys (Hidden helper) - actually let's just use Labels for user friendliness and map back
        // But for simplicity, let's use Labels as headers.

        const ws = XLSX.utils.aoa_to_sheet([
            headers, // Row 1: Headers
            ['Contoh Isi 1', 'Contoh Isi 2'] // Row 2: Example
        ]);

        // Add comments or metadata if needed? No, let's keep it simple.

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Data");
        XLSX.writeFile(wb, `Template_${mode}_${new Date().getTime()}.xlsx`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

            if (data.length < 2) {
                toast.error("File Excel kosong atau format salah");
                return;
            }

            const headers = data[0] as string[];
            const rows = data.slice(1);

            // Map headers to field keys
            const mappedData = rows.map((row) => {
                const rowData: Record<string, string> = {};
                headers.forEach((header, index) => {
                    // Find corresponding field by Label
                    const field = preparationFields.find(f => f.label.toLowerCase() === header.toLowerCase());
                    if (field) {
                        rowData[field.name] = row[index]?.toString() || '';
                    } else {
                        // Keep distinct extra columns if needed, or ignore
                        rowData[header] = row[index]?.toString() || '';
                    }
                });
                return rowData;
            });

            // Save to context
            mappedData.forEach(data => {
                addContractDraft({ type: mode, data });
            });

            toast.success(`${mappedData.length} data berhasil diimport`);
            if (fileInputRef.current) fileInputRef.current.value = '';
        };
        reader.readAsBinaryString(file);
    };

    const handleSaveManualData = () => {
        addContractDraft({ type: mode, data: manualData });
        toast.success("Data berhasil disimpan ke daftar isian.");
        setManualData({}); // Reset
    };

    const handleDeleteAll = () => {
        if (confirm('Hapus semua data tersimpan di tab ini?')) {
            modeDrafts.forEach(d => deleteContractDraft(d.id));
            setSelectedDraftIds([]);
        }
    };

    const generateDocument = async (draftsData: Record<string, string>[], isMass: boolean) => {
        if (!selectedTemplateId) {
            toast.error("Pilih template terlebih dahulu");
            return;
        }

        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template) return;

        setIsGenerating(true);
        setGenProgress(0);

        try {
            const { default: HTMLtoDOCX } = await import('html-to-docx');
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            let generatedCount = 0;
            const BATCH_SIZE = 3; // Process 3 docs at a time to keep UI responsive

            for (let i = 0; i < draftsData.length; i += BATCH_SIZE) {
                const batch = draftsData.slice(i, i + BATCH_SIZE);

                await Promise.all(batch.map(async (item, batchIdx) => {
                    const globalIdx = i + batchIdx;
                    let htmlContent = template.content;

                    // Enrich data (terbilang, date formatting, +90 days, etc)
                    const enrichedItem = enrichSubmissionData(item, fields);

                    // Replace placeholders in HTML {{key}} -> value
                    Object.keys(enrichedItem).forEach(key => {
                        const regex = new RegExp(`{{${key}}}`, 'g');
                        const value = enrichedItem[key];
                        if (value !== undefined && value !== null) {
                            htmlContent = htmlContent.replace(regex, DOMPurify.sanitize(String(value)));
                        }
                    });

                    const fileBuffer = await HTMLtoDOCX(htmlContent, null, {
                        table: { row: { cantSplit: true } },
                        footer: true,
                        pageNumber: true,
                    });

                    const validFileName = (item['nama_pekerjaan'] || item['nomor_kontrak'] || `Dokumen_${globalIdx + 1}`).replace(/[^a-z0-9]/gi, '_');
                    const fileName = `${validFileName}.docx`;

                    if (isMass) {
                        zip.file(fileName, fileBuffer);
                    } else {
                        saveAs(fileBuffer, fileName);
                    }
                    generatedCount++;
                }));

                // Update progress and yield to UI thread between batches
                setGenProgress(Math.round(((i + BATCH_SIZE) / draftsData.length) * 100));
                await new Promise(r => setTimeout(r, 0));
            }

            if (isMass && generatedCount > 0) {
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, `Batch_${mode}_${new Date().getTime()}.zip`);
            }

            toast.success(`Berhasil membuat ${generatedCount} dokumen!`);

        } catch (error) {
            console.error(error);
            toast.error("Gagal membuat dokumen: " + (error as Error).message);
        } finally {
            setIsGenerating(false);
            setGenProgress(0);
        }
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Template Selection */}
                    <div className="space-y-2">
                        <Label>Pilih Template / Format</Label>
                        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih Template..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Tabs defaultValue="tersimpan" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="tersimpan">Data Tersimpan ({modeDrafts.length})</TabsTrigger>
                            <TabsTrigger value="manual">Input Manual</TabsTrigger>
                            <TabsTrigger value="mass">Upload Excel (Masal)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="manual" className="space-y-4 pt-4">
                            <div className="flex flex-col gap-4 border p-4 rounded-md bg-gray-50/50">
                                <div className="space-y-2 border-b pb-4">
                                    <Label className="font-semibold text-primary">Ambil dari Data Responden (Opsional)</Label>
                                    <Select
                                        value={selectedSubmissionId}
                                        onValueChange={(val) => {
                                            setSelectedSubmissionId(val);
                                            if (val !== 'none') {
                                                const sub = submissions.find(s => s.id === val);
                                                if (sub && sub.data) {
                                                    // Auto fill with respondent's data
                                                    // Only overwrite if sub has the key
                                                    setManualData(prev => ({ ...prev, ...sub.data }));
                                                    toast.success(`Data dari ${sub.respondentName} berhasil diisi otomatis.`);
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Pilih Data Pengajuan Responden..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Isi Manual Saja --</SelectItem>
                                            {submissions.map(s => (
                                                <SelectItem key={s.id} value={s.id}>
                                                    {s.respondentName} - {s.data['nama_pekerjaan'] || 'Tanpa Nama Pekerjaan'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Pilih pengajuan untuk mengisi otomatis field yang sama (seperti Nama Pekerjaan, Lokasi, dll).</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    {preparationFields.map(field => (
                                        <div key={field.id} className="space-y-1">
                                            <Label className="text-xs">{field.label}</Label>
                                            <Input
                                                value={manualData[field.name] || ''}
                                                onChange={(e) => handleManualChange(field.name, e.target.value)}
                                                placeholder={`{{${field.name}}}`}
                                                className="bg-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    className="w-full"
                                    onClick={handleSaveManualData}
                                >
                                    Simpan ke Daftar
                                </Button>
                                <Button
                                    className="w-full"
                                    onClick={() => generateDocument([manualData], false)}
                                    disabled={isGenerating || !selectedTemplateId}
                                    variant="secondary"
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                                    Generate Langsung
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="mass" className="space-y-4 pt-4">
                            {/* Actions Bar */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-blue-900">1. Download Template</p>
                                    <Button variant="outline" size="sm" onClick={downloadExcelTemplate} className="bg-white hover:bg-blue-50">
                                        <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                                        Download Excel Template
                                    </Button>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-blue-900">2. Upload Data</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="bg-white hover:bg-blue-50">
                                            <Upload className="w-4 h-4 mr-2 text-blue-600" />
                                            Upload Excel
                                        </Button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".xlsx, .xls"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="tersimpan" className="space-y-4 pt-4">
                            {/* Data Table */}
                            <div className="border rounded-md overflow-hidden">
                                <div className="p-2 bg-gray-100 border-b flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{modeDrafts.length} Data Tersimpan</span>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-8" onClick={handleDeleteAll}>
                                        <Trash2 className="w-4 h-4 mr-2" /> Hapus Semua
                                    </Button>
                                </div>
                                <div className="overflow-auto max-h-[300px]">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[50px]">
                                                    <Checkbox
                                                        checked={selectedDraftIds.length === modeDrafts.length && modeDrafts.length > 0}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) setSelectedDraftIds(modeDrafts.map(d => d.id));
                                                            else setSelectedDraftIds([]);
                                                        }}
                                                    />
                                                </TableHead>
                                                <TableHead>No</TableHead>
                                                {preparationFields.slice(0, 4).map(f => (
                                                    <TableHead key={f.id}>{f.label}</TableHead>
                                                ))}
                                                <TableHead>...</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {modeDrafts.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                        Belum ada data isian tersimpan. Silakan input manual atau upload excel.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {modeDrafts.map((draft, idx) => (
                                                <TableRow key={draft.id}>
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedDraftIds.includes(draft.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) setSelectedDraftIds(prev => [...prev, draft.id]);
                                                                else setSelectedDraftIds(prev => prev.filter(id => id !== draft.id));
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{idx + 1}</TableCell>
                                                    {preparationFields.slice(0, 4).map(f => (
                                                        <TableCell key={f.id} className="max-w-[150px] truncate">
                                                            {draft.data[f.name] || '-'}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell className="text-muted-foreground text-xs">+{Object.keys(draft.data).length - 4} columns</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => deleteContractDraft(draft.id)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="p-4 bg-gray-50 border-t">
                                    <Button
                                        className="w-full"
                                        disabled={selectedDraftIds.length === 0 || isGenerating || !selectedTemplateId}
                                        onClick={() => {
                                            const selectedData = modeDrafts.filter(d => selectedDraftIds.includes(d.id)).map(d => d.data);
                                            generateDocument(selectedData, true);
                                        }}
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                                        Generate {selectedDraftIds.length} Dokumen Terpilih
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </CardContent>
        </Card>
    );
}
