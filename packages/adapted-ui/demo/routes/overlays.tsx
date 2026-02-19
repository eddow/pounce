import type { Env } from '@pounce/core'
import { reactive } from 'mutts'
import {
	Button,
	Heading, Text,
	Stack, Inline,
} from '../../src'
import { env } from 'process'

function EventDebug() {
	const state = reactive({ clicks: 0, lastResult: '' as string })
	return (
		<Stack gap="md" style="padding: 1rem; border: 2px solid crimson; border-radius: 0.5rem; background: rgba(220,20,60,0.05);">
			<Heading level={3}>Event Debug</Heading>
			<Text muted>If clicks don't register or dialogs don't dismiss, the bug is active.</Text>
			<Inline wrap gap="sm">
				<Button onClick={() => { state.clicks++ }}>
					Click me ({state.clicks})
				</Button>
				<Button variant="secondary" onClick={() => { state.clicks = 0 }}>
					Reset
				</Button>
			</Inline>
			<Text if={state.lastResult}>Last dialog result: {state.lastResult}</Text>
		</Stack>
	)
}

function DialogDebug(_props: {}, env: Env) {
	const dialog = env.dialog as (opts: string | object) => Promise<string>
	const state = reactive({ result: '' as string })
	return (
		<Stack gap="md" style="padding: 1rem; border: 2px solid orange; border-radius: 0.5rem; background: rgba(255,165,0,0.05);">
			<Heading level={3}>Dialog Dismiss Debug</Heading>
			<Text muted>Click backdrop to dismiss (should return null). Click a button to get its key.</Text>
			<Inline wrap gap="sm">
				<Button onClick={async () => {
					const r = await dialog({
						title: 'Dismissible',
						message: 'Click the dark backdrop behind this dialog to dismiss it.',
						dismissible: true,
						buttons: { ok: 'OK' },
					})
					state.result = String(r)
				}}>
					Dismissible Dialog
				</Button>
				<Button variant="danger" onClick={async () => {
					const r = await dialog({
						title: 'NOT Dismissible',
						message: 'Backdrop click should NOT close this. Use the button.',
						dismissible: false,
						buttons: { close: 'Close' },
					})
					state.result = String(r)
				}}>
					Non-dismissible
				</Button>
			</Inline>
			<Text if={state.result}>Result: "{state.result}"</Text>
		</Stack>
	)
}

export default function OverlaysRoute(_props: {}, env: Env) {
	const dialog = env.dialog as (opts: string | object) => Promise<string>
	const toast = env.toast as ((msg: string) => void) & Record<string, (msg: string) => void>
	const drawer = env.drawer as (opts: object) => Promise<void>

	return (
		<Stack gap="lg">
			<header>
				<Heading level={1}>Overlays</Heading>
				<Text muted>Dialogs, toasts, and drawers via StandardOverlays env.</Text>
			</header>

			<EventDebug />
			<DialogDebug />

			<section>
				<Heading level={3}>Dialog</Heading>
				<Inline wrap gap="sm">
					<Button onClick={async () => {
						const result = await dialog('This is a simple dialog with a default OK button.')
						console.log('Dialog result:', result)
					}}>
						Simple Dialog
					</Button>
					<Button variant="secondary" onClick={async () => {
						const result = await dialog({
							title: 'Confirm Action',
							message: 'Are you sure you want to proceed? This cannot be undone.',
							buttons: {
								cancel: 'Cancel',
								proceed: { text: 'Yes, proceed', variant: 'danger' },
							},
						})
						console.log('Confirm result:', result)
					}}>
						Confirm Dialog
					</Button>
					<Button variant="contrast" onClick={async () => {
						const result = await dialog({
							title: 'Choose wisely',
							message: 'Pick one of the options below.',
							buttons: {
								save: { text: 'Save', variant: 'success' },
								discard: { text: 'Discard', variant: 'danger' },
								cancel: 'Cancel',
							},
						})
						console.log('Choice:', result)
					}}>
						Multi-button
					</Button>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Toast</Heading>
				<Inline wrap gap="sm">
					<Button onClick={() => toast('Heads up: maintenance at 2am')}>
						Default Toast
					</Button>
					<Button variant="success" onClick={() => toast.success('Profile updated successfully')}>
						Success
					</Button>
					<Button variant="warning" onClick={() => toast.warn('Network connection is slow')}>
						Warning
					</Button>
					<Button variant="danger" onClick={() => toast.error('Failed to save changes')}>
						Danger
					</Button>
				</Inline>
			</section>

			<section>
				<Heading level={3}>Drawer</Heading>
				<Inline wrap gap="sm">
					<Button onClick={() => drawer({
						title: 'Settings',
						children: (
							<Stack gap="md" style="padding: 1rem;">
								<Text>Drawer content goes here.</Text>
								<Text muted size="sm">This is a left-side drawer by default.</Text>
							</Stack>
						),
					})}>
						Left Drawer
					</Button>
					<Button variant="secondary" onClick={() => drawer({
						title: 'Details',
						side: 'right',
						children: (
							<Stack gap="md" style="padding: 1rem;">
								<Text>Right-side drawer content.</Text>
								<Text muted size="sm">Slides in from the right edge.</Text>
							</Stack>
						),
					})}>
						Right Drawer
					</Button>
				</Inline>
			</section>
		</Stack>
	)
}
