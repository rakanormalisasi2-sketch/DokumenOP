import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { useCallback, useRef, useState, useEffect } from 'react';
import {
  RotateCw,
  Move,
  Square,
  Trash2,
  Copy,
  MoreHorizontal,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Type,
  GripVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { TextBoxContextMenu } from './TextBoxContextMenu';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';
type WrapMode = 'inline' | 'square' | 'tight' | 'behind' | 'infront';
type VerticalAlign = 'top' | 'middle' | 'bottom';

// CRITICAL: Two distinct modes - no overlap
type InteractionMode = 'object' | 'text';

function toNumber(v: unknown, defaultVal: number = 0): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : defaultVal;
}

// Border thickness for click detection (in pixels)
const BORDER_HIT_ZONE = 16;

export function TextBoxNodeView({ 
  node, 
  updateAttributes, 
  selected, 
  editor, 
  deleteNode,
  getPos,
}: NodeViewProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  
  // CRITICAL: Mode state - starts in object mode
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('object');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  
  const resizeRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startRotation: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Extract attributes with defaults
  const width = toNumber(node.attrs.width, 200);
  const height = toNumber(node.attrs.height, 100);
  const rotation = toNumber(node.attrs.rotation, 0);
  const posX = toNumber(node.attrs.posX, 50);
  const posY = toNumber(node.attrs.posY, 50);
  const fillColor = node.attrs.fillColor || '#ffffff';
  const fillOpacity = toNumber(node.attrs.fillOpacity, 1);
  const outlineColor = node.attrs.outlineColor || '#374151';
  const outlineWidth = toNumber(node.attrs.outlineWidth, 1);
  const outlineStyle = node.attrs.outlineStyle || 'solid';
  const verticalAlign: VerticalAlign = node.attrs.verticalAlign || 'top';
  const padding = toNumber(node.attrs.padding, 8);
  const wrapMode: WrapMode = node.attrs.wrapMode || 'square';

  // CRITICAL: Reset to object mode when deselected
  useEffect(() => {
    if (!selected) {
      setInteractionMode('object');
    }
  }, [selected]);

  // Check if click is on border area (edges of the box)
  const isClickOnBorder = useCallback((clientX: number, clientY: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return false;
    
    const rect = wrapper.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const isOnLeftBorder = x < BORDER_HIT_ZONE;
    const isOnRightBorder = x > rect.width - BORDER_HIT_ZONE;
    const isOnTopBorder = y < BORDER_HIT_ZONE;
    const isOnBottomBorder = y > rect.height - BORDER_HIT_ZONE;
    
    return isOnLeftBorder || isOnRightBorder || isOnTopBorder || isOnBottomBorder;
  }, []);

  // Select node in editor
  const selectNode = useCallback(() => {
    const pos = getPos();
    if (typeof pos === 'number') {
      editor.commands.setNodeSelection(pos);
    }
  }, [editor, getPos]);

  // Enter text editing mode
  const enterTextMode = useCallback(() => {
    setInteractionMode('text');
    // Focus cursor inside the text box
    setTimeout(() => {
      const pos = getPos();
      if (typeof pos === 'number') {
        editor.commands.setTextSelection(pos + 1);
        editor.commands.focus();
      }
    }, 10);
  }, [editor, getPos]);

  // Exit to object mode
  const exitToObjectMode = useCallback(() => {
    setInteractionMode('object');
    selectNode();
  }, [selectNode]);

  // CRITICAL: Handle click on wrapper - determines mode based on where clicked
  const handleWrapperMouseDown = useCallback((e: React.MouseEvent) => {
    // Ignore if clicking on handles, toolbar, or dropdown
    const target = e.target as HTMLElement;
    if (
      target.closest('.tiptap-textbox-resize-handle') ||
      target.closest('.tiptap-textbox-rotate-handle') ||
      target.closest('.tiptap-textbox-toolbar') ||
      target.closest('[role="menu"]') ||
      target.closest('[data-radix-popper-content-wrapper]')
    ) {
      return;
    }

    const onBorder = isClickOnBorder(e.clientX, e.clientY);

    if (onBorder) {
      // OBJECT MODE: Clicking on border = select object, prepare for drag
      e.preventDefault();
      e.stopPropagation();
      setInteractionMode('object');
      selectNode();
      
      // Start drag if not inline
      if (wrapMode !== 'inline') {
        setIsDragging(true);
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          startPosX: posX,
          startPosY: posY,
        };

        const handleMouseMove = (ev: MouseEvent) => {
          if (!dragRef.current) return;
          const dx = ev.clientX - dragRef.current.startX;
          const dy = ev.clientY - dragRef.current.startY;
          updateAttributes({
            posX: dragRef.current.startPosX + dx,
            posY: dragRef.current.startPosY + dy,
          });
        };

        const handleMouseUp = () => {
          dragRef.current = null;
          setIsDragging(false);
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
    } else {
      // CONTENT AREA: Behavior depends on current mode
      if (interactionMode === 'object') {
        // Single click in content while in object mode = switch to text mode
        e.preventDefault();
        e.stopPropagation();
        enterTextMode();
      }
      // In text mode, let the editor handle text selection naturally
    }
  }, [isClickOnBorder, interactionMode, wrapMode, posX, posY, selectNode, enterTextMode, updateAttributes]);

  // Double-click always enters text mode
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('.tiptap-textbox-resize-handle') ||
      target.closest('.tiptap-textbox-rotate-handle') ||
      target.closest('.tiptap-textbox-toolbar')
    ) {
      return;
    }

    if (!isClickOnBorder(e.clientX, e.clientY)) {
      e.preventDefault();
      e.stopPropagation();
      enterTextMode();
    }
  }, [isClickOnBorder, enterTextMode]);

  // Escape key exits text mode, Delete/Backspace deletes in object mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;
      
      if (e.key === 'Escape' && interactionMode === 'text') {
        e.preventDefault();
        e.stopPropagation();
        exitToObjectMode();
      }
      
      // Delete/Backspace in object mode = delete the text box
      if ((e.key === 'Delete' || e.key === 'Backspace') && interactionMode === 'object') {
        e.preventDefault();
        e.stopPropagation();
        deleteNode();
      }
    };

    if (selected) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [interactionMode, selected, exitToObjectMode, deleteNode]);

  // Resize handler
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, handle: Handle) => {
      e.preventDefault();
      e.stopPropagation();
      setInteractionMode('object');
      setIsResizing(true);

      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();

      resizeRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startW: width,
        startH: height,
        startRotation: rotation,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        const state = resizeRef.current;
        if (!state) return;

        if (state.handle === 'rotate') {
          const angle = Math.atan2(
            ev.clientY - state.centerY,
            ev.clientX - state.centerX
          );
          const degrees = (angle * 180) / Math.PI + 90;
          const snappedDegrees = ev.shiftKey 
            ? Math.round(degrees / 15) * 15 
            : Math.round(degrees);
          
          updateAttributes({ rotation: ((snappedDegrees % 360) + 360) % 360 });
          return;
        }

        const dx = ev.clientX - state.startX;
        const dy = ev.clientY - state.startY;

        let nextW = state.startW;
        let nextH = state.startH;

        switch (state.handle) {
          case 'e':
            nextW = Math.max(80, state.startW + dx);
            break;
          case 'w':
            nextW = Math.max(80, state.startW - dx);
            break;
          case 's':
            nextH = Math.max(40, state.startH + dy);
            break;
          case 'n':
            nextH = Math.max(40, state.startH - dy);
            break;
          case 'se':
            nextW = Math.max(80, state.startW + dx);
            nextH = Math.max(40, state.startH + dy);
            break;
          case 'sw':
            nextW = Math.max(80, state.startW - dx);
            nextH = Math.max(40, state.startH + dy);
            break;
          case 'ne':
            nextW = Math.max(80, state.startW + dx);
            nextH = Math.max(40, state.startH - dy);
            break;
          case 'nw':
            nextW = Math.max(80, state.startW - dx);
            nextH = Math.max(40, state.startH - dy);
            break;
        }

        updateAttributes({
          width: Math.round(nextW),
          height: Math.round(nextH),
        });
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        setIsResizing(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [width, height, rotation, updateAttributes]
  );

  // Quick actions
  const handleRotate90 = useCallback(() => {
    updateAttributes({ rotation: (rotation + 90) % 360 });
  }, [rotation, updateAttributes]);

  const handleSetWrapMode = useCallback((mode: WrapMode) => {
    updateAttributes({ wrapMode: mode });
  }, [updateAttributes]);

  const handleSetVerticalAlign = useCallback((align: VerticalAlign) => {
    updateAttributes({ verticalAlign: align });
  }, [updateAttributes]);

  const handleDuplicate = useCallback(() => {
    const attrs = { ...node.attrs };
    editor.chain().focus().insertContent({
      type: 'textBox',
      attrs: { ...attrs, posX: posX + 30, posY: posY + 30 },
      content: node.content.toJSON(),
    }).run();
  }, [node, posX, posY, editor]);

  // Handle Move mode - switches to floating if inline and starts drag
  const handleMoveMode = useCallback(() => {
    // Switch to floating mode if inline
    if (wrapMode === 'inline') {
      updateAttributes({
        wrapMode: 'square',
        posX: 50,
        posY: 50,
      });
    }
    setIsMoveMode(true);
    setInteractionMode('object');
    selectNode();
  }, [wrapMode, updateAttributes, selectNode]);

  // Track move mode drag
  useEffect(() => {
    if (!isMoveMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      
      const parent = wrapperRef.current.closest('.ProseMirror');
      if (!parent) return;
      
      const parentRect = parent.getBoundingClientRect();
      const newX = Math.max(0, e.clientX - parentRect.left - width / 2);
      const newY = Math.max(0, e.clientY - parentRect.top - height / 2);
      
      updateAttributes({ posX: newX, posY: newY });
    };

    const handleMouseUp = () => {
      setIsMoveMode(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoveMode(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    document.body.style.cursor = 'move';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.cursor = '';
    };
  }, [isMoveMode, width, height, updateAttributes]);

  // Z-index actions
  const handleBringToFront = useCallback(() => {
    updateAttributes({ wrapMode: 'infront' });
  }, [updateAttributes]);

  const handleSendToBack = useCallback(() => {
    updateAttributes({ wrapMode: 'behind' });
  }, [updateAttributes]);

  // Styles
  const wrapperStyle: React.CSSProperties = {
    position: wrapMode === 'inline' ? 'relative' : 'absolute',
    left: wrapMode !== 'inline' ? `${posX}px` : undefined,
    top: wrapMode !== 'inline' ? `${posY}px` : undefined,
    width: `${width}px`,
    height: `${height}px`,
    transform: rotation ? `rotate(${rotation}deg)` : undefined,
    transformOrigin: 'center center',
    zIndex: wrapMode === 'infront' ? 100 : wrapMode === 'behind' ? -1 : 10,
    cursor: isDragging || isMoveMode ? 'grabbing' : (interactionMode === 'object' ? 'move' : 'default'),
  };

  const boxStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: fillColor === 'transparent' ? 'transparent' : fillColor,
    opacity: fillOpacity,
    border: outlineStyle !== 'none' 
      ? `${outlineWidth}px ${outlineStyle} ${outlineColor}` 
      : '1px dashed #d1d5db',
    padding: `${padding}px`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: verticalAlign === 'top' 
      ? 'flex-start' 
      : verticalAlign === 'middle' 
        ? 'center' 
        : 'flex-end',
    overflow: 'hidden',
    boxSizing: 'border-box',
    cursor: interactionMode === 'text' ? 'text' : 'move',
    userSelect: interactionMode === 'text' ? 'text' : 'none',
  };

  const isObjectMode = interactionMode === 'object';
  const showHandles = selected && isObjectMode && !isDragging && !isResizing && !isMoveMode;

  return (
    <NodeViewWrapper 
      ref={wrapperRef}
      className={`tiptap-textbox-wrapper ${selected ? 'tiptap-textbox-selected' : ''} ${isObjectMode ? 'tiptap-textbox-object-mode' : 'tiptap-textbox-text-mode'}`}
      style={wrapperStyle}
      data-wrap-mode={wrapMode}
      data-interaction-mode={interactionMode}
      onMouseDown={handleWrapperMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {/* Quick toolbar - Object mode only */}
      {selected && isObjectMode && !isDragging && (
        <div 
          className="tiptap-textbox-toolbar"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 px-1 text-muted-foreground" title="Klik border untuk drag">
            <GripVertical className="h-3.5 w-3.5" />
          </div>

          <div className="tiptap-toolbar-divider" />

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); handleRotate90(); }}
            title="Putar 90°"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
          
          <div className="tiptap-toolbar-divider" />

          {/* Vertical Alignment */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Perataan Vertikal">
                {verticalAlign === 'top' && <AlignVerticalJustifyStart className="h-3.5 w-3.5" />}
                {verticalAlign === 'middle' && <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />}
                {verticalAlign === 'bottom' && <AlignVerticalJustifyEnd className="h-3.5 w-3.5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-background z-[200]">
              <DropdownMenuItem onClick={() => handleSetVerticalAlign('top')}>
                <AlignVerticalJustifyStart className="h-4 w-4 mr-2" />
                <span className={verticalAlign === 'top' ? 'font-bold' : ''}>Atas</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetVerticalAlign('middle')}>
                <AlignVerticalJustifyCenter className="h-4 w-4 mr-2" />
                <span className={verticalAlign === 'middle' ? 'font-bold' : ''}>Tengah</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetVerticalAlign('bottom')}>
                <AlignVerticalJustifyEnd className="h-4 w-4 mr-2" />
                <span className={verticalAlign === 'bottom' ? 'font-bold' : ''}>Bawah</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Text Wrapping */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Pembungkusan Teks">
                <Square className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background z-[200]">
              <DropdownMenuItem onClick={() => handleSetWrapMode('inline')}>
                <span className={wrapMode === 'inline' ? 'font-bold' : ''}>Sejajar Teks</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetWrapMode('square')}>
                <span className={wrapMode === 'square' ? 'font-bold' : ''}>Persegi</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetWrapMode('tight')}>
                <span className={wrapMode === 'tight' ? 'font-bold' : ''}>Ketat</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSetWrapMode('behind')}>
                <span className={wrapMode === 'behind' ? 'font-bold' : ''}>Di Belakang Teks</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSetWrapMode('infront')}>
                <span className={wrapMode === 'infront' ? 'font-bold' : ''}>Di Depan Teks</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Opsi Lainnya">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-[200]">
              <DropdownMenuItem onClick={() => enterTextMode()}>
                <Type className="h-3.5 w-3.5 mr-2" />
                Edit Teks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-3.5 w-3.5 mr-2" />
                Duplikat
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => deleteNode()} className="text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Mode indicator */}
      {selected && (
        <div className="tiptap-textbox-mode-indicator">
          {isObjectMode ? (
            <span className="flex items-center gap-1">
              <Move className="h-3 w-3" /> Object Mode - Klik border untuk drag
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Type className="h-3 w-3" /> Text Mode - ESC untuk keluar
            </span>
          )}
        </div>
      )}

      {/* Text Box Content with Context Menu */}
      <TextBoxContextMenu
        wrapMode={wrapMode}
        verticalAlign={verticalAlign}
        onMove={handleMoveMode}
        onRotate90={handleRotate90}
        onEditText={enterTextMode}
        onSetWrapMode={handleSetWrapMode}
        onSetVerticalAlign={handleSetVerticalAlign}
        onDuplicate={handleDuplicate}
        onDelete={() => deleteNode()}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      >
        <div 
          ref={contentRef}
          className="tiptap-textbox-content"
          style={boxStyle}
        >
          <NodeViewContent className="tiptap-textbox-inner" />
        </div>
      </TextBoxContextMenu>

      {/* Resize handles - Object mode only */}
      {showHandles && (
        <>
          {/* Corner handles */}
          <button
            type="button"
            className="tiptap-textbox-resize-handle tiptap-textbox-resize-nw"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            aria-label="Resize NW"
          />
          <button
            type="button"
            className="tiptap-textbox-resize-handle tiptap-textbox-resize-ne"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            aria-label="Resize NE"
          />
          <button
            type="button"
            className="tiptap-textbox-resize-handle tiptap-textbox-resize-sw"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            aria-label="Resize SW"
          />
          <button
            type="button"
            className="tiptap-textbox-resize-handle tiptap-textbox-resize-se"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            aria-label="Resize SE"
          />
          
          {/* Side handles */}
          <button
            type="button"
            className="tiptap-textbox-resize-handle tiptap-textbox-resize-n"
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            aria-label="Resize N"
          />
          <button
            type="button"
            className="tiptap-textbox-resize-handle tiptap-textbox-resize-s"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            aria-label="Resize S"
          />
          <button
            type="button"
            className="tiptap-textbox-resize-handle tiptap-textbox-resize-e"
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            aria-label="Resize E"
          />
          <button
            type="button"
            className="tiptap-textbox-resize-handle tiptap-textbox-resize-w"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            aria-label="Resize W"
          />

          {/* Rotation handle */}
          <button
            type="button"
            className="tiptap-textbox-rotate-handle"
            onMouseDown={(e) => handleResizeMouseDown(e, 'rotate')}
            aria-label="Rotate"
          >
            <RotateCw className="h-3 w-3" />
          </button>
        </>
      )}

      {/* Size indicator */}
      {selected && isObjectMode && (
        <div className="tiptap-textbox-size-indicator">
          {Math.round(width)} × {Math.round(height)}
        </div>
      )}
    </NodeViewWrapper>
  );
}
