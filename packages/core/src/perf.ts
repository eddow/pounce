/**
 * Performance instrumentation shim for @pounce/core
 * Conditionally exports native Performance API in development
 */

import { isProd } from 'mutts'

const enabled = !isProd

export const perf = enabled && typeof performance !== 'undefined' ? performance : undefined
