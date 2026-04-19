import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core
          if (id.includes('node_modules/react')) return 'vendor-react';

          // ProseMirror core (state + model)
          if (id.includes('prosemirror-state') || id.includes('prosemirror-model')) {
            return 'vendor-prosemirror-core';
          }

          // ProseMirror view + commands
          if (id.includes('prosemirror-view') || id.includes('prosemirror-commands') || id.includes('prosemirror-keymap')) {
            return 'vendor-prosemirror-view';
          }

          // ProseMirror tables + history
          if (id.includes('prosemirror-tables') || id.includes('prosemirror-history') || id.includes('prosemirror-dropcursor')) {
            return 'vendor-prosemirror-ext';
          }

          // ProseMirror input + transform
          if (id.includes('prosemirror-inputrules') || id.includes('prosemirror-transform')) {
            return 'vendor-prosemirror-transform';
          }

          // DOCX libraries
          if (id.includes('node_modules/docxtemplater') || id.includes('node_modules/pizzip') || id.includes('node_modules/jszip')) {
            return 'vendor-docx';
          }

          // Layout engine split
          if (id.includes('src/lib/docx-editor/layout')) {
            return 'editor-layout';
          }

          // UI components split
          if (id.includes('src/lib/docx-editor/components/ui')) {
            return 'editor-ui';
          }

          // Dialogs split (lazy-loaded dialog components)
          if (id.includes('src/lib/docx-editor/components/dialogs')) {
            return 'app-dialogs';
          }

          // Paged editor + layout components split
          if (
            id.includes('src/lib/docx-editor/components/PagedEditor') ||
            id.includes('src/lib/docx-editor/layout')
          ) {
            return 'app-layout';
          }
        }
      }
    }
  }
}));
