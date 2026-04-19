import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useCallback, useRef, useState, useEffect } from 'react';
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Move,
  Square,
  Trash2,
  Copy,
  MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ImageContextMenu } from './ImageContextMenu';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'rotate';
type WrapMode = 'inline' | 'square' | 'tight' | 'behind' | 'infront';

function toNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function ResizableImageNodeView({ node, updateAttributes, selected, editor, deleteNode, getPos }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
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
    ratio: number;
  } | null>(null);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    started: boolean;
  } | null>(null);

  const width = toNumber(node.attrs.width);
  const height = toNumber(node.attrs.height);
  const rotation = toNumber(node.attrs.rotation) ?? 0;
  const flipX = node.attrs.flipX ?? false;
  const flipY = node.attrs.flipY ?? false;
  const wrapMode: WrapMode = node.attrs.wrapMode ?? 'inline';
  const posX = toNumber(node.attrs.posX) ?? 0;
  const posY = toNumber(node.attrs.posY) ?? 0;

  const selectNode = useCallback(() => {
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (typeof pos === 'number') {
      editor.commands.setNodeSelection(pos);
    }
  }, [editor, getPos]);

  // Resize handler
  const handlePointerDown = useCallback(
    (e: React.PointerEvent, handle: Handle) => {
      e.preventDefault();
      e.stopPropagation();

      editor.commands.focus();
      selectNode();

      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;

      resizeRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startW,
        startH,
        startRotation: rotation,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        ratio: startW / Math.max(1, startH),
      };

      const onMove = (ev: PointerEvent) => {
        const state = resizeRef.current;
        if (!state) return;

        if (state.handle === 'rotate') {
          // Calculate rotation angle
          const angle = Math.atan2(ev.clientY - state.centerY, ev.clientX - state.centerX);
          const degrees = (angle * 180) / Math.PI + 90;
          const snappedDegrees = ev.shiftKey ? Math.round(degrees / 15) * 15 : Math.round(degrees);

          updateAttributes({ rotation: snappedDegrees });
          return;
        }

        const dx = ev.clientX - state.startX;
        const dy = ev.clientY - state.startY;

        let nextW = state.startW;
        let nextH = state.startH;

        // Handle different resize directions
        switch (state.handle) {
          case 'e':
            nextW = Math.max(40, state.startW + dx);
            nextH = ev.shiftKey ? nextW / state.ratio : state.startH;
            break;
          case 'w':
            nextW = Math.max(40, state.startW - dx);
            nextH = ev.shiftKey ? nextW / state.ratio : state.startH;
            break;
          case 's':
            nextH = Math.max(40, state.startH + dy);
            nextW = ev.shiftKey ? nextH * state.ratio : state.startW;
            break;
          case 'n':
            nextH = Math.max(40, state.startH - dy);
            nextW = ev.shiftKey ? nextH * state.ratio : state.startW;
            break;
          case 'se':
          case 'nw':
          case 'ne':
          case 'sw': {
            // Corner handles - maintain aspect ratio by default
            const dirX = state.handle.includes('w') ? -1 : 1;
            const dirY = state.handle.includes('n') ? -1 : 1;

            if (ev.shiftKey) {
              // Free resize when holding Shift
              nextW = Math.max(40, state.startW + dx * dirX);
              nextH = Math.max(40, state.startH + dy * dirY);
            } else {
              // Maintain aspect ratio
              const signed = Math.abs(dx) > Math.abs(dy) ? dirX * dx : dirY * dy;
              nextW = Math.max(40, state.startW + signed);
              nextH = Math.max(40, nextW / state.ratio);
            }
            break;
          }
        }

        updateAttributes({
          width: Math.round(nextW),
          height: Math.round(nextH),
        });
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [editor, updateAttributes, rotation, selectNode]
  );

  // Drag handler for floating images
  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      if (wrapMode === 'inline') return;

      // IMPORTANT: do NOT stopPropagation here.
      // Otherwise the image can't be re-selected after selecting text.
      editor.commands.focus();
      selectNode();

      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: posX,
        startTop: posY,
        started: false,
      };

      const DRAG_THRESHOLD = 4;

      const onMove = (ev: PointerEvent) => {
        const state = dragRef.current;
        if (!state) return;

        const dx = ev.clientX - state.startX;
        const dy = ev.clientY - state.startY;

        if (!state.started) {
          if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
          state.started = true;
          setIsDragging(true);
          document.body.style.userSelect = 'none';
        }

        updateAttributes({
          posX: state.startLeft + dx,
          posY: state.startTop + dy,
        });
      };

      const onUp = () => {
        dragRef.current = null;
        setIsDragging(false);
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [wrapMode, posX, posY, updateAttributes, editor, selectNode]
  );

  // Quick actions
  const handleRotate90 = () => {
    updateAttributes({ rotation: (rotation + 90) % 360 });
  };

  const handleFlipHorizontal = () => {
    updateAttributes({ flipX: !flipX });
  };

  const handleFlipVertical = () => {
    updateAttributes({ flipY: !flipY });
  };

  const handleSetWrapMode = (mode: WrapMode) => {
    updateAttributes({ wrapMode: mode });
  };

  const handleResetImage = () => {
    updateAttributes({
      rotation: 0,
      flipX: false,
      flipY: false,
      width: null,
      height: null,
    });
  };

  const handleDuplicate = () => {
    const { src, alt, width, height, rotation, flipX, flipY, wrapMode, posX, posY } = node.attrs;
    editor.chain().focus().insertContent({
      type: 'image',
      attrs: { src, alt, width, height, rotation, flipX, flipY, wrapMode, posX: posX + 30, posY: posY + 30 }
    }).run();
  };

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
      const newX = Math.max(0, e.clientX - parentRect.left - (width || 100) / 2);
      const newY = Math.max(0, e.clientY - parentRect.top - (height || 100) / 2);

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

  // Handle Delete/Backspace when image is selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        deleteNode();
      }

      // ESC to deselect
      if (e.key === 'Escape') {
        editor.commands.blur();
      }
    };

    if (selected) {
      document.addEventListener('keydown', handleKeyDown, true);
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [selected, deleteNode, editor]);

  // Z-index actions
  const handleBringToFront = () => {
    updateAttributes({ wrapMode: 'infront' });
  };

  const handleSendToBack = () => {
    updateAttributes({ wrapMode: 'behind' });
  };

  // Calculate wrapper styles based on wrap mode
  const wrapperStyle: React.CSSProperties = {
    position: wrapMode === 'inline' ? 'relative' : 'absolute',
    display: wrapMode === 'inline' ? 'inline-block' : undefined,
    left: wrapMode !== 'inline' ? `${posX}px` : undefined,
    top: wrapMode !== 'inline' ? `${posY}px` : undefined,
    zIndex: node.attrs.zIndex ?? (wrapMode === 'infront' ? 100 : wrapMode === 'behind' ? -1 : 50), // Default 50 for floating
    cursor: isDragging || isMoveMode ? 'grabbing' : wrapMode !== 'inline' ? 'grab' : 'default',
    verticalAlign: wrapMode === 'inline' ? 'bottom' : undefined, // Ensure proper alignment in text
    isolation: 'isolate', // Create new stacking context
  };

  const imageStyle: React.CSSProperties = {
    width: width ? `${width}px` : undefined,
    height: height ? `${height}px` : undefined,
    transform: `rotate(${rotation}deg) scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
    transformOrigin: 'center center',
    maxWidth: '100%', // Prevent overflow
    display: 'block', // Removes bottom gap in some cases
  };

  return (
    <NodeViewWrapper
      as={wrapMode === 'inline' ? 'span' : 'div'}
      ref={wrapperRef}
      className={`tiptap-image-wrapper ${selected ? 'tiptap-image-selected' : ''} ${wrapMode !== 'inline' ? 'tiptap-image-floating' : ''}`}
      style={wrapperStyle}
      data-wrap-mode={wrapMode}
    >
      {/* Quick toolbar when selected */}
      {selected && (
        <div className="tiptap-image-toolbar">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRotate90}
            title="Putar 90°"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleFlipHorizontal}
            title="Flip Horizontal"
          >
            <FlipHorizontal className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleFlipVertical}
            title="Flip Vertical"
          >
            <FlipVertical className="h-3.5 w-3.5" />
          </Button>

          <div className="tiptap-toolbar-divider" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Text Wrapping">
                <Square className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-3.5 w-3.5 mr-2" />
                Duplikat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleResetImage}>
                <RotateCw className="h-3.5 w-3.5 mr-2" />
                Reset
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

      {/* Image with Context Menu */}
      <ImageContextMenu
        wrapMode={wrapMode}
        onMove={handleMoveMode}
        onRotate90={handleRotate90}
        onFlipHorizontal={handleFlipHorizontal}
        onFlipVertical={handleFlipVertical}
        onSetWrapMode={handleSetWrapMode}
        onDuplicate={handleDuplicate}
        onDelete={() => deleteNode()}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      >
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt || 'Gambar'}
          className="tiptap-image"
          style={imageStyle}
          draggable={false}
          onPointerDown={handleDragStart}
        />
      </ImageContextMenu>

      {/* Resize handles - shown when selected */}
      {selected && (
        <>
          {/* Corner handles */}
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-resize-nw"
            onPointerDown={(e) => handlePointerDown(e, 'nw')}
            aria-label="Resize gambar"
          />
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-resize-ne"
            onPointerDown={(e) => handlePointerDown(e, 'ne')}
            aria-label="Resize gambar"
          />
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-resize-sw"
            onPointerDown={(e) => handlePointerDown(e, 'sw')}
            aria-label="Resize gambar"
          />
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-resize-se"
            onPointerDown={(e) => handlePointerDown(e, 'se')}
            aria-label="Resize gambar"
          />

          {/* Side handles */}
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-resize-n"
            onPointerDown={(e) => handlePointerDown(e, 'n')}
            aria-label="Resize gambar"
          />
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-resize-s"
            onPointerDown={(e) => handlePointerDown(e, 's')}
            aria-label="Resize gambar"
          />
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-resize-e"
            onPointerDown={(e) => handlePointerDown(e, 'e')}
            aria-label="Resize gambar"
          />
          <button
            type="button"
            className="tiptap-image-resize-handle tiptap-image-resize-w"
            onPointerDown={(e) => handlePointerDown(e, 'w')}
            aria-label="Resize gambar"
          />

          {/* Rotation handle */}
          <button
            type="button"
            className="tiptap-image-rotate-handle"
            onPointerDown={(e) => handlePointerDown(e, 'rotate')}
            aria-label="Putar gambar"
          >
            <RotateCw className="h-3 w-3" />
          </button>
        </>
      )}

      {/* Size indicator when resizing */}
      {selected && width && height && (
        <div className="tiptap-image-size-indicator">
          {Math.round(width)} × {Math.round(height)}
        </div>
      )}
    </NodeViewWrapper>
  );
}
