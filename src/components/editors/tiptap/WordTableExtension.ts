import { Table } from '@tiptap/extension-table';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { CellSelection, goToNextCell } from '@tiptap/pm/tables';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

const wordTablePluginKey = new PluginKey('wordTable');

// Reduced edge size to not interfere with typing
const RESIZE_EDGE_SIZE = 10;

// Table interaction modes
type TableMode = 'none' | 'edit' | 'cell-select' | 'table-select';

// Table wrap modes (like Word)
export type TableWrapMode = 'inline' | 'floating';

// State for tracking table interactions
interface TableState {
  mode: TableMode;
  activeTable: HTMLElement | null;
  activeCell: HTMLElement | null;
  isResizingColumn: boolean;
  isResizingRow: boolean;
  isDragging: boolean;
}

const state: TableState = {
  mode: 'none',
  activeTable: null,
  activeCell: null,
  isResizingColumn: false,
  isResizingRow: false,
  isDragging: false,
};

// ========== EXTENDED TABLE CELL WITH ATTRIBUTES ==========
// Custom TableCell with shading and border attributes for copy-paste persistence
export const WordTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-background-color') || element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
      borderTop: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-top') || null,
        renderHTML: attributes => {
          if (!attributes.borderTop) return {};
          return { 'data-border-top': attributes.borderTop };
        },
      },
      borderBottom: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-bottom') || null,
        renderHTML: attributes => {
          if (!attributes.borderBottom) return {};
          return { 'data-border-bottom': attributes.borderBottom };
        },
      },
      borderLeft: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-left') || null,
        renderHTML: attributes => {
          if (!attributes.borderLeft) return {};
          return { 'data-border-left': attributes.borderLeft };
        },
      },
      borderRight: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-right') || null,
        renderHTML: attributes => {
          if (!attributes.borderRight) return {};
          return { 'data-border-right': attributes.borderRight };
        },
      },
    };
  },
});

export const WordTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.getAttribute('data-background-color') || element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return {
            'data-background-color': attributes.backgroundColor,
            style: `background-color: ${attributes.backgroundColor}`,
          };
        },
      },
      borderTop: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-top') || null,
        renderHTML: attributes => {
          if (!attributes.borderTop) return {};
          return { 'data-border-top': attributes.borderTop };
        },
      },
      borderBottom: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-bottom') || null,
        renderHTML: attributes => {
          if (!attributes.borderBottom) return {};
          return { 'data-border-bottom': attributes.borderBottom };
        },
      },
      borderLeft: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-left') || null,
        renderHTML: attributes => {
          if (!attributes.borderLeft) return {};
          return { 'data-border-left': attributes.borderLeft };
        },
      },
      borderRight: {
        default: null,
        parseHTML: element => element.getAttribute('data-border-right') || null,
        renderHTML: attributes => {
          if (!attributes.borderRight) return {};
          return { 'data-border-right': attributes.borderRight };
        },
      },
    };
  },
});

// ========== BORDER UTILITY FUNCTIONS ==========
export function getSelectedCells(): HTMLTableCellElement[] {
  // First try to get cells from actual CellSelection via DOM selectedCell class
  const selectedCells = document.querySelectorAll('.tiptap-table td.selectedCell, .tiptap-table th.selectedCell');
  if (selectedCells.length > 0) {
    return Array.from(selectedCells) as HTMLTableCellElement[];
  }

  // Fallback: get currently focused cell
  const focusedCell = document.querySelector('.tiptap-table td:focus-within, .tiptap-table th:focus-within') as HTMLTableCellElement;
  if (focusedCell) return [focusedCell];

  // Check for editing cell
  const editingCell = document.querySelector('.word-cell-editing') as HTMLTableCellElement;
  if (editingCell) return [editingCell];

  return [];
}

export function applyBorderToSelectedCells(borderType: 'all' | 'outer' | 'inner' | 'none' | 'top' | 'bottom' | 'left' | 'right', color: string = '#000000', width: string = '1px') {
  const cells = getSelectedCells();
  if (cells.length === 0) return;

  const table = cells[0].closest('table');
  if (!table) return;

  // Find bounds of selected cells
  const cellPositions = cells.map(cell => {
    const row = cell.parentElement as HTMLTableRowElement;
    return {
      cell,
      row: row.rowIndex,
      col: cell.cellIndex
    };
  });

  const minRow = Math.min(...cellPositions.map(p => p.row));
  const maxRow = Math.max(...cellPositions.map(p => p.row));
  const minCol = Math.min(...cellPositions.map(p => p.col));
  const maxCol = Math.max(...cellPositions.map(p => p.col));

  const borderStyle = `${width} solid ${color}`;
  const noBorder = 'none';

  cells.forEach(cell => {
    const row = (cell.parentElement as HTMLTableRowElement).rowIndex;
    const col = cell.cellIndex;

    const isTopEdge = row === minRow;
    const isBottomEdge = row === maxRow;
    const isLeftEdge = col === minCol;
    const isRightEdge = col === maxCol;

    switch (borderType) {
      case 'all':
        cell.style.borderTop = borderStyle;
        cell.style.borderBottom = borderStyle;
        cell.style.borderLeft = borderStyle;
        cell.style.borderRight = borderStyle;
        // Store as data attributes for copy-paste persistence
        cell.setAttribute('data-border-top', borderStyle);
        cell.setAttribute('data-border-bottom', borderStyle);
        cell.setAttribute('data-border-left', borderStyle);
        cell.setAttribute('data-border-right', borderStyle);
        break;

      case 'outer':
        cell.style.borderTop = isTopEdge ? borderStyle : noBorder;
        cell.style.borderBottom = isBottomEdge ? borderStyle : noBorder;
        cell.style.borderLeft = isLeftEdge ? borderStyle : noBorder;
        cell.style.borderRight = isRightEdge ? borderStyle : noBorder;
        if (isTopEdge) cell.setAttribute('data-border-top', borderStyle);
        if (isBottomEdge) cell.setAttribute('data-border-bottom', borderStyle);
        if (isLeftEdge) cell.setAttribute('data-border-left', borderStyle);
        if (isRightEdge) cell.setAttribute('data-border-right', borderStyle);
        break;

      case 'inner':
        cell.style.borderTop = !isTopEdge ? borderStyle : noBorder;
        cell.style.borderBottom = !isBottomEdge ? borderStyle : noBorder;
        cell.style.borderLeft = !isLeftEdge ? borderStyle : noBorder;
        cell.style.borderRight = !isRightEdge ? borderStyle : noBorder;
        break;

      case 'none':
        // Set transparent borders and add data attribute to indicate borderless
        cell.style.borderTop = 'none';
        cell.style.borderBottom = 'none';
        cell.style.borderLeft = 'none';
        cell.style.borderRight = 'none';
        cell.setAttribute('data-border-top', 'none');
        cell.setAttribute('data-border-bottom', 'none');
        cell.setAttribute('data-border-left', 'none');
        cell.setAttribute('data-border-right', 'none');
        cell.setAttribute('data-borderless', 'true');
        break;

      case 'top':
        cell.style.borderTop = borderStyle;
        cell.setAttribute('data-border-top', borderStyle);
        break;

      case 'bottom':
        cell.style.borderBottom = borderStyle;
        cell.setAttribute('data-border-bottom', borderStyle);
        break;

      case 'left':
        cell.style.borderLeft = borderStyle;
        cell.setAttribute('data-border-left', borderStyle);
        break;

      case 'right':
        cell.style.borderRight = borderStyle;
        cell.setAttribute('data-border-right', borderStyle);
        break;
    }
  });
}

export function applyShadingToSelectedCells(color: string) {
  const cells = getSelectedCells();
  cells.forEach(cell => {
    cell.style.backgroundColor = color || '';
    if (color) {
      cell.setAttribute('data-background-color', color);
    } else {
      cell.removeAttribute('data-background-color');
    }
  });
}

export function getTableState() {
  return state;
}

// Inject Word-style controls into table wrapper
function injectWordTableControls(tableWrapper: HTMLElement) {
  if (tableWrapper.querySelector('.word-table-move-handle')) return;

  // Move handle (top-left corner like Word)
  const moveHandle = document.createElement('div');
  moveHandle.className = 'word-table-move-handle';
  moveHandle.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`;
  moveHandle.title = '⊞ Klik & seret untuk memindahkan tabel';
  tableWrapper.appendChild(moveHandle);

  // 8-point resize handles
  const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  positions.forEach(pos => {
    const handle = document.createElement('div');
    handle.className = `word-table-resize-handle word-table-resize-${pos}`;
    handle.dataset.position = pos;
    tableWrapper.appendChild(handle);
  });
}

// Update table mode indicator
function updateModeIndicator(tableWrapper: HTMLElement, mode: TableMode) {
  let indicator = tableWrapper.querySelector('.word-table-mode-indicator') as HTMLElement;

  if (mode === 'none') {
    if (indicator) indicator.remove();
    return;
  }

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'word-table-mode-indicator';
    tableWrapper.appendChild(indicator);
  }

  const modeLabels = {
    'edit': '✎ Edit Cell',
    'cell-select': '⊞ Cell Selection',
    'table-select': '⊡ Table Selected',
  };

  indicator.textContent = modeLabels[mode] || '';
  indicator.dataset.mode = mode;
}

// Clear editing cell class
function clearEditingCell() {
  document.querySelectorAll('.word-cell-editing').forEach(cell => {
    cell.classList.remove('word-cell-editing');
  });
}

// Set active table mode
function setTableMode(mode: TableMode, tableWrapper?: HTMLElement | null) {
  // Clear previous state
  document.querySelectorAll('.tableWrapper').forEach(tw => {
    tw.classList.remove(
      'word-table-edit-mode',
      'word-table-select-mode',
      'word-table-object-mode',
      'word-cell-selection-active'
    );

    const indicator = tw.querySelector('.word-table-mode-indicator');
    if (indicator) indicator.remove();
  });

  if (mode !== 'edit') {
    clearEditingCell();
  }

  state.mode = mode;
  state.activeTable = tableWrapper || null;

  if (tableWrapper && mode !== 'none') {
    const modeClasses = {
      edit: 'word-table-edit-mode',
      'cell-select': 'word-table-select-mode',
      'table-select': 'word-table-object-mode',
    } as const;

    tableWrapper.classList.add(modeClasses[mode]);

    if (mode === 'cell-select') {
      tableWrapper.classList.add('word-cell-selection-active');
    }

    updateModeIndicator(tableWrapper, mode);
  }
}

// Focus cell and place cursor - force TextSelection + view.focus()
function focusCellForEditing(view: any, cell: HTMLTableCellElement, tableWrapper: HTMLElement) {
  try {
    // Find position inside the cell
    const cellPos = view.posAtDOM(cell, 0);
    if (typeof cellPos !== 'number' || cellPos < 0) {
      view.focus();
      return;
    }

    // Navigate to find first editable position
    let textPos = cellPos;
    for (let i = 0; i < 10; i++) {
      const resolved = view.state.doc.resolve(textPos);
      if (resolved.parent.isTextblock) {
        break;
      }
      textPos++;
    }

    // Create text selection at start of cell content
    const tr = view.state.tr.setSelection(TextSelection.create(view.state.doc, textPos));
    view.dispatch(tr);
    view.focus();

    // Update visual state
    clearEditingCell();
    cell.classList.add('word-cell-editing');
    state.activeCell = cell;
    setTableMode('edit', tableWrapper);
  } catch (e) {
    // If position finding fails, just focus the view
    view.focus();
  }
}

// Apply position from node attributes to wrapper
function applyTablePosition(tableWrapper: HTMLElement, attrs: any) {
  const wrapMode = attrs.wrapMode || 'inline';
  const posX = attrs.posX ?? null;
  const posY = attrs.posY ?? null;
  const zIndex = attrs.zIndex ?? null;

  if (wrapMode === 'floating') {
    tableWrapper.classList.add('table-floating');
    tableWrapper.classList.remove('table-inline');
    if (posX !== null) tableWrapper.style.left = `${posX}px`;
    if (posY !== null) tableWrapper.style.top = `${posY}px`;
    if (zIndex !== null) tableWrapper.style.zIndex = String(zIndex);
  } else {
    tableWrapper.classList.add('table-inline');
    tableWrapper.classList.remove('table-floating');
    tableWrapper.style.left = '';
    tableWrapper.style.top = '';
    tableWrapper.style.zIndex = '';
  }
}

// Save position back to node attributes
function saveTablePosition(view: any, tableWrapper: HTMLElement, pos: { x: number; y: number }) {
  try {
    const table = tableWrapper.querySelector('table');
    if (!table) return;

    const tablePos = view.posAtDOM(table, 0);
    if (typeof tablePos !== 'number') return;

    // Find the table node in the document
    const $pos = view.state.doc.resolve(tablePos);
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'table') {
        const nodePos = $pos.before(d);
        const tr = view.state.tr.setNodeMarkup(nodePos, undefined, {
          ...node.attrs,
          posX: pos.x,
          posY: pos.y,
        });
        view.dispatch(tr);
        break;
      }
    }
  } catch (e) {
    console.warn('Failed to save table position', e);
  }
}

// Save column widths to all cells in the column
function saveColumnWidths(view: any, table: HTMLTableElement, colIndex: number, newWidth: number) {
  try {
    const tablePos = view.posAtDOM(table, 0);
    if (typeof tablePos !== 'number') return;

    const $pos = view.state.doc.resolve(tablePos);

    // Find table node
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'table') {
        const tableStart = $pos.start(d);

        // Iterate through rows and update colwidth attribute
        const tr = view.state.tr;
        let modified = false;

        node.content.forEach((rowNode: any, offset: number) => {
          const cellNode = rowNode.child(colIndex);
          if (cellNode) {
            // Calculate absolute position of the cell
            // tableStart + 1 (table start) + offset (row start) + 1 (row start tag) + cell offset
            // Actually it's safer to use map logic or relative offsets if we had map
            // Simplified: calculate pos based on node sizes
            let currentPos = tableStart + 1; // inside table
            for (let i = 0; i < offset; i++) currentPos += node.child(i).nodeSize; // skip prev rows

            currentPos += 1; // inside row
            for (let j = 0; j < colIndex; j++) currentPos += rowNode.child(j).nodeSize; // skip prev cells

            // Check if cell exists at this pos
            if (currentPos) {
              const colWidths = cellNode.attrs.colwidth || [];
              // Update or set colwidth. Note: colwidth is array of numbers
              const newColWidths = [newWidth];

              tr.setNodeMarkup(currentPos, undefined, {
                ...cellNode.attrs,
                colwidth: newColWidths
              });
              modified = true;
            }
          }
        });

        if (modified) view.dispatch(tr);
        break;
      }
    }
  } catch (e) {
    console.warn('Failed to save column widths', e);
  }
}

// Save table dimensions (width and/or row heights)
function saveTableDimensions(view: any, tableWrapper: HTMLElement, newWidth?: number, newHeight?: number) {
  // Implementation similar to saveTablePosition but for width/height
  // For row height, we need to save individual row attribute
  // For now, let's focus on table width
  if (newWidth) {
    try {
      const table = tableWrapper.querySelector('table');
      if (!table) return;
      const tablePos = view.posAtDOM(table, 0);
      if (typeof tablePos !== 'number') return;

      const $pos = view.state.doc.resolve(tablePos);
      for (let d = $pos.depth; d > 0; d--) {
        const node = $pos.node(d);
        if (node.type.name === 'table') {
          const pos = $pos.before(d);
          const tr = view.state.tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            tableWidth: String(newWidth) + 'px'
          });
          view.dispatch(tr);
          break;
        }
      }
    } catch (e) { console.warn('Failed to save table width', e); }
  }
}

export const WordTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // Wrap mode: inline (normal flow) or floating (absolute position)
      wrapMode: {
        default: 'inline',
        parseHTML: element => element.getAttribute('data-wrap-mode') || 'inline',
        renderHTML: attributes => {
          return { 'data-wrap-mode': attributes.wrapMode };
        },
      },
      // Position for floating tables
      posX: {
        default: null,
        parseHTML: element => {
          const val = element.getAttribute('data-pos-x');
          return val ? parseFloat(val) : null;
        },
        renderHTML: attributes => {
          if (attributes.posX === null) return {};
          return { 'data-pos-x': String(attributes.posX) };
        },
      },
      posY: {
        default: null,
        parseHTML: element => {
          const val = element.getAttribute('data-pos-y');
          return val ? parseFloat(val) : null;
        },
        renderHTML: attributes => {
          if (attributes.posY === null) return {};
          return { 'data-pos-y': String(attributes.posY) };
        },
      },
      // Z-index for layering
      zIndex: {
        default: null,
        parseHTML: element => {
          const val = element.getAttribute('data-z-index');
          return val ? parseInt(val, 10) : null;
        },
        renderHTML: attributes => {
          if (attributes.zIndex === null) return {};
          return { 'data-z-index': String(attributes.zIndex) };
        },
      },
      // Table width
      tableWidth: {
        default: null,
        parseHTML: element => element.getAttribute('data-table-width') || null,
        renderHTML: attributes => {
          if (!attributes.tableWidth) return {};
          return { 'data-table-width': attributes.tableWidth };
        },
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Tab - move to next cell
      Tab: () => {
        if (!this.editor.isActive('table')) return false;
        return goToNextCell(1)(this.editor.state, this.editor.view.dispatch);
      },
      // Shift+Tab - move to previous cell
      'Shift-Tab': () => {
        if (!this.editor.isActive('table')) return false;
        return goToNextCell(-1)(this.editor.state, this.editor.view.dispatch);
      },
      // Escape - exit modes
      Escape: () => {
        const tableWrapper = document.querySelector('.tableWrapper.word-table-edit-mode, .tableWrapper.word-table-select-mode, .tableWrapper.word-table-object-mode') as HTMLElement;
        if (!tableWrapper) return false;

        if (state.mode === 'cell-select') {
          setTableMode('edit', tableWrapper);
          return true;
        } else if (state.mode === 'edit') {
          setTableMode('table-select', tableWrapper);
          return true;
        } else if (state.mode === 'table-select') {
          setTableMode('none');
          return true;
        }
        return false;
      },
      // Ctrl+A - select all cells when in table
      'Mod-a': () => {
        if (!this.editor.isActive('table')) return false;

        const tableWrapper = document.querySelector('.tableWrapper.word-table-edit-mode, .tableWrapper.word-table-select-mode') as HTMLElement;
        if (!tableWrapper) return false;

        const table = tableWrapper.querySelector('table');
        if (!table) return false;

        // Find table position and create CellSelection for all cells
        try {
          const view = this.editor.view;
          const cells = table.querySelectorAll('td, th');
          if (cells.length === 0) return false;

          const firstCell = cells[0] as HTMLElement;
          const lastCell = cells[cells.length - 1] as HTMLElement;

          const firstPos = view.posAtDOM(firstCell, 0);
          const lastPos = view.posAtDOM(lastCell, 0);

          const $first = view.state.doc.resolve(firstPos);
          const $last = view.state.doc.resolve(lastPos);

          const cellSelection = CellSelection.create(view.state.doc, $first.pos, $last.pos);
          const tr = view.state.tr.setSelection(cellSelection);
          view.dispatch(tr);

          setTableMode('cell-select', tableWrapper);
          return true;
        } catch {
          return false;
        }
      },
      // Delete - delete table when in table-select mode
      Delete: () => {
        if (state.mode === 'table-select' && state.activeTable) {
          const table = state.activeTable.querySelector('table');
          if (table) {
            this.editor.commands.deleteTable();
            setTableMode('none');
            return true;
          }
        }
        return false;
      },
      Backspace: () => {
        if (state.mode === 'table-select' && state.activeTable) {
          const table = state.activeTable.querySelector('table');
          if (table) {
            this.editor.commands.deleteTable();
            setTableMode('none');
            return true;
          }
        }
        return false;
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setTableWrapMode: (mode: TableWrapMode) => ({ tr, dispatch, state: editorState }) => {
        // Find the current table
        const { selection } = editorState;
        const $pos = selection.$anchor;

        for (let d = $pos.depth; d > 0; d--) {
          const node = $pos.node(d);
          if (node.type.name === 'table') {
            const pos = $pos.before(d);
            if (dispatch) {
              const newAttrs = {
                ...node.attrs,
                wrapMode: mode,
                posX: mode === 'floating' ? (node.attrs.posX ?? 20) : null,
                posY: mode === 'floating' ? (node.attrs.posY ?? 20) : null,
                zIndex: mode === 'floating' ? (node.attrs.zIndex ?? 10) : null,
              };
              tr.setNodeMarkup(pos, undefined, newAttrs);
              dispatch(tr);
            }
            return true;
          }
        }
        return false;
      },
      setTableZIndex: (zIndex: number) => ({ tr, dispatch, state: editorState }) => {
        const { selection } = editorState;
        const $pos = selection.$anchor;

        for (let d = $pos.depth; d > 0; d--) {
          const node = $pos.node(d);
          if (node.type.name === 'table') {
            const pos = $pos.before(d);
            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, zIndex });
              dispatch(tr);
            }
            return true;
          }
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    const plugins = this.parent?.() || [];
    const editor = this.editor;

    const wordTablePlugin = new Plugin({
      key: wordTablePluginKey,
      view(editorView) {
        // Listen for custom move event from context menu
        const handleStartMove = () => {
          const activeTable = editorView.dom.querySelector('.tableWrapper.table-floating, .tableWrapper:has(table[data-wrap-mode="floating"])') as HTMLElement;
          if (!activeTable) {
            // Try to find any active/selected table
            const anyTable = editorView.dom.querySelector('.tableWrapper.word-table-active') as HTMLElement;
            if (anyTable) {
              // Trigger move mode on this table
              setTableMode('table-select', anyTable);
              state.isDragging = true;

              anyTable.classList.add('word-table-dragging');
              document.body.style.cursor = 'move';
              document.body.style.userSelect = 'none';

              const initialLeft = parseFloat(anyTable.style.left) || 20;
              const initialTop = parseFloat(anyTable.style.top) || 20;

              // Create position indicator
              const indicator = document.createElement('div');
              indicator.className = 'word-table-position-indicator';
              indicator.textContent = `X: ${Math.round(initialLeft)}px, Y: ${Math.round(initialTop)}px`;
              anyTable.appendChild(indicator);

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const parent = anyTable.closest('.ProseMirror') as HTMLElement;
                if (!parent) return;

                const parentRect = parent.getBoundingClientRect();
                const newLeft = Math.max(0, moveEvent.clientX - parentRect.left - 50);
                const newTop = Math.max(0, moveEvent.clientY - parentRect.top - 20);

                anyTable.style.left = `${newLeft}px`;
                anyTable.style.top = `${newTop}px`;

                indicator.textContent = `X: ${Math.round(newLeft)}px, Y: ${Math.round(newTop)}px`;
              };

              const handleMouseUp = () => {
                anyTable.classList.remove('word-table-dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                state.isDragging = false;

                // Save final position
                const finalLeft = parseFloat(anyTable.style.left) || 0;
                const finalTop = parseFloat(anyTable.style.top) || 0;
                saveTablePosition(editorView, anyTable, { x: finalLeft, y: finalTop });

                if (indicator.parentNode) {
                  setTimeout(() => indicator.remove(), 500);
                }

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }
          }
        };

        window.addEventListener('tiptap-table-start-move', handleStartMove);

        return {
          update(view) {
            // Inject controls into all table wrappers
            const tableWrappers = view.dom.querySelectorAll('.tableWrapper');
            tableWrappers.forEach((wrapper) => {
              const htmlWrapper = wrapper as HTMLElement;
              injectWordTableControls(htmlWrapper);

              // Get table and read attributes
              const table = htmlWrapper.querySelector('table');
              if (table) {
                const wrapMode = table.getAttribute('data-wrap-mode') || 'inline';
                const posX = table.getAttribute('data-pos-x');
                const posY = table.getAttribute('data-pos-y');
                const zIndex = table.getAttribute('data-z-index');
                const tableWidth = table.getAttribute('data-table-width');

                // Apply position based on wrap mode
                applyTablePosition(htmlWrapper, {
                  wrapMode,
                  posX: posX ? parseFloat(posX) : null,
                  posY: posY ? parseFloat(posY) : null,
                  zIndex: zIndex ? parseInt(zIndex, 10) : null,
                });

                // Apply table width
                if (tableWidth) {
                  table.style.width = tableWidth;
                }
              }

              // Apply stored border/shading from data attributes
              const cells = htmlWrapper.querySelectorAll('td[data-background-color], th[data-background-color], td[data-border-top], th[data-border-top], td[data-borderless], th[data-borderless]');
              cells.forEach((cell) => {
                const htmlCell = cell as HTMLElement;
                const bgColor = htmlCell.getAttribute('data-background-color');
                if (bgColor) htmlCell.style.backgroundColor = bgColor;

                // Check if borderless
                const isBorderless = htmlCell.getAttribute('data-borderless') === 'true';
                if (isBorderless) {
                  htmlCell.style.borderTop = 'none';
                  htmlCell.style.borderBottom = 'none';
                  htmlCell.style.borderLeft = 'none';
                  htmlCell.style.borderRight = 'none';
                } else {
                  // Apply individual borders
                  const borderTop = htmlCell.getAttribute('data-border-top');
                  const borderBottom = htmlCell.getAttribute('data-border-bottom');
                  const borderLeft = htmlCell.getAttribute('data-border-left');
                  const borderRight = htmlCell.getAttribute('data-border-right');

                  if (borderTop && borderTop !== 'none') htmlCell.style.borderTop = borderTop;
                  if (borderBottom && borderBottom !== 'none') htmlCell.style.borderBottom = borderBottom;
                  if (borderLeft && borderLeft !== 'none') htmlCell.style.borderLeft = borderLeft;
                  if (borderRight && borderRight !== 'none') htmlCell.style.borderRight = borderRight;
                }
              });
            });

            // Sync mode based on actual ProseMirror selection
            const { selection } = view.state;
            if (selection instanceof CellSelection) {
              const tableWrapper = view.dom.querySelector('.tableWrapper:has(.selectedCell)') as HTMLElement;
              if (tableWrapper && state.mode !== 'cell-select') {
                setTableMode('cell-select', tableWrapper);
              }
            }
          },
          destroy() {
            window.removeEventListener('tiptap-table-start-move', handleStartMove);
          },
        };
      },
      addKeyboardShortcuts() {
        return {
          Backspace: () => {
            const { selection } = this.editor.state;
            // Check if we are in table selection mode via our custom state
            // OR if the selection is a NodeSelection on a table
            if (state.mode === 'table-select' && state.activeTable) {
              this.editor.commands.deleteTable();
              setTableMode('none');
              return true;
            }
            return false;
          },
          Delete: () => {
            if (state.mode === 'table-select' && state.activeTable) {
              this.editor.commands.deleteTable();
              setTableMode('none');
              return true;
            }
            return false;
          },
        };
      },
      props: {
        handleDOMEvents: {
          mousedown: (view, event) => {
            const target = event.target as HTMLElement;

            // ========== MOVE HANDLE - Table Object Mode ==========
            if (target.classList.contains('word-table-move-handle') || target.closest('.word-table-move-handle')) {
              event.preventDefault();
              event.stopPropagation();

              const tableWrapper = target.closest('.tableWrapper') as HTMLElement;
              if (!tableWrapper) return false;

              setTableMode('table-select', tableWrapper);
              state.isDragging = true;

              // Calculate start position relative to offset parent
              const offsetParent = tableWrapper.offsetParent as HTMLElement || document.body;
              const parentRect = offsetParent.getBoundingClientRect();
              const wrapperRect = tableWrapper.getBoundingClientRect();

              // If inline, capture current visual position to prevent jumping
              // For floating, use existing style or rect
              let initialLeft = wrapperRect.left - parentRect.left + offsetParent.scrollLeft;
              let initialTop = wrapperRect.top - parentRect.top + offsetParent.scrollTop;

              // Adjust for margins if they are included in rect but we position relative to box
              // Actually, simply sticking to current visual position is best key

              // Force absolute positioning visually immediately (without ProseMirror transaction yet)
              tableWrapper.style.position = 'absolute';
              tableWrapper.style.left = `${initialLeft}px`;
              tableWrapper.style.top = `${initialTop}px`;
              tableWrapper.style.width = `${wrapperRect.width}px`; // Fix width to prevent collapse
              tableWrapper.style.zIndex = '1000'; // High z-index while dragging
              tableWrapper.classList.add('word-table-dragging');
              tableWrapper.classList.add('table-floating');
              tableWrapper.classList.remove('table-inline');

              const startX = event.clientX;
              const startY = event.clientY;

              // Create position indicator
              const indicator = document.createElement('div');
              indicator.className = 'word-table-position-indicator';
              indicator.textContent = `X: ${Math.round(initialLeft)}px, Y: ${Math.round(initialTop)}px`;
              tableWrapper.appendChild(indicator);

              document.body.style.cursor = 'move';
              document.body.style.userSelect = 'none';

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                const newLeft = initialLeft + deltaX;
                const newTop = initialTop + deltaY;

                tableWrapper.style.left = `${newLeft}px`;
                tableWrapper.style.top = `${newTop}px`;

                indicator.textContent = `X: ${Math.round(newLeft)}px, Y: ${Math.round(newTop)}px`;
              };

              const handleMouseUp = (upEvent: MouseEvent) => {
                tableWrapper.classList.remove('word-table-dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                state.isDragging = false;

                // Reset temporary z-index (will be handled by attribute save)
                tableWrapper.style.zIndex = '';

                // Save final position and mode to node attributes
                const finalLeft = parseFloat(tableWrapper.style.left) || 0;
                const finalTop = parseFloat(tableWrapper.style.top) || 0;

                // Use helper to save wrapMode AND position
                try {
                  const table = tableWrapper.querySelector('table');
                  if (table) {
                    const tablePos = view.posAtDOM(table, 0);
                    if (typeof tablePos === 'number') {
                      const $pos = view.state.doc.resolve(tablePos);
                      for (let d = $pos.depth; d > 0; d--) {
                        const node = $pos.node(d);
                        if (node.type.name === 'table') {
                          const nodePos = $pos.before(d);
                          const tr = view.state.tr.setNodeMarkup(nodePos, undefined, {
                            ...node.attrs,
                            wrapMode: 'floating',
                            posX: finalLeft,
                            posY: finalTop,
                            zIndex: 10
                          });
                          view.dispatch(tr);
                          break;
                        }
                      }
                    }
                  }
                } catch (e) { console.warn('Failed to save table placement', e); }

                if (indicator.parentNode) {
                  setTimeout(() => {
                    if (indicator.parentNode) indicator.remove();
                  }, 500);
                }

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);

              return true;
            }

            // ========== RESIZE HANDLES - Table Object Mode ==========
            if (target.classList.contains('word-table-resize-handle')) {
              event.preventDefault();
              event.stopPropagation();

              const tableWrapper = target.closest('.tableWrapper') as HTMLElement;
              const table = tableWrapper?.querySelector('table') as HTMLTableElement;
              if (!tableWrapper || !table) return false;

              setTableMode('table-select', tableWrapper);

              const position = target.dataset.position || 'se';
              const startX = event.clientX;
              const startY = event.clientY;

              const initialWidth = table.offsetWidth;
              const initialHeight = table.offsetHeight;
              const initialLeft = parseFloat(tableWrapper.style.left) || 0;
              const initialTop = parseFloat(tableWrapper.style.top) || 0;

              // Create size indicator
              const indicator = document.createElement('div');
              indicator.className = 'word-table-size-indicator';
              indicator.textContent = `${initialWidth} × ${initialHeight}`;
              tableWrapper.appendChild(indicator);

              tableWrapper.classList.add('word-table-resizing');
              document.body.style.userSelect = 'none';

              const cursors: Record<string, string> = {
                'nw': 'nwse-resize', 'n': 'ns-resize', 'ne': 'nesw-resize',
                'w': 'ew-resize', 'e': 'ew-resize',
                'sw': 'nesw-resize', 's': 'ns-resize', 'se': 'nwse-resize',
              };
              document.body.style.cursor = cursors[position];

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;

                let newWidth = initialWidth;
                let newHeight = initialHeight;
                let newLeft = initialLeft;
                let newTop = initialTop;

                const wrapMode = table.getAttribute('data-wrap-mode') || 'inline';

                if (position.includes('e')) newWidth = Math.max(100, initialWidth + deltaX);
                if (position.includes('w')) {
                  newWidth = Math.max(100, initialWidth - deltaX);
                  if (wrapMode === 'floating') {
                    newLeft = initialLeft + (initialWidth - newWidth);
                  }
                }
                if (position.includes('s')) newHeight = Math.max(50, initialHeight + deltaY);
                if (position.includes('n')) {
                  newHeight = Math.max(50, initialHeight - deltaY);
                  if (wrapMode === 'floating') {
                    newTop = initialTop + (initialHeight - newHeight);
                  }
                }

                table.style.width = `${newWidth}px`;
                table.style.minHeight = `${newHeight}px`;

                if (wrapMode === 'floating') {
                  tableWrapper.style.left = `${newLeft}px`;
                  tableWrapper.style.top = `${newTop}px`;
                }

                indicator.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)}`;
              };

              const handleMouseUp = () => {
                tableWrapper.classList.remove('word-table-resizing');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                // Save dimensions
                const finalWidth = parseFloat(table.style.width);
                const finalHeight = parseFloat(table.style.minHeight);
                if (finalWidth) saveTableDimensions(view, tableWrapper, finalWidth, finalHeight);

                setTimeout(() => {
                  if (indicator.parentNode) indicator.remove();
                }, 500);

                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);

              return true;
            }

            // ========== CELL INTERACTIONS ==========
            const cell = target.closest('td, th') as HTMLTableCellElement;

            if (cell) {
              const cellRect = cell.getBoundingClientRect();
              const tableWrapper = cell.closest('.tableWrapper') as HTMLElement;
              const table = cell.closest('table') as HTMLTableElement;

              if (!tableWrapper || !table) return false;

              // Edge detection for resize - dynamic zone based on cell width
              // This prevents resize handles from covering text in narrow cells (common in imports)
              const edgeSize = Math.min(RESIZE_EDGE_SIZE, cellRect.width / 3);
              const isNearBottomEdge = event.clientY > cellRect.bottom - edgeSize;
              const isNearRightEdge = event.clientX > cellRect.right - edgeSize;

              // ========== ROW HEIGHT RESIZE ==========
              if (isNearBottomEdge && !isNearRightEdge) {
                event.preventDefault();
                event.stopPropagation();

                const row = cell.closest('tr') as HTMLTableRowElement;
                if (!row) return false;

                setTableMode('table-select', tableWrapper);
                state.isResizingRow = true;

                const startY = event.clientY;
                const initialHeight = row.offsetHeight;

                const indicator = document.createElement('div');
                indicator.className = 'word-table-row-indicator';
                indicator.textContent = `Height: ${initialHeight}px`;
                tableWrapper.appendChild(indicator);

                const resizeLine = document.createElement('div');
                resizeLine.className = 'word-resize-line-horizontal';
                resizeLine.style.cssText = `
                  position: fixed;
                  left: ${table.getBoundingClientRect().left}px;
                  top: ${event.clientY}px;
                  width: ${table.offsetWidth}px;
                  height: 3px;
                  background: linear-gradient(90deg, transparent, #3b82f6, transparent);
                  z-index: 1000;
                  pointer-events: none;
                `;
                document.body.appendChild(resizeLine);

                document.body.style.cursor = 'row-resize';
                document.body.style.userSelect = 'none';

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaY = moveEvent.clientY - startY;
                  const newHeight = Math.max(24, initialHeight + deltaY);
                  row.style.height = `${newHeight}px`;

                  const cells = row.querySelectorAll('td, th');
                  cells.forEach((c: Element) => {
                    (c as HTMLElement).style.height = `${newHeight}px`;
                    (c as HTMLElement).style.minHeight = `${newHeight}px`;
                  });

                  resizeLine.style.top = `${moveEvent.clientY}px`;
                  indicator.textContent = `Height: ${Math.round(newHeight)}px`;
                };

                const handleMouseUp = () => {
                  document.body.style.cursor = '';
                  document.body.style.userSelect = '';
                  state.isResizingRow = false;

                  resizeLine.remove();
                  setTimeout(() => {
                    if (indicator.parentNode) indicator.remove();
                  }, 400);

                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);

                return true;
              }

              // ========== COLUMN WIDTH RESIZE ==========
              if (isNearRightEdge && !isNearBottomEdge) {
                event.preventDefault();
                event.stopPropagation();

                setTableMode('table-select', tableWrapper);
                state.isResizingColumn = true;

                const startX = event.clientX;
                const colIndex = cell.cellIndex;

                const rows = table.querySelectorAll('tr');
                const columnCells: HTMLTableCellElement[] = [];
                rows.forEach(row => {
                  const cells = row.querySelectorAll('td, th');
                  if (cells[colIndex]) {
                    columnCells.push(cells[colIndex] as HTMLTableCellElement);
                  }
                });

                if (columnCells.length === 0) return false;
                const initialWidth = columnCells[0].offsetWidth;

                const indicator = document.createElement('div');
                indicator.className = 'word-table-col-indicator';
                indicator.textContent = `Width: ${initialWidth}px`;
                tableWrapper.appendChild(indicator);

                const resizeLine = document.createElement('div');
                resizeLine.className = 'word-resize-line-vertical';
                resizeLine.style.cssText = `
                  position: fixed;
                  top: ${table.getBoundingClientRect().top}px;
                  left: ${event.clientX}px;
                  height: ${table.offsetHeight}px;
                  width: 3px;
                  background: linear-gradient(180deg, transparent, #3b82f6, transparent);
                  z-index: 1000;
                  pointer-events: none;
                `;
                document.body.appendChild(resizeLine);

                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  const newWidth = Math.max(40, initialWidth + deltaX);

                  columnCells.forEach(c => {
                    c.style.width = `${newWidth}px`;
                    c.style.minWidth = `${newWidth}px`;
                    c.style.maxWidth = `${newWidth}px`;
                  });

                  resizeLine.style.left = `${moveEvent.clientX}px`;
                  indicator.textContent = `Width: ${Math.round(newWidth)}px`;
                };

                const handleMouseUp = () => {
                  document.body.style.cursor = '';
                  document.body.style.userSelect = '';
                  state.isResizingColumn = false;

                  if (columnCells.length > 0) {
                    const finalWidth = parseFloat(columnCells[0].style.width);
                    if (finalWidth) saveColumnWidths(view, table, colIndex, finalWidth);
                  }

                  resizeLine.remove();
                  setTimeout(() => {
                    if (indicator.parentNode) indicator.remove();
                  }, 400);

                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);

                return true;
              }

              // ========== SINGLE CLICK - EDIT CELL IMMEDIATELY ==========
              // Shift+Click for range selection using CellSelection
              if (event.shiftKey && state.activeCell) {
                event.preventDefault();
                try {
                  const anchorPos = view.posAtDOM(state.activeCell, 0);
                  const headPos = view.posAtDOM(cell, 0);

                  const $anchor = view.state.doc.resolve(anchorPos);
                  const $head = view.state.doc.resolve(headPos);

                  const cellSelection = CellSelection.create(view.state.doc, $anchor.pos, $head.pos);
                  const tr = view.state.tr.setSelection(cellSelection);
                  view.dispatch(tr);

                  setTableMode('cell-select', tableWrapper);
                  return true;
                } catch {
                  return false;
                }
              }

              // ========== CELL CLICK - ALLOW NATIVE TEXT SELECTION ==========
              // Do NOT enforce edit mode here, let ProseMirror handle focus naturally
              // Only set active cell for potential drag operations
              clearEditingCell();
              cell.classList.add('word-cell-editing');
              state.activeCell = cell;
              // setTableMode('edit', tableWrapper); // Removed to prevent interference with text selection

              // Setup for potential multi-cell drag selection
              const startX = event.clientX;
              const startY = event.clientY;
              let hasDraggedCells = false;
              let dragAnchorPos: number | null = null;

              try {
                dragAnchorPos = view.posAtDOM(cell, 0);
              } catch {
                dragAnchorPos = null;
              }

              const handleCellDrag = (moveEvent: MouseEvent) => {
                // Check if left button is still held down
                if (moveEvent.buttons !== 1) {
                  handleCellDragEnd();
                  return;
                }

                const deltaX = Math.abs(moveEvent.clientX - startX);
                const deltaY = Math.abs(moveEvent.clientY - startY);

                // Higher threshold for cell selection to prevent accidental triggers during text selection
                // 15px allows for some jitter when clicking
                const DRAG_THRESHOLD = 15;

                // Only start multi-cell selection if cursor moves significantly
                if ((deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) && dragAnchorPos !== null) {
                  const elemUnderCursor = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
                  const targetCell = elemUnderCursor?.closest('td, th') as HTMLTableCellElement;

                  // Only trigger cell selection if we've moved to a DIFFERENT cell
                  if (targetCell && targetCell !== cell && targetCell.closest('table') === table) {
                    hasDraggedCells = true;

                    // Explicitly clear existing ranges to ensure clean cell selection state
                    const selection = window.getSelection();
                    if (selection) selection.removeAllRanges();

                    try {
                      const headPos = view.posAtDOM(targetCell, 0);
                      const $anchor = view.state.doc.resolve(dragAnchorPos);
                      const $head = view.state.doc.resolve(headPos);

                      const cellSelection = CellSelection.create(view.state.doc, $anchor.pos, $head.pos);
                      const tr = view.state.tr.setSelection(cellSelection);
                      view.dispatch(tr);

                      clearEditingCell();
                      setTableMode('cell-select', tableWrapper);
                    } catch {
                      // Ignore errors
                    }
                  }
                }
              };

              const handleCellDragEnd = () => {
                document.removeEventListener('mousemove', handleCellDrag);
                document.removeEventListener('mouseup', handleCellDragEnd);

                // If NO cells were dragged (simple click), ensure we are in a good state for editing
                if (!hasDraggedCells) {
                  setTableMode('edit', tableWrapper);
                  // Explicitly focus - this might be redundant but safe
                  if (!view.hasFocus()) view.focus();
                }
              };

              document.addEventListener('mousemove', handleCellDrag);
              document.addEventListener('mouseup', handleCellDragEnd);

              // Return FALSE to allow native ProseMirror text selection within cells
              return false;
            }

            // ========== CLICK OUTSIDE TABLE ==========
            if (!target.closest('.tableWrapper')) {
              setTableMode('none');
              clearEditingCell();
            }

            return false;
          },

          // Handle cursor change on hover
          mousemove: (view, event) => {
            if (state.isDragging || state.isResizingColumn || state.isResizingRow) return false;

            const target = event.target as HTMLElement;
            const cell = target.closest('td, th') as HTMLTableCellElement;

            if (cell) {
              const cellRect = cell.getBoundingClientRect();

              // Dynamic edge size here too
              const edgeSize = Math.min(RESIZE_EDGE_SIZE, cellRect.width / 3);

              const isNearRightEdge = event.clientX > cellRect.right - edgeSize;
              const isNearBottomEdge = event.clientY > cellRect.bottom - edgeSize;

              if (isNearRightEdge && !isNearBottomEdge) {
                cell.style.cursor = 'col-resize';
              } else if (isNearBottomEdge && !isNearRightEdge) {
                cell.style.cursor = 'row-resize';
              } else {
                cell.style.cursor = 'text';
              }
            }

            return false;
          },
        },
      },
    });

    return [...plugins, wordTablePlugin];
  },
});

export default WordTable;

// Extend TipTap Commands interface for TypeScript
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wordTable: {
      setTableWrapMode: (mode: TableWrapMode) => ReturnType;
      setTableZIndex: (zIndex: number) => ReturnType;
    };
  }
}
