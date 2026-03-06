export interface UserRecord {
	id: string
	name: string
	role: string
}

export const users: UserRecord[] = [
	{ id: '1', name: 'Alice', role: 'admin' },
	{ id: '2', name: 'Bob', role: 'user' },
]

export function findUser(id: string): UserRecord | undefined {
	return users.find((user) => user.id === id)
}
