/**
 * Layer/Arrange Panel Component
 * Provides Bring to Front/Send to Back controls for tables and images
 */

import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Layers, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react';

interface LayerPanelProps {
  editor: Editor | null;
  selectedNode: 'table' | 'image' | 'textbox' | null;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}

export function LayerPanel({
  editor,
  selectedNode,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
}: LayerPanelProps) {
  if (!editor || !selectedNode) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5">
          <Layers className="h-4 w-4" />
          <span className="text-xs">Arrange</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={onBringToFront}>
          <ChevronsUp className="h-4 w-4 mr-2" />
          Bring to Front
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onBringForward}>
          <ArrowUp className="h-4 w-4 mr-2" />
          Bring Forward
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSendBackward}>
          <ArrowDown className="h-4 w-4 mr-2" />
          Send Backward
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSendToBack}>
          <ChevronsDown className="h-4 w-4 mr-2" />
          Send to Back
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper functions to manage z-index
let globalZIndexCounter = 100;

export function getNextZIndex(): number {
  globalZIndexCounter += 1;
  return globalZIndexCounter;
}

export function resetZIndexCounter(max: number = 100) {
  globalZIndexCounter = max;
}

// Z-index presets
export const Z_INDEX = {
  BEHIND_TEXT: -1,
  INLINE: 'auto',
  FLOATING_BASE: 10,
  FLOATING_FRONT: 1000,
} as const;
