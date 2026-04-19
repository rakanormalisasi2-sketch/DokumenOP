import { supabase } from '@/integrations/supabase/client';
import type { DocumentTemplate } from '@/types';

const BUCKET = 'templates';

type TemplateFormat = DocumentTemplate['format'];

function getContentPath(templateId: string, format: TemplateFormat) {
  const ext = format === 'docx' ? 'html' : 'json';
  return `template-content/${templateId}.${ext}`;
}

function getContentType(format: TemplateFormat) {
  return format === 'docx'
    ? 'text/html; charset=utf-8'
    : 'application/json; charset=utf-8';
}

function isNotFoundError(error: unknown) {
  const anyErr = error as any;
  const msg = String(anyErr?.message ?? '').toLowerCase();
  const status = anyErr?.statusCode ?? anyErr?.status;
  return status === 404 || msg.includes('not found') || msg.includes('does not exist');
}

export const templateStorage = {
  getContentPath,

  async saveTemplateContent(params: { templateId: string; format: TemplateFormat; content: string }) {
    const { templateId, format, content } = params;
    const path = getContentPath(templateId, format);

    // Remove old version explicitly (so overwrite doesn't leave junk)
    try {
      await supabase.storage.from(BUCKET).remove([path]);
    } catch {
      // ignore
    }

    const blob = new Blob([content], { type: getContentType(format) });

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, {
        upsert: true,
        contentType: getContentType(format),
        cacheControl: '3600',
      });

    if (error) throw error;

    return path;
  },

  async loadTemplateContent(params: { templateId: string; format: TemplateFormat }): Promise<string | null> {
    const { templateId, format } = params;
    const path = getContentPath(templateId, format);

    const { data, error } = await supabase.storage.from(BUCKET).download(path);

    if (error) {
      if (isNotFoundError(error)) return null;
      throw error;
    }

    return await data.text();
  },

  async loadAllTemplateContents(templates: Pick<DocumentTemplate, 'id' | 'format'>[]) {
    const results = await Promise.all(
      templates.map(async (t) => {
        const content = await templateStorage.loadTemplateContent({
          templateId: t.id,
          format: t.format,
        });
        return [t.id, content] as const;
      })
    );

    const map: Record<string, string | null> = {};
    for (const [id, content] of results) {
      map[id] = content;
    }
    return map;
  },
};
