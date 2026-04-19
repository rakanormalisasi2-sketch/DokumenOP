import React, { useState } from 'react';
import {
    Clipboard, Scissors, Copy, PaintRoller,
    Bold, Italic, Underline, Strikethrough,
    Subscript, Superscript, Highlighter, Baseline,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, IndentDecrease, IndentIncrease,
    Undo2, Redo2, FileText, Image as ImageIcon, Table as TableIcon
} from 'lucide-react';
import type { SelectionState } from '../../lib/docx-editor/prosemirror';
import { toggleBold, toggleItalic, toggleUnderline, toggleStrike, setAlignment, setFontFamily, setFontSize } from '../../lib/docx-editor/prosemirror';

interface NativeDocxRibbonProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    selection: SelectionState | null;
    execCommand: (cmd: any) => void;
    onFormatPainterClick: () => void;
    isFormatPainterActive: boolean;
    onSave: () => void;
    onLoadSample: () => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NativeDocxRibbon: React.FC<NativeDocxRibbonProps> = ({
    activeTab, setActiveTab, selection, execCommand,
    onFormatPainterClick, isFormatPainterActive,
    onSave, onLoadSample, onFileSelect
}) => {
    const tabs = ['FILE', 'HOME', 'INSERT', 'DRAW', 'DESIGN', 'LAYOUT', 'REFERENCES', 'REVIEW', 'VIEW'];

    const RibbonButton = ({ icon: Icon, label, onClick, isActive = false, large = false, disabled = false }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex ${large ? 'flex-col justify-center items-center h-16 w-14 gap-1' : 'items-center gap-1.5 h-7 px-2'} 
        rounded cursor-pointer transition-colors text-xs select-none
        ${isActive ? 'bg-blue-100/80 text-blue-900 ring-1 ring-blue-300' : 'text-slate-700 hover:bg-slate-100 shadow-sm border border-transparent hover:border-slate-200 hover:shadow disabled:opacity-50'}
      `}
            title={label}
        >
            <Icon className={large ? 'w-6 h-6 text-slate-600' : 'w-4 h-4 text-slate-600'} />
            {large && <span className="text-[10px] leading-tight text-center font-medium">{label}</span>}
            {!large && label && <span>{label}</span>}
        </button>
    );

    const Divider = () => <div className="w-[1px] h-12 bg-slate-200 mx-2" />;
    const GroupLabel = ({ text }: { text: string }) => (
        <div className="absolute -bottom-1 left-0 right-0 text-center text-[10px] text-slate-400 font-medium select-none">{text}</div>
    );

    return (
        <div className="native-ribbon bg-[#f3f4f6] flex flex-col z-20 relative select-none" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
            {/* Title Bar Area (Simulated) */}
            <div className="h-2 bg-[#2b579a]"></div>

            {/* Tabs Menu */}
            <div className="flex px-1 bg-white border-b border-slate-200">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-1.5 text-xs font-medium transition-colors border-b-2 
              ${activeTab === tab
                                ? 'border-blue-600 text-blue-700 bg-slate-50'
                                : 'border-transparent text-slate-600 hover:bg-slate-50'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Ribbon Content Panels */}
            <div className="h-24 bg-[#f3f4f6] flex items-start px-2 py-2 overflow-x-auto overflow-y-hidden" style={{ minHeight: '96px' }}>

                {activeTab === 'FILE' && (
                    <div className="flex h-full relative group-container gap-1 pr-4">
                        <label className="flex flex-col justify-center items-center h-16 w-16 gap-1 rounded cursor-pointer transition-colors text-xs text-slate-700 hover:bg-slate-100 shadow-sm border border-transparent hover:border-slate-200">
                            <FileText className="w-6 h-6 text-blue-600" />
                            <input type="file" accept=".docx" className="hidden" onChange={onFileSelect} />
                            <span className="text-[10px] leading-tight text-center font-medium">Open DOCX</span>
                        </label>
                        <RibbonButton icon={FileText} label="Load Sample" large onClick={onLoadSample} />
                        <RibbonButton icon={Undo2} label="Save As" large onClick={onSave} />
                        <GroupLabel text="Document" />
                    </div>
                )}

                {activeTab === 'HOME' && (
                    <>
                        {/* Clipboard Group */}
                        <div className="flex h-full relative group-container pr-4 pl-1">
                            <RibbonButton icon={Clipboard} label="Paste" large onClick={() => document.execCommand('paste')} />
                            <div className="flex flex-col justify-between h-16 ml-1">
                                <RibbonButton icon={Scissors} label="Cut" onClick={() => document.execCommand('cut')} />
                                <RibbonButton icon={Copy} label="Copy" onClick={() => document.execCommand('copy')} />
                                <RibbonButton icon={PaintRoller} label="Format Painter" isActive={isFormatPainterActive} onClick={onFormatPainterClick} />
                            </div>
                            <GroupLabel text="Clipboard" />
                        </div>

                        <Divider />

                        {/* Font Group */}
                        <div className="flex h-full relative group-container pr-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex gap-1 h-7">
                                    <select
                                        className="border border-slate-300 rounded text-xs px-2 w-32 focus:ring-1 focus:ring-blue-500 outline-none bg-white font-sans"
                                        value={selection?.textFormatting?.fontFamily?.ascii || 'Arial'}
                                        onChange={(e) => execCommand((state: any, dispatch: any) => setFontFamily(e.target.value)(state, dispatch))}
                                    >
                                        <option value="Arial">Arial</option>
                                        <option value="Calibri">Calibri</option>
                                        <option value="Times New Roman">Times New Roman</option>
                                        <option value="Verdana">Verdana</option>
                                        <option value="Tahoma">Tahoma</option>
                                    </select>
                                    <select
                                        className="border border-slate-300 rounded text-xs px-1 w-12 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                        value={selection?.textFormatting?.fontSize ? selection.textFormatting.fontSize / 2 : 11}
                                        onChange={(e) => execCommand((state: any, dispatch: any) => setFontSize(parseInt(e.target.value) * 2)(state, dispatch))}
                                    >
                                        {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-0.5">
                                    <RibbonButton icon={Bold} isActive={selection?.textFormatting?.bold} onClick={() => execCommand(toggleBold)} />
                                    <RibbonButton icon={Italic} isActive={selection?.textFormatting?.italic} onClick={() => execCommand(toggleItalic)} />
                                    <RibbonButton icon={Underline} isActive={selection?.textFormatting?.underline} onClick={() => execCommand(toggleUnderline)} />
                                    <RibbonButton icon={Strikethrough} isActive={selection?.textFormatting?.strike} onClick={() => execCommand(toggleStrike)} />
                                    <div className="w-[1px] h-4 bg-slate-300 mx-1 self-center" />
                                    <RibbonButton icon={Subscript} />
                                    <RibbonButton icon={Superscript} />
                                    <div className="w-[1px] h-4 bg-slate-300 mx-1 self-center" />
                                    <RibbonButton icon={Highlighter} />
                                    <RibbonButton icon={Baseline} />
                                </div>
                            </div>
                            <GroupLabel text="Font" />
                        </div>

                        <Divider />

                        {/* Paragraph Group */}
                        <div className="flex h-full relative group-container pr-4">
                            <div className="flex flex-col gap-1.5">
                                <div className="flex gap-0.5">
                                    <RibbonButton icon={List} />
                                    <RibbonButton icon={ListOrdered} />
                                    <div className="w-[1px] h-4 bg-slate-300 mx-1 self-center" />
                                    <RibbonButton icon={IndentDecrease} />
                                    <RibbonButton icon={IndentIncrease} />
                                </div>
                                <div className="flex gap-0.5">
                                    <RibbonButton icon={AlignLeft} isActive={selection?.paragraphFormatting?.alignment === 'left' || !selection?.paragraphFormatting?.alignment} onClick={() => execCommand((state: any, dispatch: any) => setAlignment('left')(state, dispatch))} />
                                    <RibbonButton icon={AlignCenter} isActive={selection?.paragraphFormatting?.alignment === 'center'} onClick={() => execCommand((state: any, dispatch: any) => setAlignment('center')(state, dispatch))} />
                                    <RibbonButton icon={AlignRight} isActive={selection?.paragraphFormatting?.alignment === 'right'} onClick={() => execCommand((state: any, dispatch: any) => setAlignment('right')(state, dispatch))} />
                                    <RibbonButton icon={AlignJustify} isActive={selection?.paragraphFormatting?.alignment === 'both'} onClick={() => execCommand((state: any, dispatch: any) => setAlignment('both')(state, dispatch))} />
                                </div>
                            </div>
                            <GroupLabel text="Paragraph" />
                        </div>

                        <Divider />

                        {/* Editing Group */}
                        <div className="flex h-full relative group-container pr-4 pl-1">
                            <RibbonButton icon={Undo2} label="Undo" large />
                            <div className="flex flex-col justify-between h-16 ml-1">
                                <RibbonButton icon={Redo2} label="Redo" />
                                <RibbonButton icon={FileText} label="Find" />
                                <RibbonButton icon={FileText} label="Replace" />
                            </div>
                            <GroupLabel text="Editing" />
                        </div>
                    </>
                )}

                {activeTab === 'INSERT' && (
                    <div className="flex h-full relative group-container gap-1 pr-4">
                        <RibbonButton icon={TableIcon} label="Table" large />
                        <RibbonButton icon={ImageIcon} label="Pictures" large />
                        <RibbonButton icon={FileText} label="Header" large />
                        <RibbonButton icon={FileText} label="Footer" large />
                        <GroupLabel text="Insert Elements" />
                    </div>
                )}
            </div>
        </div>
    );
};
