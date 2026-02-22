export type CardProps = {
	variant?: string
	el?: JSX.IntrinsicElements['article']
	children?: JSX.Children
}

export type CardSectionProps = {
	el?: JSX.IntrinsicElements['div']
	children?: JSX.Children
}

function CardHeader(props: CardSectionProps) {
	return <header {...props.el}>{props.children}</header>
}

function CardBody(props: CardSectionProps) {
	return <div {...props.el}>{props.children}</div>
}

function CardFooter(props: CardSectionProps) {
	return <footer {...props.el}>{props.children}</footer>
}

export const Card: ((props: CardProps) => JSX.Element) & {
	Header: (props: CardSectionProps) => JSX.Element
	Body: (props: CardSectionProps) => JSX.Element
	Footer: (props: CardSectionProps) => JSX.Element
} = Object.assign(
	(props: CardProps) => (
		<article class={props.variant ? `card card-${props.variant}` : 'card'} {...props.el}>
			{props.children}
		</article>
	),
	{
		Header: CardHeader,
		Body: CardBody,
		Footer: CardFooter,
	}
)
