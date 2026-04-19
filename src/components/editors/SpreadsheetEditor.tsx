import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Percent,
  DollarSign,
  Hash,
  Calculator,
  Type,
  Palette,
  PaintBucket,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
  Merge,
  SplitSquareVertical,
  Sigma,
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
import { Separator } from '@/components/ui/separator';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';

interface CellData {
  value: string;
  formula?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  bgColor?: string;
  textColor?: string;
  format?: 'number' | 'currency' | 'percentage' | 'decimal';
  decimals?: number;
  merged?: { rowSpan?: number; colSpan?: number };
  hidden?: boolean;
}

interface Sheet {
  id: string;
  name: string;
  data: CellData[][];
}

interface SpreadsheetEditorProps {
  content: string;
  onChange: (content: string) => void;
  fields: FormField[];
}

const COLUMN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyGrid = (rows = 20, cols = 15): CellData[][] =>
  Array(rows).fill(null).map(() => Array(cols).fill(null).map(() => ({ value: '' })));

const colors = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
];

export default function SpreadsheetEditor({ content, onChange, fields }: SpreadsheetEditorProps) {
  // Parse content with migration support
  const parseContent = (contentStr: string): { sheets: Sheet[], activeId: string } => {
    try {
      const parsed = JSON.parse(contentStr);

      // Check if it's the new format (array of sheets)
      if (Array.isArray(parsed) && parsed.length > 0 && 'data' in parsed[0]) {
        return { sheets: parsed, activeId: parsed[0].id };
      }

      // Legacy format (2D array of cells)
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        const defaultSheet: Sheet = {
          id: generateId(),
          name: 'Sheet 1',
          data: parsed
        };
        return { sheets: [defaultSheet], activeId: defaultSheet.id };
      }
    } catch { }

    // Default empty state
    const defaultSheet: Sheet = {
      id: generateId(),
      name: 'Sheet 1',
      data: createEmptyGrid()
    };
    return { sheets: [defaultSheet], activeId: defaultSheet.id };
  };

  const initialstate = parseContent(content);
  const [sheets, setSheets] = useState<Sheet[]>(initialstate.sheets);
  const [activeSheetId, setActiveSheetId] = useState<string>(initialstate.activeId);

  const activeSheet = useMemo(() =>
    sheets.find(s => s.id === activeSheetId) || sheets[0],
    [sheets, activeSheetId]);

  const cells = activeSheet.data;

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedRange, setSelectedRange] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number } | null>(null);
  const [formulaBarValue, setFormulaBarValue] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  // History now tracks the entire sheets state
  const [history, setHistory] = useState<Sheet[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback((newSheets: Sheet[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newSheets)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Helper to update active sheet data
  const updateActiveSheet = useCallback((newData: CellData[][]) => {
    const newSheets = sheets.map(sheet =>
      sheet.id === activeSheetId ? { ...sheet, data: newData } : sheet
    );
    setSheets(newSheets);
    onChange(JSON.stringify(newSheets));
    saveToHistory(newSheets);
  }, [sheets, activeSheetId, onChange, saveToHistory]);

  // Formula evaluation
  const evaluateFormula = useCallback((formula: string, currentSheets: Sheet[]): string => {
    if (!formula.startsWith('=')) return formula;

    // Helper to get cell value from any sheet
    const getCellValue = (str: string): number => {
      // Check for Sheet reference like 'Sheet Name'!A1 or Sheet1!A1
      const sheetMatch = str.match(/^'?(.*?)'?!([A-Z]+)(\d+)$/);
      let sheetName = '';
      let colStr = '';
      let rowStr = '';

      if (sheetMatch) {
        sheetName = sheetMatch[1];
        colStr = sheetMatch[2];
        rowStr = sheetMatch[3];
      } else {
        // Current sheet reference: A1
        const cellMatch = str.match(/^([A-Z]+)(\d+)$/);
        if (!cellMatch) return 0;
        colStr = cellMatch[1];
        rowStr = cellMatch[2];
      }

      const targetSheet = sheetName
        ? currentSheets.find(s => s.name.toUpperCase() === sheetName.toUpperCase())
        : currentSheets.find(s => s.id === activeSheetId);

      if (!targetSheet) return 0;

      const col = colStr.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const row = parseInt(rowStr) - 1;

      if (row >= 0 && row < targetSheet.data.length && col >= 0 && col < targetSheet.data[0].length) {
        const val = parseFloat(targetSheet.data[row][col].value);
        return isNaN(val) ? 0 : val;
      }
      return 0;
    };

    // Helper to get range values (simplified: only current sheet for now, easier to expand)
    // To support Sheet1!A1:A5 needs more parsing logic
    const getRangeValues = (ref: string): number[] => {
      // ... (existing simplified logic or improved one)
      // For now let's keep it simple for current sheet, or expand if needed
      // Assuming current sheet for ranges for simplicity in this iteration
      const sheet = currentSheets.find(s => s.id === activeSheetId);
      if (!sheet) return [];

      const [start, end] = ref.split(':');
      if (!start || !end) return [];

      // ... (reuse existing parsing logic but use `sheet.data`)
      const startMatch = start.match(/^([A-Z]+)(\d+)$/);
      const endMatch = end.match(/^([A-Z]+)(\d+)$/);
      if (!startMatch || !endMatch) return [];

      const startCol = startMatch[1].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const startRow = parseInt(startMatch[2]) - 1;
      const endCol = endMatch[1].split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const endRow = parseInt(endMatch[2]) - 1;

      const values: number[] = [];
      for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
        for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
          if (r >= 0 && r < sheet.data.length && c >= 0 && c < sheet.data[0].length) {
            const val = parseFloat(sheet.data[r][c].value);
            if (!isNaN(val)) values.push(val);
          }
        }
      }
      return values;
    };

    const expr = formula.substring(1).toUpperCase();

    try {
      // SUM function
      const sumMatch = expr.match(/^SUM\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
      if (sumMatch) {
        const values = getRangeValues(sumMatch[1]);
        return values.reduce((a, b) => a + b, 0).toString();
      }

      // AVERAGE function
      const avgMatch = expr.match(/^AVERAGE\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
      if (avgMatch) {
        const values = getRangeValues(avgMatch[1]);
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toString() : '0';
      }

      // MIN function
      const minMatch = expr.match(/^MIN\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
      if (minMatch) {
        const values = getRangeValues(minMatch[1]);
        return values.length ? Math.min(...values).toString() : '0';
      }

      // MAX function
      const maxMatch = expr.match(/^MAX\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
      if (maxMatch) {
        const values = getRangeValues(maxMatch[1]);
        return values.length ? Math.max(...values).toString() : '0';
      }

      // COUNT function
      const countMatch = expr.match(/^COUNT\(([A-Z]+\d+:[A-Z]+\d+)\)$/);
      if (countMatch) {
        const values = getRangeValues(countMatch[1]);
        return values.length.toString();
      }

      // Basic arithmetic with cell references (including cross-sheet)
      // Regex to match "Sheet Name"!A1 or Sheet1!A1 or A1
      // Note: This simple regex replacement in loop is fragile but sufficient for basic expressions
      // Improve regex to capture full pattern: ('[^']+'!|[A-Za-z0-9]+!)?[A-Z]+\d+

      let evalExpr = expr;
      // Find all potential cell references
      // Strategy: split by operators and check tokens? Or regex replace?
      // Regex replace is safer if we match specific patterns.

      // Match: ('Sheet Name'!|SheetName!)?CellRef
      const cellRefRegex = /('[\w\s]+'![A-Z]+\d+)|([\w]+![A-Z]+\d+)|([A-Z]+\d+)/g;

      evalExpr = evalExpr.replace(cellRefRegex, (match) => {
        // Check if it's a known function keyword like SUM, AVG (skip) - but we processed them above usually?
        // Actually, if we have =A1+SUM(B1:B2), our logic above only handles pure functions.
        // For mixed arithmetic, we need robust parsing which is complex. 
        // Current implementation supports either Pure Function OR Basic Arithmetic.
        // Let's stick to Basic Arithmetic for the generic replacement.
        if (['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT'].some(fn => match.startsWith(fn))) return match;

        return getCellValue(match).toString();
      });

      // Safe eval for basic math
      const result = Function(`"use strict"; return (${evalExpr})`)();
      return typeof result === 'number' ? result.toString() : formula;
    } catch {
      return '#ERROR';
    }
  }, [activeSheetId]); // depend on activeSheetId for relative references

  const formatValue = useCallback((cell: CellData): string => {
    let val = cell.formula ? evaluateFormula(cell.formula, sheets) : cell.value;
    const num = parseFloat(val);

    if (isNaN(num)) return val;

    switch (cell.format) {
      case 'currency':
        return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: cell.decimals ?? 0 })}`;
      case 'percentage':
        return `${(num * 100).toFixed(cell.decimals ?? 0)}%`;
      case 'decimal':
        return num.toFixed(cell.decimals ?? 2);
      case 'number':
        return num.toLocaleString('id-ID');
      default:
        return val;
    }
  }, [cells, evaluateFormula]);

  const updateCell = useCallback((row: number, col: number, data: Partial<CellData>) => {
    const newCells = cells.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c, ...data } : c))
    );
    updateActiveSheet(newCells);
  }, [cells, updateActiveSheet]);

  const updateSelectedCells = useCallback((data: Partial<CellData>) => {
    if (!selectedRange && !selectedCell) return;

    const startRow = selectedRange?.startRow ?? selectedCell?.row ?? 0;
    const endRow = selectedRange?.endRow ?? selectedCell?.row ?? 0;
    const startCol = selectedRange?.startCol ?? selectedCell?.col ?? 0;
    const endCol = selectedRange?.endCol ?? selectedCell?.col ?? 0;

    const newCells = cells.map((r, ri) =>
      r.map((c, ci) => {
        if (ri >= Math.min(startRow, endRow) && ri <= Math.max(startRow, endRow) &&
          ci >= Math.min(startCol, endCol) && ci <= Math.max(startCol, endCol)) {
          return { ...c, ...data };
        }
        return c;
      })
    );
    updateActiveSheet(newCells);
  }, [cells, selectedRange, selectedCell, updateActiveSheet]);

  const handleCellClick = (row: number, col: number, shiftKey: boolean) => {
    if (shiftKey && selectedCell) {
      setSelectedRange({
        startRow: selectedCell.row,
        startCol: selectedCell.col,
        endRow: row,
        endCol: col,
      });
    } else {
      setSelectedCell({ row, col });
      setSelectedRange(null);
      const cell = cells[row][col];
      setFormulaBarValue(cell.formula || cell.value);
    }
  };

  const handleFormulaChange = (value: string) => {
    setFormulaBarValue(value);
    if (selectedCell) {
      const isFormula = value.startsWith('=');
      updateCell(selectedCell.row, selectedCell.col, {
        value: isFormula ? evaluateFormula(value, sheets) : value,
        formula: isFormula ? value : undefined
      });
    }
  };

  const addRow = (position: 'above' | 'below' = 'below') => {
    const insertIndex = selectedCell ? (position === 'above' ? selectedCell.row : selectedCell.row + 1) : cells.length;
    const newRow = Array(cells[0]?.length || 15).fill(null).map(() => ({ value: '' }));
    const newCells = [...cells.slice(0, insertIndex), newRow, ...cells.slice(insertIndex)];
    updateActiveSheet(newCells);
  };

  const addColumn = (position: 'left' | 'right' = 'right') => {
    const insertIndex = selectedCell ? (position === 'left' ? selectedCell.col : selectedCell.col + 1) : cells[0].length;
    const newCells = cells.map(row => [...row.slice(0, insertIndex), { value: '' }, ...row.slice(insertIndex)]);
    updateActiveSheet(newCells);
  };

  const deleteRow = () => {
    if (selectedCell && cells.length > 1) {
      const newCells = cells.filter((_, i) => i !== selectedCell.row);
      updateActiveSheet(newCells);
      setSelectedCell(null);
    }
  };

  const deleteColumn = () => {
    if (selectedCell && cells[0].length > 1) {
      const newCells = cells.map(row => row.filter((_, i) => i !== selectedCell.col));
      updateActiveSheet(newCells);
      setSelectedCell(null);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setSheets(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      onChange(JSON.stringify(history[historyIndex - 1]));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setSheets(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      onChange(JSON.stringify(history[historyIndex + 1]));
    }
  };

  const insertPlaceholder = (fieldName: string) => {
    if (selectedCell) {
      const currentValue = cells[selectedCell.row][selectedCell.col].value;
      const newValue = currentValue + `{{${fieldName}}}`;
      updateCell(selectedCell.row, selectedCell.col, { value: newValue });
      setFormulaBarValue(newValue);
    }
  };

  const insertFormula = (formulaType: string) => {
    if (!selectedCell) return;

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
    setFormulaBarValue(formula);
    updateCell(selectedCell.row, selectedCell.col, {
      formula,
      value: evaluateFormula(formula, sheets)
    });
  };

  // Sheet Management
  const addSheet = () => {
    const newSheet: Sheet = {
      id: generateId(),
      name: `Sheet ${sheets.length + 1}`,
      data: createEmptyGrid()
    };
    const newSheets = [...sheets, newSheet];
    setSheets(newSheets);
    onChange(JSON.stringify(newSheets));
    setActiveSheetId(newSheet.id);
  };

  const deleteActiveSheet = () => {
    if (sheets.length <= 1) return;
    const newSheets = sheets.filter(s => s.id !== activeSheetId);
    setSheets(newSheets);
    onChange(JSON.stringify(newSheets));
    setActiveSheetId(newSheets[0].id);
  };

  const renameSheet = (id: string, newName: string) => {
    const newSheets = sheets.map(s => s.id === id ? { ...s, name: newName } : s);
    setSheets(newSheets);
    onChange(JSON.stringify(newSheets));
  };

  const currentCell = selectedCell ? cells[selectedCell.row]?.[selectedCell.col] : null;

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
    <div className="border rounded-lg overflow-hidden bg-background flex flex-col h-[800px]">
      {/* Ribbon Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            {/* Clipboard */}
            <RibbonGroup title="Clipboard">
              <ToolbarButton onClick={() => { }} title="Tempel">
                <Clipboard className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => { }} title="Potong">
                <Scissors className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => { }} title="Salin">
                <Copy className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Font */}
            <RibbonGroup title="Font">
              <ToolbarButton
                onClick={() => updateSelectedCells({ bold: !currentCell?.bold })}
                active={currentCell?.bold}
                disabled={!selectedCell}
                title="Tebal"
              >
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => updateSelectedCells({ italic: !currentCell?.italic })}
                active={currentCell?.italic}
                disabled={!selectedCell}
                title="Miring"
              >
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => updateSelectedCells({ underline: !currentCell?.underline })}
                active={currentCell?.underline}
                disabled={!selectedCell}
                title="Garis Bawah"
              >
                <Underline className="w-4 h-4" />
              </ToolbarButton>

              {/* Text Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Warna Teks" disabled={!selectedCell}>
                    <div className="flex flex-col items-center">
                      <Type className="w-3 h-3" />
                      <div className="w-4 h-1 bg-red-500 mt-0.5"></div>
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
                        onClick={() => updateSelectedCells({ textColor: color })}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Background Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Warna Latar" disabled={!selectedCell}>
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
                        onClick={() => updateSelectedCells({ bgColor: color })}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Alignment */}
            <RibbonGroup title="Perataan">
              <ToolbarButton
                onClick={() => updateSelectedCells({ align: 'left' })}
                active={currentCell?.align === 'left'}
                disabled={!selectedCell}
                title="Rata Kiri"
              >
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => updateSelectedCells({ align: 'center' })}
                active={currentCell?.align === 'center'}
                disabled={!selectedCell}
                title="Rata Tengah"
              >
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => updateSelectedCells({ align: 'right' })}
                active={currentCell?.align === 'right'}
                disabled={!selectedCell}
                title="Rata Kanan"
              >
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Number Format */}
            <RibbonGroup title="Angka">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-24 text-xs justify-between" disabled={!selectedCell}>
                    {currentCell?.format === 'currency' ? 'Rp' :
                      currentCell?.format === 'percentage' ? '%' :
                        currentCell?.format === 'decimal' ? '0.00' : 'Umum'}
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => updateSelectedCells({ format: undefined })}>
                    Umum
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSelectedCells({ format: 'number' })}>
                    <Hash className="w-4 h-4 mr-2" /> Angka
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSelectedCells({ format: 'currency' })}>
                    <DollarSign className="w-4 h-4 mr-2" /> Mata Uang (Rp)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSelectedCells({ format: 'percentage' })}>
                    <Percent className="w-4 h-4 mr-2" /> Persentase
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => updateSelectedCells({ format: 'decimal', decimals: 0 })}>
                    0 Desimal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSelectedCells({ format: 'decimal', decimals: 2 })}>
                    2 Desimal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateSelectedCells({ format: 'decimal', decimals: 4 })}>
                    4 Desimal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <ToolbarButton
                onClick={() => updateSelectedCells({ format: 'percentage' })}
                disabled={!selectedCell}
                title="Persentase"
              >
                <Percent className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  const currentDecimals = currentCell?.decimals ?? 0;
                  updateSelectedCells({ decimals: currentDecimals + 1 });
                }}
                disabled={!selectedCell}
                title="Tambah Desimal"
              >
                <span className="text-xs">.0</span>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  const currentDecimals = currentCell?.decimals ?? 0;
                  updateSelectedCells({ decimals: Math.max(0, currentDecimals - 1) });
                }}
                disabled={!selectedCell}
                title="Kurangi Desimal"
              >
                <span className="text-xs">.00</span>
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Editing */}
            <RibbonGroup title="Editing">
              <ToolbarButton onClick={undo} title="Undo" disabled={historyIndex <= 0}>
                <Undo className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={redo} title="Redo" disabled={historyIndex >= history.length - 1}>
                <Redo className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Insert Tab */}
        <TabsContent value="insert" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Baris & Kolom">
              <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5" onClick={() => addRow('above')}>
                <ArrowUp className="w-4 h-4" />
                <span className="text-[10px]">Baris Atas</span>
              </Button>
              <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5" onClick={() => addRow('below')}>
                <ArrowDown className="w-4 h-4" />
                <span className="text-[10px]">Baris Bawah</span>
              </Button>
              <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5" onClick={() => addColumn('left')}>
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[10px]">Kolom Kiri</span>
              </Button>
              <Button variant="outline" size="sm" className="h-10 flex-col gap-0.5" onClick={() => addColumn('right')}>
                <ArrowRight className="w-4 h-4" />
                <span className="text-[10px]">Kolom Kanan</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Hapus">
              <Button
                variant="outline"
                size="sm"
                className="h-10 flex-col gap-0.5 text-destructive"
                onClick={deleteRow}
                disabled={!selectedCell || cells.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-[10px]">Hapus Baris</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 flex-col gap-0.5 text-destructive"
                onClick={deleteColumn}
                disabled={!selectedCell || cells[0].length <= 1}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-[10px]">Hapus Kolom</span>
              </Button>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Formulas Tab */}
        <TabsContent value="formulas" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Pustaka Fungsi">
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={() => insertFormula('SUM')}
                disabled={!selectedCell}
              >
                <Sigma className="w-6 h-6" />
                <span className="text-[10px]">SUM</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 flex-col gap-1" disabled={!selectedCell}>
                    <Calculator className="w-6 h-6" />
                    <span className="text-[10px]">Fungsi Lain</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => insertFormula('AVERAGE')}>
                    AVERAGE - Rata-rata
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertFormula('MIN')}>
                    MIN - Nilai Minimum
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertFormula('MAX')}>
                    MAX - Nilai Maksimum
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertFormula('COUNT')}>
                    COUNT - Hitung Jumlah
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Bantuan Rumus">
              <div className="text-xs text-muted-foreground max-w-md space-y-1">
                <p>Contoh rumus:</p>
                <code className="block bg-muted px-2 py-1 rounded text-[10px]">=A1+B1 (penjumlahan)</code>
                <code className="block bg-muted px-2 py-1 rounded text-[10px]">=A1*B1 (perkalian)</code>
                <code className="block bg-muted px-2 py-1 rounded text-[10px]">=SUM(A1:A10)</code>
              </div>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Format Tab */}
        <TabsContent value="format" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Format Angka">
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1"
                onClick={() => updateSelectedCells({ format: 'currency' })}
                disabled={!selectedCell}
              >
                <DollarSign className="w-4 h-4" />
                Mata Uang
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1"
                onClick={() => updateSelectedCells({ format: 'percentage' })}
                disabled={!selectedCell}
              >
                <Percent className="w-4 h-4" />
                Persentase
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-1"
                onClick={() => updateSelectedCells({ format: 'number' })}
                disabled={!selectedCell}
              >
                <Hash className="w-4 h-4" />
                Angka
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Desimal">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10" disabled={!selectedCell}>
                    Desimal: {currentCell?.decimals ?? 'Auto'}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[0, 1, 2, 3, 4, 5, 6].map(d => (
                    <DropdownMenuItem key={d} onClick={() => updateSelectedCells({ decimals: d })}>
                      {d} desimal
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Mail Merge Tab */}
        <TabsContent value="mailmerge" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Sisipkan Field">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 flex-col gap-1">
                    <Braces className="w-6 h-6" />
                    <span className="text-[10px]">Placeholder</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2" align="start">
                  <p className="text-xs text-muted-foreground mb-2">
                    Klik placeholder untuk menyisipkan ke cell terpilih
                  </p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {fields.map((field) => (
                      <Button
                        key={field.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs font-mono h-8"
                        onClick={() => insertPlaceholder(field.name)}
                        disabled={!selectedCell}
                      >
                        <Braces className="w-3 h-3 mr-2 text-primary" />
                        {`{{${field.name}}}`}
                        <span className="ml-auto text-muted-foreground font-sans">{field.label}</span>
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </RibbonGroup>
          </div>
        </TabsContent>
      </Tabs>

      {/* Formula Bar */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/20">
        <div className="w-8 flex justify-center text-muted-foreground">
          <span className="text-xs font-mono">{selectedCell ? `${COLUMN_LETTERS[selectedCell.col]}${selectedCell.row + 1}` : ''}</span>
        </div>
        <div className="h-4 w-px bg-border mx-1" />
        <div className="flex-1">
          <Input
            className="h-7 text-sm font-mono border-none shadow-none focus-visible:ring-0 bg-transparent"
            value={formulaBarValue}
            onChange={(e) => handleFormulaChange(e.target.value)}
            placeholder="Fx"
            disabled={!selectedCell}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto relative">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th className="w-10 bg-muted/50 border border-border sticky top-0 left-0 z-20"></th>
                    {Array(cells[0]?.length || 15).fill(null).map((_, i) => (
                      <th
                        key={i}
                        className={`
                          w-24 h-6 border border-border bg-muted/50 text-xs text-muted-foreground font-normal select-none relative
                          ${selectedCell?.col === i ? 'bg-muted-foreground/20 text-foreground font-bold' : ''}
                        `}
                      >
                        {COLUMN_LETTERS[i] || i + 1}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
                          onMouseDown={(e) => {
                            // Column resize logic here
                          }}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cells.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td
                        className={`
                          h-6 border border-border bg-muted/50 text-center text-xs text-muted-foreground select-none sticky left-0 z-10
                          ${selectedCell?.row === rowIndex ? 'bg-muted-foreground/20 text-foreground font-bold' : ''}
                        `}
                      >
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, colIndex) => {
                        const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                        const isInRange = selectedRange &&
                          rowIndex >= Math.min(selectedRange.startRow, selectedRange.endRow) &&
                          rowIndex <= Math.max(selectedRange.startRow, selectedRange.endRow) &&
                          colIndex >= Math.min(selectedRange.startCol, selectedRange.endCol) &&
                          colIndex <= Math.max(selectedRange.startCol, selectedRange.endCol);

                        return (
                          <td
                            key={colIndex}
                            className={`
                              border border-border min-w-[6rem] max-w-[6rem] h-6 p-0 relative outline-none
                              ${isSelected ? 'ring-2 ring-primary z-10' : ''}
                              ${isInRange && !isSelected ? 'bg-primary/10' : ''}
                            `}
                            onClick={(e) => handleCellClick(rowIndex, colIndex, e.shiftKey)}
                            style={{
                              backgroundColor: cell.bgColor,
                              textAlign: cell.align,
                            }}
                          >
                            {/* Cell Content */}
                            {isSelected ? (
                              <input
                                className="w-full h-full px-1 bg-transparent outline-none text-sm font-sans"
                                value={cell.formula || cell.value} // Show raw value/formula when editing
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const isFormula = val.startsWith('=');
                                  updateCell(rowIndex, colIndex, {
                                    value: isFormula ? evaluateFormula(val, sheets) : val,
                                    formula: isFormula ? val : undefined
                                  });
                                  setFormulaBarValue(val);
                                }}
                                style={{
                                  fontWeight: cell.bold ? 'bold' : 'normal',
                                  fontStyle: cell.italic ? 'italic' : 'normal',
                                  textDecoration: cell.underline ? 'underline' : 'none',
                                  color: cell.textColor,
                                }}
                                autoFocus
                              />
                            ) : (
                              <div
                                className="w-full h-full px-1 overflow-hidden whitespace-nowrap text-sm font-sans flex items-center"
                                style={{
                                  fontWeight: cell.bold ? 'bold' : 'normal',
                                  fontStyle: cell.italic ? 'italic' : 'normal',
                                  textDecoration: cell.underline ? 'underline' : 'none',
                                  color: cell.textColor,
                                  justifyContent: cell.align === 'center' ? 'center' : cell.align === 'right' ? 'flex-end' : 'flex-start',
                                }}
                              >
                                {formatValue(cell)}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-64">
            <ContextMenuItem disabled>
              <Scissors className="w-4 h-4 mr-2" /> Potong <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled>
              <Copy className="w-4 h-4 mr-2" /> Salin <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled>
              <Clipboard className="w-4 h-4 mr-2" /> Tempel <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>Sisipkan</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={() => addRow('above')}>
                  <ArrowUp className="w-4 h-4 mr-2" /> Baris di Atas
                </ContextMenuItem>
                <ContextMenuItem onClick={() => addRow('below')}>
                  <ArrowDown className="w-4 h-4 mr-2" /> Baris di Bawah
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => addColumn('left')}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Kolom di Kiri
                </ContextMenuItem>
                <ContextMenuItem onClick={() => addColumn('right')}>
                  <ArrowRight className="w-4 h-4 mr-2" /> Kolom di Kanan
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>Hapus</ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-48">
                <ContextMenuItem onClick={deleteRow} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Hapus Baris
                </ContextMenuItem>
                <ContextMenuItem onClick={deleteColumn} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Hapus Kolom
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem inset onClick={() => {
              if (selectedCell) {
                updateCell(selectedCell.row, selectedCell.col, { value: '', formula: undefined });
                setFormulaBarValue('');
              }
            }}>
              Bersihkan Isi
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      {/* Sheet Tabs */}
      <div className="border-t bg-muted/40 p-1 flex items-center gap-1 overflow-x-auto">
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={addSheet} title="Tambah Sheet">
          <Plus className="w-4 h-4" />
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-t-md border-t border-x text-sm cursor-pointer select-none min-w-[100px] max-w-[200px]
              ${activeSheetId === sheet.id
                ? 'bg-background border-border font-medium text-foreground -mb-[5px] pb-2.5 z-10'
                : 'bg-muted/50 border-transparent hover:bg-muted text-muted-foreground'}
            `}
            onClick={() => setActiveSheetId(sheet.id)}
          >
            <span className="truncate flex-1">{sheet.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted-foreground/20 rounded">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => {
                  const newName = prompt('Nama Sheet:', sheet.name);
                  if (newName) renameSheet(sheet.id, newName);
                }}>
                  Ganti Nama
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => {
                    if (confirm('Hapus sheet ini?')) deleteActiveSheet();
                  }}
                  disabled={sheets.length <= 1}
                >
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    </div>
  );
}
