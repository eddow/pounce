import { bootstrap } from './bootstrap.js'

// Bootstrap the Node environment (sets up Proxies/ALS getters)
bootstrap()

// Re-export the core API
export * from '../index.js'

// Also export the withSSR helper which is Node-specific
export { withSSR, renderToString, renderToStringAsync } from '../lib/server.js'
