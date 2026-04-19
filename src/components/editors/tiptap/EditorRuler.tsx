import { useState, useRef, useCallback, useEffect } from 'react';
import { Orientation } from './PageLayout';

interface EditorRulerProps {
  width: number; // Width in pixels (container width)
  leftMargin: number; // Left margin in mm
  rightMargin: number; // Right margin in mm
  firstLineIndent: number; // First line indent in mm (relative to left margin)
  hangingIndent: number; // Hanging/left indent in mm (for all lines except first)
  tabStops: number[]; // Tab stop positions in mm from left margin
  onLeftMarginChange: (value: number) => void;
  onRightMarginChange: (value: number) => void;
  onFirstLineIndentChange: (value: number) => void;
  onHangingIndentChange: (value: number) => void;
  onTabStopsChange: (tabs: number[]) => void;
  pageWidth: number; // Page width in mm
  pageHeight?: number; // Page height in mm (for display)
  orientation?: Orientation;
  unit?: 'mm' | 'cm' | 'in'; // Display unit
  showVertical?: boolean; // Show vertical ruler
  topMargin?: number; // Top margin in mm
  bottomMargin?: number; // Bottom margin in mm
  onTopMarginChange?: (value: number) => void;
  onBottomMarginChange?: (value: number) => void;
  contentHeight?: number; // Content height in pixels
}

type DragType = 'leftMargin' | 'rightMargin' | 'firstLineIndent' | 'hangingIndent' | 'tabStop' | 'topMargin' | 'bottomMargin' | null;

// Ruler marks configuration based on unit
function getRulerConfig(unit: 'mm' | 'cm' | 'in') {
  switch (unit) {
    case 'cm':
      return { majorStep: 10, minorStep: 5, labelDivisor: 10, suffix: '' };
    case 'in':
      return { majorStep: 25.4, minorStep: 12.7, labelDivisor: 25.4, suffix: '"' };
    default:
      return { majorStep: 10, minorStep: 5, labelDivisor: 10, suffix: '' };
  }
}

export function EditorRuler({
  width,
  leftMargin,
  rightMargin,
  firstLineIndent,
  hangingIndent,
  tabStops,
  onLeftMarginChange,
  onRightMarginChange,
  onFirstLineIndentChange,
  onHangingIndentChange,
  onTabStopsChange,
  pageWidth,
  pageHeight,
  orientation = 'portrait',
  unit = 'cm',
  showVertical = false,
  topMargin = 25.4,
  bottomMargin = 25.4,
  onTopMarginChange,
  onBottomMarginChange,
  contentHeight = 500,
}: EditorRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null);
  const verticalRulerRef = useRef<HTMLDivElement>(null);
  const [dragType, setDragType] = useState<DragType>(null);
  const [dragTabIndex, setDragTabIndex] = useState<number | null>(null);
  const [hoveredTab, setHoveredTab] = useState<number | null>(null);

  // Convert mm to pixels
  const mmToPx = (mm: number) => (mm / pageWidth) * width;
  const mmToPxV = (mm: number) => (mm / (pageHeight || 297)) * contentHeight;
  // Convert pixels to mm
  const pxToMm = (px: number) => (px / width) * pageWidth;
  const pxToMmV = (px: number) => (px / contentHeight) * (pageHeight || 297);

  // Get ruler configuration based on unit
  const rulerConfig = getRulerConfig(unit);

  // Generate horizontal ruler marks
  const marks: { position: number; label?: string; isMajor: boolean }[] = [];
  const step = unit === 'in' ? 6.35 : 5; // 1/4 inch or 5mm steps
  
  for (let mm = 0; mm <= pageWidth; mm += step) {
    const isMajor = mm % rulerConfig.majorStep < 0.1 || Math.abs(mm % rulerConfig.majorStep - rulerConfig.majorStep) < 0.1;
    const labelValue = mm / rulerConfig.labelDivisor;
    marks.push({
      position: mmToPx(mm),
      label: isMajor ? `${Math.round(labelValue)}${rulerConfig.suffix}` : undefined,
      isMajor,
    });
  }

  // Generate vertical ruler marks
  const vMarks: { position: number; label?: string; isMajor: boolean }[] = [];
  const vHeight = pageHeight || 297;
  for (let mm = 0; mm <= vHeight; mm += step) {
    const isMajor = mm % rulerConfig.majorStep < 0.1 || Math.abs(mm % rulerConfig.majorStep - rulerConfig.majorStep) < 0.1;
    const labelValue = mm / rulerConfig.labelDivisor;
    vMarks.push({
      position: mmToPxV(mm),
      label: isMajor ? `${Math.round(labelValue)}${rulerConfig.suffix}` : undefined,
      isMajor,
    });
  }

  // Handle mouse down on markers
  const handleMarkerMouseDown = useCallback(
    (e: React.MouseEvent, type: DragType, tabIndex?: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragType(type);
      if (tabIndex !== undefined) {
        setDragTabIndex(tabIndex);
      }
    },
    []
  );

  // Handle ruler click to add tab stop
  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      if (dragType) return;
      const ruler = rulerRef.current;
      if (!ruler) return;
      if ((e.target as HTMLElement).closest('[data-marker]')) return;

      const rect = ruler.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const mm = pxToMm(x);
      const roundedMm = Math.round(mm / 2.5) * 2.5;

      if (roundedMm > leftMargin && roundedMm < pageWidth - rightMargin) {
        if (!tabStops.includes(roundedMm)) {
          onTabStopsChange([...tabStops, roundedMm].sort((a, b) => a - b));
        }
      }
    },
    [dragType, leftMargin, rightMargin, pageWidth, tabStops, onTabStopsChange, pxToMm]
  );

  // Handle double-click to remove tab stop
  const handleTabDoubleClick = useCallback(
    (index: number) => {
      const newTabs = tabStops.filter((_, i) => i !== index);
      onTabStopsChange(newTabs);
    },
    [tabStops, onTabStopsChange]
  );

  // Handle mouse move for dragging
  useEffect(() => {
    if (!dragType) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragType === 'topMargin' || dragType === 'bottomMargin') {
        const ruler = verticalRulerRef.current;
        if (!ruler) return;
        const rect = ruler.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const mm = pxToMmV(y);
        const roundedMm = Math.round(mm / 2.5) * 2.5;

        if (dragType === 'topMargin' && onTopMarginChange) {
          const newTop = Math.max(0, Math.min(roundedMm, (pageHeight || 297) - bottomMargin - 50));
          onTopMarginChange(newTop);
        } else if (dragType === 'bottomMargin' && onBottomMarginChange) {
          const newBottom = Math.max(0, Math.min((pageHeight || 297) - roundedMm, (pageHeight || 297) - topMargin - 50));
          onBottomMarginChange(newBottom);
        }
        return;
      }

      const ruler = rulerRef.current;
      if (!ruler) return;

      const rect = ruler.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const mm = pxToMm(x);
      const roundedMm = Math.round(mm / 2.5) * 2.5;

      switch (dragType) {
        case 'leftMargin':
          const newLeftMargin = Math.max(0, Math.min(roundedMm, pageWidth - rightMargin - 20));
          onLeftMarginChange(newLeftMargin);
          break;

        case 'rightMargin':
          const newRightMargin = Math.max(0, Math.min(pageWidth - roundedMm, pageWidth - leftMargin - 20));
          onRightMarginChange(newRightMargin);
          break;

        case 'firstLineIndent':
          // First line indent is relative to left margin, can be negative (outdent)
          const indentValue = roundedMm - leftMargin;
          const clampedIndent = Math.max(-30, Math.min(indentValue, 50));
          onFirstLineIndentChange(clampedIndent);
          break;

        case 'hangingIndent':
          // Hanging indent moves both the hanging indent marker and left margin together
          const hangingValue = roundedMm - leftMargin;
          const clampedHanging = Math.max(0, Math.min(hangingValue, 50));
          onHangingIndentChange(clampedHanging);
          break;

        case 'tabStop':
          if (dragTabIndex !== null) {
            const clampedMm = Math.max(leftMargin + 5, Math.min(roundedMm, pageWidth - rightMargin - 5));
            const newTabs = [...tabStops];
            newTabs[dragTabIndex] = clampedMm;
            onTabStopsChange(newTabs.sort((a, b) => a - b));
          }
          break;
      }
    };

    const handleMouseUp = () => {
      setDragType(null);
      setDragTabIndex(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [
    dragType,
    dragTabIndex,
    leftMargin,
    rightMargin,
    topMargin,
    bottomMargin,
    pageWidth,
    pageHeight,
    tabStops,
    onLeftMarginChange,
    onRightMarginChange,
    onTopMarginChange,
    onBottomMarginChange,
    onFirstLineIndentChange,
    onHangingIndentChange,
    onTabStopsChange,
    pxToMm,
    pxToMmV,
  ]);

  return (
    <div className="relative select-none flex">
      {/* Vertical Ruler */}
      {showVertical && (
        <div
          ref={verticalRulerRef}
          className="relative w-6 bg-gradient-to-r from-muted to-muted/80 border-r cursor-ns-resize"
          style={{ height: contentHeight }}
        >
          {/* Top margin area */}
          <div
            className="absolute left-0 right-0 bg-muted-foreground/10"
            style={{ top: 0, height: mmToPxV(topMargin) }}
          />
          {/* Bottom margin area */}
          <div
            className="absolute left-0 right-0 bg-muted-foreground/10"
            style={{ bottom: 0, height: mmToPxV(bottomMargin) }}
          />

          {/* Vertical ruler marks */}
          {vMarks.map((mark, index) => (
            <div
              key={index}
              className="absolute right-0 flex flex-row items-center"
              style={{ top: mark.position, transform: 'translateY(-50%)' }}
            >
              <div
                className={`bg-muted-foreground/60 ${mark.isMajor ? 'w-3 h-px' : 'w-1.5 h-px'}`}
              />
              {mark.label && (
                <span className="text-[8px] text-muted-foreground/80 leading-none -ml-0.5 rotate-0" style={{ writingMode: 'vertical-lr' }}>
                  {mark.label}
                </span>
              )}
            </div>
          ))}

          {/* Top margin marker */}
          {onTopMarginChange && (
            <div
              data-marker="topMargin"
              className="absolute left-0 cursor-ns-resize group z-10"
              style={{ top: mmToPxV(topMargin), transform: 'translateY(-50%)' }}
              onMouseDown={(e) => handleMarkerMouseDown(e, 'topMargin')}
              title="Margin atas - Seret untuk mengubah"
            >
              <svg width="24" height="10" viewBox="0 0 24 10" className="fill-blue-500 group-hover:fill-blue-600">
                <polygon points="0,5 10,0 10,10" />
                <rect x="10" y="3" width="14" height="4" />
              </svg>
              {dragType === 'topMargin' && (
                <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-[8px] px-1 rounded whitespace-nowrap z-20">
                  {topMargin.toFixed(1)}mm
                </div>
              )}
            </div>
          )}

          {/* Bottom margin marker */}
          {onBottomMarginChange && (
            <div
              data-marker="bottomMargin"
              className="absolute left-0 cursor-ns-resize group z-10"
              style={{ bottom: mmToPxV(bottomMargin), transform: 'translateY(50%)' }}
              onMouseDown={(e) => handleMarkerMouseDown(e, 'bottomMargin')}
              title="Margin bawah - Seret untuk mengubah"
            >
              <svg width="24" height="10" viewBox="0 0 24 10" className="fill-blue-500 group-hover:fill-blue-600">
                <polygon points="0,5 10,0 10,10" />
                <rect x="10" y="3" width="14" height="4" />
              </svg>
              {dragType === 'bottomMargin' && (
                <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-[8px] px-1 rounded whitespace-nowrap z-20">
                  {bottomMargin.toFixed(1)}mm
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Horizontal Ruler */}
      <div className="flex-1 relative">
        <div
          ref={rulerRef}
          className="relative h-7 bg-gradient-to-b from-muted to-muted/80 border-b cursor-crosshair"
          style={{ width }}
          onClick={handleRulerClick}
        >
          {/* Margin areas (grayed out) */}
          <div
            className="absolute top-0 bottom-0 bg-muted-foreground/10"
            style={{ left: 0, width: mmToPx(leftMargin) }}
          />
          <div
            className="absolute top-0 bottom-0 bg-muted-foreground/10"
            style={{ right: 0, width: mmToPx(rightMargin) }}
          />

          {/* Ruler marks */}
          {marks.map((mark, index) => (
            <div
              key={index}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: mark.position, transform: 'translateX(-50%)' }}
            >
              <div
                className={`bg-muted-foreground/60 ${mark.isMajor ? 'h-3 w-px' : 'h-1.5 w-px'}`}
              />
              {mark.label && (
                <span className="text-[8px] text-muted-foreground/80 leading-none -mt-0.5">
                  {mark.label}
                </span>
              )}
            </div>
          ))}

          {/* Tab stops */}
          {tabStops.map((tab, index) => (
            <div
              key={`tab-${index}`}
              data-marker="tab"
              className={`absolute bottom-0 cursor-move transition-colors ${
                hoveredTab === index ? 'text-destructive' : 'text-foreground'
              }`}
              style={{ left: mmToPx(tab), transform: 'translateX(-50%)' }}
              onMouseDown={(e) => handleMarkerMouseDown(e, 'tabStop', index)}
              onMouseEnter={() => setHoveredTab(index)}
              onMouseLeave={() => setHoveredTab(null)}
              onDoubleClick={() => handleTabDoubleClick(index)}
              title="Tab stop - Seret untuk pindah, klik ganda untuk hapus"
            >
              {/* Tab stop marker (L-shape like Word) */}
              <svg width="10" height="12" viewBox="0 0 10 12" className="fill-current">
                <path d="M0 0 L0 12 L10 12 L10 10 L2 10 L2 0 Z" />
              </svg>
              {hoveredTab === index && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-[8px] px-1 rounded whitespace-nowrap">
                  {tab}mm
                </div>
              )}
            </div>
          ))}

          {/* ============ WORD-STYLE INDENT MARKERS ============ */}
          
          {/* First Line Indent marker (top triangle - untuk baris pertama) */}
          <div
            data-marker="firstLineIndent"
            className="absolute top-0 cursor-ew-resize group z-20"
            style={{ left: mmToPx(leftMargin + firstLineIndent), transform: 'translateX(-50%)' }}
            onMouseDown={(e) => handleMarkerMouseDown(e, 'firstLineIndent')}
            title="Indentasi baris pertama - Seret untuk mengubah"
          >
            {/* Downward pointing triangle (first line indent) */}
            <svg width="14" height="8" viewBox="0 0 14 8" className="fill-gray-700 group-hover:fill-gray-900 dark:fill-gray-300 dark:group-hover:fill-white">
              <polygon points="7,8 0,0 14,0" />
            </svg>
            {dragType === 'firstLineIndent' && (
              <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[8px] px-1 rounded whitespace-nowrap z-30">
                {firstLineIndent >= 0 ? '+' : ''}{firstLineIndent.toFixed(1)}mm
              </div>
            )}
          </div>

          {/* Hanging Indent marker (upward triangle - untuk semua baris kecuali pertama) */}
          <div
            data-marker="hangingIndent"
            className="absolute cursor-ew-resize group z-10"
            style={{ 
              left: mmToPx(leftMargin + hangingIndent), 
              transform: 'translateX(-50%)',
              top: '10px'
            }}
            onMouseDown={(e) => handleMarkerMouseDown(e, 'hangingIndent')}
            title="Indentasi gantung - Seret untuk mengubah (semua baris kecuali pertama)"
          >
            {/* Upward pointing triangle (hanging indent) */}
            <svg width="14" height="8" viewBox="0 0 14 8" className="fill-gray-700 group-hover:fill-gray-900 dark:fill-gray-300 dark:group-hover:fill-white">
              <polygon points="7,0 0,8 14,8" />
            </svg>
            {dragType === 'hangingIndent' && (
              <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-[8px] px-1 rounded whitespace-nowrap z-30">
                +{hangingIndent.toFixed(1)}mm
              </div>
            )}
          </div>

          {/* Left Margin rectangle (box below hanging indent - moves both indents) */}
          <div
            data-marker="leftMargin"
            className="absolute cursor-ew-resize group z-10"
            style={{ 
              left: mmToPx(leftMargin), 
              transform: 'translateX(-50%)',
              bottom: '0'
            }}
            onMouseDown={(e) => handleMarkerMouseDown(e, 'leftMargin')}
            title="Margin kiri - Seret untuk mengubah (menggeser semua indent)"
          >
            {/* Rectangle marker (left margin) - blue to distinguish */}
            <svg width="14" height="6" viewBox="0 0 14 6" className="fill-blue-500 group-hover:fill-blue-600">
              <rect x="0" y="0" width="14" height="6" />
            </svg>
            {dragType === 'leftMargin' && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] px-1 rounded whitespace-nowrap z-30">
                {leftMargin.toFixed(1)}mm
              </div>
            )}
          </div>

          {/* Right Margin marker (triangle at bottom) */}
          <div
            data-marker="rightMargin"
            className="absolute bottom-0 cursor-ew-resize group z-10"
            style={{ right: mmToPx(rightMargin), transform: 'translateX(50%)' }}
            onMouseDown={(e) => handleMarkerMouseDown(e, 'rightMargin')}
            title="Margin kanan - Seret untuk mengubah"
          >
            {/* Triangle marker - blue like left margin */}
            <svg width="14" height="10" viewBox="0 0 14 10" className="fill-blue-500 group-hover:fill-blue-600">
              <polygon points="7,0 0,10 14,10" />
            </svg>
            {dragType === 'rightMargin' && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[8px] px-1 rounded whitespace-nowrap z-30">
                {rightMargin.toFixed(1)}mm
              </div>
            )}
          </div>
        </div>

        {/* Info text */}
        <div className="absolute right-2 top-0.5 text-[8px] text-muted-foreground pointer-events-none">
          Klik ruler untuk tambah tab stop
        </div>

        {/* Page size indicator */}
        <div className="absolute left-2 top-0.5 text-[8px] text-muted-foreground pointer-events-none">
          {pageWidth}×{pageHeight || '-'}mm
        </div>
      </div>
    </div>
  );
}
