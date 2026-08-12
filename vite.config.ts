import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { editorDataPlugin } from './dev/editor-data-plugin.ts'

export default defineConfig({
  base: '/tennis_check/',
  plugins: [
    editorDataPlugin(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
  ],
})
