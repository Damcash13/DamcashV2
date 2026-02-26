import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    // Production build optimizations
    sourcemap: false,          // No source maps in production
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          supabase: ['@supabase/supabase-js'],
          stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          chess: ['chess.js'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  // Remove console.log in production
  esbuild: {
    drop: ['console', 'debugger'],
  },
})
