import { tablerOutlineAlertTriangle } from 'pure-glyf/icons'
import { dialog } from '../components/dialog'
import { toast } from '../components/toast'

export default () => (
	<>
		<section>
			<h2>Dialog</h2>
			<div role="group">
				<button
					onClick={async () => {
						const res = await dialog('This is a simple dialog with default OK button.')
						console.log('Dialog result:', res)
					}}
				>
					Open dialog
				</button>
				<button
					class="contrast"
					onClick={async () => {
						const res = await dialog({
							title: 'Confirm action',
							message: 'Are you sure you want to proceed? This action cannot be undone.',
							default: 'proceed',
							stamp: tablerOutlineAlertTriangle,
							buttons: {
								cancel: 'Cancel',
								proceed: { text: 'Yes, proceed', variant: 'danger' },
								question: (
									<button type="button" class="warning">
										Question
									</button>
								),
							},
						})
						console.log('Confirm result:', res)
					}}
				>
					Confirm
				</button>
			</div>
		</section>
		<section>
			<h2>Toasts</h2>
			<div role="group">
				<button onClick={() => toast.info('Saved!')}>Toast</button>
				<button class="success" onClick={() => toast.success('Profile updated')}>
					Success
				</button>
				<button class="warning" onClick={() => toast.warning('Network is slow')}>
					Warning
				</button>
				<button class="danger" onClick={() => toast.danger('Failed to save')}>
					Danger
				</button>
				<button class="secondary" onClick={() => toast('Heads up: maintenance at 2am')}>
					Info
				</button>
			</div>
		</section>
	</>
)
