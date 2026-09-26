import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En développement, les appels /api vont au serveur Node (npm run server)
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
