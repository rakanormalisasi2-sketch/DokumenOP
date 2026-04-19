import { useRef, useCallback, useEffect, useState } from 'react';
import { HotTable, HotTableClass } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { Button } from '@/components/ui/button';
import { FormField } from '@/types';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  Braces,
  ChevronDown,
  Palette,
  PaintBucket,
  Undo,
  Redo,
  Merge,
  SplitSquareVertical,
  Sigma,
  Percent,
  DollarSign,
  Hash,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Replace,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Register all Handsontable modules
registerAllModules();

interface CellMeta {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  textColor?: string;
  format?: 'number' | 'currency' | 'percentage' | 'decimal';
  decimals?: number;
}

interface HandsontableEditorProps {
  content: string;
  onChange: (content: string) => void;
  fields: FormField[];
}

const colors = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
];

export default function HandsontableEditor({ content, onChange, fields }: HandsontableEditorProps) {
  const hotRef = useRef<HotTableClass | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [cellMetas, setCellMetas] = useState<Record<string, CellMeta>>({});
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // Parse content to data array
  const parseContent = (contentStr: string): string[][] => {
    try {
      const parsed = JSON.parse(contentStr);
      if (Array.isArray(parsed)) {
        // Handle old format with CellData objects
        if (parsed[0] && typeof parsed[0][0] === 'object') {
          return parsed.map((row: any[]) =>
            row.map((cell: any) => (typeof cell === 'object' ? cell.value || '' : String(cell || '')))
          );
        }
        return parsed;
      }
    } catch { }
    return Array(20).fill(null).map(() => Array(15).fill(''));
  };

  const [data, setData] = useState<string[][]>(() => parseContent(content));

  // Sync content changes
  useEffect(() => {
    const newData = parseContent(content);
    setData(newData);
  }, [content]);

  const handleAfterChange = useCallback((changes: any, source: string) => {
    if (source === 'loadData') return;

    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const newData = hot.getData();
    onChange(JSON.stringify(newData));
  }, [onChange]);

  const handleAfterSelection = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col });
    const hot = hotRef.current?.hotInstance;
    if (hot) {
      const value = hot.getDataAtCell(row, col);
      setFormulaBarValue(value || '');
    }
  }, []);

  const getSelectedCells = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return null;
    const selected = hot.getSelected();
    if (!selected || selected.length === 0) return null;
    return selected[0]; // [startRow, startCol, endRow, endCol]
  }, []);

  // Cell styling functions
  const applyCellStyle = useCallback((style: Partial<CellMeta>) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = getSelectedCells();
    if (!selected) return;

    const [startRow, startCol, endRow, endCol] = selected;
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);

    const newMetas = { ...cellMetas };

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const key = `${row}-${col}`;
        newMetas[key] = { ...newMetas[key], ...style };
      }
    }

    setCellMetas(newMetas);
    hot.render();
  }, [cellMetas, getSelectedCells]);

  const insertPlaceholder = useCallback((fieldName: string) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot || !selectedCell) return;

    const currentValue = hot.getDataAtCell(selectedCell.row, selectedCell.col) || '';
    const newValue = currentValue + `{{${fieldName}}}`;
    hot.setDataAtCell(selectedCell.row, selectedCell.col, newValue);
    setFormulaBarValue(newValue);
  }, [selectedCell]);

  const openReplaceDialog = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot || !selectedCell) return;

    const value = hot.getDataAtCell(selectedCell.row, selectedCell.col);
    if (value && value.trim()) {
      setSelectedText(value);
      setShowReplaceDialog(true);
    }
  }, [selectedCell]);

  const replaceWithPlaceholder = useCallback((fieldName: string) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot || !selectedCell) return;

    hot.setDataAtCell(selectedCell.row, selectedCell.col, `{{${fieldName}}}`);
    setShowReplaceDialog(false);
    setSelectedText('');
  }, [selectedCell]);

  const insertFormula = useCallback((formulaType: string) => {
    const hot = hotRef.current?.hotInstance;
    if (!hot || !selectedCell) return;

    let formula = '';
    switch (formulaType) {
      case 'SUM':
        formula = '=SUM(A1:A10)';
        break;
      case 'AVERAGE':
        formula = '=AVERAGE(A1:A10)';
        break;
      case 'MIN':
        formula = '=MIN(A1:A10)';
        break;
      case 'MAX':
        formula = '=MAX(A1:A10)';
        break;
      case 'COUNT':
        formula = '=COUNT(A1:A10)';
        break;
    }

    hot.setDataAtCell(selectedCell.row, selectedCell.col, formula);
    setFormulaBarValue(formula);
  }, [selectedCell]);

  const addRow = useCallback((position: 'above' | 'below') => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = getSelectedCells();
    const index = selected ? (position === 'above' ? selected[0] : selected[0] + 1) : hot.countRows();
    hot.alter('insert_row_below', position === 'above' ? index : index - 1);
  }, [getSelectedCells]);

  const addColumn = useCallback((position: 'left' | 'right') => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = getSelectedCells();
    const index = selected ? (position === 'left' ? selected[1] : selected[1] + 1) : hot.countCols();
    hot.alter('insert_col_end', position === 'left' ? index : index - 1);
  }, [getSelectedCells]);

  const deleteRow = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = getSelectedCells();
    if (selected && hot.countRows() > 1) {
      hot.alter('remove_row', selected[0]);
    }
  }, [getSelectedCells]);

  const deleteColumn = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (!hot) return;

    const selected = getSelectedCells();
    if (selected && hot.countCols() > 1) {
      hot.alter('remove_col', selected[1]);
    }
  }, [getSelectedCells]);

  const undo = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (hot) hot.undo();
  }, []);

  const redo = useCallback(() => {
    const hot = hotRef.current?.hotInstance;
    if (hot) hot.redo();
  }, []);

  // Custom cell renderer
  const cellRenderer = useCallback((instance: any, td: HTMLTableCellElement, row: number, col: number, prop: any, value: any, cellProperties: any) => {
    td.innerHTML = value || '';

    const key = `${row}-${col}`;
    const meta = cellMetas[key];

    if (meta) {
      if (meta.bold) td.style.fontWeight = 'bold';
      if (meta.italic) td.style.fontStyle = 'italic';
      if (meta.underline) td.style.textDecoration = 'underline';
      if (meta.align) td.style.textAlign = meta.align;
      if (meta.bgColor) td.style.backgroundColor = meta.bgColor;
      if (meta.textColor) td.style.color = meta.textColor;
    }

    // Style placeholders
    if (value && typeof value === 'string' && value.includes('{{')) {
      const styledValue = value.replace(
        /\{\{([^}]+)\}\}/g,
        '<span style="background-color: #e0e7ff; color: #4338ca; padding: 1px 4px; border-radius: 2px; font-family: monospace; font-size: 11px;">{{$1}}</span>'
      );
      td.innerHTML = styledValue;
    }

    return td;
  }, [cellMetas]);

  const RibbonGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-0.5 px-2">{children}</div>
      <span className="text-[10px] text-muted-foreground mt-1">{title}</span>
    </div>
  );

  const ToolbarButton = ({ onClick, active, children, title, disabled }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string; disabled?: boolean }) => (
    <Button
      variant="ghost"
      size="sm"
      className={`h-7 w-7 p-0 ${active ? 'bg-muted' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-background h-full flex flex-col">
      {/* Ribbon Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full shrink-0">
        <div className="bg-muted/30 border-b">
          <TabsList className="h-8 p-0 bg-transparent rounded-none">
            <TabsTrigger value="home" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Beranda
            </TabsTrigger>
            <TabsTrigger value="insert" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Sisipkan
            </TabsTrigger>
            <TabsTrigger value="formulas" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Rumus
            </TabsTrigger>
            <TabsTrigger value="format" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Format
            </TabsTrigger>
            <TabsTrigger value="mailmerge" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Mail Merge
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Home Tab */}
        <TabsContent value="home" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            {/* Undo/Redo */}
            <RibbonGroup title="Riwayat">
              <ToolbarButton onClick={undo} title="Undo">
                <Undo className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={redo} title="Redo">
                <Redo className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Font */}
            <RibbonGroup title="Font">
              <ToolbarButton onClick={() => applyCellStyle({ bold: true })} title="Tebal">
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => applyCellStyle({ italic: true })} title="Miring">
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => applyCellStyle({ underline: true })} title="Garis Bawah">
                <Underline className="w-4 h-4" />
              </ToolbarButton>

              {/* Text Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Warna Teks">
                    <div className="flex flex-col items-center">
                      <Palette className="w-3 h-3" />
                      <div className="w-4 h-1 bg-red-500 mt-0.5" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => applyCellStyle({ textColor: color })}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Background Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Warna Latar">
                    <PaintBucket className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => applyCellStyle({ bgColor: color })}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Alignment */}
            <RibbonGroup title="Perataan">
              <ToolbarButton onClick={() => applyCellStyle({ align: 'left' })} title="Rata Kiri">
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => applyCellStyle({ align: 'center' })} title="Rata Tengah">
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => applyCellStyle({ align: 'right' })} title="Rata Kanan">
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Rows & Columns */}
            <RibbonGroup title="Sel">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                    <Plus className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => addRow('above')}>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Sisipkan Baris di Atas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addRow('below')}>
                    <ArrowDown className="w-4 h-4 mr-2" />
                    Sisipkan Baris di Bawah
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => addColumn('left')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Sisipkan Kolom di Kiri
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addColumn('right')}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Sisipkan Kolom di Kanan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                    <Trash2 className="w-4 h-4" />
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={deleteRow}>
                    Hapus Baris
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={deleteColumn}>
                    Hapus Kolom
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Insert Tab */}
        <TabsContent value="insert" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Baris & Kolom">
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => addRow('below')}>
                <ArrowDown className="w-4 h-4" />
                <span className="text-xs">Tambah Baris</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => addColumn('right')}>
                <ArrowRight className="w-4 h-4" />
                <span className="text-xs">Tambah Kolom</span>
              </Button>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Formulas Tab */}
        <TabsContent value="formulas" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Fungsi">
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => insertFormula('SUM')}>
                <Sigma className="w-4 h-4" />
                <span className="text-xs">SUM</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => insertFormula('AVERAGE')}>
                <span className="text-xs">AVERAGE</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => insertFormula('MIN')}>
                <span className="text-xs">MIN</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => insertFormula('MAX')}>
                <span className="text-xs">MAX</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => insertFormula('COUNT')}>
                <span className="text-xs">COUNT</span>
              </Button>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Format Tab */}
        <TabsContent value="format" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Format Angka">
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => applyCellStyle({ format: 'number' })}>
                <Hash className="w-4 h-4" />
                <span className="text-xs">Angka</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => applyCellStyle({ format: 'currency' })}>
                <DollarSign className="w-4 h-4" />
                <span className="text-xs">Mata Uang</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => applyCellStyle({ format: 'percentage' })}>
                <Percent className="w-4 h-4" />
                <span className="text-xs">Persen</span>
              </Button>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Mail Merge Tab */}
        <TabsContent value="mailmerge" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Sisipkan Field">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
                    <Braces className="w-4 h-4" />
                    <span className="text-xs">Sisipkan Placeholder</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {/* Group Persiapan */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">Dokumen Persiapan</div>
                  {fields.filter(f => f.phase === 'persiapan').length === 0 ? (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground italic pl-4">Tidak ada field</DropdownMenuItem>
                  ) : (
                    fields.filter(f => f.phase === 'persiapan').map((field) => (
                      <DropdownMenuItem key={field.id} onClick={() => insertPlaceholder(field.name)}>
                        <code className="text-xs bg-muted px-1 rounded mr-2">{`{{${field.name}}}`}</code>
                        {field.label}
                      </DropdownMenuItem>
                    ))
                  )}

                  <DropdownMenuSeparator />

                  {/* Group Pelaksanaan */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">Dokumen Pelaksanaan</div>
                  {fields.filter(f => !f.phase || f.phase === 'pelaksanaan').length === 0 ? (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground italic pl-4">Tidak ada field</DropdownMenuItem>
                  ) : (
                    fields.filter(f => !f.phase || f.phase === 'pelaksanaan').map((field) => (
                      <DropdownMenuItem key={field.id} onClick={() => insertPlaceholder(field.name)}>
                        <code className="text-xs bg-muted px-1 rounded mr-2">{`{{${field.name}}}`}</code>
                        {field.label}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Ganti Teks">
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={openReplaceDialog}>
                <Replace className="w-4 h-4" />
                <span className="text-xs">Ganti dengan Placeholder</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <div className="flex flex-col px-2">
              <span className="text-xs text-muted-foreground">Field tersedia: {fields.length}</span>
              <span className="text-[10px] text-muted-foreground">Placeholder akan diganti dengan data saat mail merge</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 px-2 py-1 bg-muted/30 border-b shrink-0">
        <span className="text-xs font-mono text-muted-foreground w-16">
          {selectedCell ? `${String.fromCharCode(65 + selectedCell.col)}${selectedCell.row + 1}` : ''}
        </span>
        <Separator orientation="vertical" className="h-5" />
        <Input
          value={formulaBarValue}
          onChange={(e) => {
            setFormulaBarValue(e.target.value);
            if (selectedCell) {
              const hot = hotRef.current?.hotInstance;
              if (hot) {
                hot.setDataAtCell(selectedCell.row, selectedCell.col, e.target.value);
              }
            }
          }}
          className="h-6 text-xs flex-1"
          placeholder="Masukkan nilai atau rumus..."
        />
      </div>

      {/* Spreadsheet */}
      <div className="flex-1 overflow-hidden">
        <HotTable
          ref={hotRef}
          data={data}
          rowHeaders={true}
          colHeaders={true}
          height="100%"
          width="100%"
          licenseKey="non-commercial-and-evaluation"
          afterChange={handleAfterChange}
          afterSelectionEnd={handleAfterSelection}
          cells={(row, col) => ({
            renderer: cellRenderer,
          })}
          contextMenu={true}
          manualColumnResize={true}
          manualRowResize={true}
          dropdownMenu={true}
          filters={true}
          mergeCells={true}
          undo={true}
          stretchH="all"
          autoWrapRow={true}
          autoWrapCol={true}
        />
      </div>

      {/* Replace with Placeholder Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ganti Teks dengan Placeholder</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label>Teks yang dipilih:</Label>
              <p className="mt-1 p-2 bg-muted rounded text-sm">{selectedText}</p>
            </div>
            <div>
              <Label>Pilih field untuk mengganti:</Label>
              <div className="mt-2 flex flex-col gap-4 max-h-64 overflow-y-auto pr-2">
                {/* Dokumen Persiapan */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Dokumen Persiapan</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {fields.filter(f => f.phase === 'persiapan').map((field) => (
                      <Button
                        key={field.id}
                        variant="outline"
                        size="sm"
                        className="justify-start truncate"
                        onClick={() => replaceWithPlaceholder(field.name)}
                        title={field.label}
                      >
                        <Braces className="w-3 h-3 mr-2 shrink-0" />
                        <span className="truncate">{field.label}</span>
                      </Button>
                    ))}
                    {fields.filter(f => f.phase === 'persiapan').length === 0 && (
                      <p className="text-xs text-muted-foreground italic col-span-2">Tidak ada field</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Dokumen Pelaksanaan */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Dokumen Pelaksanaan</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {fields.filter(f => !f.phase || f.phase === 'pelaksanaan').map((field) => (
                      <Button
                        key={field.id}
                        variant="outline"
                        size="sm"
                        className="justify-start truncate"
                        onClick={() => replaceWithPlaceholder(field.name)}
                        title={field.label}
                      >
                        <Braces className="w-3 h-3 mr-2 shrink-0" />
                        <span className="truncate">{field.label}</span>
                      </Button>
                    ))}
                    {fields.filter(f => !f.phase || f.phase === 'pelaksanaan').length === 0 && (
                      <p className="text-xs text-muted-foreground italic col-span-2">Tidak ada field</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplaceDialog(false)}>Batal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
