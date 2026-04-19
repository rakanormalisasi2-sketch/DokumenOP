/**
 * Context Menu for TextBox - provides Move and other actions via right-click
 */

import React from 'react';
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
  Move,
  RotateCw,
  Square,
  Copy,
  Trash2,
  Layers,
  ChevronsUp,
  ChevronsDown,
  Rows,
  Type,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
} from 'lucide-react';

type WrapMode = 'inline' | 'square' | 'tight' | 'behind' | 'infront';
type VerticalAlign = 'top' | 'middle' | 'bottom';

interface TextBoxContextMenuProps {
  children: React.ReactNode;
  wrapMode: WrapMode;
  verticalAlign: VerticalAlign;
  onMove: () => void;
  onRotate90: () => void;
  onEditText: () => void;
  onSetWrapMode: (mode: WrapMode) => void;
  onSetVerticalAlign: (align: VerticalAlign) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export function TextBoxContextMenu({
  children,
  wrapMode,
  verticalAlign,
  onMove,
  onRotate90,
  onEditText,
  onSetWrapMode,
  onSetVerticalAlign,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
}: TextBoxContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {/* Move - Primary action */}
        <ContextMenuItem onClick={onMove}>
          <Move className="mr-2 h-4 w-4" />
          <span>Move</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={onEditText}>
          <Type className="mr-2 h-4 w-4" />
          <span>Edit Text</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Transform */}
        <ContextMenuItem onClick={onRotate90}>
          <RotateCw className="mr-2 h-4 w-4" />
          <span>Rotate 90°</span>
        </ContextMenuItem>

        {/* Vertical Alignment */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <AlignVerticalJustifyCenter className="mr-2 h-4 w-4" />
            <span>Vertical Align</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onSetVerticalAlign('top')}>
              <AlignVerticalJustifyStart className="mr-2 h-4 w-4" />
              <span>Top</span>
              {verticalAlign === 'top' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onSetVerticalAlign('middle')}>
              <AlignVerticalJustifyCenter className="mr-2 h-4 w-4" />
              <span>Middle</span>
              {verticalAlign === 'middle' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onSetVerticalAlign('bottom')}>
              <AlignVerticalJustifyEnd className="mr-2 h-4 w-4" />
              <span>Bottom</span>
              {verticalAlign === 'bottom' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Text Wrapping */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Square className="mr-2 h-4 w-4" />
            <span>Text Wrapping</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={() => onSetWrapMode('inline')}>
              <Rows className="mr-2 h-4 w-4" />
              <span>Inline with Text</span>
              {wrapMode === 'inline' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onSetWrapMode('square')}>
              <span>Square</span>
              {wrapMode === 'square' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onSetWrapMode('tight')}>
              <span>Tight</span>
              {wrapMode === 'tight' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onSetWrapMode('behind')}>
              <span>Behind Text</span>
              {wrapMode === 'behind' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onSetWrapMode('infront')}>
              <span>In Front of Text</span>
              {wrapMode === 'infront' && <span className="ml-auto text-primary">✓</span>}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Arrange */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Layers className="mr-2 h-4 w-4" />
            <span>Arrange</span>
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onClick={onBringToFront}>
              <ChevronsUp className="mr-2 h-4 w-4" />
              <span>Bring to Front</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={onSendToBack}>
              <ChevronsDown className="mr-2 h-4 w-4" />
              <span>Send to Back</span>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Duplicate</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
