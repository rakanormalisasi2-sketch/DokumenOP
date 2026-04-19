/**
 * Custom TipTap Font Size Extension with Microsoft Word 2016 Behavior
 * 
 * Implements:
 * - Word-style font size stepping (non-linear)
 * - Selection-aware font size changes
 * - Mixed font size handling
 * - Keyboard shortcuts
 */

import { Extension } from '@tiptap/core';
import { 
  getNextLargerSize, 
  getNextSmallerSize, 
  increaseSizeBy1pt, 
  decreaseSizeBy1pt,
  parseFontSize 
} from './FontSizeUtils';

export interface WordFontSizeOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wordFontSize: {
      /**
       * Set the font size (Word style)
       */
      setWordFontSize: (size: string) => ReturnType;
      /**
       * Unset the font size
       */
      unsetWordFontSize: () => ReturnType;
      /**
       * Increase font size using Word 2016 stepping
       */
      growFont: () => ReturnType;
      /**
       * Decrease font size using Word 2016 stepping
       */
      shrinkFont: () => ReturnType;
      /**
       * Increase font size by 1pt (Ctrl+])
       */
      growFontBy1: () => ReturnType;
      /**
       * Decrease font size by 1pt (Ctrl+[)
       */
      shrinkFontBy1: () => ReturnType;
    };
  }
}

export const WordFontSize = Extension.create<WordFontSizeOptions>({
  name: 'wordFontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, '') || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setWordFontSize: (size: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: size })
          .run();
      },
      
      unsetWordFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },

      growFont: () => ({ chain, state, tr }) => {
        const { from, to, empty } = state.selection;
        
        // If no selection, set mark for next input
        if (empty) {
          const marks = state.storedMarks || state.selection.$from.marks();
          const textStyleMark = marks.find(m => m.type.name === 'textStyle');
          const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
          const newSize = getNextLargerSize(currentSize);
          
          return chain()
            .setMark('textStyle', { fontSize: `${newSize}pt` })
            .run();
        }

        // For selection, we need to apply relative size changes
        let modified = false;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText) return;

          // Get current marks on this text node
          const marks = node.marks;
          const textStyleMark = marks.find(m => m.type.name === 'textStyle');
          const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
          const newSize = getNextLargerSize(currentSize);

          // Calculate the range of this node within our selection
          const nodeStart = Math.max(from, pos);
          const nodeEnd = Math.min(to, pos + node.nodeSize);

          if (nodeStart < nodeEnd) {
            // Apply new font size to this range
            const markType = state.schema.marks.textStyle;
            if (markType) {
              const newMark = markType.create({ 
                ...(textStyleMark?.attrs || {}),
                fontSize: `${newSize}pt` 
              });
              tr.addMark(nodeStart, nodeEnd, newMark);
              modified = true;
            }
          }
        });

        if (modified) {
          return true;
        }

        // Fallback: apply uniform increase
        const marks = state.selection.$from.marks();
        const textStyleMark = marks.find(m => m.type.name === 'textStyle');
        const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
        const newSize = getNextLargerSize(currentSize);
        
        return chain()
          .setMark('textStyle', { fontSize: `${newSize}pt` })
          .run();
      },

      shrinkFont: () => ({ chain, state, tr }) => {
        const { from, to, empty } = state.selection;
        
        // If no selection, set mark for next input
        if (empty) {
          const marks = state.storedMarks || state.selection.$from.marks();
          const textStyleMark = marks.find(m => m.type.name === 'textStyle');
          const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
          const newSize = getNextSmallerSize(currentSize);
          
          return chain()
            .setMark('textStyle', { fontSize: `${newSize}pt` })
            .run();
        }

        // For selection, apply relative size changes
        let modified = false;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText) return;

          const marks = node.marks;
          const textStyleMark = marks.find(m => m.type.name === 'textStyle');
          const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
          const newSize = getNextSmallerSize(currentSize);

          const nodeStart = Math.max(from, pos);
          const nodeEnd = Math.min(to, pos + node.nodeSize);

          if (nodeStart < nodeEnd) {
            const markType = state.schema.marks.textStyle;
            if (markType) {
              const newMark = markType.create({ 
                ...(textStyleMark?.attrs || {}),
                fontSize: `${newSize}pt` 
              });
              tr.addMark(nodeStart, nodeEnd, newMark);
              modified = true;
            }
          }
        });

        if (modified) {
          return true;
        }

        // Fallback
        const marks = state.selection.$from.marks();
        const textStyleMark = marks.find(m => m.type.name === 'textStyle');
        const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
        const newSize = getNextSmallerSize(currentSize);
        
        return chain()
          .setMark('textStyle', { fontSize: `${newSize}pt` })
          .run();
      },

      growFontBy1: () => ({ chain, state, tr }) => {
        const { from, to, empty } = state.selection;
        
        if (empty) {
          const marks = state.storedMarks || state.selection.$from.marks();
          const textStyleMark = marks.find(m => m.type.name === 'textStyle');
          const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
          const newSize = increaseSizeBy1pt(currentSize);
          
          return chain()
            .setMark('textStyle', { fontSize: `${newSize}pt` })
            .run();
        }

        // For selection, apply to all text nodes
        let modified = false;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText) return;

          const marks = node.marks;
          const textStyleMark = marks.find(m => m.type.name === 'textStyle');
          const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
          const newSize = increaseSizeBy1pt(currentSize);

          const nodeStart = Math.max(from, pos);
          const nodeEnd = Math.min(to, pos + node.nodeSize);

          if (nodeStart < nodeEnd) {
            const markType = state.schema.marks.textStyle;
            if (markType) {
              const newMark = markType.create({ 
                ...(textStyleMark?.attrs || {}),
                fontSize: `${newSize}pt` 
              });
              tr.addMark(nodeStart, nodeEnd, newMark);
              modified = true;
            }
          }
        });

        return modified || chain()
          .setMark('textStyle', { fontSize: `${increaseSizeBy1pt(12)}pt` })
          .run();
      },

      shrinkFontBy1: () => ({ chain, state, tr }) => {
        const { from, to, empty } = state.selection;
        
        if (empty) {
          const marks = state.storedMarks || state.selection.$from.marks();
          const textStyleMark = marks.find(m => m.type.name === 'textStyle');
          const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
          const newSize = decreaseSizeBy1pt(currentSize);
          
          return chain()
            .setMark('textStyle', { fontSize: `${newSize}pt` })
            .run();
        }

        // For selection, apply to all text nodes
        let modified = false;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (!node.isText) return;

          const marks = node.marks;
          const textStyleMark = marks.find(m => m.type.name === 'textStyle');
          const currentSize = parseFontSize(textStyleMark?.attrs.fontSize);
          const newSize = decreaseSizeBy1pt(currentSize);

          const nodeStart = Math.max(from, pos);
          const nodeEnd = Math.min(to, pos + node.nodeSize);

          if (nodeStart < nodeEnd) {
            const markType = state.schema.marks.textStyle;
            if (markType) {
              const newMark = markType.create({ 
                ...(textStyleMark?.attrs || {}),
                fontSize: `${newSize}pt` 
              });
              tr.addMark(nodeStart, nodeEnd, newMark);
              modified = true;
            }
          }
        });

        return modified || chain()
          .setMark('textStyle', { fontSize: `${decreaseSizeBy1pt(12)}pt` })
          .run();
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl+Shift+> - Increase font size (Word style stepping)
      'Mod-Shift->': () => this.editor.commands.growFont(),
      'Mod-Shift-.': () => this.editor.commands.growFont(),
      
      // Ctrl+Shift+< - Decrease font size (Word style stepping)
      'Mod-Shift-<': () => this.editor.commands.shrinkFont(),
      'Mod-Shift-,': () => this.editor.commands.shrinkFont(),
      
      // Ctrl+] - Increase by 1pt
      'Mod-]': () => this.editor.commands.growFontBy1(),
      
      // Ctrl+[ - Decrease by 1pt
      'Mod-[': () => this.editor.commands.shrinkFontBy1(),
    };
  },
});

/**
 * Helper function to get current font size from editor state
 */
export function getCurrentFontSize(editor: any): { size: number | null; isMixed: boolean } {
  if (!editor) return { size: null, isMixed: false };

  const { from, to, empty } = editor.state.selection;

  if (empty) {
    const marks = editor.state.storedMarks || editor.state.selection.$from.marks();
    const textStyleMark = marks.find((m: any) => m.type.name === 'textStyle');
    return { 
      size: parseFontSize(textStyleMark?.attrs.fontSize), 
      isMixed: false 
    };
  }

  // Check all text nodes in selection
  const sizes = new Set<number>();
  editor.state.doc.nodesBetween(from, to, (node: any) => {
    if (!node.isText) return;
    const marks = node.marks;
    const textStyleMark = marks.find((m: any) => m.type.name === 'textStyle');
    sizes.add(parseFontSize(textStyleMark?.attrs.fontSize));
  });

  if (sizes.size === 0) {
    return { size: 12, isMixed: false };
  }

  if (sizes.size === 1) {
    return { size: Array.from(sizes)[0], isMixed: false };
  }

  return { size: null, isMixed: true };
}
