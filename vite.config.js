import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages 部署时 base 设为仓库名，本地开发时默认 '/'
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: mode === 'production' ? '/VisaJP-Points-forHighlySkilled/' : '/',
}))
