import { effect, reactive } from 'mutts'
import { bindApp, compose, isElement } from '@pounce/core'
import { tablerOutlineX } from 'pure-glyf/icons'
import { css } from '@pounce/kit'
import { Icon } from './icon'
import { Variant, variantClass } from './variants'

css`
.pp-size-sm {
	width: 22rem;
}

.pp-size-md {
	width: 32rem;
}

.pp-size-lg {
	width: 48rem;
}

footer > .pp-actions[role='group'] {
	display: flex;
	justify-content: flex-end;
	width: 100%;
}

footer > .pp-actions[role='group'] > * {
	flex: 0 0 auto;
}

footer > .pp-actions[role='group'] button {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
}

footer > .pp-actions[role='group'] button .pp-button-icon {
	display: inline-flex;
	align-items: center;
}

footer > .pp-actions[role='group'] button .pp-button-label {
	display: inline-flex;
}

.pp-dialog-article .pp-body {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 1rem;
	align-items: start;
	min-width: 0;
}

.pp-dialog-article .pp-body .pp-stamp {
	width: 4rem;
	height: 4rem;
	border-radius: 0.5rem;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--pico-muted-border-color, #e5e7eb);
}

.pp-dialog-article .pp-body .pp-stamp .pure-glyf-icon {
	width: 2.25rem;
	height: 2.25rem;
}
`

export type UIContent = string | JSX.Element
export type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogButton {
	text: string
	variant?: Variant
	disabled?: boolean
	icon?: string | JSX.Element
}

export interface DialogOptions<Buttons extends Record<string, UIContent | DialogButton>> {
	title?: UIContent
	message?: UIContent
	// Optional left-side visual stamp (e.g., large icon)
	stamp?: UIContent
	// Map of return value -> label/content/spec
	buttons?: Buttons
	default?: keyof Buttons
	size?: DialogSize
	closeOnBackdrop?: boolean
	closeOnEscape?: boolean
	ariaLabel?: string
	class?: string
}

type PendingDialog = {
	options: DialogOptions<any>
	defaultButton: HTMLElement | undefined
	resolve: (value: PropertyKey | null) => void
}

// Default: single action
const okButton: DialogButton = { text: 'Ok', variant: 'primary' }

const state = reactive({
	pending: null as PendingDialog | null,
	open: false,
	get dialogElement(): HTMLDialogElement | undefined {
		return document.getElementById('pp-dialog-el') as HTMLDialogElement | undefined
	},
})

let lastActiveElement: HTMLElement | null = null
let trapKeydownListener: ((e: KeyboardEvent) => void) | null = null
let trapKeyupListener: ((e: KeyboardEvent) => void) | null = null
function getOrderedTabstops(root: HTMLElement): HTMLElement[] {
	// 1) Header close button (if present)
	const headerClose = (root.querySelector('header .pp-icon-btn') as HTMLElement | null) ?? undefined
	// 2) Footer primary/actions (in DOM order)
	const footerActions = Array.from(
		root.querySelectorAll<HTMLElement>('footer .pp-actions button:not([disabled])')
	)
	// 3) Other focusables in content area (exclude header close and footer actions to avoid dupes)
	const genericSelector = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	].join(', ')
	const all = Array.from(root.querySelectorAll<HTMLElement>(genericSelector))
	const exclusions = new Set<HTMLElement>(footerActions)
	if (headerClose) exclusions.add(headerClose)
	const contentFocusables = all.filter((el) => !exclusions.has(el))
	// 4) Fallback to the dialog element itself
	const result: HTMLElement[] = []
	if (headerClose) result.push(headerClose)
	result.push(...footerActions)
	result.push(...contentFocusables)
	result.push(root)
	return result
}
function attachGlobalTrap() {
	if (trapKeydownListener) return
	trapKeydownListener = (ev: KeyboardEvent) => {
		if (ev.key !== 'Tab') return
		const root = state.dialogElement
		if (!state.open) return
		// Capture phase trap to win over other handlers; block default always while open
		ev.preventDefault()
		ev.stopPropagation()
		if (!root) {
			// Dialog not yet mounted; defer focusing to next tick
			setTimeout(() => state.dialogElement?.focus(), 0)
			return
		}
		// Explicit tabstop order
		if (root.tabIndex < 0) root.tabIndex = -1
		const focusables = getOrderedTabstops(root)
		const active = document.activeElement as HTMLElement | null
		const count = focusables.length
		if (count === 0) {
			root.focus()
			return
		}
		// Find current index within list (default to -1 if not in list)
		let idx = active ? focusables.indexOf(active) : -1
		if (ev.shiftKey) {
			idx = idx <= 0 ? count - 1 : idx - 1
		} else {
			idx = idx < 0 || idx === count - 1 ? 0 : idx + 1
		}
		const next = focusables[idx] ?? root
		next.focus()
	}
	document.addEventListener('keydown', trapKeydownListener, true)
	// Reinforce on keyup to handle late focus changes
	trapKeyupListener = (ev: KeyboardEvent) => {
		if (ev.key !== 'Tab' || !state.open) return
		ev.preventDefault()
		ev.stopPropagation()
		const root = state.dialogElement
		if (!root) return
		const focusables = getOrderedTabstops(root)
		const target = focusables[0] ?? root
		target.focus()
	}
	document.addEventListener('keyup', trapKeyupListener, true)
}
function detachGlobalTrap() {
	if (trapKeydownListener) {
		document.removeEventListener('keydown', trapKeydownListener, true)
		trapKeydownListener = null
	}
	if (trapKeyupListener) {
		document.removeEventListener('keyup', trapKeyupListener, true)
		trapKeyupListener = null
	}
}

function closeCurrent(value: PropertyKey | null) {
	const current = state.pending
	if (!current) return
	state.open = false
	detachGlobalTrap()
	// close native modal if present
	try {
		state.dialogElement?.close()
	} catch (error) {
		console.error('Failed to close native dialog:', error)
	}
	// re-enable app interactions while dialog is closed
	document.documentElement.classList.remove('modal-is-open')
	document.documentElement.classList.remove('modal-is-opening')
	document.documentElement.classList.remove('modal-is-closing')
	const resolve = current.resolve
	state.pending = null
	resolve(value)
	// restore focus to the element that opened the dialog
	if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
		try {
			lastActiveElement.focus()
		} catch (error) {
			console.error('Failed to restore focus:', error)
		}
	}
	lastActiveElement = null
}

const Host = () => {
	const titleId = 'pp-dialog-title'

	// Inner content renderer
	const content = () => {
		const pending = state.pending
		if (!pending) return null
		const opts = pending.options

		return (
			<article class="pp-dialog-article">
				{opts.title ? (
					<header>
						<button
							aria-label="Close"
							class="pp-icon-btn"
							style="float: right;"
							onClick={() => closeCurrent(null)}
						>
							<Icon icon={tablerOutlineX} />
						</button>
						<h3 id={titleId}>{opts.title}</h3>
					</header>
				) : undefined}
				<main class="pp-body">
					{opts.stamp ? (
						<aside class="pp-stamp" aria-hidden="true">
							{typeof opts.stamp === 'string' ? <Icon icon={opts.stamp} size="48px" /> : opts.stamp}
						</aside>
					) : undefined}
					<div class="pp-content">
						{typeof opts.message === 'string' ? <p>{opts.message}</p> : opts.message}
					</div>
				</main>
				<footer>
					<div role="group" class="pp-actions">
						{renderButtons(opts)}
					</div>
				</footer>
			</article>
		)
	}

	return (
		<div if={state.open} style="display: contents;">
			<dialog
				id="pp-dialog-el"
				onClick={(ev) => {
					if (!state.pending?.options.closeOnBackdrop) return
					if (ev.target instanceof HTMLDialogElement) closeCurrent(null)
				}}
				onKeydown={(ev) => {
					if (ev.key === 'Escape') {
						ev.stopPropagation()
						if (state.pending?.options.closeOnEscape !== false) {
							ev.preventDefault()
							closeCurrent(null)
						}
					} else if (ev.key === 'Enter') {
						ev.stopPropagation()
						const opts = state.pending?.options
						if (!opts) return
						let chosenKey: PropertyKey | undefined
						if (opts.default) {
							const defaultBtn = state.pending?.defaultButton as HTMLButtonElement | undefined
							if (!defaultBtn || defaultBtn.disabled !== true) {
								chosenKey = opts.default
							}
						}
						if (chosenKey === undefined) {
							const first = firstEnabledButtonKey(opts)
							if (first !== undefined) chosenKey = first
						}
						if (chosenKey === undefined) return
						ev.preventDefault()
						closeCurrent(chosenKey)
					}
				}}
				aria-modal="true"
				tabIndex={-1}
				use={(el: HTMLDialogElement) => {
					const show = () => {
						if (!el.open && state.open && state.pending) {
							// Use setTimeout to ensure DOM children from {content} are rendered
							setTimeout(() => {
								if (!el.open && state.open && state.pending) {
									try {
										el.showModal()
										const ordered = getOrderedTabstops(el)
										const initial = ordered[0] ?? el
										initial.focus({ preventScroll: true })
									} catch (e) {
										console.error('Failed to show modal:', e)
									}
								}
							}, 0)
						}
					}
					// And also respond to reactive changes if target is reused
					return effect(() => {
						show()
						const pending = state.pending
						const opts = pending?.options
						const sizeClass =
							opts?.size === 'sm' ? 'pp-size-sm' : opts?.size === 'lg' ? 'pp-size-lg' : 'pp-size-md'
						el.className = ['pp-dialog', sizeClass, opts?.class].filter(Boolean).join(' ')

						if (opts?.title) {
							el.setAttribute('aria-labelledby', titleId)
							el.removeAttribute('aria-label')
						} else {
							el.removeAttribute('aria-labelledby')
							if (opts?.ariaLabel) el.setAttribute('aria-label', opts.ariaLabel)
						}
					})
				}}
			>
				{content}
			</dialog>
		</div>
	)
}

function ensureHostMounted() {
	if (document.getElementById('pp-dialog-host')) return
	const host = document.createElement('div')
	host.id = 'pp-dialog-host'
	document.body.appendChild(host)
	bindApp(<Host />, host)
}

function isUIContent(value: unknown): value is UIContent {
	return typeof value === 'string' || isElement(value)
}
// reserved for future variants

export function dialog<
	Buttons extends Record<string, UIContent | DialogButton> = { ok: DialogButton },
>(options: DialogOptions<Buttons> | UIContent): Promise<keyof Buttons | null> {
	return new Promise<PropertyKey | null>((resolve) => {
		const normalized: DialogOptions<Buttons> = isUIContent(options)
			? { message: options }
			: (options as DialogOptions<Buttons>)

		state.pending = {
			options: compose(
				{
					closeOnBackdrop: true,
					closeOnEscape: true,
				},
				normalized
			) as DialogOptions<any>,
			defaultButton: undefined,
			resolve,
		}
		// mark as open immediately for state tracking
		state.open = true
		attachGlobalTrap()
		// remember the element that had focus before opening
		lastActiveElement =
			(document.activeElement as HTMLElement | null) ?? (document.body as HTMLElement)
		document.documentElement.classList.add('modal-is-open')
		document.documentElement.classList.add('modal-is-opening')

		setTimeout(() => {
			document.documentElement.classList.remove('modal-is-opening')
		}, 150)
	}) as Promise<keyof Buttons | null>
}

//

function renderButtons<Buttons extends Record<string, UIContent | DialogButton>>(
	opts?: DialogOptions<Buttons>
) {
	const entries = opts?.buttons
		? Object.entries(opts.buttons)
		: ([['ok', okButton]] satisfies [string, DialogButton][])
	return entries.map(([key, spec]) => {
		if (typeof spec === 'string') spec = { text: spec } satisfies DialogButton
		let button: JSX.Element
		if (isElement(spec)) {
			button = spec
		} else {
			const icon = spec.icon ? (
				<span class="pp-button-icon" aria-hidden={typeof spec.icon === 'string' ? true : undefined}>
					{typeof spec.icon === 'string' ? <Icon icon={spec.icon} /> : spec.icon}
				</span>
			) : undefined
			button = (
				<button
					type="button"
					class={variantClass(spec.variant ?? 'primary')}
					disabled={spec.disabled}
				>
					{icon}
					<span class="pp-button-label">{spec.text}</span>
				</button>
			)
		}
		const originalRender = button.render
		button = Object.create(button, {
			render: {
				value: () => {
					const rendered = originalRender()
					const nodes = Array.isArray(rendered) ? rendered : [rendered]
					for (const child of nodes) {
						if (child instanceof HTMLButtonElement) {
							child.addEventListener('click', () => closeCurrent(key))
							if (key === opts?.default && state.pending) state.pending.defaultButton = child
						}
					}
					return nodes
				},
			},
		}) satisfies JSX.Element
		return button as JSX.Element
	})
}

// Determine the first enabled button key for Enter fallback
function firstEnabledButtonKey<Buttons extends Record<string, UIContent | DialogButton>>(
	opts: DialogOptions<Buttons>
): PropertyKey | undefined {
	const entries = opts.buttons
		? Object.entries(opts.buttons)
		: ([['ok', okButton]] satisfies [string, DialogButton][])
	for (const [key, spec] of entries) {
		if (typeof spec === 'string') return key
		if (isElement(spec)) return key
		if (!spec.disabled) return key
	}
	return undefined
}

export async function confirm(params: {
	title?: UIContent
	message?: UIContent
	okText?: string
	cancelText?: string
	okVariant?: Variant
}): Promise<boolean> {
	const res = await dialog({
		title: params.title,
		message: params.message,
		buttons: {
			cancel: params.cancelText ?? 'Cancel',
			ok: { text: params.okText ?? 'Ok', variant: params.okVariant ?? 'primary' },
		},
		default: 'ok',
	})
	return res === 'ok'
}

// Width helpers are defined in dialog.scss

// Auto-mount on browser load
if (typeof document !== 'undefined') {
	ensureHostMounted()
}
