import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./app/frontend', import.meta.url)),
      '~': fileURLToPath(new URL('./app/frontend', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['app/frontend/**/*.test.{ts,tsx}'],
    setupFiles: ['./app/frontend/test/setup.ts'],
  },
})
