import type { Env } from '@pounce/core'

export interface HelloWorldProps {
	name?: string
	greeting?: string
}

export function HelloWorld(props: HelloWorldProps, _env: Env) {
	return (
		<div class="hello-world">
			<h1 class="greeting">
				{props.greeting ?? 'Hello'}, {props.name ?? 'World'}!
			</h1>
			<p class="message">Welcome to Pounce components</p>
		</div>
	)
}
