import { latch } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { Accordion } from '@pounce/ui'
import { reactive } from 'mutts'
import { Code } from './code'

componentStyle.sass`
.demo-component
	margin: 2rem 0
	
	> h4
		margin: 0 0 1rem 0
		font-size: 1.1rem
		font-weight: 600
		color: var(--pounce-fg, #333)
		
		[data-theme="dark"] &
			color: var(--pounce-fg, #e0e0e0)
	
.demo-live
	border: 1px solid var(--pounce-border, rgba(0, 0, 0, 0.1))
	padding: 1.5rem
	border-radius: 0.5rem
	background: var(--pounce-bg, #fff)
	margin-bottom: 1rem
	
	[data-theme="dark"] &
		border-color: var(--pounce-border, rgba(255, 255, 255, 0.1))
		background: var(--pounce-bg, #0a0a0a)
	
	// Add some demo-specific styling
	> *
		max-width: 100%
	
	// Style buttons in demos
	button.pounce-button
		margin-right: 0.5rem
		margin-bottom: 0.5rem
	
	// Style inputs in demos
	input, textarea
		margin-right: 0.5rem
		margin-bottom: 0.5rem
`

export type DemoProps = {
	component: JSX.Element
	source: string
	title?: string
}

export function Demo({ component, source, title = 'Example' }: DemoProps) {
	const showCode = reactive({ open: false })
	let unmount: (() => void) | undefined

	// Mount the live demo, return cleanup for teardown
	const mountDemo = (el: HTMLElement) => {
		if (el) {
			unmount = latch(el, component)
		}
		return () => {
			unmount?.()
		}
	}

	return (
		<div class="demo-component">
			<h4>{title}</h4>

			{/* Live demo */}
			<div use={mountDemo} class="demo-live" />

			{/* Accordion for source code */}
			<Accordion
				open={showCode.open}
				onToggle={(open) => (showCode.open = open)}
				summary="View Source Code"
			>
				<Code code={source} lang="tsx" />
			</Accordion>
		</div>
	)
}
