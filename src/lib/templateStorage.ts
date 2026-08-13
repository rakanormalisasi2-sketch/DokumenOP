import { r2Storage } from '@/integrations/r2/client';
import type { DocumentTemplate } from '@/types';

type TemplateFormat = DocumentTemplate['format'];

function getContentPath(templateId: string, format: TemplateFormat) {
  // DOCX stored as base64 string (.docx extension), XLSX stored as JSON (.json)
  const ext = format === 'docx' ? 'docx' : 'json';
  return `template-content/${templateId}.${ext}`;
}

function getLegacyContentPath(templateId: string) {
  // Old path format used .html for docx — kept for backward compat loading
  return `template-content/${templateId}.html`;
}

function getContentType(format: TemplateFormat) {
  return format === 'docx'
    ? 'application/octet-stream'
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

    if (!r2Storage.isConfigured()) {
      throw new Error('Storage not configured. Please set R2 environment variables.');
    }

    // Try new path first (.docx or .json)
    const newPath = getContentPath(templateId, format);
    try {
      const blob = await r2Storage.download(newPath);
      if (blob) return await blob.text();
    } catch (e) {
      // Not found on new path, try legacy
    }

    // Fallback: try legacy .html path (for old templates saved before the fix)
    if (format === 'docx') {
      const legacyPath = getLegacyContentPath(templateId);
      try {
        const blob = await r2Storage.download(legacyPath);
        if (blob) return await blob.text();
      } catch (e) {
        // Not found
      }
    }

    return null;
  },

  async loadAllTemplateContents(templates: Pick<DocumentTemplate, 'id' | 'format'>[]) {
    const results = await Promise.all(
      templates.map(async (t) => {
        try {
          const content = await templateStorage.loadTemplateContent({
            templateId: t.id,
            format: t.format,
          });
          return [t.id, content] as const;
        } catch (e) {
          console.warn(`[templateStorage] Failed to load content for template ${t.id}:`, e);
          return [t.id, null] as const;
        }
      })
    );

    const map: Record<string, string | null> = {};
    for (const [id, content] of results) {
      map[id] = content;
    }
    return map;
  },
};
