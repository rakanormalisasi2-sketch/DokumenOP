import React, { useRef, useState, useEffect } from 'react';
import {
    DocumentEditorContainerComponent,
    Toolbar,
    WordExport,
    SfdtExport,
    Inject,
    DocumentEditorContainer,
} from '@syncfusion/ej2-react-documenteditor';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';

// Import Syncfusion styles
import '@syncfusion/ej2-base/styles/material.css';
import '@syncfusion/ej2-buttons/styles/material.css';
import '@syncfusion/ej2-inputs/styles/material.css';
import '@syncfusion/ej2-popups/styles/material.css';
import '@syncfusion/ej2-lists/styles/material.css';
import '@syncfusion/ej2-navigations/styles/material.css';
import '@syncfusion/ej2-splitbuttons/styles/material.css';
import '@syncfusion/ej2-dropdowns/styles/material.css';
import '@syncfusion/ej2-react-documenteditor/styles/material.css';

interface SyncfusionDocumentEditorProps {
    initialContent?: Blob | null; // Passed as Blob for DOCX
    fileName?: string;
    onSave: (content: Blob) => Promise<void>;
    onClose: () => void;
    fields?: { name: string; label: string }[];
}

export default function SyncfusionDocumentEditor({
    initialContent,
    fileName = 'Dokumen.docx',
    onSave,
    onClose,
    fields = []
}: SyncfusionDocumentEditorProps) {
    const containerRef = useRef<DocumentEditorContainerComponent>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Use Syncfusion's demo service for opening DOCX (converts to SFDT)
    // WARNING: This sends data to Syncfusion's public server. For production, host your own.
    const serviceUrl = 'https://services.syncfusion.com/react/production/api/documenteditor/';

    useEffect(() => {
        if (containerRef.current && initialContent) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    // The open API expects a FormData with the file
                    // But the React component has an 'open' method that usually takes SFDT
                    // To open DOCX, we rely on the system behavior or the 'open' API helper
                    // Actually, DocumentEditorContainer has an 'open' method that handles POST to 'Import' endpoint

                    // However, for programmatic load from Blob:
                    const formData = new FormData();
                    formData.append('files', initialContent, fileName);

                    fetch(`${serviceUrl}Import`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => response.json())
                        .then(sfdt => {
                            containerRef.current?.documentEditor.open(JSON.stringify(sfdt));
                            setIsLoading(false);
                        })
                        .catch(err => {
                            console.error('Failed to load document', err);
                            toast.error('Gagal memuat dokumen Word');
                            setIsLoading(false);
                        });
                }
            };
            reader.readAsArrayBuffer(initialContent);
        } else {
            setIsLoading(false);
        }
    }, [initialContent, fileName]);

    const handleSave = async () => {
        if (!containerRef.current) return;
        setIsSaving(true);
        try {
            // Save as Blob (DOCX)
            const blob = await containerRef.current.documentEditor.saveAsBlob('Docx');
            await onSave(blob);
            toast.success('Dokumen berhasil disimpan');
        } catch (err) {
            console.error(err);
            toast.error('Gagal menyimpan dokumen');
        } finally {
            setIsSaving(false);
        }
    };

    const insertMergeField = (fieldName: string) => {
        if (containerRef.current) {
            // Insert standard MergeField
            containerRef.current.documentEditor.editor.insertField('MergeField', fieldName);
        }
    };

    // Custom toolbar item for Merge Fields could be added, 
    // but for now we'll use a sidebar or external button set.

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="flex items-center justify-between p-2 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Kembali
                    </Button>
                    <span className="font-semibold text-sm">{fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                    {/* Simple Field Inserter */}
                    <div className="relative group">
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileText className="w-4 h-4" /> Insert Field
                        </Button>
                        <div className="absolute right-0 top-full mt-1 bg-white border shadow-lg rounded-md p-2 w-48 max-h-60 overflow-y-auto hidden group-hover:block z-50">
                            {fields.length === 0 ? <p className="text-xs text-gray-500 p-2">Tidak ada field</p> :
                                fields.map(f => (
                                    <button
                                        key={f.name}
                                        className="text-left w-full text-sm px-2 py-1 hover:bg-gray-100 rounded"
                                        onClick={() => insertMergeField(f.name)}
                                    >
                                        {f.label}
                                    </button>
                                ))
                            }
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan
                    </Button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                )}
                <DocumentEditorContainerComponent
                    ref={containerRef}
                    id="container"
                    height="100%"
                    serviceUrl={serviceUrl}
                    enableToolbar={true}
                    showPropertiesPane={false}
                >
                    <Inject services={[Toolbar, WordExport, SfdtExport]} />
                </DocumentEditorContainerComponent>
            </div>
        </div>
    );
}
