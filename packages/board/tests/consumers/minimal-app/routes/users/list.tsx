import { A } from '@pounce/board'

export default function UserListPage() {
	return (
		<div>
			<h1>User List</h1>
			<ul>
				<li><A href="/users/1" id="list-link-user-1">User 1</A></li>
				<li><A href="/users/2" id="list-link-user-2">User 2</A></li>
				<li><A href="/users/3" id="list-link-user-3">User 3</A></li>
			</ul>
			<nav>
				<A href="/" id="link-home">Back to Home</A>
			</nav>
		</div>
	)
}
