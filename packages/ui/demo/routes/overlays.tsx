import type { Scope } from '@pounce/core'
import {
	Button,
	Heading, Text,
	Stack, Inline,
} from '../../src'

export default function OverlaysRoute(_props: {}, scope: Scope) {
	const dialog = scope.dialog as (opts: string | object) => Promise<string>
	const toast = scope.toast as ((msg: string) => void) & Record<string, (msg: string) => void>
	const drawer = scope.drawer as (opts: object) => Promise<void>

	return (
		<Stack gap="lg">
			<header>
				<Heading level={1}>Overlays</Heading>
				<Text muted>Dialogs, toasts, and drawers via StandardOverlays scope.</Text>
			</header>

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
