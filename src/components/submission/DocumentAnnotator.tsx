import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormField, Submission, DocumentErrorReport, AnnotationMark, DocumentType, DOCUMENT_TYPE_LABELS } from '@/types';
import { 
  Highlighter, 
  Strikethrough, 
  MessageSquare, 
  Send, 
  X, 
  Eraser,
  AlertTriangle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DocumentAnnotatorProps {
  content: string;
  format: 'docx' | 'xlsx';
  submission: Submission;
  fields: FormField[];
  documentType: DocumentType;
  onSubmitReport: (report: Omit<DocumentErrorReport, 'id' | 'createdAt' | 'status'>) => void;
  onClose: () => void;
}

const highlightColors = [
  { color: '#ffff00', name: 'Kuning' },
  { color: '#ff9900', name: 'Oranye' },
  { color: '#ff6666', name: 'Merah' },
  { color: '#66ff66', name: 'Hijau' },
  { color: '#66ccff', name: 'Biru' },
];

export default function DocumentAnnotator({
  content,
  format,
  submission,
  fields,
  documentType,
  onSubmitReport,
  onClose,
}: DocumentAnnotatorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<AnnotationMark[]>([]);
  const [activeTool, setActiveTool] = useState<'highlight' | 'strikethrough' | 'comment' | null>(null);
  const [activeColor, setActiveColor] = useState('#ffff00');
  const [comment, setComment] = useState('');
  const [showCommentPopover, setShowCommentPopover] = useState(false);
  const [pendingComment, setPendingComment] = useState<{ start: number; end: number } | null>(null);

  // Replace placeholders with actual data
  const renderContent = () => {
    if (!content) return '<p style="color: #666; text-align: center; padding: 40px;">Template belum diisi</p>';
    
    let processedContent = content;
    
    fields.forEach(field => {
      const placeholder = new RegExp(`{{${field.name}}}`, 'g');
      const value = submission.data[field.name] || `[${field.label}]`;
      processedContent = processedContent.replace(placeholder, value);
    });
    
    return processedContent;
  };

  const handleTextSelection = useCallback(() => {
    if (!activeTool) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const container = editorRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    // Get selection position
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(container);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;
    const endOffset = startOffset + range.toString().length;

    if (activeTool === 'comment') {
      setPendingComment({ start: startOffset, end: endOffset });
      setShowCommentPopover(true);
    } else {
      // Apply highlight or strikethrough
      const newAnnotation: AnnotationMark = {
        id: crypto.randomUUID(),
        type: activeTool,
        startOffset,
        endOffset,
        color: activeTool === 'highlight' ? activeColor : '#ff0000',
      };
      setAnnotations(prev => [...prev, newAnnotation]);

      // Apply visual effect
      try {
        const span = document.createElement('span');
        if (activeTool === 'highlight') {
          span.style.backgroundColor = activeColor;
          span.style.padding = '0 2px';
        } else {
          span.style.textDecoration = 'line-through';
          span.style.textDecorationColor = '#ff0000';
          span.style.textDecorationThickness = '2px';
        }
        span.dataset.annotationId = newAnnotation.id;
        range.surroundContents(span);
      } catch {
        // Handle complex selections
        const selectedText = range.extractContents();
        const span = document.createElement('span');
        if (activeTool === 'highlight') {
          span.style.backgroundColor = activeColor;
        } else {
          span.style.textDecoration = 'line-through';
          span.style.textDecorationColor = '#ff0000';
        }
        span.appendChild(selectedText);
        range.insertNode(span);
      }

      selection.removeAllRanges();
    }
  }, [activeTool, activeColor]);

  const addCommentAnnotation = () => {
    if (!pendingComment || !comment.trim()) return;

    const newAnnotation: AnnotationMark = {
      id: crypto.randomUUID(),
      type: 'comment',
      startOffset: pendingComment.start,
      endOffset: pendingComment.end,
      color: '#ffe066',
      comment: comment.trim(),
    };
    setAnnotations(prev => [...prev, newAnnotation]);
    
    toast.success('Komentar ditambahkan');
    setComment('');
    setPendingComment(null);
    setShowCommentPopover(false);
  };

  const clearAllAnnotations = () => {
    setAnnotations([]);
    // Reset editor content
    if (editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(renderContent());
    }
    toast.info('Semua anotasi dihapus');
  };

  const handleSubmitReport = () => {
    if (annotations.length === 0 && !comment.trim()) {
      toast.error('Tambahkan minimal satu anotasi atau komentar');
      return;
    }

    const report: Omit<DocumentErrorReport, 'id' | 'createdAt' | 'status'> = {
      submissionId: submission.id,
      documentType,
      reportedBy: submission.respondentId,
      reportedByName: submission.respondentName,
      annotations,
      comment: comment.trim(),
      screenshotPdf: editorRef.current?.innerHTML ? DOMPurify.sanitize(editorRef.current.innerHTML) : undefined, // Store annotated HTML
    };

    onSubmitReport(report);
    toast.success('Laporan kesalahan berhasil dikirim ke admin');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <div>
              <h2 className="text-lg font-semibold">Lapor Kesalahan Dokumen</h2>
              <p className="text-sm text-muted-foreground">{DOCUMENT_TYPE_LABELS[documentType]}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-3 border-b bg-muted/20 flex-wrap">
          <div className="flex items-center gap-1 border-r pr-3">
            <Button
              variant={activeTool === 'highlight' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTool(activeTool === 'highlight' ? null : 'highlight')}
              className="gap-2"
            >
              <Highlighter className="w-4 h-4" />
              Stabilo
            </Button>
            {activeTool === 'highlight' && (
              <div className="flex items-center gap-1 ml-2">
                {highlightColors.map(({ color, name }) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      activeColor === color ? 'border-primary scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setActiveColor(color)}
                    title={name}
                  />
                ))}
              </div>
            )}
          </div>

          <Button
            variant={activeTool === 'strikethrough' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTool(activeTool === 'strikethrough' ? null : 'strikethrough')}
            className="gap-2"
          >
            <Strikethrough className="w-4 h-4" />
            Coret
          </Button>

          <Popover open={showCommentPopover} onOpenChange={setShowCommentPopover}>
            <PopoverTrigger asChild>
              <Button
                variant={activeTool === 'comment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool(activeTool === 'comment' ? null : 'comment')}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Komentar
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <Label>Tambah Komentar</Label>
                <Textarea
                  placeholder="Tuliskan komentar untuk bagian yang dipilih..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCommentAnnotation} className="gap-1">
                    <Check className="w-3 h-3" />
                    Tambah
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCommentPopover(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="border-l pl-3 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllAnnotations}
              className="gap-2 text-muted-foreground"
            >
              <Eraser className="w-4 h-4" />
              Hapus Semua
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-4 py-2 bg-primary/5 text-sm text-primary">
          💡 Pilih alat di atas, lalu pilih (select) teks pada dokumen yang ingin ditandai. Klik teks untuk menambahkan anotasi.
        </div>

        {/* Document Preview with Annotation */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6">
          <div 
            ref={editorRef}
            className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-12 preview-content prose prose-sm max-w-none cursor-text"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderContent()) }}
            onMouseUp={handleTextSelection}
          />
        </div>

        {/* Comments list */}
        {annotations.filter(a => a.type === 'comment').length > 0 && (
          <div className="border-t p-4 bg-muted/20">
            <Label className="text-sm font-medium mb-2 block">Komentar yang ditambahkan:</Label>
            <div className="space-y-2 max-h-32 overflow-auto">
              {annotations.filter(a => a.type === 'comment').map((annotation, idx) => (
                <div key={annotation.id} className="flex items-start gap-2 bg-yellow-50 p-2 rounded text-sm">
                  <MessageSquare className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <span>{annotation.comment}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Comment */}
        <div className="border-t p-4 space-y-3">
          <div className="space-y-2">
            <Label>Keterangan Umum (opsional)</Label>
            <Textarea
              placeholder="Jelaskan secara umum kesalahan yang ditemukan..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/10">
          <div className="text-sm text-muted-foreground">
            {annotations.length} anotasi ditandai
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={handleSubmitReport} className="gap-2">
              <Send className="w-4 h-4" />
              Kirim ke Admin
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
