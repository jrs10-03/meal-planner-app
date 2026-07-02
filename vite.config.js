import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built app works whether served from a domain root
// or a GitHub Pages project subpath (https://user.github.io/repo/).
export default defineConfig({
  base: './',
  plugins: [react()],
  // Baked in at build time; shown in Settings so any device can verify its version.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
