
import { api } from '@pounce/board'
import { reactive } from 'mutts'

type Post = {
	id: string
	title: string
	content: string
}

export default function BlogHome() {
	// SSR-aware data fetching
	// api("/posts").get() returns a HydratedPromise<T>
	// .hydrated is T | undefined (synchronously available during hydration)
	const postsReq = api<Post[]>("/posts").get()

	// Initialize state with hydrated data if available
	const state = reactive({
		posts: postsReq.hydrated || []
	})

	// If data wasn't hydrated (client-side nav or missed hydration), wait for promise
	if (!postsReq.hydrated) {
		postsReq.then(data => {
			state.posts = data
		})
	}

	return (
		<div class="blog-home">
			<h1>Latest Posts</h1>
			<div class="posts-list">
				<for each={state.posts}>
					{(post) => (
						<article class="post-card">
							<h2>
								<a href={`/posts/${post.id}`}>{post.title}</a>
							</h2>
							<p>{post.content.slice(0, 100)}...</p>
						</article>
					)}
				</for>
			</div>
			<if condition={state.posts.length === 0}>
				<p>Loading posts...</p>
			</if>
		</div>
	)
}
