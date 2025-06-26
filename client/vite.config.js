import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import dotenv from "dotenv";

// Load .env.local file to make all variables available
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

console.log("**************VITE_PROXY:",process.env.VITE_PROXY)
console.log("**************All VITE_ env vars:", Object.keys(process.env).filter(key => key.startsWith('VITE_')))

// Debug the define object
const defineObject = {
  //"VITE_GRR": JSON.stringify(process.env.GRR),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
};
console.log("**************Define object:", defineObject);
console.log("**************VITE_PROXY2 value:", defineObject["VITE_PROXY"]);

// https://vitejs.dev/config/
export default defineConfig({
  define: defineObject,
  server: {
    port: 3000,
    host: 'localhost', // Use localhost instead of 0.0.0.0
    // https: true, // Using local-ssl-proxy instead
    proxy: {
      //mock server should have the same endpoint as the eventual live endpoint
      //that way we can just remove "mock/" and switch to live endpoint.
      "/api": {   
        target: process.env.VITE_PROXY,// || "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/api/, "/api"),
        //rewrite: (path)=> path.replace(/^\/api\/mock/,"api"),
      },

      "/api/mock": {   
        target: "http://localhost:5000",
        changeOrigin: true,
        rewrite: (path)=> path.replace(/^\/api\/mock/,"api"),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
        // Ensure chunks are named consistently
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "config": path.resolve(__dirname, "./config/config.js"),
      "components": path.resolve(__dirname, "./src/components"),
      "helpers": path.resolve(__dirname, "./src/helpers"),
      "pages": path.resolve(__dirname, "./src/pages"),
      "store": path.resolve(__dirname, "./src/store"),
      //"assets": path.resolve(__dirname, "./src/assets"),
      
    },
  },
  plugins: [react()],
  optimizeDeps:{
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/material/Tooltip',
      '@mui/material/styles/createTheme',
      '@mui/material/Box',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      '@mui/x-data-grid',
      '@mui/lab',
      '@mui/system',
    ]
  },
  envDir: '.',
  envPrefix: 'VITE_',
});
