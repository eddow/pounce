/**
 * Pico-native tooltip directive.
 *
 * Leverages PicoCSS's built-in `data-tooltip` and `data-placement` attributes
 * for pure-CSS tooltips — no JavaScript positioning needed.
 *
 * Usage:
 *   <button use:tooltip="Save">💾</button>
 *   <button use:tooltip={{ text: 'Save', placement: 'bottom' }}>💾</button>
 */

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'

export type TooltipOptions = {
	text: string
	placement?: TooltipPlacement
}

export type TooltipInput = string | TooltipOptions

function isOptions(input: TooltipInput): input is TooltipOptions {
	return typeof input === 'object' && input !== null && 'text' in input
}

export function tooltip(target: Node | Node[], input: TooltipInput) {
	const element = Array.isArray(target) ? target[0] : target
	if (!(element instanceof HTMLElement)) return

	const options: TooltipOptions = isOptions(input) ? input : { text: input }

	element.setAttribute('data-tooltip', options.text)
	if (options.placement && options.placement !== 'top') {
		element.setAttribute('data-placement', options.placement)
	}

	return () => {
		element.removeAttribute('data-tooltip')
		element.removeAttribute('data-placement')
	}
}
