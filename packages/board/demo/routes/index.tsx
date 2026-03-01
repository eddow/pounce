interface Props { siteName: string; buildTime: string }

export default function IndexPage({ siteName, buildTime }: Props) {
	return (
		<div>
			<h1>Index Page</h1>
			<p>Welcome to {siteName}</p>
			<p>Built at {buildTime}</p>
		</div>
	)
}
