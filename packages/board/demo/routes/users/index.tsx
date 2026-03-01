interface User { id: string; name: string; role: string }
interface Props { siteName: string; users: User[] }

export default function UsersPage({ users }: Props) {
	return (
		<div>
			<h1>Users</h1>
			<ul>
				{users.map((user) => (
					<li key={user.id}><a href={`/users/${user.id}`}>{user.name}</a> ({user.role})</li>
				))}
			</ul>
		</div>
	)
}
