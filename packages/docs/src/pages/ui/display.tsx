import { ApiTable, Code, PackageHeader, Section } from '../../components'

const basicUsage = `import { ThemeToggle } from '@pounce/ui'
import { settings } from './settings' // Your EnvSettings object

function Header() {
  return (
    <header>
      <ThemeToggle settings={settings} />
    </header>
  )
}`

const themeState = `import { ui } from '@pounce/ui'

console.log(ui.theme) // 'light' | 'dark'`

const envSnippet = `import { Env } from '@pounce/kit/env'
import { reactive } from 'mutts'

const settings = reactive({ theme: 'auto' })

// Env resolves 'auto' to the system preference and sets data-theme on its DOM element
<Env settings={settings}>
  <App />
</Env>`

export default function DisplayPage() {
	return (
		<article>
			<PackageHeader
				name="@pounce/ui"
				description="Theme management and display utilities."
				install="pnpm add @pounce/ui"
			/>

			<Section title="Theme Toggle">
				<p>
					The <code>ThemeToggle</code> component provides a UI for switching between Light, Dark,
					and Auto (system) themes. It integrates with the <code>EnvSettings</code> from{' '}
					<code>@pounce/kit</code>.
				</p>
				<Code code={basicUsage} lang="tsx" />

				<ApiTable
					props={[
						{
							name: 'settings',
							type: 'EnvSettings',
							description: 'The reactive settings object to read/write theme.',
						},
						{
							name: 'simple',
							type: 'boolean',
							description:
								'If true, shows a simple toggle (light/dark) without the dropdown for Auto.',
						},
						{
							name: 'icons',
							type: 'Record<string, JSX.Element | string>',
							description: 'Custom icons for themes.',
						},
						{
							name: 'themes',
							type: 'string[]',
							description: 'Additional custom theme names to show in the dropdown.',
						},
					]}
				/>
			</Section>

			<Section title="Reactive Theme State">
				<p>
					The UI package maintains a global reactive <code>ui</code> object that reflects the
					currently active theme (resolved from settings or system).
				</p>
				<Code code={themeState} lang="tsx" />
			</Section>

			<Section title="Env & DisplayProvider">
				<p>
					Theme resolution is handled by the <code>Env</code> component in <code>@pounce/kit</code>.
					It tracks system preferences and propagates the active theme through the env.
				</p>
				<Code code={envSnippet} lang="tsx" />
				<blockquote>
					[!NOTE] The older <code>DisplayProvider</code> pattern has been unified into the{' '}
					<code>Env</code> component for better integration with SSR and global settings.
				</blockquote>
			</Section>
		</article>
	)
}
