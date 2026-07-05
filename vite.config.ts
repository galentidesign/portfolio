import react from '@vitejs/plugin-react'
import inertia from '@inertiajs/vite'
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import globalData from '@csstools/postcss-global-data'
import postcssCustomMedia from 'postcss-custom-media'
import portfolioTokens from './app/frontend/ds/tokens/vite-plugin-tokens'

export default defineConfig({
  plugins: [portfolioTokens(), RubyPlugin(), inertia(), react()],
  css: {
    postcss: {
      plugins: [
        globalData({ files: ['app/frontend/ds/tokens/generated/custom-media.css'] }),
        postcssCustomMedia(),
      ],
    },
  },
})
