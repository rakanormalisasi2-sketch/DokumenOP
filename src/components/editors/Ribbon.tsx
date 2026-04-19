
import React, { useState, useEffect } from 'react';
import {
    Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered,
    Image as ImageIcon, Table as TableIcon, Link as LinkIcon,
    Undo, Redo,
    Type, Palette, Highlighter,
    LayoutTemplate, Settings,
    Maximize, Minimize,
    Grid3X3, SplitSquareHorizontal,
    Trash2, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
    WrapText, Crop,
    Columns, FileText, Printer, Search, Scissors, Copy, MousePointer2,
    Check, ChevronDown,
    FlipHorizontal, FlipVertical,
    PenTool, BookOpen, Quote, Languages, MessageSquare, SpellCheck, HelpCircle,
    IndentIncrease, IndentDecrease, Baseline,
    Heading1, Heading2, Verified, PaintBucket, Brush, Replace,
    Square, Circle, BoxSelect,
    BringToFront, SendToBack, Lock, Unlock, Move
} from 'lucide-react';
// Using PaintBucket as placeholder for Format Painter, or we can use Brush
const PaintRollerIcon = Brush;
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RibbonProps {
    editor: any;
    onInsertVariable: () => void;
    isEditMode: boolean;
    onPageSetupChange: (type: 'margin' | 'size' | 'orientation' | 'columns', value: any) => void;
    onPageSetupClick: () => void;
    showRuler: boolean;
    onToggleRuler: () => void;
    showGridlines: boolean;
    onToggleGridlines: () => void;
    onToggleFormatPainter: () => void;
    isFormatPainterActive: boolean;
    onChangeFontSize: (delta: number) => void;
    onFocusArea: (area: 'header' | 'footer') => void;
}

export function Ribbon({
    editor,
    onInsertVariable,
    isEditMode,
    onPageSetupChange,
    onPageSetupClick,
    showRuler,
    onToggleRuler,
    showGridlines,
    onToggleGridlines,
    onToggleFormatPainter,
    isFormatPainterActive,
    onChangeFontSize,
    onFocusArea
}: RibbonProps) {
    const [context, setContext] = useState<'table' | 'image' | null>(null);
    const [activeTab, setActiveTab] = useState('home');

    // Sync with editor state
    useEffect(() => {
        if (!editor) return;

        const handleNodeChange = (e: any) => {
            const nodeName = e.element.nodeName;
            if (nodeName === 'TABLE' || e.element.closest('table')) {
                setContext('table');
                // Optional: Auto-switch logic could go here
            } else if (nodeName === 'IMG') {
                setContext('image');
                if (activeTab !== 'image_format') setActiveTab('image_format');
            } else {
                setContext(null);
                if (['table_design', 'table_layout', 'image_format'].includes(activeTab)) {
                    setActiveTab('home');
                }
            }
        };

        editor.on('NodeChange', handleNodeChange);
        return () => {
            editor.off('NodeChange', handleNodeChange);
        };
    }, [editor, activeTab]);

    const exec = (cmd: string, ui: boolean = false, value?: any) => {
        if (editor) {
            editor.focus(); // Ensure editor has focus before executing command
            editor.execCommand(cmd, ui, value);
        }
    };

    // Direct DOM alignment helper - handles multi-paragraph selection
    const setAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
        if (!editor) return;
        editor.focus();

        // Get the selection range
        const rng = editor.selection.getRng();
        const startNode = rng.startContainer;
        const endNode = rng.endContainer;

        // Helper to find block parent
        const getBlockParent = (node: Node): HTMLElement | null => {
            let current: Node | null = node;
            while (current && current.nodeName !== 'BODY') {
                if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH'].includes(current.nodeName)) {
                    return current as HTMLElement;
                }
                current = current.parentNode;
            }
            return null;
        };

        const startBlock = getBlockParent(startNode);
        const endBlock = getBlockParent(endNode);

        if (!startBlock) return;

        // Collect all block elements in selection
        const blocksToAlign: HTMLElement[] = [];
        const body = editor.getBody();

        // If same block, just align that one
        if (startBlock === endBlock) {
            blocksToAlign.push(startBlock);
        } else {
            // Traverse siblings from startBlock to endBlock
            let current: Node | null = startBlock;
            while (current) {
                if (['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH'].includes(current.nodeName)) {
                    blocksToAlign.push(current as HTMLElement);
                }
                if (current === endBlock) break;
                current = current.nextSibling;
            }
        }

        // Apply alignment to all blocks
        blocksToAlign.forEach(block => {
            editor.dom.setStyle(block, 'text-align', alignment);
        });

        editor.undoManager.add(); // Add to undo stack
    };

    if (!isEditMode) return null;

    return (
        <div className="w-full bg-[#f3f4f6] border-b border-[#e5e7eb] flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                <div className="px-2 bg-white border-b flex items-end">
                    <TabsList className="bg-transparent h-9 p-0 gap-0 w-full justify-start overflow-x-auto no-scrollbar">
                        <TabsTrigger value="file" className="data-[state=active]:bg-[#2b579a] data-[state=active]:text-white px-5 rounded-t-lg rounded-b-none border-t border-x border-transparent">Berkas</TabsTrigger>
                        <TabsTrigger value="home" className="data-[state=active]:bg-[#f3f4f6] data-[state=active]:border-b-transparent rounded-t-lg rounded-b-none border border-transparent px-4">Beranda</TabsTrigger>
                        <TabsTrigger value="insert" className="data-[state=active]:bg-[#f3f4f6] data-[state=active]:border-b-transparent rounded-t-lg rounded-b-none border border-transparent px-4">Sisipkan</TabsTrigger>
                        <TabsTrigger value="layout" className="data-[state=active]:bg-[#f3f4f6] data-[state=active]:border-b-transparent rounded-t-lg rounded-b-none border border-transparent px-4">Tata Letak</TabsTrigger>
                        <TabsTrigger value="mailings" className="data-[state=active]:bg-[#f3f4f6] data-[state=active]:border-b-transparent rounded-t-lg rounded-b-none border border-transparent px-4">Surat</TabsTrigger>
                        <TabsTrigger value="review" className="data-[state=active]:bg-[#f3f4f6] data-[state=active]:border-b-transparent rounded-t-lg rounded-b-none border border-transparent px-4">Tinjau</TabsTrigger>
                        <TabsTrigger value="view" className="data-[state=active]:bg-[#f3f4f6] data-[state=active]:border-b-transparent rounded-t-lg rounded-b-none border border-transparent px-4">Tampilan</TabsTrigger>
                        <TabsTrigger value="help" className="data-[state=active]:bg-[#f3f4f6] data-[state=active]:border-b-transparent rounded-t-lg rounded-b-none border border-transparent px-4">Bantuan</TabsTrigger>

                        {/* Contextual Tabs */}
                        {context === 'table' && (
                            <>
                                <div className="w-px h-6 bg-gray-300 mx-2 self-center" />
                                <TabsTrigger value="table_design" className="bg-yellow-100/50 data-[state=active]:bg-yellow-100 data-[state=active]:border-b-transparent border-t-2 border-t-yellow-500 text-yellow-700 px-4 rounded-t-lg rounded-b-none">Desain Tabel</TabsTrigger>
                                <TabsTrigger value="table_layout" className="bg-yellow-100/50 data-[state=active]:bg-yellow-100 data-[state=active]:border-b-transparent border-t-2 border-t-yellow-500 text-yellow-700 px-4 rounded-t-lg rounded-b-none">Tata Letak Tabel</TabsTrigger>
                            </>
                        )}
                        {context === 'image' && (
                            <>
                                <div className="w-px h-6 bg-gray-300 mx-2 self-center" />
                                <TabsTrigger value="image_format" className="bg-pink-100/50 data-[state=active]:bg-pink-100 data-[state=active]:border-b-transparent border-t-2 border-t-pink-500 text-pink-700 px-4 rounded-t-lg rounded-b-none">Format Gambar</TabsTrigger>
                            </>
                        )}
                    </TabsList>
                </div>

                <div className="min-h-[130px] h-auto bg-[#f3f4f6] p-1 flex items-center">
                    {/* HOME TAB */}
                    {activeTab === 'home' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100">
                            {/* Clipboard */}
                            <RibbonGroup label="Papan Klip">
                                <RibbonButton icon={Undo} label="Urungkan" onClick={() => exec('Undo')} />
                                <RibbonButton icon={Redo} label="Ulangi" onClick={() => exec('Redo')} />
                                <div className="flex flex-col justify-center">
                                    <RibbonButton icon={Copy} label="Salin" onClick={() => exec('Copy')} variant="small" />
                                    <RibbonButton icon={Scissors} label="Potong" onClick={() => exec('Cut')} variant="small" />
                                    <RibbonButton
                                        icon={PaintRollerIcon}
                                        label="Pewarna Format"
                                        onClick={onToggleFormatPainter}
                                        variant="small"
                                        className={cn(isFormatPainterActive && "bg-gray-300")}
                                    />
                                </div>
                            </RibbonGroup>

                            <RibbonGroup label="Font">
                                <div className="flex flex-col gap-1 justify-center h-full pb-6">
                                    <div className="flex gap-1">
                                        <select className="h-6 w-32 text-xs border rounded px-1" onChange={(e) => exec('FontName', false, e.target.value)}>
                                            <option value="Arial">Arial</option>
                                            <option value="Times New Roman">Times New Roman</option>
                                            <option value="Courier New">Courier New</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Verdana">Verdana</option>
                                        </select>
                                        <select className="h-6 w-14 text-xs border rounded px-1" onChange={(e) => exec('FontSize', false, e.target.value)}>
                                            {[8, 9, 10, 11, 12, 14, 16, 18, 24, 36, 48, 72].map(s => <option key={s} value={`${s}pt`}>{s}</option>)}
                                        </select>
                                        <RibbonIconButton icon={ArrowUp} onClick={() => onChangeFontSize(1)} title="Perbesar Font" />
                                        <RibbonIconButton icon={ArrowDown} onClick={() => onChangeFontSize(-1)} title="Perkecil Font" />
                                    </div>
                                    <div className="flex gap-0.5">
                                        <RibbonIconButton icon={Bold} onClick={() => exec('Bold')} title="Tebal" />
                                        <RibbonIconButton icon={Italic} onClick={() => exec('Italic')} title="Miring" />
                                        <RibbonIconButton icon={Underline} onClick={() => exec('Underline')} title="Garis Bawah" />
                                        <RibbonIconButton icon={Strikethrough} onClick={() => exec('Strikethrough')} title="Coret" />
                                        <RibbonIconButton icon={Subscript} onClick={() => exec('Subscript')} title="Subskrip" />
                                        <RibbonIconButton icon={Superscript} onClick={() => exec('Superscript')} title="Superskrip" />
                                        <div className="w-px h-4 bg-gray-300 mx-1" />
                                        <RibbonIconButton icon={Highlighter} onClick={() => exec('HiliteColor', false, 'yellow')} title="Sorotan" className="text-yellow-500" />
                                        <RibbonIconButton icon={Palette} onClick={() => exec('ForeColor', false, 'red')} title="Warna Font" className="text-red-500" />
                                    </div>
                                </div>
                            </RibbonGroup>

                            {/* Paragraph */}
                            <RibbonGroup label="Paragraf">
                                <div className="flex flex-col gap-1 h-full justify-center pb-6">
                                    <div className="flex gap-0.5">
                                        <RibbonIconButton icon={List} onClick={() => exec('InsertUnorderedList')} title="Daftar Simbol" />
                                        <RibbonIconButton icon={ListOrdered} onClick={() => exec('InsertOrderedList')} title="Daftar Angka" />
                                        <RibbonIconButton icon={IndentDecrease} onClick={() => exec('Outdent')} title="Kurangi Identasi" />
                                        <RibbonIconButton icon={IndentIncrease} onClick={() => exec('Indent')} title="Tambah Identasi" />
                                    </div>
                                    <div className="flex gap-0.5">
                                        <RibbonIconButton icon={AlignLeft} onClick={() => setAlign('left')} title="Rata Kiri" />
                                        <RibbonIconButton icon={AlignCenter} onClick={() => setAlign('center')} title="Rata Tengah" />
                                        <RibbonIconButton icon={AlignRight} onClick={() => setAlign('right')} title="Rata Kanan" />
                                        <RibbonIconButton icon={AlignJustify} onClick={() => setAlign('justify')} title="Rata Kiri Kanan" />
                                        <div className="w-px h-4 bg-gray-300 mx-1" />

                                        <DropdownMenu onOpenChange={(open) => {
                                            if (open && editor) {
                                                // Force update to check current selection margins
                                                // We can use a local state or just existing state update mechanism if available.
                                                // Since we don't have a granular state for this, we can rely on standard React re-render 
                                                // or use a small state here if needed.
                                                // Let's use a ref or state in Ribbon to track "menuOpen" to trigger re-render?
                                                // Actually, selection node is available. We can just read it during render if we force update.
                                                // But DropdownContent re-renders when opened.
                                            }
                                        }}>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-1 hover:bg-gray-200 rounded transition-colors" title="Spasi Baris dan Paragraf">
                                                    <Baseline className="w-4 h-4 text-gray-700" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="w-64">
                                                {[1.0, 1.15, 1.5, 2.0, 2.5, 3.0].map(val => (
                                                    <DropdownMenuItem key={val} onClick={() => {
                                                        if (editor) {
                                                            const blocks = editor.selection.getSelectedBlocks();
                                                            blocks.forEach((block: any) => {
                                                                editor.dom.setStyle(block, 'line-height', val);
                                                            });
                                                        }
                                                    }}>
                                                        {val}
                                                    </DropdownMenuItem>
                                                ))}
                                                <div className="h-px bg-gray-200 my-1" />
                                                {/* Dynamic Spacing Options */}
                                                {(() => {
                                                    // Get all selected blocks to determine state
                                                    const blocks = editor?.selection?.getSelectedBlocks() || [];

                                                    // Check if ANY block has margin-top > 0
                                                    let hasSpaceBefore = false;
                                                    for (const block of blocks) {
                                                        if (parseInt(editor.dom.getStyle(block, 'margin-top') || '0') > 0) {
                                                            hasSpaceBefore = true;
                                                            break;
                                                        }
                                                    }

                                                    // Check if ANY block has margin-bottom > 0
                                                    let hasSpaceAfter = false;
                                                    for (const block of blocks) {
                                                        if (parseInt(editor.dom.getStyle(block, 'margin-bottom') || '0') > 0) {
                                                            hasSpaceAfter = true;
                                                            break;
                                                        }
                                                    }

                                                    return (
                                                        <>
                                                            <DropdownMenuItem onClick={() => {
                                                                if (editor) {
                                                                    const blocks = editor.selection.getSelectedBlocks();
                                                                    blocks.forEach((block: any) => {
                                                                        editor.dom.setStyle(block, 'margin-top', hasSpaceBefore ? '0' : '12pt');
                                                                    });
                                                                }
                                                            }}>
                                                                {hasSpaceBefore ? 'Hapus Spasi Sebelum Paragraf' : 'Tambah Spasi Sebelum Paragraf'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => {
                                                                if (editor) {
                                                                    const blocks = editor.selection.getSelectedBlocks();
                                                                    blocks.forEach((block: any) => {
                                                                        editor.dom.setStyle(block, 'margin-bottom', hasSpaceAfter ? '0' : '12pt');
                                                                    });
                                                                }
                                                            }}>
                                                                {hasSpaceAfter ? 'Hapus Spasi Setelah Paragraf' : 'Tambah Spasi Setelah Paragraf'}
                                                            </DropdownMenuItem>
                                                        </>
                                                    );
                                                })()}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </RibbonGroup>

                            {/* Styles */}
                            <RibbonGroup label="Gaya">
                                <div className="flex gap-1 items-center">
                                    <RibbonButton icon={Type} label="Normal" onClick={() => exec('FormatBlock', false, 'p')} variant="small" className="w-20" />
                                    <RibbonButton icon={Heading1} label="Judul 1" onClick={() => exec('FormatBlock', false, 'h1')} variant="small" className="w-20" />
                                    <RibbonButton icon={Heading2} label="Judul 2" onClick={() => exec('FormatBlock', false, 'h2')} variant="small" className="w-20" />
                                </div>
                            </RibbonGroup>

                            {/* Editing */}
                            <RibbonGroup label="Sunting">
                                <div className="flex flex-col gap-1 h-full justify-center pb-6">
                                    <RibbonButton icon={Search} label="Cari" onClick={() => exec('SearchReplace')} variant="small" />
                                    <RibbonButton icon={Replace} label="Ganti" onClick={() => exec('SearchReplace')} variant="small" />
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-200 rounded-sm w-full text-left transition-colors">
                                                <MousePointer2 className="w-3 h-3" />
                                                <span>Pilih</span>
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => exec('SelectAll')}>Pilih Semua</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                                if (editor) {
                                                    editor.dom.toggleClass(editor.getBody(), 'select-mode');
                                                }
                                            }}>
                                                Mode Seleksi Objek (Toggle)
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </RibbonGroup>
                        </div>
                    )}

                    {/* INSERT TAB */}
                    {activeTab === 'insert' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100">
                            <RibbonGroup label="Halaman">
                                <RibbonButton icon={FileText} label="Hal. Kosong" onClick={() => exec('mcePageBreak')} />
                            </RibbonGroup>
                            <RibbonGroup label="Tabel">
                                <RibbonButton icon={TableIcon} label="Tabel" onClick={() => exec('mceInsertTable')} />
                            </RibbonGroup>
                            <RibbonGroup label="Ilustrasi">
                                <RibbonButton icon={ImageIcon} label="Gambar" onClick={() => exec('mceImage')} />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex flex-col items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors min-w-[50px] h-[56px] gap-1">
                                            <Square className="w-5 h-5 text-gray-700" />
                                            <span className="text-[10px] leading-tight font-medium text-gray-600">Bentuk</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => {
                                            if (editor) editor.insertContent('<div class="floating-object" style="position: absolute; left: 50px; top: 50px; width: 100px; height: 100px; background-color: #3b82f6; border: 1px solid #2563eb; z-index: 1;"></div>');
                                        }}>
                                            <Square className="w-4 h-4 mr-2" /> Kotak (Rectangle)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            if (editor) editor.insertContent('<div class="floating-object" style="position: absolute; left: 50px; top: 50px; width: 100px; height: 100px; background-color: #ef4444; border: 1px solid #dc2626; border-radius: 50%; z-index: 1;"></div>');
                                        }}>
                                            <Circle className="w-4 h-4 mr-2" /> Lingkaran (Circle)
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <RibbonButton icon={BoxSelect} label="Kotak Teks" onClick={() => {
                                    if (editor) editor.insertContent('<div class="floating-object" style="position: absolute; left: 100px; top: 100px; width: 200px; height: 100px; border: 1px solid #000; background-color: #fff; padding: 10px; z-index: 10; overflow: hidden;" contenteditable="true">Ketik teks di sini...</div>');
                                }} />
                            </RibbonGroup>
                            <RibbonGroup label="Tautan">
                                <RibbonButton icon={LinkIcon} label="Tautan" onClick={() => exec('mceLink')} />
                                <RibbonButton icon={BookOpen} label="Penanda" onClick={() => exec('mceAnchor')} />
                            </RibbonGroup>
                            <RibbonGroup label="Header & Footer">
                                <RibbonButton icon={FileText} label="Header" onClick={() => onFocusArea('header')} />
                                <RibbonButton icon={FileText} label="Footer" onClick={() => onFocusArea('footer')} />
                            </RibbonGroup>
                        </div>
                    )}


                    {/* LAYOUT TAB */}
                    {activeTab === 'layout' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100">
                            <RibbonGroup label="Pengaturan Halaman">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex flex-col items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors min-w-[50px] h-[56px] gap-1">
                                            <LayoutTemplate className="w-5 h-5 text-purple-600" />
                                            <span className="text-[10px] leading-tight font-medium text-gray-600">Margin</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => onPageSetupChange('margin', '1.27cm')}>Sempit (1.27cm)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onPageSetupChange('margin', '2.54cm')}>Normal (2.54cm)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onPageSetupChange('margin', '5.08cm')}>Lebar (5.08cm)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex flex-col items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors min-w-[50px] h-[56px] gap-1">
                                            <FlipVertical className="w-5 h-5 text-purple-600" />
                                            <span className="text-[10px] leading-tight font-medium text-gray-600">Orientasi</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => onPageSetupChange('orientation', 'portrait')}>Potret</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onPageSetupChange('orientation', 'landscape')}>Lanskap</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex flex-col items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors min-w-[50px] h-[56px] gap-1">
                                            <Columns className="w-5 h-5 text-purple-600" />
                                            <span className="text-[10px] leading-tight font-medium text-gray-600">Ukuran</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => onPageSetupChange('size', { width: '21cm', height: '29.7cm' })}>A4 (21 x 29.7 cm)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onPageSetupChange('size', { width: '21.59cm', height: '27.94cm' })}>Letter (21.59 x 27.94 cm)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onPageSetupChange('size', { width: '21.59cm', height: '35.56cm' })}>Legal (21.59 x 35.56 cm)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <RibbonButton icon={Settings} label="Lengkap" onClick={onPageSetupClick} />
                            </RibbonGroup>
                        </div>
                    )}

                    {/* MAILINGS TAB */}
                    {activeTab === 'mailings' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100">
                            <RibbonGroup label="Sisipkan Bidang">
                                <RibbonButton icon={Plus} label="Variabel" onClick={onInsertVariable} />
                            </RibbonGroup>
                            <RibbonGroup label="Pratinjau">
                                <RibbonButton icon={Search} label="Pratinjau Hasil" onClick={() => { }} />
                            </RibbonGroup>
                        </div>
                    )}

                    {/* REVIEW TAB */}
                    {activeTab === 'review' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100">
                            <RibbonGroup label="Pemeriksaan">
                                <RibbonButton icon={SpellCheck} label="Ejaan" onClick={() => exec('mceSpellCheck')} />
                                <RibbonButton icon={Verified} label="Jumlah Kata" onClick={() => exec('mceWordCount')} />
                            </RibbonGroup>
                            <RibbonGroup label="Komentar">
                                <RibbonButton icon={MessageSquare} label="Komentar Baru" onClick={() => { }} />
                            </RibbonGroup>
                            <RibbonGroup label="Bahasa">
                                <RibbonButton icon={Languages} label="Terjemahkan" onClick={() => { }} />
                            </RibbonGroup>
                        </div>
                    )}

                    {/* VIEW TAB */}
                    {activeTab === 'view' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100">
                            <RibbonGroup label="Tampilan">
                                {/* Fullscreen toggle handled in parent usually, but we can trigger exec */}
                                <RibbonButton icon={Maximize} label="Layar Penuh" onClick={() => exec('mceFullScreen')} />
                            </RibbonGroup>
                            <RibbonGroup label="Tampilkan">
                                <div className="flex flex-col gap-2 p-1 justify-center h-full pb-6">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="ruler" checked={showRuler} onChange={onToggleRuler} />
                                        <label htmlFor="ruler" className="text-xs">Penggaris</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="gridlines" checked={showGridlines} onChange={onToggleGridlines} />
                                        <label htmlFor="gridlines" className="text-xs">Garis Kisi</label>
                                    </div>
                                </div>
                            </RibbonGroup>
                        </div>
                    )}

                    {/* HELP TAB */}
                    {activeTab === 'help' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100">
                            <RibbonGroup label="Bantuan">
                                <RibbonButton icon={HelpCircle} label="Bantuan" onClick={() => exec('mceHelp')} />
                            </RibbonGroup>
                        </div>
                    )}

                    {/* --- CONTEXT TABS --- */}

                    {/* TABLE DESIGN */}
                    {activeTab === 'table_design' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100" style={{ backgroundColor: '#fff9c4' }}>
                            <RibbonGroup label="Opsi Gaya Tabel">
                                <div className="flex flex-col text-[10px] justify-center h-full pb-6 gap-1">
                                    <label className="flex gap-1 items-center"><input type="checkbox" defaultChecked /> Baris Header</label>
                                    <label className="flex gap-1 items-center"><input type="checkbox" defaultChecked /> Baris Belang</label>
                                    <label className="flex gap-1 items-center"><input type="checkbox" /> Kolom Pertama</label>
                                </div>
                            </RibbonGroup>
                            <RibbonGroup label="Batas">
                                <RibbonButton icon={Grid3X3} label="Batas" onClick={() => exec('mceTableProps')} />
                            </RibbonGroup>
                            <RibbonGroup label="Bayangan">
                                <RibbonButton icon={Palette} label="Bayangan" onClick={() => exec('mceTableProps')} />
                            </RibbonGroup>
                        </div>
                    )}

                    {/* TABLE LAYOUT */}
                    {activeTab === 'table_layout' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100" style={{ backgroundColor: '#fff9c4' }}>
                            <RibbonGroup label="Baris & Kolom">
                                <div className="grid grid-cols-2 gap-1">
                                    <RibbonIconButton icon={ArrowUp} onClick={() => exec('mceTableInsertRowBefore')} title="Sisipkan Atas" />
                                    <RibbonIconButton icon={ArrowDown} onClick={() => exec('mceTableInsertRowAfter')} title="Sisipkan Bawah" />
                                    <RibbonIconButton icon={ArrowLeft} onClick={() => exec('mceTableInsertColBefore')} title="Sisipkan Kiri" />
                                    <RibbonIconButton icon={ArrowRight} onClick={() => exec('mceTableInsertColAfter')} title="Sisipkan Kanan" />
                                </div>
                                <div className="flex flex-col gap-1 ml-1">
                                    <RibbonButton icon={Trash2} label="Hapus" onClick={() => exec('mceTableDelete')} variant="small" className="text-red-600 hover:text-red-700 hover:bg-red-50" />
                                </div>
                            </RibbonGroup>
                            <RibbonGroup label="Gabung">
                                <RibbonButton icon={SplitSquareHorizontal} label="Gabung" onClick={() => exec('mceTableMergeCells')} variant="small" />
                                <RibbonButton icon={Grid3X3} label="Pisah" onClick={() => exec('mceTableSplitCells')} variant="small" />
                            </RibbonGroup>
                        </div>
                    )}

                    {/* PICTURE FORMAT */}
                    {activeTab === 'image_format' && (
                        <div className="flex flex-nowrap h-full w-full gap-0 justify-start px-0 items-stretch animate-in fade-in zoom-in-95 duration-100" style={{ backgroundColor: '#fce4ec' }}>
                            <RibbonGroup label="Susun">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex flex-col items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors min-w-[50px] h-[56px] gap-1">
                                            <WrapText className="w-5 h-5 text-blue-600" />
                                            <span className="text-[10px] leading-tight font-medium text-gray-600">Bungkus Teks</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => {
                                            if (editor) {
                                                const img = editor.selection.getNode();
                                                if (img.nodeName === 'IMG') {
                                                    editor.dom.setStyle(img, 'float', 'none');
                                                    editor.dom.setStyle(img, 'margin', '0');
                                                    editor.dom.setStyle(img, 'position', 'static');
                                                    editor.dom.setStyle(img, 'z-index', 'auto');
                                                }
                                            }
                                        }}>Inline (Sebaris)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            if (editor) {
                                                const img = editor.selection.getNode();
                                                if (img.nodeName === 'IMG') {
                                                    editor.dom.setStyle(img, 'float', 'left');
                                                    editor.dom.setStyle(img, 'margin', '0 10px 10px 0');
                                                    editor.dom.setStyle(img, 'position', 'static');
                                                    editor.dom.setStyle(img, 'z-index', 'auto');
                                                }
                                            }
                                        }}>Kiri (Left)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            if (editor) {
                                                const img = editor.selection.getNode();
                                                if (img.nodeName === 'IMG') {
                                                    editor.dom.setStyle(img, 'float', 'right');
                                                    editor.dom.setStyle(img, 'margin', '0 0 10px 10px');
                                                    editor.dom.setStyle(img, 'position', 'static'); // Reset pos
                                                }
                                            }
                                        }}>Kanan (Right)</DropdownMenuItem>
                                        <div className="h-px bg-gray-200 my-1" />
                                        <DropdownMenuItem onClick={() => {
                                            if (editor) {
                                                const img = editor.selection.getNode();
                                                if (img.nodeName === 'IMG' || img.classList.contains('floating-object')) {
                                                    // Capture current visual position before switching
                                                    const rect = img.getBoundingClientRect();
                                                    // We need coordinates relative to the editor body (offset parent)
                                                    // TinyMCE body is relatively positioned or static? 
                                                    // Usually offsetLeft/Top works relative to offsetParent.
                                                    // If we switch to absolute, it will anchor to body (if body is relative/isolate) or nearest positioned ancestor.
                                                    // Let's try simple offsetLeft/Top first.
                                                    // Better: use getBoundingClientRect relative to body rect.
                                                    const body = editor.getBody();
                                                    const bodyRect = body.getBoundingClientRect();
                                                    const relLeft = rect.left - bodyRect.left;
                                                    const relTop = rect.top - bodyRect.top;

                                                    editor.dom.setStyle(img, 'position', 'absolute');
                                                    editor.dom.setStyle(img, 'left', `${relLeft}px`);
                                                    editor.dom.setStyle(img, 'top', `${relTop}px`);
                                                    editor.dom.setStyle(img, 'float', 'none');
                                                    editor.dom.setStyle(img, 'margin', '0');
                                                    editor.dom.setStyle(img, 'z-index', '-1');
                                                    editor.dom.setStyle(img, 'opacity', '0.8');
                                                }
                                            }
                                        }}>Di Belakang Teks (Behind)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                            if (editor) {
                                                const img = editor.selection.getNode();
                                                if (img.nodeName === 'IMG' || img.classList.contains('floating-object')) {
                                                    const rect = img.getBoundingClientRect();
                                                    const body = editor.getBody();
                                                    const bodyRect = body.getBoundingClientRect();
                                                    const relLeft = rect.left - bodyRect.left;
                                                    const relTop = rect.top - bodyRect.top;

                                                    editor.dom.setStyle(img, 'position', 'absolute');
                                                    editor.dom.setStyle(img, 'left', `${relLeft}px`);
                                                    editor.dom.setStyle(img, 'top', `${relTop}px`);
                                                    editor.dom.setStyle(img, 'float', 'none');
                                                    editor.dom.setStyle(img, 'margin', '0');
                                                    editor.dom.setStyle(img, 'z-index', '10');
                                                    editor.dom.setStyle(img, 'opacity', '1');
                                                }
                                            }
                                        }}>Di Depan Teks (Front)</DropdownMenuItem>
                                        <div className="h-px bg-gray-200 my-1" />
                                        <DropdownMenuItem onClick={() => {
                                            if (editor) {
                                                const node = editor.selection.getNode();
                                                // Square/Tight behavior: float left with margin
                                                editor.dom.setStyle(node, 'float', 'left');
                                                editor.dom.setStyle(node, 'position', 'static');
                                                editor.dom.setStyle(node, 'margin', '0 10px 5px 0');
                                            }
                                        }}>Kotak (Square)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="flex flex-col gap-1">
                                    <div className="flex gap-1">
                                        <RibbonIconButton icon={BringToFront} title="Bawa ke Depan" onClick={() => {
                                            if (editor) {
                                                const node = editor.selection.getNode();
                                                const currentZ = parseInt(editor.dom.getStyle(node, 'z-index') || '0') || 0;
                                                editor.dom.setStyle(node, 'z-index', currentZ + 1);
                                            }
                                        }} />
                                        <RibbonIconButton icon={SendToBack} title="Kirim ke Belakang" onClick={() => {
                                            if (editor) {
                                                const node = editor.selection.getNode();
                                                const currentZ = parseInt(editor.dom.getStyle(node, 'z-index') || '0') || 0;
                                                editor.dom.setStyle(node, 'z-index', currentZ - 1);
                                            }
                                        }} />
                                    </div>
                                    <div className="flex gap-1">
                                        <RibbonIconButton icon={Lock} title="Kunci Posisi" onClick={() => {
                                            if (editor) {
                                                const node = editor.selection.getNode();
                                                // Lock by disabling drag (pointer-events none for interaction, but we need to select it? No, maybe contenteditable=false)
                                                // Better: contenteditable="false" prevents editing/moving in TinyMCE usually
                                                editor.dom.setAttrib(node, 'contenteditable', 'false');
                                                editor.dom.setStyle(node, 'cursor', 'not-allowed');
                                            }
                                        }} />
                                        <RibbonIconButton icon={Unlock} title="Buka Kunci" onClick={() => {
                                            if (editor) {
                                                const node = editor.selection.getNode();
                                                editor.dom.setAttrib(node, 'contenteditable', 'true');
                                                editor.dom.setStyle(node, 'cursor', 'move');
                                            }
                                        }} />
                                    </div>
                                </div>
                            </RibbonGroup>
                            <RibbonGroup label="Ukuran">
                                <RibbonButton icon={Crop} label="Potong" onClick={() => { }} />
                            </RibbonGroup>
                        </div>
                    )
                    }

                </div >
            </Tabs >
        </div >
    );
}

// Helpers

const RibbonGroup = ({ label, children, className }: { label: string, children: React.ReactNode, className?: string }) => (
    <div className={`flex flex-col h-full px-3 items-center justify-end flex-1 border-r border-gray-200 last:border-r-0 pb-1 ${className}`}>
        <div className="flex-1 flex gap-2 items-center justify-center mb-1 w-full flex-nowrap overflow-hidden">
            {children}
        </div>
        <div className="text-[10px] text-center text-gray-500 select-none border-t border-transparent w-full pt-0.5 whitespace-nowrap">{label}</div>
    </div>
);

interface RibbonButtonProps {
    icon: any;
    label: string;
    onClick: () => void;
    variant?: 'large' | 'small';
    className?: string;
}

const RibbonButton = ({ icon: Icon, label, onClick, variant = 'large', className }: RibbonButtonProps) => {
    if (variant === 'small') {
        return (
            <button onClick={onClick} className={cn("flex items-center gap-2 px-2 py-1 text-xs hover:bg-gray-200 rounded-sm w-full text-left transition-colors", className)}>
                <Icon className="w-3 h-3" />
                <span>{label}</span>
            </button>
        );
    }
    return (
        <button onClick={onClick} className={cn("flex flex-col items-center justify-center p-1 hover:bg-gray-200 rounded transition-colors min-w-[50px] h-[56px] gap-1", className)}>
            <Icon className="w-5 h-5 text-gray-700" />
            <span className="text-[10px] leading-tight text-center font-medium text-gray-600">{label}</span>
        </button>
    );
};

const RibbonIconButton = ({ icon: Icon, onClick, active, title, className }: any) => (
    <button
        onClick={onClick}
        title={title}
        className={cn(
            "p-1.5 rounded-sm hover:bg-gray-200 transition-colors",
            active && "bg-gray-300",
            className
        )}
    >
        <Icon className="w-4 h-4 text-gray-700" />
    </button>
);
