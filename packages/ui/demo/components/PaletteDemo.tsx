import { h, type PounceElement } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { reactive, reactiveOptions } from 'mutts'
import { drag, dragging, drop } from '../../src/directives/drag-drop'
import {
	startLocalDragSession,
	type LocalDragAxis,
	type LocalDragPoint,
} from '../../src/directives'
import {
	activatePaletteToolbarDropTarget,
	clearPaletteToolbarDropTarget,
	computeCheckedState,
	computeDisabledState,
	createPaletteModel,
	formatKeystroke,
	getDefaultDisplayPresenter,
	getDisplayPresenterFamily,
	getPaletteDisplayItemIdentity,
	handlePaletteCommandBoxInputKeydown,
	handlePaletteCommandChipKeydown,
	isVerticalPaletteRegion,
	measurePaletteToolbarDropTargets,
	paletteCommandBoxModel,
	paletteContainerModel,
	paletteDisplayCustomizationModel,
	paletteItemConfiguratorModel,
	paletteRegionAxis,
	resolvePaletteToolbarDropTarget,
	resolvePaletteToolbarSpaceDropTarget,
	samePaletteToolbarDropTarget,
	setPaletteCommandBoxInput,
	type PaletteContainerRegion,
	type PaletteDisplayItem,
	type PaletteDisplayItemIdentity,
	type PaletteDisplayPresenterFamily,
	type PaletteEditorDisplayItem,
	type PaletteEntryDefinition,
	type PaletteIntentDisplayItem,
	type PaletteItemGroupDisplayItem,
	type PaletteItemConfiguratorDescriptor,
	type PaletteResolvedDisplayItem,
	type PaletteResolvedEntry,
	type PaletteResolvedIntent,
	type PaletteKeyBinding,
	type PaletteConfiguredItemTarget,
	type PaletteSurfaceContext,
	type PaletteToolbarDropTarget,
	type PaletteToolbar,
} from '@pounce/ui/palette'
import { type PaletteMatch } from '@pounce/ui/palette'
import { starsModel, type StarStatus, type StarsValue } from '../../src/models/stars'

type DemoResolvedDisplayItem = Extract<PaletteResolvedDisplayItem, { kind: 'intent' }>

type DemoPresenterProps = {
	readonly displayItem: PaletteIntentDisplayItem
	readonly resolved: DemoResolvedDisplayItem
	readonly checked: boolean
	readonly disabled: boolean
	readonly onActivate: () => void
}

type DemoPresenter = (props: DemoPresenterProps) => PounceElement

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

type DemoEditorRenderer = (props: DemoEditorRendererProps) => PounceElement | undefined

type DemoUiState = {
	handleExpanded: boolean
	draggingToolbar: DemoToolbarPath | undefined
	draggingToolbarGrabOffset: number | undefined
	draggingToolbarSpan: number | undefined
	draggingItemToolbar: DemoToolbarPath | undefined
	draggingItemId: string | undefined
	draggingItemKind: PaletteDisplayItem['kind'] | undefined
}

type DemoWarningState = {
	messages: string[]
}

type DemoDraggedPaletteItem =
	| {
			readonly kind: 'intent'
			readonly intent: PaletteResolvedIntent
	  }
	| {
			readonly kind: 'editor'
			readonly entry: PaletteResolvedEntry
	  }
	| {
			readonly kind: 'item-group'
			readonly group: PaletteItemGroupDisplayItem['group']
	  }

type DemoToolbarPreset = {
	readonly id: string
	readonly label: string
	readonly toolbar: PaletteToolbar
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
				{ kind: 'intent', intentId: 'ui.notifications:toggle', presenter: 'toggle', showText: false },
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
					kind: 'item-group',
					group: { kind: 'enum-options', entryId: 'ui.theme', options: ['light', 'dark'], presenter: 'radio-group' },
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

const palette = createPaletteModel({
	definitions: [
		{
			id: 'ui.notifications',
			label: 'Notifications',
			description: 'Show desktop notifications',
			schema: { type: 'boolean' },
		},
		{
			id: 'ui.theme',
			label: 'Theme',
			description: 'Application theme',
			schema: {
				type: 'enum',
				options: [
					{ value: 'light', label: 'Light', icon: '☀️' },
					{ value: 'dark', label: 'Dark', icon: '🌙' },
					{ value: 'system', label: 'System', icon: '💻' },
				],
			},
		},
		{
			id: 'ui.layout',
			label: 'Layout',
			description: 'Toolbar layout',
			schema: {
				type: 'enum',
				options: ['horizontal', 'vertical', 'auto'],
			},
		},
		{
			id: 'editor.fontSize',
			label: 'Font Size',
			description: 'Editor font size',
			schema: { type: 'number', min: 10, max: 20, step: 1 },
		},
		{
			id: 'game.speed',
			label: 'Game Speed',
			description: 'Simulation speed',
			schema: { type: 'number', min: 1, max: 5, step: 1 },
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
	state: {
		'ui.notifications': true,
		'ui.theme': 'light',
		'ui.layout': 'horizontal',
		'editor.fontSize': 14,
		'game.speed': 1,
	},
	display: {
		container: {
			editMode: false,
			toolbarStack: {
				top: [{
					slots: [
						{
							toolbar: {
								title: 'Main Toolbar',
								items: [
									{ kind: 'intent', intentId: 'ui.notifications:toggle', presenter: 'toggle', showText: false },
									{ kind: 'intent', intentId: 'ui.theme:set:light', presenter: 'radio', showText: false },
								],
							},
							space: .3,
						},
						{
							toolbar: {
								title: 'Secondary Toolbar',
								items: [
									{ kind: 'intent', intentId: 'ui.theme:set:dark', presenter: 'radio', showText: false },
									{ kind: 'intent', intentId: 'ui.layout:flip', presenter: 'flip', showText: false },
								],
							},
							space: .3,
						},
					],
				}],
				right: [{
					slots: [
						{
							toolbar: {
								title: 'Editor Rail',
								items: [
									{ kind: 'editor', entryId: 'editor.fontSize', presenter: 'slider', showText: true },
									{ kind: 'intent', intentId: 'editor.fontSize:step:down', presenter: 'step', showText: true },
									{ kind: 'intent', intentId: 'editor.fontSize:step:up', presenter: 'step', showText: true },
								],
							},
							space: 0,
						},
					],
				}],
				bottom: [{
					slots: [
						{
							toolbar: {
								title: 'Playback Bar',
								items: [
									{ kind: 'intent', intentId: 'game.speed:step:down', presenter: 'step', showText: true },
									{ kind: 'editor', entryId: 'game.speed', presenter: 'stars', showText: true },
									{ kind: 'intent', intentId: 'game.speed:step:up', presenter: 'step', showText: true },
									{ kind: 'intent', intentId: 'game.speed:stash:0', presenter: 'stash', showText: true },
								],
							},
							space: 0,
						},
					],
				}],
				left: [{
					slots: [
						{
							toolbar: {
								title: 'Theme Rail',
								items: [
									{
										kind: 'item-group',
										group: {
											kind: 'enum-options',
											entryId: 'ui.theme',
											options: ['light', 'dark'],
											presenter: 'radio-group',
										},
										showText: false,
									},
									{ kind: 'editor', entryId: 'ui.theme', presenter: 'select', showText: false },
									{ kind: 'intent', intentId: 'ui.theme:set:system', presenter: 'radio', showText: false },
									{ kind: 'intent', intentId: 'editor.fontSize:step:up', presenter: 'step', showText: false },
								],
							},
							space: 0,
						},
					],
				}],
			},
		},
	},
})

const commandBox = paletteCommandBoxModel({
	palette,
	placeholder: 'Search commands and settings, or type categories like ui action…',
})
const container = paletteContainerModel({ palette })
const customization = paletteDisplayCustomizationModel({ palette, container })
const itemConfigurator = paletteItemConfiguratorModel({
	palette,
	customization,
	resolvers: {
		getTitle({ resolved }) {
			if (resolved.kind === 'intent') {
				return resolved.intent.label ?? resolved.intent.id
			}
			return resolved.entry.label
		},
		getSubtitle({ target, resolved }) {
			const summary = presenterSummary(target.toolbar, target.identity.id, target.identity.kind)
			if (resolved.kind === 'intent') {
				const binding = formatShortcut(palette.keys.getIntentKeystroke(resolved.intent.id))
				if (!binding) return summary ?? `${target.identity.kind} • ${target.identity.id}`
				return summary ? `${summary} • ${binding}` : binding
			}
			return summary ?? `${target.identity.kind} • ${target.identity.id}`
		},
		getPresenterChoices({ target, resolved }) {
			let options: readonly string[] = []
			let current = ''
			if (resolved.kind === 'intent') {
				const family = getDisplayPresenterFamily(resolved.intent, resolved.entry)
				options = Object.keys(DEMO_PRESENTERS[family]).filter((key) => key !== 'default')
				current = target.item.presenter ?? getDefaultDisplayPresenter(resolved.intent, resolved.entry)
			} else if (resolved.kind === 'editor') {
				options = editorPresenterOptions(resolved.entry)
				current = target.item.presenter ?? defaultEditorPresenter(resolved.entry)
			} else {
				options = Object.keys(DEMO_PRESENTERS.enum).filter((key) => key !== 'default')
				current = resolved.presenter ?? 'radio-group'
			}
			return options.map((id) => ({ id, label: id, selected: id === current }))
		},
		getMoveTargets({ target }) {
			return toolbarMoveTargets(target.toolbar).map((entry) => ({
				toolbar: demoToolbar(toolbarPathFromId(entry.id)),
				label: entry.label,
			}))
		},
		getPreferredRenderMode() {
			return 'anchored'
		},
	},
})
const demoUi: DemoUiState = reactive({
	handleExpanded: false,
	draggingToolbar: undefined,
	draggingToolbarGrabOffset: undefined,
	draggingToolbarSpan: undefined,
	draggingItemToolbar: undefined,
	draggingItemId: undefined,
	draggingItemKind: undefined,
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
		if (typeof args[0] === 'string' && args[0].startsWith('[pounce] Rebuild fence:')) {
			warningState.messages.unshift(args[0])
			if (warningState.messages.length > 5) warningState.messages.splice(5)
		}
		demoRuntime.__paletteDemoWarningsOriginalWarn__?.(...args)
	}
	//reactiveOptions.introspection!.gatherReasons.lineages = 'both'
}
const speedStars = starsModel({
	get value() {
		const value = palette.state['game.speed']
		return typeof value === 'number' && value >= 1 ? value : 0
	},
	set value(value) {
		if (typeof value === 'number' && value >= 1 && value <= 5) {
			palette.state['game.speed'] = value
		}
	},
	maximum: 5,
	before: 'star-filled',
	after: 'star-outline',
})

const FAMILY_ORDER: readonly PaletteDisplayPresenterFamily[] = ['action', 'boolean', 'enum', 'number', 'status']
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
const DEMO_EDITOR_FAMILY_OPTIONS: Readonly<Record<PaletteDisplayPresenterFamily, readonly string[]>> = {
	action: ['default'],
	boolean: ['default'],
	enum: ['select'],
	number: ['slider', 'stars'],
	status: ['default'],
}
const DEMO_EDITOR_OPTIONS: Readonly<Partial<Record<string, readonly string[]>>> = {
	'game.speed': ['stars', 'slider'],
}
const REGION_LAYOUT = {
	top: 'grid-column: 1 / 4; min-width: 0; min-height: 0;',
	left: 'grid-column: 1; grid-row: 2; align-self: stretch; height: 100%; min-width: 220px; max-width: 260px; min-height: 0;',
	right: 'grid-column: 3; grid-row: 2; align-self: stretch; height: 100%; min-width: 240px; max-width: 300px; min-height: 0;',
	bottom: 'grid-column: 1 / 4; grid-row: 3; min-width: 0; min-height: 0;',
} satisfies Record<PaletteContainerRegion, string>
const REGION_ORDER: readonly PaletteContainerRegion[] = ['top', 'left', 'right', 'bottom']

function isIntentDisplayItem(displayItem: PaletteDisplayItem): displayItem is PaletteIntentDisplayItem {
	return displayItem.kind === 'intent'
}

function isEditorDisplayItem(displayItem: PaletteDisplayItem): displayItem is PaletteEditorDisplayItem {
	return displayItem.kind === 'editor'
}

function isItemGroupDisplayItem(displayItem: PaletteDisplayItem): displayItem is PaletteItemGroupDisplayItem {
	return displayItem.kind === 'item-group'
}

function isIntentResolvedDisplayItem(
	resolved: PaletteResolvedDisplayItem | undefined
): resolved is DemoResolvedDisplayItem {
	return resolved?.kind === 'intent'
}

const SURFACE_COLOR = '#38bdf8'
const LINE_COLOR = '#a78bfa'
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

function regionSplitFromEvent(region: PaletteContainerRegion, event: DragEvent, element: HTMLElement) {
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

function resolveToolbarSpaceDropTarget(point: LocalDragPoint): PaletteToolbarDropTarget | undefined {
	return resolvePaletteToolbarSpaceDropTarget(toolbarDropTargets(), point)
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
		'[data-role="toolbar-item-drag-wrapper"], [data-role="item-drop-zone"], [data-role="toolbar-resize-handle"]'
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

function IntentLabel(props: { displayItem: PaletteIntentDisplayItem; resolved: DemoResolvedDisplayItem }) {
	return <span if={props.displayItem.showText !== false}>{labelFor(props.resolved)}</span>
}

function IntentShortcutText(props: { intentId: string }) {
	const computed = {
		get value() {
			return formatShortcut(palette.keys.getIntentKeystroke(props.intentId))
		},
	}
	return (
		<span if={computed.value} class="palette-shortcut">
			{computed.value}
		</span>
	)
}

function editorTooltip(entry: PaletteEntryDefinition): string | undefined {
	const label = entry.label
	const shortcut = formatShortcut(editorShortcut(entry.id))
	return shortcut ? `${label} (${shortcut})` : label
}

function intentTooltip(props: { resolved: DemoResolvedDisplayItem }): string | undefined {
	const label = labelFor(props.resolved)
	const shortcut = formatShortcut(palette.keys.getIntentKeystroke(props.resolved.intent.id))
	return shortcut ? `${label} (${shortcut})` : label
}

function buttonMarkup(props: DemoPresenterProps, marker = ''): PounceElement {
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

function allToolbarPaths(): readonly DemoToolbarPath[] {
	return REGION_ORDER.flatMap((region) =>
		container.toolbarStack[region].flatMap((track, trackIndex) =>
			track.slots.map((_, index) => ({ region, track: trackIndex, index }))
		)
	)
}

function toolbarPathId(path: DemoToolbarPath) {
	return `${path.region}:${path.track}:${path.index}`
}

function demoToolbar(path: DemoToolbarPath) {
	const toolbar = container.toolbarStack[path.region][path.track]?.slots[path.index]?.toolbar
	if (!toolbar) {
		throw new Error(`Toolbar '${toolbarPathId(path)}' not found`)
	}
	return toolbar
}

function toolbarPath(toolbar: PaletteToolbar): DemoToolbarPath | undefined {
	for (const region of REGION_ORDER) {
		for (let track = 0; track < container.toolbarStack[region].length; track += 1) {
			const index = container.toolbarStack[region][track].slots.findIndex((entry) => entry.toolbar === toolbar)
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
	return left?.region === right?.region && left?.track === right?.track && left?.index === right?.index
}

function toolbarPathFromId(toolbarId: string): DemoToolbarPath {
	const [region, rawTrack, rawIndex] = toolbarId.split(':')
	return { region: region as PaletteContainerRegion, track: Number(rawTrack), index: Number(rawIndex) }
}

function toolbarIntentItems(toolbar: PaletteToolbar) {
	return toolbar.items.filter(isIntentDisplayItem)
}

function toolbarDisplayItems(toolbar: PaletteToolbar) {
	return toolbar.items
}

function itemIdentity(displayItem: PaletteDisplayItem) {
	if (displayItem.kind === 'intent') return { id: displayItem.intentId, kind: displayItem.kind }
	if (displayItem.kind === 'item-group') return { id: displayItem.group.entryId, kind: displayItem.kind }
	return { id: displayItem.entryId, kind: displayItem.kind }
}

function resolvePresenter(displayItem: PaletteIntentDisplayItem, resolved: DemoResolvedDisplayItem): DemoPresenter {
	const family = getDisplayPresenterFamily(resolved.intent, resolved.entry)
	const fallbackKey = getDefaultDisplayPresenter(resolved.intent, resolved.entry)
	const presenterKey = displayItem.presenter ?? fallbackKey
	const presenter =
		DEMO_PRESENTERS[family][presenterKey] ?? DEMO_PRESENTERS[family][fallbackKey]
	if (!presenter) {
		throw new Error(`Presenter '${presenterKey}' not found in '${family}' presenter dictionary`)
	}
	return presenter
}

function presenterNames(family: PaletteDisplayPresenterFamily) {
	return Object.keys(DEMO_PRESENTERS[family]).join(', ')
}

function PresenterNamesText(props: { family: PaletteDisplayPresenterFamily }) {
	return <>{presenterNames(props.family)}</>
}

function entryPresenterFamily(entry: PaletteEntryDefinition): PaletteDisplayPresenterFamily {
	switch (entry.schema.type) {
		case 'action':
			return 'action'
		case 'status':
			return 'status'
		case 'boolean':
			return 'boolean'
		case 'enum':
			return 'enum'
		case 'number':
			return 'number'
	}
}

function defaultEditorPresenter(entry: PaletteEntryDefinition) {
	const configured = DEMO_EDITOR_DEFAULTS[entry.id]
	if (configured) return configured
	return DEMO_EDITOR_FAMILY_DEFAULTS[entryPresenterFamily(entry)]
}

function editorPresenterOptions(entry: PaletteEntryDefinition) {
	return DEMO_EDITOR_OPTIONS[entry.id] ?? DEMO_EDITOR_FAMILY_OPTIONS[entryPresenterFamily(entry)]
}

function editorShortcut(entryId: string) {
	return palette.keys.getEntryKeystroke(entryId)
}

function formatShortcut(shortcut: string | undefined) {
	return formatKeystroke(shortcut)
}

function shortcutIntent(event: KeyboardEvent) {
	return palette.keys
		.resolve(event)
		.find((binding) => binding.kind === 'intent')
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
	const entryBinding = palette.keys
		.resolve(event)
		.find((binding) => binding.kind === 'entry')
	if (!entryBinding || entryBinding.kind !== 'entry') return
	if (focusEditorShortcut(entryBinding.entryId)) {
		event.preventDefault()
	}
}

function bindDemoShortcuts(root: HTMLElement) {
	const onKeydown = (event: KeyboardEvent) => handleDemoShortcut(event)
	document.addEventListener('keydown', onKeydown)
	return () => document.removeEventListener('keydown', onKeydown)
}

const DEMO_EDITOR_RENDERERS: Readonly<Record<string, DemoEditorRenderer>> = {
	select: ({ entry, toolbar, selected, label, displayItem }) => {
		if (entry.schema.type !== 'enum') return undefined
		const options = entry.schema.options.map((option) =>
			typeof option === 'string' ? { value: option, label: option } : option
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
					value={String(palette.state[entry.id] ?? '')}
					disabled={container.editMode}
					update:value={(value: string) => {
						palette.state[entry.id] = value
					}}
					onClick={() => {
						if (container.editMode) openItemConfig(toolbar, displayItem.entryId, 'editor')
					}}
				>
					<for each={options}>
						{(option) => <option value={String(option.value)}>{option.label ?? String(option.value)}</option>}
					</for>
				</select>
			</label>
		)
	},
	stars: ({ entry, toolbar, selected, label, displayItem }) => {
		if (entry.schema.type !== 'number') return undefined
		void label
		return (
			<div
				class="palette-editor-shell palette-editor-shell-compact"
				data-selected={selected ? 'true' : undefined}
				data-palette-entry-id={entry.id}
				tabIndex={-1}
				title={editorTooltip(entry)}
				onClick={() => {
					if (container.editMode) openItemConfig(toolbar, displayItem.entryId, 'editor')
				}}
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
	slider: ({ entry, toolbar, selected, label, displayItem }) => {
		if (entry.schema.type !== 'number') return undefined
		const min = entry.schema.min ?? 0
		const max = entry.schema.max ?? 100
		const step = entry.schema.step ?? 1
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
					value={String(palette.state[entry.id] ?? min)}
					disabled={container.editMode}
					onInput={(event) => {
						if (event.currentTarget instanceof HTMLInputElement) {
							palette.state[entry.id] = Number(event.currentTarget.value)
						}
					}}
					onClick={() => {
						if (container.editMode) openItemConfig(toolbar, displayItem.entryId, 'editor')
					}}
				/>
			</label>
		)
	},
	default: ({ toolbar, selected, label, displayItem }) => (
		<button
			class="palette-editor-button"
			data-selected={selected ? 'true' : undefined}
			type="button"
			data-palette-entry-id={displayItem.entryId}
			onClick={() => openItemConfig(toolbar, displayItem.entryId, 'editor')}
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
			const current = itemConfigurator.current
			return (
				current !== undefined &&
				current.target.toolbar === props.toolbar &&
				current.target.identity.id === props.displayItem.entryId &&
				current.target.identity.kind === 'editor'
			)
		},
		get label() {
			return props.displayItem.showText === false
				? props.displayItem.entryId
				: computed.entry?.label
		},
		get shortcut() {
			return computed.entry ? formatShortcut(editorShortcut(computed.entry.id)) : undefined
		},
		get renderer() {
			return computed.entry
				? (DEMO_EDITOR_RENDERERS[props.displayItem.presenter ?? defaultEditorPresenter(computed.entry)] ??
					DEMO_EDITOR_RENDERERS.default)
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
				}) ?? DEMO_EDITOR_RENDERERS.default({
					displayItem: props.displayItem,
					entry: computed.entry,
					toolbar: props.toolbar,
					selected: computed.selected,
					label,
				})
			)
		},
	}
	return (
		<fragment if={computed.entry}>
			{computed.content}
		</fragment>
	)
}

function itemGroupOptionLabel(
	entry: PaletteEntryDefinition,
	index: number,
	option: string
) {
	if (entry.schema.type !== 'enum') return option
	const schemaOption = entry.schema.options[index]
	if (typeof schemaOption === 'string') return schemaOption
	return schemaOption.label ?? option
}

function itemGroupOptionIcon(entryId: string, option: string) {
	if (entryId === 'ui.theme') {
		switch (option) {
			case 'light':
				return '☀️'
			case 'dark':
				return '🌙'
			case 'system':
				return '💻'
			default:
				return '⚙️'
		}
	}
	return '⚙️'
}

function ItemGroupOptionIcon(props: { entryId: string; option: string }) {
	return <span>{itemGroupOptionIcon(props.entryId, props.option)}</span>
}

function ItemGroupOptionLabel(props: {
	displayItem: PaletteItemGroupDisplayItem
	entry: PaletteEntryDefinition
	index: number
	option: string
}) {
	return (
		<span if={props.displayItem.showText !== false}>
			{itemGroupOptionLabel(props.entry, props.index, props.option)}
		</span>
	)
}

function ItemGroupControl(props: {
	displayItem: PaletteItemGroupDisplayItem
	toolbar: PaletteToolbar
}) {
	const computed = {
		get resolved() {
			return palette.resolveDisplayItem(props.displayItem)
		},
		get identity() {
			return itemIdentity(props.displayItem)
		},
		get currentPath() {
			return requireToolbarPath(props.toolbar)
		},
		get selected() {
			const current = itemConfigurator.current
			return (
				current !== undefined &&
				current.target.toolbar === props.toolbar &&
				current.target.identity.id === computed.identity.id &&
				current.target.identity.kind === computed.identity.kind
			)
		},
		get entry() {
			return computed.resolved?.kind === 'item-group' ? computed.resolved.entry : undefined
		},
		get currentOption() {
			return palette.state[props.displayItem.group.entryId] as string | undefined
		},
	}

	// Render as a radio-button-group with individual option buttons
	return (
		<div
			if={computed.entry}
			class="palette-item-group"
			data-axis={regionAxis(computed.currentPath.region)}
			data-selected={computed.selected ? 'true' : undefined}
			onClick={() => {
				if (container.editMode) {
					openItemConfig(props.toolbar, computed.identity.id, computed.identity.kind)
					return
				}
			}}
		>
			<for each={props.displayItem.group.options}>
				{(option) => {
					const index = props.displayItem.group.options.indexOf(option)
					const isSelected = computed.currentOption === option

					return (
						<button
							class="palette-item-group-option"
							data-selected={isSelected ? 'true' : undefined}
							onClick={(e) => {
								e.stopPropagation()
								if (!container.editMode) {
									palette.run(`${props.displayItem.group.entryId}:set:${option}`)
								}
							}}
						>
							<ItemGroupOptionIcon entryId={props.displayItem.group.entryId} option={option} />
							<ItemGroupOptionLabel
								displayItem={props.displayItem}
								entry={computed.entry!}
								index={index}
								option={option}
							/>
						</button>
					)
				}}
			</for>
		</div>
	)
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
	return computeDisabledState(displayItem, resolved.intent, resolved.entry, palette.state)
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
		return `${match.intent.mode} • ${match.intent.id}${shortcut ? ` • ${formatShortcut(shortcut)}` : ''}`
	} else if (match.kind === 'grouped-proposition') {
		return `${match.type} • ${match.intents.length} intents${match.description ? ` • ${match.description}` : ''}`
	} else {
		return `entry • ${match.entry.id}${
			editorShortcut(match.entry.id) ? ` • ${formatShortcut(editorShortcut(match.entry.id))}` : ''
		}`
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
	return document.querySelector<HTMLElement>(`[data-role="region-space"][data-region="${region}"][data-index="${index}"]`)
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
		container.resizeToolbar(path.region, path.track, path.index, Math.min(1, Math.max(0, (toolbarStart - start) / available)))
		return
	}
	const start = beforeSpace.getBoundingClientRect().left
	const end = afterSpace.getBoundingClientRect().right
	if (end <= start) return
	const available = end - start - toolbarSpan
	if (available <= 0) return
	const toolbarStart = Math.min(Math.max(clientX - grabOffset, start), end - toolbarSpan)
	container.resizeToolbar(path.region, path.track, path.index, Math.min(1, Math.max(0, (toolbarStart - start) / available)))
}

function beginToolbarResize(toolbar: PaletteToolbar, event: MouseEvent) {
	if (!container.editMode) return
	if (isEditableTarget(event.target)) return
	event.preventDefault()
	event.stopPropagation()
	const handle = event.currentTarget as HTMLElement | null
	const toolbarElement = handle?.closest<HTMLElement>('[data-role="toolbar"]')
	if (!toolbarElement) return
	const toolbarRect = toolbarElement.getBoundingClientRect()
	const path = requireToolbarPath(toolbar)
	const vertical = isVerticalRegion(path.region)
	const grabOffset = vertical ? event.clientY - toolbarRect.top : event.clientX - toolbarRect.left
	const toolbarSpan = vertical ? toolbarRect.height : toolbarRect.width
	const onMousemove = (moveEvent: MouseEvent) => {
		moveEvent.preventDefault()
		resizeToolbarFromPointer(path, moveEvent.clientX, moveEvent.clientY, grabOffset, toolbarSpan)
	}
	const onMouseup = () => {
		document.removeEventListener('mousemove', onMousemove)
		document.removeEventListener('mouseup', onMouseup)
	}
	document.addEventListener('mousemove', onMousemove)
	document.addEventListener('mouseup', onMouseup)
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
	const grabOffset = axis === 'vertical'
		? event.clientY - toolbarRect.top
		: event.clientX - toolbarRect.left
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
			const target = mode === 'move' ? syncTarget(snapshot.current, resolveToolbarDropTarget) : undefined
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

function startItemDrag(toolbar: PaletteToolbar, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	demoUi.draggingItemToolbar = requireToolbarPath(toolbar)
	demoUi.draggingItemId = itemId
	demoUi.draggingItemKind = itemKind
}

function stopItemDrag() {
	demoUi.draggingItemToolbar = undefined
	demoUi.draggingItemId = undefined
	demoUi.draggingItemKind = undefined
}

function removeDemoToolbar(toolbar: PaletteToolbar) {
	container.removeToolbar(toolbar)
	if (itemConfigurator.current?.target.toolbar === toolbar) {
		closeItemConfig()
	}
}

function cloneDisplayItem(item: PaletteDisplayItem): PaletteDisplayItem {
	if (item.kind === 'item-group') {
		return {
			...item,
			group: {
				...item.group,
				options: [...item.group.options],
			},
		}
	}
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
					<button type="button" onClick={() => placeParkedToolbar(props.toolbar, 'top')}>Top</button>
					<button type="button" onClick={() => placeParkedToolbar(props.toolbar, 'right')}>Right</button>
					<button type="button" onClick={() => placeParkedToolbar(props.toolbar, 'bottom')}>Bottom</button>
					<button type="button" onClick={() => placeParkedToolbar(props.toolbar, 'left')}>Left</button>
					<button type="button" onClick={() => removeDemoToolbar(props.toolbar)}>Delete</button>
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

function displayItemFromDraggedCandidate(candidate: DemoDraggedPaletteItem): PaletteDisplayItem {
	if (candidate.kind === 'intent') {
		return { kind: 'intent', intentId: candidate.intent.intent.id }
	}
	if (candidate.kind === 'editor') {
		return { kind: 'editor', entryId: candidate.entry.entry.id }
	}
	return { kind: 'item-group', group: candidate.group }
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

function placeDraggedCandidateInRegion(
	candidate: DemoDraggedPaletteItem,
	region: PaletteContainerRegion,
	track: number,
	index: number,
	split = 0.5
) {
	const displayItem = displayItemFromDraggedCandidate(candidate)
	const toolbar = container.createToolbar(region, track)
	container.moveToolbar(toolbar, { region, track, index, split })
	customization.addToToolbar(toolbar, displayItem)
}

function openItemConfig(toolbar: PaletteToolbar, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	stopItemDrag()
	const item = toolbarDisplayItems(toolbar).find((displayItem) => {
		const identity = itemIdentity(displayItem)
		return identity.id === itemId && identity.kind === itemKind
	})
	if (!item) return
	const path = requireToolbarPath(toolbar)
	itemConfigurator.open(
		{
			toolbar,
			item,
			identity: getPaletteDisplayItemIdentity(item),
		},
		{ axis: regionAxis(path.region), region: path.region }
	)
}

function closeItemConfig() {
	stopItemDrag()
	itemConfigurator.close()
}

function moveToolbarItem(toolbar: PaletteToolbar, itemId: string, itemKind: PaletteDisplayItem['kind'], offset: number) {
	const items = toolbarDisplayItems(toolbar)
	const currentIndex = items.findIndex((displayItem: PaletteDisplayItem) => {
		const identity = itemIdentity(displayItem)
		return identity.id === itemId && identity.kind === itemKind
	})
	const nextIndex = currentIndex + offset
	if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return
	customization.moveWithinToolbar(toolbar, items[currentIndex], nextIndex)
}

function placeDraggedItem(targetPath: DemoToolbarPath, index: number) {
	if (!demoUi.draggingItemToolbar || !demoUi.draggingItemId || !demoUi.draggingItemKind) return
	const targetToolbar = demoToolbar(targetPath)
	const sourceToolbar = demoToolbar(demoUi.draggingItemToolbar)
	const draggedItem = toolbarDisplayItems(sourceToolbar).find(
		(displayItem: PaletteDisplayItem) => {
		const identity = itemIdentity(displayItem)
		return identity.id === demoUi.draggingItemId && identity.kind === demoUi.draggingItemKind
		}
	)
	if (!draggedItem) return
	if (sourceToolbar === targetToolbar) {
		customization.moveWithinToolbar(targetToolbar, draggedItem, index)
		stopItemDrag()
		return
	}
	customization.moveToToolbar(sourceToolbar, draggedItem, targetToolbar, index)
	stopItemDrag()
}

function acceptsRegionStakePayload(payload: unknown): payload is { type: 'toolbar'; toolbarPath: DemoToolbarPath } | { type: 'item'; candidate: DemoDraggedPaletteItem } {
	if (!payload || typeof payload !== 'object') return false
	const candidate = payload as { type?: string; toolbarPath?: DemoToolbarPath; candidate?: DemoDraggedPaletteItem }
	if (candidate.type === 'toolbar') return candidate.toolbarPath !== undefined
	if (candidate.type === 'item') return candidate.candidate !== undefined
	return false
}

function acceptsToolbarItemPayload(
	payload: unknown
): payload is
	| { type: 'item'; sourceToolbarPath: DemoToolbarPath; sourceItemId: string; sourceItemKind: PaletteDisplayItem['kind'] }
	| { type: 'item'; candidate: DemoDraggedPaletteItem } {
	if (!payload || typeof payload !== 'object') return false
	const candidate = payload as {
		type?: string
		sourceToolbarPath?: DemoToolbarPath
		sourceItemId?: string
		sourceItemKind?: PaletteDisplayItem['kind']
		candidate?: DemoDraggedPaletteItem
	}
	if (candidate.type !== 'item') return false
	return (
		candidate.candidate !== undefined ||
		(candidate.sourceToolbarPath !== undefined &&
			typeof candidate.sourceItemId === 'string' &&
			candidate.sourceItemKind !== undefined)
	)
}

function placeItemPayload(
	toolbarId: string,
	index: number,
	payload:
		| { type: 'item'; candidate: DemoDraggedPaletteItem }
		| { type: 'item'; sourceToolbarPath: DemoToolbarPath; sourceItemId: string; sourceItemKind: PaletteDisplayItem['kind'] }
) {
	const targetPath = toolbarPathFromId(toolbarId)
	if ('candidate' in payload) {
		const toolbar = demoToolbar(targetPath)
		customization.addToToolbar(toolbar, displayItemFromDraggedCandidate(payload.candidate), index)
		return
	}
	demoUi.draggingItemToolbar = payload.sourceToolbarPath
	demoUi.draggingItemId = payload.sourceItemId
	demoUi.draggingItemKind = payload.sourceItemKind
	placeDraggedItem(targetPath, index)
}

function spliceToolbarIntoToolbar(sourcePath: DemoToolbarPath, targetPath: DemoToolbarPath, index: number) {
	if (sameToolbarPath(sourcePath, targetPath)) return
	const sourceItems = [...demoToolbar(sourcePath).items]
	let insertionIndex = index
	for (const item of sourceItems) {
		const sourceToolbar = demoToolbar(sourcePath)
		const targetToolbar = demoToolbar(targetPath)
		customization.moveToToolbar(sourceToolbar, item, targetToolbar, insertionIndex)
		insertionIndex += 1
	}
	stopToolbarDrag()
}

function cycleToolbarPresenter(toolbar: PaletteToolbar, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	const item = toolbarDisplayItems(toolbar).find((displayItem) => {
		const identity = itemIdentity(displayItem)
		return identity.id === itemId && identity.kind === itemKind
	})
	if (!item) return
	let options: readonly string[] = []
	let current: string = ''
	if (item.kind === 'intent') {
		const resolved = palette.resolveDisplayItem(item)
		if (!isIntentResolvedDisplayItem(resolved)) return
		const family = getDisplayPresenterFamily(resolved.intent, resolved.entry)
		options = Object.keys(DEMO_PRESENTERS[family]).filter((key) => key !== 'default')
		current = item.presenter ?? getDefaultDisplayPresenter(resolved.intent, resolved.entry)
	} else if (item.kind === 'editor') {
		const entry = palette.resolveEntry(item.entryId)
		if (!entry) return
		options = editorPresenterOptions(entry)
		current = item.presenter ?? defaultEditorPresenter(entry)
	} else if (item.kind === 'item-group') {
		const entry = palette.resolveEntry(item.group.entryId)
		if (!entry) return
		options = Object.keys(DEMO_PRESENTERS.enum).filter((key) => key !== 'default')
		current = item.group.presenter ?? 'radio-group'
	}
	const currentIndex = options.indexOf(current)
	const next = options[(currentIndex + 1) % options.length]
	customization.setPresenter(toolbar, item, next)
}

function removeToolbarItem(toolbar: PaletteToolbar, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	const item = toolbarDisplayItems(toolbar).find((displayItem) => {
		const identity = itemIdentity(displayItem)
		return identity.id === itemId && identity.kind === itemKind
	})
	if (!item) return
	customization.removeFromToolbar(toolbar, item)
	const current = itemConfigurator.current
	if (
		current &&
		current.target.identity.id === itemId &&
		current.target.identity.kind === itemKind &&
		current.target.toolbar === toolbar
	) {
		closeItemConfig()
	}
}

function toolbarMoveTargets(toolbar: PaletteToolbar) {
	return allToolbarPaths()
		.map((path) => ({ path, toolbar: demoToolbar(path) }))
		.filter((entry) => entry.toolbar !== toolbar)
		.map(({ path, toolbar: targetToolbar }) => ({
			id: toolbarPathId(path),
			label: `${targetToolbar.title ?? toolbarPathId(path)} • ${path.region}`,
		}))
}

function moveToolbarItemToToolbar(
	toolbar: PaletteToolbar,
	itemId: string,
	itemKind: PaletteDisplayItem['kind'],
	targetToolbarId: string
) {
	const sourceToolbar = toolbar
	const targetToolbar = demoToolbar(toolbarPathFromId(targetToolbarId))
	const item = toolbarDisplayItems(toolbar).find((displayItem) => {
		const identity = itemIdentity(displayItem)
		return identity.id === itemId && identity.kind === itemKind
	})
	if (!item) return
	customization.moveToToolbar(sourceToolbar, item, targetToolbar)
	const current = itemConfigurator.current
	if (
		current &&
		current.target.identity.id === itemId &&
		current.target.identity.kind === itemKind &&
		current.target.toolbar === toolbar
	) {
		itemConfigurator.moveToToolbar(targetToolbar)
	}
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
		get position() { return toolbarPath(props.toolbar) },
		get toolbarId() { return this.position ? toolbarPathId(this.position) : 'missing' },
		get dragging() { return sameToolbarPath(demoUi.draggingToolbar, this.position) }
	}

	return (
		<div if={computed.position}
			class="palette-toolbar-line"
			data-role="toolbar"
			data-region={computed.position!.region}
			data-axis={regionAxis(computed.position!.region)}
			data-toolbar-id={computed.toolbarId}
			data-test={`palette-toolbar-${computed.toolbarId}`}
			data-dragging={computed.dragging ? 'true' : undefined}
			onMousedown={(event: MouseEvent) => beginToolbarMove(props.toolbar, event)}
		>
			<ToolbarItemInsertionPoint toolbarId={computed.toolbarId} index={0} />
			<for each={props.toolbar.items}>
				{(displayItem) => {
					const identity = itemIdentity(displayItem)
					const currentIndex = props.toolbar.items.findIndex((entry) => {
						const entryIdentity = itemIdentity(entry)
						return entryIdentity.id === identity.id && entryIdentity.kind === identity.kind
					})
					let content: PounceElement | undefined
					if (isEditorDisplayItem(displayItem)) {
						content = <EditorItem displayItem={displayItem} toolbar={props.toolbar} />
					} else if (isIntentDisplayItem(displayItem)) {
						const resolved = palette.resolveDisplayItem(displayItem)
						if (isIntentResolvedDisplayItem(resolved)) {
							const checked = computeCheckedState(displayItem, resolved.intent, resolved.entry, palette.state)
							const disabled = isDemoDisabled(displayItem, resolved)
							const presenter = resolvePresenter(displayItem, resolved)
							content = presenter({
								displayItem,
								resolved,
								checked,
								disabled,
								onActivate: () => {
									if (container.editMode) {
										openItemConfig(props.toolbar, displayItem.intentId, 'intent')
										return
									}
									palette.run(resolved.intent.id)
								},
							})
						}
					} else if (isItemGroupDisplayItem(displayItem)) {
						content = <ItemGroupControl displayItem={displayItem} toolbar={props.toolbar} />
					}
					if (!content) return undefined
					return (
						<>
							<div
								class="palette-toolbar-item-shell"
								data-role="toolbar-item-drag-wrapper"
								data-toolbar-id={computed.toolbarId}
								data-item-id={identity.id}
								data-item-kind={identity.kind}
								data-dragging={
									sameToolbarPath(demoUi.draggingItemToolbar, computed.position) &&
									demoUi.draggingItemId === identity.id &&
									demoUi.draggingItemKind === identity.kind
										? 'true'
										: undefined
								}
								data-test={`palette-toolbar-item-${computed.toolbarId}-${identity.kind}-${identity.id}`}
								use:drag={{
									payload: () => ({
										type: 'item' as const,
										sourceToolbarPath: computed.position,
										sourceItemId: identity.id,
										sourceItemKind: identity.kind,
									}),
									onStart: () => {
										if (container.editMode) startItemDrag(props.toolbar, identity.id, identity.kind)
									},
									onEnd: (_payload: unknown, didDrop: boolean) => {
										if (!container.editMode) return
										if (!didDrop) {
											removeToolbarItem(props.toolbar, identity.id, identity.kind)
										}
										stopItemDrag()
									},
								}}
							>
								{content}
								<div
									if={
										itemConfigurator.current !== undefined &&
										itemConfigurator.current.target.toolbar === props.toolbar &&
										itemConfigurator.current.target.identity.id === identity.id &&
										itemConfigurator.current.target.identity.kind === identity.kind
									}
									class="palette-config-popup"
									data-role="config-panel"
									data-test="palette-config-panel"
								>
									<ConfigPanel />
								</div>
							</div>
							<ToolbarItemInsertionPoint toolbarId={computed.toolbarId} index={currentIndex + 1} />
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
				container.toolbarStack[props.region][props.track]?.slots ?? []
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
				const split = regionSplitFromEvent(computed.region, event, event.currentTarget as HTMLElement)
				if (payload.type === 'toolbar') {
					placeToolbarAt(computed.region, computed.track, computed.index, split)
					return
				}
				placeDraggedCandidateInRegion(payload.candidate, computed.region, computed.track, computed.index, split)
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

function ToolbarItemInsertionPoint(props: { toolbarId: string; index: number }) {
	const computed = {
		get targetPath() { return toolbarPathFromId(props.toolbarId) },
		get region() { return this.targetPath.region }
	}
	return (
		<button
			if={container.editMode}
			class="palette-drop-zone palette-item-drop-zone"
			data-role="item-drop-zone"
			data-toolbar-id={props.toolbarId}
			data-region={computed.region}
			data-axis={regionAxis(computed.region)}
			data-index={String(props.index)}
			data-test={`palette-item-drop-zone-${props.toolbarId}-${props.index}`}
			use:drop={(payload: unknown) => {
				if (acceptsToolbarItemPayload(payload)) {
					placeItemPayload(props.toolbarId, props.index, payload)
				}
				if (payload && typeof payload === 'object' && 'type' in payload) {
					const toolbarPayload = payload as { type?: string; toolbarPath?: DemoToolbarPath }
					if (toolbarPayload.type === 'toolbar' && toolbarPayload.toolbarPath !== undefined) {
						spliceToolbarIntoToolbar(toolbarPayload.toolbarPath, computed.targetPath, props.index)
					}
				}
			}}
			use:dragging={(payload: unknown, isEnter: boolean, el: HTMLElement) => {
				const accepts =
					acceptsToolbarItemPayload(payload) ||
					(payload && typeof payload === 'object' && 'type' in payload && (payload as { type?: string }).type === 'toolbar')
				if (!accepts) return false
				if (isEnter) {
					el.dataset.active = 'true'
					return () => {
						delete el.dataset.active
					}
				}
			}}
			title="Drop item here"
		/>
	)
}

function toggleEditMode() {
	if (container.editMode) {
		container.exitEditMode()
		closeItemConfig()
		stopToolbarDrag()
		demoUi.handleExpanded = false
		return
	}
	container.enterEditMode()
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
			return props.region === 'top' || container.editMode || computed.tracks.some((track) => track.slots.length > 0)
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
											toolbarCount={entry.track.slots.length}
										/>
										{point.index < entry.track.slots.length
											? <ToolbarStrip toolbar={entry.track.slots[point.index].toolbar} />
											: undefined}
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

function configuredToolbarItem() {
	const current = itemConfigurator.current
	if (!current) return undefined
	return { item: current.target.item, resolved: current.resolved }
}

function configuredItemLabel() {
	const configured = configuredToolbarItem()
	if (!configured) return undefined
	if (configured.resolved.kind === 'intent') {
		return configured.resolved.intent.label ?? configured.resolved.intent.id
	}
	return configured.resolved.entry.label
}

function configuredItemMeta() {
	return itemConfigurator.current?.subtitle
}

function ConfiguredItemLabelText() {
	return <>{configuredItemLabel()}</>
}

function ConfiguredItemMetaText() {
	return <>{configuredItemMeta()}</>
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
				<div><CommandResultLabel match={props.match} /></div>
				<div class="palette-command-result-meta"><CommandResultMeta match={props.match} /></div>
			</button>
			<button
				class="palette-command-drag"
				data-role="command-drag"
				data-result-kind={props.match.kind}
				data-test={`palette-command-drag-${computed.resultIndex}`}
				data-selected={computed.selected ? 'true' : undefined}
				use:drag={() => {
					let candidate
					if (props.match.kind === 'intent') {
						candidate = { kind: 'intent' as const, intent: props.match }
					} else if (props.match.kind === 'grouped-proposition') {
						if (props.match.type === 'enum-subset' && props.match.entries.length > 0) {
							candidate = {
								kind: 'item-group' as const,
								group: {
									kind: 'enum-options' as const,
									entryId: props.match.entries[0].entry.id,
									options: props.match.intents.map((intent: PaletteResolvedIntent) => {
										const parts = intent.intent.id.split(':')
										return parts[parts.length - 1]
									}),
									presenter: 'radio-group' as const,
								},
							}
						}
					} else {
						candidate = { kind: 'editor' as const, entry: props.match }
					}
					return { type: 'item', candidate }
				}}
				title="Drag to add to toolbar"
			>
				⋮⋮
			</button>
		</div>
	)
}

function ConfigPanel() {
	const computed = {
		get descriptor() {
			return itemConfigurator.current
		},
	}

	return (
		<div if={computed.descriptor} class="palette-config-body" data-role="config-body">
			<div class="palette-config-header" data-role="config-header">
				<strong><ConfiguredItemLabelText /></strong>
				<button onClick={closeItemConfig}>Close</button>
			</div>
			<div class="palette-config-meta">{computed.descriptor!.target.identity.id}</div>
			<div class="palette-config-meta"><ConfiguredItemMetaText /></div>
			<div class="palette-config-actions" data-role="config-actions">
				<button onClick={() => itemConfigurator.moveBackward()} disabled={!computed.descriptor!.canMoveBackward}>←</button>
				<button onClick={() => itemConfigurator.moveForward()} disabled={!computed.descriptor!.canMoveForward}>→</button>
				<for each={computed.descriptor!.presenterChoices}>
					{(choice) => (
						<button
							data-selected={choice.selected ? 'true' : undefined}
							onClick={() => itemConfigurator.setPresenter(choice.id)}
						>
							{choice.label}
						</button>
					)}
				</for>
				<button onClick={() => itemConfigurator.remove()} disabled={!computed.descriptor!.removable}>Remove</button>
			</div>
			<div if={computed.descriptor!.moveTargets.length > 0} class="palette-config-target-section" data-role="config-target-section">
				<strong class="palette-config-target-title">Move to toolbar</strong>
				<div class="palette-config-move-targets" data-role="config-move-targets">
					<for each={computed.descriptor!.moveTargets}>
						{(target) => (
							<button onClick={() => itemConfigurator.moveToToolbar(target.toolbar)}>
								{target.label}
							</button>
						)}
					</for>
				</div>
			</div>
		</div>
	)
}

function CommandPanel() {
	return (
		<div class="palette-command-overlay" data-role="command-overlay" data-test="palette-command-overlay">
			<div class="palette-command-panel" data-role="command-panel" data-test="palette-command-panel">
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
										handlePaletteCommandChipKeydown({ commandBox, event, token: category, type: 'category' })
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

					<div if={commandBox.suggestions.length > 0} class="palette-command-suggestions" data-role="command-suggestions">
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

					<div class="palette-command-results" data-role="command-results" data-test="palette-command-results">
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
					The root `palette-demo` node is now the toolbared container. The center content
					scrolls independently while toolbars live on the shell.
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
								<div class="palette-demo-meta"><PresenterNamesText family={family} /></div>
							</div>
						)}
					</for>
				</div>
			</div>

			<div>
				<h3 class="palette-demo-section-title">Numeric Control</h3>
				<div class="palette-demo-panel">
					<div class="palette-demo-panel-copy">
						`game.speed` can be paused via stash and edited directly through the headless
						stars model rendered with play-arrow glyphs.
					</div>
					<div data-test="palette-speed-stars" class="palette-demo-speed-stars" {...speedStars.container}>
						<for each={speedStars.starItems}>
							{(item) => (
								<span data-test={`palette-speed-star-${item.index + 1}`} {...item.el}>
									<StarGlyphText status={item.status} />
								</span>
							)}
						</for>
					</div>
					<div class="palette-demo-panel-meta">Selected speed: {String(palette.state['game.speed'])}</div>
				</div>
			</div>

			<div>
				<h3 class="palette-demo-section-title">Live State</h3>
				<div class="palette-demo-card-grid">
					<div class="palette-demo-card">
						<strong>Boolean checkbutton</strong>
						<div class="palette-demo-meta">ui.notifications = {String(palette.state['ui.notifications'])}</div>
					</div>
					<div class="palette-demo-card">
						<strong>Enum radiobutton group</strong>
						<div class="palette-demo-meta">ui.theme = {String(palette.state['ui.theme'])}</div>
					</div>
					<div class="palette-demo-card">
						<strong>Enum flip button</strong>
						<div class="palette-demo-meta">ui.layout = {String(palette.state['ui.layout'])}</div>
					</div>
					<div class="palette-demo-card">
						<strong>Numeric step</strong>
						<div class="palette-demo-meta">editor.fontSize = {String(palette.state['editor.fontSize'])}</div>
					</div>
					<div class="palette-demo-card">
						<strong>Numeric stash</strong>
						<div class="palette-demo-meta">game.speed = {String(palette.state['game.speed'])}</div>
					</div>
				</div>
			</div>

			<div>
				<h3 class="palette-demo-section-title">Reactive Objects</h3>
				<div class="palette-demo-object-grid">
					<div class="palette-demo-card">
						<strong>state</strong>
						<pre class="palette-demo-pre">{JSON.stringify(palette.state, null, 2)}</pre>
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

function presenterSummary(toolbar: PaletteToolbar, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	const displayItem = toolbarDisplayItems(toolbar).find((entry) => {
		const identity = itemIdentity(entry)
		return identity.id === itemId && identity.kind === itemKind
	})
	const resolved = displayItem ? palette.resolveDisplayItem(displayItem) : undefined
	if (!displayItem || !resolved) return undefined
	if (displayItem.kind === 'intent' && resolved.kind === 'intent') {
		const family = getDisplayPresenterFamily(resolved.intent, resolved.entry)
		const presenter = displayItem.presenter ?? getDefaultDisplayPresenter(resolved.intent, resolved.entry)
		return `${family}.${presenter}`
	}
	const family = entryPresenterFamily(resolved.entry)
	const presenter = displayItem.presenter ?? defaultEditorPresenter(resolved.entry)
	return `${family}.${presenter}`
}

export default function PaletteDemo(_: {}, scope: { drag?: typeof drag; drop?: typeof drop; dragging?: typeof dragging }) {
	Object.assign(scope, { drag, drop, dragging })
	return (
		<div
			data-test="palette-demo"
			class={['palette-demo-root', {
				'is-editing': container.editMode,
				'is-dragging-toolbar': !!demoUi.draggingToolbar,
				'is-dragging-item': !!demoUi.draggingItemToolbar
			}]}
			data-role="toolbared-container"
			use={bindDemoShortcuts}
			style="--palette-handle-size: 10px;"
		>
			<button
				class="palette-edit-toggle"
				data-expanded={container.editMode || demoUi.handleExpanded ? 'true' : undefined}
				data-editing={container.editMode ? 'true' : undefined}
				data-test="palette-edit-toggle"
				onMouseenter={() => (demoUi.handleExpanded = true)}
				onMouseleave={() => {
					if (!container.editMode) demoUi.handleExpanded = false
				}}
				onClick={toggleEditMode}
			>
				{container.editMode ? 'Done' : demoUi.handleExpanded ? 'Edit' : '✎'}
			</button>

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
		min-width: 0;
		min-height: 0;
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

	.palette-region-layout.palette-axis-horizontal .palette-track-shell {
		flex: 1 1 auto;
	}

	.palette-region-layout.palette-axis-vertical .palette-track-shell {
		flex: 1 1 auto;
		flex-direction: column;
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

	.palette-edit-toggle {
		position: absolute;
		top: 10px;
		left: 10px;
		z-index: 4;
		width: 18px;
		height: 18px;
		border: 1px solid #334155;
		border-radius: 12px;
		background: #111827;
		color: #e2e8f0;
		cursor: pointer;
		overflow: hidden;
		transition: width 120ms ease, height 120ms ease, background 120ms ease, border-color 120ms ease;
	}

	.palette-edit-toggle[data-expanded='true'] {
		width: 76px;
		height: 36px;
	}

	.palette-edit-toggle[data-editing='true'] {
		border-color: #60a5fa;
		background: #1d4ed8;
	}

	.palette-item-drop-zone {
		flex: 0 0 auto;
		align-self: stretch;
		border: 1px dashed ${DROP_ZONE_COLOR}77;
		border-radius: 999px;
		background: ${DROP_ZONE_COLOR}12;
		cursor: copy;
		opacity: 1;
		box-shadow: inset 0 0 0 1px transparent;
		transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
	}

	.palette-item-drop-zone[data-active='true'] {
		border-color: ${DROP_ZONE_COLOR};
		background: ${DROP_ZONE_COLOR}22;
		box-shadow: inset 0 0 0 1px ${DROP_ZONE_COLOR}44;
	}

	.palette-region-layout.palette-axis-horizontal .palette-item-drop-zone {
		width: var(--palette-handle-size);
		min-width: var(--palette-handle-size);
		height: 100%;
		min-height: var(--palette-handle-size);
	}

	.palette-region-layout.palette-axis-vertical .palette-item-drop-zone {
		width: 100%;
		min-width: 100%;
		height: var(--palette-handle-size);
		min-height: var(--palette-handle-size);
	}
`