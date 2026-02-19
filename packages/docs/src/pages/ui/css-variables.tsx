import { Section, Code, PackageHeader } from '../../components'
import { componentStyle } from '@pounce/kit'

componentStyle.sass`
.swatches
	display: grid
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))
	gap: 1.5rem
	margin-top: 1rem

.swatch-item
	display: flex
	flex-direction: column
	gap: 0.5rem

.swatch-box
	height: 3rem
	border-radius: var(--pounce-border-radius)
	border: 1px solid var(--pounce-border)
	display: flex
	align-items: center
	justify-content: center
	font-weight: 600
	font-size: 0.8rem

.swatch-info
	display: flex
	flex-direction: column
	font-size: 0.85rem
	code
		font-size: 0.75rem
		opacity: 0.7
`

function Swatch({ name, label }: { name: string; label?: string }) {
	return (
		<div class="swatch-item">
			<div class="swatch-box" style={{ background: `var(${name})`, color: 'var(--pounce-fg)' }}>
				{label || ''}
			</div>
			<div class="swatch-info">
				<strong>{label || name.replace('--pounce-', '')}</strong>
				<code>{name}</code>
			</div>
		</div>
	)
}

export default function CssVariablesPage() {
	return (
		<article>
			<PackageHeader
				name="CSS Variables"
				description="The design system contract. Customize Pounce UI by overriding these variables in your global stylesheet."
			/>

			<Section title="Brand Colors">
				<div class="swatches">
					<Swatch name="--pounce-primary" label="Primary" />
					<Swatch name="--pounce-secondary" label="Secondary" />
					<Swatch name="--pounce-contrast" label="Contrast" />
				</div>
			</Section>

			<Section title="Semantic Colors">
				<div class="swatches">
					<Swatch name="--pounce-success" label="Success" />
					<Swatch name="--pounce-warning" label="Warning" />
					<Swatch name="--pounce-danger" label="Danger" />
				</div>
			</Section>

			<Section title="Layout & Spacing">
				<div class="swatches">
					<Swatch name="--pounce-spacing" label="Spacing" />
					<Swatch name="--pounce-border-radius" label="Border Radius" />
					<Swatch name="--pounce-form-height" label="Form Height" />
				</div>
			</Section>

			<Section title="Surface & Text">
				<div class="swatches">
					<Swatch name="--pounce-bg" label="Background" />
					<Swatch name="--pounce-card-bg" label="Card Background" />
					<Swatch name="--pounce-fg" label="Foreground" />
					<Swatch name="--pounce-border" label="Border" />
					<Swatch name="--pounce-muted" label="Muted Text" />
					<Swatch name="--pounce-muted-border" label="Muted Border" />
				</div>
			</Section>

			<Section title="Customization Example">
				<p>Override variables globally or env-based to a container:</p>
				<Code code={`:root {\n  --pounce-primary: #ec4899; /* Pink */\n  --pounce-border-radius: 0;\n}`} lang="css" />
			</Section>
		</article>
	)
}
