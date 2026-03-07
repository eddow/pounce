import type { InferVerb } from '@pounce/board'
import type UserRoute from './index'

type User = InferVerb<typeof UserRoute, 'get'>

interface Props { user: User | null }

export default function UserDetail(props: Props) {
	if (!props.user) return <p>User not found.</p>
	return (
		<div id="user-profile">
			<h1>{props.user.name}</h1>
			<p>Role: {props.user.role}</p>
			<a href="/users">&larr; Back</a>
		</div>
	)
}
