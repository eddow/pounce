import { ApiTable, Code, PackageHeader, Section } from '../../components'

const basicUsage = `import { DisplayProvider, ThemeToggle } from '@pounce'
import { reactive } from 'mutts'

const settings = reactive({ theme: 'auto' as const })

function Header() {
  return (
    <DisplayProvider theme={settings.theme}>
      <header>
        <ThemeToggle settings={settings} />
      </header>
    </DisplayProvider>
  )
}`

const themeState = `import { useDisplayContext } from '@pounce'

function ThemeLabel(_props: {}, env: Env) {
  const dc = useDisplayContext(env)
  return <span>{dc.theme}</span>
}`

const envSnippet = `import { DisplayProvider } from '@pounce'

// DisplayProvider resolves 'auto' against the parent provider or system defaults.
// It sets data-theme, dir, and lang on its own DOM element.
<DisplayProvider theme="auto" direction="auto" locale="auto" timeZone="auto">
  <App />
</DisplayProvider>`

export default function DisplayPage() {
	return (
		<article>
			<PackageHeader
				name="@pounce/ui"
				description="Theme management and display utilities."
				install="pnpm add @pounce/ui @pounce/adapter-pico @pounce/kit"
			/>

			<Section title="Theme Toggle">
				<p>
					The <code>ThemeToggle</code> component provides a UI for switching between Light, Dark,
					and Auto themes. It mutates a reactive <code>{'{ theme }'}</code> object that you own,
					which is typically passed into <code>DisplayProvider</code>.
				</p>
				<Code code={basicUsage} lang="tsx" />

				<ApiTable
					props={[
						{
							name: 'settings',
							type: '{ theme: ThemeValue }',
							description: 'Reactive object read and mutated by the toggle.',
						},
						{
							name: 'simple',
							type: 'boolean',
							description:
								'If true, shows a simple toggle (light/dark) without the dropdown for Auto.',
						},
						{
							name: 'el',
							type: "JSX.IntrinsicElements['button']",
							description: 'Pass-through attributes for the trigger button.',
						},
					]}
				/>
			</Section>

			<Section title="Reactive Theme State">
				<p>
					Read resolved display values from env with <code>useDisplayContext()</code>. This gives
					you
					<code>theme</code>, <code>direction</code>, <code>locale</code>, and <code>timeZone</code>{' '}
					for the current subtree.
				</p>
				<Code code={themeState} lang="tsx" />
			</Section>

			<Section title="Env & DisplayProvider">
				<p>
					<code>DisplayProvider</code> lives in <code>@pounce/kit</code> and is re-exported by the
					front-end barrel. It resolves <code>auto</code> values against the parent provider or
					system defaults, then writes the resolved values onto its own DOM wrapper.
				</p>
				<Code code={envSnippet} lang="tsx" />
			</Section>
		</article>
	)
}
