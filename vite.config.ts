import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
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
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror')) {
            return 'vendor-tiptap';
          }
          if (id.includes('node_modules/html-to-docx')) {
            return 'vendor-docx';
          }
          if (id.includes('node_modules/xlsx') || id.includes('node_modules/luckyexcel')) {
            return 'vendor-xlsx';
          }
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/lucide-react')) {
            return 'vendor-ui';
          }
          if (id.includes('node_modules/@syncfusion')) {
            return 'vendor-syncfusion';
          }
          if (id.includes('node_modules/docxtemplater') || id.includes('node_modules/pizzip') || id.includes('node_modules/docx-preview')) {
            return 'vendor-docx-utils';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
}));
