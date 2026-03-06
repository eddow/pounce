export interface PostRecord {
	id: string
	title: string
	content: string
}

export const posts: PostRecord[] = [
	{ id: '1', title: 'First Post', content: 'Hello World' },
	{ id: '2', title: 'Pounce Board', content: 'Is awesome' },
]

let nextId = 3

export function findPost(id: string): PostRecord | undefined {
	return posts.find((post) => post.id === id)
}

export function createPost(input: Pick<PostRecord, 'title' | 'content'>): PostRecord {
	const post: PostRecord = {
		id: String(nextId++),
		title: input.title,
		content: input.content,
	}
	posts.push(post)
	return post
}

export function deletePost(id: string): boolean {
	const index = posts.findIndex((post) => post.id === id)
	if (index === -1) return false
	posts.splice(index, 1)
	return true
}
