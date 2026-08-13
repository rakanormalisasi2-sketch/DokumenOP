import React, { useRef, useState, useEffect, useMemo } from 'react';
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
import { Loader2, Save, ArrowLeft, Search as SearchIcon, X, ChevronDown, ChevronRight } from 'lucide-react';
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
    fields?: { name: string; label: string; phase?: string; type?: string }[];
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
    const [showFieldPanel, setShowFieldPanel] = useState(false);
    const [fieldSearch, setFieldSearch] = useState('');
    const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

    const serviceUrl = 'https://document.syncfusion.com/web-services/docx-editor/api/documenteditor/';

    // Filter out file types because files cannot be mailmerged
    const baseMergeFields = fields.filter(f => f.type !== 'file' && f.type !== 'rab_excel_upload');
    const mergeFields: typeof fields = [];
    baseMergeFields.forEach(f => {
        mergeFields.push(f);
        if (f.type === 'date' || f.type === 'date_addition') {
            mergeFields.push({ ...f, name: `${f.name}_standar`, label: `${f.label} (Standar)` });
            mergeFields.push({ ...f, name: `${f.name}_lengkap`, label: `${f.label} (Lengkap)` });
            mergeFields.push({ ...f, name: `${f.name}_hari`, label: `${f.label} (Hari)` });
        }
    });

    // Group fields by phase
    const fieldGroups = useMemo(() => {
        const groups: Record<string, typeof fields> = {};
        mergeFields.forEach(f => {
            const phase = f.phase || 'lainnya';
            if (!groups[phase]) groups[phase] = [];
            groups[phase].push(f);
        });
        return groups;
    }, [mergeFields]);

    // Filtered fields based on search
    const filteredGroups = useMemo(() => {
        if (!fieldSearch.trim()) return fieldGroups;
        const search = fieldSearch.toLowerCase();
        const result: Record<string, typeof fields> = {};
        Object.entries(fieldGroups).forEach(([phase, flds]) => {
            const filtered = flds.filter(f =>
                f.label.toLowerCase().includes(search) ||
                f.name.toLowerCase().includes(search)
            );
            if (filtered.length > 0) result[phase] = filtered;
        });
        return result;
    }, [fieldGroups, fieldSearch]);

    const phaseLabels: Record<string, string> = {
        persiapan: 'Persiapan',
        pelaksanaan: 'Pelaksanaan',
        lainnya: 'Lainnya'
    };

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
            const editor = containerRef.current.documentEditor;

            // Force the editor to serialize its current state first
            // This ensures the latest edits are captured
            const sfdtText = editor.serialize();
            editor.open(sfdtText);

            // Small delay to let the editor re-render after open
            await new Promise(resolve => setTimeout(resolve, 200));

            const blob = await editor.saveAsBlob('Docx');
            console.log('[SyncfusionEditor] Got blob, size:', blob.size);
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64data = reader.result as string;
                    console.log('[SyncfusionEditor] Base64 length:', base64data?.length);
                    await onSave(base64data);
                    toast.success('✅ Dokumen berhasil disimpan!');
                } catch (saveErr) {
                    console.error('[SyncfusionEditor] onSave error:', saveErr);
                    toast.error('Gagal menyimpan ke storage: ' + (saveErr as Error).message);
                } finally {
                    setIsSaving(false);
                }
            };
            reader.onerror = () => {
                toast.error('Gagal membaca dokumen');
                setIsSaving(false);
            };
            reader.readAsDataURL(blob);
        } catch (err) {
            console.error('[SyncfusionEditor] handleSave error:', err);
            toast.error('Gagal menyimpan dokumen: ' + (err as Error).message);
            setIsSaving(false);
        }
    };

    const insertMergeField = (fieldName: string) => {
        if (containerRef.current) {
            containerRef.current.documentEditor.editor.insertText(`{{${fieldName}}}`);
            toast.success(`Field "{{${fieldName}}}" berhasil disisipkan`);
        }
    };

    const toggleSection = (phase: string) => {
        setCollapsedSections(prev => ({ ...prev, [phase]: !prev[phase] }));
    };

    return (
        <div className="flex flex-col h-full w-full bg-white relative">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50 shrink-0" style={{ zIndex: 60 }}>
                <div className="flex items-center gap-3">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={onClose}
                        className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
                    </Button>
                    <span className="font-semibold text-sm text-gray-700">{fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={showFieldPanel ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFieldPanel(prev => !prev)}
                        className={`gap-2 ${showFieldPanel ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                    >
                        <SearchIcon className="w-4 h-4" />
                        Insert Field
                    </Button>

                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        size="sm"
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md px-5"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Simpan
                    </Button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Document Editor */}
                <div className={`flex-1 relative overflow-hidden transition-all duration-200 ${showFieldPanel ? 'mr-0' : ''}`}>
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

                {/* Insert Field Sidebar Panel */}
                {showFieldPanel && (
                    <div className="w-72 border-l bg-white flex flex-col shrink-0 shadow-lg" style={{ zIndex: 55 }}>
                        {/* Panel Header */}
                        <div className="px-3 py-3 border-b bg-indigo-50 flex items-center justify-between shrink-0">
                            <h3 className="font-semibold text-sm text-indigo-800">Insert Field</h3>
                            <button
                                onClick={() => setShowFieldPanel(false)}
                                className="p-1 hover:bg-indigo-100 rounded transition-colors"
                            >
                                <X className="w-4 h-4 text-indigo-600" />
                            </button>
                        </div>

                        {/* Search Box */}
                        <div className="px-3 py-2 border-b shrink-0">
                            <div className="relative">
                                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari field..."
                                    value={fieldSearch}
                                    onChange={e => setFieldSearch(e.target.value)}
                                    className="w-full pl-8 pr-8 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                                    autoFocus
                                />
                                {fieldSearch && (
                                    <button
                                        onClick={() => setFieldSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded"
                                    >
                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Hint */}
                        <div className="px-3 py-2 border-b bg-blue-50 shrink-0">
                            <p className="text-xs text-blue-700">
                                Klik field di bawah untuk menyisipkan kode placeholder di posisi kursor saat ini.
                            </p>
                        </div>

                        {/* Field List */}
                        <div className="flex-1 overflow-y-auto">
                            {Object.keys(filteredGroups).length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-400">
                                    {fieldSearch ? 'Tidak ada field yang cocok' : 'Tidak ada field tersedia'}
                                </div>
                            ) : (
                                Object.entries(filteredGroups).map(([phase, flds]) => (
                                    <div key={phase} className="border-b last:border-b-0">
                                        {/* Section Header */}
                                        <button
                                            onClick={() => toggleSection(phase)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase text-gray-500 hover:bg-gray-50 transition-colors"
                                        >
                                            {collapsedSections[phase] ? (
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            ) : (
                                                <ChevronDown className="w-3.5 h-3.5" />
                                            )}
                                            {phaseLabels[phase] || phase}
                                            <span className="ml-auto text-gray-300 font-normal normal-case">
                                                {flds.length}
                                            </span>
                                        </button>

                                        {/* Field Items */}
                                        {!collapsedSections[phase] && (
                                            <div className="pb-1">
                                                {flds.map(f => (
                                                    <button
                                                        key={f.name}
                                                        className="w-full text-left px-4 py-1.5 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex flex-col gap-0"
                                                        onClick={() => insertMergeField(f.name)}
                                                        title={`Sisipkan {{${f.name}}}`}
                                                    >
                                                        <span className="truncate">{f.label}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono truncate">
                                                            {`{{${f.name}}}`}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
