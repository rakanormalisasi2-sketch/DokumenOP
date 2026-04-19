import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DocumentType,
  DOCUMENT_TYPE_LABELS,
  PaperSize,
  PAPER_SIZE_LABELS,
  Submission,
  FormField,
} from '@/types';
import { useData } from '@/contexts/DataContext';
import { Printer, Download, Eye, FileText, FileSpreadsheet } from 'lucide-react';

interface PrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: Submission;
  fields: FormField[];
  isAdmin?: boolean;
  onPrint: (docTypes: DocumentType[], paperSize: PaperSize, format: 'print' | 'pdf') => void;
  onPreview: (docType: DocumentType) => void;
}

export default function PrintDialog({
  open,
  onOpenChange,
  submission,
  fields,
  isAdmin = false,
  onPrint,
  onPreview,
}: PrintDialogProps) {
  const [selectedDocTypes, setSelectedDocTypes] = useState<DocumentType[]>([]);
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [outputFormat, setOutputFormat] = useState<'print' | 'pdf'>('print');

  const { templates } = useData();

  // Show all document types dynamically based on template availability
  const allTemplates = isAdmin
    ? templates
    : templates.filter(t => t.category === 'pelaksanaan' || t.category === 'pencairan' || t.phase === 'pelaksanaan');

  const allDocTypes: DocumentType[] = allTemplates.map(t => t.type as DocumentType);

  const toggleDocType = (docType: DocumentType) => {
    setSelectedDocTypes(prev =>
      prev.includes(docType)
        ? prev.filter(t => t !== docType)
        : [...prev, docType]
    );
  };

  const selectAll = () => {
    setSelectedDocTypes(allDocTypes);
  };

  const handlePrint = () => {
    if (selectedDocTypes.length === 0) return;
    onPrint(selectedDocTypes, paperSize, outputFormat);
  };

  const handlePreviewSingle = (docType: DocumentType) => {
    onPreview(docType);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Cetak Dokumen
          </DialogTitle>
          <DialogDescription>
            Pilih dokumen yang akan dicetak untuk: {submission.data.nama_pekerjaan}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Document Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Pilih Dokumen</Label>
              <Button variant="link" size="sm" onClick={selectAll}>
                Pilih Semua
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-2">
              {allTemplates.map((template) => {
                const docType = template.type as DocumentType;
                const isSpreadsheet = template.format === 'xlsx';
                return (
                  <Card
                    key={docType}
                    className={`cursor-pointer transition-all ${selectedDocTypes.includes(docType) ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    onClick={() => toggleDocType(docType)}
                  >
                    <CardContent className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedDocTypes.includes(docType)}
                          onCheckedChange={() => toggleDocType(docType)}
                        />
                        <div className="flex items-center gap-2">
                          {isSpreadsheet ? (
                            <FileSpreadsheet className="w-4 h-4 text-success" />
                          ) : (
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium text-sm truncate max-w-[200px]">{template.name}</span>
                            <span className="text-xs text-muted-foreground">{isSpreadsheet ? 'Spreadsheet' : 'Dokumen'}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewSingle(docType);
                        }}
                        className="gap-1 shrink-0"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Paper Size & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ukuran Kertas</Label>
              <Select value={paperSize} onValueChange={(v) => setPaperSize(v as PaperSize)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">{PAPER_SIZE_LABELS.A4}</SelectItem>
                  <SelectItem value="F4">{PAPER_SIZE_LABELS.F4}</SelectItem>
                  <SelectItem value="Letter">{PAPER_SIZE_LABELS.Letter}</SelectItem>
                  <SelectItem value="Legal">{PAPER_SIZE_LABELS.Legal}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format Output</Label>
              <Select value={outputFormat} onValueChange={(v) => setOutputFormat(v as 'print' | 'pdf')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="print">Cetak Langsung</SelectItem>
                  <SelectItem value="pdf">Download PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Pilih dokumen yang akan dicetak. Dokumen tersedia dalam versi Fisik dan Konsultansi.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={handlePrint}
            disabled={selectedDocTypes.length === 0}
            className="gap-2"
          >
            {outputFormat === 'pdf' ? (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                Cetak ({selectedDocTypes.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
