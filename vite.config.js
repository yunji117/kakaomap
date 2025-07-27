import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
  },
  server: {
    proxy: {
      '/api/vworld': {
        target: 'https://api.vworld.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vworld/, ''),
        secure: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Vite/1.0)',
        }
      }
    }
  }
})
