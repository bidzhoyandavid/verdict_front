import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` задаётся на сборке: приложение живёт под /app на общем домене с
// сайтом, и без префикса бандл искал бы свои ассеты в корне — то есть у
// сайта. Локальная разработка идёт с пустым префиксом, поэтому значение
// приходит извне, а не зашито здесь.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
