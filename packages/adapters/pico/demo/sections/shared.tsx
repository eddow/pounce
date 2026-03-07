export function DemoSection(props: {
	title: string
	description: string
	children?: JSX.Children
}) {
	return (
		<section style="display: grid; gap: 1rem;">
			<header style="display: grid; gap: 0.35rem;">
				<h2 style="margin: 0;">{props.title}</h2>
				<p style="margin: 0; color: var(--pico-muted-color);">{props.description}</p>
			</header>
			{props.children}
		</section>
	)
}

export function DemoGrid(props: { children?: JSX.Children }) {
	return (
		<div
			style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: start;"
		>
			{props.children}
		</div>
	)
}

export function DemoCard(props: {
	title: string
	children?: JSX.Children
	footer?: JSX.Children
}) {
	return (
		<article style="margin: 0; display: grid; gap: 0.75rem;">
			<header>
				<strong>{props.title}</strong>
			</header>
			<div style="display: grid; gap: 0.75rem;">{props.children}</div>
			{props.footer ? <footer>{props.footer}</footer> : null}
		</article>
	)
}

export function DemoState(props: { label: string; value: JSX.Children }) {
	return (
		<p style="margin: 0; color: var(--pico-muted-color); font-size: 0.95rem;">
			<strong>{props.label}:</strong> {props.value}
		</p>
	)
}
