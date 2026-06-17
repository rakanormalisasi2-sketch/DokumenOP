import React, { useRef, useState, useEffect } from 'react';
import {
    DocumentEditorContainerComponent,
    Toolbar,
    WordExport,
    SfdtExport,
    TextExport,
    Selection,
    Search,
    Editor,
    ContextMenu,
    OptionsPane,
    HyperlinkDialog,
    TableOfContentsDialog,
    PageSetupDialog,
    StyleDialog,
    ListDialog,
    ParagraphDialog,
    FontDialog,
    TablePropertiesDialog,
    BordersAndShadingDialog,
    TableOptionsDialog,
    CellOptionsDialog,
    StylesDialog,
    ImageResizer,
    BookmarkDialog,
    Inject,
} from '@syncfusion/ej2-react-documenteditor';
import { Button } from '@/components/ui/button';
import { Loader2, Save, FileText } from 'lucide-react';
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
    initialContent?: string; // Base64 string from DB
    fileName?: string;
    onSave: (content: string) => Promise<void>;
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

    const serviceUrl = 'https://services.syncfusion.com/react/production/api/documenteditor/';

    useEffect(() => {
        if (containerRef.current && initialContent) {
            try {
                let base64 = initialContent;
                if (base64.startsWith('data:')) {
                    base64 = base64.split(',')[1];
                }
                const binaryString = window.atob(base64);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

                const formData = new FormData();
                formData.append('files', blob, fileName);

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
                        toast.error('Gagal memuat dokumen Word. Cek koneksi internet Anda.');
                        setIsLoading(false);
                    });
            } catch (e) {
                console.error("Base64 decode error", e);
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [initialContent, fileName]);

    const handleSave = async () => {
        if (!containerRef.current) return;
        setIsSaving(true);
        try {
            const blob = await containerRef.current.documentEditor.saveAsBlob('Docx');
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                await onSave(base64data);
                toast.success('Dokumen berhasil disimpan');
                setIsSaving(false);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error(err);
            toast.error('Gagal menyimpan dokumen');
            setIsSaving(false);
        }
    };

    const insertMergeField = (fieldName: string) => {
        if (containerRef.current) {
            containerRef.current.documentEditor.editor.insertText(`{{${fieldName}}}`);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            <div className="flex items-center justify-between p-2 pr-10 border-b bg-gray-50 shrink-0">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Kembali
                    </Button>
                    <span className="font-semibold text-sm">{fileName}</span>
                </div>
                <div className="flex items-center gap-2">
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

                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan
                    </Button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm gap-3">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <span className="text-sm font-medium">Memuat Editor Dokumen...</span>
                    </div>
                )}
                <DocumentEditorContainerComponent
                    ref={containerRef}
                    id="container"
                    height="100%"
                    width="100%"
                    serviceUrl={serviceUrl}
                    enableToolbar={true}
                    showPropertiesPane={true}
                >
                    <Inject services={[
                        Toolbar, WordExport, SfdtExport, TextExport, Selection, Search, Editor,
                        ContextMenu, OptionsPane, HyperlinkDialog, TableOfContentsDialog, PageSetupDialog,
                        StyleDialog, ListDialog, ParagraphDialog, FontDialog,
                        TablePropertiesDialog, BordersAndShadingDialog, TableOptionsDialog, CellOptionsDialog,
                        StylesDialog, ImageResizer, BookmarkDialog
                    ]} />
                </DocumentEditorContainerComponent>
            </div>
        </div>
    );
}
