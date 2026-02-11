/**
 * E2E test fixture entry point for @pounce/ui.
 * Hash-based router loads fixture components on demand.
 */
import { bindApp } from '@pounce/core'
import { reactive } from 'mutts'
import { setAdapter } from '../../../src/adapter/registry'
import { TEST_ADAPTER } from '../../test-adapter'
import OverlayFixture from './OverlayFixture'
import RadioFixture from './RadioFixture'

// Install test adapter before rendering
setAdapter(TEST_ADAPTER)

const fixtures: Record<string, () => JSX.Element> = {
	overlay: () => <OverlayFixture />,
	radio: () => <RadioFixture />,
}

const state = reactive({
	fixture: null as JSX.Element | null,
	name: '',
})

function loadFixture() {
	const hash = window.location.hash.slice(1)
	state.name = hash
	const factory = fixtures[hash]
	state.fixture = factory ? factory() : <div id="no-fixture">No fixture: {hash}. Available: {Object.keys(fixtures).join(', ')}</div>
}

const App = () => (
	<div id="fixture-root">
		<nav id="fixture-nav">
			{Object.keys(fixtures).map(name => (
				<a href={`#${name}`} data-fixture={name}>{name}</a>
			))}
		</nav>
		<div id="fixture-container">
			{state.fixture}
		</div>
	</div>
)

window.addEventListener('hashchange', loadFixture)
loadFixture()
bindApp(<App />, '#app')
