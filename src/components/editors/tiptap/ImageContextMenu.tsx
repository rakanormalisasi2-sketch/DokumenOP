/**
 * Context Menu for Images - provides Move and other actions via right-click
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
  FlipHorizontal,
  FlipVertical,
  Square,
  Copy,
  Trash2,
  Layers,
  ChevronsUp,
  ChevronsDown,
  Rows,
} from 'lucide-react';

type WrapMode = 'inline' | 'square' | 'tight' | 'behind' | 'infront';

interface ImageContextMenuProps {
  children: React.ReactNode;
  wrapMode: WrapMode;
  onMove: () => void;
  onRotate90: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onSetWrapMode: (mode: WrapMode) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

export function ImageContextMenu({
  children,
  wrapMode,
  onMove,
  onRotate90,
  onFlipHorizontal,
  onFlipVertical,
  onSetWrapMode,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
}: ImageContextMenuProps) {
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

        <ContextMenuSeparator />

        {/* Transform */}
        <ContextMenuItem onClick={onRotate90}>
          <RotateCw className="mr-2 h-4 w-4" />
          <span>Rotate 90°</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onFlipHorizontal}>
          <FlipHorizontal className="mr-2 h-4 w-4" />
          <span>Flip Horizontal</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onFlipVertical}>
          <FlipVertical className="mr-2 h-4 w-4" />
          <span>Flip Vertical</span>
        </ContextMenuItem>

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
