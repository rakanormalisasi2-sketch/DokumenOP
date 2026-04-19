import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Type,
  Superscript, Subscript, AlignLeft, AlignCenter, AlignRight,
  Highlighter
} from 'lucide-react';
import { TextColorPicker, HighlightColorPicker } from './ui/ColorPicker';
import { SelectionFormatting, FormattingAction } from './Toolbar';

export interface MiniToolbarProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  formatting: SelectionFormatting;
  onFormat: (format: FormattingAction, value?: any) => void;
  className?: string;
  isEditable?: boolean;
}

export const MiniToolbar: React.FC<MiniToolbarProps> = ({
  isOpen,
  position,
  formatting,
  onFormat,
  className = '',
  isEditable = true,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightColorOpen, setHighlightColorOpen] = useState(false);

  // Guards — compute early but never block hook execution
  const visible = isOpen && !!position && isEditable;

  const handleAction = useCallback((e: React.MouseEvent, action: FormattingAction, value?: any) => {
    e.preventDefault();
    e.stopPropagation();
    onFormat(action, value);
  }, [onFormat]);

  const handleTextColorChange = useCallback((color: string) => {
    setTextColorOpen(false);
    onFormat({ type: 'textColor', value: color } as FormattingAction);
  }, [onFormat]);

  const handleHighlightColorChange = useCallback((color: string) => {
    setHighlightColorOpen(false);
    onFormat({ type: 'highlightColor', value: color } as FormattingAction);
  }, [onFormat]);

  const getToolbarStyle = useCallback((): React.CSSProperties => {
    if (!position) return { display: 'none' };
    const defaultX = position.x;
    const defaultY = position.y - 45;
    let x = defaultX;
    let y = defaultY;
    if (typeof window !== 'undefined' && toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 20;
      if (y < 0) y = position.y + 25;
    }
    return {
      position: 'fixed' as const,
      left: x,
      top: y,
      background: 'white',
      border: '1px solid var(--doc-border-light)',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '2px 4px',
      zIndex: 9999,
      opacity: isHovered ? 1 : 0.4,
      transition: 'opacity 0.2s ease-in-out',
      pointerEvents: 'auto' as const,
    };
  }, [position, isHovered]);

  const isActive = useCallback((action: string, value?: any): boolean => {
    if (action === 'bold') return !!formatting.bold;
    if (action === 'italic') return !!formatting.italic;
    if (action === 'underline') return !!formatting.underline;
    if (action === 'strikethrough') return !!formatting.strikethrough;
    if (action === 'superscript') return !!formatting.superscript;
    if (action === 'subscript') return !!formatting.subscript;
    if (action === 'alignLeft') return formatting.textAlign === 'left' || !formatting.textAlign;
    if (action === 'alignCenter') return formatting.textAlign === 'center';
    if (action === 'alignRight') return formatting.textAlign === 'right';
    return false;
  }, [formatting]);

  if (!visible) return null;

  return (
    <div
      ref={toolbarRef}
      style={getToolbarStyle()}
      className={`mini-toolbar ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Text Format */}
      <button
        className={`toolbar-btn ${isActive('bold') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'bold' })}
        title="Bold (Ctrl+B)"
      >
        <Bold size={13} />
      </button>
      <button
        className={`toolbar-btn ${isActive('italic') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'italic' })}
        title="Italic (Ctrl+I)"
      >
        <Italic size={13} />
      </button>
      <button
        className={`toolbar-btn ${isActive('underline') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'underline' })}
        title="Underline (Ctrl+U)"
      >
        <Underline size={13} />
      </button>
      <button
        className={`toolbar-btn ${isActive('strikethrough') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'strikethrough' })}
        title="Strikethrough"
      >
        <Strikethrough size={13} />
      </button>

      <div className="toolbar-divider" />

      {/* Super/Subscript */}
      <button
        className={`toolbar-btn ${isActive('superscript') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'superscript' })}
        title="Superscript"
      >
        <Superscript size={13} />
      </button>
      <button
        className={`toolbar-btn ${isActive('subscript') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'subscript' })}
        title="Subscript"
      >
        <Subscript size={13} />
      </button>

      <div className="toolbar-divider" />

      {/* Text Color */}
      <div className="toolbar-color-wrapper" style={{ position: 'relative' }}>
        <button
          className="toolbar-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 2 }}
          onMouseDown={(e) => { e.preventDefault(); setTextColorOpen(o => !o); }}
          title="Text Color"
        >
          <Type size={13} />
          <div style={{
            width: 12, height: 12, borderRadius: 2,
            backgroundColor: formatting.textColor || '#000000',
            border: '1px solid #ccc',
            display: 'inline-block',
          }} />
        </button>
        {textColorOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10000, marginTop: 4 }}>
            <TextColorPicker
              value={formatting.textColor || '#000000'}
              onChange={handleTextColorChange}
            />
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="toolbar-color-wrapper" style={{ position: 'relative' }}>
        <button
          className="toolbar-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 2 }}
          onMouseDown={(e) => { e.preventDefault(); setHighlightColorOpen(o => !o); }}
          title="Highlight"
        >
          <Highlighter size={13} />
          <div style={{
            width: 12, height: 12, borderRadius: 2,
            backgroundColor: formatting.highlightColor || 'transparent',
            border: '1px solid #ccc',
            display: 'inline-block',
          }} />
        </button>
        {highlightColorOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 10000, marginTop: 4 }}>
            <HighlightColorPicker
              value={formatting.highlightColor || '#ffff00'}
              onChange={handleHighlightColorChange}
            />
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Alignment */}
      <button
        className={`toolbar-btn ${isActive('alignLeft') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'textAlign', value: 'left' })}
        title="Align Left"
      >
        <AlignLeft size={13} />
      </button>
      <button
        className={`toolbar-btn ${isActive('alignCenter') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'textAlign', value: 'center' })}
        title="Center"
      >
        <AlignCenter size={13} />
      </button>
      <button
        className={`toolbar-btn ${isActive('alignRight') ? 'active' : ''}`}
        onMouseDown={(e) => handleAction(e, { type: 'textAlign', value: 'right' })}
        title="Align Right"
      >
        <AlignRight size={13} />
      </button>

      <style>{`
        .mini-toolbar .toolbar-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          border-radius: 3px;
          cursor: pointer;
          color: #333;
          transition: background 0.15s;
          padding: 0;
        }
        .mini-toolbar .toolbar-btn:hover {
          background: #f0f0f0;
        }
        .mini-toolbar .toolbar-btn.active {
          background: #e0e7ff;
          color: #3730a3;
        }
        .mini-toolbar .toolbar-divider {
          width: 1px;
          height: 18px;
          background: #ddd;
          margin: 0 3px;
        }
      `}</style>
    </div>
  );
};