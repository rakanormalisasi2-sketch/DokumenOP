import React, { useEffect, useState, useCallback, useRef } from 'react';
import { EditorState, Transaction } from 'prosemirror-state';
import { NodeSelection } from 'prosemirror-state';
import { MoveIcon } from 'lucide-react';

interface TableHoverOverlayProps {
    containerRef: React.RefObject<HTMLDivElement>;
    zoom: number;
    dispatchTransaction: (tr: Transaction) => void;
    getEditorState: () => EditorState | null;
}

interface HoveredTableState {
    pmStart: number;
    x: number;
    y: number;
}

export const TableHoverOverlay: React.FC<TableHoverOverlayProps> = ({
    containerRef,
    zoom,
    dispatchTransaction,
    getEditorState,
}) => {
    const [hoveredTable, setHoveredTable] = useState<HoveredTableState | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!containerRef.current) return;

            const target = e.target as HTMLElement;

            // If we are hovering the handle itself, do nothing
            if (target.closest('.table-hover-handle')) {
                return;
            }

            // Check if we are hovering a table
            const tableEl = target.closest('.layout-table') as HTMLElement;

            if (tableEl && tableEl.dataset.pmStart !== undefined) {
                const pmStart = Number(tableEl.dataset.pmStart);

                // Find the bounding rect of the table relative to the container
                const containerRect = containerRef.current.getBoundingClientRect();
                const tableRect = tableEl.getBoundingClientRect();

                const newHoveredTable = {
                    pmStart,
                    x: (tableRect.left - containerRect.left) / zoom - 14, // Offset slightly to top-left
                    y: (tableRect.top - containerRect.top) / zoom - 14,
                };

                // Debounce state updates to avoid flickering
                if (
                    !hoveredTable ||
                    hoveredTable.pmStart !== pmStart ||
                    Math.abs(hoveredTable.x - newHoveredTable.x) > 1 ||
                    Math.abs(hoveredTable.y - newHoveredTable.y) > 1
                ) {
                    setHoveredTable(newHoveredTable);
                }

                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                }
            } else {
                // Not hovering a table. Hide after a small delay to allow moving to the handle
                if (!hoverTimeoutRef.current && hoveredTable) {
                    hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredTable(null);
                        hoverTimeoutRef.current = null;
                    }, 150);
                }
            }
        },
        [containerRef, zoom, hoveredTable]
    );

    const handleMouseLeave = useCallback(() => {
        // Hide when leaving the canvas area
        setHoveredTable(null);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseleave', handleMouseLeave);

            return () => {
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('mouseleave', handleMouseLeave);
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                }
            };
        }
    }, [containerRef, handleMouseMove, handleMouseLeave]);

    const handleSelectTable = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (hoveredTable) {
            const editorState = getEditorState();
            if (!editorState) return;

            const doc = editorState.doc;
            const resolvedPos = doc.resolve(hoveredTable.pmStart);

            // We want to select the table node itself
            // The pmStart is the start of the table node
            try {
                const selection = NodeSelection.create(doc, hoveredTable.pmStart);
                dispatchTransaction(editorState.tr.setSelection(selection));
            } catch (err) {
                console.error('Failed to create NodeSelection for table', err);
            }
        }
    };

    if (!hoveredTable) {
        return null;
    }

    return (
        <div
            className="table-hover-handle absolute z-50 flex items-center justify-center bg-white border border-gray-300 shadow-sm rounded-sm cursor-pointer hover:bg-gray-100 transition-colors"
            style={{
                left: `${hoveredTable.x}px`,
                top: `${hoveredTable.y}px`,
                width: '18px',
                height: '18px',
            }}
            onClick={handleSelectTable}
            title="Click to select table"
        >
            <MoveIcon className="w-3 h-3 text-gray-500" />
        </div>
    );
};
