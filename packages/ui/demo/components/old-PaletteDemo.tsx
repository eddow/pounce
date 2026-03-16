import type { SursautElement } from '@sursaut/core'
import { componentStyle } from '@sursaut/kit'
import {
	activatePaletteToolbarDropTarget,
	clearPaletteToolbarDropTarget,
	computeCheckedState,
	computeDisabledState,
	createPaletteModel,
	formatKeystroke,
	getDefaultDisplayPresenter,
	handlePaletteCommandBoxInputKeydown,
	handlePaletteCommandChipKeydown,
	isVerticalPaletteRegion,
	measurePaletteToolbarDropTargets,
	type PaletteContainerRegion,
	type PaletteDisplayItem,
	type PaletteDisplayPresenterFamily,
	type PaletteEditorDisplayItem,
	type PaletteEntryDefinition,
	type PaletteIntentDisplayItem,
	type PaletteKeyBinding,
	type PaletteMatch,
	type PaletteResolvedDisplayItem,
	type PaletteResolvedEntry,
	type PaletteResolvedIntent,
	type PaletteToolbar,
	type PaletteToolbarDropTarget,
	paletteCommandBoxModel,
	paletteContainerModel,
	paletteRegionAxis,
	resolvePaletteToolbarDropTarget,
	samePaletteToolbarDropTarget,
	setPaletteCommandBoxInput,
} from '@sursaut/ui/palette'
import { reactive, reactiveOptions } from 'mutts'
import {
	type LocalDragAxis,
	type LocalDragPoint,
	startLocalDragSession,
} from '../../src/directives'
import { drag, dragging, drop } from '../../src/directives/drag-drop'
import { type StarStatus, starsModel } from '../../src/models/stars'

type DemoResolvedDisplayItem = Extract<PaletteResolvedDisplayItem, { kind: 'intent' }>

type DemoPresenterProps = {
	readonly displayItem: PaletteIntentDisplayItem
	readonly resolved: DemoResolvedDisplayItem
	readonly checked: boolean
	readonly disabled: boolean
	readonly onActivate: () => void
}

type DemoPresenter = (props: DemoPresenterProps) => SursautElement

type DemoPresenterCatalog = {
	readonly action: Readonly<Record<string, DemoPresenter>>
	readonly boolean: Readonly<Record<string, DemoPresenter>>
	readonly enum: Readonly<Record<string, DemoPresenter>>
	readonly number: Readonly<Record<string, DemoPresenter>>
	readonly status: Readonly<Record<string, DemoPresenter>>
}

type DemoEditorRendererProps = {
	readonly displayItem: PaletteEditorDisplayItem
	readonly entry: PaletteEntryDefinition
	readonly toolbar: PaletteToolbar
	readonly selected: boolean
	readonly label: string
}

type DemoToolbarPath = {
	readonly region: PaletteContainerRegion
	readonly track: number
	readonly index: number
}

type DemoEditorRenderer = (props: DemoEditorRendererProps) => SursautElement | undefined

type DemoUiState = {
	draggingToolbar: DemoToolbarPath | undefined
	draggingToolbarGrabOffset: number | undefined
	draggingToolbarSpan: number | undefined
}

type DemoWarningState = {
	messages: string[]
}

type DemoToolbarPreset = {
	readonly id: string
	readonly label: string
	readonly toolbar: PaletteToolbar
}

type DemoSettings = {
	'ui.notifications': boolean
	'ui.theme': 'light' | 'dark' | 'system'
	'ui.layout': 'horizontal' | 'vertical' | 'auto'
	'editor.fontSize': number
	'game.speed': number
}

const DEMO_BINDINGS = [
	{ kind: 'intent', intentId: 'ui.layout:flip', keystroke: 'Alt+L' },
	{ kind: 'intent', intentId: 'game.speed:stash:0', keystroke: 'Space' },
	{ kind: 'entry', entryId: 'ui.theme', keystroke: 'Ctrl+T' },
	{ kind: 'entry', entryId: 'game.speed', keystroke: 'G' },
] satisfies readonly PaletteKeyBinding[]

const PARKING_PRESETS: readonly DemoToolbarPreset[] = [
	{
		id: 'preset:inspect',
		label: 'Inspect',
		toolbar: {
			title: 'Inspect',
			items: [
				{
					kind: 'intent',
					intentId: 'ui.notifications:toggle',
					presenter: 'toggle',
					showText: false,
				},
				{ kind: 'editor', entryId: 'ui.theme', presenter: 'select', showText: false },
			],
		},
	},
	{
		id: 'preset:theme',
		label: 'Theme',
		toolbar: {
			title: 'Theme',
			items: [
				{
					kind: 'editor',
					entryId: 'ui.theme',
					selector: ['light', 'dark'],
					presenter: 'radio-group',
					showText: false,
				},
				{ kind: 'intent', intentId: 'ui.theme:set:system', presenter: 'radio', showText: false },
			],
		},
	},
	{
		id: 'preset:playback',
		label: 'Playback',
		toolbar: {
			title: 'Playback',
			items: [
				{ kind: 'intent', intentId: 'game.speed:step:down', presenter: 'step', showText: true },
				{ kind: 'editor', entryId: 'game.speed', presenter: 'stars', showText: true },
				{ kind: 'intent', intentId: 'game.speed:step:up', presenter: 'step', showText: true },
			],
		},
	},
]

const demoSettings = reactive<DemoSettings>({
	'ui.notifications': true,
	'ui.theme': 'light',
	'ui.layout': 'horizontal',
	'editor.fontSize': 14,
	'game.speed': 1,
})

const palette = createPaletteModel({
	definitions: [
		{
			id: 'ui.notifications',
			label: 'Notifications',
			description: 'Show desktop notifications',
			schema: {
				type: 'boolean',
				get: () => demoSettings['ui.notifications'],
				set: (_, value: boolean) => {
					demoSettings['ui.notifications'] = value
				},
			},
		},
		{
			id: 'ui.theme',
			label: 'Theme',
			description: 'Application theme',
			schema: {
				type: 'enum',
				get: () => demoSettings['ui.theme'],
				set: (_, value: string) => {
					if (value === 'light' || value === 'dark' || value === 'system') {
						demoSettings['ui.theme'] = value
					}
				},
				options: [
					{ id: 'light', label: 'Light', icon: '☀️' },
					{ id: 'dark', label: 'Dark', icon: '🌙' },
					{ id: 'system', label: 'System', icon: '💻' },
				],
			},
		},
		{
			id: 'ui.layout',
			label: 'Layout',
			description: 'Toolbar layout',
			schema: {
				type: 'enum',
				get: () => demoSettings['ui.layout'],
				set: (_, value: string) => {
					if (value === 'horizontal' || value === 'vertical' || value === 'auto') {
						demoSettings['ui.layout'] = value
					}
				},
				options: ['horizontal', 'vertical', 'auto'],
			},
		},
		{
			id: 'editor.fontSize',
			label: 'Font Size',
			description: 'Editor font size',
			schema: {
				type: 'number',
				get: () => demoSettings['editor.fontSize'],
				set: (_, value: number) => {
					demoSettings['editor.fontSize'] = value
				},
				min: 10,
				max: 20,
				step: 1,
			},
		},
		{
			id: 'game.speed',
			label: 'Game Speed',
			description: 'Simulation speed',
			schema: {
				type: 'number',
				get: () => demoSettings['game.speed'],
				set: (_, value: number) => {
					demoSettings['game.speed'] = value
				},
				min: 1,
				max: 5,
				step: 1,
			},
		},
	],
	intents: [
		{
			id: 'ui.layout:flip',
			targetId: 'ui.layout',
			mode: 'flip',
			values: ['horizontal', 'vertical'],
			label: 'Flip Layout',
		},
		{
			id: 'game.speed:stash:0',
			targetId: 'game.speed',
			mode: 'stash',
			value: 0,
			label: 'Pause / Resume',
			fallback: { kind: 'step', step: 0.5 },
		},
	],
	bindings: DEMO_BINDINGS,
	display: {
		container: {
			editMode: false,
			toolbarStack: {
				top: [
					[
						{
							toolbar: {
								title: 'Main Toolbar',
								items: [
									{
										kind: 'intent',
										intentId: 'ui.notifications:toggle',
										presenter: 'toggle',
										showText: false,
									},
									//{ kind: 'intent', intentId: 'ui.theme:set:light', presenter: 'radio', showText: false },
								],
							},
							space: 0.3,
						},
						{
							toolbar: {
								title: 'Secondary Toolbar',
								items: [
									{
										kind: 'intent',
										intentId: 'ui.theme:set:dark',
										presenter: 'radio',
										showText: false,
									},
									{
										kind: 'intent',
										intentId: 'ui.layout:flip',
										presenter: 'flip',
										showText: false,
									},
								],
							},
							space: 0.3,
						},
					],
				],
				right: [
					[
						{
							toolbar: {
								title: 'Editor Rail',
								items: [
									{
										kind: 'editor',
										entryId: 'editor.fontSize',
										presenter: 'slider',
										showText: true,
									},
									{
										kind: 'intent',
										intentId: 'editor.fontSize:step:down',
										presenter: 'step',
										showText: true,
									},
									{
										kind: 'intent',
										intentId: 'editor.fontSize:step:up',
										presenter: 'step',
										showText: true,
									},
								],
							},
							space: 0,
						},
					],
				],
				bottom: [
					[
						{
							toolbar: {
								title: 'Playback Bar',
								items: [
									{
										kind: 'intent',
										intentId: 'game.speed:step:down',
										presenter: 'step',
										showText: true,
									},
									{ kind: 'editor', entryId: 'game.speed', presenter: 'stars', showText: true },
									{
										kind: 'intent',
										intentId: 'game.speed:step:up',
										presenter: 'step',
										showText: true,
									},
									{
										kind: 'intent',
										intentId: 'game.speed:stash:0',
										presenter: 'stash',
										showText: true,
									},
								],
							},
							space: 0,
						},
					],
				],
				left: [
					[
						{
							toolbar: {
								title: 'Theme Rail',
								items: [
									{
										kind: 'editor',
										entryId: 'ui.theme',
										selector: ['light', 'dark'],
										presenter: 'radio-group',
										showText: false,
									},
									{ kind: 'editor', entryId: 'ui.theme', presenter: 'select', showText: false },
									{
										kind: 'intent',
										intentId: 'ui.theme:set:system',
										presenter: 'radio',
										showText: false,
									},
									{
										kind: 'intent',
										intentId: 'editor.fontSize:step:up',
										presenter: 'step',
										showText: false,
									},
								],
							},
							space: 0,
						},
					],
				],
			},
		},
	},
})

const commandBox = paletteCommandBoxModel({
	palette,
	placeholder: 'Search commands and settings, or type categories like ui action…',
})
const container = paletteContainerModel({ palette })
const demoUi: DemoUiState = reactive({
	draggingToolbar: undefined,
	draggingToolbarGrabOffset: undefined,
	draggingToolbarSpan: undefined,
})
const demoRuntime = globalThis as typeof globalThis & {
	__paletteDemoWarnings__?: DemoWarningState
	__paletteDemoWarningsInstalled__?: boolean
	__paletteDemoWarningsOriginalWarn__?: (...args: any[]) => void
}
const warningState =
	demoRuntime.__paletteDemoWarnings__ ??
	(demoRuntime.__paletteDemoWarnings__ = reactive({
		messages: [],
	}))
if (!demoRuntime.__paletteDemoWarningsInstalled__) {
	demoRuntime.__paletteDemoWarningsInstalled__ = true
	demoRuntime.__paletteDemoWarningsOriginalWarn__ = reactiveOptions.warn
	reactiveOptions.warn = (...args: any[]) => {
		if (typeof args[0] === 'string' && args[0].startsWith('[sursaut] Rebuild fence:')) {
			warningState.messages.unshift(args[0])
			if (warningState.messages.length > 5) warningState.messages.splice(5)
		}
		demoRuntime.__paletteDemoWarningsOriginalWarn__?.(...args)
	}
	//reactiveOptions.introspection!.gatherReasons.lineages = 'both'
}
const speedStars = starsModel({
	get value() {
		const value = demoSettings['game.speed']
		return typeof value === 'number' && value >= 1 ? value : 0
	},
	set value(value) {
		if (typeof value === 'number' && value >= 1 && value <= 5) {
			demoSettings['game.speed'] = value
		}
	},
	maximum: 5,
	before: 'star-filled',
	after: 'star-outline',
})

const FAMILY_ORDER: readonly PaletteDisplayPresenterFamily[] = [
	'action',
	'boolean',
	'enum',
	'number',
	'status',
]
const DEMO_EDITOR_DEFAULTS: Readonly<Partial<Record<string, string>>> = {
	'game.speed': 'stars',
}
const DEMO_EDITOR_FAMILY_DEFAULTS: Readonly<Record<PaletteDisplayPresenterFamily, string>> = {
	action: 'default',
	boolean: 'default',
	enum: 'select',
	number: 'slider',
	status: 'default',
}
const REGION_LAYOUT = {
	top: 'grid-column: 1 / 4; min-width: 0; min-height: 0;',
	left: 'grid-column: 1; grid-row: 2; align-self: stretch; height: 100%; min-width: 220px; max-width: 260px; min-height: 0;',
	right:
		'grid-column: 3; grid-row: 2; align-self: stretch; height: 100%; min-width: 240px; max-width: 300px; min-height: 0;',
	bottom: 'grid-column: 1 / 4; grid-row: 3; min-width: 0; min-height: 0;',
} satisfies Record<PaletteContainerRegion, string>
const REGION_ORDER: readonly PaletteContainerRegion[] = ['top', 'left', 'right', 'bottom']

function isIntentDisplayItem(
	displayItem: PaletteDisplayItem
): displayItem is PaletteIntentDisplayItem {
	return displayItem.kind === 'intent'
}

function isEditorDisplayItem(
	displayItem: PaletteDisplayItem
): displayItem is PaletteEditorDisplayItem {
	return displayItem.kind === 'editor'
}

function isIntentResolvedDisplayItem(
	resolved: PaletteResolvedDisplayItem | undefined
): resolved is DemoResolvedDisplayItem {
	return resolved?.kind === 'intent'
}

const SURFACE_COLOR = '#38bdf8'
const TOOLBAR_COLOR = '#f59e0b'
const DROP_ZONE_COLOR = '#22d3ee'

function isVerticalRegion(region: PaletteContainerRegion) {
	return isVerticalPaletteRegion(region)
}

function regionSpaceStyle(space: number) {
	const basis = `${Math.max(space, 0) * 100}%`
	return `display: flex; flex: ${Math.max(space, 0.0001)} 1 0; flex-basis: ${basis}; min-width: 0; min-height: 0; align-items: stretch; justify-content: stretch;`
}

function actualRegionSpaceAt(
	toolbarCount: number,
	index: number,
	slots: readonly { space: number }[]
) {
	let remaining = 1
	for (let cursor = 0; cursor < toolbarCount; cursor++) {
		const leading = Math.min(1, Math.max(0, slots[cursor]?.space ?? 0))
		const actualSpace = remaining * leading
		if (cursor === index) return actualSpace
		remaining -= actualSpace
	}
	return index === toolbarCount ? Math.max(remaining, 0) : 0
}

function regionSplitFromEvent(
	region: PaletteContainerRegion,
	event: DragEvent,
	element: HTMLElement
) {
	const rect = element.getBoundingClientRect()
	if (isVerticalRegion(region)) {
		if (rect.height <= 0) return 0.5
		return Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
	}
	if (rect.width <= 0) return 0.5
	return Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
}

function toolbarMoveAxis(region: PaletteContainerRegion): LocalDragAxis {
	return paletteRegionAxis(region)
}

function toolbarDropTargets() {
	return measurePaletteToolbarDropTargets({
		spaceElements: document.querySelectorAll<HTMLElement>('[data-role="region-space"]'),
		parkElements: document.querySelectorAll<HTMLElement>('[data-role="central-shell"]'),
	})
}

function resolveToolbarDropTarget(point: LocalDragPoint): PaletteToolbarDropTarget | undefined {
	return resolvePaletteToolbarDropTarget(toolbarDropTargets(), point)
}

function sameToolbarDropTarget(
	left: PaletteToolbarDropTarget | undefined,
	right: PaletteToolbarDropTarget | undefined
) {
	return samePaletteToolbarDropTarget(left, right)
}

function activateToolbarDropTarget(target: PaletteToolbarDropTarget | undefined) {
	activatePaletteToolbarDropTarget(target)
}

function clearToolbarDropTarget(target: PaletteToolbarDropTarget | undefined) {
	clearPaletteToolbarDropTarget(target)
}

function shouldIgnoreToolbarMoveTarget(target: EventTarget | null): boolean {
	const element =
		target instanceof HTMLElement
			? target
			: target instanceof Node
				? target.parentElement
				: undefined
	if (!element) return false
	return !!element.closest(
		'[data-role="toolbar-item-drag-wrapper"], [data-role="toolbar-resize-handle"]'
	)
}

function labelFor(resolved: DemoResolvedDisplayItem) {
	return resolved.intent.label ?? resolved.entry.label
}

function iconFor(resolved: DemoResolvedDisplayItem) {
	return typeof resolved.entry.icon === 'string' ? `${resolved.entry.icon} ` : ''
}

function IntentIcon(props: { resolved: DemoResolvedDisplayItem }) {
	const computed = {
		get value() {
			return iconFor(props.resolved)
		},
	}
	return <span if={computed.value}>{computed.value}</span>
}

function editorTooltip(entry: PaletteEntryDefinition): string | undefined {
	const label = entry.label
	const shortcut = formatKeystroke(palette.keys.getEntryKeystroke(entry.id))
	return shortcut ? `${label} (${shortcut})` : label
}

function intentTooltip(props: { resolved: DemoResolvedDisplayItem }): string | undefined {
	const label = labelFor(props.resolved)
	const shortcut = formatKeystroke(palette.keys.getIntentKeystroke(props.resolved.intent.id))
	return shortcut ? `${label} (${shortcut})` : label
}

function buttonMarkup(props: DemoPresenterProps, marker = ''): SursautElement {
	return (
		<button
			class="palette-intent-button"
			data-active={props.checked ? 'true' : undefined}
			data-disabled={props.disabled ? 'true' : undefined}
			data-test={props.resolved.intent.id}
			disabled={props.disabled}
			onClick={props.onActivate}
			title={intentTooltip({ resolved: props.resolved })}
		>
			<span if={marker}>{marker} </span>
			<IntentIcon resolved={props.resolved} />
		</button>
	)
}

const DEMO_PRESENTERS: DemoPresenterCatalog = {
	action: {
		button: (props) => buttonMarkup(props, '▶️'),
	},
	boolean: {
		toggle: (props) => buttonMarkup(props, props.checked ? '✅' : '⭕'),
	},
	enum: {
		radio: (props) => {
			// Add theme icons for radio buttons
			const getThemeIcon = (intentId: string) => {
				if (intentId.includes('light')) return '☀️'
				if (intentId.includes('dark')) return '🌙'
				if (intentId.includes('system')) return '💻'
				return '⚙️'
			}
			const icon = getThemeIcon(props.displayItem.intentId)
			return buttonMarkup(props, props.checked ? `🔘${icon}` : `⭕${icon}`)
		},
		flip: (props) => buttonMarkup(props, '🔄'),
		button: (props) => buttonMarkup(props, '⚡'),
		'radio-group': (props) => buttonMarkup(props, '🎛️'),
		segmented: (props) => buttonMarkup(props, '📊'),
	},
	number: {
		step: (props) => buttonMarkup(props, props.displayItem.intentId.includes('up') ? '⬆️' : '⬇️'),
		stash: (props) => buttonMarkup(props, props.checked ? '💾' : '📁'),
		button: (props) => buttonMarkup(props, '🔢'),
	},
	status: {
		default: (props) => buttonMarkup(props, 'ℹ️'),
	},
}

function toolbarPathId(path: DemoToolbarPath) {
	return `${path.region}:${path.track}:${path.index}`
}

function demoToolbar(path: DemoToolbarPath) {
	const toolbar = container.toolbarStack[path.region][path.track]?.[path.index]?.toolbar
	if (!toolbar) {
		throw new Error(`Toolbar '${toolbarPathId(path)}' not found`)
	}
	return toolbar
}

function toolbarPath(toolbar: PaletteToolbar): DemoToolbarPath | undefined {
	for (const region of REGION_ORDER) {
		for (let track = 0; track < container.toolbarStack[region].length; track += 1) {
			const index = container.toolbarStack[region][track].findIndex(
				(entry) => entry.toolbar === toolbar
			)
			if (index >= 0) {
				return { region, track, index }
			}
		}
	}
	return undefined
}

function requireToolbarPath(toolbar: PaletteToolbar): DemoToolbarPath {
	const path = toolbarPath(toolbar)
	if (!path) {
		throw new Error('Toolbar not found')
	}
	return path
}

function sameToolbarPath(left: DemoToolbarPath | undefined, right: DemoToolbarPath | undefined) {
	return (
		left?.region === right?.region && left?.track === right?.track && left?.index === right?.index
	)
}

function resolvePresenter(
	displayItem: PaletteIntentDisplayItem,
	resolved: DemoResolvedDisplayItem
): DemoPresenter {
	const family: PaletteDisplayPresenterFamily = resolved.entry.schema.type
	const fallbackKey = getDefaultDisplayPresenter(resolved.intent, resolved.entry)
	const presenterKey = displayItem.presenter ?? fallbackKey
	const presenter = DEMO_PRESENTERS[family][presenterKey] ?? DEMO_PRESENTERS[family][fallbackKey]
	if (!presenter) {
		throw new Error(`Presenter '${presenterKey}' not found in '${family}' presenter dictionary`)
	}
	return presenter
}

function PresenterNamesText(props: { family: PaletteDisplayPresenterFamily }) {
	return <>{Object.keys(DEMO_PRESENTERS[props.family]).join(', ')}</>
}

function defaultEditorPresenter(entry: PaletteEntryDefinition) {
	const configured = DEMO_EDITOR_DEFAULTS[entry.id]
	if (configured) return configured
	return DEMO_EDITOR_FAMILY_DEFAULTS[entry.schema.type]
}

function shortcutIntent(event: KeyboardEvent) {
	return palette.keys.resolve(event).find((binding) => binding.kind === 'intent')
}

function isEditableTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false
	if (target.isContentEditable) return true
	if (target instanceof HTMLInputElement) return true
	if (target instanceof HTMLTextAreaElement) return true
	if (target instanceof HTMLSelectElement) return true
	return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function focusEditorShortcut(entryId: string) {
	const root = document.querySelector<HTMLElement>('[data-test="palette-demo"]')
	if (!root) return false
	const candidate = root.querySelector<HTMLElement>(`[data-palette-entry-id="${entryId}"]`)
	if (!candidate) return false
	candidate.focus()
	return true
}

function handleDemoShortcut(event: KeyboardEvent) {
	// Handle backtick for edit mode toggle
	if (event.key === '`') {
		event.preventDefault()
		toggleEditMode()
		return
	}

	if (container.editMode || isEditableTarget(event.target)) return
	const intentBinding = shortcutIntent(event)
	if (intentBinding?.kind === 'intent') {
		event.preventDefault()
		palette.run(intentBinding.intentId)
		return
	}
	const entryBinding = palette.keys.resolve(event).find((binding) => binding.kind === 'entry')
	if (!entryBinding || entryBinding.kind !== 'entry') return
	if (focusEditorShortcut(entryBinding.entryId)) {
		event.preventDefault()
	}
}

function bindDemoShortcuts(_root: HTMLElement) {
	const onKeydown = (event: KeyboardEvent) => handleDemoShortcut(event)
	document.addEventListener('keydown', onKeydown)
	return () => document.removeEventListener('keydown', onKeydown)
}

const DEMO_EDITOR_RENDERERS: Readonly<Record<string, DemoEditorRenderer>> = {
	select: ({ entry, selected, label }) => {
		if (entry.schema.type !== 'enum') return undefined
		const schema: Extract<PaletteEntryDefinition['schema'], { type: 'enum' }> = entry.schema
		const options = entry.schema.options.map((option) =>
			typeof option === 'string' ? { id: option, label: option } : option
		)
		void label
		return (
			<label
				class="palette-editor-shell palette-editor-shell-compact"
				data-selected={selected ? 'true' : undefined}
				title={editorTooltip(entry)}
			>
				<select
					class="palette-editor-select"
					data-palette-entry-id={entry.id}
					value={String(schema.get(palette) ?? '')}
					disabled={container.editMode}
					update:value={(value: string) => {
						schema.set(palette, value)
					}}
				>
					<for each={options}>
						{(option) => (
							<option value={String(option.id)}>{option.label ?? String(option.id)}</option>
						)}
					</for>
				</select>
			</label>
		)
	},
	stars: ({ entry, selected, label }) => {
		if (entry.schema.type !== 'number') return undefined
		void label
		return (
			<div
				class="palette-editor-shell palette-editor-shell-compact"
				data-selected={selected ? 'true' : undefined}
				data-palette-entry-id={entry.id}
				tabIndex={-1}
				title={editorTooltip(entry)}
			>
				<span class="palette-inline-stars" {...speedStars.container}>
					<for each={speedStars.starItems}>
						{(item) => (
							<span data-test={`palette-inline-speed-star-${item.index + 1}`} {...item.el}>
								<StarGlyphText status={item.status} />
							</span>
						)}
					</for>
				</span>
			</div>
		)
	},
	slider: ({ entry, selected, label }) => {
		if (entry.schema.type !== 'number') return undefined
		const schema: Extract<PaletteEntryDefinition['schema'], { type: 'number' }> = entry.schema
		const min = schema.min ?? 0
		const max = schema.max ?? 100
		const step = schema.step ?? 1
		void label
		return (
			<label
				class="palette-editor-shell palette-editor-shell-compact"
				data-selected={selected ? 'true' : undefined}
				title={editorTooltip(entry)}
			>
				<input
					class="palette-editor-slider"
					data-palette-entry-id={entry.id}
					type="range"
					min={String(min)}
					max={String(max)}
					step={String(step)}
					value={String(schema.get(palette) ?? min)}
					disabled={container.editMode}
					onInput={(event) => {
						if (event.currentTarget instanceof HTMLInputElement) {
							schema.set(palette, Number(event.currentTarget.value))
						}
					}}
				/>
			</label>
		)
	},
	default: ({ selected, label, displayItem }) => (
		<button
			class="palette-editor-button"
			data-selected={selected ? 'true' : undefined}
			type="button"
			data-palette-entry-id={displayItem.entryId}
		>
			{label}
		</button>
	),
}

function EditorItem(props: { displayItem: PaletteEditorDisplayItem; toolbar: PaletteToolbar }) {
	// TODO: refactor a bit, it seems quite over-complicated
	const computed = {
		get resolved() {
			return palette.resolveDisplayItem(props.displayItem)
		},
		get entry() {
			return computed.resolved?.kind === 'editor' ? computed.resolved.entry : undefined
		},
		get currentPath() {
			return requireToolbarPath(props.toolbar)
		},
		get selected() {
			return false
		},
		get label() {
			return computed.entry?.label
		},
		get shortcut() {
			return computed.entry
				? formatKeystroke(palette.keys.getEntryKeystroke(computed.entry.id))
				: undefined
		},
		get renderer() {
			return computed.entry
				? (DEMO_EDITOR_RENDERERS[
						props.displayItem.presenter ?? defaultEditorPresenter(computed.entry)
					] ?? DEMO_EDITOR_RENDERERS.default)
				: undefined
		},
		get content() {
			if (!computed.entry || !computed.renderer || !computed.label) return undefined
			const label = computed.shortcut ? `${computed.label} (${computed.shortcut})` : computed.label
			return (
				computed.renderer({
					displayItem: props.displayItem,
					entry: computed.entry,
					toolbar: props.toolbar,
					selected: computed.selected,
					label,
				}) ??
				DEMO_EDITOR_RENDERERS.default({
					displayItem: props.displayItem,
					entry: computed.entry,
					toolbar: props.toolbar,
					selected: computed.selected,
					label,
				})
			)
		},
	}
	return <fragment if={computed.entry}>{computed.content}</fragment>
}

function starGlyph(status: StarStatus) {
	return status === 'after' || status === 'zero' ? '▷' : '▶'
}

function StarGlyphText(props: { status: StarStatus }) {
	return <>{starGlyph(props.status)}</>
}

function isDemoDisabled(displayItem: PaletteIntentDisplayItem, resolved: DemoResolvedDisplayItem) {
	if (resolved.intent.mode === 'stash' && palette.runtime[resolved.intent.id] !== undefined) {
		return false
	}
	return computeDisabledState(displayItem, resolved.intent, resolved.entry, palette)
}

function commandLabel(match: PaletteMatch) {
	if (match.kind === 'intent') {
		const intentMatch = match as PaletteResolvedIntent
		return intentMatch.intent.label ?? intentMatch.entry.label
	} else if (match.kind === 'grouped-proposition') {
		return match.label
	} else {
		const entryMatch = match as PaletteResolvedEntry
		return entryMatch.entry.label
	}
}

function commandMeta(match: PaletteMatch) {
	if (match.kind === 'intent') {
		const shortcut = palette.keys.getIntentKeystroke(match.intent.id)
		return `${match.intent.mode} • ${match.intent.id}${shortcut ? ` • ${formatKeystroke(shortcut)}` : ''}`
	} else if (match.kind === 'grouped-proposition') {
		return `${match.type} • ${match.intents.length} intents${match.description ? ` • ${match.description}` : ''}`
	} else {
		const shortcut = palette.keys.getEntryKeystroke(match.entry.id)
		return `entry • ${match.entry.id}${shortcut ? ` • ${formatKeystroke(shortcut)}` : ''}`
	}
}

function commandKey(match: PaletteMatch) {
	if (match.kind === 'intent') return `intent:${match.intent.id}`
	if (match.kind === 'grouped-proposition') {
		return `group:${match.type}:${match.entries.map((entry) => entry.entry.id).join('|')}:${match.intents
			.map((intent) => intent.intent.id)
			.join('|')}`
	}
	return `entry:${match.entry.id}`
}

function runMatch(match: PaletteMatch) {
	if (match.kind === 'intent') {
		commandBox.execute(match.intent.id)
		return
	} else if (match.kind === 'grouped-proposition') {
		// For grouped propositions, execute the first intent for now
		// TODO: Handle grouped proposition execution properly
		if (match.intents.length > 0) {
			commandBox.execute(match.intents[0].intent.id)
		}
		return
	}
	commandBox.input.value = match.entry.label
}

function startToolbarDrag(toolbar: PaletteToolbar, grabOffset: number, span: number) {
	demoUi.draggingToolbar = requireToolbarPath(toolbar)
	demoUi.draggingToolbarGrabOffset = grabOffset
	demoUi.draggingToolbarSpan = span
}

function stopToolbarDrag() {
	demoUi.draggingToolbar = undefined
	demoUi.draggingToolbarGrabOffset = undefined
	demoUi.draggingToolbarSpan = undefined
}

function regionSpaceElement(region: PaletteContainerRegion, index: number) {
	return document.querySelector<HTMLElement>(
		`[data-role="region-space"][data-region="${region}"][data-index="${index}"]`
	)
}

function resizeToolbarFromPointer(
	path: DemoToolbarPath,
	clientX: number,
	clientY: number,
	grabOffset: number,
	toolbarSpan: number
) {
	const beforeSpace = regionSpaceElement(path.region, path.index)
	const afterSpace = regionSpaceElement(path.region, path.index + 1)
	if (!beforeSpace || !afterSpace) return
	if (isVerticalRegion(path.region)) {
		const start = beforeSpace.getBoundingClientRect().top
		const end = afterSpace.getBoundingClientRect().bottom
		if (end <= start) return
		const available = end - start - toolbarSpan
		if (available <= 0) return
		const toolbarStart = Math.min(Math.max(clientY - grabOffset, start), end - toolbarSpan)
		container.resizeToolbar(
			path.region,
			path.track,
			path.index,
			Math.min(1, Math.max(0, (toolbarStart - start) / available))
		)
		return
	}
	const start = beforeSpace.getBoundingClientRect().left
	const end = afterSpace.getBoundingClientRect().right
	if (end <= start) return
	const available = end - start - toolbarSpan
	if (available <= 0) return
	const toolbarStart = Math.min(Math.max(clientX - grabOffset, start), end - toolbarSpan)
	container.resizeToolbar(
		path.region,
		path.track,
		path.index,
		Math.min(1, Math.max(0, (toolbarStart - start) / available))
	)
}

function beginToolbarMove(toolbar: PaletteToolbar, event: MouseEvent) {
	if (!container.editMode) return
	if (isEditableTarget(event.target)) return
	if (shouldIgnoreToolbarMoveTarget(event.target)) return
	event.preventDefault()
	event.stopPropagation()
	const handle = event.currentTarget as HTMLElement | null
	const toolbarElement = handle?.closest<HTMLElement>('[data-role="toolbar"]')
	if (!toolbarElement) return
	let path = requireToolbarPath(toolbar)
	const axis = toolbarMoveAxis(path.region)
	const toolbarRect = toolbarElement.getBoundingClientRect()
	const grabOffset =
		axis === 'vertical' ? event.clientY - toolbarRect.top : event.clientX - toolbarRect.left
	const span = axis === 'vertical' ? toolbarRect.height : toolbarRect.width
	let activeTarget: PaletteToolbarDropTarget | undefined
	let mode: 'resize' | 'move' = 'resize'
	let lastCommittedSpaceKey: string | undefined
	const syncTarget = (
		point: LocalDragPoint,
		resolver: (point: LocalDragPoint) => PaletteToolbarDropTarget | undefined
	): PaletteToolbarDropTarget | undefined => {
		const nextTarget = resolver(point)
		if (!sameToolbarDropTarget(activeTarget, nextTarget)) {
			clearToolbarDropTarget(activeTarget)
			activateToolbarDropTarget(nextTarget)
			activeTarget = nextTarget
		}
		return activeTarget
	}
	startLocalDragSession({
		event,
		axis,
		grabOffset,
		onMove(snapshot) {
			const target = syncTarget(snapshot.current, resolveToolbarDropTarget)
			if (target?.kind === 'park') {
				if (mode !== 'move') {
					mode = 'move'
					startToolbarDrag(toolbar, grabOffset, span)
				}
				lastCommittedSpaceKey = undefined
				return
			}
			if (mode === 'move') {
				stopToolbarDrag()
				mode = 'resize'
			}
			if (target?.kind === 'space') {
				const key = `${target.region}:${target.track}:${target.index}`
				if (lastCommittedSpaceKey !== key) {
					placeSpecificToolbar(toolbar, target.region, target.track, target.index, target.split)
					path = requireToolbarPath(toolbar)
					lastCommittedSpaceKey = key
				}
				resizeToolbarFromPointer(path, snapshot.current.x, snapshot.current.y, grabOffset, span)
				return
			}
			lastCommittedSpaceKey = undefined
			resizeToolbarFromPointer(path, snapshot.current.x, snapshot.current.y, grabOffset, span)
		},
		onStop(snapshot) {
			const target =
				mode === 'move' ? syncTarget(snapshot.current, resolveToolbarDropTarget) : undefined
			clearToolbarDropTarget(activeTarget)
			activeTarget = undefined
			if (snapshot.reason === 'up' || snapshot.reason === 'buttons') {
				if (target?.kind === 'park') {
					container.parkToolbar(toolbar)
				}
			}
			stopToolbarDrag()
		},
	})
}

function removeDemoToolbar(toolbar: PaletteToolbar) {
	container.removeToolbar(toolbar)
}

function cloneDisplayItem(item: PaletteDisplayItem): PaletteDisplayItem {
	return { ...item }
}

function cloneToolbarPreset(toolbar: PaletteToolbar): PaletteToolbar {
	return {
		title: toolbar.title,
		items: toolbar.items.map((item) => cloneDisplayItem(item)),
	}
}

function createParkedPreset(preset: DemoToolbarPreset) {
	return container.addParkedToolbar(cloneToolbarPreset(preset.toolbar))
}

function placeParkedToolbar(toolbar: PaletteToolbar, region: PaletteContainerRegion) {
	container.moveToolbar(toolbar, {
		region,
		track: 0,
		index: container.getToolbarsInTrack(region, 0).length,
	})
}

function ParkingToolbarCard(props: { toolbar: PaletteToolbar }) {
	return (
		<div class="palette-parked-toolbar" data-role="parked-toolbar">
			<div class="palette-parked-toolbar-header">
				<strong>{props.toolbar.title ?? 'Untitled toolbar'}</strong>
				<div class="palette-parked-toolbar-actions">
					<button type="button" onClick={() => placeParkedToolbar(props.toolbar, 'top')}>
						Top
					</button>
					<button type="button" onClick={() => placeParkedToolbar(props.toolbar, 'right')}>
						Right
					</button>
					<button type="button" onClick={() => placeParkedToolbar(props.toolbar, 'bottom')}>
						Bottom
					</button>
					<button type="button" onClick={() => placeParkedToolbar(props.toolbar, 'left')}>
						Left
					</button>
					<button type="button" onClick={() => removeDemoToolbar(props.toolbar)}>
						Delete
					</button>
				</div>
			</div>
			<div class="palette-parked-toolbar-meta">
				{props.toolbar.items.length} item{props.toolbar.items.length === 1 ? '' : 's'}
			</div>
		</div>
	)
}

function ParkingPanel() {
	return (
		<div class="palette-parking-panel" data-role="parking-panel">
			<div class="palette-parking-header">
				<strong>Toolbar Parking</strong>
				<span>Drop toolbars here to store, reorder, preset, or delete them explicitly.</span>
			</div>
			<div class="palette-parking-presets">
				<for each={PARKING_PRESETS}>
					{(preset) => (
						<button
							type="button"
							class="palette-parking-preset"
							onClick={() => createParkedPreset(preset)}
						>
							{preset.label}
						</button>
					)}
				</for>
			</div>
			<div class="palette-parking-list">
				<for each={container.parkedToolbars}>
					{(toolbar) => <ParkingToolbarCard toolbar={toolbar} />}
				</for>
			</div>
		</div>
	)
}

function placeToolbarAt(region: PaletteContainerRegion, track: number, index: number, split = 0.5) {
	if (demoUi.draggingToolbar) {
		const draggedToolbar = demoToolbar(demoUi.draggingToolbar)
		placeSpecificToolbar(draggedToolbar, region, track, index, split)
		stopToolbarDrag()
	}
}

function placeSpecificToolbar(
	toolbar: PaletteToolbar,
	region: PaletteContainerRegion,
	track: number,
	index: number,
	split = 0.5
) {
	const sourcePath = requireToolbarPath(toolbar)
	const isAdjacentResizeTarget =
		sourcePath.region === region &&
		sourcePath.track === track &&
		(index === sourcePath.index || index === sourcePath.index + 1)
	if (isAdjacentResizeTarget) {
		container.resizeToolbar(
			sourcePath.region,
			sourcePath.track,
			sourcePath.index,
			index === sourcePath.index ? split : 1 - split
		)
		return
	}
	moveDemoToolbar(toolbar, region, track, index, split)
}

function acceptsRegionStakePayload(
	payload: unknown
): payload is { type: 'toolbar'; toolbarPath: DemoToolbarPath } {
	if (!payload || typeof payload !== 'object') return false
	const candidate = payload as { type?: string; toolbarPath?: DemoToolbarPath }
	if (candidate.type === 'toolbar') return candidate.toolbarPath !== undefined
	return false
}

function moveDemoToolbar(
	toolbar: PaletteToolbar,
	targetRegion: PaletteContainerRegion,
	targetTrack: number,
	targetIndex?: number,
	targetSplit?: number
) {
	container.moveToolbar(toolbar, {
		region: targetRegion,
		track: targetTrack,
		index: targetIndex ?? container.getToolbarsInTrack(targetRegion, targetTrack).length,
		split: targetSplit,
	})
	if (demoUi.draggingToolbar && demoToolbar(demoUi.draggingToolbar) === toolbar) {
		demoUi.draggingToolbar = undefined
	}
}

function ToolbarStrip(props: { toolbar: PaletteToolbar }) {
	const computed = {
		get position() {
			return toolbarPath(props.toolbar)
		},
		get toolbarId() {
			return this.position ? toolbarPathId(this.position) : 'missing'
		},
		get dragging() {
			return sameToolbarPath(demoUi.draggingToolbar, this.position)
		},
	}

	return (
		<div
			if={computed.position}
			class="palette-toolbar-line"
			data-role="toolbar"
			data-region={computed.position!.region}
			data-axis={regionAxis(computed.position!.region)}
			data-toolbar-id={computed.toolbarId}
			data-test={`palette-toolbar-${computed.toolbarId}`}
			data-dragging={computed.dragging ? 'true' : undefined}
			onMousedown={(event: MouseEvent) => beginToolbarMove(props.toolbar, event)}
		>
			<for each={props.toolbar.items}>
				{(displayItem) => {
					const itemId = displayItem.kind === 'intent' ? displayItem.intentId : displayItem.entryId
					let content: SursautElement | undefined
					if (isEditorDisplayItem(displayItem)) {
						content = <EditorItem displayItem={displayItem} toolbar={props.toolbar} />
					} else if (isIntentDisplayItem(displayItem)) {
						const resolved = palette.resolveDisplayItem(displayItem)
						if (isIntentResolvedDisplayItem(resolved)) {
							const checked = computeCheckedState(
								displayItem,
								resolved.intent,
								resolved.entry,
								palette
							)
							const disabled = isDemoDisabled(displayItem, resolved)
							const presenter = resolvePresenter(displayItem, resolved)
							content = presenter({
								displayItem,
								resolved,
								checked,
								disabled,
								onActivate: () => {
									palette.run(resolved.intent.id)
								},
							})
						}
					}
					if (!content) return undefined
					return (
						<>
							<div
								class="palette-toolbar-item-shell"
								data-role="toolbar-item-drag-wrapper"
								data-toolbar-id={computed.toolbarId}
								data-item-id={itemId}
								data-item-kind={displayItem.kind}
								data-test={`palette-toolbar-item-${computed.toolbarId}-${displayItem.kind}-${itemId}`}
							>
								{content}
							</div>
						</>
					)
				}}
			</for>
		</div>
	)
}

function RegionSpace(props: {
	region: PaletteContainerRegion
	track: number
	index: number
	toolbarCount: number
}) {
	const computed = {
		get region() {
			return props.region
		},
		get index() {
			return props.index
		},
		get track() {
			return props.track
		},
		get toolbarCount() {
			return props.toolbarCount
		},
		get space() {
			return actualRegionSpaceAt(
				props.toolbarCount,
				props.index,
				container.toolbarStack[props.region][props.track] ?? []
			)
		},
	}
	return (
		<div
			class="palette-region-space"
			data-role="region-space"
			data-region={computed.region}
			data-axis={regionAxis(computed.region)}
			data-track={String(computed.track)}
			data-index={String(computed.index)}
			data-test={`palette-region-space-${computed.region}-${computed.track}-${computed.index}`}
			style={regionSpaceStyle(computed.space)}
			use:drop={(payload: unknown, event: DragEvent) => {
				if (!container.editMode || !acceptsRegionStakePayload(payload)) return
				const split = regionSplitFromEvent(
					computed.region,
					event,
					event.currentTarget as HTMLElement
				)
				placeToolbarAt(computed.region, computed.track, computed.index, split)
			}}
			use:dragging={(payload: unknown, isEnter: boolean, el: HTMLElement) => {
				if (!container.editMode) return false
				if (!acceptsRegionStakePayload(payload)) return false
				if (isEnter) {
					el.dataset.active = 'true'
					return () => {
						delete el.dataset.active
					}
				}
			}}
			title={container.editMode ? 'Toolbar space' : undefined}
		/>
	)
}

function toggleEditMode() {
	if (container.editMode) {
		container.editMode = false
		stopToolbarDrag()
		demoUi.draggingToolbar = undefined
		return
	}
	container.editMode = true
}

function commandSurfaceLabel(region: PaletteContainerRegion) {
	return region === 'top' ? 'Top region' : region === 'bottom' ? 'Bottom region' : `${region} rail`
}

function CommandSurfaceLabelText(props: { region: PaletteContainerRegion }) {
	return <>{commandSurfaceLabel(props.region)}</>
}

function regionAxis(region: PaletteContainerRegion) {
	return paletteRegionAxis(region)
}

function RegionShell(props: { region: PaletteContainerRegion }) {
	const computed = {
		get region() {
			return props.region
		},
		get tracks() {
			return container.toolbarStack[props.region]
		},
		get trackEntries() {
			return computed.tracks.map((track, index) => ({ track, index }))
		},
		get insertionPoints() {
			return container.getInsertionPointsInRegion(props.region)
		},
		get visible() {
			return (
				props.region === 'top' ||
				container.editMode ||
				computed.tracks.some((track) => track.length > 0)
			)
		},
	}
	return (
		<div
			if={computed.visible}
			class={`palette-region-layout palette-axis-${regionAxis(computed.region)}`}
			data-role="region-layout"
			data-region={computed.region}
			data-axis={regionAxis(computed.region)}
			data-test={`palette-region-layout-${computed.region}`}
			style={REGION_LAYOUT[computed.region]}
		>
			<div
				class="palette-region-shell"
				data-role="region-shell"
				data-region={computed.region}
				data-axis={regionAxis(computed.region)}
				data-test={`palette-region-shell-${computed.region}`}
			>
				<strong
					if={container.editMode && computed.region !== 'top'}
					class="palette-region-label"
					data-role="region-label"
					data-region={computed.region}
				>
					<CommandSurfaceLabelText region={computed.region} />
				</strong>
				<for each={computed.trackEntries}>
					{(entry) => (
						<div class="palette-track-shell">
							<for each={container.getInsertionPointsInTrack(computed.region, entry.index)}>
								{(point) => (
									<>
										<RegionSpace
											region={computed.region}
											track={entry.index}
											index={point.index}
											toolbarCount={entry.track.length}
										/>
										{point.index < entry.track.length ? (
											<ToolbarStrip toolbar={entry.track[point.index].toolbar} />
										) : undefined}
									</>
								)}
							</for>
						</div>
					)}
				</for>
			</div>
			<div
				if={warningState.messages.length > 0}
				class="palette-warning-panel"
				data-role="warning-panel"
				data-test="palette-warning-panel"
			>
				<div class="palette-config-header" data-role="warning-panel-header">
					<strong>Rebuild fence warnings</strong>
					<button onClick={() => warningState.messages.splice(0, warningState.messages.length)}>
						Clear
					</button>
				</div>
				<div class="palette-warning-body">
					<for each={warningState.messages}>
						{(message) => (
							<div class="palette-warning-entry">
								<strong class="palette-warning-title">Rebuild fence</strong>
								<pre class="palette-warning-pre">{message}</pre>
							</div>
						)}
					</for>
				</div>
			</div>
		</div>
	)
}

function CommandResultLabel(props: { match: PaletteMatch }) {
	return <>{commandLabel(props.match)}</>
}

function CommandResultMeta(props: { match: PaletteMatch }) {
	return <>{commandMeta(props.match)}</>
}

function CommandResultRow(props: { match: PaletteMatch }) {
	const computed = {
		get key() {
			return commandKey(props.match)
		},
		get resultIndex() {
			return commandBox.results.findIndex((entry) => commandKey(entry) === computed.key)
		},
		get selected() {
			return (
				commandBox.selection.item !== undefined &&
				commandKey(commandBox.selection.item) === computed.key
			)
		},
	}

	return (
		<div
			class="palette-command-row"
			data-role="command-result-row"
			data-result-kind={props.match.kind}
			data-test={`palette-command-row-${computed.resultIndex}`}
		>
			<button
				data-test={`palette-command-result-${computed.resultIndex}`}
				class="palette-command-result"
				data-role="command-result"
				data-result-kind={props.match.kind}
				data-selected={computed.selected ? 'true' : undefined}
				onClick={() => runMatch(props.match)}
			>
				<div>
					<CommandResultLabel match={props.match} />
				</div>
				<div class="palette-command-result-meta">
					<CommandResultMeta match={props.match} />
				</div>
			</button>
			<button
				class="palette-command-drag"
				data-role="command-drag"
				data-result-kind={props.match.kind}
				data-test={`palette-command-drag-${computed.resultIndex}`}
				data-selected={computed.selected ? 'true' : undefined}
				disabled
				title="Item drag-and-drop temporarily disabled"
			>
				⋮⋮
			</button>
		</div>
	)
}

function CommandPanel() {
	return (
		<div
			class="palette-command-overlay"
			data-role="command-overlay"
			data-test="palette-command-overlay"
		>
			<div
				class="palette-command-panel"
				data-role="command-panel"
				data-test="palette-command-panel"
			>
				<div class="palette-command-panel-header" data-role="command-panel-header">
					<div>
						<strong class="palette-command-title">Magic Mode - Command Box</strong>
						<div class="palette-command-subtitle">Drag items out or press Enter to execute</div>
					</div>
					<button class="palette-command-close" onClick={toggleEditMode}>
						Close
					</button>
				</div>

				<ParkingPanel />

				<div class="palette-command-box" data-role="command-box" data-test="palette-command-box">
					<div class="palette-command-input-shell" data-role="command-input-shell">
						<for each={commandBox.categories.active}>
							{(category) => (
								<button
									class="palette-command-chip palette-command-chip-category"
									data-command-chip={category}
									onClick={() => commandBox.categories.toggle(category)}
									onKeydown={(event) =>
										handlePaletteCommandChipKeydown({
											commandBox,
											event,
											token: category,
											type: 'category',
										})
									}
								>
									#{category} ×
								</button>
							)}
						</for>
						<for each={commandBox.keywords.tokens}>
							{(keywordToken) => (
								<button
									class="palette-command-chip palette-command-chip-keyword"
									data-command-chip={keywordToken.keyword}
									onClick={() => commandBox.keywords.removeToken(keywordToken.keyword)}
									onKeydown={(event) =>
										handlePaletteCommandChipKeydown({
											commandBox,
											event,
											token: keywordToken.keyword,
											type: 'keyword',
										})
									}
								>
									{keywordToken.keyword} ×
								</button>
							)}
						</for>

						<input
							class="palette-command-input"
							data-test="palette-command-input"
							value={commandBox.input.value}
							placeholder={commandBox.input.placeholder}
							onInput={(event) => setPaletteCommandBoxInput(commandBox, event)}
							onKeydown={(event) =>
								handlePaletteCommandBoxInputKeydown({
									commandBox,
									event,
									onMatch: runMatch,
									onAfterExecute: () => {
										if (container.editMode) toggleEditMode()
									},
								})
							}
						/>
					</div>

					<div
						if={commandBox.suggestions.length > 0}
						class="palette-command-suggestions"
						data-role="command-suggestions"
					>
						<span class="palette-command-suggestions-label">Available keywords:</span>
						<for each={commandBox.suggestions}>
							{(suggestion) => (
								<button
									class="palette-command-suggestion"
									data-active={suggestion.isActive ? 'true' : undefined}
									onClick={() => {
										commandBox.keywords.addToken(suggestion.keyword)
										commandBox.input.value = ''
									}}
									title={`Click to add ${suggestion.keyword} as chip`}
								>
									{suggestion.keyword}
								</button>
							)}
						</for>
					</div>

					<div
						class="palette-command-results"
						data-role="command-results"
						data-test="palette-command-results"
					>
						<for each={commandBox.results.slice(0, 6)}>
							{(match) => <CommandResultRow match={match} />}
						</for>
					</div>
				</div>
			</div>
		</div>
	)
}

function DemoContent() {
	return (
		<div
			class="palette-central-content"
			data-role="central-content"
			data-test="palette-central-content"
			data-dimmed={container.editMode ? 'true' : 'false'}
		>
			<div>
				<h2 class="palette-demo-heading">Palette Demo</h2>
				<p class="palette-demo-copy">
					The root `palette-demo` node is now the toolbared container. The center content scrolls
					independently while toolbars live on the shell.
				</p>
				<div if={!container.editMode} class="palette-demo-tip">
					Press <code>`</code> to enter Magic Mode for toolbar customization.
				</div>
			</div>

			<div>
				<h3 class="palette-demo-section-title">Presenter Dictionaries</h3>
				<div class="palette-demo-card-grid">
					<for each={FAMILY_ORDER}>
						{(family) => (
							<div class="palette-demo-card">
								<strong>{family}</strong>
								<div class="palette-demo-meta">
									<PresenterNamesText family={family} />
								</div>
							</div>
						)}
					</for>
				</div>
			</div>

			<div>
				<h3 class="palette-demo-section-title">Numeric Control</h3>
				<div class="palette-demo-panel">
					<div class="palette-demo-panel-copy">
						`game.speed` can be paused via stash and edited directly through the headless stars
						model rendered with play-arrow glyphs.
					</div>
					<div
						data-test="palette-speed-stars"
						class="palette-demo-speed-stars"
						{...speedStars.container}
					>
						<for each={speedStars.starItems}>
							{(item) => (
								<span data-test={`palette-speed-star-${item.index + 1}`} {...item.el}>
									<StarGlyphText status={item.status} />
								</span>
							)}
						</for>
					</div>
					<div class="palette-demo-panel-meta">
						Selected speed: {String(demoSettings['game.speed'])}
					</div>
				</div>
			</div>

			<div>
				<h3 class="palette-demo-section-title">Live State</h3>
				<div class="palette-demo-card-grid">
					<div class="palette-demo-card">
						<strong>Boolean checkbutton</strong>
						<div class="palette-demo-meta">
							ui.notifications = {String(demoSettings['ui.notifications'])}
						</div>
					</div>
					<div class="palette-demo-card">
						<strong>Enum radiobutton group</strong>
						<div class="palette-demo-meta">ui.theme = {String(demoSettings['ui.theme'])}</div>
					</div>
					<div class="palette-demo-card">
						<strong>Enum flip button</strong>
						<div class="palette-demo-meta">ui.layout = {String(demoSettings['ui.layout'])}</div>
					</div>
					<div class="palette-demo-card">
						<strong>Numeric step</strong>
						<div class="palette-demo-meta">
							editor.fontSize = {String(demoSettings['editor.fontSize'])}
						</div>
					</div>
					<div class="palette-demo-card">
						<strong>Numeric stash</strong>
						<div class="palette-demo-meta">game.speed = {String(demoSettings['game.speed'])}</div>
					</div>
				</div>
			</div>

			<div>
				<h3 class="palette-demo-section-title">Reactive Objects</h3>
				<div class="palette-demo-object-grid">
					<div class="palette-demo-card">
						<strong>settings</strong>
						<pre class="palette-demo-pre">{JSON.stringify(demoSettings, null, 2)}</pre>
					</div>
					<div class="palette-demo-card">
						<strong>runtime</strong>
						<pre class="palette-demo-pre">{JSON.stringify(palette.runtime, null, 2)}</pre>
					</div>
					<div class="palette-demo-card">
						<strong>display</strong>
						<pre class="palette-demo-pre">{JSON.stringify(palette.display, null, 2)}</pre>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function PaletteDemo(
	_: {},
	scope: { drag?: typeof drag; drop?: typeof drop; dragging?: typeof dragging }
) {
	Object.assign(scope, { drag, drop, dragging })
	return (
		<div
			data-test="palette-demo"
			class={[
				'palette-demo-root',
				{
					'is-editing': container.editMode,
					'is-dragging-toolbar': !!demoUi.draggingToolbar,
				},
			]}
			data-role="toolbared-container"
			use={bindDemoShortcuts}
			style="--palette-handle-size: 10px;"
		>
			<for each={REGION_ORDER}>{(region) => <RegionShell region={region} />}</for>

			<div
				class="palette-central-shell"
				data-role="central-shell"
				data-test="palette-central-shell"
				data-active-park-zone={undefined}
				use:drop={(payload: any) => {
					if (!container.editMode) return
					if (payload.type !== 'toolbar') return
					container.parkToolbar(demoToolbar(payload.toolbarPath))
				}}
				use:dragging={(payload: any, isEnter: boolean, el: HTMLElement) => {
					if (!container.editMode || !payload) return false
					const accepts = payload.type === 'toolbar'
					if (!accepts) return false
					if (isEnter) {
						el.dataset.activeParkZone = 'true'
						return () => {
							delete el.dataset.activeParkZone
						}
					}
				}}
			>
				<div if={container.editMode}>
					<CommandPanel />
				</div>

				<DemoContent />
			</div>
		</div>
	)
}

componentStyle.css`
	.palette-demo-root {
		position: relative;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		grid-template-rows: auto minmax(0, 1fr) auto;
		gap: 12px;
		height: calc(100vh - 40px);
		max-height: calc(100vh - 40px);
		min-height: 680px;
		padding: 16px;
		border-radius: 18px;
		background: #0f172a;
		color: #e2e8f0;
		overflow: hidden;
		box-sizing: border-box;
	}

	.palette-central-shell {
		grid-column: 2;
		grid-row: 2;
		position: relative;
		min-width: 0;
		min-height: 0;
		overflow: auto;
		padding: 8px;
		border-radius: 16px;
		background: #111827;
		border: 1px solid #1f2937;
	}

	.palette-central-shell[data-active-park-zone='true'] {
		background: rgba(14, 165, 233, 0.12);
		border-color: #38bdf8;
		color: #e0f2fe;
	}

	.palette-parking-panel {
		display: grid;
		gap: 12px;
		padding: 12px;
		margin-bottom: 12px;
		border-radius: 14px;
		border: 1px solid rgba(56, 189, 248, 0.24);
		background: rgba(15, 23, 42, 0.7);
	}

	.palette-parking-header {
		display: grid;
		gap: 4px;
	}

	.palette-parking-presets {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.palette-parking-preset {
		border: 1px solid #334155;
		border-radius: 999px;
		padding: 6px 10px;
		background: #0f172a;
		color: #cbd5e1;
		cursor: pointer;
	}

	.palette-parking-list {
		display: grid;
		gap: 10px;
	}

	.palette-parked-toolbar {
		display: grid;
		gap: 8px;
		padding: 10px 12px;
		border-radius: 12px;
		border: 1px solid #334155;
		background: rgba(30, 41, 59, 0.72);
	}

	.palette-parked-toolbar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.palette-parked-toolbar-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.palette-parked-toolbar-actions button {
		border: 1px solid #475569;
		border-radius: 999px;
		padding: 4px 8px;
		background: #111827;
		color: #cbd5e1;
		cursor: pointer;
	}

	.palette-parked-toolbar-meta {
		color: #94a3b8;
		font-size: 12px;
	}

	.palette-central-content {
		display: grid;
		gap: 16px;
		min-height: max-content;
		transition: opacity 120ms ease, filter 120ms ease, box-shadow 120ms ease;
	}

	.palette-central-content[data-dimmed='true'] {
		opacity: 0.45;
		filter: saturate(0.7);
		box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.18);
	}

	.palette-command-overlay {
		position: absolute;
		left: 16px;
		right: 16px;
		bottom: 16px;
		z-index: 5;
		display: flex;
		justify-content: center;
		align-items: flex-end;
		pointer-events: none;
	}

	.palette-command-panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: min(640px, calc(100% - 32px));
		max-height: min(50vh, 640px);
		overflow: auto;
		padding: 16px;
		border-radius: 16px;
		background: #0f172a;
		border: 1px solid #334155;
		box-shadow: 0 16px 60px rgba(0, 0, 0, 0.45);
		pointer-events: auto;
	}

	.palette-command-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}

	.palette-command-title {
		font-size: 16px;
	}

	.palette-command-subtitle {
		color: #94a3b8;
		font-size: 12px;
	}

	.palette-command-close {
		padding: 4px 8px;
		border: 1px solid #475569;
		border-radius: 6px;
		background: #1e293b;
		color: #e2e8f0;
	}

	.palette-command-box {
		margin-top: 16px;
	}

	.palette-command-input-shell {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 10px 12px;
		border-radius: 8px;
		border: 1px solid #475569;
		background: #0f172a;
		align-items: center;
	}

	.palette-command-chip {
		padding: 4px 8px;
		border-radius: 999px;
	}

	.palette-command-chip-category {
		border: 1px solid #60a5fa;
		background: #1d4ed8;
		color: #eff6ff;
	}

	.palette-command-chip-keyword {
		border: 1px solid #60a5fa;
		background: #1e3a8a;
		color: #bfdbfe;
	}

	.palette-command-input {
		flex: 1;
		min-width: 120px;
		padding: 0;
		border: 0;
		background: transparent;
		color: #e2e8f0;
	}

	.palette-command-suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		background: #1e293b;
	}

	.palette-command-suggestions-label,
	.palette-command-result-meta {
		color: #94a3b8;
		font-size: 12px;
	}

	.palette-command-suggestion {
		padding: 2px 6px;
		border: 1px solid #475569;
		border-radius: 4px;
		background: #334155;
		color: #94a3b8;
		font-size: 11px;
		cursor: pointer;
	}

	.palette-command-suggestion[data-active='true'] {
		background: #60a5fa;
		color: #bfdbfe;
	}

	.palette-command-results {
		display: grid;
		gap: 8px;
		margin-top: 12px;
	}

	.palette-command-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.palette-command-result {
		flex: 1;
		padding: 10px 12px;
		border: 1px solid #475569;
		border-radius: 8px;
		text-align: left;
		background: #0f172a;
		color: #e2e8f0;
	}

	.palette-command-result:hover,
	.palette-command-result[data-selected='true'] {
		background: #1d4ed8;
		border-color: #60a5fa;
		color: #eff6ff;
	}

	.palette-command-drag {
		padding: 8px;
		border: 1px solid #475569;
		border-radius: 6px;
		background: #1e293b;
		color: #94a3b8;
		cursor: grab;
		font-size: 12px;
		opacity: 0;
		pointer-events: none;
	}

	.palette-command-row:hover .palette-command-drag,
	.palette-command-drag[data-selected='true'] {
		opacity: 1;
		pointer-events: auto;
	}

	.palette-intent-button,
	.palette-editor-button {
		padding: 8px 12px;
		border: 1px solid #475569;
		border-radius: 8px;
		background: #0f172a;
		color: #e2e8f0;
		cursor: pointer;
	}

	.palette-intent-button[data-active='true'],
	.palette-editor-button[data-selected='true'],
	.palette-editor-shell[data-selected='true'] {
		background: #1d4ed8;
		border-color: #60a5fa;
		color: #eff6ff;
	}

	.palette-intent-button[data-disabled='true'] {
		background: #1f2937;
		border-color: #334155;
		color: #64748b;
		cursor: not-allowed;
	}

	.palette-shortcut {
		margin-left: 8px;
		color: #94a3b8;
		font-size: 12px;
	}

	.palette-editor-shell {
		display: grid;
		gap: 6px;
		min-width: 180px;
		padding: 8px 10px;
		border: 1px solid #475569;
		border-radius: 10px;
		background: #0f172a;
		color: #e2e8f0;
	}

	.palette-editor-shell-compact {
		min-width: 0;
		padding: 6px 8px;
	}

	.palette-editor-select {
		padding: 6px 8px;
		border-radius: 8px;
		border: 1px solid #475569;
		background: #0b1220;
		color: #e2e8f0;
	}

	.palette-editor-shell-compact .palette-editor-select {
		min-width: 0;
		width: 112px;
	}

	.palette-editor-label {
		text-align: left;
	}

	.palette-editor-slider {
		width: 112px;
	}

	.palette-inline-stars {
		display: flex;
		gap: 4px;
		font-size: 1.1rem;
		color: #facc15;
	}

	.palette-item-group {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		padding: 2px;
		border: 1px solid #64748b;
		border-radius: 999px;
		background: #0f172a;
	}

	.palette-item-group[data-axis='vertical'] {
		flex-direction: column;
		align-items: stretch;
		border-radius: 16px;
	}

	.palette-item-group[data-selected='true'] {
		border-color: #60a5fa;
		background: #1d4ed8;
	}

	.palette-item-group-option {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px;
		border: 1px solid #64748b;
		border-radius: 4px;
		background: #1e293b;
		color: #e2e8f0;
		cursor: pointer;
		font-size: 12px;
		opacity: 0.7;
	}

	.palette-item-group[data-axis='vertical'] .palette-item-group-option {
		justify-content: flex-start;
	}

	.palette-item-group-option[data-selected='true'] {
		background: #3b82f6;
		opacity: 1;
	}

	.palette-warning-panel {
		position: absolute;
		left: 16px;
		bottom: 16px;
		z-index: 5;
		width: min(560px, calc(100% - 32px));
		max-height: min(40vh, 420px);
		overflow: auto;
		padding: 14px;
		border-radius: 14px;
		background: #0f172a;
		border: 1px solid #7c3aed;
		box-shadow: 0 16px 60px rgba(0, 0, 0, 0.45);
	}

	.palette-config-body {
		display: grid;
		gap: 10px;
	}

	.palette-config-popup {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		z-index: 8;
		width: min(320px, 80vw);
		padding: 14px;
		border-radius: 14px;
		background: #0f172a;
		border: 1px solid #475569;
		box-shadow: 0 16px 60px rgba(0, 0, 0, 0.45);
	}

	.palette-warning-body {
		display: grid;
		gap: 10px;
		margin-top: 10px;
	}

	.palette-warning-entry {
		display: grid;
		gap: 6px;
		padding: 10px 12px;
		border-radius: 10px;
		background: #111827;
		border: 1px solid #374151;
	}

	.palette-warning-title {
		color: #ddd6fe;
	}

	.palette-warning-pre {
		margin: 0;
		white-space: pre-wrap;
		word-break: break-word;
		color: #e5e7eb;
		font-size: 12px;
		line-height: 1.45;
	}

	.palette-config-header {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		align-items: center;
	}

	.palette-config-actions,
	.palette-config-move-targets {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.palette-config-target-section {
		display: grid;
		gap: 6px;
	}

	.palette-config-meta {
		color: #94a3b8;
		font-size: 12px;
	}

	.palette-config-target-title {
		font-size: 12px;
		color: #cbd5e1;
	}

	.palette-region-label {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: ${SURFACE_COLOR};
	}

	.palette-demo-heading,
	.palette-demo-section-title {
		margin: 0 0 10px;
	}

	.palette-demo-heading {
		margin-bottom: 8px;
	}

	.palette-demo-copy,
	.palette-demo-meta,
	.palette-demo-panel-copy,
	.palette-demo-panel-meta {
		color: #94a3b8;
	}

	.palette-demo-copy {
		margin: 0;
	}

	.palette-demo-tip {
		margin-top: 10px;
		padding: 10px 12px;
		border-radius: 10px;
		background: #172554;
		color: #bfdbfe;
	}

	.palette-demo-card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 8px;
	}

	.palette-demo-object-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 8px;
	}

	.palette-demo-card,
	.palette-demo-panel {
		padding: 10px 12px;
		border-radius: 8px;
		background: #334155;
	}

	.palette-demo-panel {
		padding: 14px;
		border-radius: 10px;
	}

	.palette-demo-panel-copy {
		margin-bottom: 8px;
	}

	.palette-demo-speed-stars {
		display: flex;
		gap: 6px;
		font-size: 2rem;
		color: #facc15;
	}

	.palette-demo-panel-meta {
		margin-top: 8px;
	}

	.palette-demo-pre {
		margin: 8px 0 0;
		color: #cbd5e1;
		white-space: pre-wrap;
	}

	.palette-region-shell {
		display: flex;
		gap: 8px;
		min-height: 0;
		min-width: 0;
		padding: 12px;
		border-radius: 14px;
		background: #111827;
		border: 1px solid #1f2937;
		box-shadow: inset 0 0 0 1px transparent;
		transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
	}

	.palette-demo-root.is-editing .palette-region-shell {
		background: ${SURFACE_COLOR}14;
		border-color: ${SURFACE_COLOR}88;
		box-shadow: inset 0 0 0 1px ${SURFACE_COLOR}33;
	}

	.palette-region-layout.palette-axis-horizontal .palette-region-shell {
		flex-direction: row;
		flex-wrap: nowrap;
		align-items: stretch;
	}

	.palette-track-shell {
		display: flex;
		flex: 1 1 auto;
		align-self: stretch;
		min-width: 0;
		min-height: 0;
	}

	.palette-region-layout.palette-axis-horizontal .palette-track-shell {
		flex-direction: row;
		align-items: stretch;
	}

	.palette-region-layout.palette-axis-vertical .palette-track-shell {
		flex-direction: column;
		align-items: stretch;
	}

	.palette-region-layout.palette-axis-vertical {
		display: flex;
		align-self: stretch;
		height: 100%;
		min-height: 0;
	}

	.palette-region-layout.palette-axis-vertical .palette-region-shell {
		flex: 1 1 auto;
		height: 100%;
		flex-direction: column;
		align-items: stretch;
	}

	.palette-region-space {
		min-width: 0;
		min-height: 0;
		display: flex;
		align-items: stretch;
		justify-content: stretch;
		border-radius: 999px;
		border: 1px dashed transparent;
		box-sizing: border-box;
		transition: background 120ms ease, box-shadow 120ms ease, opacity 120ms ease, border-color 120ms ease;
	}

	.palette-demo-root.is-editing .palette-region-space {
		background: rgba(34, 211, 238, 0.08);
		border-color: rgba(34, 211, 238, 0.32);
		box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.16);
		cursor: copy;
	}

	.palette-demo-root.is-editing.is-dragging-toolbar .palette-region-space {
		background: rgba(34, 211, 238, 0.16);
		border-color: rgba(34, 211, 238, 0.48);
		box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.38);
	}

	.palette-demo-root.is-editing.is-dragging-item .palette-region-space {
		background: rgba(167, 139, 250, 0.12);
		border-color: rgba(167, 139, 250, 0.38);
		box-shadow: inset 0 0 0 1px rgba(167, 139, 250, 0.26);
	}

	.palette-demo-root.is-editing .palette-region-space[data-active='true'] {
		background: rgba(34, 211, 238, 0.22);
		border-color: ${DROP_ZONE_COLOR};
		box-shadow: inset 0 0 0 1px rgba(34, 211, 238, 0.42);
	}

	.palette-region-layout.palette-axis-horizontal .palette-region-space {
		flex-direction: row;
		min-width: var(--palette-handle-size);
	}

	.palette-region-layout.palette-axis-vertical .palette-region-space {
		flex-direction: column;
		min-height: var(--palette-handle-size);
	}

	.palette-demo-root.is-editing .palette-region-layout.palette-axis-horizontal .palette-toolbar-line {
		cursor: grab;
		user-select: none;
	}

	.palette-demo-root.is-editing .palette-region-layout.palette-axis-vertical .palette-toolbar-line {
		cursor: grab;
		user-select: none;
	}

	.palette-region-layout.palette-axis-horizontal .palette-toolbar-line {
		flex-direction: row;
		align-items: center;
		flex-wrap: nowrap;
	}

	.palette-region-layout.palette-axis-vertical .palette-toolbar-line {
		flex-direction: column;
		align-items: stretch;
	}

	.palette-toolbar-line {
		display: flex;
		gap: 8px;
		min-width: 0;
		max-width: 100%;
		padding: 0;
		border-radius: 0;
		border: 1px solid transparent;
		background: transparent;
		box-shadow: none;
		opacity: 1;
		transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
		box-sizing: border-box;
		overflow: hidden;
		flex: 0 0 auto;
		align-self: stretch;
	}

	.palette-demo-root.is-editing .palette-toolbar-line {
		padding: 8px;
		border-radius: 12px;
		border-color: ${TOOLBAR_COLOR}66;
		background: ${TOOLBAR_COLOR}12;
		box-shadow: inset 0 0 0 1px ${TOOLBAR_COLOR}22;
	}

	.palette-toolbar-line[data-dragging='true'] {
		opacity: 0.6;
	}

	.palette-toolbar-resize-handle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px;
		border: 1px solid #475569;
		border-radius: 8px;
		background: #1e293b;
		color: #94a3b8;
		cursor: grab;
		flex: 0 0 auto;
	}

	.palette-region-layout.palette-axis-horizontal .palette-toolbar-resize-handle {
		cursor: ew-resize;
	}

	.palette-region-layout.palette-axis-vertical .palette-toolbar-resize-handle {
		cursor: ns-resize;
	}

	.palette-toolbar-line:active {
		cursor: grabbing;
	}

	.palette-toolbar-resize-handle:active {
		cursor: inherit;
	}

	.palette-region-layout.palette-axis-horizontal .palette-toolbar-item-shell {
		display: inline-flex;
		align-items: stretch;
		position: relative;
		min-width: 0;
		max-width: 100%;
	}

	.palette-region-layout.palette-axis-vertical .palette-toolbar-item-shell {
		display: flex;
		align-items: stretch;
		position: relative;
		min-width: 0;
		max-width: 100%;
	}

	.palette-toolbar-item-shell[data-dragging='true'] {
		opacity: 0.6;
	}

`
