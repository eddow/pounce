interface Props { siteName: string; buildTime: string }

export default function IndexPage(props: Props) {
	return (
		<div>
			<h1>Index Page</h1>
			<p>Welcome to {props.siteName}</p>
			<p>Built at {props.buildTime}</p>
		</div>
	)
}
