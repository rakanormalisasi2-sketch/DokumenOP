import React, { useState, useEffect, useCallback, CSSProperties } from 'react';
import type { KeyboardEvent } from 'react';

export interface FontPropertiesData {
    fontFamily?: string;
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: string;
    // Advanced ONLYOFFICE/Word Properties
    doubleStrike?: boolean;
    superscript?: boolean;
    subscript?: boolean;
    smallCaps?: boolean;
    allCaps?: boolean;
    hidden?: boolean;
}

export interface FontPropertiesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (data: FontPropertiesData) => void;
    initialData?: FontPropertiesData | null;
}

const DIALOG_OVERLAY_STYLE: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Dim background unlike find/replace
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
};

const DIALOG_CONTENT_STYLE: CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '6px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)',
    minWidth: '450px',
    width: '100%',
    maxWidth: '500px',
    fontFamily: 'sans-serif',
};

const DIALOG_HEADER_STYLE: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
};

const DIALOG_BODY_STYLE: CSSProperties = {
    padding: '16px',
};

const DIALOG_FOOTER_STYLE: CSSProperties = {
    padding: '12px 16px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
};

const BUTTON_ACTION_STYLE: CSSProperties = {
    padding: '6px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid transparent',
};

const BUTTON_PRIMARY_STYLE: CSSProperties = {
    ...BUTTON_ACTION_STYLE,
    backgroundColor: '#2563eb',
    color: 'white',
};

const BUTTON_SECONDARY_STYLE: CSSProperties = {
    ...BUTTON_ACTION_STYLE,
    backgroundColor: '#fff',
    border: '1px solid #cbd5e1',
    color: '#334155',
};

const TOGGLE_BUTTON_BASE: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'sans-serif',
    whiteSpace: 'nowrap',
};

const getToggleStyle = (active: boolean, activeBg: string, activeColor: string, activeBorder: string, inactiveBg = '#f8fafc', inactiveColor = '#64748b', inactiveBorder = '#cbd5e1'): CSSProperties => ({
    ...TOGGLE_BUTTON_BASE,
    backgroundColor: active ? activeBg : inactiveBg,
    color: active ? activeColor : inactiveColor,
    borderColor: active ? activeBorder : inactiveBorder,
    fontWeight: active ? 600 : 400,
});

const GROUP_LABEL_STYLE: CSSProperties = {
    margin: '0 0 8px 0',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
};

const GROUP_WRAPPER_STYLE: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

export function FontPropertiesDialog({
    isOpen,
    onClose,
    onApply,
    initialData,
}: FontPropertiesDialogProps) {
    const [data, setData] = useState<FontPropertiesData>({});

    useEffect(() => {
        if (isOpen) {
            setData(initialData || {});
        }
    }, [isOpen, initialData]);

    const handleApply = useCallback(() => {
        onApply(data);
        onClose();
    }, [data, onApply, onClose]);

    const handleDialogKeyDown = useCallback(
        (e: KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') handleApply();
        },
        [onClose, handleApply]
    );

    const toggleEffect = (key: keyof FontPropertiesData) => {
        setData((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    if (!isOpen) return null;

    return (
        <div
            style={DIALOG_OVERLAY_STYLE}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            onKeyDown={handleDialogKeyDown}
        >
            <div style={DIALOG_CONTENT_STYLE} role="dialog" aria-modal="true" aria-labelledby="font-dialog-title">
                <div style={DIALOG_HEADER_STYLE}>
                    <h2 id="font-dialog-title" style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                        Font Properties
                    </h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                        aria-label="Close dialog"
                    >
                        &times;
                    </button>
                </div>

                <div style={DIALOG_BODY_STYLE}>
                    {/* Position group: Superscript / Subscript — mutually exclusive */}
                    <div style={{ marginBottom: '16px' }}>
                        <p style={GROUP_LABEL_STYLE}>Position</p>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                type="button"
                                style={getToggleStyle(!!data.superscript, '#dbeafe', '#2563eb', '#93c5fd')}
                                onClick={() => setData(p => ({ ...p, superscript: !p.superscript, subscript: false }))}
                                title="Superscript (Ctrl+Shift+=)"
                            >
                                <span style={{ fontFamily: 'serif' }}>x<sup>2</sup></span>
                            </button>
                            <button
                                type="button"
                                style={getToggleStyle(!!data.subscript, '#dbeafe', '#2563eb', '#93c5fd')}
                                onClick={() => setData(p => ({ ...p, subscript: !p.subscript, superscript: false }))}
                                title="Subscript (Ctrl+=)"
                            >
                                <span style={{ fontFamily: 'serif' }}>x<sub>2</sub></span>
                            </button>
                        </div>
                    </div>

                    {/* Effects group: Strikethrough / Double strike — independent toggles */}
                    <div style={{ marginBottom: '16px' }}>
                        <p style={GROUP_LABEL_STYLE}>Effects</p>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button
                                type="button"
                                style={getToggleStyle(!!data.strike, '#fee2e2', '#dc2626', '#fca5a5')}
                                onClick={() => toggleEffect('strike')}
                                title="Strikethrough"
                            >
                                <span style={{ textDecoration: 'line-through' }}>S</span>
                            </button>
                            <button
                                type="button"
                                style={getToggleStyle(!!data.doubleStrike, '#fee2e2', '#dc2626', '#fca5a5')}
                                onClick={() => toggleEffect('doubleStrike')}
                                title="Double strikethrough"
                            >
                                <span style={{ textDecoration: 'underline double' }}>S</span>
                            </button>
                            <button
                                type="button"
                                style={getToggleStyle(!!data.hidden, '#f3f4f6', '#6b7280', '#d1d5db')}
                                onClick={() => toggleEffect('hidden')}
                                title="Hidden text"
                            >
                                <span style={{ opacity: 0.5 }}>T</span>
                            </button>
                        </div>
                    </div>

                    {/* Case group: Small caps / All caps — mutually exclusive */}
                    <div style={{ marginBottom: '16px' }}>
                        <p style={GROUP_LABEL_STYLE}>Case</p>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                type="button"
                                style={getToggleStyle(!!data.smallCaps, '#f3e8ff', '#7c3aed', '#c4b5fd')}
                                onClick={() => setData(p => ({ ...p, smallCaps: !p.smallCaps, allCaps: false }))}
                                title="Small caps"
                            >
                                <span style={{ fontVariant: 'small-caps', fontSize: '15px' }}>Aa</span>
                            </button>
                            <button
                                type="button"
                                style={getToggleStyle(!!data.allCaps, '#f3e8ff', '#7c3aed', '#c4b5fd')}
                                onClick={() => setData(p => ({ ...p, allCaps: !p.allCaps, smallCaps: false }))}
                                title="All caps"
                            >
                                <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>AA</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600, color: '#334155' }}>Preview</p>
                        <div style={{
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '20px',
                            textAlign: 'center',
                            minHeight: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f8fafc',
                        }}>
                            <span style={{
                                fontFamily: data.fontFamily || 'Arial',
                                fontSize: data.fontSize ? `${data.fontSize / 2}pt` : '14pt',
                                fontWeight: data.bold ? 'bold' : 'normal',
                                fontStyle: data.italic ? 'italic' : 'normal',
                                textDecorationLine: [data.underline ? 'underline' : '', data.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
                                color: data.color || '#1e293b',
                                textTransform: data.allCaps ? 'uppercase' : 'none',
                                fontVariant: data.smallCaps ? 'small-caps' : 'normal',
                                visibility: data.hidden ? 'hidden' : 'visible',
                                letterSpacing: '0.01em',
                            }}>
                                ONLYOFFICE Document Text
                            </span>
                        </div>
                    </div>
                </div>

                <div style={DIALOG_FOOTER_STYLE}>
                    <button style={BUTTON_SECONDARY_STYLE} onClick={onClose}>
                        Cancel
                    </button>
                    <button style={BUTTON_PRIMARY_STYLE} onClick={handleApply}>
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FontPropertiesDialog;
