/**
 * SSR utilities for pounce-board
 * Re-exports from utils.ts for package consumers
 */
export {
	clearSSRData,
	escapeJson,
	getCollectedSSRResponses,
	getSSRData,
	getSSRId,
	injectApiResponses,
	injectSSRData,
	type SSRDataMap,
	withSSRContext,
} from './utils.js'
