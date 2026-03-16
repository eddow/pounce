import type { Child } from '@sursaut/core'

interface Props {
	siteName: string
	children: Child
}

export default function UsersLayout(props: Props) {
	return (
		<div class="users-shell">
			<h2>Users Section</h2>
			{props.children}
		</div>
	)
}
