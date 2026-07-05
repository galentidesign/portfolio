import type { Plugin } from 'vite'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTokens } from './build.mjs'

const tokensDir = dirname(fileURLToPath(import.meta.url))

export default function portfolioTokens(): Plugin {
  return {
    name: 'portfolio:tokens',

    // Runs synchronously so generated files exist before PostCSS/anything reads them.
    // Covers vite build, vite dev, and vitest-style config loads.
    config() {
      buildTokens()
    },

    buildStart() {
      buildTokens()
    },

    configureServer(server) {
      server.watcher.add(tokensDir)

      const rebuild = () => {
        try {
          buildTokens()
          server.config.logger.info('[portfolio:tokens] rebuilt')
        } catch (err) {
          server.config.logger.error(`[portfolio:tokens] ${(err as Error).message}`)
        }
      }

      server.watcher.on('add', (path: string) => {
        if (path.endsWith('.tokens.json') && dirname(path) === tokensDir) rebuild()
      })
      server.watcher.on('change', (path: string) => {
        if (path.endsWith('.tokens.json') && dirname(path) === tokensDir) rebuild()
      })
      server.watcher.on('unlink', (path: string) => {
        if (path.endsWith('.tokens.json') && dirname(path) === tokensDir) rebuild()
      })
    },
  }
}
