import type { InferVerb } from '@pounce/board'
import type UserRoute from './index'

type User = InferVerb<typeof UserRoute, 'get'>

interface Props { user: User | null }

export default function UserDetail({ user }: Props) {
	if (!user) return <p>User not found.</p>
	return (
		<div id="user-profile">
			<h1>{user.name}</h1>
			<p>Role: {user.role}</p>
			<a href="/users">&larr; Back</a>
		</div>
	)
}
