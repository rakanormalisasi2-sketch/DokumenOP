import { r2Storage } from '@/integrations/r2/client';
import type { DocumentTemplate } from '@/types';

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

export const templateStorage = {
  getContentPath,

  async saveTemplateContent(params: { templateId: string; format: TemplateFormat; content: string }) {
    const { templateId, format, content } = params;
    const path = getContentPath(templateId, format);

    if (!r2Storage.isConfigured()) {
      throw new Error('Storage not configured. Please set R2 environment variables.');
    }

    await r2Storage.upload(path, content, getContentType(format));
    return path;
  },

  async loadTemplateContent(params: { templateId: string; format: TemplateFormat }): Promise<string | null> {
    const { templateId, format } = params;
    const path = getContentPath(templateId, format);

    if (!r2Storage.isConfigured()) {
      throw new Error('Storage not configured. Please set R2 environment variables.');
    }

    const blob = await r2Storage.download(path);
    if (!blob) return null;

    return await blob.text();
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
