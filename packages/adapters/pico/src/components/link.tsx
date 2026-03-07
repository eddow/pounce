import { type LinkProps, linkModel } from '@pounce/kit'

export type { LinkProps }

export function A(props: LinkProps) {
	const model = linkModel(props)
	return (
		<a {...props} {...model}>
			{props.children}
		</a>
	)
}
