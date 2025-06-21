/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config.js';
import path from "path";
//import { defineConfig } from "vitest/config";
// import react from "@vitejs/plugin-react-swc";

export default mergeConfig(baseConfig, {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/_setupTest.js',
    css: true,
    watch: true,
    isolate: true,
    forceRerunTriggers: ['**/src/**/*.{js,jsx,ts,tsx}'],
    fileParallelism: true,
    poolOptions: {
      threads: {
        maxThreads: 8
      },
    },
    onConsoleLog: (log, type) => {
      console.log(`[Vitest][${type}] ${log}`);
    },
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],    
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "config": path.resolve(__dirname, "./config/config.js"),
      "components": path.resolve(__dirname, "./src/components"),
      "helpers": path.resolve(__dirname, "./src/helpers"),
      "pages": path.resolve(__dirname, "./src/pages"),
      "store": path.resolve(__dirname, "./src/store"),
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test')
  }
});