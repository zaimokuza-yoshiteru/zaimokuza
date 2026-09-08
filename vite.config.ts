import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 构建与生产预览均使用 GitHub Pages 子路径；本地开发保持根路径。
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/zaimokuza/' : '/',
  plugins: [react(), tailwindcss()],
}))
