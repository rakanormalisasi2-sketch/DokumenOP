
import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MassDocumentGenerator from '@/components/admin/MassDocumentGenerator';
import { useData } from '@/contexts/DataContext';

export default function AdminContractDocs() {
    const [activeTab, setActiveTab] = useState('kak');
    const { templates, fields } = useData();

    // Filter templates based on tab
    const kakTemplates = templates.filter(t => t.type?.includes('kak') || t.name.toLowerCase().includes('kak'));
    // Fallback if no specific KAK templates found in DB, we might want to ensure they exist or use generic logic
    // For now, let's assume 'kak_perencanaan' and 'kak_konsultansi' exist or user can add them.

    // For Contracts: filter 27 formats (Non-KAK, Non-Nota, and Phase: Persiapan)
    const contractTemplates = templates.filter(t =>
        !t.type?.includes('kak') &&
        !t.type?.includes('nota') &&
        t.phase === 'persiapan'
    );

    // For Nota Dinas
    const notaTemplates = templates.filter(t => t.type?.includes('nota') || t.name.toLowerCase().includes('nota'));

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Buat Dokumen Kontrak</h1>
                    <p className="text-muted-foreground mt-1">Generate KAK, Kontrak, dan Nota Dinas (Manual atau Masal).</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="kak">Buat KAK</TabsTrigger>
                        <TabsTrigger value="kontrak">Buat Kontrak</TabsTrigger>
                        <TabsTrigger value="nota">Buat Nota Dinas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="kak">
                        <MassDocumentGenerator
                            title="Generate Kerangka Acuan Kerja (KAK)"
                            description="Pilih template KAK (Perencanaan/Konsultansi) dan isi data."
                            mode="kak"
                            templates={kakTemplates}
                            fields={fields} // Will be filtered to 'persiapan' inside component
                        />
                    </TabsContent>

                    <TabsContent value="kontrak">
                        <MassDocumentGenerator
                            title="Generate Dokumen Kontrak"
                            description="Pilih salah satu dari 27 Format Kontrak yang tersedia."
                            mode="kontrak"
                            templates={contractTemplates}
                            fields={fields}
                        />
                    </TabsContent>

                    <TabsContent value="nota">
                        <MassDocumentGenerator
                            title="Generate Nota Dinas"
                            description="Buat Nota Dinas terkait proses pengadaan."
                            mode="nota"
                            templates={notaTemplates}
                            fields={fields}
                        />
                    </TabsContent>

                </Tabs>
            </div>
        </AdminLayout>
    );
}
