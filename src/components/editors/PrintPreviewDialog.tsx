
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

interface PrintPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[]; // FortuneSheet data
    printArea: any;
    pageSize: string;
    customWidth?: number;
    customHeight?: number;
    orientation: string;
    scale: number;
    manualPageBreaks?: { rows: number[], cols: number[] };
}

// Helper to get dimensions in px (approx 96 DPI or generic web scale)
const MM_TO_PX = 3.78;

const PAPER_SIZES: Record<string, { w: number, h: number }> = {
    "a3": { w: 297, h: 420 },
    "a4": { w: 210, h: 297 },
    "a5": { w: 148, h: 210 },
    "letter": { w: 216, h: 279 },
    "legal": { w: 216, h: 356 },
    "tabloid": { w: 279, h: 432 },
    "executive": { w: 184, h: 267 },
};

export function PrintPreviewDialog({
    isOpen,
    onClose,
    data,
    printArea,
    pageSize,
    customWidth,
    customHeight,
    orientation,
    scale,
    manualPageBreaks = { rows: [], cols: [] }
}: PrintPreviewProps) {
    const [pages, setPages] = useState<any[][]>([]);
    const [zoom, setZoom] = useState(0.5);

    useEffect(() => {
        if (isOpen && data.length > 0) {
            calculatePagination();
        }
    }, [isOpen, data, printArea, pageSize, orientation, scale, manualPageBreaks]);

    const calculatePagination = () => {
        const sheet = data.find((s: any) => s.status === 1) || data[0];
        if (!sheet) return;

        // 1. Determine Range
        let rStart = 0, rEnd = (sheet.data?.length || sheet.row || 100) - 1;
        let cStart = 0, cEnd = (sheet.data?.[0]?.length || sheet.column || 20) - 1;

        if (printArea) {
            rStart = printArea.row[0];
            rEnd = printArea.row[1];
            cStart = printArea.column[0];
            cEnd = printArea.column[1];
        }

        // 2. Determine Page Height Limit (in px) on Screen
        const MM_TO_PX = 3.78;
        let pW_mm, pH_mm;
        if (pageSize === 'custom' && customWidth && customHeight) {
            pW_mm = customWidth;
            pH_mm = customHeight;
        } else {
            const size = PAPER_SIZES[pageSize] || PAPER_SIZES['a4'];
            pW_mm = size.w;
            pH_mm = size.h;
        }

        const effectiveHeightMM = orientation === 'portrait' ? pH_mm : pW_mm;
        const pageHeightPx = effectiveHeightMM * MM_TO_PX;
        const scaledHeightLimit = pageHeightPx / (scale / 100);

        // 3. Split Rows into Pages
        const rowDetails = sheet.config?.rowlen || {};
        const defaultRowHeight = 19;

        const newPages: any[][] = [];
        let currentPage: any[] = [];
        let currentH = 0;
        const sheetData = sheet.data || [];

        for (let r = rStart; r <= rEnd; r++) {
            const h = (rowDetails[r] || defaultRowHeight);

            // Manual Break Logic: If current row `r` is in manualPageBreaks, force break BEFORE this row
            // (Assuming manual break means "Start new page at this row")
            const isManualBreak = manualPageBreaks.rows?.includes(r);

            if (isManualBreak && currentPage.length > 0) {
                newPages.push(currentPage);
                currentPage = [];
                currentH = 0;
            }

            // Auto Break Logic
            if (currentH + h > scaledHeightLimit) {
                newPages.push(currentPage);
                currentPage = [];
                currentH = 0;
            }

            const rowData = [];
            for (let c = cStart; c <= cEnd; c++) {
                const cell = sheetData[r]?.[c] || null;
                rowData.push({
                    value: cell?.v || cell?.m || "",
                    style: cell
                });
            }
            currentPage.push({
                index: r,
                height: h,
                cells: rowData
            });
            currentH += h;
        }

        if (currentPage.length > 0) {
            newPages.push(currentPage);
        }

        setPages(newPages);
    };

    const handlePrint = () => {
        window.print();
    };

    if (!isOpen) return null;

    // Dimensions for the preview container
    let pW_mm, pH_mm;
    if (pageSize === 'custom' && customWidth && customHeight) {
        pW_mm = customWidth;
        pH_mm = customHeight;
    } else {
        const size = PAPER_SIZES[pageSize] || PAPER_SIZES['a4'];
        pW_mm = size.w;
        pH_mm = size.h;
    }
    const widthMM = orientation === 'portrait' ? pW_mm : pH_mm;
    const heightMM = orientation === 'portrait' ? pH_mm : pW_mm;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex flex-col">
            {/* Toolbar */}
            <div className="bg-white p-3 border-b flex justify-between items-center shadow-md print:hidden">
                <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Printer className="w-5 h-5" /> Print Preview
                    </h2>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}><ZoomOut className="w-4 h-4" /></Button>
                        <span className="w-12 text-center text-sm my-auto">{(zoom * 100).toFixed(0)}%</span>
                        <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.25))}><ZoomIn className="w-4 h-4" /></Button>
                    </div>
                    <span className="text-sm text-gray-500">
                        Total {pages.length} Pages • {pageSize.toUpperCase()} • {orientation}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" /> Print
                    </Button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto p-8 bg-gray-500 flex flex-col items-center gap-8 print:p-0 print:bg-white print:block">
                {pages.map((page, pageIdx) => (
                    <div
                        key={pageIdx}
                        className="bg-white shadow-xl origin-top transition-transform print:shadow-none print:break-after-page print:m-0"
                        style={{
                            width: `${widthMM}mm`,
                            height: `${heightMM}mm`,
                            transform: `scale(${zoom})`,
                            marginBottom: `${pageIdx < pages.length - 1 ? '20px' : '0'}`, // Visual Gap
                            padding: '10mm', // Default padding simulation
                            boxSizing: 'border-box'
                        }}
                    >
                        {/* Page Content Render */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            overflow: 'hidden',
                            // Scale content inside page to match user 'Scale' setting
                            transform: `scale(${scale / 100})`,
                            transformOrigin: 'top left'
                        }}>
                            <table className="w-full border-collapse table-fixed">
                                <tbody>
                                    {page.map((row: any, rIdx: number) => (
                                        <tr key={rIdx} style={{ height: `${row.height}px` }}>
                                            {row.cells.map((cell: any, cIdx: number) => {
                                                // Basic Style Mapping
                                                // bg, color, font-weight, text-align, borders
                                                const s = cell.style || {};
                                                const styleObj: React.CSSProperties = {
                                                    border: '1px solid #e5e7eb', // Default grid
                                                    padding: '2px 4px',
                                                    fontSize: '11pt',
                                                    backgroundColor: s.bg,
                                                    color: s.fc,
                                                    fontWeight: s.bl ? 'bold' : 'normal',
                                                    fontStyle: s.it ? 'italic' : 'normal',
                                                    textAlign: s.ht === 0 ? 'center' : s.ht === 2 ? 'right' : 'left',
                                                    verticalAlign: s.vt === 0 ? 'middle' : s.vt === 2 ? 'bottom' : 'top',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden'
                                                };
                                                return (
                                                    <td key={cIdx} style={styleObj}>
                                                        {cell.value}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Page Number Footer */}
                        <div className="absolute bottom-2 right-4 text-xs text-gray-400 print:hidden">
                            Page {pageIdx + 1} of {pages.length}
                        </div>
                    </div>
                ))}
            </div>

            {/* Print Styles Injection */}
            <style>{`
                @media print {
                    @page {
                        size: ${widthMM}mm ${heightMM}mm;
                        margin: 0;
                    }
                    body {
                        background: white;
                    }
                    /* Hide everything else */
                    body > *:not(.fixed) {
                        display: none !important;
                    }
                    /* Reset Fixed container props for print flow */
                    .fixed.inset-0 {
                        position: relative !important;
                        inset: auto !important;
                        height: auto !important;
                        background: white !important;
                        display: block !important;
                    }
                }
            `}</style>
        </div>
    );
}
