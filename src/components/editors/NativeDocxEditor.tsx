import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DocxEditor, type DocxEditorRef, createEmptyDocument, type Document, PluginHost } from '../../lib/docx-editor';
import { templatePlugin } from '../../lib/docx-editor/plugins/template';
import type { SelectionState } from '../../lib/docx-editor/prosemirror';
import './NativeEditorStyles.css';

interface NativeDocxEditorProps {
    /** Load from URL */
    initialUrl?: string;
    /** Load from File object */
    file?: File | null;
    /** Form values for mail merge — keys are variable names without braces */
    formValues?: Record<string, string>;
    /** Called when user saves */
    onSave?: (blob: Blob, filename: string) => void;
    /** Called when content changes */
    onChange?: (blob: Blob) => void;
    /** Template variable names for insertion menu */
    templateVariables?: string[];
    /** Initial document XML string */
    initialDocumentXml?: string;
    /** Called when the document has finished loading */
    onLoaded?: () => void;
}

export const NativeDocxEditor: React.FC<NativeDocxEditorProps> = ({
    initialUrl,
    file,
    formValues = {},
    onSave,
    onChange,
    templateVariables = [],
    onLoaded,
}) => {
    const editorRef = useRef<DocxEditorRef>(null);
    const [currentDocument, setCurrentDocument] = useState<Document | null>(() => createEmptyDocument());
    const [documentBuffer, setDocumentBuffer] = useState<ArrayBuffer | null>(null);
    const [, setSelection] = useState<SelectionState | null>(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [wordCount, setWordCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [variableMenuOpen, setVariableMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const lastSavedRef = useRef<string>('');

    // Load document from URL or File prop
    useEffect(() => {
        const load = async () => {
            let buffer: ArrayBuffer | null = null;

            if (file) {
                setIsLoading(true);
                try {
                    buffer = await file.arrayBuffer();
                } catch (err) {
                    console.error('Failed to load file', err);
                    return;
                } finally {
                    setIsLoading(false);
                }
            } else if (initialUrl) {
                setIsLoading(true);
                try {
                    // Handle data: URLs (base64) directly — fetch() cannot load data: URLs
                    if (initialUrl.startsWith('data:')) {
                        const base64 = initialUrl.split(',')[1] || initialUrl;
                        const binary = atob(base64);
                        const bytes = new Uint8Array(binary.length);
                        for (let i = 0; i < binary.length; i++) {
                            bytes[i] = binary.charCodeAt(i);
                        }
                        buffer = bytes.buffer;
                    } else {
                        const response = await fetch(initialUrl);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const blob = await response.blob();
                        buffer = await blob.arrayBuffer();
                    }
                } catch (err) {
                    console.error('Failed to load URL', err);
                    return;
                } finally {
                    setIsLoading(false);
                }
            }

            if (buffer) {
                setCurrentDocument(null);
                setDocumentBuffer(buffer);
                setCurrentPage(1);
                setWordCount(0);
                onLoaded?.();
            }
        };

        load();
    }, [file, initialUrl]);

    // Apply mail merge when formValues change
    useEffect(() => {
        if (Object.keys(formValues).length === 0) return;
        if (!editorRef.current) return;

        const applyMerge = async () => {
            const buffer = await editorRef.current!.save();
            if (!buffer) return;

            try {
                const { Unzipper } = await import('jszip');
                const zip = await Unzipper.loadAsync(buffer);
                const docXml = await zip.file('word/document.xml')?.async('string');
                if (!docXml) return;

                let mergedXml = docXml;
                for (const [key, value] of Object.entries(formValues)) {
                    const regex = new RegExp(`\\{${key}\\}`, 'g');
                    mergedXml = mergedXml.replace(regex, value);
                }

                zip.file('word/document.xml', mergedXml);
                const mergedBuffer = await zip.generateAsync({ type: 'arraybuffer' });
                setCurrentDocument(null);
                setDocumentBuffer(mergedBuffer);
            } catch (err) {
                console.error('Mail merge failed', err);
            }
        };

        // Small debounce to avoid excessive re-renders
        const timeout = setTimeout(applyMerge, 300);
        return () => clearTimeout(timeout);
    }, [formValues]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const buffer = await file.arrayBuffer();
            setCurrentDocument(null);
            setDocumentBuffer(buffer);
        } catch (err) {
            console.error('Failed to load DOCX', err);
        }
    }, []);

    const handleSave = useCallback(async () => {
        if (!editorRef.current) return;

        try {
            const buffer = await editorRef.current.save();
            if (!buffer) return;

            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            });

            const filename = 'edited_document.docx';

            if (onSave) {
                onSave(blob, filename);
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Failed to save DOCX', err);
        }
    }, [onSave]);

    const loadSample = useCallback(async () => {
        try {
            const response = await fetch('/sample.docx');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            setCurrentDocument(null);
            setDocumentBuffer(buffer);
        } catch (err) {
            console.error('Failed to load sample DOCX', err);
        }
    }, []);

    const insertVariable = useCallback((name: string) => {
        const view = (editorRef.current as any)?.getEditorRef?.()?.getView?.();
        if (view) {
            const tr = view.state.tr.insertText(`{${name}}`);
            view.dispatch(tr);
            view.focus();
        }
        setVariableMenuOpen(false);
    }, []);

    // Sync zoom, page, word count from editor
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!editorRef.current) return;
            const editor = editorRef.current;

            let doc: any = null;
            try {
                const editorView = (editor as any).getEditorRef?.()?.getView?.();
                if (editorView) doc = editorView.state.doc;
            } catch {
                // ignore
            }

            if (doc) {
                const text = doc.textContent || '';
                const words = text.trim().split(/\s+/).filter(Boolean).length;
                setWordCount(words);
            }

            try {
                const zoom = (editor as any).getZoom?.() ?? 100;
                setZoomLevel(zoom);
            } catch {
                // ignore
            }

            try {
                const page = (editor as any).getCurrentPage?.() ?? 1;
                setCurrentPage(page);
            } catch {
                // ignore
            }

            // Fire onChange on content changes (debounced)
            try {
                const buffer = await editor.save();
                if (buffer) {
                    const key = new Uint8Array(buffer.slice(0, 100)).toString();
                    if (key !== lastSavedRef.current) {
                        lastSavedRef.current = key;
                        if (onChange) {
                            const blob = new Blob([buffer], {
                                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            });
                            onChange(blob);
                        }
                    }
                }
            } catch {
                // ignore
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [onChange]);

    return (
        <div className="native-editor-container flex flex-col h-full bg-slate-100">
            {/* Simple File Menu Bar */}
            <div className="bg-blue-700 text-white text-xs flex items-center px-3 py-1.5 gap-1">
                <span className="font-semibold text-sm px-2">File</span>
                <div className="h-4 w-px bg-blue-400 mx-1" />
                <button
                    onClick={() => document.getElementById('file-input')?.click()}
                    className="hover:bg-blue-600 px-3 py-1 rounded text-xs cursor-pointer transition-colors"
                >
                    Open
                </button>
                <button
                    onClick={handleSave}
                    className="hover:bg-blue-600 px-3 py-1 rounded text-xs cursor-pointer transition-colors"
                >
                    Save
                </button>
                <button
                    onClick={loadSample}
                    className="hover:bg-blue-600 px-3 py-1 rounded text-xs cursor-pointer transition-colors"
                >
                    Load Sample
                </button>
                <button
                    onClick={() => editorRef.current?.print?.()}
                    className="hover:bg-blue-600 px-3 py-1 rounded text-xs cursor-pointer transition-colors"
                >
                    Print
                </button>
                {templateVariables.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setVariableMenuOpen(v => !v)}
                            className="hover:bg-blue-600 px-3 py-1 rounded text-xs cursor-pointer transition-colors flex items-center gap-1"
                        >
                            Insert Variable
                            <span style={{ fontSize: 10 }}>{variableMenuOpen ? '▲' : '▼'}</span>
                        </button>
                        {variableMenuOpen && (
                            <div className="absolute top-full left-0 mt-1 bg-white text-slate-800 rounded shadow-md py-1 z-50 min-w-[160px]">
                                {templateVariables.map(name => (
                                    <button
                                        key={name}
                                        onClick={() => insertVariable(name)}
                                        className="w-full text-left px-4 py-1.5 text-xs hover:bg-blue-50 cursor-pointer"
                                    >
                                        {`{${name}}`}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {isLoading && (
                    <span className="ml-2 text-xs text-blue-200 animate-pulse">Loading...</span>
                )}
                <input
                    id="file-input"
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Editor Surface */}
            <div className="flex-1 overflow-auto bg-[#e5e5e5] p-8 flex justify-center">
                <PluginHost plugins={[templatePlugin]}>
                    <DocxEditor
                        ref={editorRef}
                        document={documentBuffer ? undefined : currentDocument}
                        documentBuffer={documentBuffer}
                        onSelectionChange={setSelection}
                        showToolbar={true}
                        showRuler={true}
                        showZoomControl={true}
                        showPageNumbers={true}
                        showOutline={true}
                        enablePageNavigation={true}
                    />
                </PluginHost>
            </div>

            {/* Status Bar */}
            <div className="bg-blue-600 text-white text-xs py-1 px-4 flex justify-between items-center select-none">
                <div className="flex gap-4 items-center">
                    <span>OOXML Engine Active</span>
                    <span>Page {currentPage}</span>
                    <span>{wordCount} words</span>
                </div>
                <div className="flex gap-4 items-center">
                    <span>Print Layout</span>
                    <span>{zoomLevel}%</span>
                </div>
            </div>
        </div>
    );
};