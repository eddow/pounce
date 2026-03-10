declare module '@pounce/ui' {
	import type { JSX } from '@pounce/core'

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
