import { reactive } from 'mutts'
import { array, bindApp, compose, isElement } from '@pounce/core'
import {
	tablerOutlineAlertCircle,
	tablerOutlineAlertOctagon,
	tablerOutlineCircleCheck,
	tablerOutlineInfoCircle,
	tablerOutlineX,
} from 'pure-glyf/icons'
import { css } from '../lib/css'
import { Icon } from './icon'
import type { Variant } from './variants'

css`
.pp-toasts {
	position: fixed;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	z-index: 1000;
}

.pp-toasts.top-right {
	top: 1rem;
	right: 1rem;
}

.pp-toasts.top-left {
	top: 1rem;
	left: 1rem;
}

.pp-toasts.bottom-right {
	bottom: 1rem;
	right: 1rem;
}

.pp-toasts.bottom-left {
	bottom: 1rem;
	left: 1rem;
}

.pp-toast {
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 0.5rem 0.75rem;
	min-width: 16rem;
	max-width: 28rem;
	padding: 0.6rem 0.75rem;
	border-radius: 0.5rem;
	background: var(--pico-card-background-color);
	border: 1px solid var(--pico-muted-border-color);
	box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
	transition: transform 0.16s ease, opacity 0.16s ease;
	transform: translateY(0);
	opacity: 1;
}

.pp-toast-closing {
	transform: translateY(6px);
	opacity: 0;
}

.pp-toast .pp-icon-btn {
	min-width: 0;
}

.pp-toast-icon {
	display: flex;
	align-items: center;
	justify-content: center;
}

.pp-toast-content {
	min-width: 0;
}

.pp-toast-content p {
	margin: 0;
}

.pp-toast .pp-toast-content,
.pp-toast .pp-toast-content p,
.pp-toast .pp-toast-content a,
.pp-toast .pp-toast-content span {
	color: inherit;
}

.pp-toast.success {
	background-color: var(--pp-success-background);
	border-color: var(--pp-success-border);
	color: var(--pp-success-inverse);
}

.pp-toast.warning {
	background-color: var(--pp-warning-background);
	border-color: var(--pp-warning-border);
	color: var(--pp-warning-inverse);
}

.pp-toast.danger {
	background-color: var(--pp-danger-background);
	border-color: var(--pp-danger-border);
	color: var(--pp-danger-inverse);
}

.pp-toast.primary {
	background-color: var(--pico-primary-background);
	border-color: var(--pico-primary-border);
	color: var(--pico-primary-inverse);
}

.pp-toast.primary .pp-toast-icon {
	color: var(--pico-primary-inverse);
}

.pp-toast.primary .pp-icon-btn,
.pp-toast.success .pp-icon-btn,
.pp-toast.warning .pp-icon-btn,
.pp-toast.danger .pp-icon-btn {
	filter: brightness(0.95);
}
`

export type ToastContent = string | JSX.Element

export interface ToastOptions {
	content: ToastContent
	variant?: Variant
	durationMs?: number
	dismissible?: boolean
	ariaRole?: 'status' | 'alert'
	class?: string
}

type ToastItem = {
	options: Required<Omit<ToastOptions, 'class' | 'ariaRole'>> & {
		class?: string
		ariaRole?: 'status' | 'alert'
	}
	closing: boolean
	close(): void
}

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
export type ToastConfig = {
	defaultDurationMs: number
	position: ToastPosition
	template: (item: ToastItem) => JSX.Element
	variantIcon: Record<Variant, string>
}
export const toastConfig: ToastConfig = {
	defaultDurationMs: 3500,
	position: 'bottom-right',
	template: (item: ToastItem) => (
		<>
			<aside class="pp-toast-icon" aria-hidden="true">
				<Icon icon={toastConfig.variantIcon[item.options.variant]} size="20px" />
			</aside>
			<div class="pp-toast-content">
				{typeof item.options.content === 'string' ? (
					<p>{item.options.content}</p>
				) : (
					item.options.content
				)}
			</div>
			<button
				if={item.options.dismissible}
				class="pp-icon-btn secondary"
				aria-label="Dismiss"
				onClick={() => closeToast(item)}
			>
				<Icon icon={tablerOutlineX} />
			</button>
		</>
	),
	variantIcon: {
		primary: tablerOutlineInfoCircle,
		secondary: tablerOutlineInfoCircle,
		contrast: tablerOutlineInfoCircle,
		success: tablerOutlineCircleCheck,
		warning: tablerOutlineAlertCircle,
		danger: tablerOutlineAlertOctagon,
	},
}

const state = reactive({
	items: [] as ToastItem[],
})

let hostMounted = false

function ensureHostMounted() {
	if (hostMounted) return
	hostMounted = true
	const host = document.createElement('div')
	document.body.appendChild(host)
	bindApp(<Host />, host)
}

function closeToast(item: ToastItem) {
	if (item.closing) return
	item.closing = true
	// allow CSS closing animation
	setTimeout(() => array.remove(state.items, item), 160)
}

// Cleanup function to clear all toasts and reset state
function cleanupToasts() {
	state.items.forEach((item) => {
		if (!item.closing) {
			closeToast(item)
		}
	})
	state.items = []
	hostMounted = false
}

const Host = () => (
	<div class={[`pp-toasts`, toastConfig.position]} aria-live="polite" aria-atomic="false">
		<for each={state.items || []}>{(t) => <ToastItemView item={t} />}</for>
	</div>
)

const ToastItemView = ({ item }: { item: ToastItem }) => {
	let remaining = item.options.durationMs
	let timer: number | undefined
	let lastStart = 0

	const startTimer = () => {
		if (remaining <= 0 || item.options.durationMs <= 0) return
		lastStart = performance.now()
		timer = window.setTimeout(() => closeToast(item), remaining)
	}
	const pauseTimer = () => {
		if (timer !== undefined) {
			window.clearTimeout(timer)
			timer = undefined
			remaining -= performance.now() - lastStart
		}
	}

	queueMicrotask(() => startTimer())

	const role = () =>
		item.options.ariaRole ?? (item.options.variant === 'danger' ? 'alert' : 'status')

	return (
		<div
			role={role()}
			class={[
				'pp-toast',
				item.options.class,
				item.closing ? 'pp-toast-closing' : undefined,
				item.options.variant,
			]}
			onMouseenter={() => {
				pauseTimer()
			}}
			onMouseleave={() => {
				startTimer()
			}}
		>
			{toastConfig.template(item)}
		</div>
	)
}

export const toast = Object.assign(
	(contentOrOptions: ToastContent | ToastOptions): ToastItem => {
		ensureHostMounted()
		const options: ToastOptions =
			isElement(contentOrOptions) || typeof contentOrOptions === 'string'
				? { content: contentOrOptions }
				: contentOrOptions
		const item: ToastItem = {
			options: compose(
				{
					variant: 'secondary',
					durationMs: toastConfig.defaultDurationMs,
					dismissible: true,
				},
				options
			),
			closing: false,
			close: () => closeToast(item),
		}
		state.items.push(item)
		return item
	},
	{
		success: (content: ToastContent, opts?: Omit<ToastOptions, 'content' | 'variant'>) =>
			toast({ content, variant: 'success', ...opts }),
		warning: (content: ToastContent, opts?: Omit<ToastOptions, 'content' | 'variant'>) =>
			toast({ content, variant: 'warning', ...opts }),
		danger: (content: ToastContent, opts?: Omit<ToastOptions, 'content' | 'variant'>) =>
			toast({ content, variant: 'danger', ...opts }),
		info: (content: ToastContent, opts?: Omit<ToastOptions, 'content' | 'variant'>) =>
			toast({ content, variant: 'primary', ...opts }),
		cleanup: cleanupToasts,
	}
)
