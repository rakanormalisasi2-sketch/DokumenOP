import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ResizableImageNodeView } from './ResizableImageNodeView';

function parsePx(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(String(v).replace('px', ''));
  return Number.isFinite(n) ? n : null;
}

function parseNumber(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function parseBoolean(v: string | null | undefined): boolean {
  return v === 'true' || v === '1';
}

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          return parsePx(el.getAttribute('width')) ?? parsePx((el as any).style?.width) ?? null;
        },
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: String(attributes.width) };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          return parsePx(el.getAttribute('height')) ?? parsePx((el as any).style?.height) ?? null;
        },
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: String(attributes.height) };
        },
      },
      rotation: {
        default: 0,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          return parseNumber(el.getAttribute('data-rotation')) ?? 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.rotation) return {};
          return { 'data-rotation': String(attributes.rotation) };
        },
      },
      flipX: {
        default: false,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          return parseBoolean(el.getAttribute('data-flip-x'));
        },
        renderHTML: (attributes) => {
          if (!attributes.flipX) return {};
          return { 'data-flip-x': 'true' };
        },
      },
      flipY: {
        default: false,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          return parseBoolean(el.getAttribute('data-flip-y'));
        },
        renderHTML: (attributes) => {
          if (!attributes.flipY) return {};
          return { 'data-flip-y': 'true' };
        },
      },
      wrapMode: {
        default: 'inline',
        parseHTML: (element) => {
          const el = element as HTMLElement;
          return el.getAttribute('data-wrap-mode') ?? 'inline';
        },
        renderHTML: (attributes) => {
          if (attributes.wrapMode === 'inline') return {};
          return { 'data-wrap-mode': attributes.wrapMode };
        },
      },
      posX: {
        default: 0,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          return parseNumber(el.getAttribute('data-pos-x')) ?? 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.posX) return {};
          return { 'data-pos-x': String(attributes.posX) };
        },
      },
      posY: {
        default: 0,
        parseHTML: (element) => {
          const el = element as HTMLElement;
          return parseNumber(el.getAttribute('data-pos-y')) ?? 0;
        },
        renderHTML: (attributes) => {
          if (!attributes.posY) return {};
          return { 'data-pos-y': String(attributes.posY) };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView);
  },
});
