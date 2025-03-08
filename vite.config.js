import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        // Set minification to esbuild (faster than terser)
        minify: 'esbuild',

        // Disable CSS code splitting to get a single JS file with CSS embedded
        cssCodeSplit: false,

        // Configure the library output
        lib: {
            // Your entry point
            entry: resolve(__dirname, 'src/script.js'),

            // Output format - 'iife' for a self-executing function
            formats: ['iife'],

            // The name of the global variable
            name: 'ChatWidget',

            // File name of the output bundle
            fileName: () => 'chat-widget.min.js',
        },

        // Configure rollup
        rollupOptions: {
            output: {
                // Ensure all CSS is inlined into the JavaScript bundle
                inlineDynamicImports: true,

                // Ensure there are no chunk splitting
                manualChunks: undefined,

                // Override default Vite chunk naming
                entryFileNames: 'chat-widget.min.js',
                assetFileNames: (assetInfo) => {
                    // Don't generate separate CSS files
                    if (assetInfo.name === 'style.css') return 'chat-widget-styles.css';
                    return assetInfo.name;
                },
            },
        },
    },
});