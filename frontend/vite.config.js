import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5174,           // match your chosen port
    strictPort: true
  }
})

//export default defineConfig({
//  plugins: [react()],
//  server: {
//    proxy: {
//      '/api': 'http://localhost:8000',
//    }
//  }
//});
