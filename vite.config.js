import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base so the built app works whether served from a domain root
// or a GitHub Pages project subpath (https://user.github.io/repo/).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
