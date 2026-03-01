// Test entry point for @pounce/kit
// Re-exports all kit public API plus test-only internals

export * from '../packages/kit/src/index'

// Test-only internals from core
export { mountedNodes } from '../packages/core/src/shared'
