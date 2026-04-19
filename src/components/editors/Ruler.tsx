import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { RulerUnit, UNITS, convert, TabStop, TabType } from '@/lib/rulerUtils';

interface RulerProps {
    orientation: 'horizontal' | 'vertical';
    length: number; // in logical units (e.g. cm)
    zoom: number;
    unit?: RulerUnit; // Default 'cm'
    margins?: { start: number; end: number }; // in unit
    onMarginChange?: (start: number, end: number) => void;
    // Indents: CSS values (cm)
    // left: margin-left
    // right: margin-right
    // firstLine: text-indent
    tabStops?: TabStop[];
    onTabStopChange?: (stops: TabStop[]) => void;
    activeTabType?: TabType;
    indents?: { left: number; right: number; firstLine: number };
    onIndentChange?: (changes: { left?: number; right?: number; firstLine?: number }) => void;
    className?: string;
}

export function Ruler({
    orientation,
    length,
    zoom,
    unit = 'cm',
    margins = { start: 2.54, end: 2.54 },
    tabStops = [],
    onTabStopChange,
    activeTabType = 'left',
    onMarginChange,
    indents,
    onIndentChange,
    className
}: RulerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<string | null>(null);

    // Pixels per unit
    const pxPerUnit = UNITS[unit] * (zoom / 100);
    const rulerLengthPx = length * pxPerUnit;

    // Helper: Convert client coordinate to Unit value
    const getUnitValue = (clientPos: number, rectStart: number) => {
        const valPx = clientPos - rectStart;
        const rawUnit = valPx / pxPerUnit;
        return rawUnit;
    };

    // Drag Logic
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const clientPos = orientation === 'horizontal' ? e.clientX : e.clientY;
            const rectStart = orientation === 'horizontal' ? rect.left : rect.top;

            let val = getUnitValue(clientPos, rectStart);

            // Snap to grid (0.1 unit)
            val = Math.round(val * 10) / 10;
            // Clamp generally to ruler
            val = Math.max(0, Math.min(val, length));

            if (isDragging === 'start') {
                const maxStart = length - margins.end - 0.5;
                if (onMarginChange) onMarginChange(Math.min(val, maxStart), margins.end);
            } else if (isDragging === 'end') {
                const rightMargin = length - val;
                const maxEnd = length - margins.start - 0.5;
                if (onMarginChange) onMarginChange(margins.start, Math.max(0, Math.min(rightMargin, maxEnd)));
            } else if (orientation === 'horizontal') {
                const marginStartAbs = margins.start;

                if (isDragging === 'indent-first' && indents && onIndentChange) {
                    const newFirstLine = val - marginStartAbs - indents.left;
                    onIndentChange({ firstLine: newFirstLine });

                } else if ((isDragging === 'indent-hanging' || isDragging === 'indent-left') && indents && onIndentChange) {
                    const newLeft = Math.max(0, val - marginStartAbs);
                    const oldAbsFirstLine = indents.left + indents.firstLine;
                    const newFirstLine = oldAbsFirstLine - newLeft;
                    onIndentChange({ left: newLeft, firstLine: newFirstLine });

                } else if (isDragging === 'indent-right' && indents && onIndentChange) {
                    const distFromRightMargin = (length - margins.end) - val;
                    onIndentChange({ right: Math.max(0, distFromRightMargin) });

                } else if (isDragging.startsWith('tab-stop-') && onTabStopChange) {
                    const index = parseInt(isDragging.replace('tab-stop-', ''));
                    const newStops = [...tabStops];
                    // Just update position, keep type
                    if (newStops[index]) {
                        newStops[index] = { ...newStops[index], position: val };
                        onTabStopChange(newStops);
                    }
                }
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging && isDragging.startsWith('tab-stop-') && onTabStopChange && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const clientY = e.clientY;

                // Check if it was a click (little movement)
                const startPos = (containerRef.current as any)._dragStart;
                let isClick = false;
                if (startPos) {
                    const dx = Math.abs(e.clientX - startPos.x);
                    const dy = Math.abs(e.clientY - startPos.y);
                    if (dx < 5 && dy < 5) isClick = true;
                }

                if (isClick || (clientY < rect.top - 20 || clientY > rect.bottom + 20)) {
                    // Remove Tab Stop (Click OR Drag-off)
                    const index = parseInt(isDragging.replace('tab-stop-', ''));
                    const newStops = tabStops.filter((_, i) => i !== index);
                    // Avoid removing if it's a click but we missed the target check? 
                    // No, isDragging is set, so we clicked the target.
                    onTabStopChange(newStops);
                }

                (containerRef.current as any)._dragStart = null;
            }
            setIsDragging(null);
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, length, zoom, unit, margins, onMarginChange, onIndentChange, pxPerUnit, orientation, indents, tabStops, onTabStopChange]);

    // Add New Tab Stop
    const handleRulerClick = (e: React.MouseEvent) => {
        if (orientation !== 'horizontal' || !onTabStopChange || !containerRef.current) return;

        // Note: Interactive elements (handles, existing tabs) call stopPropagation(), 
        // so we don't need to filter them out by tagName here.
        // We want clicks on SVG background, ticks (line), and numbers (text) to ALL trigger this.

        const rect = containerRef.current.getBoundingClientRect();
        const val = getUnitValue(e.clientX, rect.left);

        // Add new tab stop
        const newStop: TabStop = { position: Math.round(val * 10) / 10, type: activeTabType || 'left' };
        onTabStopChange([...tabStops, newStop]);
    };

    // Render Icons
    const renderTabIcon = (type: TabType) => {
        switch (type) {
            case 'center': return <path d="M4,1 L4,7 M1,7 L7,7" fill="none" stroke="black" strokeWidth="1.5" />;
            case 'right': return <path d="M7,1 L7,7 L1,7" fill="none" stroke="black" strokeWidth="1.5" />;
            case 'decimal': return <g><path d="M4,1 L4,7 M1,7 L7,7" fill="none" stroke="black" strokeWidth="1.5" /><circle cx="5.5" cy="5.5" r="1" fill="black" /></g>;
            case 'left': default: return <path d="M1,1 L1,7 L7,7" fill="none" stroke="black" strokeWidth="1.5" />;
        }
    };

    // SVG Rendering Helpers
    const renderTicks = () => {
        const ticks = [];
        const subdivisions = unit === 'in' ? 8 : 10;

        for (let i = 0; i <= Math.floor(length); i++) {
            const pos = i * pxPerUnit;
            // Major Tick
            if (pos <= rulerLengthPx) {
                ticks.push(
                    <line
                        key={`maj-${i}`}
                        x1={orientation === 'horizontal' ? pos : '100%'}
                        y1={orientation === 'horizontal' ? '100%' : pos}
                        x2={orientation === 'horizontal' ? pos : '70%'}
                        y2={orientation === 'horizontal' ? '70%' : pos}
                        stroke="#9ca3af" // gray-400
                        strokeWidth="1"
                    />
                );
                // Number
                if (i > 0 && i < length) {
                    ticks.push(
                        <text
                            key={`lbl-${i}`}
                            x={orientation === 'horizontal' ? pos + 2 : '50%'}
                            y={orientation === 'horizontal' ? '40%' : pos + 12}
                            className="text-[8px] fill-gray-600 font-sans select-none"
                            textAnchor={orientation === 'horizontal' ? "start" : "middle"}
                            transform={orientation === 'vertical' ? `rotate(-90, 8, ${pos})` : undefined}
                        >
                            {i}
                        </text>
                    );
                }

                // Subdivisions
                if (i < length) {
                    for (let j = 1; j < subdivisions; j++) {
                        const subPos = pos + (j / subdivisions) * pxPerUnit;
                        const isMid = j === subdivisions / 2;
                        if (subPos <= rulerLengthPx) {
                            ticks.push(
                                <line
                                    key={`min-${i}-${j}`}
                                    x1={orientation === 'horizontal' ? subPos : '100%'}
                                    y1={orientation === 'horizontal' ? '100%' : subPos}
                                    x2={orientation === 'horizontal' ? subPos : (isMid ? '80%' : '90%')}
                                    y2={orientation === 'horizontal' ? (isMid ? '80%' : '90%') : subPos}
                                    stroke="#d1d5db" // gray-300
                                    strokeWidth="1"
                                />
                            );
                        }
                    }
                }
            }
        }
        return ticks;
    };

    // Calculate absolute positions for styling
    const marginStartPx = margins.start * pxPerUnit;
    const marginEndPx = margins.end * pxPerUnit;

    // Indent Calculations
    // Left (Hanging) = MarginStart + LeftIndent
    const leftIndentAbs = marginStartPx + (indents?.left || 0) * pxPerUnit;
    // First Line = MarginStart + LeftIndent + FirstLineIndent
    const firstLineAbs = marginStartPx + ((indents?.left || 0) + (indents?.firstLine || 0)) * pxPerUnit;
    // Right = Length - MarginEnd - RightIndent
    const rightIndentAbs = (length - margins.end - (indents?.right || 0)) * pxPerUnit;

    return (
        <div
            ref={containerRef}
            className={cn(
                "bg-white relative shadow-sm select-none border-b border-gray-300 overflow-visible",
                orientation === 'horizontal' ? "h-6 flex-shrink-0 cursor-text" : "w-6 border-r flex-shrink-0",
                className
            )}
            style={{
                width: orientation === 'horizontal' ? rulerLengthPx : '24px',
                height: orientation === 'vertical' ? rulerLengthPx : '24px'
            }}
            onClick={handleRulerClick}
        >
            {/* SVG Layer */}
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
                <rect width="100%" height="100%" fill="white" />

                {/* Gray Margins */}
                {orientation === 'horizontal' ? (
                    <>
                        <rect x="0" y="0" width={marginStartPx} height="100%" fill="#e5e7eb" />
                        <rect x={rulerLengthPx - marginEndPx} y="0" width={marginEndPx} height="100%" fill="#e5e7eb" />
                    </>
                ) : (
                    <>
                        <rect x="0" y="0" width="100%" height={marginStartPx} fill="#e5e7eb" />
                        <rect x="0" y={rulerLengthPx - marginEndPx} width="100%" height={marginEndPx} fill="#e5e7eb" />
                    </>
                )}

                {/* Ticks */}
                {renderTicks()}
            </svg>

            {/* Tab Stops */}
            {orientation === 'horizontal' && tabStops.map((stop, i) => (
                <div
                    key={i}
                    className="absolute top-[4px] cursor-pointer hover:scale-125 transition-transform z-30 group"
                    style={{ left: stop.position * pxPerUnit, transform: 'translateX(-50%)' }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(`tab-stop-${i}`);
                        // Store start pos for click detection
                        (containerRef.current as any)._dragStart = { x: e.clientX, y: e.clientY };
                    }}
                    title={`${stop.type.charAt(0).toUpperCase() + stop.type.slice(1)} Tab: ${stop.position}cm (Click to remove, Drag to move)`}
                >
                    {/* Invisible Hit Area (Larger) */}
                    <div className="absolute -left-2 -top-2 w-6 h-8 bg-transparent" />

                    {/* Visible Icon */}
                    <svg width="8" height="8" viewBox="0 0 8 8" className="relative pointer-events-none">
                        {renderTabIcon(stop.type)}
                    </svg>
                </div>
            ))}

            {/* Interactive Margin Handles */}
            <div
                className={cn("absolute z-10 hover:bg-blue-400/20 cursor-ew-resize", orientation === 'horizontal' ? "w-1 h-full" : "w-full h-1 cursor-ns-resize")}
                style={orientation === 'horizontal' ? { left: marginStartPx } : { top: marginStartPx }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging('start'); }}
                title="Left/Top Margin"
            />
            <div
                className={cn("absolute z-10 hover:bg-blue-400/20 cursor-ew-resize", orientation === 'horizontal' ? "w-1 h-full" : "w-full h-1 cursor-ns-resize")}
                style={orientation === 'horizontal' ? { left: rulerLengthPx - marginEndPx } : { top: rulerLengthPx - marginEndPx }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging('end'); }}
                title="Right/Bottom Margin"
            />

            {/* Indent Markers (Horizontal Only) */}
            {orientation === 'horizontal' && indents && (
                <>
                    {/* First Line Indent (Top Triangle) */}
                    <div
                        className="absolute z-20 cursor-pointer hover:scale-110 transition-transform group"
                        style={{ left: firstLineAbs - 5, top: 0 }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging('indent-first'); }}
                        title="First Line Indent"
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" className="drop-shadow-sm filter drop-shadow">
                            <path d="M0,0 L10,0 L5,7 Z" fill="#3b82f6" stroke="#2563eb" strokeWidth="0.5" />
                        </svg>
                    </div>

                    {/* Left Indent Group (Hanging + Left) */}
                    <div className="absolute z-20 group" style={{ left: leftIndentAbs - 5, top: 12 }}>
                        {/* Hanging Indent (Bottom Triangle) */}
                        <div
                            className="absolute -top-3 cursor-pointer hover:scale-110 transition-transform"
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging('indent-hanging'); }}
                            title="Hanging Indent"
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" className="drop-shadow-sm filter drop-shadow">
                                <path d="M5,0 L10,7 L0,7 Z" fill="#3b82f6" stroke="#2563eb" strokeWidth="0.5" />
                            </svg>
                        </div>
                        {/* Left Indent (Rectangle) */}
                        <div
                            className="absolute top-[4px] cursor-col-resize hover:bg-blue-700 transition-colors shadow-sm"
                            style={{ width: 10, height: 6, backgroundColor: '#3b82f6', border: '0.5px solid #2563eb' }}
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging('indent-left'); }}
                            title="Left Indent"
                        />
                    </div>

                    {/* Right Indent (Up Triangle) */}
                    <div
                        className="absolute z-20 cursor-pointer hover:scale-110 transition-transform"
                        style={{ left: rightIndentAbs - 5, top: 12 }}
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging('indent-right'); }}
                        title="Right Indent"
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" className="drop-shadow-sm filter drop-shadow">
                            <path d="M5,0 L10,7 L0,7 Z" fill="#3b82f6" stroke="#2563eb" strokeWidth="0.5" />
                        </svg>
                    </div>
                </>
            )}
        </div>
    );
}
