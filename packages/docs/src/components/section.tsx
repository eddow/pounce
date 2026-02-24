import { componentStyle } from '@pounce'

componentStyle.sass`
.doc-section
	margin: 2rem 0

	> h2
		scroll-margin-top: 2rem

		a.anchor
			text-decoration: none
			opacity: 0.3
			margin-left: 0.5rem
			font-weight: 400

			&:hover
				opacity: 0.7
`

export interface SectionProps {
	title: string
	id?: string
	children: JSX.Children
}

export function Section(p: SectionProps) {
	const anchor = () =>
		p.id ??
		p.title
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^\w-]/g, '')

	return (
		<section class="doc-section" id={anchor()}>
			<h2>
				{p.title}
				<a class="anchor" href={`#${anchor()}`}>
					#
				</a>
			</h2>
			{p.children}
		</section>
	)
}
