import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This replaces `process.env.API_KEY` with the value of the API_KEY
    // environment variable at build time. This makes the key available
    // in the browser while adhering to the coding guidelines.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
