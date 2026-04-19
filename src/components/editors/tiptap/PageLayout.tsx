import { ReactNode } from 'react';

// Paper sizes in mm (width x height)
export const PAPER_SIZES = {
  'A4': { width: 210, height: 297, label: 'A4 (210 × 297 mm)' },
  'A5': { width: 148, height: 210, label: 'A5 (148 × 210 mm)' },
  'Letter': { width: 215.9, height: 279.4, label: 'Letter (8.5 × 11 in)' },
  'Legal': { width: 215.9, height: 355.6, label: 'Legal (8.5 × 14 in)' },
  'F4': { width: 210, height: 330, label: 'F4/Folio (210 × 330 mm)' },
  'B5': { width: 176, height: 250, label: 'B5 (176 × 250 mm)' },
} as const;

export type PaperSizeKey = keyof typeof PAPER_SIZES;
export type Orientation = 'portrait' | 'landscape';

export interface PageMargins {
  top: number;    // mm
  bottom: number; // mm
  left: number;   // mm
  right: number;  // mm
}

// Common margin presets in mm
export const MARGIN_PRESETS = {
  'normal': { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4, label: 'Normal (2.54 cm)' },
  'narrow': { top: 12.7, bottom: 12.7, left: 12.7, right: 12.7, label: 'Narrow (1.27 cm)' },
  'moderate': { top: 25.4, bottom: 25.4, left: 19.05, right: 19.05, label: 'Moderate' },
  'wide': { top: 25.4, bottom: 25.4, left: 50.8, right: 50.8, label: 'Wide (5.08 cm)' },
  'mirrored': { top: 25.4, bottom: 25.4, left: 31.75, right: 25.4, label: 'Mirrored' },
  'office': { top: 20, bottom: 20, left: 20, right: 20, label: 'Office (2 cm)' },
} as const;

export type MarginPresetKey = keyof typeof MARGIN_PRESETS;

export interface PageLayoutConfig {
  paperSize: PaperSizeKey;
  orientation: Orientation;
  margins: PageMargins;
  zoom: number; // percentage
}

export function getPageDimensions(paperSize: PaperSizeKey, orientation: Orientation) {
  const size = PAPER_SIZES[paperSize];
  if (orientation === 'landscape') {
    return { width: size.height, height: size.width };
  }
  return { width: size.width, height: size.height };
}

export function getContentDimensions(config: PageLayoutConfig) {
  const page = getPageDimensions(config.paperSize, config.orientation);
  return {
    width: page.width - config.margins.left - config.margins.right,
    height: page.height - config.margins.top - config.margins.bottom,
  };
}

// Convert mm to pixels at a given DPI (default 96 for screen)
export function mmToPx(mm: number, dpi: number = 96): number {
  return (mm / 25.4) * dpi;
}

export function pxToMm(px: number, dpi: number = 96): number {
  return (px / dpi) * 25.4;
}

interface PageContainerProps {
  config: PageLayoutConfig;
  children: ReactNode;
  showPageBorder?: boolean;
  containerWidth?: number;
}

export function PageContainer({
  config,
  children,
  header,
  footer,
  showPageBorder = true,
  containerWidth = 800
}: PageContainerProps & { header?: ReactNode; footer?: ReactNode }) {
  const pageDimensions = getPageDimensions(config.paperSize, config.orientation);

  // Calculate scale to fit container while maintaining aspect ratio
  const pageAspectRatio = pageDimensions.width / pageDimensions.height;
  const zoom = config.zoom / 100;

  // Base width is the container width, scaled by zoom
  // We use a reference DPI of 96 for screen display
  const basePxWidth = mmToPx(pageDimensions.width);
  const basePxHeight = mmToPx(pageDimensions.height);

  // Scale to fit container width with some padding
  const maxWidth = containerWidth - 40; // 20px padding on each side
  const scale = Math.min(maxWidth / basePxWidth, 1) * zoom;

  const displayWidth = basePxWidth * scale;
  const displayHeight = basePxHeight * scale;

  // Convert margins to pixels at current scale
  const marginTop = mmToPx(config.margins.top) * scale;
  const marginBottom = mmToPx(config.margins.bottom) * scale;
  const marginLeft = mmToPx(config.margins.left) * scale;
  const marginRight = mmToPx(config.margins.right) * scale;

  return (
    <div
      className="relative mx-auto transition-all duration-200"
      style={{
        width: displayWidth,
        minHeight: displayHeight,
        backgroundColor: 'white',
        boxShadow: showPageBorder ? '0 0 10px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.1)' : undefined,
        border: showPageBorder ? '1px solid hsl(var(--border))' : undefined,
      }}
    >
      {/* Margin guides (visual only) */}
      {showPageBorder && (
        <>
          {/* Top margin line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-blue-200/50 pointer-events-none"
            style={{ top: marginTop }}
          />
          {/* Bottom margin line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-blue-200/50 pointer-events-none"
            style={{ bottom: marginBottom }}
          />
          {/* Left margin line */}
          <div
            className="absolute top-0 bottom-0 border-l border-dashed border-blue-200/50 pointer-events-none"
            style={{ left: marginLeft }}
          />
          {/* Right margin line */}
          <div
            className="absolute top-0 bottom-0 border-l border-dashed border-blue-200/50 pointer-events-none"
            style={{ right: marginRight }}
          />
        </>
      )}

      {/* Header Area */}
      {header && (
        <div
          className="absolute left-0 right-0 px-8 py-4 bg-transparent group/header hover:bg-muted/10 transition-colors"
          style={{
            top: 0,
            height: marginTop,
            paddingLeft: marginLeft,
            paddingRight: marginRight,
          }}
        >
          {header}
        </div>
      )}

      {/* Content area */}
      <div
        className="relative"
        style={{
          paddingTop: marginTop,
          paddingBottom: marginBottom,
          paddingLeft: marginLeft,
          paddingRight: marginRight,
          minHeight: displayHeight,
          isolation: 'isolate', // Create stacking context so z-index: -1 stays visible above page bg
        }}
      >
        {children}
      </div>

      {/* Footer Area */}
      {footer && (
        <div
          className="absolute left-0 right-0 px-8 py-4 bg-transparent group/footer hover:bg-muted/10 transition-colors"
          style={{
            bottom: 0,
            height: marginBottom,
            paddingLeft: marginLeft,
            paddingRight: marginRight,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

// Default config
export const DEFAULT_PAGE_CONFIG: PageLayoutConfig = {
  paperSize: 'A4',
  orientation: 'portrait',
  margins: { ...MARGIN_PRESETS.normal },
  zoom: 100,
};
