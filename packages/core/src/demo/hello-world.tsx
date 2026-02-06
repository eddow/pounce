//import { h, type Scope } from '@pounce/core'

import type { Scope } from '@pounce/core'

export interface HelloWorldProps {
	name?: string
	greeting?: string
}

export function HelloWorld(props: HelloWorldProps, _scope: Scope) {
	return (
		<div class="hello-world">
			<h1 class="greeting">
				{props.greeting ?? 'Hello'}, {props.name ?? 'World'}!
			</h1>
			<p class="message">Welcome to Pounce components</p>
		</div>
	)
}
