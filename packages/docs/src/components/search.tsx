import { A } from '@pounce/kit'
import { reactive } from 'mutts'
import { type NavLink, navigation } from '../nav-index'

interface SearchState {
	query: string
	results: NavLink[]
}

export default function Search() {
	const state = reactive<SearchState>({
		query: '',
		get results() {
			if (!this.query) return []
			const q = this.query.toLowerCase()
			const matches: NavLink[] = []

			for (const section of navigation) {
				for (const link of section.links) {
					if (link.title.toLowerCase().includes(q) || section.title.toLowerCase().includes(q)) {
						matches.push(link)
					}
				}
			}

			return matches.slice(0, 8)
		},
	})

	return (
		<div class="docs-search">
			<input
				type="search"
				placeholder="Search docs..."
				value={state.query}
				onInput={(e) => (state.query = (e.target as HTMLInputElement).value)}
			/>
			{state.query && (
				<ul class="search-results">
					{state.results.length > 0 ? (
						state.results.map((result) => (
							<li>
								<A href={result.href} onClick={() => (state.query = '')}>
									{result.title}
								</A>
							</li>
						))
					) : (
						<li class="no-results">No results found</li>
					)}
				</ul>
			)}
		</div>
	)
}
