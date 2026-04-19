import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Table as TableIcon, ChevronDown, PenTool, Grid } from 'lucide-react';

interface TableGridSelectorProps {
  onInsertTable: (rows: number, cols: number) => void;
  onOpenDialog?: () => void;
  onDrawTable?: () => void;
}

export const TableGridSelector: React.FC<TableGridSelectorProps> = ({
  onInsertTable,
  onOpenDialog,
  onDrawTable,
}) => {
  const [hoveredRow, setHoveredRow] = useState(0);
  const [hoveredCol, setHoveredCol] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const maxRows = 8;
  const maxCols = 10;
  
  const handleCellHover = useCallback((row: number, col: number) => {
    setHoveredRow(row);
    setHoveredCol(col);
  }, []);
  
  const handleCellClick = useCallback((row: number, col: number) => {
    onInsertTable(row, col);
    setIsOpen(false);
    setHoveredRow(0);
    setHoveredCol(0);
  }, [onInsertTable]);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredRow(0);
    setHoveredCol(0);
  }, []);
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
          <TableIcon className="w-4 h-4" />
          <span className="text-xs">Tabel</span>
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-3 bg-background" 
        align="start"
        onMouseLeave={handleMouseLeave}
      >
        <div className="space-y-3">
          {/* Grid preview label */}
          <div className="text-xs font-medium text-center text-muted-foreground">
            {hoveredRow > 0 && hoveredCol > 0 
              ? `${hoveredRow} × ${hoveredCol} Tabel`
              : 'Sisipkan Tabel'
            }
          </div>
          
          {/* Grid selector */}
          <div 
            className="grid gap-0.5 p-1 border rounded-md bg-muted/30"
            style={{ 
              gridTemplateColumns: `repeat(${maxCols}, 1fr)`,
            }}
          >
            {Array.from({ length: maxRows * maxCols }).map((_, index) => {
              const row = Math.floor(index / maxCols) + 1;
              const col = (index % maxCols) + 1;
              const isHighlighted = row <= hoveredRow && col <= hoveredCol;
              
              return (
                <div
                  key={index}
                  className={`
                    w-5 h-5 border rounded-sm cursor-pointer transition-colors duration-75
                    ${isHighlighted 
                      ? 'bg-primary border-primary' 
                      : 'bg-background border-border hover:border-primary/50'
                    }
                  `}
                  onMouseEnter={() => handleCellHover(row, col)}
                  onClick={() => handleCellClick(row, col)}
                />
              );
            })}
          </div>
          
          {/* Additional options */}
          <div className="flex flex-col gap-1 pt-2 border-t">
            {onOpenDialog && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => {
                  onOpenDialog();
                  setIsOpen(false);
                }}
              >
                <Grid className="w-4 h-4 mr-2" />
                Sisipkan Tabel...
              </Button>
            )}
            {onDrawTable && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-8"
                onClick={() => {
                  onDrawTable();
                  setIsOpen(false);
                }}
              >
                <PenTool className="w-4 h-4 mr-2" />
                Gambar Tabel
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TableGridSelector;
