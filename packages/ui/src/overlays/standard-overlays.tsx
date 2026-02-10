import { WithOverlays } from './with-overlays'
import { bindDialog } from './dialog'
import { bindToast } from './toast'
import { bindDrawer } from './drawer'

export interface StandardOverlaysProps {
	children?: JSX.Children
}

/**
 * The "1-config" wrapper for Pounce applications.
 * Provides the standard set of layers and interaction helpers (dialog, toast, drawer).
 */
export const StandardOverlays = (props: StandardOverlaysProps) => {
	return (
		<WithOverlays
			layers={['modal', 'drawer-left', 'drawer-right', 'toast']}
			extend={{
				dialog: (push) => bindDialog(push),
				toast: (push) => bindToast(push),
				drawer: (push) => bindDrawer(push),
			}}
		>
			{props.children}
		</WithOverlays>
	)
}
