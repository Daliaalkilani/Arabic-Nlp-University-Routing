import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // على ويندوز أحياناً يُقفل ملف داخل public (مزامنة سحابية/مضاد فيروسات) فيسقط
    // مراقب الملفات الأصلي بخطأ EBUSY. الاستطلاع (polling) يتجنّب هذه المشكلة.
    watch: {
      usePolling: true,
      interval: 300
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
