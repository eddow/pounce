import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'

componentStyle.sass`
.pounce-loading
	pointer-events: none
	opacity: 0.6
`

const formElements = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'FIELDSET'])

/**
 * Loading directive — sets aria-busy, disables form elements, suppresses pointer events.
 * 
 * Usage: `<button use:loading={saving}>Submit</button>`
 * Works on any element. PicoCSS renders a native spinner via `[aria-busy="true"]`.
 * 
 * Behavior when `true`:
 * - Sets `aria-busy="true"`
 * - Adds adapter's `loading` class (or `pounce-loading` fallback)
 * - Sets `disabled` on form elements (button, input, select, textarea, fieldset)
 * - Suppresses pointer events via CSS
 * 
 * The directive is automatically re-called by pounce's `use:` effect when the value changes.
 */
export function loading(target: Node | Node[], value: boolean) {
	const element = Array.isArray(target) ? target[0] : target
	if (!(element instanceof HTMLElement)) return

	const adapter = getAdapter('Loading')
	const loadingClass = adapter.classes?.base || 'pounce-loading'

	if (value) {
		element.setAttribute('aria-busy', 'true')
		element.classList.add(loadingClass)
		if (formElements.has(element.tagName))
			(element as HTMLButtonElement).disabled = true
	} else {
		element.removeAttribute('aria-busy')
		element.classList.remove(loadingClass)
		if (formElements.has(element.tagName))
			(element as HTMLButtonElement).disabled = false
	}

	return () => {
		element.removeAttribute('aria-busy')
		element.classList.remove(loadingClass)
		if (formElements.has(element.tagName))
			(element as HTMLButtonElement).disabled = false
	}
}
