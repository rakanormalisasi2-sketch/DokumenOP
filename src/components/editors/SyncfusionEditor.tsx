
import { useRef, useState, useEffect } from 'react';
import {
    DocumentEditorContainerComponent,
    Toolbar,
    Inject,
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
    StylesDialog
} from '@syncfusion/ej2-react-documenteditor';
import { Button } from '@/components/ui/button';
import { Loader2, Save, X } from 'lucide-react';
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

interface SyncfusionEditorProps {
    initialContent?: string; // base64 DOCX or SFDT
    fileName?: string;
    onSave: (content: string) => void;
    onClose: () => void;
}

export default function SyncfusionEditor({
    initialContent,
    fileName = 'document.docx',
    onSave,
    onClose
}: SyncfusionEditorProps) {
    const containerRef = useRef<DocumentEditorContainerComponent>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Default service URL for demo purposes. 
    // In production, you should host your own service.
    const hostUrl = 'https://document.syncfusion.com/web-services/docx-editor/';
    const serviceUrl = hostUrl + 'api/documenteditor/';

    useEffect(() => {
        // Small timeout to ensure component is mounted and ready
        const timer = setTimeout(() => {
            if (containerRef.current?.documentEditor) {
                // Initialize
                setIsLoading(false);
                // Load content if available
                if (initialContent) {
                    loadDocument(initialContent);
                }
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []); // Only run once on mount

    // Watch for changes in initialContent if it loads late
    useEffect(() => {
        if (initialContent && !isLoading && containerRef.current?.documentEditor) {
            // Check if document is already loaded to avoid overwrite loop if needed? 
            // For now, assume if initialContent changes, we reload.
            // loadDocument(initialContent); 
            // Actually, we should probably only load on mount or explicit action to avoid blowing away edits.
        }
    }, [initialContent]);


    const loadDocument = (content: string) => {
        if (!containerRef.current?.documentEditor) return;

        try {
            setIsLoading(true);
            // Clean base64 string if needed
            let base64 = content;
            if (base64.startsWith('data:')) {
                base64 = base64.split(',')[1];
            }

            // Syncfusion open method can handle SFDT or DOCX if serviceUrl is set
            // It expects JSON SFDT or a file. passing base64 directly might need handling.
            // The `open` API typically expects string (SFDT) or Blob (file).

            // Let's try converting base64 to Blob and open that.
            const binaryString = window.atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

            // Create a File object
            const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

            // Open via container
            // Note: This requires the serviceUrl to be functional for DOCX parsing server-side
            containerRef.current.documentEditor.open(file);
            setIsLoading(false);
        } catch (e) {
            console.error("Failed to load document", e);
            toast.error("Gagal memuat dokumen ke editor.");
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!containerRef.current?.documentEditor) return;

        try {
            setIsLoading(true);
            // Save as Blob (DOCX)
            // This also typically requires the server for correct DOCX export if not using purely client-side V2 features 
            // where supported, but 'saveAsBlob' usually works well client-side in newer versions.
            const blob = await containerRef.current.documentEditor.saveAsBlob('Docx');

            // Convert Blob to Base64 to pass back
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const base64data = reader.result as string;
                onSave(base64data);
                setIsLoading(false);
            };
        } catch (e) {
            console.error("Save failed", e);
            toast.error("Gagal menyimpan dokumen.");
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Toolbar Header */}
            <div className="flex items-center justify-between p-2 border-b bg-white">
                <h3 className="text-sm font-semibold truncate max-w-[200px]">{fileName}</h3>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>
                        <X className="w-4 h-4 mr-1" />
                        Tutup
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                        Simpan
                    </Button>
                </div>
            </div>

            {/* Editor Container */}
            <div className="flex-1 relative overflow-hidden bg-gray-100">
                <DocumentEditorContainerComponent
                    ref={containerRef}
                    id="container"
                    height={'100%'}
                    serviceUrl={serviceUrl} // REQUIRED for opening DOCX
                    enableToolbar={true}
                    locale="en-US" // or id
                >
                    <Inject services={[
                        Toolbar, WordExport, SfdtExport, TextExport, Selection, Search, Editor,
                        ContextMenu, OptionsPane, HyperlinkDialog, TableOfContentsDialog, PageSetupDialog,
                        StyleDialog, ListDialog, ParagraphDialog, FontDialog,
                        TablePropertiesDialog, BordersAndShadingDialog, TableOptionsDialog, CellOptionsDialog,
                        StylesDialog
                    ]} />
                </DocumentEditorContainerComponent>

                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    </div>
                )}
            </div>
        </div>
    );
}
