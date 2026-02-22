import { type LinkProps, linkModel } from '@pounce/kit/models'

export type { LinkProps }

export function A(props: LinkProps) {
	const model = linkModel(props)
	return (
		<a
			{...props}
			onClick={model.onClick}
			aria-current={model.ariaCurrent}
			style={model.underline ? undefined : { textDecoration: 'none' }}
		>
			{props.children}
		</a>
	)
}
