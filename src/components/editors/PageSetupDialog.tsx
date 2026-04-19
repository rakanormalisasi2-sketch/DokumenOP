import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RulerUnit, convert, UNITS } from '@/lib/rulerUtils';

interface PageSetupDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentSize: { width: number; height: number }; // in cm
    currentMargins: { top: number; bottom: number; left: number; right: number }; // in cm
    onSave: (size: { width: number; height: number }, margins: { top: number; bottom: number; left: number; right: number }) => void;
}

export function PageSetupDialog({ isOpen, onClose, currentSize, currentMargins, onSave }: PageSetupDialogProps) {
    const [unit, setUnit] = useState<RulerUnit>('cm');
    const [width, setWidth] = useState(currentSize.width);
    const [height, setHeight] = useState(currentSize.height);
    const [margins, setMargins] = useState(currentMargins);

    // Update local state when prop changes or unit changes
    useEffect(() => {
        if (isOpen) {
            // Convert current (cm) to selected unit
            const scale = UNITS['cm'] / UNITS[unit];
            setWidth(currentSize.width * scale);
            setHeight(currentSize.height * scale);
            setMargins({
                top: currentMargins.top * scale,
                bottom: currentMargins.bottom * scale,
                left: currentMargins.left * scale,
                right: currentMargins.right * scale
            });
        }
    }, [isOpen, unit]); // Note: relying on cm as base truth

    const handleSave = () => {
        // Convert back to cm
        const scale = UNITS[unit] / UNITS['cm'];
        onSave(
            { width: width * scale, height: height * scale },
            {
                top: margins.top * scale,
                bottom: margins.bottom * scale,
                left: margins.left * scale,
                right: margins.right * scale
            }
        );
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Page Setup</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="unit" className="w-20">Unit</Label>
                        <Select value={unit} onValueChange={(v) => setUnit(v as RulerUnit)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mm">Millimeters (mm)</SelectItem>
                                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                                <SelectItem value="in">Inches (in)</SelectItem>
                                <SelectItem value="px">Pixels (px)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Width</Label>
                            <div className="relative">
                                <Input type="number" step="0.1" value={width} onChange={e => setWidth(parseFloat(e.target.value) || 0)} />
                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{unit}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Height</Label>
                            <div className="relative">
                                <Input type="number" step="0.1" value={height} onChange={e => setHeight(parseFloat(e.target.value) || 0)} />
                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{unit}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <Label className="mb-2 block font-semibold">Margins</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Top</Label>
                                <Input type="number" step="0.1" value={margins.top} onChange={e => setMargins({ ...margins, top: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Bottom</Label>
                                <Input type="number" step="0.1" value={margins.bottom} onChange={e => setMargins({ ...margins, bottom: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Left</Label>
                                <Input type="number" step="0.1" value={margins.left} onChange={e => setMargins({ ...margins, left: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Right</Label>
                                <Input type="number" step="0.1" value={margins.right} onChange={e => setMargins({ ...margins, right: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>OK</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
