import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import type { SectionProperties } from '../../types/document';
import { FontPicker } from './FontPicker';
import { FontSizePicker } from './FontSizePicker';
import type { SelectionFormatting } from '../Toolbar';

export type RibbonTab = 'home' | 'insert' | 'layout' | 'references' | 'review' | 'view' | 'design';

export interface RibbonExtraProps {
    onOpenFootnoteProperties?: () => void;
    onPageSetupChange?: (updates: Partial<SectionProperties>) => void;
    onOpenFindReplace?: () => void;
    onToggleOutline?: () => void;
    showOutline?: boolean;
    sectionProperties?: SectionProperties | null;
    onWordCountUpdate?: (count: number) => void;
    wordCount?: number;
    onToggleRuler?: () => void;
    showRuler?: boolean;
    onInsertImage?: () => void;
    onInsertTable?: (rows: number, cols: number) => void;
    onInsertPageBreak?: () => void;
    onInsertTOC?: () => void;
    onZoomChange?: (zoom: number) => void;
    currentZoom?: number;
}

export type RibbonProps = RibbonExtraProps & {
    currentFormatting: SelectionFormatting;
    onFormat: (action: unknown) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    disabled?: boolean;
};

// ============================================================================
// RIBBON SUB-COMPONENTS
// ============================================================================

function RibbonGroup({ label, children }: { label?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-0.5 border-r border-slate-200 last:border-r-0 pr-1 mr-1">
            {label && <span className="text-[10px] text-slate-400 font-medium mr-1 whitespace-nowrap">{label}</span>}
            {children}
        </div>
    );
}

function RibbonButton({
    onClick,
    title,
    children,
    active,
    disabled,
    className,
}: {
    onClick?: () => void;
    title?: string;
    children: React.ReactNode;
    active?: boolean;
    disabled?: boolean;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "flex items-center justify-center w-7 h-7 rounded text-slate-600 transition-colors cursor-pointer text-xs",
                active ? "bg-blue-100 text-blue-700" : "hover:bg-slate-100 active:bg-slate-200",
                disabled && "opacity-40 cursor-not-allowed",
                className
            )}
        >
            {children}
        </button>
    );
}

function RibbonToggleGroup({ options, value, onChange, disabled }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center border border-slate-300 rounded overflow-hidden">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    disabled={disabled}
                    title={opt.label}
                    className={cn(
                        "px-2 h-7 text-[10px] font-medium transition-colors border-r border-slate-300 last:border-r-0",
                        value === opt.value
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-white text-slate-600 hover:bg-slate-50",
                        disabled && "opacity-40 cursor-not-allowed"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function RibbonSelect({ value, options, onChange, disabled, title }: {
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
    disabled?: boolean;
    title?: string;
}) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            title={title}
            className={cn(
                "h-7 px-1 text-[10px] border border-slate-300 rounded bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400",
                disabled && "opacity-40 cursor-not-allowed"
            )}
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

// ============================================================================
// HOME TAB - OnlyOffice Style
// Font, formatting, paragraph, styles (distinct from other tabs)
// ============================================================================

function HomeTab({ currentFormatting, onFormat, onUndo, onRedo, canUndo, canRedo, disabled }: {
    currentFormatting: SelectionFormatting;
    onFormat: (action: unknown) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    disabled?: boolean;
}) {
    const cf = currentFormatting;
    const fontFamilies = [
        { value: 'Calibri', label: 'Calibri' },
        { value: 'Arial', label: 'Arial' },
        { value: 'Times New Roman', label: 'Times New Roman' },
        { value: 'Georgia', label: 'Georgia' },
        { value: 'Verdana', label: 'Verdana' },
        { value: 'Courier New', label: 'Courier New' },
        { value: 'Cambria', label: 'Cambria' },
        { value: 'Segoe UI', label: 'Segoe UI' },
    ];

    const fontSizes = [
        { value: '8', label: '8' },
        { value: '9', label: '9' },
        { value: '10', label: '10' },
        { value: '11', label: '11' },
        { value: '12', label: '12' },
        { value: '14', label: '14' },
        { value: '16', label: '16' },
        { value: '18', label: '18' },
        { value: '20', label: '20' },
        { value: '22', label: '22' },
        { value: '24', label: '24' },
        { value: '26', label: '26' },
        { value: '28', label: '28' },
        { value: '36', label: '36' },
        { value: '48', label: '48' },
        { value: '72', label: '72' },
    ];

    const styles = [
        { value: 'Normal', label: 'Normal' },
        { value: 'Heading 1', label: 'Heading 1' },
        { value: 'Heading 2', label: 'Heading 2' },
        { value: 'Heading 3', label: 'Heading 3' },
        { value: 'Title', label: 'Title' },
        { value: 'Subtitle', label: 'Subtitle' },
    ];

    return (
        <>
            {/* Undo/Redo */}
            <RibbonGroup>
                <RibbonButton onClick={onUndo} disabled={disabled || !canUndo} title="Undo (Ctrl+Z)">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 8h7a3 3 0 1 0-3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 5l-3 3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton onClick={onRedo} disabled={disabled || !canRedo} title="Redo (Ctrl+Y)">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M13 8H6a3 3 0 1 1 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Font Family */}
            <RibbonGroup label="Font">
                <FontPicker
                    value={cf.fontFamily || 'Calibri'}
                    options={fontFamilies}
                    onChange={(v) => onFormat({ type: 'fontFamily', value: v })}
                    disabled={disabled}
                />
            </RibbonGroup>

            {/* Font Size */}
            <RibbonGroup label="Size">
                <FontSizePicker
                    value={cf.fontSize ? Math.round(cf.fontSize) : 11}
                    options={fontSizes}
                    onChange={(v) => onFormat({ type: 'fontSize', value: v })}
                    disabled={disabled}
                />
            </RibbonGroup>

            {/* Font Dialog Launcher */}
            <RibbonGroup>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'fontDialog' })}
                    title="Font Dialog (Advanced)"
                    disabled={disabled}
                    className="w-5 h-5"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 12 12">
                        <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Bold/Italic/Underline/Strikethrough */}
            <RibbonGroup label="Format">
                <RibbonButton
                    onClick={() => onFormat('bold')}
                    active={cf.bold}
                    title="Bold (Ctrl+B)"
                    disabled={disabled}
                    className="font-bold"
                >
                    <span className="text-[13px] font-bold">B</span>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat('italic')}
                    active={cf.italic}
                    title="Italic (Ctrl+I)"
                    disabled={disabled}
                    className="italic"
                >
                    <span className="text-[13px] italic">I</span>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat('underline')}
                    active={cf.underline}
                    title="Underline (Ctrl+U)"
                    disabled={disabled}
                    className="underline"
                >
                    <span className="text-[13px] underline">U</span>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat('strikethrough')}
                    active={cf.strike}
                    title="Strikethrough"
                    disabled={disabled}
                >
                    <span className="text-[11px] line-through">S</span>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat('subscript')}
                    active={cf.subscript}
                    title="Subscript"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <text x="3" y="12" fontSize="8" fill="currentColor" fontFamily="serif">X</text>
                        <text x="9" y="15" fontSize="6" fill="currentColor" fontFamily="serif">s</text>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat('superscript')}
                    active={cf.superscript}
                    title="Superscript"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <text x="3" y="9" fontSize="6" fill="currentColor" fontFamily="serif">s</text>
                        <text x="7" y="13" fontSize="8" fill="currentColor" fontFamily="serif">X</text>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Text Color */}
            <RibbonGroup label="Color">
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'textColor' })}
                    title="Text Color"
                    disabled={disabled}
                >
                    <div className="relative w-4 h-4">
                        <div className="w-4 h-4 rounded-sm border border-slate-300" style={{ backgroundColor: cf.color || '#000000' }} />
                        <div className="absolute -bottom-0.5 left-0 right-0 h-1 bg-blue-600 rounded-sm" />
                    </div>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'highlightColor' })}
                    title="Highlight Color"
                    disabled={disabled}
                >
                    <div className="relative w-4 h-4">
                        <div className="w-4 h-4 rounded-sm border border-slate-300 bg-yellow-200" />
                    </div>
                </RibbonButton>
            </RibbonGroup>

            {/* Clear Formatting */}
            <RibbonGroup>
                <RibbonButton
                    onClick={() => onFormat('clearFormatting')}
                    title="Clear Formatting"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M4 6l8 0M3 6h10v9H3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M6 6V4h4v2" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M6 9l4 2M10 9l-4 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Paragraph Spacing */}
            <RibbonGroup label="Spacing">
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'decreaseSpacing' })}
                    title="Decrease Paragraph Spacing"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M3 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M3 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'increaseSpacing' })}
                    title="Increase Paragraph Spacing"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 4h10M3 7h6M3 10h4M3 13h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Indent */}
            <RibbonGroup label="Indent">
                <RibbonButton
                    onClick={() => onFormat('outdent')}
                    title="Decrease Indent"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 4h10M3 8h6M3 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <path d="M3 8l-2-2v4l2-2z" fill="currentColor"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat('indent')}
                    title="Increase Indent"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 4h10M3 8h6M3 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <path d="M13 8l2-2v4l-2-2z" fill="currentColor"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Line Spacing */}
            <RibbonGroup label="Line">
                <RibbonSelect
                    value={cf.lineSpacing || '1.15'}
                    options={[
                        { value: '1.0', label: '1.0' },
                        { value: '1.15', label: '1.15' },
                        { value: '1.5', label: '1.5' },
                        { value: '2.0', label: '2.0' },
                        { value: '2.5', label: '2.5' },
                        { value: '3.0', label: '3.0' },
                    ]}
                    onChange={(v) => onFormat({ type: 'lineSpacing', value: v })}
                    disabled={disabled}
                    title="Line Spacing"
                />
            </RibbonGroup>

            {/* Alignment */}
            <RibbonGroup label="Align">
                <RibbonButton
                    onClick={() => onFormat({ type: 'alignment', value: 'left' })}
                    active={cf.align === 'left' || !cf.align}
                    title="Align Left"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M2 3h12M2 7h8M2 11h10M2 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'alignment', value: 'center' })}
                    active={cf.align === 'center'}
                    title="Align Center"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M2 3h12M4 7h8M3 11h10M5 15h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'alignment', value: 'right' })}
                    active={cf.align === 'right'}
                    title="Align Right"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M2 3h12M6 7h8M4 11h10M6 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'alignment', value: 'both' })}
                    active={cf.align === 'both'}
                    title="Justify"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M2 3h12M2 7h12M2 11h12M2 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Lists */}
            <RibbonGroup label="List">
                <RibbonButton
                    onClick={() => onFormat('bulletList')}
                    title="Bullet List"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <circle cx="3" cy="4" r="1" fill="currentColor"/>
                        <circle cx="3" cy="8" r="1" fill="currentColor"/>
                        <circle cx="3" cy="12" r="1" fill="currentColor"/>
                        <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat('numberedList')}
                    title="Numbered List"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 2h1v3M3 5h2M3 8h2M3 11h2M3 14h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                        <path d="M7 4h7M7 8h7M7 12h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Styles */}
            <RibbonGroup label="Style">
                <RibbonSelect
                    value={cf.style || 'Normal'}
                    options={styles}
                    onChange={(v) => onFormat({ type: 'applyStyle', value: v })}
                    disabled={disabled}
                    title="Paragraph Style"
                />
            </RibbonGroup>

            {/* Placeholder Insert */}
            <RibbonGroup label="Quick Parts">
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertPlaceholder' })}
                    title="Insert Placeholder (Content Control)"
                    disabled={disabled}
                >
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold' }}>{ }</span>
                </RibbonButton>
            </RibbonGroup>
        </>
    );
}

// ============================================================================
// INSERT TAB - OnlyOffice Style
// Pages, Tables, Illustrations, Links, Header/Footer, Symbols
// ============================================================================

function InsertTab({ onFormat, disabled, onInsertImage, onInsertTable, onInsertPageBreak }: {
    onFormat: (action: unknown) => void;
    disabled?: boolean;
    onInsertImage?: () => void;
    onInsertTable?: (rows: number, cols: number) => void;
    onInsertPageBreak?: () => void;
}) {
    const [tableGrid, setTableGrid] = useState<{ rows: number; cols: number } | null>(null);
    const [showTablePicker, setShowTablePicker] = useState(false);

    const handleTableClick = (rows: number, cols: number) => {
        onInsertTable?.(rows, cols);
        setShowTablePicker(false);
    };

    return (
        <>
            {/* Pages Group */}
            <RibbonGroup label="Pages">
                <RibbonButton
                    onClick={onInsertPageBreak}
                    title="Page Break (insert page break)"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2"/>
                        <path d="M10 5l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertBlankPage' })}
                    title="Blank Page"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="2" y="1" width="9" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="5" y="4" width="9" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" fill="white"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Tables Group */}
            <RibbonGroup label="Tables">
                <div className="relative">
                    <RibbonButton
                        onClick={() => setShowTablePicker(!showTablePicker)}
                        title="Insert Table"
                        disabled={disabled}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                            <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                            <line x1="1" y1="5.67" x2="15" y2="5.67" stroke="currentColor" strokeWidth="0.8"/>
                            <line x1="1" y1="10.33" x2="15" y2="10.33" stroke="currentColor" strokeWidth="0.8"/>
                            <line x1="5.67" y1="1" x2="5.67" y2="15" stroke="currentColor" strokeWidth="0.8"/>
                            <line x1="10.33" y1="1" x2="10.33" y2="15" stroke="currentColor" strokeWidth="0.8"/>
                        </svg>
                    </RibbonButton>
                    {showTablePicker && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-slate-300 rounded shadow-lg z-50">
                            <div className="grid grid-cols-8 gap-0.5">
                                {Array.from({ length: 64 }).map((_, i) => (
                                    <button
                                        key={i}
                                        className={cn(
                                            "w-4 h-4 border border-slate-300 rounded-sm transition-colors",
                                            tableGrid && i < tableGrid.cols * tableGrid.rows
                                                ? "bg-blue-600 border-blue-600"
                                                : "hover:bg-blue-200"
                                        )}
                                        onMouseEnter={() => {
                                            const cols = (i % 8) + 1;
                                            const rows = Math.floor(i / 8) + 1;
                                            if (i < 64) setTableGrid({ rows, cols });
                                        }}
                                        onMouseLeave={() => setTableGrid(null)}
                                        onClick={() => {
                                            const cols = (i % 8) + 1;
                                            const rows = Math.floor(i / 8) + 1;
                                            handleTableClick(rows, cols);
                                        }}
                                    />
                                ))}
                            </div>
                            {tableGrid && (
                                <div className="text-[9px] text-slate-500 mt-1 text-center">
                                    {tableGrid.rows} x {tableGrid.cols}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </RibbonGroup>

            {/* Illustrations Group */}
            <RibbonGroup label="Illustrations">
                <RibbonButton
                    onClick={onInsertImage}
                    title="Insert Image"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1"/>
                        <path d="M1 11l4-4 3 3 2-2 4 4" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertShape' })}
                    title="Insert Shape"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" transform="rotate(15 8 8)"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertChart' })}
                    title="Insert Chart"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="2" y="8" width="3" height="6" rx="0.5" fill="currentColor" opacity="0.6"/>
                        <rect x="6.5" y="5" width="3" height="9" rx="0.5" fill="currentColor" opacity="0.8"/>
                        <rect x="11" y="3" width="3" height="11" rx="0.5" fill="currentColor"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Links Group */}
            <RibbonGroup label="Links">
                <RibbonButton
                    onClick={() => onFormat('insertLink')}
                    title="Insert Hyperlink (Ctrl+K)"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M7 9l5-5M6 10l-3 3a3 3 0 0 0 4.24 4.24l3-3M10 6l3-3a3 3 0 0 1 4.24 4.24l-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertBookmark' })}
                    title="Insert Bookmark"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 2h10v14l-5-4-5 4V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Header & Footer Group */}
            <RibbonGroup label="Header &amp; Footer">
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertHeader' })}
                    title="Insert Header"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="3" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="1" y="7" width="14" height="7" rx="0.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertFooter' })}
                    title="Insert Footer"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="7" width="14" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="1" y="2" width="14" height="7" rx="0.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertPageNumber' })}
                    title="Insert Page Number"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <text x="8" y="10.5" fontSize="7" fill="currentColor" textAnchor="middle" fontWeight="bold">#</text>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Symbols & Special Characters */}
            <RibbonGroup label="Symbols">
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertSymbol' })}
                    title="Insert Symbol (Omega)"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <text x="1" y="13" fontSize="13" fontWeight="bold" fill="currentColor" fontFamily="serif">Omega</text>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertEquation' })}
                    title="Insert Equation"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <text x="1" y="12" fontSize="10" fill="currentColor" fontFamily="serif">fx</text>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertDate' })}
                    title="Insert Date"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="2" y="3" width="12" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <line x1="5" y1="1" x2="5" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <line x1="11" y1="1" x2="11" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <line x1="2" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="6" cy="10" r="1" fill="currentColor"/>
                        <circle cx="10" cy="10" r="1" fill="currentColor"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onFormat({ type: 'custom', value: 'insertTime' })}
                    title="Insert Time"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>
        </>
    );
}

// ============================================================================
// LAYOUT TAB - OnlyOffice Style
// Page Setup, Margins, Orientation, Columns, Section Break
// ============================================================================

function LayoutTab({ sectionProperties, onPageSetupChange, disabled }: {
    sectionProperties?: SectionProperties | null;
    onPageSetupChange?: (updates: Partial<SectionProperties>) => void;
    disabled?: boolean;
}) {
    const [layoutMargins, setLayoutMargins] = useState('normal');
    const [layoutColumns, setLayoutColumns] = useState('1');

    // Detect current paper size
    const currentPageWidth = sectionProperties?.pageWidth;
    const currentPageHeight = sectionProperties?.pageHeight;
    const detectCurrentSize = (): string => {
        const tolerance = 1;
        const toMm = (twips: number) => Math.round(twips / 56.7);
        if (currentPageWidth && currentPageHeight) {
            const w = toMm(currentPageWidth);
            const h = toMm(currentPageHeight);
            if ((Math.abs(w - 210) < tolerance && Math.abs(h - 297) < tolerance) ||
                (Math.abs(w - 297) < tolerance && Math.abs(h - 210) < tolerance)) return 'a4';
            if ((Math.abs(w - 216) < tolerance && Math.abs(h - 279) < tolerance) ||
                (Math.abs(w - 279) < tolerance && Math.abs(h - 216) < tolerance)) return 'letter';
            if ((Math.abs(w - 216) < tolerance && Math.abs(h - 356) < tolerance) ||
                (Math.abs(w - 356) < tolerance && Math.abs(h - 216) < tolerance)) return 'legal';
            if ((Math.abs(w - 184) < tolerance && Math.abs(h - 267) < tolerance) ||
                (Math.abs(w - 267) < tolerance && Math.abs(h - 184) < tolerance)) return 'executive';
            if ((Math.abs(w - 148) < tolerance && Math.abs(h - 210) < tolerance) ||
                (Math.abs(w - 210) < tolerance && Math.abs(h - 148) < tolerance)) return 'a5';
            if ((Math.abs(w - 216) < tolerance && Math.abs(h - 330) < tolerance) ||
                (Math.abs(w - 330) < tolerance && Math.abs(h - 216) < tolerance)) return 'folio';
        }
        return 'a4';
    };
    const [currentPaperSize, setCurrentPaperSize] = useState(detectCurrentSize());

    const effectiveOrientation: 'portrait' | 'landscape' =
        currentPageWidth != null && currentPageHeight != null
            ? currentPageWidth > currentPageHeight ? 'landscape' : 'portrait'
            : 'portrait';

    const handlePaperSizeChange = (size: string) => {
        setCurrentPaperSize(size);
        const sizeMap: Record<string, Partial<SectionProperties>> = {
            a4: { pageWidth: 11906, pageHeight: 16838 },
            letter: { pageWidth: 12239, pageHeight: 15840 },
            legal: { pageWidth: 12239, pageHeight: 20160 },
            executive: { pageWidth: 10438, pageHeight: 15118 },
            a5: { pageWidth: 8388, pageHeight: 11906 },
            folio: { pageWidth: 12240, pageHeight: 18720 }, // 8.5×13 in = 12240×18720 twips
        };
        onPageSetupChange?.(sizeMap[size] || sizeMap.a4);
    };

    const handleMarginsChange = (preset: string) => {
        setLayoutMargins(preset);
        const marginMap: Record<string, Partial<SectionProperties>> = {
            normal: { marginTop: 72, marginBottom: 72, marginLeft: 72, marginRight: 72 },
            narrow: { marginTop: 36, marginBottom: 36, marginLeft: 36, marginRight: 36 },
            wide: { marginTop: 72, marginBottom: 72, marginLeft: 144, marginRight: 144 },
            moderate: { marginTop: 54, marginBottom: 54, marginLeft: 72, marginRight: 72 },
        };
        onPageSetupChange?.(marginMap[preset] || marginMap.normal);
    };

    const handleOrientationChange = (dir: 'portrait' | 'landscape') => {
        // Swap current width/height to flip orientation, preserving current paper size
        const w = currentPageWidth ?? 11906;
        const h = currentPageHeight ?? 16838;
        if (dir === 'landscape') {
            // If already landscape, keep as-is; otherwise swap
            onPageSetupChange?.({
                pageWidth: w > h ? w : h,
                pageHeight: w > h ? h : w,
            });
        } else {
            onPageSetupChange?.({
                pageWidth: w > h ? h : w,
                pageHeight: w > h ? w : h,
            });
        }
    };

    return (
        <>
            {/* Page Setup */}
            <RibbonGroup label="Page Setup">
                <RibbonSelect
                    value={currentPaperSize}
                    options={[
                        { value: 'a4', label: 'A4' },
                        { value: 'letter', label: 'Letter' },
                        { value: 'legal', label: 'Legal' },
                        { value: 'executive', label: 'Executive' },
                        { value: 'a5', label: 'A5' },
                        { value: 'folio', label: 'Folio (8.5×13")' },
                    ]}
                    onChange={handlePaperSizeChange}
                    disabled={disabled}
                    title="Paper Size"
                />
            </RibbonGroup>

            {/* Margins */}
            <RibbonGroup label="Margins">
                <RibbonSelect
                    value={layoutMargins}
                    options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'narrow', label: 'Narrow' },
                        { value: 'wide', label: 'Wide' },
                        { value: 'moderate', label: 'Moderate' },
                    ]}
                    onChange={handleMarginsChange}
                    disabled={disabled}
                    title="Margins"
                />
            </RibbonGroup>

            {/* Orientation */}
            <RibbonGroup label="Orientation">
                <RibbonToggleGroup
                    options={[
                        { value: 'portrait', label: 'Portrait' },
                        { value: 'landscape', label: 'Landscape' },
                    ]}
                    value={effectiveOrientation}
                    onChange={(v) => handleOrientationChange(v as 'portrait' | 'landscape')}
                    disabled={disabled}
                />
            </RibbonGroup>

            {/* Columns */}
            <RibbonGroup label="Columns">
                <RibbonSelect
                    value={layoutColumns}
                    options={[
                        { value: '1', label: 'One' },
                        { value: '2', label: 'Two' },
                        { value: '3', label: 'Three' },
                    ]}
                    onChange={(v) => {
                        setLayoutColumns(v);
                        onPageSetupChange?.({ columnCount: parseInt(v) });
                    }}
                    disabled={disabled}
                    title="Columns"
                />
            </RibbonGroup>

            {/* Section Breaks */}
            <RibbonGroup label="Breaks">
                <RibbonButton
                    onClick={() => onPageSetupChange?.({ sectionType: 'nextPage' })}
                    title="Section Break: Next Page"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1"/>
                        <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onPageSetupChange?.({ sectionType: 'continuous' })}
                    title="Section Break: Continuous"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => onPageSetupChange?.({ sectionType: 'evenPage' })}
                    title="Section Break: Even Page"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="1" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="1"/>
                        <rect x="9" y="1" width="6" height="14" rx="1" stroke="currentColor" strokeWidth="1"/>
                        <line x1="1" y1="8" x2="7" y2="8" stroke="currentColor" strokeWidth="1"/>
                        <line x1="9" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>
        </>
    );
}

// ============================================================================
// REFERENCES TAB - OnlyOffice Style
// Table of Contents, Footnotes, Endnotes, Captions
// ============================================================================

function ReferencesTab({ onOpenFootnoteProperties, onInsertTOC, disabled }: {
    onOpenFootnoteProperties?: () => void;
    onInsertTOC?: () => void;
    disabled?: boolean;
}) {
    return (
        <>
            {/* Table of Contents */}
            <RibbonGroup label="Table of Contents">
                <RibbonButton
                    onClick={onInsertTOC}
                    title="Insert Table of Contents"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="2" y="2" width="12" height="2" rx="0.5" fill="currentColor"/>
                        <rect x="2" y="6" width="8" height="1.5" rx="0.5" fill="currentColor" opacity="0.6"/>
                        <rect x="2" y="9" width="9" height="1.5" rx="0.5" fill="currentColor" opacity="0.6"/>
                        <rect x="2" y="12" width="6" height="1.5" rx="0.5" fill="currentColor" opacity="0.4"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Update Table of Contents"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 8a5 5 0 1 1 1.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M4.5 11.5V9l2 2.5-2 2.5V11.5z" fill="currentColor"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Footnotes */}
            <RibbonGroup label="Footnotes">
                <RibbonButton
                    onClick={onOpenFootnoteProperties}
                    title="Insert Footnote"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <text x="2" y="9" fontSize="7" fill="currentColor" fontWeight="bold">1</text>
                        <line x1="5" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={onOpenFootnoteProperties}
                    title="Insert Endnote"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <text x="2" y="9" fontSize="7" fill="currentColor" fontWeight="bold" fontStyle="italic">i</text>
                        <line x1="5" y1="10" x2="14" y2="10" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Go to Footnote"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Captions */}
            <RibbonGroup label="Captions">
                <RibbonButton
                    onClick={() => {}}
                    title="Insert Caption"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="6" width="14" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="3" y="1" width="10" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Insert Table of Figures"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="1" width="6" height="6" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                        <rect x="9" y="1" width="6" height="3" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                        <rect x="9" y="5" width="4" height="2" rx="0.5" stroke="currentColor" strokeWidth="0.8"/>
                        <rect x="1" y="9" width="14" height="6" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                        <rect x="3" y="11" width="10" height="1" rx="0.5" fill="currentColor" opacity="0.4"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Cross-References */}
            <RibbonGroup label="Cross-refs">
                <RibbonButton
                    onClick={() => {}}
                    title="Insert Cross-reference"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>
        </>
    );
}

// ============================================================================
// REVIEW TAB - OnlyOffice Style
// Spelling, Find & Replace, Word Count, Comments, Track Changes
// ============================================================================

function ReviewTab({ onOpenFindReplace, wordCount, disabled }: {
    onOpenFindReplace?: () => void;
    wordCount?: number;
    disabled?: boolean;
}) {
    return (
        <>
            {/* Proofing / Spelling */}
            <RibbonGroup label="Proofing">
                <RibbonButton
                    onClick={() => {}}
                    title="Spelling & Grammar Check"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M6 2L7.5 9H8.5L10 2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M4.5 12.5C4.5 11.4 5.4 10.5 6.5 10.5H9.5C10.6 10.5 11.5 11.4 11.5 12.5V13H4.5V12.5Z" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M6.5 10.5V13H9.5V10.5" stroke="currentColor" strokeWidth="1.2"/>
                        <line x1="8" y1="10.5" x2="8" y2="13" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Find & Replace */}
            <RibbonGroup label="Find">
                <RibbonButton
                    onClick={onOpenFindReplace}
                    title="Find & Replace (Ctrl+H)"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2"/>
                        <line x1="9.5" y1="9.5" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Word Count */}
            <RibbonGroup label="Statistics">
                <div className="flex items-center gap-1 px-2 h-7 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-600">
                    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 12 12">
                        <rect x="1" y="3" width="10" height="1" rx="0.5" fill="currentColor"/>
                        <rect x="1" y="5.5" width="8" height="1" rx="0.5" fill="currentColor"/>
                        <rect x="1" y="8" width="6" height="1" rx="0.5" fill="currentColor"/>
                    </svg>
                    <span className="font-medium">{wordCount?.toLocaleString() ?? 0}</span>
                    <span className="text-slate-400">words</span>
                </div>
            </RibbonGroup>

            {/* Comments */}
            <RibbonGroup label="Comments">
                <RibbonButton
                    onClick={() => {}}
                    title="Insert Comment"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M2 2h12v9H9l-3 3V11H2V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Delete Comment"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M2 2h12v9H9l-3 3V11H2V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                        <path d="M5 2V1h6v1M6 7v4M10 7v4M4 2l.8 10h6.4L12 2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Previous Comment"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Next Comment"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Track Changes */}
            <RibbonGroup label="Track">
                <RibbonButton
                    onClick={() => {}}
                    title="Track Changes"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M10 3H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
                        <path d="M2 3h2M12 3h2M2 13h2M12 13h2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Accept Change"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M3 8l4 4 6-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Reject Change"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Language */}
            <RibbonGroup label="Language">
                <RibbonSelect
                    value="id-ID"
                    options={[
                        { value: 'id-ID', label: 'Indonesian' },
                        { value: 'en-US', label: 'English (US)' },
                        { value: 'en-GB', label: 'English (UK)' },
                        { value: 'ms-MY', label: 'Malay' },
                    ]}
                    onChange={() => {}}
                    disabled={disabled}
                    title="Proofing Language"
                />
            </RibbonGroup>
        </>
    );
}

// ============================================================================
// DESIGN TAB - OnlyOffice Style
// Document Theme, Colors, Page Border, Page Color, Watermark
// ============================================================================

function DesignTab({ disabled }: { disabled?: boolean }) {
    const [selectedColor, setSelectedColor] = useState('#1a56db');

    const themeColors = [
        { value: '#1a56db', label: 'Blue' },
        { value: '#dc2626', label: 'Red' },
        { value: '#16a34a', label: 'Green' },
        { value: '#ca8a04', label: 'Yellow' },
        { value: '#7c3aed', label: 'Purple' },
        { value: '#db2777', label: 'Pink' },
        { value: '#0891b2', label: 'Cyan' },
        { value: '#44403c', label: 'Brown' },
    ];

    return (
        <>
            {/* Document Theme */}
            <RibbonGroup label="Document Theme">
                <RibbonSelect
                    value="default"
                    options={[
                        { value: 'default', label: 'Default Theme' },
                        { value: 'corporate', label: 'Corporate' },
                        { value: 'elegant', label: 'Elegant' },
                        { value: 'modern', label: 'Modern' },
                        { value: 'formal', label: 'Formal' },
                    ]}
                    onChange={() => {}}
                    disabled={disabled}
                    title="Document Theme"
                />
            </RibbonGroup>

            {/* Color Theme */}
            <RibbonGroup label="Colors">
                <div className="flex items-center gap-0.5">
                    {themeColors.map((color) => (
                        <button
                            key={color.value}
                            className={cn(
                                "w-4 h-4 rounded-full border border-slate-200 hover:scale-110 transition-transform cursor-pointer",
                                selectedColor === color.value && "ring-2 ring-blue-400 ring-offset-1"
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                            onClick={() => setSelectedColor(color.value)}
                        />
                    ))}
                </div>
            </RibbonGroup>

            {/* Page Background */}
            <RibbonGroup label="Page Background">
                <RibbonButton
                    onClick={() => {}}
                    title="Page Color (Background)"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="1" width="14" height="14" rx="1" fill="currentColor" opacity="0.15"/>
                        <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Page Border"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Watermark */}
            <RibbonGroup label="Watermark">
                <RibbonButton
                    onClick={() => {}}
                    title="Insert Watermark"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <text x="8" y="10" fontSize="8" fill="currentColor" opacity="0.3" textAnchor="middle" fontFamily="serif">WATERMARK</text>
                        <rect x="1" y="1" width="14" height="14" rx="1" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" opacity="0.4"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={() => {}}
                    title="Remove Watermark"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Effects */}
            <RibbonGroup label="Effects">
                <RibbonButton
                    onClick={() => {}}
                    title="Shadow"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1" opacity="0.3" fill="currentColor" fillOpacity="0.1"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>
        </>
    );
}

// ============================================================================
// VIEW TAB - OnlyOffice Style
// Ruler, Document Outline, Zoom
// ============================================================================

function ViewTab({ onToggleRuler, showRuler, onToggleOutline, showOutline, onZoomChange, currentZoom, disabled }: {
    onToggleRuler?: () => void;
    showRuler?: boolean;
    onToggleOutline?: () => void;
    showOutline?: boolean;
    onZoomChange?: (zoom: number) => void;
    currentZoom?: number;
    disabled?: boolean;
}) {
    const zoomOptions = [
        { value: '0.5', label: '50%' },
        { value: '0.75', label: '75%' },
        { value: '1.0', label: '100%' },
        { value: '1.25', label: '125%' },
        { value: '1.5', label: '150%' },
        { value: '2.0', label: '200%' },
        { value: 'fit-page', label: 'Fit Page' },
        { value: 'fit-width', label: 'Fit Width' },
    ];

    return (
        <>
            {/* Ruler Toggle */}
            <RibbonGroup label="Show">
                <RibbonButton
                    onClick={onToggleRuler}
                    active={showRuler}
                    title="Toggle Ruler"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <line x1="2" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1.5"/>
                        {[4, 7, 10, 13].map((x) => (
                            <line key={x} x1={x} y1="3" x2={x} y2={x < 10 ? 5 : 6} stroke="currentColor" strokeWidth="1"/>
                        ))}
                        <rect x="2" y="5" width="12" height="8" rx="0.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                </RibbonButton>
                <RibbonButton
                    onClick={onToggleOutline}
                    active={showOutline}
                    title="Toggle Document Outline"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <rect x="2" y="2" width="12" height="2" rx="0.5" fill="currentColor"/>
                        <rect x="2" y="6" width="9" height="1.5" rx="0.5" fill="currentColor" opacity="0.65"/>
                        <rect x="2" y="9" width="7" height="1.5" rx="0.5" fill="currentColor" opacity="0.4"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>

            {/* Zoom */}
            <RibbonGroup label="Zoom">
                <RibbonSelect
                    value={currentZoom ? String(currentZoom) : '1.0'}
                    options={zoomOptions}
                    onChange={(v) => {
                        if (v === 'fit-page' || v === 'fit-width') {
                            // Handle special zoom modes
                            onZoomChange?.(1.0);
                        } else {
                            onZoomChange?.(parseFloat(v));
                        }
                    }}
                    disabled={disabled}
                    title="Zoom Level"
                />
            </RibbonGroup>

            {/* Print Layout */}
            <RibbonGroup label="View Mode">
                <RibbonToggleGroup
                    options={[
                        { value: 'print', label: 'Print' },
                        { value: 'web', label: 'Web' },
                        { value: 'outline', label: 'Outline' },
                        { value: 'draft', label: 'Draft' },
                    ]}
                    value="print"
                    onChange={() => {}}
                    disabled={disabled}
                />
            </RibbonGroup>

            {/* Full Screen */}
            <RibbonGroup>
                <RibbonButton
                    onClick={() => {}}
                    title="Full Screen"
                    disabled={disabled}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                        <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </RibbonButton>
            </RibbonGroup>
        </>
    );
}

// ============================================================================
// MAIN RIBBON COMPONENT
// ============================================================================

export function Ribbon({
    currentFormatting,
    onFormat,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    disabled,
    onInsertImage,
    onInsertTable,
    onInsertPageBreak,
    onInsertTOC,
    onOpenFootnoteProperties,
    onPageSetupChange,
    onOpenFindReplace,
    onToggleOutline,
    showOutline,
    sectionProperties,
    wordCount = 0,
    onToggleRuler,
    showRuler,
    onZoomChange,
    currentZoom,
}: RibbonProps) {
    const [internalTab, setInternalTab] = useState<RibbonTab>('home');

    const tabs: { id: RibbonTab; label: string }[] = [
        { id: 'home', label: 'Home' },
        { id: 'insert', label: 'Insert' },
        { id: 'layout', label: 'Layout' },
        { id: 'references', label: 'References' },
        { id: 'review', label: 'Review' },
        { id: 'design', label: 'Design' },
        { id: 'view', label: 'View' },
    ];

    const handleTabClick = (tab: RibbonTab) => {
        setInternalTab(tab);
    };

    return (
        <div className="flex flex-col w-full bg-slate-50 border-b border-slate-300 shadow-sm z-10 sticky top-0 font-sans">
            {/* Tab Header Row */}
            <div className="flex px-2 pt-2 gap-0.5 overflow-x-auto select-none">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        className={cn(
                            "px-3 py-1 text-[11px] font-medium rounded-t-md transition-colors border-b-2 max-h-[28px]",
                            internalTab === tab.id
                                ? "bg-white text-blue-700 border-blue-600"
                                : "bg-transparent text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-700"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content Area */}
            <div className="bg-white border-t border-slate-200 flex items-center px-2 py-1.5 min-h-[52px] gap-1 overflow-x-auto">
                {internalTab === 'home' && (
                    <HomeTab
                        currentFormatting={currentFormatting}
                        onFormat={onFormat}
                        onUndo={onUndo}
                        onRedo={onRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        disabled={disabled}
                    />
                )}

                {internalTab === 'insert' && (
                    <InsertTab
                        onFormat={onFormat}
                        disabled={disabled}
                        onInsertImage={onInsertImage}
                        onInsertTable={onInsertTable}
                        onInsertPageBreak={onInsertPageBreak}
                    />
                )}

                {internalTab === 'layout' && (
                    <LayoutTab
                        sectionProperties={sectionProperties}
                        onPageSetupChange={onPageSetupChange}
                        disabled={disabled}
                    />
                )}

                {internalTab === 'references' && (
                    <ReferencesTab
                        onOpenFootnoteProperties={onOpenFootnoteProperties}
                        onInsertTOC={onInsertTOC}
                        disabled={disabled}
                    />
                )}

                {internalTab === 'review' && (
                    <ReviewTab
                        onOpenFindReplace={onOpenFindReplace}
                        wordCount={wordCount}
                        disabled={disabled}
                    />
                )}

                {internalTab === 'design' && (
                    <DesignTab disabled={disabled} />
                )}

                {internalTab === 'view' && (
                    <ViewTab
                        onToggleRuler={onToggleRuler}
                        showRuler={showRuler}
                        onToggleOutline={onToggleOutline}
                        showOutline={showOutline}
                        onZoomChange={onZoomChange}
                        currentZoom={currentZoom}
                        disabled={disabled}
                    />
                )}
            </div>
        </div>
    );
}
