import { Badge, Chip, Pill, Stars } from '@sursaut/adapter-pico'
import { reactive } from 'mutts'
import { DemoCard, DemoGrid, DemoSection, DemoState } from './shared'

export function BadgeFixture() {
	return (
		<Badge variant="danger" el={{ class: 'custom-badge', 'data-testid': 'badge' }}>
			Alert
		</Badge>
	)
}

export function PillFixture() {
	return (
		<Pill variant="success" el={{ class: 'custom-pill', 'data-testid': 'pill' }}>
			Ready
		</Pill>
	)
}

export function ChipFixture() {
	return <Chip el={{ class: 'custom-chip', 'data-testid': 'chip' }}>Tag</Chip>
}

export default function StatusSection() {
	const state = reactive({
		rating: 4,
		dismissed: 0,
	})

	return (
		<DemoSection
			title="Status"
			description="Badge, pill, chip and stars grouped around adapter styling and feedback state."
		>
			<DemoGrid>
				<DemoCard title="Badge + Pill">
					<div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center;">
						<Badge variant="primary">New</Badge>
						<Pill variant="success">Stable</Pill>
						<Badge variant="contrast">Preview</Badge>
					</div>
				</DemoCard>
				<DemoCard title="Chip" footer={<DemoState label="Dismissals" value={state.dismissed} />}>
					<Chip dismissible onDismiss={() => state.dismissed++}>
						Removable filter
					</Chip>
				</DemoCard>
				<DemoCard title="Stars" footer={<DemoState label="Rating" value={state.rating} />}>
					<Stars
						value={state.rating}
						onChange={(value: number | readonly [number, number]) => {
							if (typeof value === 'number') state.rating = value
						}}
					/>
				</DemoCard>
			</DemoGrid>
		</DemoSection>
	)
}
