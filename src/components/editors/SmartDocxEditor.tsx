import { useState, useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import mammoth from 'mammoth';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Loader2, Download, X, FileText, Wand2, Pencil, Save, Plus,
    ZoomIn, ZoomOut, Minus,
    Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Image as ImageIcon, Link as LinkIcon, Table as TableIcon,
    Undo, Redo, Printer, Type, Palette, Highlighter,
    LayoutTemplate, FileOutput, Settings, ChevronDown, Check
} from 'lucide-react';
import { generateDocument, detectVariables } from '@/lib/docxUtils';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Ruler } from './Ruler';
import { TabStop, TabType } from '@/lib/rulerUtils';
import { Ribbon } from './Ribbon';
import { PageSetupDialog } from './PageSetupDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// @ts-ignore
import HTMLtoDOCX from 'html-to-docx';

interface SmartDocxEditorProps {
    file: File | null;
    initialUrl?: string;
    onClose: () => void;
}

export default function SmartDocxEditor({ file, initialUrl, onClose }: SmartDocxEditorProps) {
    const { fields } = useData();
    const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [variables, setVariables] = useState<string[]>([]);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [editorRef, setEditorRef] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // Layout State
    const [zoomLevel, setZoomLevel] = useState(100);
    const [pageSize, setPageSize] = useState<{ width: number, height: number }>({ width: 21, height: 29.7 }); // cm (A4)
    const [pageMargins, setPageMargins] = useState({ top: 2.54, bottom: 2.54, left: 2.54, right: 2.54 }); // cm
    const [pageOrientation, setPageOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [pageColumns, setPageColumns] = useState(1);
    const [showRuler, setShowRuler] = useState(true);
    const [showGridlines, setShowGridlines] = useState(false);
    const [showPageSetup, setShowPageSetup] = useState(false);
    const [tabStops, setTabStops] = useState<TabStop[]>([]);
    const [activeTabType, setActiveTabType] = useState<TabType>('left');

    // Indents State (in CM, relative to margin/content)
    // left: margin-left
    // right: margin-right
    // firstLine: text-indent
    const [indents, setIndents] = useState({ left: 0, right: 0, firstLine: 0 });

    // Header/Footer Content (Simple string for now, could be HTML)
    const [headerContent, setHeaderContent] = useState('');
    const [footerContent, setFooterContent] = useState('');

    // Auto page break - number of pages based on content overflow
    const [pageCount, setPageCount] = useState(1);

    // Process HTML to protect variables
    const protectVariables = (html: string) => {
        // Regex to find {{variable}}
        // We wrap them in a span with mceNonEditable class
        return html.replace(/\{\{([^}]+)\}\}/g, '<span class="mceNonEditable" style="background-color: #e0f2fe; border: 1px dashed #0284c7; padding: 0 4px; border-radius: 4px; display: inline-block;">{{$1}}</span>');
    };

    // Helper: Parse any CSS length to CM
    const parseStyleToCm = (val: string | number): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val; // assume already scaled if number? No, usually string.
        const strVal = String(val).trim();
        const num = parseFloat(strVal);
        if (isNaN(num)) return 0;

        if (strVal.endsWith('cm')) return num;
        if (strVal.endsWith('mm')) return num / 10;
        if (strVal.endsWith('in')) return num * 2.54;
        if (strVal.endsWith('pt')) return num * (2.54 / 72);
        if (strVal.endsWith('px')) return num * (2.54 / 96);
        return num; // fallback, treat as px?
    };

    // Initialize from File or URL
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                let blob: Blob;

                if (file) {
                    blob = file;
                } else if (initialUrl) {
                    const response = await fetch(initialUrl);
                    blob = await response.blob();
                } else {
                    return;
                }

                setOriginalBlob(blob);

                // Convert to HTML (Mammoth)
                const arrayBuffer = await blob.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });

                // Protect variables in the HTML
                const protectedHtml = protectVariables(result.value);
                setPreviewHtml(protectedHtml);

                // Detect Variables
                const rawResult = await mammoth.extractRawText({ arrayBuffer });
                const detected = detectVariables(rawResult.value);
                setVariables(detected);

                const initialValues: Record<string, string> = {};
                detected.forEach(v => initialValues[v] = '');
                setFormValues(initialValues);

            } catch (e) {
                console.error("Initialization Failed", e);
                toast.error("Gagal memuat dokumen.");
            } finally {
                setIsLoading(false);
            }
        };

        if (file || initialUrl) {
            init();
        }
    }, [file, initialUrl]);

    // Format Painter State
    const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
    const [copiedFormat, setCopiedFormat] = useState<any>(null);

    // Format Painter Logic
    const toggleFormatPainter = () => {
        if (!editorRef) return;

        if (isFormatPainterActive) {
            // Deactivate
            setIsFormatPainterActive(false);
            setCopiedFormat(null);
            editorRef.getBody().style.cursor = 'auto';
        } else {
            // Activate: Copy current format
            const node = editorRef.selection.getNode();
            if (node) {
                const computed = editorRef.dom.getStyle(node, ['font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'color', 'background-color'], true);
                setCopiedFormat(computed);
                setIsFormatPainterActive(true);
                editorRef.getBody().style.cursor = 'copy';
                toast.info("Format disalin. Pilih teks untuk menerapkan.");
            }
        }
    };

    // Apply Format on Selection
    useEffect(() => {
        if (!editorRef || !isFormatPainterActive || !copiedFormat) return;

        const handleMouseUp = () => {
            if (isFormatPainterActive && copiedFormat) {
                const fmt = copiedFormat;
                // Apply styles iteratively
                // Note: This is an approximation. TinyMCE best works with 'Formats' but exact CSS application is acceptable.
                editorRef.execCommand('FontName', false, fmt['font-family']);
                editorRef.execCommand('FontSize', false, fmt['font-size']);
                if (parseInt(fmt['font-weight']) > 400 || fmt['font-weight'] === 'bold') editorRef.execCommand('Bold');
                if (fmt['font-style'] === 'italic') editorRef.execCommand('Italic');
                // Decoration needs parsing but let's skip for now or check basic underline
                if (fmt['text-decoration'].includes('underline')) editorRef.execCommand('Underline');

                editorRef.execCommand('ForeColor', false, fmt['color']);
                editorRef.execCommand('HiliteColor', false, fmt['background-color']);

                setIsFormatPainterActive(false);
                setCopiedFormat(null);
                editorRef.getBody().style.cursor = 'auto';
                toast.success("Format diterapkan!");
            }
        };

        editorRef.on('MouseUp', handleMouseUp);
        return () => editorRef.off('MouseUp', handleMouseUp);
    }, [editorRef, isFormatPainterActive, copiedFormat]);

    // Helpers for Ribbon
    const changeFontSize = (delta: number) => {
        if (!editorRef) return;
        const node = editorRef.selection.getNode();
        const currentSize = editorRef.dom.getStyle(node, 'font-size', true);
        let val = parseFloat(currentSize);
        // Default to pt logic if px
        // 1pt approx 1.33px, 1px = 0.75pt
        let unit = 'pt';
        if (currentSize.includes('px')) {
            val = Math.round(val * 0.75);
        } else if (currentSize.includes('pt')) {
            unit = 'pt';
        }

        // Clamp
        const newSize = Math.max(8, val + delta);
        editorRef.execCommand('FontSize', false, `${newSize}${unit}`);
    };

    const focusArea = (area: 'header' | 'footer') => {
        // Focus logic or scroll
        // Since we don't have separate editors yet, we simulate or just toast
        toast.info(`Fokus ke ${area} (Area layout)`);
        // If we had IDs:
        // document.getElementById(`page-${area}`)?.scrollIntoView({ behavior: 'smooth' });
    };

    // Bi-directional Sync: Editor -> Ruler
    useEffect(() => {
        if (!editorRef) return;

        const handleNodeChange = () => {
            const node = editorRef.selection.getNode();
            if (!node) return;

            // Indents
            const computed = editorRef.dom.getStyle(node, ['margin-left', 'margin-right', 'text-indent'], true);
            const left = parseStyleToCm(computed['margin-left']);
            const right = parseStyleToCm(computed['margin-right']);
            const firstLine = parseStyleToCm(computed['text-indent']);
            setIndents({ left, right, firstLine });

            // Tab Stops (Read from attribute)
            const tabStopsAttr = editorRef.dom.getAttrib(node, 'data-tab-stops');
            if (tabStopsAttr) {
                try {
                    const parsedStops = JSON.parse(tabStopsAttr) as TabStop[];
                    setTabStops(parsedStops);
                } catch (e) {
                    console.error("Failed to parse tab stops", e);
                    setTabStops([]);
                }
            } else {
                setTabStops([]);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const selection = editorRef.selection;
                const rng = selection.getRng();
                if (!rng) return;

                // 1. Get Caret Position (Client Rect)
                // We need a rect. If collapsed, getBoundingClientRect might return 0 width.
                let rect = rng.getBoundingClientRect();

                // Fallback if no rect (e.g. empty line)
                if (rect.width === 0 && rect.height === 0) {
                    const node = selection.getNode();
                    rect = node.getBoundingClientRect();
                    // This gives the block node rect, not caret. 
                    // TinyMCE has 'selection.getRng().getClientRects()[0]' usually.
                }

                // Better approach for caret X in TinyMCE:
                // Use a temporary span to measure exact position?
                // Or use the editor body relative calculation.

                const editorBody = editorRef.getBody();
                const bodyRect = editorBody.getBoundingClientRect();

                // Current absolute X
                // Note: This matches the "Page" visual X if zoom is 100%
                // We need to map this to our "Rule" CM units.
                const caretX_px = rect.left - bodyRect.left;

                // Convert PX to CM (Assuming 96 DPI for simplistic calc, but we have rulerUtils)
                // UNITS['cm'] = 37.795 px.
                // However, we rely on what the Ruler uses.
                const pxPerCm = 37.795;
                const caretX_cm = caretX_px / pxPerCm;

                // Find next Tab Stop
                // Default stops every 1.27 cm (0.5 inch)
                let nextStop = -1;

                // Check custom tab stops first
                const sortedStops = [...tabStops].sort((a, b) => a.position - b.position);
                for (const stop of sortedStops) {
                    if (stop.position > caretX_cm + 0.1) { // +0.1 tolerance
                        nextStop = stop.position;
                        break;
                    }
                }

                // If no custom stop, use default interval
                if (nextStop === -1) {
                    const defaultInterval = 1.27;
                    nextStop = Math.ceil((caretX_cm + 0.1) / defaultInterval) * defaultInterval;
                }

                // Calculate Gap
                let gapCm = nextStop - caretX_cm;
                if (gapCm < 0.1) gapCm = 1.27; // Min gap

                // Insert Spacer
                // Using &emsp; is not precise. 
                // Using <span style="display:inline-block; width: ..."> is precise but might be tricky with cursors.
                // Let's try the span approach.
                const spanContent = `<span style="display: inline-block; width: ${gapCm.toFixed(2)}cm;" data-mce-tab-stop="true">&nbsp;</span>`;
                editorRef.insertContent(spanContent);
            }
        };

        editorRef.on('NodeChange', handleNodeChange);
        editorRef.on('KeyUp', handleNodeChange);
        editorRef.on('MouseUp', handleNodeChange);
        editorRef.on('KeyDown', handleKeyDown);

        return () => {
            editorRef.off('NodeChange', handleNodeChange);
            editorRef.off('KeyUp', handleNodeChange);
            editorRef.off('MouseUp', handleNodeChange);
            editorRef.off('KeyDown', handleKeyDown);
        };
    }, [editorRef, tabStops]);

    // Handle Tab Stop Changes (State + DOM Persistence)
    const handleTabStopChange = (newStops: TabStop[]) => {
        setTabStops(newStops);
        if (editorRef) {
            const node = editorRef.selection.getNode();
            if (node) {
                editorRef.dom.setAttrib(node, 'data-tab-stops', JSON.stringify(newStops));
            }
        }
    };

    // Auto Page Break: Monitor content height and calculate page count
    useEffect(() => {
        if (!editorRef) return;

        const checkContentOverflow = () => {
            const body = editorRef.getBody();
            if (!body) return;

            // Calculate content height in px
            const contentHeight = body.scrollHeight;

            // Calculate single page content height in px (page height minus margins)
            const pxPerCm = 37.795;
            const pageContentHeightCm = pageSize.height - pageMargins.top - pageMargins.bottom;
            const pageContentHeightPx = pageContentHeightCm * pxPerCm;

            // Calculate required pages (minimum 1)
            const requiredPages = Math.max(1, Math.ceil(contentHeight / pageContentHeightPx));

            if (requiredPages !== pageCount) {
                setPageCount(requiredPages);
            }
        };

        // Check on content change
        editorRef.on('input', checkContentOverflow);
        editorRef.on('Change', checkContentOverflow);
        editorRef.on('NodeChange', checkContentOverflow);

        // Initial check
        setTimeout(checkContentOverflow, 500);

        return () => {
            editorRef.off('input', checkContentOverflow);
            editorRef.off('Change', checkContentOverflow);
            editorRef.off('NodeChange', checkContentOverflow);
        };
    }, [editorRef, pageSize.height, pageMargins.top, pageMargins.bottom, pageCount]);

    // Cycle Tab Types
    const cycleTabType = () => {
        const types: TabType[] = ['left', 'center', 'right', 'decimal'];
        const currentIndex = types.indexOf(activeTabType);
        const nextIndex = (currentIndex + 1) % types.length;
        setActiveTabType(types[nextIndex]);
    };

    const getTabIcon = (type: TabType) => {
        switch (type) {
            case 'center': return <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6,2 L6,10 M2,10 L10,10" stroke="black" strokeWidth="1.5" fill="none" /></svg>;
            case 'right': return <svg width="12" height="12" viewBox="0 0 12 12"><path d="M10,2 L10,10 L2,10" stroke="black" strokeWidth="1.5" fill="none" /></svg>;
            case 'decimal': return <svg width="12" height="12" viewBox="0 0 12 12"><path d="M6,2 L6,10 M2,10 L10,10" stroke="black" strokeWidth="1.5" fill="none" /><circle cx="8" cy="8" r="1.5" fill="black" /></svg>;
            case 'left': default: return <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2,2 L2,10 L10,10" stroke="black" strokeWidth="1.5" fill="none" /></svg>;
        }
    };


    const handleFormChange = (key: string, value: string) => {
        setFormValues(prev => ({ ...prev, [key]: value }));
    };

    const handleDownloadResult = async () => {
        if (!originalBlob) return;
        try {
            setIsLoading(true);
            const newBlob = await generateDocument(originalBlob, formValues);
            saveAs(newBlob, `Generated_${file?.name || 'document.docx'}`);
            toast.success("Dokumen berhasil dibuat!");
        } catch (e: any) {
            console.error(e);
            toast.error(`Gagal membuat dokumen: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!editorRef) return;
        try {
            setIsLoading(true);
            const contentHtml = editorRef.getContent();
            const fileBuffer = await HTMLtoDOCX(contentHtml, null, {
                table: { row: { cantSplit: true } },
                footer: true,
                pageNumber: true,
            });
            const newBlob = new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            saveAs(newBlob, `Updated_Template_${file?.name || 'doc.docx'}`);
            toast.success("Template berhasil disimpan!");
        } catch (e: any) {
            console.error(e);
            toast.error(`Gagal menyimpan template: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const insertVariable = (fieldName: string) => {
        if (editorRef) {
            // Insert protected variable
            editorRef.insertContent(`<span class="mceNonEditable" style="background-color: #e0f2fe; border: 1px dashed #0284c7; padding: 0 4px; border-radius: 4px; display: inline-block;">{{${fieldName}}}</span>`);
        }
    };

    return (
        <div className="flex h-full bg-background border rounded-lg overflow-hidden flex-col md:flex-row">
            {/* Left/Center: Editor Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#f3f4f6]">

                {/* === RIBBON UI === */}
                <div className="bg-white border-b shadow-sm z-20 flex flex-col">
                    {/* Top Bar: Title & Window Controls */}
                    <div className="flex items-center justify-between px-4 py-2 bg-[#2b579a] text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-1 bg-white/10 rounded">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold leading-none">{file?.name || "Dokumen Baru"}</h1>
                                <span className="text-[10px] opacity-80">{isEditMode ? "Mode Edit layout" : "Mode Pratinjau"}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-white/10 rounded-md px-2 py-1 mr-4">
                                <Label htmlFor="mode-switch" className="text-xs font-medium cursor-pointer select-none text-white">Edit Mode</Label>
                                <Switch
                                    id="mode-switch"
                                    checked={isEditMode}
                                    onCheckedChange={setIsEditMode}
                                    className="data-[state=checked]:bg-green-500"
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-500 hover:text-white text-white/80 h-8 w-8">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Ribbon UI Component */}
                    <Ribbon
                        editor={editorRef}
                        onInsertVariable={() => {
                            toast.info("Silakan pilih variabel dari panel kanan");
                        }}
                        isEditMode={isEditMode}
                        onPageSetupChange={(type, value) => {
                            if (type === 'margin') {
                                const val = parseFloat(value);
                                setPageMargins({ top: val, bottom: val, left: val, right: val });
                            }
                            if (type === 'size') {
                                setPageSize(value);
                            }
                            if (type === 'orientation') {
                                setPageOrientation(value);
                                if (value === 'landscape') {
                                    setPageSize({ width: 29.7, height: 21 });
                                } else {
                                    setPageSize({ width: 21, height: 29.7 });
                                }
                            }
                            if (type === 'columns') setPageColumns(value);
                        }}
                        onPageSetupClick={() => setShowPageSetup(true)}
                        showRuler={showRuler}
                        onToggleRuler={() => setShowRuler(!showRuler)}
                        showGridlines={showGridlines}
                        onToggleGridlines={() => {
                            const newState = !showGridlines;
                            setShowGridlines(newState);
                            if (editorRef) {
                                editorRef.execCommand('mceVisualBlocks');
                            }
                        }}
                        onToggleFormatPainter={toggleFormatPainter}
                        isFormatPainterActive={isFormatPainterActive}
                        onChangeFontSize={changeFontSize}
                        onFocusArea={focusArea}
                    />
                </div>

                {/* Main Content Area with Rulers */}
                <div className="flex-1 flex flex-col min-w-0 relative bg-[#e5e7eb] overflow-hidden">





                    {/* Scrollable Canvas */}
                    <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#e5e7eb] relative scroll-smooth">
                        {isLoading && !previewHtml ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div
                                className="relative transition-transform duration-200 ease-in-out origin-top"
                                style={{
                                    width: `${pageSize.width}cm`,
                                    minHeight: `${pageSize.height}cm`,
                                    transform: `scale(${zoomLevel / 100})`,
                                    marginBottom: '20vh',
                                }}
                            >
                                {/* Attached Horizontal Ruler */}
                                {showRuler && (
                                    <div className="absolute -top-[24px] left-0 right-0 h-[24px]">
                                        <Ruler
                                            orientation="horizontal"
                                            length={pageSize.width}
                                            zoom={100}
                                            margins={{ start: pageMargins.left, end: pageMargins.right }}
                                            indents={indents}
                                            tabStops={tabStops}
                                            onTabStopChange={handleTabStopChange}
                                            activeTabType={activeTabType}
                                            onMarginChange={(start, end) => setPageMargins(prev => ({ ...prev, left: start, right: end }))}
                                            onIndentChange={(changes) => {
                                                setIndents(prev => ({ ...prev, ...changes }));
                                                if (editorRef) {
                                                    const node = editorRef.selection.getNode();
                                                    if (changes.left !== undefined) editorRef.dom.setStyle(node, 'margin-left', `${changes.left.toFixed(2)}cm`);
                                                    if (changes.right !== undefined) editorRef.dom.setStyle(node, 'margin-right', `${changes.right.toFixed(2)}cm`);
                                                    if (changes.firstLine !== undefined) editorRef.dom.setStyle(node, 'text-indent', `${changes.firstLine.toFixed(2)}cm`);
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Attached Vertical Ruler */}
                                {showRuler && (
                                    <div className="absolute -left-[24px] top-0 bottom-0 w-[24px]">
                                        <Ruler
                                            orientation="vertical"
                                            length={pageSize.height}
                                            zoom={100}
                                            margins={{ start: pageMargins.top, end: pageMargins.bottom }}
                                            onMarginChange={(start, end) => setPageMargins(prev => ({ ...prev, top: start, bottom: end }))}
                                        />
                                    </div>
                                )}

                                {/* Corner Piece (Tab Selector) */}
                                {showRuler && (
                                    <div
                                        className="absolute -top-[24px] -left-[24px] w-[24px] h-[24px] bg-[#f3f4f6] border-r border-b border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 z-50 select-none"
                                        onClick={cycleTabType}
                                        title={`Current Tab: ${activeTabType.charAt(0).toUpperCase() + activeTabType.slice(1)}`}
                                    >
                                        {getTabIcon(activeTabType)}
                                    </div>
                                )}

                                <div
                                    className="bg-white shadow-xl h-full w-full relative group"
                                    style={{
                                        minHeight: `${pageSize.height * pageCount}cm`,
                                        padding: `${pageMargins.top}cm ${pageMargins.right}cm ${pageMargins.bottom}cm ${pageMargins.left}cm`,
                                        backgroundImage: pageCount > 1 ? `repeating-linear-gradient(
                                            to bottom,
                                            transparent,
                                            transparent ${pageSize.height - 0.1}cm,
                                            #ddd ${pageSize.height - 0.1}cm,
                                            #ddd ${pageSize.height}cm,
                                            transparent ${pageSize.height}cm
                                        )` : 'none',
                                        backgroundSize: `100% ${pageSize.height}cm`
                                    }}
                                >
                                    {/* Page Number Indicator */}
                                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">
                                        {pageCount > 1 && `${pageCount} hal`}
                                    </div>
                                    {/* Header Area */}
                                    <div
                                        className="absolute top-0 left-0 w-full hover:bg-gray-50 border-b border-transparent hover:border-dashed hover:border-gray-300 transition-colors cursor-text group/header"
                                        style={{ height: `${pageMargins.top}cm`, padding: `0.5cm ${pageMargins.right}cm 0 ${pageMargins.left}cm` }}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => setHeaderContent(e.currentTarget.textContent || '')}
                                    >
                                        <span className="text-xs text-gray-400 absolute top-2 right-2 opacity-0 group-hover/header:opacity-100 select-none">Header</span>
                                        {headerContent || <span className="opacity-0">Header</span>}
                                    </div>

                                    {/* Footer Area */}
                                    <div
                                        className="absolute bottom-0 left-0 w-full hover:bg-gray-50 border-t border-transparent hover:border-dashed hover:border-gray-300 transition-colors cursor-text group/footer"
                                        style={{ height: `${pageMargins.bottom}cm`, padding: `0 ${pageMargins.right}cm 0.5cm ${pageMargins.left}cm` }}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => setFooterContent(e.currentTarget.textContent || '')}
                                    >
                                        <span className="text-xs text-gray-400 absolute bottom-2 right-2 opacity-0 group-hover/footer:opacity-100 select-none">Footer</span>
                                        {footerContent || <span className="opacity-0">Footer</span>}
                                    </div>

                                    <Editor
                                        apiKey="1wjg4nwezx5275wrr645atzvlt4ew2m0pbxwbsd0uvp931ej"
                                        onInit={(evt, editor) => setEditorRef(editor)}
                                        initialValue={previewHtml}
                                        disabled={!isEditMode}
                                        init={{
                                            height: '100%',
                                            width: '100%',
                                            menubar: false,
                                            plugins: [
                                                'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                                                'pagebreak', 'nonbreaking', 'visualchars', 'directionality', 'noneditable',
                                                'emoticons'
                                            ],
                                            toolbar: false,
                                            setup: (editor) => {
                                                // Custom Drag Logic for Absolute Elements
                                                let isDragging = false;
                                                let dragTarget: HTMLElement | null = null;
                                                let startX = 0;
                                                let startY = 0;
                                                let startLeft = 0;
                                                let startTop = 0;

                                                editor.on('mousedown', (e) => {
                                                    const target = e.target as HTMLElement;
                                                    // Check if target is an image or floating object with absolute position
                                                    const isAbsolute = editor.dom.getStyle(target, 'position') === 'absolute';

                                                    if (isAbsolute && (target.nodeName === 'IMG' || target.classList.contains('floating-object'))) {
                                                        e.preventDefault(); // Prevent default TinyMCE selection/drag behavior
                                                        isDragging = true;
                                                        dragTarget = target;

                                                        // Get current mouse position
                                                        startX = e.clientX;
                                                        startY = e.clientY;

                                                        // Get current element position (default to 0 if not set)
                                                        // We need to ensure we have a starting numeric value
                                                        const currentLeft = parseFloat(editor.dom.getStyle(target, 'left') || '0');
                                                        const currentTop = parseFloat(editor.dom.getStyle(target, 'top') || '0');

                                                        // If it was just switched to absolute without left/top, visual position might be different
                                                        // But for now, let's assume it starts at 0,0 relative to page if not set, or we could calculate offset.
                                                        // Better: logic in Ribbon should set initial left/top.
                                                        // Here we just drag relative to current style.
                                                        startLeft = isNaN(currentLeft) ? 0 : currentLeft;
                                                        startTop = isNaN(currentTop) ? 0 : currentTop;

                                                        editor.dom.setStyle(target, 'cursor', 'grabbing');
                                                    }
                                                });

                                                editor.on('mousemove', (e) => {
                                                    if (isDragging && dragTarget) {
                                                        const dx = e.clientX - startX;
                                                        const dy = e.clientY - startY;

                                                        const newLeft = startLeft + dx;
                                                        const newTop = startTop + dy;

                                                        editor.dom.setStyle(dragTarget, 'left', `${newLeft}px`);
                                                        editor.dom.setStyle(dragTarget, 'top', `${newTop}px`);
                                                    }
                                                });

                                                editor.on('mouseup', () => {
                                                    if (isDragging && dragTarget) {
                                                        isDragging = false;
                                                        editor.dom.setStyle(dragTarget, 'cursor', 'move');
                                                        dragTarget = null;
                                                        editor.undoManager.add(); // Save state
                                                    }
                                                });
                                            },
                                            content_style: `
                                                body { 
                                                    background-color: #fff; 
                                                    padding: 0 !important; 
                                                    font-family: 'Times New Roman', Times, serif; 
                                                    font-size: 11pt;
                                                    line-height: 1.15;
                                                    margin: 0;
                                                    color: #000;
                                                    min-height: 100%;
                                                    column-count: ${pageColumns};
                                                    column-gap: 1cm;
                                                    isolation: isolate;
                                                }
                                                p, h1, h2, h3, h4, h5, h6, div {
                                                    text-align: inherit;
                                                    margin: 0; /* Default to tight spacing */
                                                }
                                                p[style*="text-align: left"], div[style*="text-align: left"] { text-align: left !important; }
                                                p[style*="text-align: center"], div[style*="text-align: center"] { text-align: center !important; }
                                                p[style*="text-align: right"], div[style*="text-align: right"] { text-align: right !important; }
                                                p[style*="text-align: justify"], div[style*="text-align: justify"] { text-align: justify !important; }
                                                .mce-pagebreak {
                                                    display: block;
                                                    border-top: 1px dashed #ccc;
                                                    height: 10px;
                                                    margin: 20px 0;
                                                    position: relative;
                                                }
                                                .mceNonEditable {
                                                    cursor: not-allowed;
                                                    user-select: all;
                                                }
                                                /* Selection Mode: Easy Object Selection */
                                                body.select-mode img, body.select-mode .floating-object {
                                                    z-index: 100 !important;
                                                    pointer-events: auto !important;
                                                    outline: 2px dashed #3b82f6;
                                                    cursor: move;
                                                }
                                                body.select-mode p, body.select-mode h1, body.select-mode h2, body.select-mode h3, body.select-mode h4, body.select-mode h5, body.select-mode h6, body.select-mode li, body.select-mode td {
                                                    pointer-events: none !important;
                                                    opacity: 0.6;
                                                }
                                            `,
                                            resize: false,
                                            statusbar: false,
                                            noneditable_noneditable_class: 'mceNonEditable',
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Panel: Smart Data */}
            <div className="w-full md:w-[320px] border-l bg-card flex flex-col shadow-xl z-30 h-full">
                <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
                    {isEditMode ? <Pencil className="w-4 h-4 text-orange-600" /> : <Wand2 className="w-4 h-4 text-primary" />}
                    <h3 className="font-semibold text-sm">{isEditMode ? "Data & Variabel" : "Pengisian Smart Form"}</h3>
                </div>

                <ScrollArea className="flex-1 p-4 bg-gray-50/50">
                    {isEditMode ? (
                        <div className="space-y-6">
                            {/* Group: Persiapan */}
                            <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold px-1">Dokumen Persiapan</p>
                                {fields.filter(f => f.phase === 'persiapan').length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic px-2">Tidak ada field</p>
                                ) : (
                                    fields.filter(f => f.phase === 'persiapan').map((field) => (
                                        <Button
                                            key={field.id}
                                            variant="outline"
                                            className="w-full justify-between h-auto py-2 bg-white hover:bg-blue-50 border-blue-100 hover:border-blue-300 transition-all text-left"
                                            onClick={() => insertVariable(field.name)}
                                        >
                                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                                    <span className="font-mono text-xs font-bold text-blue-700 truncate">{`{{${field.name}}}`}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground pl-3 truncate">{field.label}</span>
                                            </div>
                                            <Plus className="w-3 h-3 text-blue-400" />
                                        </Button>
                                    ))
                                )}
                            </div>

                            {/* Group: Pelaksanaan */}
                            <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold px-1">Dokumen Pelaksanaan</p>
                                {fields.filter(f => !f.phase || f.phase === 'pelaksanaan').length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic px-2">Tidak ada field</p>
                                ) : (
                                    fields.filter(f => !f.phase || f.phase === 'pelaksanaan').map((field) => (
                                        <Button
                                            key={field.id}
                                            variant="outline"
                                            className="w-full justify-between h-auto py-2 bg-white hover:bg-blue-50 border-blue-100 hover:border-blue-300 transition-all text-left"
                                            onClick={() => insertVariable(field.name)}
                                        >
                                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                    <span className="font-mono text-xs font-bold text-blue-700 truncate">{`{{${field.name}}}`}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground pl-3 truncate">{field.label}</span>
                                            </div>
                                            <Plus className="w-3 h-3 text-blue-400" />
                                        </Button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {variables.map((variable) => (
                                <div key={variable} className="space-y-1">
                                    <Label className="text-xs uppercase text-muted-foreground tracking-wider">{variable.replace(/_/g, ' ')}</Label>
                                    <Input
                                        value={formValues[variable] || ''}
                                        onChange={(e) => handleFormChange(variable, e.target.value)}
                                        className="bg-white"
                                        placeholder="..."
                                    />
                                </div>
                            ))}
                            {variables.length === 0 && (
                                <div className="text-center text-muted-foreground text-xs py-10">
                                    Tidak ada variabel terdeteksi. Gunakan Mode Edit untuk menambah variabel.
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-white space-y-2">
                    {isEditMode ? (
                        <Button onClick={handleSaveTemplate} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                            <Save className="w-4 h-4 mr-2" /> Simpan Template
                        </Button>
                    ) : (
                        <Button onClick={handleDownloadResult} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg">
                            <Download className="w-4 h-4 mr-2" /> Download DOCX
                        </Button>
                    )}
                </div>
            </div>

            <PageSetupDialog
                isOpen={showPageSetup}
                onClose={() => setShowPageSetup(false)}
                currentSize={pageSize}
                currentMargins={pageMargins}
                onSave={(size, margins) => {
                    setPageSize(size);
                    setPageMargins(margins);
                }}
            />
        </div >
    );
}
