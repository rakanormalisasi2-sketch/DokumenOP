import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { FormField } from '@/types';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
  Braces,
  ChevronDown,
  Image,
  Table,
  Palette,
  Highlighter,
  Subscript,
  Superscript,
  Link,
  PenTool,
  FileText,
  Indent,
  Outdent,
  RotateCcw,
  Copy,
  Scissors,
  Clipboard,
  Columns,
  LayoutGrid,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Settings2,
  PaintBucket,
  Replace,
  Move,
  Maximize2,
  Square,
  WrapText,
  Trash2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  X,
  GripVertical,
  Plus,
  Rows,
  Grid3X3,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Image resize handles component
interface ImageResizeHandlesProps {
  image: HTMLImageElement;
  imageTransform: { rotation: number; flipX: boolean; flipY: boolean; width: number; height: number };
  onMouseDown: (e: React.MouseEvent, action: string) => void;
  isRotating: boolean;
}

const ImageResizeHandles = ({ image, imageTransform, onMouseDown, isRotating }: ImageResizeHandlesProps) => {
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, height: 0 });
  
  useEffect(() => {
    const updatePosition = () => {
      if (!image) return;
      const rect = image.getBoundingClientRect();
      // Find the scrollable container (overflow-auto)
      const scrollContainer = image.closest('.overflow-auto');
      const containerRect = scrollContainer?.getBoundingClientRect();
      const scrollTop = scrollContainer?.scrollTop || 0;
      const scrollLeft = scrollContainer?.scrollLeft || 0;
      
      if (containerRect) {
        setPosition({
          left: rect.left - containerRect.left + scrollLeft,
          top: rect.top - containerRect.top + scrollTop,
          width: rect.width,
          height: rect.height
        });
      }
    };
    
    updatePosition();
    
    // Update on various events (event-driven, no polling)
    window.addEventListener('resize', updatePosition);
    const scrollContainer = image.closest('.overflow-auto');
    scrollContainer?.addEventListener('scroll', updatePosition);
    
    // Use MutationObserver for style/attribute changes (covers resize/rotate)
    const observer = new MutationObserver(updatePosition);
    observer.observe(image, { attributes: true, attributeFilter: ['style', 'width', 'height'] });
    
    // Use ResizeObserver to catch DOM-driven size changes (replaces setInterval)
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(image);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      scrollContainer?.removeEventListener('scroll', updatePosition);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [image, imageTransform]);

  
  const handleSize = 10;
  const rotateHandleOffset = -35;
  
  // Common handle style
  const handleStyle = (cursor: string): React.CSSProperties => ({
    position: 'absolute',
    width: handleSize,
    height: handleSize,
    backgroundColor: '#fff',
    border: '2px solid #3b82f6',
    borderRadius: 2,
    cursor,
    zIndex: 9999,
  });
  
  return (
    <div 
      style={{
        position: 'absolute',
        left: position.left,
        top: position.top,
        width: position.width,
        height: position.height,
        // IMPORTANT: must be interactive so handles can receive events
        pointerEvents: 'auto',
        transform: `rotate(${imageTransform.rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: 9998,
      }}
    >
      {/* Move handle - center of image */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          cursor: 'move',
          pointerEvents: 'auto',
          backgroundColor: 'transparent',
        }}
        onMouseDown={(e) => onMouseDown(e, 'move')}
        title="Seret untuk memindahkan gambar"
      />
      
      {/* Corner handles */}
      <div 
        style={{ ...handleStyle('nwse-resize'), top: -handleSize/2, left: -handleSize/2, pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown(e, 'nw')}
      />
      <div 
        style={{ ...handleStyle('nesw-resize'), top: -handleSize/2, right: -handleSize/2, pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown(e, 'ne')}
      />
      <div 
        style={{ ...handleStyle('nesw-resize'), bottom: -handleSize/2, left: -handleSize/2, pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown(e, 'sw')}
      />
      <div 
        style={{ ...handleStyle('nwse-resize'), bottom: -handleSize/2, right: -handleSize/2, pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown(e, 'se')}
      />
      
      {/* Edge handles */}
      <div 
        style={{ ...handleStyle('ns-resize'), top: -handleSize/2, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown(e, 'n')}
      />
      <div 
        style={{ ...handleStyle('ns-resize'), bottom: -handleSize/2, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown(e, 's')}
      />
      <div 
        style={{ ...handleStyle('ew-resize'), top: '50%', left: -handleSize/2, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown(e, 'w')}
      />
      <div 
        style={{ ...handleStyle('ew-resize'), top: '50%', right: -handleSize/2, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
        onMouseDown={(e) => onMouseDown(e, 'e')}
      />
      
      {/* Rotate handle */}
      <div 
        style={{
          position: 'absolute',
          top: rotateHandleOffset,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'auto',
          zIndex: 10000,
        }}
      >
        <div 
          style={{
            width: 22,
            height: 22,
            backgroundColor: isRotating ? '#3b82f6' : '#fff',
            border: '2px solid #3b82f6',
            borderRadius: '50%',
            cursor: 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          onMouseDown={(e) => onMouseDown(e, 'rotate')}
          title="Seret untuk memutar gambar"
        >
          <RotateCw size={12} color={isRotating ? '#fff' : '#3b82f6'} />
        </div>
        <div style={{ width: 2, height: Math.abs(rotateHandleOffset) - 22, backgroundColor: '#3b82f6' }} />
      </div>
    </div>
  );
};

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  fields: FormField[];
}

const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'];
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
  'Book Antiqua',
  'Trebuchet MS',
  'Comic Sans MS',
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

const borderStyles = ['solid', 'dashed', 'dotted', 'double', 'none'];

type ImageWrapStyle = 'inline' | 'wrap-left' | 'wrap-right' | 'behind' | 'infront';
type ContextualMode = 'none' | 'image' | 'table';

export default function RichTextEditor({ content, onChange, fields }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState('12');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [activeTab, setActiveTab] = useState('home');
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  
  // Ruler margins (in mm, max 210mm for A4)
  const [leftMargin, setLeftMargin] = useState(25);
  const [rightMargin, setRightMargin] = useState(25);
  const [leftIndent, setLeftIndent] = useState(0);
  const [rightIndent, setRightIndent] = useState(0);
  
  // Tab stops (positions in mm from left edge)
  const [tabStops, setTabStops] = useState<number[]>([]);
  const [draggingTabStop, setDraggingTabStop] = useState<number | null>(null);
  
  // Contextual ribbon mode
  const [contextualMode, setContextualMode] = useState<ContextualMode>('none');
  
  // Image settings (inline editing)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageTransform, setImageTransform] = useState({ x: 0, y: 0, width: 100, height: 100, rotation: 0, flipX: false, flipY: false });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalAspectRatio, setOriginalAspectRatio] = useState(1);
  const [rotateStart, setRotateStart] = useState({ angle: 0, startAngle: 0 });
  
  // Table settings
  const [selectedTable, setSelectedTable] = useState<HTMLTableElement | null>(null);
  const [tableBorderWidth, setTableBorderWidth] = useState(1);
  const [tableBorderStyle, setTableBorderStyle] = useState('solid');
  const [tableBorderColor, setTableBorderColor] = useState('#000000');
  const [tableBorderOpacity, setTableBorderOpacity] = useState(100);

  // Tab stop functions
  const addTabStop = (position: number) => {
    // Round to nearest 5mm for easier alignment
    const roundedPos = Math.round(position / 5) * 5;
    if (roundedPos > leftMargin && roundedPos < 210 - rightMargin) {
      if (!tabStops.includes(roundedPos)) {
        setTabStops([...tabStops, roundedPos].sort((a, b) => a - b));
      }
    }
  };

  const removeTabStop = (position: number) => {
    setTabStops(tabStops.filter(t => t !== position));
  };

  const moveTabStop = (oldPos: number, newPos: number) => {
    const roundedPos = Math.round(newPos / 5) * 5;
    if (roundedPos > leftMargin && roundedPos < 210 - rightMargin) {
      setTabStops(tabStops.map(t => t === oldPos ? roundedPos : t).sort((a, b) => a - b));
    }
  };

  // Handle ruler click to add tab stop
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const ruler = rulerRef.current;
    if (!ruler) return;
    
    // Don't add if clicking on existing markers
    if ((e.target as HTMLElement).closest('[data-marker]')) return;
    
    const rect = ruler.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = Math.round((x / rect.width) * 210);
    addTabStop(position);
  };

  // Insert tab character that aligns to next tab stop
  const insertTab = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    // Calculate the next tab stop position
    // Default tab width if no custom stops: 12.7mm (0.5 inch)
    const defaultTabWidth = 12.7;
    
    let tabWidth = defaultTabWidth;
    
    // If there are custom tab stops, calculate distance to next one
    if (tabStops.length > 0) {
      // Get current cursor position relative to editor
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();
      
      if (editorRect) {
        // Estimate current position in mm
        const editorWidthPx = editorRect.width;
        const editorWidthMm = 210 - leftMargin - rightMargin;
        const pxPerMm = editorWidthPx / editorWidthMm;
        
        const cursorPosFromLeft = rect.left - editorRect.left;
        const cursorPosMm = leftMargin + (cursorPosFromLeft / pxPerMm);
        
        // Find next tab stop
        const nextTabStop = tabStops.find(t => t > cursorPosMm);
        if (nextTabStop) {
          tabWidth = nextTabStop - cursorPosMm;
        }
      }
    }
    
    // Insert a tab span with calculated width
    const tabHtml = `<span class="tab-stop" style="display: inline-block; width: ${tabWidth}mm; min-width: ${defaultTabWidth}mm;">\u00A0</span>`;
    document.execCommand('insertHTML', false, tabHtml);
    handleChange();
  };

  const execCommand = (command: string, value?: string) => {
    // Focus the editor first to ensure command works
    editorRef.current?.focus();
    
    // For undo/redo, we need to ensure the editor has focus
    if (command === 'undo' || command === 'redo') {
      const selection = window.getSelection();
      if (selection && editorRef.current) {
        // Ensure selection is within editor
        if (!editorRef.current.contains(selection.anchorNode)) {
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    }
    
    document.execCommand(command, false, value);
    handleChange();
  };

  // Update editor content when prop changes (important for loading from localStorage)
  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertPlaceholder = (fieldName: string) => {
    const placeholder = `<span class="placeholder-tag" contenteditable="false" style="background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; user-select: all;">{{${fieldName}}}</span>&nbsp;`;
    document.execCommand('insertHTML', false, placeholder);
    handleChange();
  };

  // Replace selected text with placeholder
  const replaceWithPlaceholder = (fieldName: string) => {
    if (savedSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedSelection);
        
        const placeholder = `<span class="placeholder-tag" contenteditable="false" style="background-color: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; user-select: all;">{{${fieldName}}}</span>&nbsp;`;
        document.execCommand('insertHTML', false, placeholder);
        handleChange();
      }
    }
    setShowReplaceDialog(false);
    setSelectedText('');
    setSavedSelection(null);
  };

  // Open replace dialog with current selection
  const openReplaceDialog = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      if (selection.rangeCount > 0) {
        setSavedSelection(selection.getRangeAt(0).cloneRange());
      }
      setShowReplaceDialog(true);
    }
  };

  const insertTable = () => {
    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
    for (let i = 0; i < tableRows; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < tableCols; j++) {
        tableHtml += `<td style="border: 1px solid #000; padding: 8px; min-width: 50px;">&nbsp;</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</table><p>&nbsp;</p>';
    document.execCommand('insertHTML', false, tableHtml);
    handleChange();
    setShowTableDialog(false);
  };

  const insertImage = (url?: string) => {
    const src = url || imageUrl;
    if (src) {
      const imgHtml = `<img src="${src}" style="max-width: 100%; height: auto; margin: 10px 0; cursor: pointer;" alt="Gambar" data-wrap-style="inline"/>`;
      document.execCommand('insertHTML', false, imgHtml);
      handleChange();
      setShowImageDialog(false);
      setImageUrl('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        insertImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle click on editor elements
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check if clicked on image
    if (target.tagName === 'IMG') {
      e.preventDefault();
      e.stopPropagation();
      const img = target as HTMLImageElement;
      selectImage(img);
      return;
    }
    
    // Check if clicked on table or table cell
    const table = target.closest('table') as HTMLTableElement | null;
    if (table && editorRef.current?.contains(table)) {
      selectTable(table);
      return;
    }
    
    // Click elsewhere - deselect
    deselectAll();
  };

  // Select an image for editing
  const selectImage = (img: HTMLImageElement) => {
    deselectAll();
    setSelectedImage(img);
    setSelectedTable(null);
    setContextualMode('image');
    setOriginalAspectRatio(img.naturalWidth / img.naturalHeight || 1);
    
    // Parse existing transform
    const transform = img.style.transform || '';
    const rotateMatch = transform.match(/rotate\((-?\d+(?:\.\d+)?)deg\)/);
    const rotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
    const flipX = transform.includes('scaleX(-1)');
    const flipY = transform.includes('scaleY(-1)');
    
    setImageTransform({
      x: img.offsetLeft,
      y: img.offsetTop,
      width: img.width || img.naturalWidth,
      height: img.height || img.naturalHeight,
      rotation,
      flipX,
      flipY
    });
    
    // Add selection outline
    img.style.outline = '2px solid #3b82f6';
    img.style.outlineOffset = '2px';
  };

  // Select a table for editing
  const selectTable = (table: HTMLTableElement) => {
    deselectAll();
    setSelectedTable(table);
    setSelectedImage(null);
    setContextualMode('table');
    
    // Parse current border style
    const cells = table.querySelectorAll('td, th');
    if (cells.length > 0) {
      const cell = cells[0] as HTMLElement;
      const borderStyle = cell.style.border || '1px solid #000';
      const match = borderStyle.match(/(\d+)px\s+(solid|dashed|dotted|double|none)\s+(#[a-fA-F0-9]+|rgba?\([^)]+\))/);
      if (match) {
        setTableBorderWidth(parseInt(match[1]) || 1);
        setTableBorderStyle(match[2] || 'solid');
        setTableBorderColor(match[3] || '#000000');
      }
    }
    
    // Add selection outline
    table.style.outline = '2px solid #3b82f6';
    table.style.outlineOffset = '2px';
  };

  // Deselect all
  const deselectAll = () => {
    if (selectedImage) {
      selectedImage.style.outline = 'none';
      selectedImage.style.outlineOffset = '0';
    }
    if (selectedTable) {
      selectedTable.style.outline = 'none';
      selectedTable.style.outlineOffset = '0';
    }
    setSelectedImage(null);
    setSelectedTable(null);
    setContextualMode('none');
  };

  // Image manipulation functions
  const applyImageWrapStyle = (style: ImageWrapStyle) => {
    if (!selectedImage) return;
    
    selectedImage.setAttribute('data-wrap-style', style);
    
    switch (style) {
      case 'inline':
        selectedImage.style.display = 'inline-block';
        selectedImage.style.float = 'none';
        selectedImage.style.position = 'relative';
        selectedImage.style.zIndex = 'auto';
        break;
      case 'wrap-left':
        selectedImage.style.display = 'block';
        selectedImage.style.float = 'left';
        selectedImage.style.marginRight = '15px';
        selectedImage.style.position = 'relative';
        selectedImage.style.zIndex = 'auto';
        break;
      case 'wrap-right':
        selectedImage.style.display = 'block';
        selectedImage.style.float = 'right';
        selectedImage.style.marginLeft = '15px';
        selectedImage.style.position = 'relative';
        selectedImage.style.zIndex = 'auto';
        break;
      case 'behind':
        selectedImage.style.display = 'block';
        selectedImage.style.float = 'none';
        selectedImage.style.position = 'absolute';
        selectedImage.style.zIndex = '-1';
        selectedImage.style.opacity = '1';
        // Ensure parent has proper stacking context
        if (selectedImage.parentElement) {
          selectedImage.parentElement.style.position = 'relative';
        }
        break;
      case 'infront':
        selectedImage.style.display = 'block';
        selectedImage.style.float = 'none';
        selectedImage.style.position = 'absolute';
        selectedImage.style.zIndex = '10';
        break;
    }
    handleChange();
  };

  const resizeImage = (width: number, height: number) => {
    if (!selectedImage) return;
    selectedImage.style.width = `${width}px`;
    selectedImage.style.height = `${height}px`;
    setImageTransform(prev => ({ ...prev, width, height }));
    handleChange();
  };

  // Apply transform (rotation + flip) to image
  const applyImageTransform = (rotation: number, flipX: boolean, flipY: boolean) => {
    if (!selectedImage) return;
    const transforms: string[] = [];
    if (rotation !== 0) transforms.push(`rotate(${rotation}deg)`);
    if (flipX) transforms.push('scaleX(-1)');
    if (flipY) transforms.push('scaleY(-1)');
    selectedImage.style.transform = transforms.join(' ');
    setImageTransform(prev => ({ ...prev, rotation, flipX, flipY }));
    handleChange();
  };

  const rotateImage = (degrees: number) => {
    const newRotation = (imageTransform.rotation + degrees) % 360;
    applyImageTransform(newRotation, imageTransform.flipX, imageTransform.flipY);
  };

  const flipImage = (axis: 'x' | 'y') => {
    if (axis === 'x') {
      applyImageTransform(imageTransform.rotation, !imageTransform.flipX, imageTransform.flipY);
    } else {
      applyImageTransform(imageTransform.rotation, imageTransform.flipX, !imageTransform.flipY);
    }
  };

  const deleteSelectedImage = () => {
    if (!selectedImage) return;
    selectedImage.remove();
    deselectAll();
    handleChange();
  };

  // Mouse event handlers for image transform
  const handleImageMouseDown = (e: React.MouseEvent, action: 'move' | 'rotate' | string) => {
    if (!selectedImage) return;
    e.preventDefault();
    e.stopPropagation();

    if (action === 'rotate') {
      setIsRotating(true);
      // Calculate center of image for rotation
      const rect = selectedImage.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      setRotateStart({ angle: imageTransform.rotation, startAngle });
      return;
    }

    // Ensure the image is positioned so left/top changes actually move it.
    if (action === 'move') {
      const wrapStyle = (selectedImage.getAttribute('data-wrap-style') as ImageWrapStyle | null) ?? 'inline';
      const shouldBeAbsolute = wrapStyle === 'behind' || wrapStyle === 'infront';
      selectedImage.style.position = shouldBeAbsolute ? 'absolute' : 'relative';

      // Avoid jumping on first drag: initialize left/top from current layout.
      if (shouldBeAbsolute) {
        if (!selectedImage.style.left) selectedImage.style.left = `${selectedImage.offsetLeft}px`;
        if (!selectedImage.style.top) selectedImage.style.top = `${selectedImage.offsetTop}px`;
      }

      setIsDragging(true);
    } else {
      setIsResizing(action);
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isDragging && !isResizing && !isRotating) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!selectedImage) return;
      
      if (isRotating) {
        // Calculate rotation based on mouse position relative to image center
        const rect = selectedImage.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

        // Invert delta so drag direction matches intuitive clockwise rotation
        const deltaAngle = rotateStart.startAngle - currentAngle;
        let newRotation = rotateStart.angle + deltaAngle;

        // Snap to 15 degree increments if shift is held
        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }

        applyImageTransform(newRotation, imageTransform.flipX, imageTransform.flipY);
        return;
      }
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      if (isDragging) {
        // Move image
        const currentLeft = parseInt(selectedImage.style.left || '0') || 0;
        const currentTop = parseInt(selectedImage.style.top || '0') || 0;
        selectedImage.style.left = `${currentLeft + deltaX}px`;
        selectedImage.style.top = `${currentTop + deltaY}px`;
        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing) {
        // Resize image with aspect ratio lock for corner handles
        const isCorner = ['nw', 'ne', 'sw', 'se'].includes(isResizing);
        
        let newWidth = imageTransform.width;
        let newHeight = imageTransform.height;
        
        if (isResizing.includes('e')) newWidth += deltaX;
        if (isResizing.includes('w')) newWidth -= deltaX;
        if (isResizing.includes('s')) newHeight += deltaY;
        if (isResizing.includes('n')) newHeight -= deltaY;
        
        // Lock aspect ratio for corner drag
        if (isCorner) {
          const avgScale = ((newWidth / imageTransform.width) + (newHeight / imageTransform.height)) / 2;
          newWidth = imageTransform.width * avgScale;
          newHeight = newWidth / originalAspectRatio;
        }
        
        if (newWidth > 20 && newHeight > 20) {
          resizeImage(Math.max(20, Math.round(newWidth)), Math.max(20, Math.round(newHeight)));
          setDragStart({ x: e.clientX, y: e.clientY });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
      setIsRotating(false);
      handleChange();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, isRotating, dragStart, selectedImage, imageTransform, rotateStart, originalAspectRatio]);

  // Table manipulation functions
  const applyTableBorder = () => {
    if (!selectedTable) return;
    
    const borderValue = `${tableBorderWidth}px ${tableBorderStyle} ${tableBorderColor}`;
    const cells = selectedTable.querySelectorAll('td, th');
    cells.forEach((cell) => {
      (cell as HTMLElement).style.border = borderValue;
    });
    selectedTable.style.opacity = `${tableBorderOpacity / 100}`;
    handleChange();
  };

  const addTableRow = (position: 'above' | 'below') => {
    if (!selectedTable) return;
    const rows = selectedTable.rows;
    if (rows.length === 0) return;
    
    const refRow = rows[position === 'above' ? 0 : rows.length - 1];
    const newRow = selectedTable.insertRow(position === 'above' ? 0 : -1);
    
    for (let i = 0; i < refRow.cells.length; i++) {
      const cell = newRow.insertCell();
      cell.style.cssText = refRow.cells[i].style.cssText;
      cell.innerHTML = '&nbsp;';
    }
    handleChange();
  };

  const addTableColumn = (position: 'left' | 'right') => {
    if (!selectedTable) return;
    const rows = selectedTable.rows;
    
    for (let i = 0; i < rows.length; i++) {
      const refCell = rows[i].cells[position === 'left' ? 0 : rows[i].cells.length - 1];
      const newCell = rows[i].insertCell(position === 'left' ? 0 : -1);
      newCell.style.cssText = refCell?.style.cssText || 'border: 1px solid #000; padding: 8px;';
      newCell.innerHTML = '&nbsp;';
    }
    handleChange();
  };

  const deleteSelectedTable = () => {
    if (!selectedTable) return;
    selectedTable.remove();
    deselectAll();
    handleChange();
  };

  const insertLink = () => {
    if (linkUrl) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" style="color: #0066cc; text-decoration: underline;">${linkText || linkUrl}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
      handleChange();
      setShowLinkDialog(false);
      setLinkUrl('');
      setLinkText('');
    }
  };

  const insertSignaturePlaceholder = () => {
    const signatureHtml = `
      <div style="margin-top: 50px; text-align: center; width: 200px;">
        <div style="border-bottom: 1px solid #000; height: 60px; margin-bottom: 5px;"></div>
        <p style="margin: 0; font-size: 11pt;">Tanda Tangan</p>
      </div>
    `;
    document.execCommand('insertHTML', false, signatureHtml);
    handleChange();
  };

  const insertLetterhead = () => {
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
    document.execCommand('insertHTML', false, letterheadHtml);
    handleChange();
  };

  const insertHorizontalLine = () => {
    document.execCommand('insertHTML', false, '<hr style="border: 0; border-top: 1px solid #000; margin: 15px 0;"/>');
    handleChange();
  };

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

  const RibbonGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-0.5 px-2">{children}</div>
      <span className="text-[10px] text-muted-foreground mt-1">{title}</span>
    </div>
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-background h-full flex flex-col">
      {/* Contextual Ribbon for Image */}
      {contextualMode === 'image' && selectedImage && (
        <div className="bg-blue-50 border-b border-blue-200 p-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs font-medium text-blue-700 mr-2">
              <Image className="w-4 h-4" />
              Format Gambar
            </div>
            <Separator orientation="vertical" className="h-8" />
            
            {/* Size controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ukuran:</span>
              <Input
                type="number"
                min="20"
                max="800"
                value={imageTransform.width}
                onChange={(e) => {
                  const w = parseInt(e.target.value) || 100;
                  const h = Math.round(w / originalAspectRatio);
                  resizeImage(w, h);
                }}
                className="w-16 h-7 text-xs"
              />
              <span className="text-xs">×</span>
              <Input
                type="number"
                min="20"
                max="800"
                value={imageTransform.height}
                onChange={(e) => {
                  const h = parseInt(e.target.value) || 100;
                  const w = Math.round(h * originalAspectRatio);
                  resizeImage(w, h);
                }}
                className="w-16 h-7 text-xs"
              />
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Quick size buttons */}
            <div className="flex items-center gap-1">
              {[25, 50, 75, 100].map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => {
                    const w = Math.round(selectedImage.naturalWidth * (p / 100));
                    const h = Math.round(selectedImage.naturalHeight * (p / 100));
                    resizeImage(w, h);
                  }}
                >
                  {p}%
                </Button>
              ))}
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Wrap style */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  <WrapText className="w-3 h-3" />
                  Pembungkusan
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => applyImageWrapStyle('inline')}>
                  <Square className="w-4 h-4 mr-2" /> Sejajar Teks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyImageWrapStyle('wrap-left')}>
                  <WrapText className="w-4 h-4 mr-2" /> Mengalir Kiri
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyImageWrapStyle('wrap-right')}>
                  <WrapText className="w-4 h-4 mr-2 scale-x-[-1]" /> Mengalir Kanan
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyImageWrapStyle('behind')}>
                  <Move className="w-4 h-4 mr-2" /> Di Belakang Teks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyImageWrapStyle('infront')}>
                  <Maximize2 className="w-4 h-4 mr-2" /> Di Depan Teks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Rotate controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => rotateImage(-90)}
                title="Putar Kiri 90°"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => rotateImage(90)}
                title="Putar Kanan 90°"
              >
                <RotateCw className="w-3 h-3" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                {Math.round(imageTransform.rotation)}°
              </span>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Flip controls */}
            <div className="flex items-center gap-1">
              <Button
                variant={imageTransform.flipX ? "secondary" : "outline"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => flipImage('x')}
                title="Cermin Horizontal"
              >
                <FlipHorizontal className="w-3 h-3" />
              </Button>
              <Button
                variant={imageTransform.flipY ? "secondary" : "outline"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => flipImage('y')}
                title="Cermin Vertikal"
              >
                <FlipVertical className="w-3 h-3" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Move hint */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Move className="w-3 h-3" />
              Seret sudut untuk resize
            </div>
            
            <div className="flex-1" />
            
            {/* Delete button */}
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={deleteSelectedImage}
            >
              <Trash2 className="w-3 h-3" />
              Hapus
            </Button>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={deselectAll}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Contextual Ribbon for Table */}
      {contextualMode === 'table' && selectedTable && (
        <div className="bg-green-50 border-b border-green-200 p-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs font-medium text-green-700 mr-2">
              <Table className="w-4 h-4" />
              Format Tabel
            </div>
            <Separator orientation="vertical" className="h-8" />
            
            {/* Add rows/columns */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addTableRow('above')}>
                <Plus className="w-3 h-3" /> Baris Atas
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addTableRow('below')}>
                <Plus className="w-3 h-3" /> Baris Bawah
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addTableColumn('left')}>
                <Plus className="w-3 h-3" /> Kolom Kiri
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => addTableColumn('right')}>
                <Plus className="w-3 h-3" /> Kolom Kanan
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Border controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Garis:</span>
              <Input
                type="number"
                min="0"
                max="10"
                value={tableBorderWidth}
                onChange={(e) => setTableBorderWidth(parseInt(e.target.value) || 1)}
                className="w-12 h-7 text-xs"
              />
              <span className="text-xs">px</span>
              
              <Select value={tableBorderStyle} onValueChange={setTableBorderStyle}>
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {borderStyles.map((style) => (
                    <SelectItem key={style} value={style}>{style}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <div className="w-4 h-4 rounded border" style={{ backgroundColor: tableBorderColor }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setTableBorderColor(color)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={applyTableBorder}>
                Terapkan
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-8" />
            
            {/* Opacity */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Opacity:</span>
              <Slider
                value={[tableBorderOpacity]}
                onValueChange={([v]) => setTableBorderOpacity(v)}
                max={100}
                min={10}
                step={10}
                className="w-20"
              />
              <span className="text-xs w-8">{tableBorderOpacity}%</span>
            </div>
            
            <div className="flex-1" />
            
            {/* Delete button */}
            <Button
              variant="destructive"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={deleteSelectedTable}
            >
              <Trash2 className="w-3 h-3" />
              Hapus
            </Button>
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={deselectAll}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

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
            <TabsTrigger value="layout" className="text-xs px-4 py-1.5 rounded-none data-[state=active]:bg-background">
              Tata Letak
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
              <ToolbarButton onClick={() => execCommand('paste')} title="Tempel">
                <Clipboard className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('cut')} title="Potong">
                <Scissors className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('copy')} title="Salin">
                <Copy className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Font */}
            <RibbonGroup title="Font">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-28 justify-between text-xs">
                    {fontFamily.length > 12 ? fontFamily.slice(0, 12) + '...' : fontFamily}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {fontFamilies.map((font) => (
                    <DropdownMenuItem
                      key={font}
                      onClick={() => {
                        setFontFamily(font);
                        execCommand('fontName', font);
                      }}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-14 justify-between text-xs">
                    {fontSize}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-64 overflow-y-auto">
                  {fontSizes.map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => {
                        setFontSize(size);
                        // Use inline style for font size
                        const selection = window.getSelection();
                        if (selection && selection.rangeCount > 0) {
                          execCommand('fontSize', '7');
                          const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
                          fontElements?.forEach(el => {
                            (el as HTMLElement).removeAttribute('size');
                            (el as HTMLElement).style.fontSize = `${size}pt`;
                          });
                        }
                      }}
                    >
                      {size}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-0.5 ml-1">
                <ToolbarButton onClick={() => execCommand('bold')} title="Tebal (Ctrl+B)">
                  <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('italic')} title="Miring (Ctrl+I)">
                  <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('underline')} title="Garis Bawah (Ctrl+U)">
                  <Underline className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('strikeThrough')} title="Coret">
                  <Strikethrough className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('subscript')} title="Subskrip">
                  <Subscript className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => execCommand('superscript')} title="Superskrip">
                  <Superscript className="w-4 h-4" />
                </ToolbarButton>

                {/* Font Color */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Warna Teks">
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
                          onClick={() => execCommand('foreColor', color)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Highlight Color */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Warna Stabilo">
                      <Highlighter className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2">
                    <div className="grid grid-cols-4 gap-1">
                      {highlightColors.map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => execCommand('hiliteColor', color)}
                        />
                      ))}
                      <button
                        className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform bg-white flex items-center justify-center text-xs"
                        onClick={() => execCommand('hiliteColor', 'transparent')}
                      >
                        ✕
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Paragraph */}
            <RibbonGroup title="Paragraf">
              <ToolbarButton onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
                <List className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('insertOrderedList')} title="Numbered List">
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('outdent')} title="Kurangi Inden">
                <Outdent className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('indent')} title="Tambah Inden">
                <Indent className="w-4 h-4" />
              </ToolbarButton>
              <div className="w-px h-6 bg-border mx-0.5" />
              <ToolbarButton onClick={() => execCommand('justifyLeft')} title="Rata Kiri">
                <AlignLeft className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('justifyCenter')} title="Rata Tengah">
                <AlignCenter className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('justifyRight')} title="Rata Kanan">
                <AlignRight className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('justifyFull')} title="Rata Kiri Kanan">
                <AlignJustify className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Styles */}
            <RibbonGroup title="Gaya">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                    <Heading1 className="w-3 h-3" />
                    Heading
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h1')}>
                    <Heading1 className="w-4 h-4 mr-2" /> Heading 1
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h2')}>
                    <Heading2 className="w-4 h-4 mr-2" /> Heading 2
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'h3')}>
                    <Heading3 className="w-4 h-4 mr-2" /> Heading 3
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'p')}>
                    <Type className="w-4 h-4 mr-2" /> Normal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'blockquote')}>
                    <Quote className="w-4 h-4 mr-2" /> Kutipan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => execCommand('formatBlock', 'pre')}>
                    <Code className="w-4 h-4 mr-2" /> Kode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Editing */}
            <RibbonGroup title="Editing">
              <ToolbarButton onClick={() => execCommand('undo')} title="Undo (Ctrl+Z)">
                <Undo className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('redo')} title="Redo (Ctrl+Y)">
                <Redo className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => execCommand('removeFormat')} title="Hapus Format">
                <RotateCcw className="w-4 h-4" />
              </ToolbarButton>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Insert Tab */}
        <TabsContent value="insert" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            {/* Tables */}
            <RibbonGroup title="Tabel">
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={() => setShowTableDialog(true)}
              >
                <Table className="w-6 h-6" />
                <span className="text-[10px]">Tabel</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Illustrations */}
            <RibbonGroup title="Ilustrasi">
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="w-6 h-6" />
                <span className="text-[10px]">Gambar</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={() => setShowImageDialog(true)}
              >
                <Link className="w-6 h-6" />
                <span className="text-[10px]">URL Gambar</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Header & Footer */}
            <RibbonGroup title="Kop & Tanda Tangan">
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={insertLetterhead}
              >
                <FileText className="w-6 h-6" />
                <span className="text-[10px]">Kop Surat</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={insertSignaturePlaceholder}
              >
                <PenTool className="w-6 h-6" />
                <span className="text-[10px]">Tanda Tangan</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            {/* Links & Other */}
            <RibbonGroup title="Tautan">
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={() => setShowLinkDialog(true)}
              >
                <Link className="w-6 h-6" />
                <span className="text-[10px]">Hyperlink</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={insertHorizontalLine}
              >
                <Minus className="w-6 h-6" />
                <span className="text-[10px]">Garis</span>
              </Button>
            </RibbonGroup>
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="m-0">
          <div className="bg-muted/50 border-b p-2 flex items-end gap-3 flex-wrap">
            <RibbonGroup title="Pengaturan Halaman">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 flex-col gap-1">
                    <LayoutGrid className="w-6 h-6" />
                    <span className="text-[10px]">Margin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Normal (2.54 cm semua sisi)</DropdownMenuItem>
                  <DropdownMenuItem>Sempit (1.27 cm semua sisi)</DropdownMenuItem>
                  <DropdownMenuItem>Lebar (2.54 cm atas/bawah, 5.08 cm kiri/kanan)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 flex-col gap-1">
                    <FileText className="w-6 h-6" />
                    <span className="text-[10px]">Orientasi</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Portrait</DropdownMenuItem>
                  <DropdownMenuItem>Landscape</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 flex-col gap-1">
                    <Settings2 className="w-6 h-6" />
                    <span className="text-[10px]">Ukuran</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>A4 (21 x 29.7 cm)</DropdownMenuItem>
                  <DropdownMenuItem>Letter (21.59 x 27.94 cm)</DropdownMenuItem>
                  <DropdownMenuItem>Legal (21.59 x 35.56 cm)</DropdownMenuItem>
                  <DropdownMenuItem>F4/Folio (21.59 x 33.02 cm)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 flex-col gap-1">
                    <Columns className="w-6 h-6" />
                    <span className="text-[10px]">Kolom</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Satu</DropdownMenuItem>
                  <DropdownMenuItem>Dua</DropdownMenuItem>
                  <DropdownMenuItem>Tiga</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Latar Belakang">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 flex-col gap-1">
                    <PaintBucket className="w-6 h-6" />
                    <span className="text-[10px]">Warna Halaman</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="grid grid-cols-10 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          if (editorRef.current) {
                            editorRef.current.style.backgroundColor = color;
                          }
                        }}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
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
                    Klik placeholder untuk menyisipkan ke dokumen. Placeholder akan diganti dengan data responden.
                  </p>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {fields.map((field) => (
                      <Button
                        key={field.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs font-mono h-8"
                        onClick={() => insertPlaceholder(field.name)}
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

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Ganti Teks">
              <Button
                variant="outline"
                size="sm"
                className="h-12 flex-col gap-1"
                onClick={openReplaceDialog}
                title="Seleksi teks terlebih dahulu, lalu klik tombol ini"
              >
                <Replace className="w-6 h-6" />
                <span className="text-[10px]">Ganti ke Placeholder</span>
              </Button>
            </RibbonGroup>

            <Separator orientation="vertical" className="h-12" />

            <RibbonGroup title="Bantuan">
              <div className="text-xs text-muted-foreground max-w-md">
                <p><strong>Cara pakai:</strong> Seleksi teks yang ingin diganti, lalu klik "Ganti ke Placeholder" untuk mengubahnya menjadi placeholder field.</p>
              </div>
            </RibbonGroup>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ruler */}
      <div className="bg-white border-b px-4 py-1" ref={rulerRef}>
        <div 
          className="relative h-6 mx-auto max-w-[210mm] bg-gradient-to-b from-gray-100 to-gray-50 border border-gray-300 rounded-sm overflow-visible cursor-crosshair"
          onClick={handleRulerClick}
          title="Klik untuk menambah tab stop"
        >
          {/* Ruler markings */}
          <div className="absolute inset-0 flex items-end pointer-events-none">
            {Array.from({ length: 22 }).map((_, i) => (
              <div key={i} className="flex-1 relative h-full border-r border-gray-300">
                <span className="absolute -top-0.5 left-0 text-[8px] text-gray-500 font-mono">{i}</span>
                {/* Half marks */}
                <div className="absolute bottom-0 left-1/2 w-px h-2 bg-gray-400" />
              </div>
            ))}
          </div>
          
          {/* Tab stop markers */}
          {tabStops.map((pos) => {
            let clickTimeout: NodeJS.Timeout | null = null;
            let hasMoved = false;
            
            return (
              <div
                key={pos}
                data-marker="tabstop"
                className="absolute top-0 cursor-ew-resize z-30 group"
                style={{ left: `${(pos / 210) * 100}%`, transform: 'translateX(-4px)' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  hasMoved = false;
                  
                  const ruler = rulerRef.current;
                  if (!ruler) return;
                  const rect = ruler.getBoundingClientRect();
                  const startX = e.clientX;
                  
                  const handleMove = (moveEvent: MouseEvent) => {
                    const deltaX = Math.abs(moveEvent.clientX - startX);
                    if (deltaX > 3) {
                      hasMoved = true;
                      if (clickTimeout) {
                        clearTimeout(clickTimeout);
                        clickTimeout = null;
                      }
                    }
                    const x = moveEvent.clientX - rect.left;
                    const newPos = Math.round((x / rect.width) * 210);
                    moveTabStop(pos, newPos);
                  };
                  
                  const handleUp = (upEvent: MouseEvent) => {
                    document.removeEventListener('mousemove', handleMove);
                    document.removeEventListener('mouseup', handleUp);
                    
                    // Only handle click logic if mouse didn't move
                    if (!hasMoved) {
                      if (clickTimeout) {
                        // This is a double click - remove tab stop
                        clearTimeout(clickTimeout);
                        clickTimeout = null;
                        removeTabStop(pos);
                      } else {
                        // Start single click timer
                        clickTimeout = setTimeout(() => {
                          clickTimeout = null;
                          // Single click - do nothing (just selection)
                        }, 250);
                      }
                    }
                  };
                  
                  document.addEventListener('mousemove', handleMove);
                  document.addEventListener('mouseup', handleUp);
                }}
                title={`Tab Stop: ${pos}mm (drag untuk pindah, double-click untuk hapus)`}
              >
                {/* Tab stop icon (L-shaped like MS Word) */}
                <div className="w-2 h-full flex flex-col items-center">
                  <div className="w-2 h-2 bg-gray-700 group-hover:bg-blue-600 transition-colors" style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% 30%, 30% 30%, 30% 100%, 0 100%)'
                  }} />
                  <div className="w-0.5 h-3 bg-gray-500 group-hover:bg-blue-500 transition-colors" />
                </div>
              </div>
            );
          })}
          
          {/* Left margin marker */}
          <div 
            data-marker="margin"
            className="absolute top-0 h-full w-2 bg-blue-500/30 border-r-2 border-blue-500 cursor-ew-resize z-10 hover:bg-blue-500/50 transition-colors"
            style={{ left: `${(leftMargin / 210) * 100}%` }}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const ruler = rulerRef.current;
              if (!ruler) return;
              const rect = ruler.getBoundingClientRect();
              const handleMove = (moveEvent: MouseEvent) => {
                const x = moveEvent.clientX - rect.left;
                const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                const newMargin = Math.round((percent / 100) * 210);
                if (newMargin < 210 - rightMargin - 20) {
                  setLeftMargin(newMargin);
                }
              };
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };
              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
            title={`Margin Kiri: ${leftMargin}mm`}
          />
          
          {/* Left indent marker */}
          <div 
            data-marker="indent"
            className="absolute bottom-0 w-0 h-0 cursor-ew-resize z-20"
            style={{ 
              left: `${((leftMargin + leftIndent) / 210) * 100}%`,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: '8px solid #059669',
              transform: 'translateX(-6px)'
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const ruler = rulerRef.current;
              if (!ruler) return;
              const rect = ruler.getBoundingClientRect();
              const handleMove = (moveEvent: MouseEvent) => {
                const x = moveEvent.clientX - rect.left;
                const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                const pos = Math.round((percent / 100) * 210);
                const newIndent = Math.max(0, pos - leftMargin);
                setLeftIndent(Math.min(newIndent, 50));
              };
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };
              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
            title={`Inden Kiri: ${leftIndent}mm`}
          />
          
          {/* Right margin marker */}
          <div 
            data-marker="margin"
            className="absolute top-0 h-full w-2 bg-blue-500/30 border-l-2 border-blue-500 cursor-ew-resize z-10 hover:bg-blue-500/50 transition-colors"
            style={{ right: `${(rightMargin / 210) * 100}%` }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const ruler = rulerRef.current;
              if (!ruler) return;
              const rect = ruler.getBoundingClientRect();
              const handleMove = (moveEvent: MouseEvent) => {
                const x = rect.right - moveEvent.clientX;
                const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
                const newMargin = Math.round((percent / 100) * 210);
                if (newMargin < 210 - leftMargin - 20) {
                  setRightMargin(newMargin);
                }
              };
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
              };
              document.addEventListener('mousemove', handleMove);
              document.addEventListener('mouseup', handleUp);
            }}
            title={`Margin Kanan: ${rightMargin}mm`}
          />
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-0.5">
          Margin: Kiri {leftMargin}mm | Kanan {rightMargin}mm | Inden: {leftIndent}mm
          {tabStops.length > 0 && ` | Tab Stops: ${tabStops.join(', ')}mm`}
        </div>
      </div>

      {/* Editor area - looks like a document */}
      <div className="bg-gray-100 p-8 flex-1 overflow-auto relative" ref={editorContainerRef}>
        <div
          ref={editorRef}
          contentEditable
          className="bg-white shadow-lg mx-auto min-h-[700px] max-w-[210mm] focus:outline-none relative"
          style={{
            fontFamily: fontFamily,
            fontSize: `${fontSize}pt`,
            lineHeight: '1.6',
            paddingLeft: `${leftMargin + leftIndent}mm`,
            paddingRight: `${rightMargin + rightIndent}mm`,
            paddingTop: '48px',
            paddingBottom: '48px',
          }}
          onInput={handleChange}
          onClick={handleEditorClick}
          dangerouslySetInnerHTML={{ __html: content }}
          onKeyDown={(e) => {
            // Handle Tab key
            if (e.key === 'Tab') {
              e.preventDefault();
              insertTab();
              return;
            }
            if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              execCommand('bold');
            }
            if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              execCommand('italic');
            }
            if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              execCommand('underline');
            }
            if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              execCommand('undo');
            }
            if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              execCommand('redo');
            }
          }}
        />
        
        {/* Image resize/rotate handles overlay */}
        {selectedImage && contextualMode === 'image' && (
          <ImageResizeHandles 
            image={selectedImage}
            imageTransform={imageTransform}
            onMouseDown={handleImageMouseDown}
            isRotating={isRotating}
          />
        )}
      </div>

      {/* Table Dialog */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sisipkan Tabel</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Jumlah Baris</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Jumlah Kolom</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
              />
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
          <div className="space-y-2 py-4">
            <Label>URL Gambar</Label>
            <Input
              placeholder="https://example.com/gambar.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>Batal</Button>
            <Button onClick={() => insertImage()}>Sisipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sisipkan Hyperlink</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Teks yang Ditampilkan</Label>
              <Input
                placeholder="Klik di sini"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Batal</Button>
            <Button onClick={insertLink}>Sisipkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace with Placeholder Dialog */}
      <Dialog open={showReplaceDialog} onOpenChange={(open) => {
        if (!open) {
          setShowReplaceDialog(false);
          setSelectedText('');
          setSavedSelection(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ganti Teks dengan Placeholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <Label className="text-xs text-muted-foreground">Teks yang akan diganti:</Label>
              <p className="mt-1 font-medium text-foreground break-words">"{selectedText}"</p>
            </div>
            <div className="space-y-2">
              <Label>Pilih Field Placeholder:</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                {fields.map((field) => (
                  <Button
                    key={field.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs h-10 hover:bg-primary/10"
                    onClick={() => replaceWithPlaceholder(field.name)}
                  >
                    <Braces className="w-4 h-4 mr-2 text-primary" />
                    <div className="flex flex-col items-start">
                      <span className="font-mono">{`{{${field.name}}}`}</span>
                      <span className="text-muted-foreground font-sans text-[10px]">{field.label}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReplaceDialog(false);
              setSelectedText('');
              setSavedSelection(null);
            }}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
