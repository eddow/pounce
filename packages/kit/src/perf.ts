/**
 * Performance instrumentation shim for @pounce/kit
 * Conditionally exports native Performance API in development
 */

import { isDev } from 'mutts'

const enabled = isDev

export const perf = enabled && typeof performance !== 'undefined' ? performance : undefined
