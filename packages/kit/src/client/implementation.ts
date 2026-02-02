import { reactive } from 'mutts'
import type { Client, ClientHistoryState, ClientUrl, ClientViewport } from './types.js'

type MutableClient = Client & {
	url: ClientUrl
	viewport: ClientViewport
	history: ClientHistoryState
}

const DEFAULT_BASE_URL = 'http://localhost/'

import { implementationDependent } from '@pounce/core'

// --- Default State ---

function createDefaultUrl(): ClientUrl {
	const url = new URL(DEFAULT_BASE_URL)
	return {
		href: url.href,
		origin: url.origin,
		pathname: url.pathname,
		search: url.search,
		hash: url.hash,
		segments: [],
		query: {},
	}
}

const state = reactive<MutableClient>({
	url: createDefaultUrl(),
	viewport: { width: 0, height: 0 },
	history: { length: 0 },
	focused: false,
	visibilityState: 'hidden',
	devicePixelRatio: 1,
	online: true,
	language: 'en-US',
	timezone: 'UTC',
	// Default methods throw
	navigate: implementationDependent,
	replace: implementationDependent,
	reload: implementationDependent,
	dispose: () => {}, // Dispose is safe to be no-op by default
	prefersDark: () => false,
})

export const client = state as Client
