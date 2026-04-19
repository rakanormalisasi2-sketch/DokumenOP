
export type RulerUnit = 'mm' | 'cm' | 'in' | 'pt' | 'px';

export const UNITS: Record<RulerUnit, number> = {
    mm: 3.7795, // 1mm = 3.7795px (at 96 DPI)
    cm: 37.795, // 1cm = 37.795px
    in: 96,     // 1in = 96px
    pt: 1.3333, // 1pt = 1.3333px
    px: 1       // 1px = 1px
};

export const convert = (value: number, from: RulerUnit, to: RulerUnit): number => {
    const px = value * UNITS[from];
    return px / UNITS[to];
};

export const snapToGrid = (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
};

export const getGridSize = (unit: RulerUnit): number => {
    switch (unit) {
        case 'in': return 0.125; // 1/8 inch
        case 'cm': return 0.1;   // 1 mm
        case 'mm': return 1;     // 1 mm
        case 'pt': return 12;    // 12 pt
        default: return 10;
    }
};

export const formatUnit = (value: number, unit: RulerUnit): string => {
    return `${value.toFixed(2)} ${unit}`;
};

export type TabType = 'left' | 'center' | 'right' | 'decimal';

export interface TabStop {
    position: number; // in unit (cm/in)
    type: TabType;
}

