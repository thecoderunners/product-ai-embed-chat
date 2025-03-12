import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        minify: 'esbuild',
        cssCodeSplit: false,
        lib: {
            // Entry point for your widget
            entry: resolve(__dirname, 'src/script.js'),
            // Output as a self-executing function (IIFE)
            formats: ['iife'],
            // Global variable name that will hold your widget API
            name: 'ChatWidget',
            // Output file name
            fileName: () => 'chat-widget.min.js',
        },
        rollupOptions: {
            output: {
                // Inline all dynamic imports so everything is in one file
                inlineDynamicImports: true,
            },
        },
    },
});
