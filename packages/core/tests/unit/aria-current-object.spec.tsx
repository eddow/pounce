import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { latch, document, r, ReactiveProp } from '@pounce/core'

describe('aria-current [object Object] bug', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
	})

	it('minimal via babel plugin (normal JSX)', () => {
		function MyLink(props: JSX.IntrinsicElements['a']) {
			return (
				<a
					{...props}
					aria-current={
						props['aria-current'] ?? (props.href === '/active' ? 'page' : undefined)
					}
					data-testval="value"
				>
					{props.children}
				</a>
			)
		}
		const active = (<MyLink href="/active" data-testid="active">Active</MyLink>).render() as HTMLElement
		expect(active.dataset.testval).toBe('value')
		expect(active.dataset.testid).toBe('active')
		expect(active.getAttribute('aria-current')).toBe('page')
	})

	it('via babel plugin (normal JSX)', () => {
		function MyLink(props: JSX.IntrinsicElements['a']) {
			return (
				<a
					{...props}
					aria-current={
						props['aria-current'] ?? (props.href === '/active' ? 'page' : undefined)
					}
				>
					{props.children}
				</a>
			)
		}

		unmount = latch(
			container,
			<div>
				<MyLink href="/active" data-testid="active">Active</MyLink>
				<MyLink href="/other" data-testid="other">Other</MyLink>
			</div>
		)

		const active = container.querySelector('[data-testid="active"]')!
		const other = container.querySelector('[data-testid="other"]')!
		expect(active.getAttribute('aria-current')).toBe('page')
		expect(other.getAttribute('aria-current')).toBeNull()
	})

	it('mimics compiled kit dist (manual r() + spread + jsx())', () => {
		// This replicates what kit/dist/dom.js produces for the A component:
		//   return jsx("a", {
		//     ...props,
		//     "aria-current": r(() => props['aria-current'] ?? (pathname === props.href ? 'page' : undefined)),
		//     children: r(() => props.children)
		//   });
		const pathname = '/active'

		function ACompiledStyle(props: Record<string, any>) {
			return h("a", {
				...props,
				"aria-current": r(() => props['aria-current'] ?? (pathname === props.href ? 'page' : undefined)),
			}, r(() => props.children))
		}

		// Caller: <ACompiledStyle href="/active" data-testid="compiled-active">Link</ACompiledStyle>
		// The caller's babel wraps: href={r(() => "/active")}, children={r(() => "Link")}
		unmount = latch(
			container,
			<div>
				<ACompiledStyle href="/active" data-testid="compiled-active">Active</ACompiledStyle>
				<ACompiledStyle href="/other" data-testid="compiled-other">Other</ACompiledStyle>
			</div>
		)

		const active = container.querySelector('[data-testid="compiled-active"]') as HTMLElement
		const other = container.querySelector('[data-testid="compiled-other"]') as HTMLElement

		console.log('compiled active aria-current:', JSON.stringify(active?.getAttribute('aria-current')))
		console.log('compiled other aria-current:', JSON.stringify(other?.getAttribute('aria-current')))
		console.log('compiled active outerHTML:', active?.outerHTML)
		console.log('compiled other outerHTML:', other?.outerHTML)

		expect(active).not.toBeNull()
		expect(other).not.toBeNull()
		expect(active.getAttribute('aria-current')).toBe('page')
		expect(other.getAttribute('aria-current')).toBeNull()
	})

	it('props[aria-current] returns ReactiveProp through reactive proxy (root cause check)', () => {
		// Inside the A component, props is reactive(propsInto(callerProps)).
		// Reading props['aria-current'] when it wasn't passed should return undefined.
		// If it returns a ReactiveProp, the ?? operator won't fall through.
		function CheckComponent(props: Record<string, any>) {
			const ariaCurrent = props['aria-current']
			console.log('props[aria-current] type:', typeof ariaCurrent, ariaCurrent)
			console.log('props[aria-current] instanceof ReactiveProp:', ariaCurrent instanceof ReactiveProp)

			const resolved = props['aria-current'] ?? 'fallback'
			console.log('resolved via ??:', resolved, typeof resolved)

			return h("span", {
				'data-testid': 'check-result',
				'data-resolved': r(() => {
					const val = props['aria-current'] ?? 'fallback'
					return String(val)
				}),
			})
		}

		unmount = latch(
			container,
			<div>
				<CheckComponent href="/active" data-testid="check" />
			</div>
		)

		const el = container.querySelector('[data-testid="check-result"]') as HTMLElement
		console.log('data-resolved:', el?.getAttribute('data-resolved'))
		expect(el.getAttribute('data-resolved')).toBe('fallback')
	})
})
