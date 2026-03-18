import { componentStyle } from '@sursaut/kit'
import {
	arranged,
	radioButtonModel,
	splitButtonModel,
	splitRadioButtonModel,
	starsModel,
} from '@sursaut/ui'
import {
	createPaletteKeys,
	handlePaletteCommandBoxInputKeydown,
	handlePaletteCommandChipKeydown,
	Ide,
	type Palette,
	type PaletteBorders,
	type PaletteEditorContext,
	type PaletteScope,
	type PaletteTool,
	type PaletteToolbarItem,
	type PaletteToolbarItemByEditor,
	paletteCommandBoxModel,
	paletteCommandEntries,
	palettes,
	setPaletteCommandBoxInput,
} from '@sursaut/ui/palette'
import { memoize, reactive, unwrap } from 'mutts'

type DemoLayout = 'horizontal' | 'vertical'
type DemoMode = 'inspect' | 'command'
type DemoTheme = 'light' | 'dark' | 'system'

type DemoState = {
	notifications: boolean
	layout: DemoLayout
	mode: DemoMode
	theme: DemoTheme
	fontSize: number
	gameSpeed: number
	lastAction: string
}

type DemoToolbarTone = 'neutral' | 'accent'

type DemoToolbarItemConfigBase = {
	readonly icon?: string
	readonly label?: string
	readonly hint?: string
	readonly tone?: DemoToolbarTone
}

type DemoEnumSubsetConfig = DemoToolbarItemConfigBase & {
	readonly values?: readonly string[]
	readonly keywords?: readonly string[]
}

type DemoToolbarConfigByVariant = {
	toggle: DemoToolbarItemConfigBase
	flip: DemoEnumSubsetConfig
	radio: DemoEnumSubsetConfig
	select: DemoEnumSubsetConfig
	slider: DemoToolbarItemConfigBase
	stepper: DemoToolbarItemConfigBase
	stars: DemoToolbarItemConfigBase
	segmented: DemoEnumSubsetConfig
	splitRadio: DemoEnumSubsetConfig
	splitButton: DemoToolbarItemConfigBase
	button: DemoToolbarItemConfigBase
	commandBox: DemoToolbarItemConfigBase
}

type DemoToolbarItem = PaletteToolbarItemByEditor<DemoToolbarConfigByVariant>

type ThemeValue = Extract<Palette['tools']['theme'], { type: 'enum' }>['value']
type ModeValue = Extract<Palette['tools']['mode'], { type: 'enum' }>['value']
type LayoutValue = Extract<Palette['tools']['layout'], { type: 'enum' }>['value']

const demoState = reactive<DemoState>({
	notifications: true,
	layout: 'horizontal',
	mode: 'inspect',
	theme: 'system',
	fontSize: 14,
	gameSpeed: 3,
	lastAction: 'Ready',
})

const layoutDisplay = {
	horizontal: { icon: '▤', label: 'Horizontal' },
	vertical: { icon: '▥', label: 'Vertical' },
} satisfies Record<DemoLayout, { icon: string; label: string }>

const modeDisplay = {
	inspect: { icon: '⌕', label: 'Inspect' },
	command: { icon: '⌘', label: 'Command' },
} satisfies Record<DemoMode, { icon: string; label: string }>

const themeDisplay = {
	light: { icon: '☀️', label: 'Light' },
	dark: { icon: '🌙', label: 'Dark' },
	system: { icon: '💻', label: 'System' },
} satisfies Record<DemoTheme, { icon: string; label: string }>

const notificationDisplay = {
	on: { icon: '◉', label: 'Enabled' },
	off: { icon: '○', label: 'Muted' },
} as const

function setLastAction(message: string) {
	demoState.lastAction = message
}

const toolbarCommandBoxUi = reactive({ focused: false })
const popupCommandBoxUi = reactive({ focused: false, open: false })

function openCommandBoxPopup() {
	popupCommandBoxUi.open = true
	popupCommandBoxUi.focused = true
}

function closeCommandBoxPopup() {
	popupCommandBoxUi.open = false
	popupCommandBoxUi.focused = false
}

const initialIdeConfig: PaletteBorders = {
	top: [
		[
			{
				space: 0.1,
				toolbar: {
					items: [
						{
							tool: 'commandBox',
							editor: 'commandBox',
							config: { icon: '⌘', label: 'Command', hint: 'Search and run palette actions' },
						} satisfies DemoToolbarItem,
						{
							tool: 'notifications',
							editor: 'toggle',
							config: { icon: '🔔', label: 'Notifications', hint: 'Compact icon toggle' },
						} satisfies DemoToolbarItem,
						{
							tool: 'layout',
							editor: 'splitRadio',
							config: {
								icon: '▤',
								label: 'Layout',
								hint: 'Split radio with quick apply + chooser',
							},
						} satisfies DemoToolbarItem,
						{
							tool: 'theme',
							editor: 'select',
							config: {
								icon: '🎨',
								label: 'Theme',
								hint: 'Compact text editor',
							},
						} satisfies DemoToolbarItem,
					],
				},
			},
			{
				space: 0.5,
				toolbar: {
					items: [
						{
							tool: 'mode',
							editor: 'splitRadio',
							config: { icon: '⌘', label: 'Mode', hint: 'Split radio with icon labels' },
						} satisfies DemoToolbarItem,
						{
							tool: 'fontSize',
							editor: 'slider',
							config: { icon: 'A', label: 'Font size', hint: 'Toolbar slider' },
						} satisfies DemoToolbarItem,
						{
							tool: 'reset',
							editor: 'splitButton',
							config: {
								icon: '↺',
								label: 'Reset',
								hint: 'Split action menu',
								tone: 'accent',
							},
						} satisfies DemoToolbarItem,
					],
				},
			},
		],
	],
	left: [
		[
			{
				space: 1,
				toolbar: {
					items: [
						{
							tool: 'theme',
							editor: 'flip',
							config: {
								icon: '🌓',
								label: 'Theme',
								hint: 'Single-button light/dark toggle',
								keywords: ['light', 'dark'],
							},
						} satisfies DemoToolbarItem,
						{
							tool: 'mode',
							editor: 'splitRadio',
							config: { icon: '🎯', label: 'Mode', hint: 'Compact focus mode chooser' },
						} satisfies DemoToolbarItem,
					],
				},
			},
		],
	],
	right: [
		[
			{
				space: 0,
				toolbar: {
					items: [
						{
							tool: 'fontSize',
							editor: 'slider',
							config: { icon: 'A', label: 'Font size', hint: 'Right rail slider' },
						} satisfies DemoToolbarItem,
						{
							tool: 'gameSpeed',
							editor: 'stars',
							config: { icon: '★', label: 'Speed', hint: 'Stars editor' },
						} satisfies DemoToolbarItem,
					],
				},
			},
		],
	],
	bottom: [
		[
			{
				space: 0.58,
				toolbar: {
					items: [
						{
							tool: 'gameSpeed',
							editor: 'stars',
							config: { icon: '▶', label: 'Playback speed', hint: 'Dense stars editor' },
						} satisfies DemoToolbarItem,
						{
							tool: 'theme',
							editor: 'segmented',
							config: {
								icon: '🌓',
								label: 'Theme',
								hint: 'Theme pills',
								values: ['light', 'dark', 'system'],
							},
						} satisfies DemoToolbarItem,
					],
				},
			},
			{
				space: 0.42,
				toolbar: {
					items: [
						{
							tool: 'layout',
							editor: 'segmented',
							config: {
								icon: '▤',
								label: 'Layout',
								hint: 'Horizontal/vertical chips',
								keywords: ['row', 'column'],
							},
						} satisfies DemoToolbarItem,
						{
							tool: 'fontSize',
							editor: 'slider',
							config: { icon: 'A', label: 'Type scale', hint: 'Small range editor' },
						} satisfies DemoToolbarItem,
					],
				},
			},
		],
	],
}

function toolbarMeta(item: PaletteToolbarItem) {
	return {
		get config() {
			return item.config as DemoToolbarItemConfigBase | undefined
		},
		get editor() {
			return item.editor
		},
		get icon() {
			return typeof this.config?.icon === 'string' ? this.config.icon : undefined
		},
		get label() {
			return typeof this.config?.label === 'string' ? this.config.label : item.tool
		},
		get hint() {
			return typeof this.config?.hint === 'string' ? this.config.hint : undefined
		},
		get tone() {
			return this.config?.tone === 'accent' ? 'accent' : 'neutral'
		},
	}
}

function tooltip(item: PaletteToolbarItem, suffix?: string) {
	const meta = toolbarMeta(item)
	return suffix ? `${meta.label} · ${suffix}` : meta.label
}

function resetDefaults() {
	demoState.notifications = true
	demoState.layout = 'horizontal'
	demoState.mode = 'command'
	demoState.theme = 'system'
	demoState.fontSize = 14
	demoState.gameSpeed = 3
	setLastAction('Reset to defaults')
}

function applyPresentationMode() {
	demoState.notifications = false
	demoState.layout = 'horizontal'
	demoState.mode = 'command'
	demoState.theme = 'dark'
	demoState.fontSize = 16
	demoState.gameSpeed = 2
	setLastAction('Applied presentation preset')
}

function applyInspectorMode() {
	demoState.notifications = true
	demoState.layout = 'vertical'
	demoState.mode = 'inspect'
	demoState.theme = 'system'
	demoState.fontSize = 13
	demoState.gameSpeed = 4
	setLastAction('Applied inspector preset')
}

function compactIcon(value: string) {
	if (value in themeDisplay) return themeDisplay[value as DemoTheme].icon
	if (value in modeDisplay) return modeDisplay[value as DemoMode].icon
	if (value in layoutDisplay) return layoutDisplay[value as DemoLayout].icon
	return value
}

function compactLabel(value: string) {
	if (value in themeDisplay) return themeDisplay[value as DemoTheme].label
	if (value in modeDisplay) return modeDisplay[value as DemoMode].label
	if (value in layoutDisplay) return layoutDisplay[value as DemoLayout].label
	return value
}

function normalizeSubsetToken(value: string) {
	return value.trim().toLowerCase()
}

function enumSubsetConfig(item: PaletteToolbarItem): DemoEnumSubsetConfig | undefined {
	const config = item.config
	if (!config || typeof config !== 'object') return undefined
	return config as DemoEnumSubsetConfig
}

function resolveEnumValues(
	item: PaletteToolbarItem,
	tool: Extract<Palette['tools'][string], { type: 'enum' }>
) {
	const config = enumSubsetConfig(item)
	const explicitValues = config?.values
	if (explicitValues?.length) {
		const allowed = new Set(explicitValues.map(normalizeSubsetToken))
		return tool.values.filter((value) => allowed.has(normalizeSubsetToken(value.value)))
	}
	const keywords = config?.keywords
	if (!keywords?.length) return tool.values
	const expected = new Set(keywords.map(normalizeSubsetToken))
	return tool.values.filter((value) => {
		const actual = new Set(
			[value.value, value.label, ...(value.categories ?? []), ...(value.keywords ?? [])]
				.filter((entry): entry is string => typeof entry === 'string')
				.map(normalizeSubsetToken)
		)
		for (const keyword of expected) {
			if (actual.has(keyword)) return true
		}
		return false
	})
}

function layoutFromScope(scope: PaletteScope): DemoLayout {
	return arranged(scope).orientation as DemoLayout
}

function regionFromScope(scope: PaletteScope) {
	return scope.region ?? (layoutFromScope(scope) === 'vertical' ? 'left' : 'top')
}

function menuChevron(scope: PaletteScope) {
	switch (regionFromScope(scope)) {
		case 'bottom':
			return '▴'
		case 'left':
			return '▸'
		case 'right':
			return '◂'
		default:
			return '▾'
	}
}

function assignEnumValue(tool: Extract<Palette['tools'][string], { type: 'enum' }>, value: string) {
	if (value === 'light' || value === 'dark' || value === 'system') {
		tool.value = value as ThemeValue
	} else if (value === 'inspect' || value === 'command') {
		tool.value = value as ModeValue
	} else if (value === 'horizontal' || value === 'vertical') {
		tool.value = value as LayoutValue
	}
}

function SplitRadioEditor({
	item,
	tool,
	scope,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'enum' }>>) {
	const direction = layoutFromScope(scope)
	const values = resolveEnumValues(item, tool)
	const model = splitRadioButtonModel<string>({
		get value() {
			return tool.value
		},
		set value(value) {
			assignEnumValue(tool, value)
		},
		items: values.map((value) => ({
			value: value.value,
			label: value.icon ?? value.label ?? value.value,
			disabled: value.can === false,
		})),
		get group() {
			return tool.value
		},
		set group(value) {
			assignEnumValue(tool, value)
			setLastAction(`${toolbarMeta(item).label}: ${compactLabel(value)}`)
		},
		onClick: (value) => {
			if (typeof value === 'string')
				setLastAction(`${toolbarMeta(item).label}: ${compactLabel(value)}`)
		},
		menuAriaLabel: `${toolbarMeta(item).label} choices`,
	})

	return (
		<div
			class={[
				'palette-demo-split',
				'palette-demo-split-radio',
				`palette-demo-tone-${toolbarMeta(item).tone}`,
				`palette-demo-layout-${direction}`,
			]}
		>
			<button
				type="button"
				class={['palette-demo-tool', model.checked ? 'is-selected' : undefined]}
				{...model.button}
				title={tooltip(item, compactLabel(tool.value))}
			>
				<span class="palette-demo-icon">{compactIcon(tool.value)}</span>
			</button>
			<button
				type="button"
				class="palette-demo-trigger"
				{...model.trigger}
				title={tooltip(item, 'Open choices')}
			>
				{menuChevron(scope)}
			</button>
			<div
				class={[
					'palette-demo-menu',
					`palette-demo-layout-${direction}`,
					`palette-demo-region-${regionFromScope(scope)}`,
				]}
				{...model.menu}
			>
				<for each={model.items}>
					{(entry) => (
						<button
							type="button"
							class={['palette-demo-menu-item', entry.checked ? 'is-selected' : undefined]}
							{...entry.button}
							title={compactLabel(entry.item.value)}
						>
							<span class="palette-demo-icon">{compactIcon(entry.item.value)}</span>
							<span>{compactLabel(entry.item.value)}</span>
						</button>
					)}
				</for>
			</div>
		</div>
	)
}

function RadioEditor({
	item,
	tool,
	scope,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'enum' }>>) {
	const direction = layoutFromScope(scope)
	const meta = toolbarMeta(item)
	const values = resolveEnumValues(item, tool)
	return (
		<div
			class={[
				'palette-demo-radio-group',
				`palette-demo-tone-${meta.tone}`,
				`palette-demo-layout-${direction}`,
			]}
			title={tooltip(item, meta.hint)}
		>
			<span if={meta.icon} class="palette-demo-radio-label">
				<span class="palette-demo-icon">{meta.icon}</span>
				<span>{meta.label}</span>
			</span>
			<for each={values}>
				{(value) => (
					<button
						type="button"
						class={[
							'palette-demo-radio-item',
							tool.value === value.value ? 'is-selected' : undefined,
						]}
						disabled={value.can === false || tool.value === value.value}
						onClick={() => {
							tool.value = value.value
							setLastAction(`${meta.label}: ${compactLabel(value.value)}`)
						}}
						title={compactLabel(value.value)}
					>
						<span class="palette-demo-icon">{tool.value === value.value ? '◉' : '○'}</span>
						<span>{value.icon ?? compactIcon(value.value)}</span>
						<span>{value.label ?? compactLabel(value.value)}</span>
					</button>
				)}
			</for>
		</div>
	)
}

function SplitButtonEditor({
	item,
	tool,
	scope,
}: PaletteEditorContext<Extract<PaletteTool, { run(): void }>>) {
	const direction = layoutFromScope(scope)
	const actions = [
		{
			value: 'reset',
			label: 'Reset',
			onClick: () => {
				tool.run()
			},
		},
		{
			value: 'presentation',
			label: 'Present',
			onClick: () => {
				applyPresentationMode()
			},
		},
		{
			value: 'inspect',
			label: 'Inspect',
			onClick: () => {
				applyInspectorMode()
			},
		},
	] as const

	const state = {
		get value() {
			if (demoState.lastAction.includes('presentation')) return 'presentation'
			if (demoState.lastAction.includes('inspector')) return 'inspect'
			return 'reset'
		},
	}

	const model = splitButtonModel<(typeof actions)[number]['value']>({
		get value() {
			return state.value
		},
		items: actions,
		onClick: (value) => {
			if (value === 'reset') setLastAction('Reset to defaults')
		},
		menuAriaLabel: `${toolbarMeta(item).label} actions`,
	})

	return (
		<div
			class={[
				'palette-demo-split',
				'palette-demo-split-button',
				`palette-demo-tone-${toolbarMeta(item).tone}`,
				`palette-demo-layout-${direction}`,
			]}
		>
			<button
				type="button"
				class={['palette-demo-tool', 'palette-demo-tool-accent']}
				{...model.button}
				disabled={!tool.can}
				title={tooltip(item, 'Run selected action')}
			>
				<span class="palette-demo-icon">{toolbarMeta(item).icon ?? '↺'}</span>
			</button>
			<button
				type="button"
				class="palette-demo-trigger"
				{...model.trigger}
				title={tooltip(item, 'Open action presets')}
			>
				{menuChevron(scope)}
			</button>
			<div
				class={[
					'palette-demo-menu',
					`palette-demo-layout-${direction}`,
					`palette-demo-region-${regionFromScope(scope)}`,
				]}
				{...model.menu}
			>
				<for each={model.items}>
					{(entry) => (
						<button type="button" class="palette-demo-menu-item" {...entry.button}>
							{entry.item.label}
						</button>
					)}
				</for>
			</div>
		</div>
	)
}

function ToggleEditor({
	item,
	tool,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'boolean' }>>) {
	const meta = toolbarMeta(item)
	return (
		<button
			type="button"
			class={[
				'palette-demo-tool',
				'palette-demo-tool-compact',
				`palette-demo-tone-${meta.tone}`,
				tool.value ? 'is-selected' : undefined,
			]}
			title={tooltip(item, meta.hint)}
			onClick={() => {
				tool.value = !tool.value
				setLastAction(`Notifications ${tool.value ? 'enabled' : 'muted'}`)
			}}
		>
			<span class="palette-demo-icon">{tool.value ? '🔔' : '🔕'}</span>
		</button>
	)
}

function FlipEditor({
	item,
	tool,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'enum' }>>) {
	const meta = toolbarMeta(item)
	const state = {
		get values() {
			return resolveEnumValues(item, tool)
		},
		get currentIndex() {
			return state.values.findIndex((value) => value.value === tool.value)
		},
		get next() {
			return state.values.length === 0
				? undefined
				: state.values[(state.currentIndex + 1 + state.values.length) % state.values.length]
		},
		get display() {
			return state.values[state.currentIndex >= 0 ? state.currentIndex : 0]
		},
	}
	return (
		<button
			type="button"
			class={[
				'palette-demo-tool',
				'palette-demo-tool-compact',
				`palette-demo-tone-${meta.tone}`,
				tool.value !== tool.default ? 'is-selected' : undefined,
			]}
			disabled={!state.next || state.next.can === false}
			title={tooltip(item, state.display ? compactLabel(state.display.value) : meta.hint)}
			onClick={() => {
				if (!state.next) return
				tool.value = state.next.value
				setLastAction(`${meta.label}: ${compactLabel(state.next.value)}`)
			}}
		>
			<span class="palette-demo-icon">
				{state.display?.icon ?? meta.icon ?? compactIcon(tool.value)}
			</span>
		</button>
	)
}

function SelectEditor({
	item,
	tool,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'enum' }>>) {
	const meta = toolbarMeta(item)
	const values = resolveEnumValues(item, tool)
	return (
		<label
			class={['palette-demo-select', `palette-demo-tone-${meta.tone}`]}
			title={tooltip(item, meta.hint)}
		>
			<span class="palette-demo-icon">{meta.icon ?? compactIcon(tool.value)}</span>
			<select
				value={tool.value}
				update:value={(value) => {
					assignEnumValue(tool, value)
					setLastAction(`${meta.label}: ${compactLabel(value)}`)
				}}
			>
				<for each={values}>
					{(value) => <option value={value.value}>{value.label ?? value.value}</option>}
				</for>
			</select>
		</label>
	)
}

function SegmentedEditor({
	item,
	tool,
	scope,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'enum' }>>) {
	const direction = layoutFromScope(scope)
	const meta = toolbarMeta(item)
	const values = resolveEnumValues(item, tool)
	return (
		<div
			class={[
				'palette-demo-segmented',
				`palette-demo-tone-${meta.tone}`,
				`palette-demo-layout-${direction}`,
			]}
			title={tooltip(item, meta.hint)}
		>
			<for each={values}>
				{(value) => (
					<button
						type="button"
						class={[
							'palette-demo-tool',
							'palette-demo-tool-compact',
							tool.value === value.value ? 'is-selected' : undefined,
						]}
						disabled={value.can === false || tool.value === value.value}
						onClick={() => {
							tool.value = value.value
							setLastAction(`${meta.label}: ${compactLabel(value.value)}`)
						}}
						title={compactLabel(value.value)}
					>
						<span class="palette-demo-icon">{value.icon ?? compactIcon(value.value)}</span>
						<span>{value.label ?? value.value}</span>
					</button>
				)}
			</for>
		</div>
	)
}

function StarsEditor({
	item,
	tool,
	scope,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'number' }>>) {
	const direction = layoutFromScope(scope)
	const meta = toolbarMeta(item)
	const model = starsModel({
		get value() {
			return tool.value
		},
		set value(value) {
			if (typeof value === 'number' && value >= 1 && value <= 5) {
				tool.value = value
				setLastAction(`Playback speed x${value}`)
			}
		},
		maximum: 5,
		before: 'star-filled',
		after: 'star-outline',
		orientation: direction,
	})
	return (
		<div
			class={[
				'palette-demo-stars',
				`palette-demo-tone-${meta.tone}`,
				`palette-demo-layout-${direction}`,
			]}
			title={tooltip(item, meta.hint)}
		>
			<span class="palette-demo-icon">{meta.icon ?? '★'}</span>
			<span
				class={['palette-demo-stars-row', `palette-demo-layout-${direction}`]}
				{...model.container}
			>
				<for each={model.starItems}>
					{(entry) => (
						<span
							class={['palette-demo-arrow', entry.status === 'before' ? 'is-selected' : undefined]}
							{...entry.el}
							title={`${meta.label} ${entry.index + 1}`}
						>
							{entry.status === 'after' || entry.status === 'zero' ? '▷' : '▶'}
						</span>
					)}
				</for>
			</span>
		</div>
	)
}

function SliderEditor({
	item,
	tool,
	scope,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'number' }>>) {
	const direction = layoutFromScope(scope)
	const meta = toolbarMeta(item)
	const min = tool.min ?? 0
	const max = tool.max ?? 100
	const step = tool.step ?? 1
	return (
		<label
			class={[
				'palette-demo-slider',
				`palette-demo-tone-${meta.tone}`,
				`palette-demo-layout-${direction}`,
				`palette-demo-region-${regionFromScope(scope)}`,
			]}
			title={tooltip(item, `${meta.label} ${tool.value}`)}
		>
			<span class="palette-demo-icon">{meta.icon ?? 'A'}</span>
			<input
				type="range"
				min={String(min)}
				max={String(max)}
				step={String(step)}
				value={String(tool.value)}
				onInput={(event) => {
					if (event.currentTarget instanceof HTMLInputElement) {
						tool.value = Number(event.currentTarget.value)
						setLastAction(`${meta.label}: ${tool.value}`)
					}
				}}
			/>
		</label>
	)
}

function StepperEditor({
	item,
	tool,
	scope,
}: PaletteEditorContext<Extract<Palette['tools'][string], { type: 'number' }>>) {
	const meta = toolbarMeta(item)
	return (
		<div
			class={[
				'palette-demo-stepper',
				`palette-demo-tone-${meta.tone}`,
				`palette-demo-layout-${layoutFromScope(scope)}`,
			]}
			title={tooltip(item, `${meta.label} ${tool.value}`)}
		>
			<button
				type="button"
				class={['palette-demo-tool', 'palette-demo-tool-compact']}
				disabled={tool.value - (tool.step ?? 1) < (tool.min ?? Number.NEGATIVE_INFINITY)}
				onClick={() => {
					tool.value = Math.max(tool.min ?? Number.NEGATIVE_INFINITY, tool.value - (tool.step ?? 1))
					setLastAction(`${meta.label}: ${tool.value}`)
				}}
			>
				−
			</button>
			<span class="palette-demo-stepper-value">
				<span class="palette-demo-icon">{meta.icon ?? 'A'}</span>
				{tool.value}
			</span>
			<button
				type="button"
				class={['palette-demo-tool', 'palette-demo-tool-compact']}
				disabled={tool.value + (tool.step ?? 1) > (tool.max ?? Number.POSITIVE_INFINITY)}
				onClick={() => {
					tool.value = Math.min(tool.max ?? Number.POSITIVE_INFINITY, tool.value + (tool.step ?? 1))
					setLastAction(`${meta.label}: ${tool.value}`)
				}}
			>
				+
			</button>
		</div>
	)
}

function ButtonEditor({ item, tool }: PaletteEditorContext<Extract<PaletteTool, { run(): void }>>) {
	const meta = toolbarMeta(item)
	return (
		<button
			type="button"
			class={['palette-demo-tool', `palette-demo-tone-${meta.tone}`]}
			disabled={!tool.can}
			title={tooltip(item, meta.hint)}
			onClick={() => {
				tool.run()
			}}
		>
			<span class="palette-demo-icon">{meta.icon ?? '▶'}</span>
			<span>{meta.label}</span>
		</button>
	)
}

type DemoCommandBoxProps = {
	readonly commandBox: ReturnType<typeof paletteCommandBoxModel>
	readonly editable?: boolean
	readonly palette?: Palette
	readonly icon?: string
	readonly title?: string
	readonly expanded: boolean
	readonly floating?: boolean
	readonly onInputFocus: () => void
	readonly onInputBlur: (event: FocusEvent) => void
	readonly onEscapeOrExecute: () => void
	readonly onInputMount?: (input: HTMLInputElement) => void
	readonly onSuggestionPick?: () => void
}

function CommandBox(props: DemoCommandBoxProps) {
	let input: HTMLInputElement | undefined
	const ui = {
		get editable() {
			return Boolean(props.editable && props.palette)
		},
	}
	const edition = memoize(() =>
		radioButtonModel({
			value: props.palette,
			clearable: true,
			get group() {
				return palettes.editing
			},
			set group(value) {
				palettes.editing = value
			},
			ariaLabel: 'Edit palette',
		})
	)

	return (
		<div
			class={[
				'palette-demo-command-box',
				props.expanded ? 'is-expanded' : undefined,
				props.floating ? 'is-floating' : undefined,
			]}
		>
			<div class="palette-demo-command-shell" title={props.title}>
				<button
					if={ui.editable}
					type="button"
					{...(edition().button ?? {})}
					class={[
						'palette-demo-command-icon',
						'palette-demo-tool',
						'palette-demo-tool-compact',
						edition().checked ? 'is-selected' : undefined,
					]}
				>
					✎
				</button>
				<span else class="palette-demo-icon">
					{props.icon ?? '⌘'}
				</span>
				<div class="palette-demo-command-tokens">
					<for each={props.commandBox.categories.active}>
						{(category) => (
							<button
								type="button"
								class="palette-demo-command-chip"
								onClick={() => {
									props.commandBox.categories.toggle(category)
								}}
								onKeydown={(event) =>
									handlePaletteCommandChipKeydown({
										commandBox: props.commandBox,
										event,
										token: category,
										type: 'category',
									})
								}
							>
								#{category}
							</button>
						)}
					</for>
					<for each={props.commandBox.keywords.tokens}>
						{(token) => (
							<button
								type="button"
								class="palette-demo-command-chip"
								onClick={() => {
									props.commandBox.keywords.removeToken(token.keyword)
								}}
								onKeydown={(event) =>
									handlePaletteCommandChipKeydown({
										commandBox: props.commandBox,
										event,
										token: token.keyword,
									})
								}
							>
								{token.keyword}
							</button>
						)}
					</for>
					<input
						this={input}
						use={() => {
							if (input) props.onInputMount?.(input)
						}}
						class="palette-demo-command-input"
						value={props.commandBox.input.value}
						placeholder={props.commandBox.input.placeholder}
						onInput={(event) => {
							setPaletteCommandBoxInput(props.commandBox, event)
						}}
						onFocus={() => {
							props.onInputFocus()
						}}
						onBlur={(event) => {
							props.onInputBlur(event)
						}}
						onKeydown={(event) => {
							const handled = handlePaletteCommandBoxInputKeydown({
								commandBox: props.commandBox,
								event,
								onAfterExecute: () => {
									props.onEscapeOrExecute()
								},
							})
							if (event.key === 'Escape') props.onEscapeOrExecute()
							return handled
						}}
					/>
				</div>
			</div>
			<div if={props.expanded} class="palette-demo-command-popover">
				<div if={props.commandBox.suggestions.length > 0} class="palette-demo-command-suggestions">
					<for each={props.commandBox.suggestions}>
						{(suggestion) => (
							<button
								type="button"
								class="palette-demo-command-suggestion"
								onClick={() => {
									props.commandBox.keywords.addToken(suggestion.keyword)
									props.commandBox.input.value = ''
									props.onSuggestionPick?.()
								}}
							>
								{suggestion.keyword}
							</button>
						)}
					</for>
				</div>
				<div class="palette-demo-command-results">
					<div if={props.commandBox.results.length === 0} class="palette-demo-command-empty">
						No matching commands
					</div>
					<for each={props.commandBox.results.slice(0, 6)}>
						{(entry) => {
							const state = {
								get selected() {
									return props.commandBox.selection.item?.id === entry.id
								},
							}
							return (
								<button
									type="button"
									class={[
										'palette-demo-command-result',
										state.selected ? 'is-selected' : undefined,
									]}
									disabled={entry.can === false}
									onClick={() => {
										props.commandBox.execute(entry.id)
										props.onEscapeOrExecute()
									}}
								>
									<span class="palette-demo-command-result-copy">
										<span class="palette-demo-command-result-label">
											<span if={entry.icon} class="palette-demo-icon">
												{entry.icon}
											</span>
											{entry.label}
										</span>
										<span class="palette-demo-command-result-meta">{entry.meta}</span>
									</span>
								</button>
							)
						}}
					</for>
				</div>
			</div>
		</div>
	)
}

function CommandBoxEditor({ item }: PaletteEditorContext<Extract<PaletteTool, { run(): void }>>) {
	const meta = toolbarMeta(item)
	let root: HTMLDivElement | undefined
	const ui = {
		get expanded() {
			return (
				toolbarCommandBoxUi.focused ||
				toolbarCommandBox.input.value.length > 0 ||
				toolbarCommandBox.keywords.tokens.length > 0 ||
				toolbarCommandBox.categories.active.length > 0
			)
		},
	}

	return (
		<div this={root}>
			<CommandBox
				commandBox={toolbarCommandBox}
				editable={false}
				icon={meta.icon ?? '⌘'}
				title={tooltip(item, meta.hint)}
				expanded={ui.expanded}
				floating
				onInputFocus={() => {
					toolbarCommandBoxUi.focused = true
				}}
				onInputBlur={(event) => {
					const next = event.relatedTarget instanceof Node ? event.relatedTarget : undefined
					if (next && root?.contains(next)) return
					toolbarCommandBoxUi.focused = false
				}}
				onEscapeOrExecute={() => {
					toolbarCommandBoxUi.focused = false
				}}
			/>
		</div>
	)
}

function CommandBoxPopup() {
	let root: HTMLDivElement | undefined
	let input: HTMLInputElement | undefined

	return (
		<div
			class="palette-demo-command-overlay"
			onMousedown={(event: MouseEvent) => {
				if (event.target === event.currentTarget) closeCommandBoxPopup()
			}}
		>
			<div this={root} class="palette-demo-command-panel">
				<CommandBox
					expanded
					commandBox={popupCommandBox}
					editable
					palette={demoPalette}
					onInputFocus={() => {
						popupCommandBoxUi.focused = true
					}}
					onInputBlur={(event) => {
						const next = event.relatedTarget instanceof Node ? event.relatedTarget : undefined
						if (next && root?.contains(next)) return
						closeCommandBoxPopup()
					}}
					onEscapeOrExecute={() => {
						closeCommandBoxPopup()
					}}
					onInputMount={(mounted) => {
						input = mounted
						requestAnimationFrame(() => input?.focus())
					}}
					onSuggestionPick={() => {
						input?.focus()
					}}
				/>
			</div>
		</div>
	)
}

const demoEditors: NonNullable<Palette['editors']> = {
	boolean: {
		toggle: { editor: ToggleEditor, flags: { footprint: 'square' } },
	},
	enum: {
		flip: { editor: FlipEditor, flags: { footprint: 'square' } },
		radio: { editor: RadioEditor, flags: { footprint: 'free' } },
		select: { editor: SelectEditor, flags: { footprint: 'horizontal' } },
		segmented: { editor: SegmentedEditor, flags: { footprint: 'free' } },
		splitRadio: { editor: SplitRadioEditor, flags: { footprint: 'free' } },
	},
	number: {
		slider: { editor: SliderEditor, flags: { footprint: 'horizontal' } },
		stepper: { editor: StepperEditor, flags: { footprint: 'free' } },
		stars: { editor: StarsEditor, flags: { footprint: 'free' } },
	},
	run: {
		button: { editor: ButtonEditor, flags: { footprint: 'horizontal' } },
		commandBox: { editor: CommandBoxEditor, flags: { footprint: 'horizontal' } },
		splitButton: { editor: SplitButtonEditor, flags: { footprint: 'free' } },
	},
}

const demoPalette: Palette = {
	tools: {
		notifications: {
			type: 'boolean',
			label: 'Notifications',
			icon: '🔔',
			categories: ['settings'],
			keywords: ['alerts', 'sound', 'mute'],
			get value() {
				return demoState.notifications
			},
			set value(value) {
				demoState.notifications = value
			},
			default: true,
		},
		layout: {
			type: 'enum',
			label: 'Layout',
			icon: '▤',
			categories: ['layout'],
			keywords: ['arrangement'],
			get value() {
				return demoState.layout
			},
			set value(value) {
				demoState.layout = value
			},
			default: 'horizontal',
			values: [
				{
					value: 'horizontal',
					icon: layoutDisplay.horizontal.icon,
					label: layoutDisplay.horizontal.label,
					keywords: ['row'],
				},
				{
					value: 'vertical',
					icon: layoutDisplay.vertical.icon,
					label: layoutDisplay.vertical.label,
					keywords: ['column'],
				},
			],
		},
		mode: {
			type: 'enum',
			label: 'Mode',
			icon: '⌘',
			categories: ['mode'],
			keywords: ['focus'],
			get value() {
				return demoState.mode
			},
			set value(value) {
				demoState.mode = value
			},
			default: 'command',
			values: [
				{
					value: 'inspect',
					icon: modeDisplay.inspect.icon,
					label: modeDisplay.inspect.label,
					keywords: ['debug'],
				},
				{
					value: 'command',
					icon: modeDisplay.command.icon,
					label: modeDisplay.command.label,
					keywords: ['keyboard'],
				},
			],
		},
		theme: {
			type: 'enum',
			label: 'Theme',
			icon: '🎨',
			categories: ['appearance'],
			keywords: ['color'],
			get value() {
				return demoState.theme
			},
			set value(value) {
				demoState.theme = value
			},
			default: 'system',
			values: [
				{ value: 'light', icon: themeDisplay.light.icon, label: themeDisplay.light.label },
				{ value: 'dark', icon: themeDisplay.dark.icon, label: themeDisplay.dark.label },
				{ value: 'system', icon: themeDisplay.system.icon, label: themeDisplay.system.label },
			],
		},
		fontSize: {
			type: 'number',
			label: 'Font Size',
			icon: 'A',
			categories: ['appearance'],
			keywords: ['font', 'text', 'type'],
			get value() {
				return demoState.fontSize
			},
			set value(value) {
				demoState.fontSize = value
			},
			default: 14,
			min: 10,
			max: 20,
			step: 1,
		},
		gameSpeed: {
			type: 'number',
			label: 'Playback Speed',
			icon: '▶',
			categories: ['playback'],
			keywords: ['speed', 'game', 'animation'],
			get value() {
				return demoState.gameSpeed
			},
			set value(value) {
				demoState.gameSpeed = value
			},
			default: 3,
			min: 1,
			max: 5,
			step: 1,
		},
		commandBox: {
			label: 'Command Box',
			icon: '⌘',
			categories: ['run'],
			keywords: ['search', 'command'],
			get can() {
				return true
			},
			run() {
				toolbarCommandBoxUi.focused = true
			},
		},
		terminal: {
			label: 'Terminal',
			icon: '`',
			categories: ['run'],
			keywords: ['terminal', 'magic', 'popup'],
			get can() {
				return true
			},
			run() {
				openCommandBoxPopup()
			},
		},
		reset: {
			label: 'Reset Defaults',
			icon: '↺',
			categories: ['presets'],
			keywords: ['restore', 'defaults'],
			get can() {
				return (
					demoState.notifications !== true ||
					demoState.layout !== 'horizontal' ||
					demoState.mode !== 'command' ||
					demoState.theme !== 'system' ||
					demoState.fontSize !== 14 ||
					demoState.gameSpeed !== 3
				)
			},
			run() {
				resetDefaults()
			},
		},
		presentation: {
			label: 'Apply Presentation Preset',
			icon: '🎬',
			categories: ['presets'],
			keywords: ['presentation', 'present'],
			get can() {
				return true
			},
			run() {
				applyPresentationMode()
			},
		},
		inspectPreset: {
			label: 'Apply Inspector Preset',
			icon: '🧭',
			categories: ['presets'],
			keywords: ['inspect', 'inspector'],
			get can() {
				return true
			},
			run() {
				applyInspectorMode()
			},
		},
	},
	keys: createPaletteKeys({
		'`': 'terminal',
		N: 'notifications',
		L: 'layout|vertical',
		H: 'layout|horizontal',
		T: 'theme|light',
		D: 'theme|dark',
		S: 'theme|system',
		'+': 'fontSize:inc',
		'-': 'fontSize:dec',
		']': 'gameSpeed:inc',
		'[': 'gameSpeed:dec',
		M: 'mode|command',
		I: 'mode|inspect',
		R: 'reset',
	}),
	editors: demoEditors,
	editorDefaults: {
		run: 'button',
	},
}

const demoCommandEntries = paletteCommandEntries({
	palette: demoPalette,
	excludeTools: ['commandBox', 'terminal'],
})

const toolbarCommandBox = paletteCommandBoxModel({
	entries: demoCommandEntries,
	placeholder: 'Command…',
})

const popupCommandBox = paletteCommandBoxModel({
	entries: demoCommandEntries,
	placeholder: 'Command…',
})

export default function PaletteDemo() {
	const statusTone = {
		get value() {
			return demoState.notifications ? 'live' : 'quiet'
		},
	}

	return (
		<Ide
			palette={demoPalette}
			config={initialIdeConfig}
			el:class={['palette-demo-root', `palette-demo-theme-${demoState.theme}`]}
			el:style={`font-size:${demoState.fontSize}px;`}
			el:data-test="palette-demo"
			center:class="palette-demo-center"
			border:class="palette-demo-border"
			track:class="palette-demo-track"
			space:class="palette-demo-drop-zone"
			toolbar:class="palette-demo-toolbar"
		>
			<div
				class={['palette-demo-center-content', popupCommandBoxUi.open ? 'is-dimmed' : undefined]}
			>
				<div class="palette-demo-hero">
					<div class="palette-demo-hero-copy">
						<strong>Compact palette playground</strong>
						<span>
							Toolbar-first examples: icons, tooltips, split controls, select, slider, stars.
						</span>
					</div>
					<div class={['palette-demo-hero-chip', `is-${statusTone.value}`]}>
						{demoState.notifications ? notificationDisplay.on.icon : notificationDisplay.off.icon}{' '}
						{demoState.notifications ? notificationDisplay.on.label : notificationDisplay.off.label}
					</div>
				</div>
				<div class="palette-demo-strip">
					<div class="palette-demo-pill">
						{layoutDisplay[demoState.layout].icon} {layoutDisplay[demoState.layout].label}
					</div>
					<div class="palette-demo-pill">
						{modeDisplay[demoState.mode].icon} {modeDisplay[demoState.mode].label}
					</div>
					<div class="palette-demo-pill">
						{themeDisplay[demoState.theme].icon} {themeDisplay[demoState.theme].label}
					</div>
					<div class="palette-demo-pill">A {demoState.fontSize}px</div>
					<div class="palette-demo-pill">★ x{demoState.gameSpeed}</div>
				</div>
				<div class="palette-demo-panel">
					<div class="palette-demo-panel-title">Live state</div>
					<div class="palette-demo-state-grid">
						<div class="palette-demo-state-row">
							<span class="palette-demo-state-key">Last action</span>
							<span class="palette-demo-state-value">{demoState.lastAction}</span>
						</div>
						<div class="palette-demo-state-row">
							<span class="palette-demo-state-key">Theme</span>
							<span class="palette-demo-state-value">
								{themeDisplay[demoState.theme].icon} {themeDisplay[demoState.theme].label}
							</span>
						</div>
						<div class="palette-demo-state-row">
							<span class="palette-demo-state-key">Mode</span>
							<span class="palette-demo-state-value">
								{modeDisplay[demoState.mode].icon} {modeDisplay[demoState.mode].label}
							</span>
						</div>
						<div class="palette-demo-state-row">
							<span class="palette-demo-state-key">Layout</span>
							<span class="palette-demo-state-value">
								{layoutDisplay[demoState.layout].icon} {layoutDisplay[demoState.layout].label}
							</span>
						</div>
					</div>
				</div>
			</div>
			<CommandBoxPopup if={popupCommandBoxUi.open} />
		</Ide>
	)
}

// TODO: All this css will have to be in ui/palette
componentStyle.css`
	.palette-demo-root {
		display: flex;
		flex: 1 1 auto;
		width: 100%;
		height: 100%;
		min-height: 0;
		box-sizing: border-box;
		padding: 10px;
		gap: 10px;
		overflow: hidden;
		background:
			radial-gradient(circle at top, rgba(37, 99, 235, 0.22), transparent 35%),
			linear-gradient(180deg, #0f172a, #020617);
		color: #e2e8f0;
		outline: none;
	}

	.palette-demo-root.palette-demo-theme-light {
		background:
			radial-gradient(circle at top, rgba(59, 130, 246, 0.12), transparent 35%),
			linear-gradient(180deg, #e2e8f0, #cbd5e1);
		color: #0f172a;
	}

	.palette-demo-root.palette-demo-theme-system {
		background:
			radial-gradient(circle at top, rgba(16, 185, 129, 0.16), transparent 35%),
			linear-gradient(180deg, #0f172a, #020617);
	}

	.palette-demo-border {
		position: relative;
		z-index: 2;
		padding: 6px;
		border: 1px solid rgba(71, 85, 105, 0.55);
		border-radius: 16px;
		background: rgba(15, 23, 42, 0.72);
		backdrop-filter: blur(10px);
		box-sizing: border-box;
	}

	.palette-demo-root > .palette-ide-middle {
		position: relative;
		z-index: 1;
	}

	.palette-demo-track {
		gap: 0;
		align-items: stretch;
	}

	.palette-demo-drop-zone {
		position: relative;
		min-inline-size: 0;
		min-block-size: 0;
		border-radius: 10px;
		transition:
			min-inline-size 120ms ease,
			min-block-size 120ms ease,
			background 120ms ease,
			box-shadow 120ms ease;
	}

	.toolbar-stack-space.palette-demo-drop-zone::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		opacity: 0;
		transition:
			opacity 120ms ease,
			border-color 120ms ease,
			box-shadow 120ms ease;
	}

	.palette-demo-root.palette-dragging .palette-demo-border.palette-horizontal .toolbar-stack-space.palette-demo-drop-zone::before {
		border-top: 1px dotted rgba(96, 165, 250, 0.7);
		border-bottom: 1px dotted rgba(96, 165, 250, 0.7);
	}

	.palette-demo-root.palette-dragging .palette-demo-border.palette-vertical .toolbar-stack-space.palette-demo-drop-zone::before {
		border-left: 1px dotted rgba(96, 165, 250, 0.7);
		border-right: 1px dotted rgba(96, 165, 250, 0.7);
	}

	.palette-demo-root.palette-dragging .palette-demo-border.palette-horizontal .palette-demo-drop-zone:hover {
		min-inline-size: 1rem;
	}

	.palette-demo-root.palette-dragging .palette-demo-border.palette-vertical .palette-demo-drop-zone:hover {
		min-block-size: 1rem;
	}

	.palette-demo-root.palette-dragging .palette-demo-border.palette-horizontal .palette-demo-drop-zone[data-proximity='true'] {
		min-inline-size: 1rem;
	}

	.palette-demo-root.palette-dragging .palette-demo-border.palette-vertical .palette-demo-drop-zone[data-proximity='true'] {
		min-block-size: 1rem;
	}

	.palette-demo-root.palette-dragging .palette-demo-border.palette-horizontal .toolbar-stack-space.palette-demo-drop-zone[data-proximity='true'] {
		min-block-size: 1rem;
	}

	.palette-demo-root.palette-dragging .palette-demo-border.palette-vertical .toolbar-stack-space.palette-demo-drop-zone[data-proximity='true'] {
		min-inline-size: 1rem;
	}

	.palette-demo-root.palette-dragging .toolbar-stack-space.palette-demo-drop-zone[data-proximity='true']::before {
		opacity: 1;
		box-shadow: 0 0 10px rgba(96, 165, 250, 0.22);
	}

	.palette-demo-root.palette-dragging .toolbar-stack-space.palette-demo-drop-zone[data-active='true']::before {
		opacity: 1;
		box-shadow:
			0 0 14px rgba(96, 165, 250, 0.32),
			inset 0 0 0 1px rgba(147, 197, 253, 0.4);
	}

	.palette-demo-root.palette-dragging .palette-demo-drop-zone:hover,
	.palette-demo-root.palette-dragging .palette-demo-drop-zone[data-proximity='true'] {
		background: rgba(59, 130, 246, 0.08);
	}

	.palette-demo-root.palette-dragging .palette-demo-drop-zone[data-active='true'] {
		background: rgba(59, 130, 246, 0.16);
		box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.55);
	}

	.palette-demo-root.palette-editing .palette-demo-toolbar {
		cursor: grab;
	}

	.palette-demo-toolbar {
		gap: 0;
		padding: 3px;
		position: relative;
		box-sizing: border-box;
	}

	.palette-demo-border.palette-horizontal {
		inline-size: 100%;
	}

	.palette-demo-border.palette-horizontal,
	.palette-demo-border.palette-horizontal .palette-demo-track,
	.palette-demo-border.palette-horizontal .palette-demo-track > .toolbar-track-slot {
		min-block-size: max-content;
	}

	.palette-demo-border.palette-horizontal .palette-demo-toolbar {
		flex-wrap: wrap;
		align-items: center;
		align-self: stretch;
	}

	.palette-demo-border.palette-horizontal .palette-demo-track,
	.palette-demo-border.palette-horizontal .palette-demo-track > .toolbar-track-slot {
		align-items: stretch;
	}

	.palette-demo-border.palette-vertical,
	.palette-demo-border.palette-vertical .palette-demo-track,
	.palette-demo-border.palette-vertical .palette-demo-track > .toolbar-track-slot {
		min-inline-size: max-content;
	}

	.palette-demo-border.palette-vertical .palette-demo-toolbar {
		inline-size: auto;
		max-inline-size: 9.5rem;
		align-self: stretch;
	}

	.palette-demo-center {
		position: relative;
		min-height: 0;
		overflow: auto;
	}

	.palette-demo-center-content {
		display: grid;
		grid-auto-rows: max-content;
		gap: 10px;
		padding: 6px;
		align-content: start;
		min-height: 100%;
		box-sizing: border-box;
	}

	.palette-demo-center-content.is-dimmed {
		opacity: 0.35;
		transition: opacity 140ms ease;
	}

	.palette-demo-hero,
	.palette-demo-panel {
		display: grid;
		gap: 10px;
		padding: 14px;
		border: 1px solid rgba(51, 65, 85, 0.9);
		border-radius: 16px;
		background: rgba(15, 23, 42, 0.82);
		box-shadow: 0 16px 36px rgba(2, 6, 23, 0.28);
	}

	.palette-demo-hero {
		grid-template-columns: 1fr auto;
		align-items: center;
	}

	.palette-demo-hero-copy {
		display: grid;
		gap: 4px;
	}

	.palette-demo-hero-copy span {
		color: #94a3b8;
	}

	.palette-demo-hero-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 0.42rem 0.8rem;
		border-radius: 999px;
		background: rgba(30, 41, 59, 0.96);
		border: 1px solid rgba(96, 165, 250, 0.24);
		color: #bfdbfe;
	}

	.palette-demo-hero-chip.is-live {
		border-color: rgba(34, 197, 94, 0.45);
		color: #bbf7d0;
	}

	.palette-demo-hero-chip.is-quiet {
		border-color: rgba(148, 163, 184, 0.36);
		color: #cbd5e1;
	}

	.palette-demo-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 10px 12px;
		border: 1px dashed rgba(71, 85, 105, 0.9);
		border-radius: 14px;
		background: rgba(15, 23, 42, 0.56);
	}

	.palette-demo-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0.34rem 0.7rem;
		border-radius: 999px;
		background: linear-gradient(180deg, #2563eb, #1d4ed8);
		color: #eff6ff;
		font-size: 0.88rem;
	}

	.palette-demo-panel-title {
		font-size: 0.82rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #94a3b8;
	}

	.palette-demo-state-grid {
		display: grid;
		gap: 8px;
	}

	.palette-demo-state-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 10px;
		align-items: center;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid rgba(71, 85, 105, 0.55);
		background: rgba(15, 23, 42, 0.64);
	}

	.palette-demo-state-key {
		font-size: 0.74rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #94a3b8;
	}

	.palette-demo-state-value {
		font-weight: 600;
	}


	.palette-demo-root code {
		font-size: 0.88em;
		padding: 0.1rem 0.36rem;
		border-radius: 999px;
		background: rgba(30, 41, 59, 0.95);
		color: #bfdbfe;
	}

	.palette-demo-tool,
	.palette-demo-trigger,
	.palette-demo-menu-item,
	.palette-demo-arrow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		line-height: 1;
		border: 1px solid rgba(71, 85, 105, 0.95);
		background: linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
		color: inherit;
		transition:
			border-color 120ms ease,
			background 120ms ease,
			transform 120ms ease;
	}

	.palette-demo-tool,
	.palette-demo-menu-item {
		padding: 7px 10px;
		border-radius: 10px;
		cursor: pointer;
	}

	.palette-demo-tool-compact {
		min-width: 2.35rem;
		padding-inline: 8px;
	}

	.palette-demo-tool:hover:not(:disabled),
	.palette-demo-trigger:hover:not(:disabled),
	.palette-demo-menu-item:hover:not(:disabled) {
		border-color: #93c5fd;
		transform: translateY(-1px);
	}

	.palette-demo-tool:disabled,
	.palette-demo-trigger:disabled,
	.palette-demo-menu-item:disabled {
		cursor: default;
		opacity: 0.72;
	}

	.palette-demo-tool.is-selected,
	.palette-demo-menu-item.is-selected {
		background: #1d4ed8;
		border-color: #60a5fa;
		color: #eff6ff;
	}

	.palette-demo-tool-accent,
	.palette-demo-tone-accent .palette-demo-tool,
	.palette-demo-tone-accent .palette-demo-trigger {
		border-color: rgba(96, 165, 250, 0.9);
		box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.18);
	}

	.palette-demo-icon {
		display: inline-grid;
		place-items: center;
		width: 1rem;
		color: #93c5fd;
	}

	.palette-demo-command-box {
		position: relative;
		inline-size: 12rem;
		max-inline-size: min(22rem, calc(100vw - 8rem));
		transition: inline-size 140ms ease;
	}

	.palette-demo-command-overlay {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: transparent;
		z-index: 40;
		box-sizing: border-box;
	}

	.palette-demo-command-panel {
		inline-size: min(32rem, calc(100vw - 2rem));
		padding: 10px;
		border: 1px solid rgba(71, 85, 105, 0.92);
		border-radius: 18px;
		background: #020617;
		box-shadow: 0 22px 44px rgba(2, 6, 23, 0.42);
		box-sizing: border-box;
	}

	.palette-demo-command-box.is-expanded {
		inline-size: 100%;
	}

	.palette-demo-command-box.is-floating {
		z-index: 5;
	}

	.palette-demo-command-shell {
		display: flex;
		align-items: center;
		gap: 8px;
		min-inline-size: 0;
		padding: 6px 10px;
		border: 1px solid rgba(71, 85, 105, 0.95);
		border-radius: 12px;
		background: rgba(15, 23, 42, 0.88);
		box-sizing: border-box;
	}

	.palette-demo-command-box.is-expanded .palette-demo-command-shell {
		border-color: rgba(96, 165, 250, 0.9);
		box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.18);
	}

	.palette-demo-command-tokens {
		display: flex;
		flex: 1 1 auto;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		min-inline-size: 0;
	}

	.palette-demo-command-chip,
	.palette-demo-command-suggestion,
	.palette-demo-command-result {
		border: 1px solid rgba(71, 85, 105, 0.95);
		background: linear-gradient(180deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95));
		color: inherit;
	}

	.palette-demo-command-chip,
	.palette-demo-command-suggestion {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 0.2rem 0.52rem;
		border-radius: 999px;
		cursor: pointer;
	}

	.palette-demo-command-input {
		flex: 1 1 7rem;
		min-inline-size: 4rem;
		border: 0;
		outline: 0;
		background: transparent;
		color: inherit;
		font: inherit;
	}

	.palette-demo-command-input::placeholder {
		color: #94a3b8;
	}

	.palette-demo-command-popover {
		position: relative;
		margin-top: 6px;
		display: grid;
		gap: 8px;
		inline-size: 100%;
		padding: 8px;
		border-radius: 14px;
		border: 1px solid rgba(71, 85, 105, 0.9);
		background: rgba(2, 6, 23, 0.98);
		box-shadow: 0 16px 32px rgba(2, 6, 23, 0.35);
		z-index: 3;
		box-sizing: border-box;
	}

	.palette-demo-command-box.is-floating .palette-demo-command-popover {
		position: absolute;
		inset-inline: 0;
		top: calc(100% + 6px);
		inline-size: max(18rem, 100%);
	}

	.palette-demo-command-suggestions,
	.palette-demo-command-results {
		display: grid;
		gap: 6px;
	}

	.palette-demo-command-suggestions {
		grid-template-columns: repeat(auto-fit, minmax(4.75rem, max-content));
	}

	.palette-demo-command-result {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		inline-size: 100%;
		padding: 8px 10px;
		border-radius: 10px;
		cursor: pointer;
		text-align: left;
	}

	.palette-demo-command-result:hover:not(:disabled),
	.palette-demo-command-result.is-selected {
		border-color: #60a5fa;
		background: #1d4ed8;
		color: #eff6ff;
	}

	.palette-demo-command-result-copy,
	.palette-demo-command-result-label {
		display: grid;
		gap: 2px;
	}

	.palette-demo-command-result-label {
		grid-auto-flow: column;
		justify-content: start;
		align-items: center;
		gap: 6px;
		font-weight: 600;
	}

	.palette-demo-command-result-meta,
	.palette-demo-command-empty {
		color: #94a3b8;
		font-size: 0.82rem;
	}

	.palette-demo-select,
	.palette-demo-radio-group,
	.palette-demo-slider,
	.palette-demo-stepper,
	.palette-demo-stars,
	.palette-demo-segmented,
	.palette-demo-split {
		display: inline-flex;
		align-items: center;
		gap: 0;
		position: relative;
	}

	.palette-demo-select,
	.palette-demo-radio-group,
	.palette-demo-slider,
	.palette-demo-stepper,
	.palette-demo-stars {
		padding: 3px;
		border: 1px solid rgba(71, 85, 105, 0.95);
		border-radius: 12px;
		background: rgba(15, 23, 42, 0.88);
	}

	.palette-demo-select {
		padding: 0;
		border: 0;
		background: transparent;
	}

	.palette-demo-select select {
		min-width: 0;
		padding: 0.42rem 0.72rem;
		border-radius: 9px;
		border: 1px solid rgba(71, 85, 105, 0.95);
		background: rgba(15, 23, 42, 0.96);
		color: inherit;
	}

	.palette-demo-select > .palette-demo-icon,
	.palette-demo-slider > .palette-demo-icon,
	.palette-demo-stars > .palette-demo-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-inline-size: 2rem;
		padding-inline: 0.55rem;
	}

	.palette-demo-slider input[type='range'] {
		inline-size: clamp(64px, 9vw, 110px);
	}

	.palette-demo-slider.palette-demo-layout-vertical {
		inline-size: 2.375rem;
		block-size: 2.375rem;
		padding: 0;
		position: relative;
		overflow: visible;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-top-right-radius: 12px;
		border-bottom-right-radius: 12px;
		transition:
			box-shadow 120ms ease;
	}

	.palette-demo-slider.palette-demo-layout-vertical.palette-demo-region-left {
		border-top-left-radius: 12px;
		border-bottom-left-radius: 12px;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	.palette-demo-slider.palette-demo-layout-vertical::before {
		content: '';
		position: absolute;
		inset-block: 0;
		inset-inline-end: calc(100% - 1px);
		inline-size: 5.875rem;
		border: 1px solid rgba(71, 85, 105, 0.9);
		border-radius: 12px 0 0 12px;
		background: rgba(2, 6, 23, 0.98);
		box-shadow: 0 16px 32px rgba(2, 6, 23, 0.35);
		opacity: 0;
		pointer-events: none;
		transform: translateX(0.4rem);
		transition:
			transform 140ms ease,
			opacity 120ms ease;
	}

	.palette-demo-slider.palette-demo-layout-vertical.palette-demo-region-left::before {
		inset-inline-end: auto;
		inset-inline-start: calc(100% - 1px);
		border-radius: 0 12px 12px 0;
		transform: translateX(-0.4rem);
	}

	.palette-demo-slider.palette-demo-layout-vertical:hover::before,
	.palette-demo-slider.palette-demo-layout-vertical:focus-within::before {
		opacity: 1;
		transform: translateX(0);
	}

	.palette-demo-slider.palette-demo-layout-vertical > .palette-demo-icon {
		min-inline-size: 2.375rem;
		block-size: 2.375rem;
		padding-inline: 0;
		position: relative;
		z-index: 1;
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
		border-top-right-radius: 12px;
		border-bottom-right-radius: 12px;
	}

	.palette-demo-slider.palette-demo-layout-vertical.palette-demo-region-left > .palette-demo-icon {
		border-top-left-radius: 12px;
		border-bottom-left-radius: 12px;
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	.palette-demo-slider.palette-demo-layout-vertical > input[type='range'] {
		position: absolute;
		inset-block: 0;
		inset-inline-end: calc(100% - 1px);
		inline-size: 5.875rem;
		margin: 0;
		padding: 0 0.72rem 0 0.9rem;
		box-sizing: border-box;
		z-index: 2;
		background: transparent;
		border: 0;
		border-radius: 0;
		opacity: 0;
		pointer-events: none;
		transform: translateX(0.4rem);
		transition:
			transform 140ms ease,
			opacity 120ms ease;
	}

	.palette-demo-slider.palette-demo-layout-vertical.palette-demo-region-left > input[type='range'] {
		inset-inline-end: auto;
		inset-inline-start: calc(100% - 1px);
		padding: 0 0.9rem 0 0.72rem;
		transform: translateX(-0.4rem);
	}

	.palette-demo-slider.palette-demo-layout-vertical:hover > input[type='range'],
	.palette-demo-slider.palette-demo-layout-vertical:focus-within > input[type='range'] {
		opacity: 1;
		pointer-events: auto;
		transform: translateX(0);
	}

	.palette-demo-stepper {
		justify-content: center;
	}

	.palette-demo-stepper-value {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-inline-size: 3.2rem;
		padding-inline: 0.72rem;
		font-weight: 600;
	}

	.palette-demo-radio-group {
		flex-wrap: wrap;
	}

	.palette-demo-radio-label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.82rem;
		font-weight: 700;
		color: #94a3b8;
	}

	.palette-demo-radio-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0.42rem 0.55rem;
		border: 1px solid rgba(71, 85, 105, 0.95);
		border-radius: 9px;
		background: rgba(15, 23, 42, 0.94);
		color: inherit;
		cursor: pointer;
		font: inherit;
	}

	.palette-demo-radio-item.is-selected {
		border-color: rgba(96, 165, 250, 0.95);
		box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.4) inset;
	}

	.palette-demo-stars-row {
		display: inline-flex;
		gap: 2px;
		align-items: center;
	}

	.palette-demo-radio-group.palette-demo-layout-vertical,
	.palette-demo-segmented.palette-demo-layout-vertical,
	.palette-demo-stepper.palette-demo-layout-vertical,
	.palette-demo-split.palette-demo-layout-vertical,
	.palette-demo-stars.palette-demo-layout-vertical,
	.palette-demo-stars-row.palette-demo-layout-vertical {
		flex-direction: column-reverse;
	}

	.palette-demo-arrow {
		padding: 0 1px;
		border: 0;
		background: transparent;
		color: #facc15;
		line-height: 1;
		font-size: 1rem;
	}

	.palette-demo-arrow.is-selected {
		color: #f59e0b;
	}

	.palette-demo-trigger {
		width: 2rem;
		height: 2rem;
		padding: 0;
		border-radius: 0 9px 9px 0;
		cursor: pointer;
		font-size: 0.82rem;
		line-height: 1;
	}

	.palette-demo-split.palette-demo-layout-vertical > .palette-demo-trigger {
		border-radius: 9px 9px 0 0;
	}

	.palette-demo-split > .palette-demo-tool,
	.palette-demo-split > .palette-demo-trigger {
		height: 2rem;
	}

	.palette-demo-split-button > .palette-demo-trigger {
		width: 1.72rem;
		font-size: 0.74rem;
	}

	.palette-demo-split-button > .palette-demo-tool {
		height: 2rem;
		padding-block: 0;
	}

	.palette-demo-split.palette-demo-layout-vertical > .palette-demo-tool,
	.palette-demo-split.palette-demo-layout-vertical > .palette-demo-trigger {
		width: 2.375rem;
		height: 2.375rem;
		padding: 0;
	}

	.palette-demo-split-radio.palette-demo-layout-vertical > .palette-demo-trigger {
		width: 2.3rem;
		font-size: 0.98rem;
	}

	.palette-demo-toolbar > * + * {
		margin-inline-start: -1px;
	}

	.palette-demo-toolbar.palette-vertical > * + *,
	.palette-demo-border.palette-vertical .palette-demo-toolbar > * + * {
		margin-inline-start: 0;
		margin-block-start: -1px;
	}

	.palette-demo-split > .palette-demo-tool,
	.palette-demo-split > .palette-demo-trigger,
	.palette-demo-segmented > .palette-demo-tool,
	.palette-demo-stepper > .palette-demo-tool,
	.palette-demo-stepper-value,
	.palette-demo-select > .palette-demo-icon,
	.palette-demo-select > select,
	.palette-demo-slider > .palette-demo-icon,
	.palette-demo-slider > input,
	.palette-demo-stars > .palette-demo-icon,
	.palette-demo-stars > .palette-demo-stars-row,
	.palette-demo-radio-group > .palette-demo-radio-item {
		margin-inline-start: -1px;
	}

	.palette-demo-split > :first-child,
	.palette-demo-segmented > :first-child,
	.palette-demo-stepper > :first-child,
	.palette-demo-select > :first-child,
	.palette-demo-slider > :first-child,
	.palette-demo-stars > :first-child,
	.palette-demo-radio-group > .palette-demo-radio-item:first-of-type {
		margin-inline-start: 0;
	}

	.palette-demo-split > :first-child,
	.palette-demo-stepper > :first-child,
	.palette-demo-select > :first-child,
	.palette-demo-slider > :first-child,
	.palette-demo-stars > :first-child {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	.palette-demo-split > :last-child,
	.palette-demo-stepper > :last-child,
	.palette-demo-select > :last-child,
	.palette-demo-slider > :last-child,
	.palette-demo-stars > :last-child {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	.palette-demo-stepper > :not(:first-child):not(:last-child),
	.palette-demo-select > :not(:first-child):not(:last-child),
	.palette-demo-slider > :not(:first-child):not(:last-child),
	.palette-demo-stars > :not(:first-child):not(:last-child) {
		border-radius: 0;
	}

	.palette-demo-segmented > :not(:first-child) {
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}

	.palette-demo-segmented > :not(:last-child) {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
	}

	.palette-demo-split.palette-demo-layout-vertical > .palette-demo-tool,
	.palette-demo-split.palette-demo-layout-vertical > .palette-demo-trigger,
	.palette-demo-segmented.palette-demo-layout-vertical > .palette-demo-tool,
	.palette-demo-stepper.palette-demo-layout-vertical > .palette-demo-tool,
	.palette-demo-stepper.palette-demo-layout-vertical > .palette-demo-stepper-value,
	.palette-demo-stars.palette-demo-layout-vertical > .palette-demo-icon,
	.palette-demo-stars.palette-demo-layout-vertical > .palette-demo-stars-row {
		margin-inline-start: 0;
		margin-block-start: -1px;
	}

	.palette-demo-split.palette-demo-layout-vertical > :first-child,
	.palette-demo-segmented.palette-demo-layout-vertical > :first-child,
	.palette-demo-stepper.palette-demo-layout-vertical > :first-child,
	.palette-demo-stars.palette-demo-layout-vertical > :first-child {
		margin-block-start: 0;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		border-bottom-right-radius: 9px;
	}

	.palette-demo-split.palette-demo-layout-vertical > :last-child,
	.palette-demo-stepper.palette-demo-layout-vertical > :last-child,
	.palette-demo-stars.palette-demo-layout-vertical > :last-child {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
		border-top-left-radius: 9px;
	}

	.palette-demo-stepper.palette-demo-layout-vertical > :not(:first-child):not(:last-child),
	.palette-demo-stars.palette-demo-layout-vertical > :not(:first-child):not(:last-child) {
		border-radius: 0;
	}

	.palette-demo-segmented.palette-demo-layout-vertical > :not(:first-child) {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	.palette-demo-segmented.palette-demo-layout-vertical > :not(:last-child) {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	.palette-demo-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		display: grid;
		gap: 4px;
		min-width: 8.8rem;
		padding: 6px;
		border-radius: 12px;
		border: 1px solid rgba(71, 85, 105, 0.9);
		background: rgba(2, 6, 23, 0.98);
		box-shadow: 0 16px 32px rgba(2, 6, 23, 0.35);
		z-index: 2;
	}

	.palette-demo-menu.palette-demo-region-bottom {
		top: auto;
		bottom: calc(100% + 6px);
	}

	.palette-demo-menu.palette-demo-region-left {
		top: 0;
		right: auto;
		left: calc(100% + 6px);
	}

	.palette-demo-menu.palette-demo-region-right {
		top: 0;
		right: calc(100% + 6px);
	}

	.palette-demo-menu[hidden] {
		display: none;
	}

	.palette-demo-menu-item {
		justify-content: flex-start;
	}

	.palette-demo-root.palette-demo-theme-light .palette-demo-border,
	.palette-demo-root.palette-demo-theme-light .palette-demo-hero,
	.palette-demo-root.palette-demo-theme-light .palette-demo-panel,
	.palette-demo-root.palette-demo-theme-light .palette-demo-state-row {
		border-color: rgba(148, 163, 184, 0.8);
		background: rgba(255, 255, 255, 0.78);
		color: #0f172a;
	}

	.palette-demo-root.palette-demo-theme-light .palette-demo-tool,
	.palette-demo-root.palette-demo-theme-light .palette-demo-trigger,
	.palette-demo-root.palette-demo-theme-light .palette-demo-menu-item,
	.palette-demo-root.palette-demo-theme-light .palette-demo-select,
	.palette-demo-root.palette-demo-theme-light .palette-demo-radio-group,
	.palette-demo-root.palette-demo-theme-light .palette-demo-radio-item,
	.palette-demo-root.palette-demo-theme-light .palette-demo-slider,
	.palette-demo-root.palette-demo-theme-light .palette-demo-stepper,
	.palette-demo-root.palette-demo-theme-light .palette-demo-stars,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-panel,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-shell,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-chip,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-suggestion,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-result,
	.palette-demo-root.palette-demo-theme-light .palette-demo-select select,
	.palette-demo-root.palette-demo-theme-light .palette-demo-root code,
	.palette-demo-root.palette-demo-theme-light .palette-demo-menu,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-popover {
		border-color: rgba(148, 163, 184, 0.9);
		background: rgba(241, 245, 249, 0.96);
		color: #0f172a;
	}

	.palette-demo-root.palette-demo-theme-light .palette-demo-tool.is-selected,
	.palette-demo-root.palette-demo-theme-light .palette-demo-menu-item.is-selected,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-result.is-selected,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-result:hover:not(:disabled),
	.palette-demo-root.palette-demo-theme-light .palette-demo-radio-item.is-selected {
		border-color: #60a5fa;
		background: #1d4ed8;
		color: #eff6ff;
	}

	.palette-demo-root.palette-demo-theme-light .palette-demo-hero-copy span,
	.palette-demo-root.palette-demo-theme-light .palette-demo-panel-title,
	.palette-demo-root.palette-demo-theme-light .palette-demo-state-key,
	.palette-demo-root.palette-demo-theme-light .palette-demo-radio-label,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-result-meta,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-empty,
	.palette-demo-root.palette-demo-theme-light .palette-demo-command-input::placeholder {
		color: #475569;
	}

	.palette-demo-root.palette-demo-theme-light .palette-demo-strip {
		border-color: rgba(148, 163, 184, 0.9);
		background: rgba(226, 232, 240, 0.85);
	}
`
