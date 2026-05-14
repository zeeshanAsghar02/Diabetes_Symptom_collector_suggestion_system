import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/lab', '@mui/x-date-pickers'],
          charts: ['recharts', 'apexcharts', 'react-apexcharts', 'chart.js', 'react-chartjs-2', 'echarts', 'echarts-for-react'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});