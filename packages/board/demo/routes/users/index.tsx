interface User {
	id: string
	name: string
	role: string
}
interface Props {
	siteName: string
	users: User[]
}

export default function UsersPage(props: Props) {
	return (
		<div>
			<h1>Users</h1>
			<ul>
				<for each={props.users}>
					{(user: User) => (
						<li>
							<a href={`/users/${user.id}`}>{user.name}</a> ({user.role})
						</li>
					)}
				</for>
			</ul>
		</div>
	)
}
