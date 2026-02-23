/**
 * Performance instrumentation shim for @pounce/core
 * Conditionally exports native Performance API in development
 */

import { isDev } from 'mutts'

const enabled = isDev

export const perf = enabled && typeof performance !== 'undefined' ? performance : undefined
