/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig, mergeConfig } from 'vite';
import baseConfig from './vite.config.js';
// import path from "path";
//import { defineConfig } from "vitest/config";
// import react from "@vitejs/plugin-react-swc";

export default mergeConfig(baseConfig, {
  test: {
    globals:true,
    environment:'happy-dom', //"jsdom",
    setupFiles: './src/test/_setupTest.js',
    css: true,
    watch: true,
    isolate: true, // <-- this helps with stale state
    forceRerunTriggers: ['**/src/**/*.{js,jsx,ts,tsx}'], // triggers full rerun
    //clearScreen: false // Explicitly prevents clearing 
    fileParallelism: true, // default: true
    poolOptions: {
      threads: {
        maxThreads: 8 // Adjust based on your CPU cores
      },
    },
    onConsoleLog: (log, type) => {
      // helpful for debugging
      console.log(`[Vitest][${type}] ${log}`);
    },
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],  // Only test files
    exclude: ['node_modules', 'dist'],    
    clearMocks: true,
    restoreMocks: true,     
  },
});