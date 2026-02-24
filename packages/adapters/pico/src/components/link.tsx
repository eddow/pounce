import { type LinkProps, linkModel } from '@pounce/kit/models'

export type { LinkProps }

export function A(props: LinkProps) {
	const model = linkModel(props)
	// TODO: 1- shouldn't untrack, whut ??!? 2- therefore not updated
	return (
		//untracked(() => (
		<a {...model} {...props}>
			{props.children}
		</a>
	) //)
}
