import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField, Submission, DocumentType } from '@/types';
import { Printer, Download, X, Edit3, AlertTriangle, Loader2 } from 'lucide-react';
import { renderAsync } from 'docx-preview';
import { base64ToArrayBuffer, performMailMerge } from '@/lib/docxUtils';
import { formatTerbilang } from '@/lib/terbilang';
import { enrichSubmissionData } from '@/lib/enrichData';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

interface DocumentPreviewProps {
  content: string;
  format: 'docx' | 'xlsx';
  submission?: Submission;
  fields: FormField[];
  title: string;
  documentType?: DocumentType;
  isAdmin?: boolean;
  onClose?: () => void;
  onEditTemplate?: () => void;
  onReportError?: () => void;
  onSendToRespondent?: (base64Data: string) => void;
}

export default function DocumentPreview({
  content,
  format,
  submission,
  fields,
  title,
  documentType,
  isAdmin = false,
  onClose,
  onEditTemplate,
  onReportError,
  onSendToRespondent,
}: DocumentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);

  const isBase64Docx = format === 'docx' && content?.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,');

  useEffect(() => {
    const renderDoc = async () => {
      if (!isBase64Docx || !containerRef.current || !content) return;

      setIsLoading(true);
      try {
        let blobToRender: Blob | ArrayBuffer;

        if (submission) {
          // Pre-calculate terbilang fields
          const enrichedData = { ...submission.data };
          fields.forEach(f => {
            if (f.type === 'terbilang' && f.linkedFieldId) {
              enrichedData[f.name] = formatTerbilang(enrichedData[f.linkedFieldId] || '', f.terbilangFormat);
            }
          });

          // Perform Mail Merge
          const merged = performMailMerge(content.split(',')[1], enrichedData);
          if (merged) {
            blobToRender = merged;
            setMergedBlob(merged);
          } else {
            // Fallback to original if merge fails
            blobToRender = base64ToArrayBuffer(content.split(',')[1]);
            toast.error("Gagal melakukan Mail Merge, menampilkan template asli.");
          }
        } else {
          // Just render the original template
          blobToRender = base64ToArrayBuffer(content.split(',')[1]);
        }

        if (containerRef.current) {
          containerRef.current.innerHTML = ''; // Clear previous
          await renderAsync(blobToRender, containerRef.current, undefined, {
            inWrapper: false,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            debug: false,
            experimental: true,
            useBase64URL: true
          });
        }
      } catch (error) {
        console.error("Error preventing document:", error);
        toast.error("Gagal memuat preview dokumen.");
      } finally {
        setIsLoading(false);
      }
    };

    renderDoc();
  }, [content, isBase64Docx, submission]);

  // Replace placeholders with actual data (Legacy HTML)
  const renderContent = () => {
    if (!content) return '<p style="color: #666; text-align: center; padding: 40px;">Template belum diisi</p>';

    let processedContent = content;

    if (submission) {
      // Use the new enrichment utility
      const enrichedData = enrichSubmissionData(submission.data, fields);

      // Replace placeholders with enriched submission data
      // First pass: replace all available enriched keys
      Object.keys(enrichedData).forEach(key => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        const value = enrichedData[key];
        // Only replace if value is defined and not null
        if (value !== undefined && value !== null) {
            processedContent = processedContent.replace(placeholder, value);
        }
      });

      // Second pass: fill missing original fields with [Label]
      fields.forEach(field => {
        const placeholder = new RegExp(`{{${field.name}}}`, 'g');
        processedContent = processedContent.replace(placeholder, `[${field.label}]`);
      });
    }

    return processedContent;
  };

  const renderSpreadsheet = () => {
    try {
      const cells = JSON.parse(content);
      if (!Array.isArray(cells)) return null;

      let enrichedData = submission ? { ...submission.data } : {};
      if (submission) {
        enrichedData = enrichSubmissionData(submission.data, fields);
      }

      // Replace placeholders in cells
      const processedCells = cells.map((row: any[]) =>
        row.map((cell: { value: string; bold?: boolean; italic?: boolean; align?: string }) => {
          let value = cell.value;
          if (submission) {
            fields.forEach(field => {
              const placeholder = new RegExp(`{{${field.name}}}`, 'g');
              const fieldValue = enrichedData[field.name] || `[${field.label}]`;
              value = value ? String(value).replace(placeholder, fieldValue) : value;
            });
          }
          return { ...cell, value };
        })
      );

      return (
        <table className="w-full border-collapse">
          <tbody>
            {processedCells.map((row: { value: string; bold?: boolean; italic?: boolean; align?: string }[], rowIndex: number) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className={`border border-gray-300 px-3 py-2 text-sm ${cell.bold ? 'font-bold' : ''
                      } ${cell.italic ? 'italic' : ''}`}
                    style={{ textAlign: (cell.align as 'left' | 'center' | 'right') || 'left' }}
                  >
                    {cell.value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } catch {
      return <p className="text-muted-foreground text-center py-8">Template spreadsheet belum diisi</p>;
    }
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBase64Docx) {
      if (mergedBlob) {
        // Create object URL for the blob and open it
        const url = URL.createObjectURL(mergedBlob);
        const printWindow = window.open(url, '_blank');
        // Check if it's PDF or just open it.
        // Browser might not print DOCX blob directly.
        // Best effort: Print the container content?
        // Actually docx-preview renders HTML. We can print the container!

        // Re-use logic below but target the containerRef
        const contentHtml = containerRef.current?.innerHTML || '';
        const printWin = window.open('', '_blank');
        if (printWin) {
          printWin.document.write(`
                    <html>
                        <head><title>${title}</title></head>
                        <body>${DOMPurify.sanitize(contentHtml)}</body>
                    </html>
                 `);
          printWin.document.close();
          setTimeout(() => {
            printWin.print();
          }, 500);
        }
        return;
      }
    }

    const contentHtml = format === 'xlsx'
      ? document.querySelector('.preview-content')?.innerHTML || ''
      : renderContent();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Print styles - DO NOT override inline cell borders to respect borderless settings
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              table { border-collapse: collapse; width: 100%; }
              /* Only set default padding; borders come from inline styles */
              td, th { padding: 5px 7px; vertical-align: top; }
              /* Respect inline border styles - no forcing borders */
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 15mm; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
            </style>
          </head>
          <body>
            ${DOMPurify.sanitize(contentHtml)}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    } else {
      alert('Popup diblokir oleh browser. Silakan izinkan popup untuk mencetak.');
    }
  };

  const handleDownloadPdf = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBase64Docx && mergedBlob) {
      // Download the MERGED DOCX
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File DOCX berhasil didownload.");
      return;
    }

    const contentHtml = format === 'xlsx'
      ? document.querySelector('.preview-content')?.innerHTML || ''
      : renderContent();

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // PDF styles - DO NOT override inline cell borders to respect borderless settings
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              table { border-collapse: collapse; width: 100%; }
              /* Only set default padding; borders come from inline styles */
              td, th { padding: 5px 7px; vertical-align: top; }
              /* Respect inline border styles - no forcing borders */
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 15mm; }
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
            </style>
          </head>
          <body>
            <p style="text-align: center; color: #666; font-size: 12px; margin-bottom: 20px;">
              Gunakan "Save as PDF" atau "Microsoft Print to PDF" pada dialog print
            </p>
            ${DOMPurify.sanitize(contentHtml)}
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } else {
      alert('Popup diblokir oleh browser. Silakan izinkan popup untuk download PDF.');
    }
  };

  const handleSendToRespondent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (mergedBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(mergedBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onSendToRespondent?.(base64data);
        toast.success("Dokumen berhasil dikirim ke Responden.");
      };
    } else {
      toast.error('Hanya dokumen format Word (DOCX) yang didukung untuk fitur kirim langsung.');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEditTemplate?.();
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReportError?.();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-2">
            {/* Admin: Edit button */}
            {isAdmin && onEditTemplate && (
              <Button variant="outline" size="sm" onClick={handleEditClick} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Kelola Template
              </Button>
            )}

            {/* Respondent: Report Error button */}
            {!isAdmin && onReportError && (
              <Button variant="outline" size="sm" onClick={handleReportClick} className="gap-2 text-warning border-warning hover:bg-warning/10">
                <AlertTriangle className="w-4 h-4" />
                Lapor Kesalahan
              </Button>
            )}

            {/* Admin: Send to Respondent */}
            {isAdmin && onSendToRespondent && mergedBlob && (
              <Button onClick={handleSendToRespondent} size="sm" className="gap-2 bg-success text-success-foreground hover:bg-success/90">
                <Download className="w-4 h-4" /> {/* Or a Send icon */}
                Kirim ke Responden
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Cetak
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="gap-2">
              <Download className="w-4 h-4" />
              Download / PDF
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={handleCloseClick}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          {isBase64Docx ? (
            <div className="bg-white shadow-lg mx-auto w-full min-h-[500px] relative flex justify-center">
              {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              {/* Container for docx-preview */}
              <div ref={containerRef} className="docx-wrapper bg-white shadow-sm p-4 w-full" />
            </div>
          ) : (
            <div className="bg-white shadow-lg mx-auto max-w-[210mm] min-h-[297mm] p-12 preview-content">
              {format === 'xlsx' ? (
                renderSpreadsheet()
              ) : (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderContent()) }}
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
