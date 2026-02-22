export function resolveElement(target: Node | Node[]): HTMLElement | undefined {
	const el = Array.isArray(target) ? target[0] : target
	return el instanceof HTMLElement ? el : undefined
}
