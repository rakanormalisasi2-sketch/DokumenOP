
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Workbook } from '@fortune-sheet/react';
import "@fortune-sheet/react/dist/index.css";
import { Button } from '@/components/ui/button';
import { Save, FileSpreadsheet, RotateCcw, Box, Printer, FileText, Eye, ZoomIn, ZoomOut, Settings, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { PrintPreviewDialog } from './PrintPreviewDialog';
import { PageBreakOverlay } from './PageBreakOverlay';

interface LuckysheetEditorProps {
    content: string; // JSON string of the workbook data (FortuneSheet format)
    onChange: (content: string) => void;
    fields: any[]; // Form fields (not used directly in sheet but maybe for reference)
    readOnly?: boolean;
}

// Standard Paper Sizes in mm
const PAPER_SIZES: Record<string, { w: number, h: number, label: string }> = {
    "a3": { w: 297, h: 420, label: "A3 (297 x 420 mm)" },
    "a4": { w: 210, h: 297, label: "A4 (210 x 297 mm)" },
    "a5": { w: 148, h: 210, label: "A5 (148 x 210 mm)" },
    "letter": { w: 216, h: 279, label: "Letter (216 x 279 mm)" },
    "legal": { w: 216, h: 356, label: "Legal (216 x 356 mm)" },
    "tabloid": { w: 279, h: 432, label: "Tabloid (279 x 432 mm)" },
    "executive": { w: 184, h: 267, label: "Executive (184 x 267 mm)" },
    "custom": { w: 0, h: 0, label: "Custom Size" }
};

export default function LuckysheetEditor({ content, onChange, fields, readOnly = false }: LuckysheetEditorProps) {
    // Sheet data state
    const [sheetData, setSheetData] = useState<any[]>([]);

    // Page Setup Logic
    const [showPageSetup, setShowPageSetup] = useState(false);
    const [pageSize, setPageSize] = useState("a4");
    const [customWidth, setCustomWidth] = useState(210); // mm
    const [customHeight, setCustomHeight] = useState(297); // mm
    const [orientation, setOrientation] = useState("portrait");
    const [scale, setScale] = useState(100);
    const [viewMode, setViewMode] = useState<'normal' | 'pageBreakPreview'>('normal');

    // Print Area & Page Break Logic (State)
    const [printArea, setPrintArea] = useState<any>(null); // { r_start, c_start, r_end, c_end }
    const [manualPageBreaks, setManualPageBreaks] = useState<{ rows: number[], cols: number[] }>({ rows: [], cols: [] });
    const [showPrintPreview, setShowPrintPreview] = useState(false);

    // Initialize data from content
    useEffect(() => {
        if (content) {
            try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSheetData(parsed);
                } else {
                    setSheetData([{ name: "Sheet1", celldata: [], status: 1 }]);
                }
            } catch (e) {
                console.error("Failed to parse sheet content, initializing default", e);
                setSheetData([{ name: "Sheet1", celldata: [], status: 1 }]);
            }
        } else {
            setSheetData([{ name: "Sheet1", celldata: [], status: 1 }]);
        }
    }, [content]);

    // Handle changes from FortuneSheet
    const handleOnChange = (data: any) => {
        onChange(JSON.stringify(data));
    };

    // Handle Local Import
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const extension = file.name.split('.').pop()?.toLowerCase();

        // ... (Import logic remains same) ...
        if (extension === 'xls') {
            try {
                const XLSX = await import('xlsx');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const xlsxBlob = new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const xlsxFile = new File([xlsxBlob], file.name.replace(/\.xls$/i, '.xlsx'), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                processFileWithLuckyExcel(xlsxFile);
            } catch (err) {
                console.error("XLS Conversion failed", err);
                processFileWithLuckyExcel(file);
            }
        } else {
            processFileWithLuckyExcel(file);
        }
        e.target.value = '';
    };

    const processFileWithLuckyExcel = (file: File) => {
        import('luckyexcel').then(LuckyExcel => {
            LuckyExcel.default.transformExcelToLucky(file, (exportJson: any) => {
                if (exportJson.sheets && Array.isArray(exportJson.sheets) && exportJson.sheets.length > 0) {
                    const newSheets = exportJson.sheets;
                    setSheetData(newSheets);
                    onChange(JSON.stringify(newSheets));
                    toast.success("File Excel berhasil di-import!");
                } else {
                    toast.error("Gagal membaca struktur file Excel.");
                }
            }, (err: any) => {
                console.error("Import failed", err);
                toast.error("Gagal import file: " + err);
            });
        });
    };

    const workbookRef = useRef<any>(null);
    const [showPlaceholders, setShowPlaceholders] = useState(false);

    const insertPlaceholder = (fieldName: string) => {
        if (!workbookRef.current) return;
        const placeholder = `{{${fieldName}}}`;

        if ((window as any).luckysheet) {
            try {
                const luckysheet = (window as any).luckysheet;
                const range = luckysheet.getRange();
                if (range && range.length > 0) {
                    const { row, column } = range[0];
                    const currentVal = luckysheet.getCellValue(row, column) || "";
                    luckysheet.setCellValue(row, column, currentVal + placeholder);
                    toast.success(`Inserted ${placeholder}`);
                } else {
                    toast.warning("Select a cell first");
                }
            } catch (e) {
                navigator.clipboard.writeText(placeholder);
                toast.info(`Copied ${placeholder} to clipboard`);
            }
        }
    };

    // --- DATA-BAKED Page Break Logic ---
    // --- PSEUDO PAGE BREAK Logic (Metadata-based) ---
    const [pageBreaks, setPageBreaks] = useState<{ rows: number[], cols: number[] }>({ rows: [], cols: [] });
    const [overlayPositions, setOverlayPositions] = useState<{ rows: number[], cols: number[] }>({ rows: [], cols: [] });
    const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
    const [zoomRatio, setZoomRatio] = useState(1);

    // Sync Switch / Scroll Listeners
    useEffect(() => {
        // Debounce scroll updates to prevent lagging
        let rAFArgs: { x: number, y: number } | null = null;

        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            const isY = target.classList.contains('luckysheet-scrollbar-y') || target.classList.contains('fortune-sheet-scrollbar-y');
            const isX = target.classList.contains('luckysheet-scrollbar-x') || target.classList.contains('fortune-sheet-scrollbar-x');

            setScrollPos(prev => ({
                x: isX ? target.scrollLeft : prev.x,
                y: isY ? target.scrollTop : prev.y
            }));
        };

        const attachListeners = () => {
            // FortuneSheet / Luckysheet Class Names might vary
            const scrolls = document.querySelectorAll('.luckysheet-scrollbar-y, .luckysheet-scrollbar-x, .fortune-sheet-scrollbar-y, .fortune-sheet-scrollbar-x');
            scrolls.forEach(el => el.addEventListener('scroll', handleScroll));

            // Check Zoom
            if ((window as any).luckysheet) {
                const currentZoom = (window as any).luckysheet.zoomRatio || 1;
                setZoomRatio(currentZoom);
            }
        };

        const timer = setTimeout(attachListeners, 500);
        return () => {
            clearTimeout(timer);
            const scrolls = document.querySelectorAll('.luckysheet-scrollbar-y, .luckysheet-scrollbar-x, .fortune-sheet-scrollbar-y, .fortune-sheet-scrollbar-x');
            scrolls.forEach(el => el.removeEventListener('scroll', handleScroll));
        };
    }, [sheetData, viewMode]);

    const calculatePageBreaks = () => {
        if (sheetData.length === 0) return;
        const sheet = sheetData.find((s: any) => s.status === 1) || sheetData[0];

        // 3. Calculate Breaks
        const MM_TO_PX = 3.78;
        let pW_mm, pH_mm;
        if (pageSize === 'custom') {
            pW_mm = customWidth; pH_mm = customHeight;
        } else {
            const size = PAPER_SIZES[pageSize];
            pW_mm = size ? size.w : 210; pH_mm = size ? size.h : 297;
        }

        const pageHeightMM = orientation === 'portrait' ? pH_mm : pW_mm;
        const pageWidthMM = orientation === 'portrait' ? pW_mm : pH_mm;
        const scaledPageHeight = (pageHeightMM * MM_TO_PX) / (scale / 100);
        const scaledPageWidth = (pageWidthMM * MM_TO_PX) / (scale / 100);

        // --- ROW BREAKS ---
        let currentHeight = 0;
        let totalH = 0;
        let rowBreaks: number[] = [];
        let rowBreakPositions: number[] = [];

        const rowDetails = sheet.config?.rowlen || {};
        const defaultRowHeight = 19;
        // Use sheet.row (total rows) instead of data.length as data might be sparse
        const totalRows = sheet.row || (sheet.data ? sheet.data.length : 100);

        for (let r = 0; r < totalRows; r++) {
            const h = (rowDetails[r] || defaultRowHeight);

            if (manualPageBreaks.rows && manualPageBreaks.rows.includes(r)) {
                rowBreaks.push(r - 1);
                rowBreakPositions.push(totalH);
                currentHeight = 0;
            }

            if (currentHeight + h > scaledPageHeight) {
                rowBreaks.push(r - 1);
                rowBreakPositions.push(totalH);
                currentHeight = h;
            } else {
                currentHeight += h;
            }
            totalH += h;
        }

        // --- COL BREAKS ---
        let currentWidth = 0;
        let totalW = 0;
        let colBreaks: number[] = [];
        let colBreakPositions: number[] = [];

        const colDetails = sheet.config?.columnlen || {};
        const defaultColWidth = 73;
        const totalCols = sheet.column || (sheet.data && sheet.data[0] ? sheet.data[0].length : 60);

        for (let c = 0; c < totalCols; c++) {
            const w = (colDetails[c] || defaultColWidth);
            if (currentWidth + w > scaledPageWidth) {
                colBreaks.push(c - 1);
                colBreakPositions.push(totalW);
                currentWidth = w;
            } else {
                currentWidth += w;
            }
            totalW += w;
        }

        setPageBreaks({ rows: rowBreaks, cols: colBreaks });
        setOverlayPositions({ rows: rowBreakPositions, cols: colBreakPositions });
        toast.success(`Layout calculated: ${rowBreaks.length} x ${colBreaks.length} pages`);
    };

    // Actions
    const handleSetPrintArea = () => {
        if ((window as any).luckysheet) {
            const luckysheet = (window as any).luckysheet;
            const range = luckysheet.getRange();
            if (range && range.length > 0) {
                const selection = range[0];
                setPrintArea(selection);

                luckysheet.setBorder({
                    range: [{ row: selection.row, column: selection.column }],
                    type: "border-outside",
                    style: "thick",
                    color: "#0000FF"
                });
                toast.success("Print Area Set!");
            } else {
                toast.warning("Select cells to set Print Area");
            }
        }
    };

    const handleAddManualPageBreak = () => {
        if ((window as any).luckysheet) {
            const luckysheet = (window as any).luckysheet;
            const range = luckysheet.getRange();
            if (range && range.length > 0) {
                const rowIndex = range[0].row[1];
                setManualPageBreaks(prev => ({
                    ...prev,
                    rows: [...prev.rows, rowIndex]
                }));
                toast.success(`Manual Page Break added at Row ${rowIndex + 1}`);
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-white border rounded-lg overflow-hidden relative">
            {/* Main Toolbar */}
            <div className="flex items-center justify-between p-2 border-b bg-gray-50 z-10">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-sm text-gray-700">Spreadsheet Editor</span>
                    <span className="text-xs text-gray-500 ml-2">Mirip Google Sheets / Excel</span>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex bg-gray-100 rounded p-1 gap-1">
                        <Button
                            variant={showPageSetup ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setShowPageSetup(prev => !prev)}
                            title="Page Setup & Print"
                            className={showPageSetup ? "bg-blue-100 text-blue-700" : ""}
                        >
                            <Settings className="w-4 h-4 mr-1" /> Page Setup
                        </Button>
                        <div className="w-px h-4 bg-gray-300 my-auto" />
                        <Button
                            variant={viewMode === 'pageBreakPreview' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => {
                                setViewMode(prev => prev === 'normal' ? 'pageBreakPreview' : 'normal');
                                if (viewMode === 'normal') calculatePageBreaks(); // Trigger calculation on enter
                            }}
                            title="Toggle Page Breakdown"
                        >
                            {viewMode === 'normal' ? <Eye className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-blue-600" />}
                        </Button>
                    </div>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <Button variant="ghost" size="sm" onClick={() => setShowPlaceholders(!showPlaceholders)} className="gap-2">
                        <Box className="w-4 h-4" />
                        <span className="text-xs">Variables</span>
                    </Button>
                    <div className="w-px h-6 bg-gray-300 mx-1" />
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                    <Button variant="outline" size="sm" onClick={handleImportClick} className="gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Import Excel
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative z-0">
                {/* Editor Area */}
                <div className="flex-1 relative">
                    {sheetData.length > 0 && (
                        <Workbook
                            ref={workbookRef}
                            key={JSON.stringify(sheetData.map(s => s.name))}
                            data={sheetData}
                            onChange={handleOnChange}
                            showToolbar={true}
                            allowEdit={!readOnly}
                        // hooks property removed as it caused type errors

                        />
                    )}

                    {/* Page Break Overlay */}
                    {viewMode === 'pageBreakPreview' && (
                        <PageBreakOverlay
                            rowBreaks={pageBreaks.rows}
                            colBreaks={pageBreaks.cols}
                            rowPositions={overlayPositions.rows}
                            colPositions={overlayPositions.cols}
                            manualRowBreaks={manualPageBreaks.rows}
                            manualColBreaks={manualPageBreaks.cols}
                            scrollX={scrollPos.x}
                            scrollY={scrollPos.y}
                            zoom={zoomRatio}
                            scale={scale}
                            sheetData={sheetData}
                            onBreakChange={(type, index, newPosPx) => {
                                if (!sheetData.length) return;
                                const sheet = sheetData.find((s: any) => s.status === 1) || sheetData[0];

                                // Dragging Logic:
                                // 1. If dragging an "Automatic" break line (usually the last one before limit),
                                //    we treat it as "Rescaling".
                                // 2. If dragging elsewhere, we insert a "Manual" break.

                                // Simplified Requirement: 
                                // "jika kolom saya tarik maka yang baris akan menyesuaikan..."
                                // This strongly implies SCALING.

                                // Logic:
                                // Calculate what % of the Total Width/Height is now covered by the new drag position.
                                // If I drag the Page 1 Vertical Boundary from 800px to 1000px, 
                                // it means 1000px of content should now fit on 1 Page Width.

                                if (type === 'col') {
                                    // Vertical Drag -> Adjust Scale
                                    // newPosPx is the visual position relative to content top-left.
                                    // We want this position to be the new "Page Width".

                                    // Current Page Width in MM
                                    let pW_mm, pH_mm;
                                    if (pageSize === 'custom') {
                                        pW_mm = customWidth; pH_mm = customHeight;
                                    } else {
                                        const size = PAPER_SIZES[pageSize];
                                        pW_mm = size ? size.w : 210; pH_mm = size ? size.h : 297;
                                    }
                                    const effectivePageWidthMM = orientation === 'portrait' ? pW_mm : pH_mm;
                                    const MM_TO_PX = 3.78;
                                    const basePageWidthPx = effectivePageWidthMM * MM_TO_PX;

                                    // The user says "newPosPx" should be the limit found at "basePageWidthPx".
                                    // So: newPosPx * (NewScale/100) = basePageWidthPx
                                    // NewScale = (basePageWidthPx / newPosPx) * 100

                                    // However, newPosPx is in "Zoomed" pixels if we aren't careful?
                                    // No, the Overlay sends "newPos" which is (OriginalPos + Delta/Zoom).
                                    // So "newPos" is in Raw Content Pixels.

                                    const newScale = Math.min(200, Math.max(25, (basePageWidthPx / newPosPx) * 100));

                                    setScale(Math.floor(newScale));
                                    toast.info(`Scale Adjusted to ${Math.floor(newScale)}% to fit content.`);

                                    // Trigger Recalc happens automatically when `scale` changes via useEffect dependency?
                                    // No, calculatePageBreaks is manual.
                                    // We should add `scale` dependency to a useEffect that triggers calc?
                                    // Or just call it.
                                    // setScale is async.
                                    setTimeout(() => calculatePageBreaks(), 100);

                                } else {
                                    // Horizontal Drag -> Manual Row Break
                                    // Logic: Find the row index at newPosPx
                                    const rowDetails = sheet.config?.rowlen || {};
                                    const defaultRowHeight = 19;
                                    const totalRows = sheet.row || (sheet.data ? sheet.data.length : 100);

                                    let currentMetric = 0;
                                    let foundIndex = -1;

                                    for (let r = 0; r < totalRows; r++) {
                                        const h = (rowDetails[r] || defaultRowHeight);
                                        // Simple hit testing
                                        if (currentMetric + h > newPosPx) {
                                            foundIndex = r;
                                            break;
                                        }
                                        currentMetric += h;
                                    }

                                    if (foundIndex !== -1) {
                                        // If dragging the existing auto-break, we are converting it to manual?
                                        // Or just inserting a manual break at foundIndex.
                                        setManualPageBreaks(prev => {
                                            const rows = prev.rows || [];
                                            if (!rows.includes(foundIndex)) {
                                                return { ...prev, rows: [...rows, foundIndex].sort((a, b) => a - b) };
                                            }
                                            return prev;
                                        });
                                        toast.success(`Inserted Horizontal Page Break at Row ${foundIndex + 1}`);
                                        setTimeout(() => calculatePageBreaks(), 100);
                                    }
                                }
                            }}
                        />
                    )}
                </div>

                {/* Right Sidebar: Page Setup & Print */}
                {showPageSetup && (
                    <div className="w-80 border-l bg-white shadow-xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Printer className="w-4 h-4" /> Page Layout
                            </h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPageSetup(false)}>
                                &times;
                            </Button>
                        </div>

                        <div className="p-4 space-y-6 overflow-y-auto flex-1">
                            {/* Page Size */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Paper Size</label>
                                <select
                                    className="w-full text-sm border rounded p-2 bg-white"
                                    value={pageSize}
                                    onChange={(e) => setPageSize(e.target.value)}
                                >
                                    {Object.entries(PAPER_SIZES).map(([key, val]) => (
                                        <option key={key} value={key}>{val.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Custom Dimensions */}
                            {pageSize === 'custom' && (
                                <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded border">
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Width (mm)</label>
                                        <input
                                            type="number"
                                            value={customWidth}
                                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                                            className="w-full text-sm border rounded p-1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-500">Height (mm)</label>
                                        <input
                                            type="number"
                                            value={customHeight}
                                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                                            className="w-full text-sm border rounded p-1"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Orientation */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Orientation</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setOrientation('portrait')}
                                        className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${orientation === 'portrait' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="w-6 h-8 border-2 border-current mb-1 rounded-sm opacity-50"></div>
                                        <span className="text-xs font-medium">Portrait</span>
                                    </button>
                                    <button
                                        onClick={() => setOrientation('landscape')}
                                        className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${orientation === 'landscape' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="w-8 h-6 border-2 border-current mb-1 rounded-sm opacity-50"></div>
                                        <span className="text-xs font-medium">Landscape</span>
                                    </button>
                                </div>
                            </div>

                            {/* Scale */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-medium text-gray-700">Scale</label>
                                    <span className="text-xs font-mono bg-gray-100 px-2 rounded">{scale}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="25"
                                    max="200"
                                    step="5"
                                    value={scale}
                                    onChange={(e) => setScale(Number(e.target.value))}
                                    className="w-full"
                                />
                                <p className="text-xs text-gray-500">Adjust to fit more content.</p>
                            </div>

                            {/* Actions (Same as before) */}
                            <div className="space-y-3 pt-4 border-t">
                                <label className="text-sm font-medium text-gray-700">Actions</label>
                                <Button variant="outline" size="sm" onClick={handleSetPrintArea} className="w-full justify-start gap-2">
                                    <Box className="w-4 h-4 text-blue-600" />
                                    Set Print Area
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleAddManualPageBreak} className="w-full justify-start gap-2">
                                    <FileText className="w-4 h-4 text-gray-600" />
                                    Insert Manual Break
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={calculatePageBreaks}
                                    className="w-full justify-start gap-2"
                                    variant="secondary"
                                >
                                    <Check className="w-4 h-4 text-green-600" />
                                    Apply / Refresh Breaks
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50">
                            <Button className="w-full gap-2" onClick={() => setShowPrintPreview(true)}>
                                <Printer className="w-4 h-4" /> Print / Export PDF
                            </Button>

                            <PrintPreviewDialog
                                isOpen={showPrintPreview}
                                onClose={() => setShowPrintPreview(false)}
                                data={sheetData}
                                printArea={printArea}
                                pageSize={pageSize}
                                customWidth={customWidth}
                                customHeight={customHeight}
                                orientation={orientation}
                                scale={scale}
                                manualPageBreaks={manualPageBreaks}
                            />
                        </div>
                    </div>
                )}

                {/* Variable Sidebar */}
                {showPlaceholders && !showPageSetup && (
                    <div className="w-64 border-l bg-gray-50 flex flex-col shadow-xl z-20">
                        {/* ... */}
                        <div className="p-3 border-b font-semibold text-sm flex justify-between items-center bg-white">
                            <span>Insert Variable</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPlaceholders(false)}>
                                &times;
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {fields && fields.length > 0 ? (
                                fields.map((field, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => insertPlaceholder(field.name || field)}
                                        className="w-full text-left px-3 py-2 text-sm bg-white border rounded hover:bg-blue-50 transition-colors flex items-center justify-between group"
                                    >
                                        <span className="font-medium text-gray-700">{field.label || field.name || field}</span>
                                        <span className="text-xs text-gray-400 font-mono group-hover:text-blue-500">
                                            {`{{${field.name || field}}}`}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 text-xs py-4">
                                    No variables available
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
