
import { api } from '@pounce/board'
import { reactive } from 'mutts'
import { commentsApi } from '../../../lib/external-api.js'

type Post = {
	id: string
	title: string
	content: string
}

type Comment = {
	id: number
	postId: number
	name: string
	body: string
}

export default function PostDetail({ params }: { params: { id: string } }) {
	// Fetch post details (relative API call)
	const postReq = api<Post>(".").get()

	// Fetch comments (external proxy)
	const commentsReq = commentsApi.getComments({ postId: params.id })

	const state = reactive({
		post: postReq.hydrated,
		comments: commentsReq.hydrated || [] as Comment[]
	})

	// Hydration logic
	if (!state.post) {
		postReq.then(data => state.post = data)
	}

	if (!commentsReq.hydrated) {
		commentsReq.then(data => state.comments = data)
	}

	return (
		<div class="post-detail">
			<nav>
				<a href="/">&larr; Back to posts</a>
			</nav>

			<if condition={state.post}>
				<article>
					<h1>{state.post.title}</h1>
					<div class="content">{state.post.content}</div>
				</article>
			</if>

			<if condition={!state.post}>
				<div class="loading">Loading post...</div>
			</if>

			<div class="comments-section">
				<h3>Comments</h3>
				<if condition={state.comments.length > 0}>
					<ul>
						<for each={state.comments}>
							{(comment) => (
								<li>
									<strong>{comment.name}</strong>: {comment.body}
								</li>
							)}
						</for>
					</ul>
				</if>
				<if condition={state.comments.length === 0}>
					<p>No comments yet.</p>
				</if>
			</div>
		</div>
	)
}
