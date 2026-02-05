import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/core',
  'packages/kit',
  'packages/ui',
  'packages/board',
  'packages/plugin',
])
