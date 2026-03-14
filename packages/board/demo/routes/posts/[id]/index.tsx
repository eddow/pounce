import type { InferVerb } from '@sursaut/board'
import type PostRoute from './index'

type Post = InferVerb<typeof PostRoute, 'get'>

interface Props { post: Post | null; siteName: string }

export default function PostDetail(props: Props) {
	if (!props.post) return <p>Post not found.</p>
	return (
		<article>
			<h1>{props.post.title}</h1>
			<p>{props.post.content}</p>
			<a href="/posts">&larr; Back</a>
		</article>
	)
}
