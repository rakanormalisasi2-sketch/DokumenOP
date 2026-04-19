import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { WordTable, WordTableCell, WordTableHeader, applyBorderToSelectedCells, applyShadingToSelectedCells, getSelectedCells, getTableState } from '@/components/editors/tiptap/WordTableExtension';
import { TableContextMenu } from '@/components/editors/tiptap/TableContextMenu';
import TableRow from '@tiptap/extension-table-row'; // Table row extension
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { TableGridSelector } from '@/components/editors/tiptap/TableGridSelector';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import FontFamily from '@tiptap/extension-font-family';
import { useEffect, useRef, useCallback, useState } from 'react';
import { ResizableImage } from '@/components/editors/tiptap/ResizableImage';
import { EditorRuler } from '@/components/editors/tiptap/EditorRuler';
import { WordFontSize, getCurrentFontSize } from '@/components/editors/tiptap/FontSizeExtension';
import { WORD_FONT_SIZES, formatFontSize } from '@/components/editors/tiptap/FontSizeUtils';
import { TextBox } from '@/components/editors/tiptap/TextBoxExtension';
import {
  PAPER_SIZES,
  MARGIN_PRESETS,
  getPageDimensions,
  mmToPx,
  DEFAULT_PAGE_CONFIG,
  type PaperSizeKey,
  type Orientation,
  type PageMargins,
  type PageLayoutConfig,
  PageContainer,
} from '@/components/editors/tiptap/PageLayout';
import { TemplateExportButton, TemplateImportButton } from '@/components/editors/tiptap/TemplateExportImport';
import { LayerPanel, getNextZIndex, Z_INDEX } from '@/components/editors/tiptap/LayerPanel';
import { FindReplace } from '@/components/editors/tiptap/FindReplace';
import { TableOfContents } from '@/components/editors/tiptap/TableOfContents';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FormField } from '@/types';
import {
  Bold,
  Italic,
  AArrowUp,
  AArrowDown,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Braces,
  ChevronDown,
  Image as ImageIcon,
  Table as TableIcon,
  Palette,
  Highlighter,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Plus,
  Trash2,
  Columns,
  Rows,
  X,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Square,
  Sun,
  Contrast,
  Layers,
  ArrowUp,
  ArrowDown,
  Move,
  Replace,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  RemoveFormatting,
  Indent,
  Outdent,
  Minus,
  PenTool,
  FileText,
  Copy,
  Scissors,
  Clipboard,
  Type,
  MergeIcon,
  SplitIcon,
  GripVertical,
  Paintbrush,
  Ruler,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  FileImage,
  Settings,
  Check,
  RectangleHorizontal,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  PenLine,
  Droplet,
  Grid3X3,
  BoxSelect,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  fields: FormField[];
}

// Word 2016 font sizes - imported from FontSizeUtils
const fontSizes = WORD_FONT_SIZES.map(String);
const fontFamilies = [
  'Arial',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
  'Tahoma',
  'Calibri',
  'Cambria',
  'Garamond',
  'Trebuchet MS',
];

const colors = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
];

const highlightColors = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#ff0000', '#0000ff', '#ff9900', '#9900ff',
];

export default function TipTapEditor({ content, onChange, fields }: TipTapEditorProps) {
  const [activeTab, setActiveTab] = useState('home');
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [fontSize, setFontSize] = useState('12');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [showRuler, setShowRuler] = useState(true);
  const [showPageBorder, setShowPageBorder] = useState(true);

  // Draw Text Box mode
  const [isDrawingTextBox, setIsDrawingTextBox] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // Table properties state
  const [tableWidth, setTableWidth] = useState('100');
  const [tableBorderWidth, setTableBorderWidth] = useState('1');
  const [tableBorderColor, setTableBorderColor] = useState('#d1d5db');
  const [tableCellPadding, setTableCellPadding] = useState('8');
  const [showTableProperties, setShowTableProperties] = useState(false);

  // Page layout state
  const [pageConfig, setPageConfig] = useState<PageLayoutConfig>({
    ...DEFAULT_PAGE_CONFIG,
  });
  const [firstLineIndent, setFirstLineIndent] = useState(0); // mm - first line indent
  const [hangingIndent, setHangingIndent] = useState(0); // mm - hanging/left indent for all lines except first
  const [tabStops, setTabStops] = useState<number[]>([]);
  const [containerWidth, setContainerWidth] = useState(800);

  // Format painter state
  const [formatPainterMarks, setFormatPainterMarks] = useState<any[] | null>(null);

  // Line spacing state
  const [lineSpacing, setLineSpacing] = useState<number>(1.15);

  // New Features State
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showAoC, setShowAoC] = useState(false); // Table of Contents
  const [headerContent, setHeaderContent] = useState('<p style="text-align: center; color: #666;">Header Document</p>');
  const [footerContent, setFooterContent] = useState('<p style="text-align: center; color: #666;">Footer Document - Page 1</p>');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Separate Editors for Header/Footer
  const headerEditor = useEditor({
    extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), TextStyle, Color],
    content: headerContent,
    onUpdate: ({ editor }) => setHeaderContent(editor.getHTML()),
    editorProps: { attributes: { class: 'focus:outline-none text-sm text-muted-foreground' } }
  });

  const footerEditor = useEditor({
    extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] }), TextStyle, Color],
    content: footerContent,
    onUpdate: ({ editor }) => setFooterContent(editor.getHTML()),
    editorProps: { attributes: { class: 'focus:outline-none text-sm text-muted-foreground' } }
  });

  // Get current page dimensions
  const pageDimensions = getPageDimensions(pageConfig.paperSize, pageConfig.orientation);

  // Calculate display dimensions for the page
  const calculatePageDisplayWidth = useCallback(() => {
    if (!containerWidth) return 800;
    const basePxWidth = mmToPx(pageDimensions.width);
    const maxWidth = containerWidth - 60; // padding
    const scale = Math.min(maxWidth / basePxWidth, 1) * (pageConfig.zoom / 100);
    return basePxWidth * scale;
  }, [containerWidth, pageDimensions.width, pageConfig.zoom]);

  // Update page config helpers
  const updatePageConfig = useCallback((updates: Partial<PageLayoutConfig>) => {
    setPageConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const updateMargins = useCallback((updates: Partial<PageMargins>) => {
    setPageConfig(prev => ({
      ...prev,
      margins: { ...prev.margins, ...updates }
    }));
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      // Placeholders (only inside table cells & textboxes)
      Placeholder.configure({
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: true,
        placeholder: (props: any) => {
          const { editor, pos } = props ?? {};
          if (!editor || typeof pos !== 'number') return '';

          // Detect context by walking parents
          const $pos = editor.state.doc.resolve(pos);
          for (let d = $pos.depth; d > 0; d--) {
            const name = $pos.node(d).type.name;
            if (name === 'tableCell' || name === 'tableHeader') return 'Isi...';
            if (name === 'textBox') return 'Ketik di Text Box...';
          }
          return '';
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      WordTable.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'tiptap-table',
        },
      }),
      TableRow,
      WordTableCell,
      WordTableHeader,
      ResizableImage.configure({
        HTMLAttributes: {
          class: 'tiptap-image',
        },
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Subscript,
      Superscript,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      WordFontSize.configure({
        types: ['textStyle'],
      }),
      TextBox.configure({
        HTMLAttributes: {
          class: 'tiptap-text-box',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[500px] p-4',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Auto-switch contextual tabs based on active node + update font size display
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      // Switch tabs based on active node type - Word 2016 contextual ribbon behavior
      if (editor.isActive('image')) {
        setActiveTab('picture');
      } else if (editor.isActive('textBox')) {
        setActiveTab('shape');
      } else if (editor.isActive('table')) {
        // Switch to Table Design by default when entering table
        if (activeTab !== 'tableDesign' && activeTab !== 'tableLayout') {
          setActiveTab('tableDesign');
        }
      } else if (activeTab === 'picture' || activeTab === 'shape' || activeTab === 'tableDesign' || activeTab === 'tableLayout') {
        setActiveTab('home');
      }

      // Update font size display from current selection
      const { size, isMixed } = getCurrentFontSize(editor);
      if (!isMixed && size) {
        setFontSize(formatFontSize(size));
      } else if (isMixed) {
        setFontSize('');
      }

      // Update font family display
      const fontFamilyMark = editor.getAttributes('textStyle').fontFamily;
      if (fontFamilyMark) {
        setFontFamily(fontFamilyMark);
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('transaction', handleSelectionUpdate);

    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('transaction', handleSelectionUpdate);
    };
  }, [editor, activeTab]);

  // Measure editor container width
  useEffect(() => {
    const updateWidth = () => {
      if (editorContainerRef.current) {
        setContainerWidth(editorContainerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Cancel drawing mode on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawingTextBox) {
        e.preventDefault();
        setIsDrawingTextBox(false);
        setDrawStart(null);
        setDrawCurrent(null);
      }
    };

    if (isDrawingTextBox) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isDrawingTextBox]);
  const insertPlaceholder = useCallback(
    (fieldName: string) => {
      if (!editor) return;

      // Insert as a styled span so it stays visible and "token-like".
      const html = `<span style="background-color: hsl(var(--primary) / 0.15); color: hsl(var(--primary)); padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px;">{{${fieldName}}}</span>`;
      editor.chain().focus().insertContent(html).run();
    },
    [editor]
  );

  const replaceWithPlaceholder = useCallback(
    (fieldName: string) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      const html = `<span style="background-color: hsl(var(--primary) / 0.15); color: hsl(var(--primary)); padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px;">{{${fieldName}}}</span>`;

      editor.chain().focus().deleteRange({ from, to }).insertContent(html).run();
      setShowReplaceDialog(false);
      setSelectedText('');
    },
    [editor]
  );

  const openReplaceDialog = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    if (text.trim()) {
      setSelectedText(text);
      setShowReplaceDialog(true);
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true }).run();
    setShowTableDialog(false);
  }, [editor, tableRows, tableCols]);

  const insertImage = useCallback((url: string) => {
    if (!editor || !url) return;
    editor.chain().focus().setImage({ src: url }).run();
    setShowImageDialog(false);
    setImageUrl('');
  }, [editor]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      editor.chain().focus().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkDialog(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // Apply table styles to current table
  const applyTableStyles = useCallback(() => {
    const tableElement = document.querySelector('.ProseMirror .tiptap-table') as HTMLTableElement;
    if (tableElement) {
      // Set table width
      tableElement.style.width = tableWidth === '100' ? '100%' : `${tableWidth}px`;

      // Apply border and padding to all cells
      const cells = tableElement.querySelectorAll('td, th');
      cells.forEach((cell: Element) => {
        const htmlCell = cell as HTMLElement;
        htmlCell.style.borderWidth = `${tableBorderWidth}px`;
        htmlCell.style.borderStyle = 'solid';
        htmlCell.style.borderColor = tableBorderColor;
        htmlCell.style.padding = `${tableCellPadding}px`;
      });
    }
  }, [tableWidth, tableBorderWidth, tableBorderColor, tableCellPadding]);

  // Set table width preset
  const setTableWidthPreset = useCallback((preset: 'auto' | 'full' | 'fixed') => {
    const tableElement = document.querySelector('.ProseMirror .tiptap-table') as HTMLTableElement;
    if (tableElement) {
      switch (preset) {
        case 'auto':
          tableElement.style.width = 'auto';
          setTableWidth('auto');
          break;
        case 'full':
          tableElement.style.width = '100%';
          setTableWidth('100');
          break;
        case 'fixed':
          const currentWidth = tableElement.offsetWidth;
          tableElement.style.width = `${currentWidth}px`;
          setTableWidth(String(currentWidth));
          break;
      }
    }
  }, []);

  if (!editor) return null;

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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

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
            <TabsTrigger value="layout" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Tata Letak
            </TabsTrigger>
            <TabsTrigger value="mailmerge" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Mail Merge
            </TabsTrigger>
            <TabsTrigger value="view" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Tampilan
            </TabsTrigger>
            {/* Contextual tabs - only show when relevant object is selected */}
            {editor.isActive('image') && (
              <TabsTrigger value="picture" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background text-primary border-l border-primary/30">
                Format Gambar
              </TabsTrigger>
            )}
            {editor.isActive('textBox') && (
              <TabsTrigger value="shape" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background text-orange-600 border-l border-orange-300">
                Format Shape
              </TabsTrigger>
            )}
            {editor.isActive('table') && (
              <>
                <TabsTrigger value="tableDesign" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background text-green-600 border-l border-green-300">
                  Table Design
                </TabsTrigger>
                <TabsTrigger value="tableLayout" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background text-green-600">
                  Table Layout
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* Home Tab */}
        <TabsContent value="home" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            {/* Clipboard */}
            <RibbonGroup title="Clipboard">
              <ToolbarButton onClick={() => document.execCommand('paste')} title="Tempel (Ctrl+V)">
                <Clipboard className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => document.execCommand('cut')} title="Potong (Ctrl+X)">
                <Scissors className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => document.execCommand('copy')} title="Salin (Ctrl+C)">
                <Copy className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Undo/Redo */}
            <RibbonGroup title="Riwayat">
              <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
                <Undo className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
                <Redo className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Font Family & Size */}
            <RibbonGroup title="Font">
              {/* Font Family Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-28 justify-between text-xs">
                    {fontFamily.length > 12 ? fontFamily.slice(0, 12) + '...' : fontFamily}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto bg-background">
                  {fontFamilies.map((font) => (
                    <DropdownMenuItem
                      key={font}
                      onClick={() => {
                        setFontFamily(font);
                        editor.chain().focus().setFontFamily(font).run();
                      }}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Font Size Dropdown with editable input */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-16 justify-between text-xs">
                    {(() => {
                      const { size, isMixed } = getCurrentFontSize(editor);
                      if (isMixed) return '';
                      return size ? formatFontSize(size) : '12';
                    })()}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto bg-background">
                  {/* Custom size input */}
                  <div className="px-2 py-1 border-b">
                    <Input
                      type="number"
                      min="1"
                      max="720"
                      placeholder="Size"
                      className="h-6 w-full text-xs"
                      value={fontSize}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFontSize(val);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const num = parseFloat(fontSize);
                          if (num >= 1 && num <= 720) {
                            editor.chain().focus().setWordFontSize(`${num}pt`).run();
                          }
                        }
                      }}
                      onBlur={() => {
                        const num = parseFloat(fontSize);
                        if (num >= 1 && num <= 720) {
                          editor.chain().focus().setWordFontSize(`${num}pt`).run();
                        }
                      }}
                    />
                  </div>
                  {fontSizes.map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => {
                        setFontSize(size);
                        editor.chain().focus().setWordFontSize(`${size}pt`).run();
                      }}
                      className="flex items-center justify-between"
                    >
                      <span>{size}</span>
                      {getCurrentFontSize(editor).size === parseInt(size) && (
                        <Check className="w-3 h-3" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Grow Font (A↑) - Word 2016 stepping */}
              <ToolbarButton
                onClick={() => editor.chain().focus().growFont().run()}
                title="Perbesar Font (Ctrl+Shift+>)"
              >
                <AArrowUp className="w-4 h-4" />
              </ToolbarButton>

              {/* Shrink Font (A↓) - Word 2016 stepping */}
              <ToolbarButton
                onClick={() => editor.chain().focus().shrinkFont().run()}
                title="Perkecil Font (Ctrl+Shift+<)"
              >
                <AArrowDown className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Font Style */}
            <RibbonGroup title="Gaya">
              <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Tebal (Ctrl+B)">
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Miring (Ctrl+I)">
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Garis Bawah (Ctrl+U)">
                <UnderlineIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Coret">
                <Strikethrough className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subskrip">
                <SubscriptIcon className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Superskrip">
                <SuperscriptIcon className="w-4 h-4" />
              </ToolbarButton>

              {/* Text Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Warna Teks">
                    <div className="flex flex-col items-center">
                      <Type className="w-3 h-3" />
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
                        onClick={() => editor.chain().focus().setColor(color).run()}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Highlight */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Sorot">
                    <Highlighter className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex gap-1">
                    {highlightColors.map((color) => (
                      <button
                        key={color}
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                      />
                    ))}
                    <button
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform flex items-center justify-center"
                      onClick={() => editor.chain().focus().unsetHighlight().run()}
                      title="Hapus Highlight"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Formatting */}
              <ToolbarButton
                onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                title="Hapus Formatting"
              >
                <RemoveFormatting className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Paragraph */}
            <RibbonGroup title="Paragraf">
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Rata Kiri">
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Rata Tengah">
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Rata Kanan">
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Rata Kiri Kanan">
                <AlignJustify className="w-4 h-4" />
              </ToolbarButton>

              {/* Line Spacing Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 gap-1" title="Spasi Baris">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-current">
                      <path d="M2 3h12M2 6.5h12M2 10h12M2 13.5h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M14 2v12M14 2l-2 2M14 2l2 2M14 14l-2-2M14 14l2-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background">
                  <DropdownMenuLabel className="text-xs">Spasi Baris</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[1, 1.15, 1.5, 2, 2.5, 3].map(spacing => (
                    <DropdownMenuItem
                      key={spacing}
                      onClick={() => setLineSpacing(spacing)}
                      className="flex items-center justify-between"
                    >
                      <span>{spacing}</span>
                      {lineSpacing === spacing && <Check className="w-3 h-3" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                <List className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Format Painter */}
            <RibbonGroup title="Clipboard">
              <Button
                variant={formatPainterMarks ? "secondary" : "ghost"}
                size="sm"
                className={`h-7 w-7 p-0 ${formatPainterMarks ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                onClick={() => {
                  if (formatPainterMarks) {
                    // Clear format painter
                    setFormatPainterMarks(null);
                  } else {
                    // Copy current formatting
                    const marks = editor.state.selection.$from.marks();
                    setFormatPainterMarks(marks.map(m => ({ type: m.type.name, attrs: m.attrs })));
                  }
                }}
                title={formatPainterMarks ? "Batal Format Painter (klik untuk batal)" : "Format Painter (salin format ke teks lain)"}
              >
                <Paintbrush className={`w-4 h-4 ${formatPainterMarks ? 'text-primary' : ''}`} />
              </Button>
              {formatPainterMarks && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    // Apply format to current selection
                    const { from, to, empty } = editor.state.selection;
                    if (!empty && formatPainterMarks.length > 0) {
                      let chain = editor.chain().focus();
                      formatPainterMarks.forEach(mark => {
                        if (mark.type === 'textStyle') {
                          chain = chain.setMark('textStyle', mark.attrs);
                        } else if (mark.type === 'bold') {
                          chain = chain.setBold();
                        } else if (mark.type === 'italic') {
                          chain = chain.setItalic();
                        } else if (mark.type === 'underline') {
                          chain = chain.setUnderline();
                        } else if (mark.type === 'strike') {
                          chain = chain.setStrike();
                        }
                      });
                      chain.run();
                    }
                    setFormatPainterMarks(null);
                  }}
                  title="Terapkan format"
                >
                  Terapkan
                </Button>
              )}
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Headings */}
            <RibbonGroup title="Heading">
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                <Heading1 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                <Heading2 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                <Heading3 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
                <Quote className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
                <Code className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Insert Tab */}
        <TabsContent value="insert" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            {/* Table - Word-style grid selector */}
            <RibbonGroup title="Tabel">
              <TableGridSelector
                onInsertTable={(rows, cols) => {
                  editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
                }}
                onOpenDialog={() => setShowTableDialog(true)}
              />
              {editor.isActive('table') && (
                <>
                  <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Tambah Kolom Kiri">
                    <Columns className="w-4 h-4" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Tambah Kolom Kanan">
                    <Plus className="w-4 h-4" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Tambah Baris Atas">
                    <Rows className="w-4 h-4" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Tambah Baris Bawah">
                    <Plus className="w-4 h-4" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Hapus Kolom">
                    <Trash2 className="w-4 h-4" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Hapus Baris">
                    <Trash2 className="w-4 h-4" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Hapus Tabel">
                    <X className="w-4 h-4" />
                  </ToolbarButton>
                </>
              )}
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Text Box */}
            <RibbonGroup title="Text Box">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isDrawingTextBox ? "default" : "ghost"}
                    size="sm"
                    className="h-9 px-3 gap-2"
                  >
                    <RectangleHorizontal className="w-4 h-4" />
                    <span className="text-xs">Text Box</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {
                    if (!editor) return;
                    editor.commands.focus();
                    editor.commands.insertTextBox({
                      width: 200,
                      height: 100,
                      content: 'Ketik teks di sini...',
                    });
                  }}>
                    <RectangleHorizontal className="w-4 h-4 mr-2" />
                    Simple Text Box
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    setIsDrawingTextBox(true);
                  }}>
                    <PenTool className="w-4 h-4 mr-2" />
                    Draw Text Box
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {isDrawingTextBox && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setIsDrawingTextBox(false)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              )}
            </RibbonGroup>

            {/* Image */}
            <RibbonGroup title="Gambar">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">Gambar</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    Upload dari Komputer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowImageDialog(true)}>
                    Dari URL
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Link */}
            <RibbonGroup title="Link">
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={() => setShowLinkDialog(true)}>
                <LinkIcon className="w-4 h-4" />
                <span className="text-xs">Sisipkan Link</span>
              </Button>
              {editor.isActive('link') && (
                <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Hapus Link">
                  <X className="w-4 h-4" />
                </ToolbarButton>
              )}
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Horizontal Line */}
            <RibbonGroup title="Garis">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 gap-2"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
              >
                <Minus className="w-4 h-4" />
                <span className="text-xs">Garis Horizontal</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Special Elements */}
            <RibbonGroup title="Elemen Khusus">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs">Template</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {
                    const signatureHtml = `
                      <div style="margin-top: 50px; text-align: center; width: 200px;">
                        <div style="border-bottom: 1px solid #000; height: 60px; margin-bottom: 5px;"></div>
                        <p style="margin: 0; font-size: 11pt;">Tanda Tangan</p>
                      </div>
                    `;
                    editor.chain().focus().insertContent(signatureHtml).run();
                  }}>
                    <PenTool className="w-4 h-4 mr-2" />
                    Kolom Tanda Tangan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const letterheadHtml = `
                      <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 15px; margin-bottom: 20px;">
                        <table style="width: 100%; border: none;">
                          <tr>
                            <td style="width: 100px; border: none; vertical-align: middle;">
                              <div style="width: 80px; height: 80px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">[Logo]</div>
                            </td>
                            <td style="border: none; text-align: center; vertical-align: middle;">
                              <p style="margin: 0; font-size: 14pt; font-weight: bold;">PEMERINTAH DAERAH</p>
                              <p style="margin: 0; font-size: 18pt; font-weight: bold;">NAMA INSTANSI</p>
                              <p style="margin: 0; font-size: 10pt;">Jl. Alamat Lengkap, Kota, Kode Pos</p>
                              <p style="margin: 0; font-size: 10pt;">Telp. (021) 1234567, Email: email@domain.go.id</p>
                            </td>
                            <td style="width: 100px; border: none;"></td>
                          </tr>
                        </table>
                      </div>
                    `;
                    editor.chain().focus().insertContent(letterheadHtml).run();
                  }}>
                    <FileText className="w-4 h-4 mr-2" />
                    Kop Surat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Export/Import Template JSON */}
            <RibbonGroup title="Template JSON">
              <TemplateExportButton editor={editor} />
              <TemplateImportButton editor={editor} />
            </RibbonGroup>
          </div>
        </TabsContent>
        <TabsContent value="layout" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            {/* View Options */}
            <RibbonGroup title="Tampilan">
              <Button
                variant={showRuler ? "secondary" : "ghost"}
                size="sm"
                className="h-9 px-3 gap-2"
                onClick={() => setShowRuler(!showRuler)}
              >
                <Ruler className="w-4 h-4" />
                <span className="text-xs">Ruler</span>
                {showRuler ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </Button>
              <Button
                variant={showPageBorder ? "secondary" : "ghost"}
                size="sm"
                className="h-9 px-3 gap-2"
                onClick={() => setShowPageBorder(!showPageBorder)}
              >
                <FileImage className="w-4 h-4" />
                <span className="text-xs">Page Border</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Zoom */}
            <RibbonGroup title="Zoom">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updatePageConfig({ zoom: Math.max(50, pageConfig.zoom - 10) })}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-16 text-xs">
                    {pageConfig.zoom}%
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[50, 75, 100, 125, 150, 200].map(z => (
                    <DropdownMenuItem key={z} onClick={() => updatePageConfig({ zoom: z })}>
                      {z}%
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updatePageConfig({ zoom: Math.min(200, pageConfig.zoom + 10) })}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Orientation */}
            <RibbonGroup title="Orientasi">
              <Button
                variant={pageConfig.orientation === 'portrait' ? "secondary" : "ghost"}
                size="sm"
                className="h-9 px-3 gap-2"
                onClick={() => updatePageConfig({ orientation: 'portrait' })}
              >
                <FileText className="w-4 h-4" />
                <span className="text-xs">Portrait</span>
              </Button>
              <Button
                variant={pageConfig.orientation === 'landscape' ? "secondary" : "ghost"}
                size="sm"
                className="h-9 px-3 gap-2"
                onClick={() => updatePageConfig({ orientation: 'landscape' })}
              >
                <FileText className="w-4 h-4 rotate-90" />
                <span className="text-xs">Landscape</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Paper Size */}
            <RibbonGroup title="Ukuran Kertas">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 gap-2">
                    <span className="text-xs">{pageConfig.paperSize}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {(Object.keys(PAPER_SIZES) as PaperSizeKey[]).map(size => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => updatePageConfig({ paperSize: size })}
                    >
                      <Check className={`w-4 h-4 mr-2 ${pageConfig.paperSize === size ? 'opacity-100' : 'opacity-0'}`} />
                      {PAPER_SIZES[size].label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Margins */}
            <RibbonGroup title="Margin">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 gap-2">
                    <span className="text-xs">
                      {pageConfig.margins.left === 25.4 && pageConfig.margins.right === 25.4 ? 'Normal' :
                        pageConfig.margins.left === 12.7 && pageConfig.margins.right === 12.7 ? 'Narrow' :
                          pageConfig.margins.left === 50.8 ? 'Wide' : 'Custom'}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>Preset Margin</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.entries(MARGIN_PRESETS) as [string, typeof MARGIN_PRESETS.normal][]).map(([key, preset]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => updatePageConfig({ margins: { ...preset } })}
                    >
                      <div className="flex flex-col">
                        <span>{preset.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          T:{preset.top} B:{preset.bottom} L:{preset.left} R:{preset.right}mm
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <div className="px-2 py-2 space-y-2">
                    <Label className="text-xs">Custom Margins (mm)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px]">Top</Label>
                        <Input
                          type="number"
                          className="h-6 text-xs"
                          value={pageConfig.margins.top}
                          onChange={(e) => updateMargins({ top: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Bottom</Label>
                        <Input
                          type="number"
                          className="h-6 text-xs"
                          value={pageConfig.margins.bottom}
                          onChange={(e) => updateMargins({ bottom: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Left</Label>
                        <Input
                          type="number"
                          className="h-6 text-xs"
                          value={pageConfig.margins.left}
                          onChange={(e) => updateMargins({ left: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Right</Label>
                        <Input
                          type="number"
                          className="h-6 text-xs"
                          value={pageConfig.margins.right}
                          onChange={(e) => updateMargins({ right: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Page Info */}
            <div className="flex flex-col px-2 text-xs text-muted-foreground">
              <span>
                {PAPER_SIZES[pageConfig.paperSize].label} ({pageConfig.orientation})
              </span>
              <span className="text-[10px]">
                Margin: {pageConfig.margins.left}mm × {pageConfig.margins.right}mm |
                Indent: {firstLineIndent >= 0 ? '+' : ''}{firstLineIndent.toFixed(1)}mm | Tab: {tabStops.length}
              </span>
            </div>
          </div>
        </TabsContent>

        {/* Mail Merge Tab */}
        <TabsContent value="mailmerge" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            {/* Insert Placeholder */}
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
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Dokumen Persiapan</DropdownMenuLabel>
                  {fields.filter(f => f.phase === 'persiapan').length === 0 ? (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground italic pl-4">
                      Tidak ada field
                    </DropdownMenuItem>
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
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Dokumen Pelaksanaan</DropdownMenuLabel>
                  {fields.filter(f => !f.phase || f.phase === 'pelaksanaan').length === 0 ? (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground italic pl-4">
                      Tidak ada field
                    </DropdownMenuItem>
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

            {/* Replace with Placeholder */}
            <RibbonGroup title="Ganti Teks">
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2" onClick={openReplaceDialog}>
                <Replace className="w-4 h-4" />
                <span className="text-xs">Ganti dengan Placeholder</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Field Info */}
            <div className="flex flex-col px-2">
              <span className="text-xs text-muted-foreground">Field tersedia: {fields.length}</span>
              <span className="text-[10px] text-muted-foreground">Placeholder akan diganti dengan data saat mail merge</span>
            </div>
          </div>
        </TabsContent>

        {/* Picture Format Tab - Shows when image is selected */}
        <TabsContent value="picture" className="m-0">
          <div className="bg-blue-50 border-b border-blue-200 p-2 flex items-end gap-3 flex-wrap">
            {/* Size Controls */}
            <RibbonGroup title="Ukuran">
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min="20"
                  max="1000"
                  value={editor.getAttributes('image').width || ''}
                  onChange={(e) => {
                    const w = parseInt(e.target.value) || 100;
                    const attrs = editor.getAttributes('image');
                    const ratio = attrs.height && attrs.width ? attrs.height / attrs.width : 1;
                    const h = Math.round(w * ratio);
                    editor.chain().focus().updateAttributes('image', { width: w, height: h }).run();
                  }}
                  className="w-16 h-7 text-xs"
                  placeholder="W"
                />
                <span className="text-xs text-muted-foreground">×</span>
                <Input
                  type="number"
                  min="20"
                  max="1000"
                  value={editor.getAttributes('image').height || ''}
                  onChange={(e) => {
                    const h = parseInt(e.target.value) || 100;
                    const attrs = editor.getAttributes('image');
                    const ratio = attrs.width && attrs.height ? attrs.width / attrs.height : 1;
                    const w = Math.round(h * ratio);
                    editor.chain().focus().updateAttributes('image', { width: w, height: h }).run();
                  }}
                  className="w-16 h-7 text-xs"
                  placeholder="H"
                />
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Quick Size Buttons */}
            <RibbonGroup title="Skala Cepat">
              <div className="flex items-center gap-1">
                {[25, 50, 75, 100].map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      // Get natural size from image element if possible
                      const attrs = editor.getAttributes('image');
                      const baseW = attrs.width || 400;
                      const baseH = attrs.height || 300;
                      const w = Math.round(baseW * (p / 100));
                      const h = Math.round(baseH * (p / 100));
                      editor.chain().focus().updateAttributes('image', { width: w, height: h }).run();
                    }}
                  >
                    {p}%
                  </Button>
                ))}
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Transform */}
            <RibbonGroup title="Transformasi">
              <ToolbarButton
                onClick={() => {
                  const attrs = editor.getAttributes('image');
                  const rotation = ((attrs.rotation || 0) - 90 + 360) % 360;
                  editor.chain().focus().updateAttributes('image', { rotation }).run();
                }}
                title="Putar 90° Kiri"
              >
                <RotateCw className="w-4 h-4 scale-x-[-1]" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  const attrs = editor.getAttributes('image');
                  const rotation = (attrs.rotation || 0) + 90;
                  editor.chain().focus().updateAttributes('image', { rotation: rotation % 360 }).run();
                }}
                title="Putar 90° Kanan"
              >
                <RotateCw className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  const attrs = editor.getAttributes('image');
                  editor.chain().focus().updateAttributes('image', { flipX: !attrs.flipX }).run();
                }}
                active={editor.getAttributes('image').flipX}
                title="Flip Horizontal"
              >
                <FlipHorizontal className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  const attrs = editor.getAttributes('image');
                  editor.chain().focus().updateAttributes('image', { flipY: !attrs.flipY }).run();
                }}
                active={editor.getAttributes('image').flipY}
                title="Flip Vertical"
              >
                <FlipVertical className="w-4 h-4" />
              </ToolbarButton>
              <div className="flex items-center gap-1 ml-1">
                <span className="text-xs text-muted-foreground">
                  {editor.getAttributes('image').rotation || 0}°
                </span>
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Text Wrapping */}
            <RibbonGroup title="Pembungkusan">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Square className="w-3 h-3" />
                    Bungkus Teks
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => editor.chain().focus().updateAttributes('image', { wrapMode: 'inline' }).run()}>
                    <Square className="w-4 h-4 mr-2" /> Sejajar Teks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().updateAttributes('image', { wrapMode: 'square' }).run()}>
                    <Square className="w-4 h-4 mr-2" /> Persegi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().updateAttributes('image', { wrapMode: 'tight' }).run()}>
                    <Square className="w-4 h-4 mr-2" /> Ketat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => editor.chain().focus().updateAttributes('image', { wrapMode: 'behind' }).run()}>
                    <Move className="w-4 h-4 mr-2" /> Di Belakang Teks
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().updateAttributes('image', { wrapMode: 'infront' }).run()}>
                    <Layers className="w-4 h-4 mr-2" /> Di Depan Teks
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Layering */}
            <RibbonGroup title="Susunan">
              <LayerPanel
                editor={editor}
                selectedNode="image"
                onBringToFront={() => {
                  const newZ = getNextZIndex();
                  editor.chain().focus().updateAttributes('image', {
                    wrapMode: 'infront',
                    zIndex: newZ
                  }).run();
                }}
                onSendToBack={() => {
                  editor.chain().focus().updateAttributes('image', {
                    wrapMode: 'behind',
                    zIndex: Z_INDEX.BEHIND_TEXT
                  }).run();
                }}
                onBringForward={() => {
                  const attrs = editor.getAttributes('image');
                  const currentZ = attrs.zIndex || 10;
                  editor.chain().focus().updateAttributes('image', {
                    zIndex: currentZ + 1
                  }).run();
                }}
                onSendBackward={() => {
                  const attrs = editor.getAttributes('image');
                  const currentZ = attrs.zIndex || 10;
                  editor.chain().focus().updateAttributes('image', {
                    zIndex: Math.max(1, currentZ - 1)
                  }).run();
                }}
              />
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Reset & Delete */}
            <RibbonGroup title="Aksi">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  editor.chain().focus().updateAttributes('image', {
                    rotation: 0,
                    flipX: false,
                    flipY: false,
                    width: null,
                    height: null,
                    wrapMode: 'inline',
                  }).run();
                }}
              >
                <RotateCw className="w-3 h-3" />
                Reset
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => editor.chain().focus().deleteSelection().run()}
              >
                <Trash2 className="w-3 h-3" />
                Hapus
              </Button>
            </RibbonGroup>

            {/* Close hint */}
            <div className="flex-1" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Move className="w-3 h-3" />
              Seret sudut untuk resize, lingkaran atas untuk rotasi
            </div>
          </div>
        </TabsContent>

        {/* Shape Format Tab - Shows when text box is selected */}
        <TabsContent value="shape" className="m-0">
          <div className="bg-orange-50 border-b border-orange-200 p-2 flex items-end gap-3 flex-wrap">
            {/* Shape Fill */}
            <RibbonGroup title="Isi Shape">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Droplet className="w-3 h-3" />
                    Isi
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-background">
                  <div className="grid grid-cols-10 gap-1 mb-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => editor.chain().focus().updateAttributes('textBox', { fillColor: color }).run()}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => editor.chain().focus().updateAttributes('textBox', { fillColor: 'transparent' }).run()}
                  >
                    Tanpa Isi
                  </Button>
                </PopoverContent>
              </Popover>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Shape Outline */}
            <RibbonGroup title="Outline">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <PenLine className="w-3 h-3" />
                    Garis
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-background">
                  <div className="grid grid-cols-10 gap-1 mb-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => editor.chain().focus().updateAttributes('textBox', { outlineColor: color }).run()}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map(w => (
                      <Button
                        key={w}
                        variant="outline"
                        size="sm"
                        className="text-xs px-2"
                        onClick={() => editor.chain().focus().updateAttributes('textBox', { outlineWidth: w }).run()}
                      >
                        {w}pt
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs mt-1"
                    onClick={() => editor.chain().focus().updateAttributes('textBox', { outlineStyle: 'none' }).run()}
                  >
                    Tanpa Garis
                  </Button>
                </PopoverContent>
              </Popover>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Vertical Alignment */}
            <RibbonGroup title="Perataan Teks">
              <ToolbarButton
                onClick={() => editor.chain().focus().updateAttributes('textBox', { verticalAlign: 'top' }).run()}
                title="Atas"
              >
                <AlignVerticalJustifyStart className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().updateAttributes('textBox', { verticalAlign: 'middle' }).run()}
                title="Tengah"
              >
                <AlignVerticalJustifyCenter className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().updateAttributes('textBox', { verticalAlign: 'bottom' }).run()}
                title="Bawah"
              >
                <AlignVerticalJustifyEnd className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Delete */}
            <RibbonGroup title="Aksi">
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => editor.chain().focus().deleteSelection().run()}
              >
                <Trash2 className="w-3 h-3" />
                Hapus
              </Button>
            </RibbonGroup>

            <div className="flex-1" />
            <div className="text-xs text-muted-foreground">
              Klik border = Object Mode | Double-click = Text Mode | ESC = Keluar
            </div>
          </div>
        </TabsContent>

        {/* Table Design Tab - Shows when table is selected */}
        <TabsContent value="tableDesign" className="m-0">
          <div className="bg-green-50 border-b border-green-200 p-2 flex items-end gap-3 flex-wrap">
            {/* Table Styles Gallery */}
            <RibbonGroup title="Gaya Tabel">
              <div className="flex gap-1">
                {/* Style presets */}
                <button
                  className="w-12 h-8 border rounded text-[8px] bg-white hover:ring-2 ring-primary"
                  onClick={() => {
                    // Apply plain style
                    const cells = document.querySelectorAll('.tiptap-table td, .tiptap-table th');
                    cells.forEach((cell: any) => {
                      cell.style.backgroundColor = '';
                      cell.style.borderColor = '#d1d5db';
                    });
                  }}
                  title="Plain Table"
                >
                  <div className="grid grid-cols-3 gap-px p-0.5">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-200 h-1" />
                    ))}
                  </div>
                </button>
                <button
                  className="w-12 h-8 border rounded text-[8px] hover:ring-2 ring-primary overflow-hidden"
                  onClick={() => {
                    // Apply blue header style via attributes
                    editor.chain().focus().run();
                  }}
                  title="Grid Table 4 - Accent 1"
                >
                  <div className="h-2 bg-blue-600" />
                  <div className="grid grid-cols-3 gap-px p-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-blue-100 h-1" />
                    ))}
                  </div>
                </button>
                <button
                  className="w-12 h-8 border rounded text-[8px] hover:ring-2 ring-primary overflow-hidden"
                  onClick={() => {
                    editor.chain().focus().run();
                  }}
                  title="Grid Table 5 - Accent 3"
                >
                  <div className="h-2 bg-green-600" />
                  <div className="grid grid-cols-3 gap-px p-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-green-100 h-1" />
                    ))}
                  </div>
                </button>
                <button
                  className="w-12 h-8 border rounded text-[8px] hover:ring-2 ring-primary overflow-hidden"
                  onClick={() => {
                    editor.chain().focus().run();
                  }}
                  title="Grid Table 6 - Accent 5"
                >
                  <div className="h-2 bg-orange-600" />
                  <div className="grid grid-cols-3 gap-px p-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-orange-100 h-1" />
                    ))}
                  </div>
                </button>
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Table Style Options */}
            <RibbonGroup title="Opsi Gaya Tabel">
              <div className="flex flex-col gap-1 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3 h-3" defaultChecked />
                  <span>Header Row</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3 h-3" />
                  <span>Total Row</span>
                </label>
              </div>
              <div className="flex flex-col gap-1 text-xs ml-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3 h-3" />
                  <span>Banded Rows</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" className="w-3 h-3" />
                  <span>First Column</span>
                </label>
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Shading */}
            <RibbonGroup title="Shading">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Paintbrush className="w-3 h-3" />
                    Shading
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-background">
                  <div className="text-xs text-muted-foreground mb-2">
                    Pilih warna untuk cell yang diblok
                  </div>
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          // Apply shading to selected cells using our utility
                          applyShadingToSelectedCells(color);
                          // Also try TipTap's native method
                          editor.chain().focus().setCellAttribute('backgroundColor', color).run();
                        }}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs mt-2"
                    onClick={() => {
                      applyShadingToSelectedCells('');
                      editor.chain().focus().setCellAttribute('backgroundColor', '').run();
                    }}
                  >
                    Hapus Shading
                  </Button>
                </PopoverContent>
              </Popover>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Borders - Word-style dropdown */}
            <RibbonGroup title="Borders">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Grid3X3 className="w-3 h-3" />
                    Borders
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background w-48">
                  <DropdownMenuLabel className="text-xs">Border untuk cell terpilih</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => applyBorderToSelectedCells('all')}>
                    <div className="w-5 h-5 border-2 border-current mr-2" />
                    All Borders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyBorderToSelectedCells('outer')}>
                    <div className="w-5 h-5 border-2 border-current mr-2 flex items-center justify-center">
                      <div className="w-3 h-3 border border-transparent" />
                    </div>
                    Outer Border
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyBorderToSelectedCells('inner')}>
                    <div className="w-5 h-5 mr-2 flex items-center justify-center">
                      <div className="w-full h-px bg-current" />
                    </div>
                    Inner Borders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyBorderToSelectedCells('none')}>
                    <div className="w-5 h-5 mr-2 border border-dashed border-gray-300" />
                    No Borders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => applyBorderToSelectedCells('top')}>
                    <div className="w-5 h-5 mr-2 border-t-2 border-current" />
                    Border Top
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyBorderToSelectedCells('bottom')}>
                    <div className="w-5 h-5 mr-2 border-b-2 border-current" />
                    Border Bottom
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyBorderToSelectedCells('left')}>
                    <div className="w-5 h-5 mr-2 border-l-2 border-current" />
                    Border Left
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyBorderToSelectedCells('right')}>
                    <div className="w-5 h-5 mr-2 border-r-2 border-current" />
                    Border Right
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Border Color Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="Warna Border">
                    <PenLine className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2 bg-background">
                  <div className="text-xs text-muted-foreground mb-2">Warna Border</div>
                  <div className="grid grid-cols-10 gap-1">
                    {colors.slice(0, 20).map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => applyBorderToSelectedCells('all', color)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </RibbonGroup>

            <div className="flex-1" />
            <div className="text-xs text-muted-foreground">
              Klik 1x = pilih cell • Drag = pilih range • Ctrl+A = pilih semua • ESC = keluar
            </div>
          </div>
        </TabsContent>

        {/* Table Layout Tab - Shows when table is selected */}
        <TabsContent value="tableLayout" className="m-0">
          <div className="bg-green-50 border-b border-green-200 p-2 flex items-end gap-3 flex-wrap">
            {/* Select */}
            <RibbonGroup title="Pilih">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Square className="w-3 h-3" />
                    Select
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background">
                  <DropdownMenuItem onClick={() => editor.chain().focus().run()}>
                    Select Cell
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().run()}>
                    Select Column
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().run()}>
                    Select Row
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => editor.chain().focus().run()}>
                    Select Table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Rows & Columns */}
            <RibbonGroup title="Baris & Kolom">
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowBefore().run()}
                title="Sisip Baris di Atas"
              >
                <ArrowUp className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="Sisip Baris di Bawah"
              >
                <ArrowDown className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                title="Sisip Kolom Kiri"
              >
                <Columns className="w-4 h-4 rotate-180" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="Sisip Kolom Kanan"
              >
                <Columns className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Delete */}
            <RibbonGroup title="Hapus">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive">
                    <Trash2 className="w-3 h-3" />
                    Delete
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background">
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="text-destructive"
                  >
                    <Rows className="w-4 h-4 mr-2" /> Delete Row
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="text-destructive"
                  >
                    <Columns className="w-4 h-4 mr-2" /> Delete Column
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="text-destructive"
                  >
                    <TableIcon className="w-4 h-4 mr-2" /> Delete Table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Merge & Split */}
            <RibbonGroup title="Gabung">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => editor.chain().focus().mergeCells().run()}
                disabled={!editor.can().mergeCells()}
                title="Gabung Sel (pilih beberapa sel terlebih dahulu)"
              >
                <MergeIcon className="w-3 h-3" />
                Merge Cells
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => editor.chain().focus().splitCell().run()}
                disabled={!editor.can().splitCell()}
                title="Pisah Sel"
              >
                <SplitIcon className="w-3 h-3" />
                Split Cell
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Table Properties */}
            <RibbonGroup title="Properti Tabel">
              <div className="flex items-center gap-3">
                {/* Table Width */}
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Lebar:</Label>
                  <Input
                    type="text"
                    value={tableWidth}
                    onChange={(e) => setTableWidth(e.target.value)}
                    className="w-16 h-6 text-xs"
                    placeholder="100%"
                  />
                  <span className="text-[10px] text-muted-foreground">px/%</span>
                </div>

                {/* Border Width */}
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Border:</Label>
                  <Input
                    type="number"
                    value={tableBorderWidth}
                    onChange={(e) => setTableBorderWidth(e.target.value)}
                    className="w-12 h-6 text-xs"
                    min={0}
                    max={10}
                  />
                  <span className="text-[10px] text-muted-foreground">px</span>
                </div>

                {/* Border Color */}
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Warna:</Label>
                  <input
                    type="color"
                    value={tableBorderColor}
                    onChange={(e) => setTableBorderColor(e.target.value)}
                    className="w-6 h-6 border rounded cursor-pointer"
                  />
                </div>

                {/* Cell Padding */}
                <div className="flex items-center gap-1">
                  <Label className="text-xs">Padding:</Label>
                  <Input
                    type="number"
                    value={tableCellPadding}
                    onChange={(e) => setTableCellPadding(e.target.value)}
                    className="w-12 h-6 text-xs"
                    min={0}
                    max={50}
                  />
                  <span className="text-[10px] text-muted-foreground">px</span>
                </div>

                {/* Apply Button */}
                <Button
                  size="sm"
                  className="h-6 text-xs"
                  onClick={applyTableStyles}
                >
                  Terapkan
                </Button>
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* AutoFit Options */}
            <RibbonGroup title="AutoFit">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <Ruler className="w-3 h-3" />
                    AutoFit
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background">
                  <DropdownMenuItem onClick={() => setTableWidthPreset('auto')}>
                    AutoFit Contents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTableWidthPreset('full')}>
                    AutoFit Window (100%)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTableWidthPreset('fixed')}>
                    Fixed Column Width
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Table Position */}
            <RibbonGroup title="Posisi Tabel">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const table = document.querySelector('.ProseMirror .tiptap-table') as HTMLTableElement;
                    if (table) {
                      table.style.marginLeft = '0';
                      table.style.marginRight = 'auto';
                    }
                  }}
                  title="Rata Kiri"
                >
                  <AlignLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const table = document.querySelector('.ProseMirror .tiptap-table') as HTMLTableElement;
                    if (table) {
                      table.style.marginLeft = 'auto';
                      table.style.marginRight = 'auto';
                    }
                  }}
                  title="Rata Tengah"
                >
                  <AlignCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const table = document.querySelector('.ProseMirror .tiptap-table') as HTMLTableElement;
                    if (table) {
                      table.style.marginLeft = 'auto';
                      table.style.marginRight = '0';
                    }
                  }}
                  title="Rata Kanan"
                >
                  <AlignRight className="w-3 h-3" />
                </Button>
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Cell Alignment */}
            <RibbonGroup title="Alignment Sel">
              <div className="grid grid-cols-3 gap-0.5">
                <ToolbarButton
                  onClick={() => {
                    const cells = document.querySelectorAll('.tiptap-table .selectedCell');
                    cells.forEach((cell: Element) => {
                      (cell as HTMLElement).style.verticalAlign = 'top';
                      (cell as HTMLElement).style.textAlign = 'left';
                    });
                  }}
                  title="Kiri Atas"
                >
                  <AlignVerticalJustifyStart className="w-3 h-3" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const cells = document.querySelectorAll('.tiptap-table .selectedCell');
                    cells.forEach((cell: Element) => {
                      (cell as HTMLElement).style.verticalAlign = 'top';
                      (cell as HTMLElement).style.textAlign = 'center';
                    });
                  }}
                  title="Tengah Atas"
                >
                  <AlignCenter className="w-3 h-3" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const cells = document.querySelectorAll('.tiptap-table .selectedCell');
                    cells.forEach((cell: Element) => {
                      (cell as HTMLElement).style.verticalAlign = 'top';
                      (cell as HTMLElement).style.textAlign = 'right';
                    });
                  }}
                  title="Kanan Atas"
                >
                  <AlignRight className="w-3 h-3" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const cells = document.querySelectorAll('.tiptap-table .selectedCell');
                    cells.forEach((cell: Element) => {
                      (cell as HTMLElement).style.verticalAlign = 'middle';
                      (cell as HTMLElement).style.textAlign = 'left';
                    });
                  }}
                  title="Kiri Tengah"
                >
                  <AlignVerticalJustifyCenter className="w-3 h-3" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const cells = document.querySelectorAll('.tiptap-table .selectedCell');
                    cells.forEach((cell: Element) => {
                      (cell as HTMLElement).style.verticalAlign = 'middle';
                      (cell as HTMLElement).style.textAlign = 'center';
                    });
                  }}
                  title="Tengah"
                >
                  <AlignCenter className="w-3 h-3" />
                </ToolbarButton>
                <ToolbarButton
                  onClick={() => {
                    const cells = document.querySelectorAll('.tiptap-table .selectedCell');
                    cells.forEach((cell: Element) => {
                      (cell as HTMLElement).style.verticalAlign = 'middle';
                      (cell as HTMLElement).style.textAlign = 'right';
                    });
                  }}
                  title="Kanan Tengah"
                >
                  <AlignRight className="w-3 h-3" />
                </ToolbarButton>
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Header Row Toggle */}
            <RibbonGroup title="Data">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                title="Toggle Header Row"
              >
                <Rows className="w-3 h-3" />
                Header Row
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                title="Toggle Header Column"
              >
                <Columns className="w-3 h-3" />
                Header Column
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Table Layering */}
            <RibbonGroup title="Susunan">
              <LayerPanel
                editor={editor}
                selectedNode="table"
                onBringToFront={() => {
                  const newZ = getNextZIndex();
                  editor.commands.setTableZIndex(newZ);
                }}
                onSendToBack={() => {
                  editor.commands.setTableZIndex(1);
                }}
                onBringForward={() => {
                  // Get current z-index and increment
                  const tableWrapper = document.querySelector('.ProseMirror .tableWrapper.table-floating') as HTMLElement;
                  if (tableWrapper) {
                    const currentZ = parseInt(tableWrapper.style.zIndex || '10');
                    editor.commands.setTableZIndex(currentZ + 1);
                  }
                }}
                onSendBackward={() => {
                  const tableWrapper = document.querySelector('.ProseMirror .tableWrapper.table-floating') as HTMLElement;
                  if (tableWrapper) {
                    const currentZ = parseInt(tableWrapper.style.zIndex || '10');
                    editor.commands.setTableZIndex(Math.max(1, currentZ - 1));
                  }
                }}
              />
            </RibbonGroup>

            <div className="flex-1" />
            <div className="text-xs text-muted-foreground">
              Pilih beberapa sel untuk Merge • Klik sel merged untuk Split
            </div>
          </div>
        </TabsContent>

        {/* View Tab */}
        <TabsContent value="view" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Navigasi & Pencarian">
              <ToolbarButton
                onClick={() => setShowFindReplace(!showFindReplace)}
                active={showFindReplace}
                title="Cari & Ganti (Ctrl+H)"
              >
                <Replace className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => setShowAoC(!showAoC)}
                active={showAoC}
                title="Daftar Isi"
              >
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Zoom">
              <ToolbarButton onClick={() => updatePageConfig({ zoom: Math.max(10, pageConfig.zoom - 10) })} title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </ToolbarButton>
              <span className="text-xs w-8 text-center">{Math.round(pageConfig.zoom)}%</span>
              <ToolbarButton onClick={() => updatePageConfig({ zoom: Math.min(200, pageConfig.zoom + 10) })} title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Tampilan">
              <div className="flex items-center gap-2 px-2">
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    id="showRuler"
                    checked={showRuler}
                    onChange={(e) => setShowRuler(e.target.checked)}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="showRuler" className="text-xs">Penggaris</Label>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    id="showBorder"
                    checked={showPageBorder}
                    onChange={(e) => setShowPageBorder(e.target.checked)}
                    className="h-3 w-3"
                  />
                  <Label htmlFor="showBorder" className="text-xs">Batas Kertas</Label>
                </div>
              </div>
            </RibbonGroup>
          </div>
        </TabsContent>
      </Tabs>

      {/* Main Content Area with potential Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Table of Contents Sidebar */}
        {showAoC && (
          <TableOfContents editor={editor} onClose={() => setShowAoC(false)} />
        )}

        {/* Find and Replace Dialog Overlay */}
        {showFindReplace && (
          <FindReplace editor={editor} onClose={() => setShowFindReplace(false)} />
        )}

        {/* Editor Content with Ruler and Page */}
        <div className="flex-1 overflow-auto bg-muted/30 flex flex-col" ref={editorContainerRef}>
          {/* Horizontal Ruler */}
          {showRuler && (
            <div className="sticky top-0 z-10 bg-background border-b">
              <div
                className="mx-auto"
                style={{ width: calculatePageDisplayWidth() }}
              >
                <EditorRuler
                  width={calculatePageDisplayWidth()}
                  leftMargin={pageConfig.margins.left}
                  rightMargin={pageConfig.margins.right}
                  firstLineIndent={firstLineIndent}
                  hangingIndent={hangingIndent}
                  tabStops={tabStops}
                  onLeftMarginChange={(v) => updateMargins({ left: v })}
                  onRightMarginChange={(v) => updateMargins({ right: v })}
                  onFirstLineIndentChange={setFirstLineIndent}
                  onHangingIndentChange={setHangingIndent}
                  onTabStopsChange={setTabStops}
                  pageWidth={pageDimensions.width}
                  pageHeight={pageDimensions.height}
                  orientation={pageConfig.orientation}
                  topMargin={pageConfig.margins.top}
                  bottomMargin={pageConfig.margins.bottom}
                  onTopMarginChange={(v) => updateMargins({ top: v })}
                  onBottomMarginChange={(v) => updateMargins({ bottom: v })}
                />
              </div>
            </div>
          )}

          {/* Page Container */}
          <div
            className="flex-1 py-6"
            ref={pageContainerRef}
          >
            <PageContainer
              config={{ ...pageConfig, zoom: pageConfig.zoom }} // Ensure fresh object to trigger updates
              showPageBorder={showPageBorder}
              containerWidth={containerWidth}
              header={<EditorContent editor={headerEditor} />}
              footer={<EditorContent editor={footerEditor} />}
            >
              <TableContextMenu editor={editor}>
                <EditorContent
                  editor={editor}
                  className="h-full"
                  style={{
                    textIndent: firstLineIndent !== 0 ? `${firstLineIndent}mm` : undefined,
                    paddingLeft: hangingIndent > 0 ? `${hangingIndent}mm` : undefined,
                    lineHeight: lineSpacing,
                  }}
                />
              </TableContextMenu>

              {/* Draw Text Box Overlay */}
              {isDrawingTextBox && (
                <div
                  className="absolute inset-0 z-50 cursor-crosshair"
                  style={{ background: 'rgba(59, 130, 246, 0.05)' }}
                  onMouseDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setDrawStart({ x, y });
                    setDrawCurrent({ x, y });
                  }}
                  onMouseMove={(e) => {
                    if (!drawStart) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    setDrawCurrent({ x, y });
                  }}
                  onMouseUp={(e) => {
                    if (!drawStart || !drawCurrent) {
                      setDrawStart(null);
                      setDrawCurrent(null);
                      return;
                    }

                    const minX = Math.min(drawStart.x, drawCurrent.x);
                    const minY = Math.min(drawStart.y, drawCurrent.y);
                    const width = Math.abs(drawCurrent.x - drawStart.x);
                    const height = Math.abs(drawCurrent.y - drawStart.y);

                    // Only create if size is meaningful
                    if (width > 30 && height > 20) {
                      editor?.commands.focus();
                      editor?.commands.insertTextBox({
                        width: Math.round(width),
                        height: Math.round(height),
                        posX: Math.round(minX),
                        posY: Math.round(minY),
                        content: '',
                      });
                    }

                    setIsDrawingTextBox(false);
                    setDrawStart(null);
                    setDrawCurrent(null);
                  }}
                  onMouseLeave={() => {
                    if (drawStart) {
                      setDrawStart(null);
                      setDrawCurrent(null);
                    }
                  }}
                >
                  {/* Drawing instruction */}
                  {!drawStart && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
                      Klik dan seret untuk menggambar Text Box
                    </div>
                  )}

                  {/* Drawing preview rectangle */}
                  {drawStart && drawCurrent && (
                    <div
                      className="absolute border-2 border-primary bg-primary/10 pointer-events-none"
                      style={{
                        left: Math.min(drawStart.x, drawCurrent.x),
                        top: Math.min(drawStart.y, drawCurrent.y),
                        width: Math.abs(drawCurrent.x - drawStart.x),
                        height: Math.abs(drawCurrent.y - drawStart.y),
                      }}
                    >
                      {/* Size indicator while drawing */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                        {Math.round(Math.abs(drawCurrent.x - drawStart.x))} × {Math.round(Math.abs(drawCurrent.y - drawStart.y))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </PageContainer>
          </div>
        </div>
      </div>
      {/* Table Dialog */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sisipkan Tabel</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Baris</Label>
              <Input type="number" min={1} max={20} value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value) || 3)} />
            </div>
            <div className="space-y-2">
              <Label>Kolom</Label>
              <Input type="number" min={1} max={20} value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value) || 3)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTableDialog(false)}>Batal</Button>
            <Button onClick={insertTable}>Sisipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image URL Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sisipkan Gambar dari URL</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>URL Gambar</Label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>Batal</Button>
            <Button onClick={() => insertImage(imageUrl)}>Sisipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sisipkan Link</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label>URL</Label>
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Batal</Button>
            <Button onClick={setLink}>Sisipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* TipTap Styles - Word 2016 compatible */}
      <style>{`
        .ProseMirror {
          min-height: 500px;
          padding: 1rem;
          outline: none;
          position: relative;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        
        /* Table styles are in index.css - no inline overrides here */

        /* Image wrapper styles */
        .tiptap-image-wrapper {
          display: inline-block;
          position: relative;
          margin: 0.5em;
          user-select: none;
        }
        .tiptap-image-wrapper.tiptap-image-floating {
          display: block;
        }
        .tiptap-image-wrapper.tiptap-image-selected {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 2px;
        }
        .tiptap-image {
          display: block;
          max-width: 100%;
          height: auto;
          border-radius: 0.25rem;
          transition: transform 0.1s ease;
        }

        /* Quick toolbar */
        .tiptap-image-toolbar {
          position: absolute;
          top: -36px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 4px;
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          box-shadow: 0 2px 8px hsl(var(--foreground) / 0.1);
          z-index: 50;
        }
        .tiptap-toolbar-divider {
          width: 1px;
          height: 16px;
          background: hsl(var(--border));
          margin: 0 4px;
        }

        /* Resize handles */
        .tiptap-image-resize-handle {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 2px;
          background: hsl(var(--background));
          border: 2px solid hsl(var(--primary));
          z-index: 10;
          transition: transform 0.1s;
        }
        .tiptap-image-resize-handle:hover {
          transform: scale(1.2);
          background: hsl(var(--primary));
        }
        
        /* Corner handles */
        .tiptap-image-resize-nw { top: -6px; left: -6px; cursor: nwse-resize; }
        .tiptap-image-resize-ne { top: -6px; right: -6px; cursor: nesw-resize; }
        .tiptap-image-resize-sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
        .tiptap-image-resize-se { bottom: -6px; right: -6px; cursor: nwse-resize; }
        
        /* Side handles */
        .tiptap-image-resize-n { top: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
        .tiptap-image-resize-s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
        .tiptap-image-resize-e { right: -6px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }
        .tiptap-image-resize-w { left: -6px; top: 50%; transform: translateY(-50%); cursor: ew-resize; }

        /* Rotation handle */
        .tiptap-image-rotate-handle {
          position: absolute;
          top: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: hsl(var(--background));
          border: 2px solid hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
          z-index: 15;
          color: hsl(var(--primary));
        }
        .tiptap-image-rotate-handle:hover {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .tiptap-image-rotate-handle:active {
          cursor: grabbing;
        }
        
        /* Connection line from rotate handle to image */
        .tiptap-image-wrapper.tiptap-image-selected::before {
          content: '';
          position: absolute;
          top: -34px;
          left: 50%;
          width: 1px;
          height: 28px;
          background: hsl(var(--primary));
          z-index: 5;
        }

        /* Size indicator */
        .tiptap-image-size-indicator {
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%);
          padding: 2px 8px;
          background: hsl(var(--foreground));
          color: hsl(var(--background));
          font-size: 11px;
          font-family: monospace;
          border-radius: 4px;
          white-space: nowrap;
          z-index: 20;
        }

        .tiptap-link {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
        .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 1em;
          margin-left: 0;
          font-style: italic;
        }
        .ProseMirror pre {
          background-color: hsl(var(--muted));
          padding: 1em;
          border-radius: 4px;
          overflow-x: auto;
        }
        .ProseMirror code {
          background-color: hsl(var(--muted));
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
        }
        .ProseMirror h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        .ProseMirror h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
        .ProseMirror h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
        }
        .ProseMirror li {
          margin: 0.25em 0;
        }
        
        /* Wrap mode styles */
        [data-wrap-mode="square"] {
          float: left;
          margin: 0.5em 1em 0.5em 0;
        }
        [data-wrap-mode="tight"] {
          float: left;
          margin: 0.25em 0.5em 0.25em 0;
          shape-outside: inset(0);
        }
        [data-wrap-mode="behind"] {
          position: absolute;
          z-index: -1;
          opacity: 0.9;
        }
        [data-wrap-mode="infront"] {
          position: absolute;
          z-index: 100;
        }
      `}</style>
    </div>
  );
}
