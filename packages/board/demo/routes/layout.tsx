import type { Child } from '@pounce/core'

interface Props { siteName: string; children: Child }

export default function RootLayout({ siteName, children }: Props) {
	return (
		<div class="app-shell">
			<nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
				<strong>{siteName}</strong>
				<a href="/">Home</a>
				<a href="/posts">Posts</a>
				<a href="/users">Users</a>
			</nav>
			<main style={{ padding: '1rem' }}>{children}</main>
		</div>
	)
}
