import { resolveElement } from './shared'

const FORM_ELEMENTS = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'FIELDSET'])

/**
 * `use:loading` directive — sets `aria-busy`, disables form elements, suppresses pointer events.
 *
 * The adapter can add a CSS class for visual spinner; the directive itself only manages
 * `aria-busy` and `disabled`. Pass `loadingClass` to also toggle a CSS class.
 *
 * @example
 * ```tsx
 * <button use:loading={saving}>Submit</button>
 * ```
 */
export function loading(
	target: Node | Node[],
	value: boolean,
	_scope?: Record<PropertyKey, unknown>,
	loadingClass?: string
): (() => void) | undefined {
	const element = resolveElement(target)
	if (!element) return

	const isFormEl = FORM_ELEMENTS.has(element.tagName)
	let wasDisabled = false

	const apply = (active: boolean) => {
		if (active) {
			wasDisabled = isFormEl && (element as HTMLButtonElement).disabled
			element.setAttribute('aria-busy', 'true')
			if (loadingClass) element.classList.add(loadingClass)
			if (isFormEl) {
				;(element as HTMLButtonElement).disabled = true
			}
		} else {
			element.removeAttribute('aria-busy')
			if (loadingClass) element.classList.remove(loadingClass)
			if (isFormEl) {
				;(element as HTMLButtonElement).disabled = wasDisabled
			}
		}
	}

	apply(value)
	return () => apply(false)
}
