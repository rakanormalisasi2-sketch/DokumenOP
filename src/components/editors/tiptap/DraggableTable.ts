import { Table } from '@tiptap/extension-table';
import { Plugin, PluginKey } from '@tiptap/pm/state';

const draggableTablePluginKey = new PluginKey('draggableTable');

// Inject drag handle and resize handles into table wrapper
function injectTableControls(tableWrapper: HTMLElement) {
  // Check if already injected
  if (tableWrapper.querySelector('.table-drag-handle')) return;
  
  // Create drag handle
  const dragHandle = document.createElement('div');
  dragHandle.className = 'table-drag-handle';
  dragHandle.innerHTML = '⋮⋮';
  dragHandle.title = 'Seret untuk memindahkan tabel';
  tableWrapper.appendChild(dragHandle);
  
  // Create 8-point resize handles
  const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
  positions.forEach(pos => {
    const handle = document.createElement('div');
    handle.className = `table-resize-handle table-resize-${pos}`;
    handle.dataset.position = pos;
    tableWrapper.appendChild(handle);
  });
}

export const DraggableTable = Table.extend({
  addProseMirrorPlugins() {
    const plugins = this.parent?.() || [];
    
    // Plugin to inject controls and handle drag/resize
    const controlsPlugin = new Plugin({
      key: draggableTablePluginKey,
      view() {
        return {
          update(view) {
            // Find all table wrappers and inject controls
            const tableWrappers = view.dom.querySelectorAll('.tableWrapper');
            tableWrappers.forEach((wrapper) => {
              injectTableControls(wrapper as HTMLElement);
              
              // Set initial position if not set
              const htmlWrapper = wrapper as HTMLElement;
              if (!htmlWrapper.style.left && !htmlWrapper.style.top) {
                htmlWrapper.style.left = '20px';
                htmlWrapper.style.top = '20px';
              }
            });
          },
        };
      },
      props: {
        handleDOMEvents: {
          mousedown: (view, event) => {
            const target = event.target as HTMLElement;
            
            // Handle drag
            if (target.classList.contains('table-drag-handle')) {
              event.preventDefault();
              event.stopPropagation();
              
              const tableWrapper = target.closest('.tableWrapper') as HTMLElement;
              if (!tableWrapper) return false;
              
              const startX = event.clientX;
              const startY = event.clientY;
              
              const initialLeft = parseFloat(tableWrapper.style.left) || 20;
              const initialTop = parseFloat(tableWrapper.style.top) || 20;
              
              // Create position indicator
              const indicator = document.createElement('div');
              indicator.style.cssText = `
                position: absolute;
                bottom: -28px;
                left: 50%;
                transform: translateX(-50%);
                padding: 3px 10px;
                background: hsl(220 25% 10%);
                color: white;
                font-size: 11px;
                font-family: monospace;
                border-radius: 4px;
                white-space: nowrap;
                z-index: 50;
                pointer-events: none;
              `;
              tableWrapper.appendChild(indicator);
              
              tableWrapper.classList.add('table-dragging');
              tableWrapper.style.zIndex = '100';
              tableWrapper.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)';
              document.body.style.cursor = 'move';
              document.body.style.userSelect = 'none';
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                
                const newLeft = Math.max(0, initialLeft + deltaX);
                const newTop = Math.max(0, initialTop + deltaY);
                
                tableWrapper.style.left = `${newLeft}px`;
                tableWrapper.style.top = `${newTop}px`;
                
                indicator.textContent = `X: ${Math.round(newLeft)}px, Y: ${Math.round(newTop)}px`;
              };
              
              const handleMouseUp = () => {
                tableWrapper.classList.remove('table-dragging');
                tableWrapper.style.zIndex = '10';
                tableWrapper.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                if (indicator.parentNode) {
                  indicator.parentNode.removeChild(indicator);
                }
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
              
              return true;
            }
            
            // Handle resize
            if (target.classList.contains('table-resize-handle')) {
              event.preventDefault();
              event.stopPropagation();
              
              const tableWrapper = target.closest('.tableWrapper') as HTMLElement;
              const table = tableWrapper?.querySelector('table') as HTMLTableElement;
              if (!tableWrapper || !table) return false;
              
              const position = target.dataset.position || 'se';
              const startX = event.clientX;
              const startY = event.clientY;
              
              const initialWidth = table.offsetWidth;
              const initialHeight = table.offsetHeight;
              const initialLeft = parseFloat(tableWrapper.style.left) || 20;
              const initialTop = parseFloat(tableWrapper.style.top) || 20;
              
              // Create size indicator
              const indicator = document.createElement('div');
              indicator.style.cssText = `
                position: absolute;
                bottom: -28px;
                left: 50%;
                transform: translateX(-50%);
                padding: 3px 10px;
                background: hsl(220 25% 10%);
                color: white;
                font-size: 11px;
                font-family: monospace;
                border-radius: 4px;
                white-space: nowrap;
                z-index: 50;
                pointer-events: none;
              `;
              tableWrapper.appendChild(indicator);
              
              document.body.style.userSelect = 'none';
              
              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                
                let newWidth = initialWidth;
                let newHeight = initialHeight;
                let newLeft = initialLeft;
                let newTop = initialTop;
                
                // Handle different resize positions
                if (position.includes('e')) {
                  newWidth = Math.max(100, initialWidth + deltaX);
                }
                if (position.includes('w')) {
                  newWidth = Math.max(100, initialWidth - deltaX);
                  newLeft = initialLeft + (initialWidth - newWidth);
                }
                if (position.includes('s')) {
                  newHeight = Math.max(50, initialHeight + deltaY);
                }
                if (position.includes('n')) {
                  newHeight = Math.max(50, initialHeight - deltaY);
                  newTop = initialTop + (initialHeight - newHeight);
                }
                
                table.style.width = `${newWidth}px`;
                table.style.minHeight = `${newHeight}px`;
                tableWrapper.style.left = `${newLeft}px`;
                tableWrapper.style.top = `${newTop}px`;
                
                indicator.textContent = `${Math.round(newWidth)} × ${Math.round(newHeight)} px`;
              };
              
              const handleMouseUp = () => {
                document.body.style.userSelect = '';
                
                if (indicator.parentNode) {
                  indicator.parentNode.removeChild(indicator);
                }
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };
              
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
              
              return true;
            }
            
            // Mark table as active when clicked
            const tableWrapper = target.closest('.tableWrapper') as HTMLElement;
            if (tableWrapper) {
              // Remove active from other tables
              document.querySelectorAll('.tableWrapper.table-active').forEach(el => {
                if (el !== tableWrapper) el.classList.remove('table-active');
              });
              tableWrapper.classList.add('table-active');
            }
            
            return false;
          },
          
          // Remove active state when clicking outside
          click: (view, event) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.tableWrapper')) {
              document.querySelectorAll('.tableWrapper.table-active').forEach(el => {
                el.classList.remove('table-active');
              });
            }
            return false;
          },
        },
      },
    });
    
    return [...plugins, controlsPlugin];
  },
});

export default DraggableTable;
