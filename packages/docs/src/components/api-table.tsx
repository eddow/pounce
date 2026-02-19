import { componentStyle } from '@pounce/kit'

componentStyle.sass`
.api-table
	margin: 1.5rem 0
	overflow-x: auto

	table
		width: 100%
		border-collapse: collapse
		font-size: 0.9rem

	th
		text-align: left
		font-weight: 600
		padding: 0.5rem 0.75rem
		border-bottom: 2px solid var(--pico-muted-border-color, #e0e0e0)

	td
		padding: 0.5rem 0.75rem
		border-bottom: 1px solid var(--pico-muted-border-color, #e0e0e0)
		vertical-align: top

	.api-name
		font-family: 'Fira Code', 'Consolas', monospace
		font-weight: 600
		white-space: nowrap

	.api-type
		font-family: 'Fira Code', 'Consolas', monospace
		font-size: 0.85rem
		color: var(--pico-primary)

	.api-default
		font-family: 'Fira Code', 'Consolas', monospace
		font-size: 0.85rem
		opacity: 0.7

	.api-required
		color: var(--pico-del-color, #c0392b)
		font-size: 0.75rem
		font-weight: 600
		margin-left: 0.25rem
`

export interface PropDef {
	name: string
	type: string
	default?: string
	description: string
	required?: boolean
}

export interface ApiTableProps {
	props: PropDef[]
}

export function ApiTable({ props }: ApiTableProps) {
	return (
		<div class="api-table">
			<table>
				<thead>
					<tr>
						<th>Prop</th>
						<th>Type</th>
						<th>Default</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<for each={props}>
						{(prop: PropDef) => (
							<tr>
								<td>
									<span class="api-name">{prop.name}</span>
									{prop.required ? <span class="api-required">*</span> : null}
								</td>
								<td>
									<span class="api-type">{prop.type}</span>
								</td>
								<td>
									<span class="api-default">{prop.default ?? '—'}</span>
								</td>
								<td>{prop.description}</td>
							</tr>
						)}
					</for>
				</tbody>
			</table>
		</div>
	)
}
