import { A } from '@sursaut'
import { stored } from '@sursaut/kit'
import { navigation } from '../nav-index'

interface PageNavProps {
	onNavigate?: () => void
}

// Persist collapsed state in localStorage
const collapsedState = stored<Record<string, boolean>>({})

export default function PageNav({ onNavigate }: PageNavProps) {
	const toggleSection = (title: string) => {
		collapsedState[title] = !collapsedState[title]
	}

	return (
		<ul>
			<li>
				<A href="/" onClick={onNavigate}>
					Home
				</A>
			</li>
			{navigation.map((section) => {
				const isCollapsed = section.collapsible ? collapsedState[section.title] : false

				return (
					<li>
						{section.collapsible ? (
							<button
								class="nav-toggle"
								onClick={() => toggleSection(section.title)}
								aria-expanded={!isCollapsed}
								aria-controls={`nav-section-${section.title}`}
							>
								<span class="nav-chevron">{isCollapsed ? '▶' : '▼'}</span>
								{section.title}
							</button>
						) : (
							<strong>{section.title}</strong>
						)}
						<ul
							id={`nav-section-${section.title}`}
							class={{ 'nav-section': true, collapsed: isCollapsed }}
							style={{ display: isCollapsed ? 'none' : 'block' }}
						>
							{section.links.map((link) => (
								<li>
									<A href={link.href} onClick={onNavigate}>
										{link.title}
									</A>
								</li>
							))}
						</ul>
					</li>
				)
			})}
		</ul>
	)
}
