import { Button, Menu, MenuItem, StandardOverlays } from '@sursaut/adapter-pico'
import type { Env } from '@sursaut/core'
import { reactive } from 'mutts'
import { DemoSection, DemoState } from './shared'

const TOAST_VARIANTS = [
	{ label: 'Success', fn: (env: Env) => env.toast?.success?.('Operation completed successfully.') },
	{ label: 'Error', fn: (env: Env) => env.toast?.error?.('Something went wrong.') },
	{
		label: 'Info',
		fn: (env: Env) => env.toast?.({ message: 'Here is some information.', variant: 'info' }),
	},
	{
		label: 'Warning',
		fn: (env: Env) =>
			env.toast?.({ message: 'Please review before continuing.', variant: 'warning' }),
	},
] as const

function OverlayTriggers(props: { state: { lastResult: string } }, env: Env) {
	const openDialog = async () => {
		const result = await env.dialog?.confirm('Launch the pico adapter demo flow?')
		props.state.lastResult = String(result)
	}

	const openDrawer = async () => {
		await env.drawer?.({
			side: 'right',
			title: 'Drawer demo',
			children: <p style="margin: 0;">Adapters can exercise overlays without bespoke fixtures.</p>,
		})
		props.state.lastResult = 'drawer-closed'
	}

	return (
		<div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
			<Button variant="primary" onClick={openDialog}>
				Dialog
			</Button>
			<Menu summary="Toast">
				<div role="menu" style="display:flex;flex-direction:column;">
					<for each={TOAST_VARIANTS}>
						{(v) => <MenuItem onClick={() => v.fn(env)}>{v.label}</MenuItem>}
					</for>
				</div>
			</Menu>
			<Button outline onClick={openDrawer}>
				Drawer
			</Button>
		</div>
	)
}

export default function OverlaysSection() {
	const state = reactive({ lastResult: 'none' })

	return (
		<DemoSection
			title="Overlays"
			description="Dialog, drawer, toast and overlay-manager concerns grouped around the injected overlay helpers."
		>
			<StandardOverlays>
				<div style="display: grid; gap: 1rem;">
					<OverlayTriggers state={state} />
					<DemoState label="Last result" value={state.lastResult} />
				</div>
			</StandardOverlays>
		</DemoSection>
	)
}
