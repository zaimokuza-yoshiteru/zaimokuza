import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages 部署在 /<仓库名>/ 子路径下，构建时补 base；本地开发保持根路径
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/zaimokuza/' : '/',
  plugins: [react(), tailwindcss()],
}))
