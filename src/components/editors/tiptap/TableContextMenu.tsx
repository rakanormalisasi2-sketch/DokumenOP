import React, { useEffect, useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { 
  ContextMenu, 
  ContextMenuContent, 
  ContextMenuItem, 
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Plus,
  Trash2,
  Columns,
  Rows,
  Merge,
  Split,
  Paintbrush,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Table,
  Square,
  Move,
  Layers,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';
import { applyBorderToSelectedCells, applyShadingToSelectedCells, getSelectedCells, type TableWrapMode } from './WordTableExtension';

interface TableContextMenuProps {
  editor: Editor | null;
  children: React.ReactNode;
}

const shadingColors = [
  { color: '', label: 'No Fill' },
  { color: '#ffffff', label: 'White' },
  { color: '#f8fafc', label: 'Slate 50' },
  { color: '#f1f5f9', label: 'Slate 100' },
  { color: '#e2e8f0', label: 'Slate 200' },
  { color: '#cbd5e1', label: 'Slate 300' },
  { color: '#94a3b8', label: 'Slate 400' },
  { color: '#fef3c7', label: 'Amber 100' },
  { color: '#fde68a', label: 'Amber 200' },
  { color: '#fcd34d', label: 'Amber 300' },
  { color: '#dcfce7', label: 'Green 100' },
  { color: '#bbf7d0', label: 'Green 200' },
  { color: '#86efac', label: 'Green 300' },
  { color: '#dbeafe', label: 'Blue 100' },
  { color: '#bfdbfe', label: 'Blue 200' },
  { color: '#93c5fd', label: 'Blue 300' },
  { color: '#fce7f3', label: 'Pink 100' },
  { color: '#fbcfe8', label: 'Pink 200' },
  { color: '#f9a8d4', label: 'Pink 300' },
  { color: '#ede9fe', label: 'Violet 100' },
  { color: '#ddd6fe', label: 'Violet 200' },
  { color: '#c4b5fd', label: 'Violet 300' },
];

const borderColors = [
  { color: '#000000', label: 'Black' },
  { color: '#374151', label: 'Gray 700' },
  { color: '#6b7280', label: 'Gray 500' },
  { color: '#9ca3af', label: 'Gray 400' },
  { color: '#d1d5db', label: 'Gray 300' },
  { color: '#2563eb', label: 'Blue 600' },
  { color: '#16a34a', label: 'Green 600' },
  { color: '#dc2626', label: 'Red 600' },
  { color: '#ca8a04', label: 'Yellow 600' },
];

export function TableContextMenu({ editor, children }: TableContextMenuProps) {
  const [isInTable, setIsInTable] = useState(false);
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderWidth, setBorderWidth] = useState('1px');
  const [wrapMode, setWrapMode] = useState<TableWrapMode>('inline');

  const handleSetWrapMode = useCallback((mode: TableWrapMode) => {
    if (!editor) return;
    (editor.commands as any).setTableWrapMode?.(mode);
    setWrapMode(mode);
  }, [editor]);

  const handleBringToFront = useCallback(() => {
    if (!editor) return;
    (editor.commands as any).setTableZIndex?.(1000);
  }, [editor]);

  const handleSendToBack = useCallback(() => {
    if (!editor) return;
    (editor.commands as any).setTableZIndex?.(1);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    
    const checkTableState = () => {
      setIsInTable(editor.isActive('table'));
    };
    
    editor.on('selectionUpdate', checkTableState);
    editor.on('transaction', checkTableState);
    
    return () => {
      editor.off('selectionUpdate', checkTableState);
      editor.off('transaction', checkTableState);
    };
  }, [editor]);

  const handleAddRowAbove = useCallback(() => {
    editor?.chain().focus().addRowBefore().run();
  }, [editor]);

  const handleAddRowBelow = useCallback(() => {
    editor?.chain().focus().addRowAfter().run();
  }, [editor]);

  const handleAddColumnLeft = useCallback(() => {
    editor?.chain().focus().addColumnBefore().run();
  }, [editor]);

  const handleAddColumnRight = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run();
  }, [editor]);

  const handleDeleteRow = useCallback(() => {
    if (!editor) return;
    // Ensure we're in the table and have proper selection
    if (editor.isActive('table')) {
      editor.chain().focus().deleteRow().run();
    }
  }, [editor]);

  const handleDeleteColumn = useCallback(() => {
    if (!editor) return;
    // Ensure we're in the table and have proper selection
    if (editor.isActive('table')) {
      editor.chain().focus().deleteColumn().run();
    }
  }, [editor]);

  const handleDeleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run();
  }, [editor]);

  const handleMergeCells = useCallback(() => {
    editor?.chain().focus().mergeCells().run();
  }, [editor]);

  const handleSplitCell = useCallback(() => {
    editor?.chain().focus().splitCell().run();
  }, [editor]);

  const handleShading = useCallback((color: string) => {
    // Apply shading to selected cells
    applyShadingToSelectedCells(color);
    // Also update via editor command for persistence
    editor?.chain().focus().setCellAttribute('backgroundColor', color).run();
  }, [editor]);

  const handleBorder = useCallback((type: 'all' | 'outer' | 'inner' | 'none' | 'top' | 'bottom' | 'left' | 'right') => {
    applyBorderToSelectedCells(type, borderColor, borderWidth);
    // Store border attributes for persistence
    const cells = getSelectedCells();
    cells.forEach(cell => {
      // Store as data attribute for copy-paste persistence
      cell.dataset.borderType = type;
      cell.dataset.borderColor = borderColor;
      cell.dataset.borderWidth = borderWidth;
    });
  }, [borderColor, borderWidth]);

  if (!editor || !isInTable) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Insert Section */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Plus className="mr-2 h-4 w-4" />
            <span>Insert</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={handleAddRowAbove}>
              <ArrowUp className="mr-2 h-4 w-4" />
              <span>Row Above</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleAddRowBelow}>
              <ArrowDown className="mr-2 h-4 w-4" />
              <span>Row Below</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleAddColumnLeft}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span>Column Left</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleAddColumnRight}>
              <ArrowRight className="mr-2 h-4 w-4" />
              <span>Column Right</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Delete Section */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={handleDeleteRow}>
              <Rows className="mr-2 h-4 w-4" />
              <span>Delete Row</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleDeleteColumn}>
              <Columns className="mr-2 h-4 w-4" />
              <span>Delete Column</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={handleDeleteTable} className="text-destructive">
              <Table className="mr-2 h-4 w-4" />
              <span>Delete Table</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Merge/Split */}
        <ContextMenuItem onClick={handleMergeCells}>
          <Merge className="mr-2 h-4 w-4" />
          <span>Merge Cells</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSplitCell}>
          <Split className="mr-2 h-4 w-4" />
          <span>Split Cell</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Shading */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Paintbrush className="mr-2 h-4 w-4" />
            <span>Shading</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56 p-2">
            <div className="grid grid-cols-6 gap-1">
              {shadingColors.map((item) => (
                <button
                  key={item.color || 'none'}
                  onClick={() => handleShading(item.color)}
                  className="w-7 h-7 rounded border border-border hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: item.color || 'transparent',
                    backgroundImage: !item.color ? 'linear-gradient(135deg, #fff 45%, #f00 45%, #f00 55%, #fff 55%)' : undefined
                  }}
                  title={item.label}
                />
              ))}
            </div>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Borders */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Grid3X3 className="mr-2 h-4 w-4" />
            <span>Borders</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-56">
            {/* Border color picker */}
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Border Color</div>
            <div className="grid grid-cols-5 gap-1 px-2 pb-2">
              {borderColors.map((item) => (
                <button
                  key={item.color}
                  onClick={() => setBorderColor(item.color)}
                  className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                    borderColor === item.color ? 'ring-2 ring-primary ring-offset-1' : 'border-border'
                  }`}
                  style={{ backgroundColor: item.color }}
                  title={item.label}
                />
              ))}
            </div>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleBorder('all')}>
              <Grid3X3 className="mr-2 h-4 w-4" />
              <span>All Borders</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleBorder('outer')}>
              <div className="mr-2 w-4 h-4 border-2 border-current" />
              <span>Outside Borders</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleBorder('inner')}>
              <div className="mr-2 w-4 h-4 flex items-center justify-center">
                <div className="w-full h-0.5 bg-current" />
              </div>
              <span>Inside Borders</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleBorder('none')}>
              <div className="mr-2 w-4 h-4 border border-dashed border-current opacity-50" />
              <span>No Borders</span>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => handleBorder('top')}>
              <div className="mr-2 w-4 h-4 border-t-2 border-current" />
              <span>Top Border</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleBorder('bottom')}>
              <div className="mr-2 w-4 h-4 border-b-2 border-current" />
              <span>Bottom Border</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleBorder('left')}>
              <div className="mr-2 w-4 h-4 border-l-2 border-current" />
              <span>Left Border</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleBorder('right')}>
              <div className="mr-2 w-4 h-4 border-r-2 border-current" />
              <span>Right Border</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Move - Enables dragging mode */}
        <ContextMenuItem onClick={() => {
          // Switch to floating mode and trigger move mode event
          handleSetWrapMode('floating');
          // Dispatch custom event to enable move mode
          window.dispatchEvent(new CustomEvent('tiptap-table-start-move'));
        }}>
          <Move className="mr-2 h-4 w-4" />
          <span>Move</span>
        </ContextMenuItem>

        {/* Text Wrapping */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Square className="mr-2 h-4 w-4" />
            <span>Text Wrapping</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => handleSetWrapMode('inline')}>
              <Rows className="mr-2 h-4 w-4" />
              <span>Inline with Text</span>
              {wrapMode === 'inline' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleSetWrapMode('floating')}>
              <Move className="mr-2 h-4 w-4" />
              <span>Floating (Absolute)</span>
              {wrapMode === 'floating' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Layer/Arrange */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Layers className="mr-2 h-4 w-4" />
            <span>Arrange</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={handleBringToFront}>
              <ChevronsUp className="mr-2 h-4 w-4" />
              <span>Bring to Front</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={handleSendToBack}>
              <ChevronsDown className="mr-2 h-4 w-4" />
              <span>Send to Back</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
}
