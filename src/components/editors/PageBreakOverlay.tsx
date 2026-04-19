
import React from 'react';

interface PageBreakOverlayProps {
    rowBreaks: number[];
    colBreaks: number[];
    manualRowBreaks: number[];
    manualColBreaks: number[]; // Not yet fully implemented in parent but good to have
    scrollX: number;
    scrollY: number;
    zoom: number; // The internal luckysheet zoom (usually 1 if not handled)
    sheetData: any[]; // Need to access row/col heights/widths efficiently? No, maybe just pass arrays of positions?
    // Passing entire sheetData is heavy. 
    // Better: Parent passes *calculated pixel positions*? 
    // actually luckysheet.getrowlen is expensive to call repeatedly?
    // Let's pass the raw indices and let this component assume it can access luckysheet API or receive coordinate arrays.

    // Simplest: Pass accumulated pixel positions for the breaks.
    // Parent calculates: Row 20 -> 500px.
    // Overlay renders line at 500px - scrollY.

    rowPositions: number[]; // Pixel positions relative to top of canvas (0,0)
    colPositions: number[]; // Pixel positions relative to left of canvas

    scale: number;
    onBreakChange?: (type: 'row' | 'col', index: number, newPositionPx: number) => void;
}

export const PageBreakOverlay: React.FC<PageBreakOverlayProps> = ({
    rowPositions,
    colPositions,
    scrollX,
    scrollY,
    zoom = 1,
    onBreakChange
}) => {

    // Drag State
    const [dragging, setDragging] = React.useState<{ type: 'row' | 'col', index: number, startPos: number, currentPos: number } | null>(null);

    React.useEffect(() => {
        if (!dragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const current = dragging.type === 'row' ? e.clientY : e.clientX;
            // Adjust for scroll and zoom? 
            // The overlay is fixed to the viewport? No, it's absolute in a container?
            // "absolute inset-0" in a "relative" container.
            // But the lines are rendered with `top = y * zoom - scrollY`.
            // So mouse position (client) needs to be converted to relative.
            // Actually, we can just track delta.

            // Simpler: Just update `currentPos` (client pixel)
            setDragging(prev => prev ? { ...prev, currentPos: current } : null);
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (dragging && onBreakChange) {
                // Calculate final position in "Sheet Pixels" (relative to 0,0 of sheet, scaled)
                const clientDelta = dragging.type === 'row'
                    ? e.clientY - dragging.startPos
                    : e.clientX - dragging.startPos;

                // Original Position (Pixels relative to sheet top)
                const originalPos = dragging.type === 'row'
                    ? rowPositions[dragging.index]
                    : colPositions[dragging.index];

                // New Position = Original + (Delta / Zoom)?
                // Wait, lines are rendered at (Pos * Zoom) - Scroll.
                // So Delta Screen Pixels = Delta Sheet Pixels * Zoom.
                // Delta Sheet Pixels = Delta Screen / Zoom.

                const newPos = originalPos + (clientDelta / zoom);

                onBreakChange(dragging.type, dragging.index, newPos);
            }
            setDragging(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, onBreakChange, rowPositions, colPositions, zoom]);

    return (
        <div
            className="absolute inset-0 z-[1000] overflow-hidden pointer-events-none"
        >
            {/* Backdrop Dimming - Darken everything, then "lighten" the pages? 
                Hard with CSS. 
                Alternative: Render a semi-transparent grey background, 
                and render WHITE divs for the pages on top.
            */}
            <div className="absolute inset-0 bg-gray-500/30 pointer-events-none" />

            {/* White Pages (Printable Areas) */}
            {rowPositions.map((y, rIdx) => {
                const prevY = rIdx === 0 ? 0 : rowPositions[rIdx - 1];
                const height = y - prevY;
                const top = (prevY * zoom) - scrollY;

                return colPositions.map((x, cIdx) => {
                    const prevX = cIdx === 0 ? 0 : colPositions[cIdx - 1];
                    const width = x - prevX;
                    const left = (prevX * zoom) - scrollX;

                    if (top < -height || top > window.innerHeight) return null;
                    if (left < -width || left > window.innerWidth) return null;

                    return (
                        <div
                            key={`p-${rIdx}-${cIdx}`}
                            className="absolute bg-transparent shadow-2xl"
                            style={{
                                top: `${top}px`,
                                left: `${left}px`,
                                width: `${width * zoom}px`,
                                height: `${height * zoom}px`,
                                boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)', // "Cutout" effect using giant shadow? No, that covers everything.
                                // Actually, we put the grey background behind, and make this white?
                                // But Luckysheet is behind.
                                // So we need this to be TRANSPARENT (to see content)
                                // and the AREA OUTSIDE to be GREY.

                                // Best trick: Box Shadow with huge spread?
                                // toggle: `boxShadow: '0 0 0 9999px rgba(0,0,0,0.2)'` 
                                // But multiple pages will overlap shadows.

                                // Fallback: Just borders for now. 
                                border: '2px solid rgba(0,0,0,0.5)',
                            }}
                        >
                            {/* Watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                <span className="text-6xl font-black text-gray-800 transform -rotate-12">
                                    PAGE {(rIdx * colPositions.length) + cIdx + 1}
                                </span>
                            </div>
                        </div>
                    )
                })
            })}

            {/* Horizontal Lines (Row Breaks) */}
            {rowPositions.map((y, idx) => {
                const top = (y * zoom) - scrollY;
                // If dragging this line, render at currentPos?
                // This visualization is tricky without re-rendering everything.
                // For now, render static line, interactions happen invisible or drag ghost?

                if (top < -50 || top > window.innerHeight + 50) return null;

                return (
                    <div
                        key={`h-${idx}`}
                        className="absolute left-0 w-full border-b-4 border-blue-600 border-dashed cursor-row-resize pointer-events-auto hover:border-blue-800 transition-colors hover:z-50"
                        style={{
                            top: `${top - 2}px`,
                            height: '4px',
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault(); // Prevent text selection
                            setDragging({ type: 'row', index: idx, startPos: e.clientY, currentPos: e.clientY });
                        }}
                    >
                        {/* Handle for easier clicking */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] px-1 rounded opacity-0 hover:opacity-100">
                            Break
                        </div>
                    </div>
                );
            })}

            {/* Vertical Lines (Col Breaks) */}
            {colPositions.map((x, idx) => {
                const left = (x * zoom) - scrollX;
                if (left < -50 || left > window.innerWidth + 50) return null;

                return (
                    <div
                        key={`v-${idx}`}
                        className="absolute top-0 h-full border-r-4 border-blue-600 border-dashed cursor-col-resize pointer-events-auto hover:border-blue-800 transition-colors hover:z-50"
                        style={{
                            left: `${left - 2}px`,
                            width: '4px',
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setDragging({ type: 'col', index: idx, startPos: e.clientX, currentPos: e.clientX });
                        }}
                    />
                );
            })}
        </div>
    );
};
