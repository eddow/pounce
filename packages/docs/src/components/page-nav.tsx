import { A } from '@pounce'
import { navigation } from '../nav-index'

export default function PageNav() {
	return (
		<ul>
			<li>
				<A href="/">Home</A>
			</li>
			{navigation.map((section) => (
				<li>
					<strong>{section.title}</strong>
					<ul>
						{section.links.map((link) => (
							<li>
								<A href={link.href}>{link.title}</A>
							</li>
						))}
					</ul>
				</li>
			))}
		</ul>
	)
}
