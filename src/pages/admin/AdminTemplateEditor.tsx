import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import TipTapEditor from '@/components/editors/TipTapEditor';
import HandsontableEditor from '@/components/editors/HandsontableEditor';
import type { DocumentTemplate } from '@/types';
import { ArrowLeft, Save } from 'lucide-react';

export default function AdminTemplateEditor() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const { templates, fields, updateTemplate } = useData();

  const template = useMemo(
    () => templates.find((t) => t.id === templateId),
    [templates, templateId]
  );

  const getDefaultContent = (t: DocumentTemplate) => {
    if (t.format === 'xlsx') {
      interface CellData {
        value: string;
        bold?: boolean;
        italic?: boolean;
        align?: 'left' | 'center' | 'right';
      }
      const defaultCells: CellData[][] = Array(15)
        .fill(null)
        .map(() => Array(10).fill(null).map(() => ({ value: '' })));
      defaultCells[0][0] = { value: 'No', bold: true, align: 'center' };
      defaultCells[0][1] = { value: 'Uraian', bold: true, align: 'center' };
      defaultCells[0][2] = { value: 'Volume', bold: true, align: 'center' };
      defaultCells[0][3] = { value: 'Satuan', bold: true, align: 'center' };
      defaultCells[0][4] = { value: 'Harga Satuan', bold: true, align: 'center' };
      defaultCells[0][5] = { value: 'Jumlah Harga', bold: true, align: 'center' };
      return JSON.stringify(defaultCells);
    }

    return `<h2 style="text-align: center;">TEMPLATE ${t.name.toUpperCase()}</h2>
<p style="text-align: center;">&nbsp;</p>
<p>Gunakan placeholder seperti <strong>{{nama_pekerjaan}}</strong> untuk mail merge.</p>`;
  };

  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!template) return;
    setEditContent(template.content || getDefaultContent(template));
  }, [template]);

  const handleSave = async () => {
    if (!template) return;
    try {
      await updateTemplate(template.id, editContent);
      toast.success('Template berhasil disimpan');
    } catch (e: any) {
      console.error('Save template failed:', e);
      toast.error(`Gagal menyimpan template: ${e?.message || 'Unknown error'}`);
    }
  };

  if (!template) {
    return (
      <AdminLayout>
        <Card className="p-6">
          <div className="space-y-4">
            <p className="text-foreground">Template tidak ditemukan.</p>
            <Button variant="outline" onClick={() => navigate('/admin/templates')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Edit Template: {template.name}</h1>
            <p className="text-sm text-muted-foreground">
              {template.format === 'xlsx'
                ? 'Spreadsheet editor (Excel)'
                : 'Word-like editor (DOCX → HTML)'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/templates')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Simpan
            </Button>
          </div>
        </div>

        <div>
          {template.format === 'xlsx' ? (
            <HandsontableEditor content={editContent} onChange={setEditContent} fields={fields} />
          ) : (
            <TipTapEditor content={editContent} onChange={setEditContent} fields={fields} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
