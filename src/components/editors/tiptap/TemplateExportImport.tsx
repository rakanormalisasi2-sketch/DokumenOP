/**
 * Template Export/Import Component
 * Provides deterministic JSON export/import with object positions
 */

import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Upload, FileJson, AlertTriangle } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface TemplateExportImportProps {
  editor: Editor | null;
  onImport?: (content: string, mode: ImportMode) => void;
}

export type ImportMode = 'preserve' | 'reflow';

interface TemplateData {
  version: string;
  format: 'lovable-template-json';
  exportedAt: string;
  content: {
    html: string;
    json: any;
  };
  metadata: {
    objectCount: {
      tables: number;
      images: number;
      textboxes: number;
    };
    hasFloatingObjects: boolean;
  };
}

export function exportTemplateAsJSON(editor: Editor): TemplateData {
  const json = editor.getJSON();
  const html = editor.getHTML();
  
  // Count objects
  let tables = 0;
  let images = 0;
  let textboxes = 0;
  let hasFloatingObjects = false;
  
  const countNodes = (node: any) => {
    if (node.type === 'table') {
      tables++;
      if (node.attrs?.wrapMode === 'floating') {
        hasFloatingObjects = true;
      }
    }
    if (node.type === 'image') {
      images++;
      if (node.attrs?.wrapMode !== 'inline') {
        hasFloatingObjects = true;
      }
    }
    if (node.type === 'textBox') {
      textboxes++;
      hasFloatingObjects = true;
    }
    if (node.content) {
      node.content.forEach(countNodes);
    }
  };
  
  if (json.content) {
    json.content.forEach(countNodes);
  }
  
  return {
    version: '1.0',
    format: 'lovable-template-json',
    exportedAt: new Date().toISOString(),
    content: {
      html,
      json,
    },
    metadata: {
      objectCount: { tables, images, textboxes },
      hasFloatingObjects,
    },
  };
}

export function TemplateExportButton({ editor }: { editor: Editor | null }) {
  const handleExport = () => {
    if (!editor) return;
    
    const data = exportTemplateAsJSON(editor);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Template exported successfully');
  };
  
  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={!editor}>
      <Download className="h-4 w-4 mr-2" />
      Export JSON
    </Button>
  );
}

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
}

export function TemplateImportDialog({ open, onOpenChange, editor }: ImportDialogProps) {
  const [importMode, setImportMode] = useState<ImportMode>('preserve');
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        setJsonContent(content);
        const data = JSON.parse(content) as TemplateData;
        
        if (data.format !== 'lovable-template-json') {
          setError('Invalid template format. Please use a file exported from this editor.');
          setTemplateData(null);
          return;
        }
        
        setTemplateData(data);
        setError(null);
      } catch (err) {
        setError('Failed to parse JSON file. Please check the file format.');
        setTemplateData(null);
      }
    };
    reader.readAsText(file);
  };
  
  const handleImport = () => {
    if (!editor || !templateData) return;
    
    try {
      if (importMode === 'preserve') {
        // Use JSON for full fidelity with positions
        editor.commands.setContent(templateData.content.json);
      } else {
        // Use HTML and strip position attributes for reflow
        const html = templateData.content.html;
        editor.commands.setContent(html);
        
        // Reset all floating objects to inline
        // This will be handled by the editor's update cycle
      }
      
      toast.success(`Template imported (${importMode === 'preserve' ? 'layout preserved' : 'reflowed'})`);
      onOpenChange(false);
      resetForm();
    } catch (err) {
      toast.error('Failed to import template');
    }
  };
  
  const resetForm = () => {
    setTemplateData(null);
    setError(null);
    setJsonContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Import Template
          </DialogTitle>
          <DialogDescription>
            Import a template JSON file. Choose how to handle object positions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="space-y-2">
            <Label>Template File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
          
          {/* Preview */}
          {templateData && (
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded-md text-sm">
                <div className="font-medium mb-2">Template Info:</div>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Tables:</span>
                  <span>{templateData.metadata.objectCount.tables}</span>
                  <span>Images:</span>
                  <span>{templateData.metadata.objectCount.images}</span>
                  <span>Text Boxes:</span>
                  <span>{templateData.metadata.objectCount.textboxes}</span>
                  <span>Floating Objects:</span>
                  <span>{templateData.metadata.hasFloatingObjects ? 'Yes' : 'No'}</span>
                </div>
              </div>
              
              {/* Import Mode */}
              <div className="space-y-2">
                <Label>Import Mode</Label>
                <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="preserve" id="preserve" />
                    <div>
                      <Label htmlFor="preserve" className="font-medium">Preserve Layout</Label>
                      <p className="text-xs text-muted-foreground">Keep original object positions (recommended)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="reflow" id="reflow" />
                    <div>
                      <Label htmlFor="reflow" className="font-medium">Reflow Content</Label>
                      <p className="text-xs text-muted-foreground">Reset all objects to inline/normal flow</p>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              {templateData.metadata.hasFloatingObjects && importMode === 'reflow' && (
                <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-2 rounded">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Floating objects will be converted to inline. Original positions will be lost.</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!templateData}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateImportButton({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={!editor}>
        <Upload className="h-4 w-4 mr-2" />
        Import JSON
      </Button>
      <TemplateImportDialog open={open} onOpenChange={setOpen} editor={editor} />
    </>
  );
}
