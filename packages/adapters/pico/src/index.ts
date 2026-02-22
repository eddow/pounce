/**
 * PicoCSS adapter for @pounce/ui v2
 *
 * Usage:
 * ```tsx
 * import { Button, Card, Modal } from '@pounce/adapter-pico'
 * import '@pounce/adapter-pico/css'
 * ```
 */

// Export all components
export * from './components'
export * from './directives'

// Export factory for custom components
export { picoComponent } from './factory'
