/**
 * Resizable Table Wrapper Component
 * Provides Word-like table controls: resize, drag, border control
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Move, GripVertical } from 'lucide-react';

interface ResizableTableWrapperProps {
  children: React.ReactNode;
  editor: Editor;
  tableElement: HTMLTableElement | null;
  onTableSelect: () => void;
}

export function ResizableTableWrapper({
  children,
  editor,
  tableElement,
  onTableSelect,
}: ResizableTableWrapperProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [tableWidth, setTableWidth] = useState<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startMarginLeft: number;
  } | null>(null);
  
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    handle: string;
  } | null>(null);

  // Sync table width
  useEffect(() => {
    if (tableElement) {
      setTableWidth(tableElement.offsetWidth);
    }
  }, [tableElement]);

  // Handle table selection
  const handleWrapperClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Only select if clicking on the wrapper border area, not the table content
    if (target === wrapperRef.current) {
      setIsSelected(true);
      onTableSelect();
    }
  }, [onTableSelect]);

  // Deselect when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tableElement) return;
    
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: tableElement.offsetWidth,
      startHeight: tableElement.offsetHeight,
      handle,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current || !tableElement) return;
      
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      
      let newWidth = resizeRef.current.startWidth;
      let newHeight = resizeRef.current.startHeight;
      
      if (resizeRef.current.handle.includes('e')) {
        newWidth = Math.max(200, resizeRef.current.startWidth + dx);
      }
      if (resizeRef.current.handle.includes('w')) {
        newWidth = Math.max(200, resizeRef.current.startWidth - dx);
      }
      if (resizeRef.current.handle.includes('s')) {
        newHeight = Math.max(50, resizeRef.current.startHeight + dy);
      }
      
      tableElement.style.width = `${newWidth}px`;
      setTableWidth(newWidth);
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [tableElement]);

  // Drag handler for moving table
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tableElement) return;
    
    setIsDragging(true);
    const currentMarginLeft = parseInt(tableElement.style.marginLeft || '0', 10);
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startMarginLeft: currentMarginLeft,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current || !tableElement) return;
      
      const dx = ev.clientX - dragRef.current.startX;
      const newMarginLeft = Math.max(0, dragRef.current.startMarginLeft + dx);
      
      tableElement.style.marginLeft = `${newMarginLeft}px`;
      tableElement.style.marginRight = 'auto';
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [tableElement]);

  return (
    <div
      ref={wrapperRef}
      className={`resizable-table-wrapper ${isSelected ? 'selected' : ''}`}
      onClick={handleWrapperClick}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {children}
      
      {/* Table controls when selected */}
      {isSelected && (
        <>
          {/* Move handle */}
          <button
            className="table-move-handle"
            onMouseDown={handleDragStart}
            title="Seret untuk pindah tabel"
          >
            <Move className="w-3 h-3" />
          </button>

          {/* Resize handles */}
          <button
            className="table-resize-handle table-resize-e"
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            title="Seret untuk resize"
          />
          <button
            className="table-resize-handle table-resize-se"
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            title="Seret untuk resize"
          />
          <button
            className="table-resize-handle table-resize-s"
            onMouseDown={(e) => handleResizeStart(e, 's')}
            title="Seret untuk resize"
          />

          {/* Size indicator */}
          <div className="table-size-indicator">
            {tableWidth ? `${Math.round(tableWidth)}px` : 'auto'}
          </div>
        </>
      )}
    </div>
  );
}

// Table Settings Panel Component
interface TableSettingsPanelProps {
  editor: Editor;
  isVisible: boolean;
}

export function TableSettingsPanel({ editor, isVisible }: TableSettingsPanelProps) {
  const [tableWidth, setTableWidth] = useState('100');
  const [borderWidth, setBorderWidth] = useState('1');
  const [borderColor, setBorderColor] = useState('#d1d5db');
  const [cellPadding, setCellPadding] = useState('8');

  if (!isVisible) return null;

  const applyTableStyles = () => {
    // Apply to all cells in current table
    const tableElement = document.querySelector('.ProseMirror table.tiptap-table') as HTMLTableElement;
    if (tableElement) {
      tableElement.style.width = tableWidth === '100' ? '100%' : `${tableWidth}px`;
      
      const cells = tableElement.querySelectorAll('td, th');
      cells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.borderWidth = `${borderWidth}px`;
        htmlCell.style.borderColor = borderColor;
        htmlCell.style.padding = `${cellPadding}px`;
      });
    }
  };

  return (
    <div className="table-settings-panel">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">Lebar:</label>
          <input
            type="number"
            value={tableWidth}
            onChange={(e) => setTableWidth(e.target.value)}
            className="w-16 h-6 text-xs border rounded px-1"
            min="100"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">Border:</label>
          <input
            type="number"
            value={borderWidth}
            onChange={(e) => setBorderWidth(e.target.value)}
            className="w-12 h-6 text-xs border rounded px-1"
            min="0"
            max="10"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">Warna:</label>
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="w-6 h-6 border rounded cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium">Padding:</label>
          <input
            type="number"
            value={cellPadding}
            onChange={(e) => setCellPadding(e.target.value)}
            className="w-12 h-6 text-xs border rounded px-1"
            min="0"
            max="50"
          />
          <span className="text-xs text-muted-foreground">px</span>
        </div>

        <button
          onClick={applyTableStyles}
          className="h-6 px-3 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Terapkan
        </button>
      </div>
    </div>
  );
}
