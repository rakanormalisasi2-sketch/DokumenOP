import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Split, GripVertical, Check, X } from 'lucide-react';
import { SchedulePhase, DEFAULT_SCHEDULE_PHASES } from '@/types';

interface ScheduleGanttProps {
  phases: SchedulePhase[];
  onChange: (phases: SchedulePhase[]) => void;
  totalDuration: number; // Total project duration in days
  onDurationChange: (days: number) => void;
}

export default function ScheduleGantt({ 
  phases, 
  onChange, 
  totalDuration, 
  onDurationChange 
}: ScheduleGanttProps) {
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<SchedulePhase | null>(null);
  const [splitParts, setSplitParts] = useState<{ days: number; description: string }[]>([]);
  const [draggingPhase, setDraggingPhase] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  // Calculate number of weeks
  const totalWeeks = useMemo(() => Math.ceil(totalDuration / 7), [totalDuration]);

  // Add new phase
  const addPhase = () => {
    const lastPhase = phases[phases.length - 1];
    const startDay = lastPhase ? lastPhase.startDay + lastPhase.durationDays : 0;
    
    const newPhase: SchedulePhase = {
      id: crypto.randomUUID(),
      name: 'Tahapan Baru',
      durationDays: 3,
      startDay,
    };
    onChange([...phases, newPhase]);
  };

  // Update phase
  const updatePhase = (id: string, updates: Partial<SchedulePhase>) => {
    onChange(phases.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // Remove phase
  const removePhase = (id: string) => {
    onChange(phases.filter(p => p.id !== id));
  };

  // Open split dialog
  const openSplitDialog = (phase: SchedulePhase) => {
    setSelectedPhase(phase);
    setSplitParts(phase.splits || [{ days: phase.durationDays, description: '' }]);
    setShowSplitDialog(true);
  };

  // Confirm split
  const confirmSplit = () => {
    if (!selectedPhase) return;
    
    const totalSplitDays = splitParts.reduce((sum, p) => sum + p.days, 0);
    if (totalSplitDays !== selectedPhase.durationDays) {
      alert(`Total hari split (${totalSplitDays}) harus sama dengan durasi (${selectedPhase.durationDays} hari)`);
      return;
    }
    
    updatePhase(selectedPhase.id, { splits: splitParts.length > 1 ? splitParts : undefined });
    setShowSplitDialog(false);
  };

  // Handle drag
  const handleDragStart = (phaseId: string, e: React.MouseEvent, startDay: number) => {
    setDraggingPhase(phaseId);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const dayWidth = rect.width / (phases.find(p => p.id === phaseId)?.durationDays || 1);
    setDragOffset(Math.floor((e.clientX - rect.left) / dayWidth));
  };

  const handleDrag = (e: React.MouseEvent, weekContainerRef: HTMLDivElement | null) => {
    if (!draggingPhase || !weekContainerRef) return;
    
    const containerRect = weekContainerRef.getBoundingClientRect();
    const dayWidth = containerRect.width / (totalWeeks * 7);
    const newStartDay = Math.max(0, Math.floor((e.clientX - containerRect.left) / dayWidth) - dragOffset);
    
    updatePhase(draggingPhase, { startDay: Math.min(newStartDay, totalDuration - 1) });
  };

  const handleDragEnd = () => {
    setDraggingPhase(null);
  };

  // Initialize with defaults if empty
  const initializeDefaults = () => {
    const defaultPhases: SchedulePhase[] = DEFAULT_SCHEDULE_PHASES.map((p, i) => ({
      id: crypto.randomUUID(),
      name: p.name,
      durationDays: p.durationDays,
      startDay: DEFAULT_SCHEDULE_PHASES.slice(0, i).reduce((sum, prev) => sum + prev.durationDays, 0),
    }));
    onChange(defaultPhases);
    
    // Set total duration based on phases
    const totalDays = defaultPhases.reduce((sum, p) => Math.max(sum, p.startDay + p.durationDays), 0);
    onDurationChange(Math.max(30, totalDays));
  };

  // Calculate day to position in gantt
  const getDayPosition = (day: number) => (day / totalDuration) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Jadwal Tahapan Pelaksanaan Kegiatan</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Durasi Pelaksanaan:</Label>
              <Input
                type="number"
                min="1"
                value={totalDuration}
                onChange={(e) => onDurationChange(parseInt(e.target.value) || 30)}
                className="w-20 h-8"
              />
              <span className="text-sm text-muted-foreground">hari</span>
              <span className="text-xs text-muted-foreground">({totalWeeks} minggu)</span>
            </div>
            {phases.length === 0 && (
              <Button variant="outline" size="sm" onClick={initializeDefaults}>
                Gunakan Default
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phase inputs */}
        <div className="space-y-2">
          {phases.map((phase, index) => (
            <div key={phase.id} className="flex items-center gap-4 p-2 bg-muted/30 rounded-lg">
              <span className="w-6 text-sm text-muted-foreground">{index + 1}.</span>
              <Input
                value={phase.name}
                onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                className="flex-1 h-8"
                placeholder="Nama tahapan"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={phase.durationDays}
                  onChange={(e) => updatePhase(phase.id, { durationDays: parseInt(e.target.value) || 1 })}
                  className="w-16 h-8"
                />
                <span className="text-sm text-muted-foreground">hari</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openSplitDialog(phase)}
                title="Split candle"
              >
                <Split className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removePhase(phase.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addPhase} className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Tambah Tahapan
          </Button>
        </div>

        {/* Gantt Chart */}
        {phases.length > 0 && (
          <div className="mt-6 border rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2 text-left w-8 text-xs">No</th>
                  <th className="border p-2 text-left min-w-[200px] text-xs">Tahapan</th>
                  <th className="border p-2 text-center text-xs" colSpan={totalWeeks}>
                    Jangka Waktu (Minggu)
                  </th>
                </tr>
                <tr className="bg-muted/30">
                  <th className="border p-1" colSpan={2}></th>
                  {Array.from({ length: totalWeeks }).map((_, i) => (
                    <th key={i} className="border p-1 text-center text-xs min-w-[60px]">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {phases.map((phase, index) => (
                  <tr key={phase.id}>
                    <td className="border p-2 text-center text-sm">{index + 1}.</td>
                    <td className="border p-2 text-sm">{phase.name}</td>
                    {Array.from({ length: totalWeeks }).map((_, weekIndex) => {
                      const weekStart = weekIndex * 7;
                      const weekEnd = weekStart + 7;
                      const phaseEnd = phase.startDay + phase.durationDays;
                      
                      // Check if this phase overlaps with this week
                      const overlaps = phase.startDay < weekEnd && phaseEnd > weekStart;
                      
                      if (!overlaps) {
                        return <td key={weekIndex} className="border p-1"></td>;
                      }
                      
                      // Calculate the bar position within the week
                      const barStart = Math.max(0, phase.startDay - weekStart);
                      const barEnd = Math.min(7, phaseEnd - weekStart);
                      const barWidth = ((barEnd - barStart) / 7) * 100;
                      const barLeft = (barStart / 7) * 100;
                      
                      // Handle splits
                      if (phase.splits && phase.splits.length > 1) {
                        let currentOffset = phase.startDay;
                        return (
                          <td key={weekIndex} className="border p-1 relative h-8">
                            {phase.splits.map((split, splitIndex) => {
                              const splitStart = currentOffset;
                              const splitEnd = splitStart + split.days;
                              currentOffset = splitEnd;
                              
                              const splitOverlaps = splitStart < weekEnd && splitEnd > weekStart;
                              if (!splitOverlaps) return null;
                              
                              const splitBarStart = Math.max(0, splitStart - weekStart);
                              const splitBarEnd = Math.min(7, splitEnd - weekStart);
                              const splitBarWidth = ((splitBarEnd - splitBarStart) / 7) * 100;
                              const splitBarLeft = (splitBarStart / 7) * 100;
                              
                              return (
                                <div
                                  key={splitIndex}
                                  className="absolute top-1/2 -translate-y-1/2 h-4 bg-gray-800 rounded-sm cursor-move"
                                  style={{
                                    left: `${splitBarLeft}%`,
                                    width: `${splitBarWidth}%`,
                                    opacity: 0.8 + (splitIndex * 0.1),
                                  }}
                                  title={`${split.description || `Bagian ${splitIndex + 1}`}: ${split.days} hari`}
                                />
                              );
                            })}
                          </td>
                        );
                      }
                      
                      return (
                        <td key={weekIndex} className="border p-1 relative h-8">
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-4 bg-gray-800 rounded-sm cursor-move hover:bg-gray-700 transition-colors"
                            style={{
                              left: `${barLeft}%`,
                              width: `${barWidth}%`,
                            }}
                            onMouseDown={(e) => handleDragStart(phase.id, e, phase.startDay)}
                            title={`${phase.name}: ${phase.durationDays} hari (mulai hari ke-${phase.startDay + 1})`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {phases.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            Belum ada jadwal tahapan. Klik "Gunakan Default" atau "Tambah Tahapan".
          </div>
        )}

        {/* Split Dialog */}
        <Dialog open={showSplitDialog} onOpenChange={setShowSplitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Split Tahapan: {selectedPhase?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Total durasi: <strong>{selectedPhase?.durationDays} hari</strong>. 
                Bagi menjadi beberapa bagian (total harus sama).
              </p>
              
              {splitParts.map((part, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm w-20">Bagian {index + 1}:</span>
                  <Input
                    type="number"
                    min="1"
                    value={part.days}
                    onChange={(e) => {
                      const newParts = [...splitParts];
                      newParts[index] = { ...newParts[index], days: parseInt(e.target.value) || 1 };
                      setSplitParts(newParts);
                    }}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hari</span>
                  <Input
                    placeholder="Keterangan (opsional)"
                    value={part.description}
                    onChange={(e) => {
                      const newParts = [...splitParts];
                      newParts[index] = { ...newParts[index], description: e.target.value };
                      setSplitParts(newParts);
                    }}
                    className="flex-1"
                  />
                  {splitParts.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSplitParts(splitParts.filter((_, i) => i !== index))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSplitParts([...splitParts, { days: 1, description: '' }])}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Bagian
                </Button>
                <div className="text-sm">
                  Total: <strong>{splitParts.reduce((sum, p) => sum + p.days, 0)}</strong> / {selectedPhase?.durationDays} hari
                  {splitParts.reduce((sum, p) => sum + p.days, 0) !== selectedPhase?.durationDays && (
                    <span className="text-destructive ml-2">
                      (Harus sama!)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSplitDialog(false)}>
                Batal
              </Button>
              <Button 
                onClick={confirmSplit}
                disabled={splitParts.reduce((sum, p) => sum + p.days, 0) !== selectedPhase?.durationDays}
              >
                <Check className="w-4 h-4 mr-2" />
                Simpan Split
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
