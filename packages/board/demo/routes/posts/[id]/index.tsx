import type { InferVerb } from '@pounce/board'
import type PostRoute from './index'

type Post = InferVerb<typeof PostRoute, 'get'>

interface Props { post: Post | null; siteName: string }

export default function PostDetail({ post }: Props) {
	if (!post) return <p>Post not found.</p>
	return (
		<article>
			<h1>{post.title}</h1>
			<p>{post.content}</p>
			<a href="/posts">&larr; Back</a>
		</article>
	)
}
