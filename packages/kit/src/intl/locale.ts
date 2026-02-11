import { client } from '../platform/shared'

let localeOverride: (() => string | undefined) | null = null

/**
 * Register a locale resolver for scoped overrides (e.g. DisplayProvider).
 * The resolver should return the overridden locale, or undefined to fall back to client.language.
 */
export function setLocaleResolver(resolver: () => string | undefined) {
	localeOverride = resolver
}

/**
 * Resolve the effective locale: explicit prop > scoped override > client.language
 */
export function resolveLocale(explicit?: string): string {
	return explicit ?? localeOverride?.() ?? client?.language ?? 'en-US'
}
