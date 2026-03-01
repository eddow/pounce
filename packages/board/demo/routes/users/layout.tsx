import type { Child } from '@pounce/core'

interface Props { siteName: string; children: Child }

export default function UsersLayout({ children }: Props) {
	return (
		<div class="users-shell">
			<h2>Users Section</h2>
			{children}
		</div>
	)
}
