import { A } from '@pounce'
import { navigation } from '../nav-index'

interface PageNavProps {
	onNavigate?: () => void
}

export default function PageNav({ onNavigate }: PageNavProps) {
	return (
		<ul>
			<li>
				<A href="/" onClick={onNavigate}>
					Home
				</A>
			</li>
			{navigation.map((section) => (
				<li>
					<strong>{section.title}</strong>
					<ul>
						{section.links.map((link) => (
							<li>
								<A href={link.href} onClick={onNavigate}>
									{link.title}
								</A>
							</li>
						))}
					</ul>
				</li>
			))}
		</ul>
	)
}
