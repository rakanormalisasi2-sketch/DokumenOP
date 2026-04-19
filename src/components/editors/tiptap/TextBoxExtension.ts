/**
 * Text Box Extension for TipTap
 * 
 * Implements Microsoft Word 2016-like Text Box behavior:
 * - Object Selected Mode (for moving, resizing)
 * - Text Edit Mode (for editing content)
 * - Shape styling (fill, outline, effects)
 */

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TextBoxNodeView } from './TextBoxNodeView';

export interface TextBoxOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    textBox: {
      /**
       * Insert a new text box
       */
      insertTextBox: (options?: {
        width?: number;
        height?: number;
        posX?: number;
        posY?: number;
        content?: string;
      }) => ReturnType;
      /**
       * Update text box attributes
       */
      updateTextBox: (attributes: Partial<TextBoxAttributes>) => ReturnType;
    };
  }
}

export interface TextBoxAttributes {
  width: number;
  height: number;
  posX: number;
  posY: number;
  rotation: number;
  // Shape fill
  fillColor: string;
  fillOpacity: number;
  // Shape outline
  outlineColor: string;
  outlineWidth: number;
  outlineStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  // Text settings
  verticalAlign: 'top' | 'middle' | 'bottom';
  padding: number;
  // Wrap mode
  wrapMode: 'inline' | 'square' | 'tight' | 'behind' | 'infront';
}

const DEFAULT_ATTRIBUTES: TextBoxAttributes = {
  width: 200,
  height: 100,
  posX: 50,
  posY: 50,
  rotation: 0,
  fillColor: '#ffffff',
  fillOpacity: 1,
  outlineColor: '#374151',
  outlineWidth: 1,
  outlineStyle: 'solid',
  verticalAlign: 'top',
  padding: 8,
  wrapMode: 'square',
};

function parseNumber(v: string | null | undefined, defaultVal: number): number {
  if (!v) return defaultVal;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : defaultVal;
}

export const TextBox = Node.create<TextBoxOptions>({
  name: 'textBox',

  group: 'block',

  content: 'block+',

  draggable: false, // We handle dragging ourselves in the NodeView

  isolating: true,

  defining: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      width: {
        default: DEFAULT_ATTRIBUTES.width,
        parseHTML: (element) => parseNumber(element.getAttribute('data-width'), DEFAULT_ATTRIBUTES.width),
        renderHTML: (attributes) => ({ 'data-width': String(attributes.width) }),
      },
      height: {
        default: DEFAULT_ATTRIBUTES.height,
        parseHTML: (element) => parseNumber(element.getAttribute('data-height'), DEFAULT_ATTRIBUTES.height),
        renderHTML: (attributes) => ({ 'data-height': String(attributes.height) }),
      },
      posX: {
        default: DEFAULT_ATTRIBUTES.posX,
        parseHTML: (element) => parseNumber(element.getAttribute('data-pos-x'), DEFAULT_ATTRIBUTES.posX),
        renderHTML: (attributes) => ({ 'data-pos-x': String(attributes.posX) }),
      },
      posY: {
        default: DEFAULT_ATTRIBUTES.posY,
        parseHTML: (element) => parseNumber(element.getAttribute('data-pos-y'), DEFAULT_ATTRIBUTES.posY),
        renderHTML: (attributes) => ({ 'data-pos-y': String(attributes.posY) }),
      },
      rotation: {
        default: DEFAULT_ATTRIBUTES.rotation,
        parseHTML: (element) => parseNumber(element.getAttribute('data-rotation'), DEFAULT_ATTRIBUTES.rotation),
        renderHTML: (attributes) => ({ 'data-rotation': String(attributes.rotation) }),
      },
      fillColor: {
        default: DEFAULT_ATTRIBUTES.fillColor,
        parseHTML: (element) => element.getAttribute('data-fill-color') || DEFAULT_ATTRIBUTES.fillColor,
        renderHTML: (attributes) => ({ 'data-fill-color': attributes.fillColor }),
      },
      fillOpacity: {
        default: DEFAULT_ATTRIBUTES.fillOpacity,
        parseHTML: (element) => parseNumber(element.getAttribute('data-fill-opacity'), DEFAULT_ATTRIBUTES.fillOpacity),
        renderHTML: (attributes) => ({ 'data-fill-opacity': String(attributes.fillOpacity) }),
      },
      outlineColor: {
        default: DEFAULT_ATTRIBUTES.outlineColor,
        parseHTML: (element) => element.getAttribute('data-outline-color') || DEFAULT_ATTRIBUTES.outlineColor,
        renderHTML: (attributes) => ({ 'data-outline-color': attributes.outlineColor }),
      },
      outlineWidth: {
        default: DEFAULT_ATTRIBUTES.outlineWidth,
        parseHTML: (element) => parseNumber(element.getAttribute('data-outline-width'), DEFAULT_ATTRIBUTES.outlineWidth),
        renderHTML: (attributes) => ({ 'data-outline-width': String(attributes.outlineWidth) }),
      },
      outlineStyle: {
        default: DEFAULT_ATTRIBUTES.outlineStyle,
        parseHTML: (element) => element.getAttribute('data-outline-style') || DEFAULT_ATTRIBUTES.outlineStyle,
        renderHTML: (attributes) => ({ 'data-outline-style': attributes.outlineStyle }),
      },
      verticalAlign: {
        default: DEFAULT_ATTRIBUTES.verticalAlign,
        parseHTML: (element) => element.getAttribute('data-vertical-align') || DEFAULT_ATTRIBUTES.verticalAlign,
        renderHTML: (attributes) => ({ 'data-vertical-align': attributes.verticalAlign }),
      },
      padding: {
        default: DEFAULT_ATTRIBUTES.padding,
        parseHTML: (element) => parseNumber(element.getAttribute('data-padding'), DEFAULT_ATTRIBUTES.padding),
        renderHTML: (attributes) => ({ 'data-padding': String(attributes.padding) }),
      },
      wrapMode: {
        default: DEFAULT_ATTRIBUTES.wrapMode,
        parseHTML: (element) => element.getAttribute('data-wrap-mode') || DEFAULT_ATTRIBUTES.wrapMode,
        renderHTML: (attributes) => ({ 'data-wrap-mode': attributes.wrapMode }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="text-box"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'text-box',
        class: 'tiptap-text-box',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertTextBox:
        (options: {
          width?: number;
          height?: number;
          content?: string;
          posX?: number;
          posY?: number;
        } = {}) =>
        ({ chain, state }) => {
          const { selection } = state;
          const position = selection.anchor;
          
          const width = options?.width ?? DEFAULT_ATTRIBUTES.width;
          const height = options?.height ?? DEFAULT_ATTRIBUTES.height;
          const posX = options?.posX ?? DEFAULT_ATTRIBUTES.posX;
          const posY = options?.posY ?? DEFAULT_ATTRIBUTES.posY;
          const textContent = options?.content ?? 'Ketik teks di sini...';

          const nodeContent = {
            type: this.name,
            attrs: {
              width,
              height,
              posX,
              posY,
              wrapMode: 'square',
              fillColor: '#ffffff',
              outlineColor: '#374151',
              outlineWidth: 1,
              outlineStyle: 'solid',
              verticalAlign: 'top',
              padding: 8,
              rotation: 0,
            },
            content: [
              {
                type: 'paragraph',
                content: textContent ? [
                  {
                    type: 'text',
                    text: textContent,
                  },
                ] : [],
              },
            ],
          };

          return chain()
            .insertContentAt(position, nodeContent)
            .run();
        },

      updateTextBox:
        (attributes) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, attributes);
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(TextBoxNodeView);
  },

  addKeyboardShortcuts() {
    return {
      Escape: () => {
        // This will be handled by the node view
        return false;
      },
    };
  },
});
