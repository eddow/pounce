import type { Child } from '@pounce/core'
import { A } from '@pounce/board'

export default function RootLayout({ children }: { children: Child }) {
	return (
		<div class="root-layout">
			<nav id="global-nav">
				<A href="/">Home</A> | <A href="/users/1">User 1</A> | <A href="/users/list">User List</A>
			</nav>
			<main>{children}</main>
		</div>
	)
}
