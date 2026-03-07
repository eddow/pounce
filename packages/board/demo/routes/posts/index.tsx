interface Post { id: string; title: string; content: string }
interface Props { siteName: string; posts: Post[] }

export default function PostsPage(props: Props) {
	return (
		<div>
			<h1>Posts</h1>
			<ul>
				<for each={props.posts}>
					{(post) => <li><a href={`/posts/${post.id}`}>{post.title}</a></li>}
				</for>
			</ul>
		</div>
	)
}
