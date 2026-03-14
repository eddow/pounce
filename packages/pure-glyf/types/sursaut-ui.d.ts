declare module '@sursaut/ui' {
	import type { JSX } from '@sursaut/core'

	export type IconFactory = (
		name: string,
		size: string | number | undefined,
		el: JSX.GlobalHTMLAttributes,
		context: unknown,
	) => JSX.Element

	export const options: {
		iconFactory: IconFactory | undefined
	}
}
