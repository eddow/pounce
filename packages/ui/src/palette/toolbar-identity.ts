import type { PaletteToolbar } from './types'

const toolbarIdentities = new WeakMap<PaletteToolbar, string>()
let nextToolbarIdentity = 0

export function getToolbarIdentity(toolbar: PaletteToolbar): string {
	const existing = toolbarIdentities.get(toolbar)
	if (existing) return existing
	const identity = `toolbar:${++nextToolbarIdentity}`
	toolbarIdentities.set(toolbar, identity)
	return identity
}

export function adoptToolbarIdentity(
	target: PaletteToolbar,
	source: PaletteToolbar
): PaletteToolbar {
	toolbarIdentities.set(target, getToolbarIdentity(source))
	return target
}
