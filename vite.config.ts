import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// On Windows the folder can be opened as c:\... or C:\...; Vite then loads some modules once per
// spelling. Pin the root to one spelling.
const root = fileURLToPath(new URL('.', import.meta.url)).replace(/^[a-z]:/, (d) => d.toUpperCase())
// The account and save server arrives in phase 6 (port 8913); dev and preview already forward /api to it.
const api = { '/api': { target: `http://localhost:${process.env.PORT ?? 8913}` } }

export default defineConfig({
  root,
  // Relative asset paths, so the built game runs from any folder or static host.
