import { describe, expect, test } from 'vitest'
import { h } from '@pounce/core'
import { reactive } from 'mutts'

describe('pick directive', () => {
	test('picks the correct option based on oracle function', () => {
		const state = reactive({ activeTab: 'home' })
		const env = {
			tab: (_options: Set<string>) => {
				return state.activeTab
			},
		}

		let renderedHome = 0
		let renderedAbout = 0

		const Home = () => {
			renderedHome++
			return <div>Home</div>
		}

		const About = () => {
			renderedAbout++
			return <div>About</div>
		}

		const App = () => (
			<div>
				<Home pick:tab="home" />
				<About pick:tab="about" />
			</div>
		)

		h(App).render(env)

		expect(renderedHome).toBe(1)
		expect(renderedAbout).toBe(0)

		// Switch tab
		state.activeTab = 'about'
		expect(renderedHome).toBe(1)
		expect(renderedAbout).toBe(1)
	})

	test('supports array or set returns for multi-picking', () => {
		const state = reactive({ permissions: ['view', 'edit'] })
		const env = {
			auth: (_options: Set<string>) => {
				return new Set(state.permissions)
			},
		}

		const App = () => (
			<div>
				<div id="view" pick:auth="view" />
				<div id="edit" pick:auth="edit" />
				<div id="delete" pick:auth="delete" />
			</div>
		)

		const inst = h(App)
		const root = inst.render(env)[0] as HTMLElement

		expect(root.childNodes.length).toBe(2)
		expect((root.childNodes[0] as HTMLElement).id).toBe('view')
		expect((root.childNodes[1] as HTMLElement).id).toBe('edit')

		// Remove permission reactively
		state.permissions = ['view']
		expect(root.childNodes.length).toBe(1)
		expect((root.childNodes[0] as HTMLElement).id).toBe('view')
	})
})
