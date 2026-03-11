import type { PounceElement } from '@pounce/core'
import { reactive } from 'mutts'
import {
	paletteAddItemModel,
	computeCheckedState,
	computeDisabledState,
	createPaletteModel,
	getDefaultDisplayPresenter,
	getDisplayPresenterFamily,
	paletteCommandBoxModel,
	paletteContainerModel,
	paletteDisplayCustomizationModel,
	type PaletteAddItemCandidate,
	type PaletteContainerRegion,
	type PaletteDisplayItem,
	type PaletteDisplayPresenterFamily,
	type PaletteEditorDisplayItem,
	type PaletteEntryDefinition,
	type PaletteIntentDisplayItem,
	type PaletteItemGroupDisplayItem,
	type PaletteMatch,
	type PaletteResolvedDisplayItem,
	type PaletteToolbarDefinition,
} from '@pounce/ui/palette'
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
	readonly toolbarId: string
	readonly selected: boolean
	readonly label: string
}

type DemoEditorRenderer = (props: DemoEditorRendererProps) => PounceElement | undefined

type DemoUiState = {
	handleExpanded: boolean
	addRegion: PaletteContainerRegion | undefined
	addToolbarId: string | undefined
	addQuery: string
	movingToolbarId: string | undefined
	draggingToolbarId: string | undefined
	draggingItemToolbarId: string | undefined
	draggingItemId: string | undefined
	draggingItemKind: PaletteDisplayItem['kind'] | undefined
	configToolbarId: string | undefined
	configItemId: string | undefined
	configItemKind: PaletteDisplayItem['kind'] | undefined
}

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
			binding: 'Alt+L',
		},
		{
			id: 'game.speed:stash:0',
			targetId: 'game.speed',
			mode: 'stash',
			value: 0,
			label: 'Pause / Resume',
			binding: 'Space',
			fallback: { kind: 'step', step: 0.5 },
		},
	],
	state: {
		'ui.notifications': true,
		'ui.theme': 'light',
		'ui.layout': 'horizontal',
		'editor.fontSize': 14,
		'game.speed': 1,
	},
	display: {
		toolbars: [
			{
				id: 'palette-top',
				items: [
					{ kind: 'intent', intentId: 'ui.notifications:toggle', presenter: 'toggle', showText: false },
					{ kind: 'intent', intentId: 'ui.theme:set:light', presenter: 'radio', showText: false },
					{ kind: 'intent', intentId: 'ui.theme:set:dark', presenter: 'radio', showText: false },
					{ kind: 'intent', intentId: 'ui.layout:flip', presenter: 'flip', showText: false },
				],
			},
			{
				id: 'palette-left',
				items: [
					// Item-group demonstration: light/dark theme pair - visual only
					{
						kind: 'item-group',
						group: {
							kind: 'enum-options',
							entryId: 'ui.theme',
							options: ['light', 'dark'],
							presenter: 'radio-group',
						},
						showText: false, // Make it purely visual with icons
					},
					{ kind: 'editor', entryId: 'ui.theme', presenter: 'select', showText: false },
					{ kind: 'intent', intentId: 'ui.theme:set:system', presenter: 'radio', showText: false },
					{ kind: 'intent', intentId: 'editor.fontSize:step:up', presenter: 'step', showText: false },
				],
			},
			{
				id: 'palette-right',
				items: [
					{ kind: 'editor', entryId: 'editor.fontSize', presenter: 'slider', showText: true },
					{ kind: 'intent', intentId: 'editor.fontSize:step:down', presenter: 'step', showText: true },
					{ kind: 'intent', intentId: 'editor.fontSize:step:up', presenter: 'step', showText: true },
				],
			},
			{
				id: 'palette-bottom',
				items: [
					{ kind: 'intent', intentId: 'game.speed:step:down', presenter: 'step', showText: true },
					{ kind: 'editor', entryId: 'game.speed', presenter: 'stars', showText: true },
					{ kind: 'intent', intentId: 'game.speed:step:up', presenter: 'step', showText: true },
					{ kind: 'intent', intentId: 'game.speed:stash:0', presenter: 'stash', showText: true },
				],
			},
		],
		container: {
			editMode: false,
			surfaces: [
				{
					id: 'palette-top',
					type: 'toolbar',
					region: 'top',
					visible: true,
					position: 0,
					label: 'Main Toolbar',
				},
				{
					id: 'palette-left',
					type: 'toolbar',
					region: 'left',
					visible: true,
					position: 0,
					label: 'Theme Rail',
				},
				{
					id: 'palette-right',
					type: 'toolbar',
					region: 'right',
					visible: true,
					position: 0,
					label: 'Editor Rail',
				},
				{
					id: 'palette-bottom',
					type: 'toolbar',
					region: 'bottom',
					visible: true,
					position: 0,
					label: 'Playback Bar',
				},
			],
			dropTargets: [],
		},
	},
})

const commandBox = paletteCommandBoxModel({
	palette,
	placeholder: 'Search commands and settings, or type categories like ui action…',
})
const addItem = paletteAddItemModel({ palette })
const container = paletteContainerModel({ palette })
const customization = paletteDisplayCustomizationModel({ palette })
const demoUi: DemoUiState = reactive({
	handleExpanded: false,
	addRegion: undefined,
	addToolbarId: undefined,
	addQuery: '',
	movingToolbarId: undefined,
	draggingToolbarId: undefined,
	draggingItemToolbarId: undefined,
	draggingItemId: undefined,
	draggingItemKind: undefined,
	configToolbarId: undefined,
	configItemId: undefined,
	configItemKind: undefined,
})
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
	onChange(value: StarsValue) {
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
const DEMO_EDITOR_SHORTCUTS: Readonly<Partial<Record<string, string>>> = {
	'ui.theme': 'Ctrl+T',
	'game.speed': 'G',
}
const DEMO_SHORTCUT_POLICY = {
	separator: '+',
	labels: {
		Ctrl: 'Ctrl',
		Alt: 'Alt',
		Shift: 'Shift',
		Meta: 'Meta',
		Space: 'Space',
	},
} as const
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
	left: 'grid-column: 1; grid-row: 2; min-width: 220px; max-width: 260px; min-height: 0;',
	right: 'grid-column: 3; grid-row: 2; min-width: 240px; max-width: 300px; min-height: 0;',
	bottom: 'grid-column: 1 / 4; grid-row: 3; min-width: 0; min-height: 0;',
} satisfies Record<PaletteContainerRegion, string>
const REGION_ORDER: readonly PaletteContainerRegion[] = ['top', 'left', 'right', 'bottom']

function isIntentDisplayItem(displayItem: PaletteToolbarDefinition['items'][number]): displayItem is PaletteIntentDisplayItem {
	return displayItem.kind === 'intent'
}

function isEditorDisplayItem(displayItem: PaletteToolbarDefinition['items'][number]): displayItem is PaletteEditorDisplayItem {
	return displayItem.kind === 'editor'
}

function isItemGroupDisplayItem(displayItem: PaletteToolbarDefinition['items'][number]): displayItem is PaletteItemGroupDisplayItem {
	return displayItem.kind === 'item-group'
}

function isIntentResolvedDisplayItem(
	resolved: PaletteResolvedDisplayItem | undefined
): resolved is DemoResolvedDisplayItem {
	return resolved?.kind === 'intent'
}

function tone(active: boolean, disabled: boolean) {
	if (disabled) return 'background: #1f2937; border-color: #334155; color: #64748b;'
	if (active) return 'background: #1d4ed8; border-color: #60a5fa; color: #eff6ff;'
	return 'background: #0f172a; border-color: #475569; color: #e2e8f0;'
}

function regionShellStyle(region: PaletteContainerRegion) {
	const vertical = region === 'left' || region === 'right'
	return `display: flex; flex-direction: ${vertical ? 'column' : 'row'}; flex-wrap: ${vertical ? 'nowrap' : 'wrap'}; gap: 8px; min-height: ${vertical ? '100%' : 'unset'}; padding: 12px; border-radius: 14px; background: #111827; border: 1px solid #1f2937;`
}

function labelFor(resolved: DemoResolvedDisplayItem) {
	return resolved.intent.label ?? resolved.entry.label
}

function iconFor(resolved: DemoResolvedDisplayItem) {
	return typeof resolved.entry.icon === 'string' ? `${resolved.entry.icon} ` : ''
}

function buttonMarkup(props: DemoPresenterProps, marker = ''): PounceElement {
	return (
		<button
			data-test={props.resolved.intent.id}
			disabled={props.disabled}
			onClick={props.onActivate}
			style={`padding: 8px 12px; border: 1px solid; border-radius: 8px; cursor: ${props.disabled ? 'not-allowed' : 'pointer'}; ${tone(props.checked, props.disabled)}`}
		>
			<span if={marker}>{marker} </span>
			<span if={iconFor(props.resolved)}>{iconFor(props.resolved)}</span>
			<span if={props.displayItem.showText !== false}>{labelFor(props.resolved)}</span>
			<span if={props.resolved.intent.binding} style="margin-left: 8px; color: #94a3b8; font-size: 12px;">
				{formatShortcut(props.resolved.intent.binding)}
			</span>
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

function demoToolbar(toolbarId = 'palette-top') {
	const toolbar = palette.display.toolbars.find((entry) => entry.id === toolbarId)
	if (!toolbar) {
		throw new Error(`Toolbar '${toolbarId}' not found`)
	}
	return toolbar
}

function toolbarIntentItems(toolbarId: string) {
	return demoToolbar(toolbarId).items.filter(isIntentDisplayItem)
}

function toolbarDisplayItems(toolbarId: string) {
	return demoToolbar(toolbarId).items
}

function itemIdentity(displayItem: PaletteDisplayItem) {
	if (displayItem.kind === 'intent') {
		return { id: displayItem.intentId, kind: displayItem.kind }
	}
	if (displayItem.kind === 'item-group') {
		// For item-groups, include entryId, group.kind, and options hash for unique identity
		const optionsHash = [...displayItem.group.options].sort().join('|')
		return { id: `group:${displayItem.group.entryId}:${displayItem.group.kind}:${optionsHash}`, kind: displayItem.kind }
	}
	// editor and other kinds
	return { id: displayItem.entryId, kind: displayItem.kind }
}

function toolbarSurfacePosition(toolbarId: string) {
	const surface = container.surfaces.find((entry) => entry.id === toolbarId && entry.type === 'toolbar')
	if (!surface) return undefined
	return {
		region: surface.region,
		index: surface.position ?? 0,
	}
}

function toolbarContainsItem(toolbarId: string, candidate: PaletteAddItemCandidate) {
	return toolbarDisplayItems(toolbarId).some((displayItem) => {
		return addItem.matchesDisplayItem(displayItem, candidate)
	})
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
	return DEMO_EDITOR_SHORTCUTS[entryId]
}

function formatShortcut(shortcut: string | undefined) {
	if (!shortcut) return undefined
	return shortcut
		.split(DEMO_SHORTCUT_POLICY.separator)
		.map((part) => DEMO_SHORTCUT_POLICY.labels[part as keyof typeof DEMO_SHORTCUT_POLICY.labels] ?? part)
		.join(DEMO_SHORTCUT_POLICY.separator)
}

function normalizedShortcutParts(shortcut: string) {
	return shortcut
		.split(DEMO_SHORTCUT_POLICY.separator)
		.map((part) => part.trim().toLowerCase())
		.filter(Boolean)
}

function shortcutMatchesEvent(shortcut: string, event: KeyboardEvent) {
	const parts = normalizedShortcutParts(shortcut)
	if (parts.length === 0) return false
	const key = event.key === ' ' ? 'space' : event.key.toLowerCase()
	const baseKey = parts[parts.length - 1]
	const modifiers = new Set(parts.slice(0, -1))
	return (
		baseKey === key &&
		event.ctrlKey === modifiers.has('ctrl') &&
		event.altKey === modifiers.has('alt') &&
		event.shiftKey === modifiers.has('shift') &&
		event.metaKey === modifiers.has('meta')
	)
}

function shortcutIntent(event: KeyboardEvent) {
	return palette.intents.intents.find((intent) => intent.binding && shortcutMatchesEvent(intent.binding, event))
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
	if (container.editMode || isEditableTarget(event.target)) return
	const intent = shortcutIntent(event)
	if (intent) {
		event.preventDefault()
		palette.run(intent.id)
		return
	}
	const entryId = Object.entries(DEMO_EDITOR_SHORTCUTS).find(([, shortcut]) => shortcut && shortcutMatchesEvent(shortcut, event))?.[0]
	if (!entryId) return
	if (focusEditorShortcut(entryId)) {
		event.preventDefault()
	}
}

function bindDemoShortcuts(root: HTMLElement) {
	const onKeydown = (event: KeyboardEvent) => handleDemoShortcut(event)
	document.addEventListener('keydown', onKeydown)
	return () => document.removeEventListener('keydown', onKeydown)
}

const DEMO_EDITOR_RENDERERS: Readonly<Record<string, DemoEditorRenderer>> = {
	select: ({ entry, toolbarId, selected, label, displayItem }) => {
		if (entry.schema.type !== 'enum') return undefined
		const options = entry.schema.options.map((option) =>
			typeof option === 'string' ? { value: option, label: option } : option
		)
		return (
			<label
				style={`display: grid; gap: 6px; min-width: 180px; padding: 8px 10px; border: 1px solid; border-radius: 10px; ${tone(selected, false)}`}
			>
				<span>{label}</span>
				<select
					data-palette-entry-id={entry.id}
					value={String(palette.state[entry.id] ?? '')}
					disabled={container.editMode}
					update:value={(value: string) => {
						palette.state[entry.id] = value
					}}
					onClick={() => {
						if (container.editMode) openItemConfig(toolbarId, displayItem.entryId, 'editor')
					}}
					style="padding: 6px 8px; border-radius: 8px; border: 1px solid #475569; background: #0b1220; color: #e2e8f0;"
				>
					<for each={options}>
						{(option) => <option value={String(option.value)}>{option.label ?? String(option.value)}</option>}
					</for>
				</select>
			</label>
		)
	},
	stars: ({ entry, toolbarId, selected, label, displayItem }) => {
		if (entry.schema.type !== 'number') return undefined
		return (
			<div
				data-palette-entry-id={entry.id}
				tabIndex={-1}
				onClick={() => {
					if (container.editMode) openItemConfig(toolbarId, displayItem.entryId, 'editor')
				}}
				style={`display: grid; gap: 6px; padding: 8px 10px; border: 1px solid; border-radius: 10px; ${tone(selected, false)}`}
			>
				<span style="text-align: left;">{label}</span>
				<span {...speedStars.container} style="display: flex; gap: 4px; font-size: 1.1rem; color: #facc15;">
					<for each={speedStars.starItems}>
						{(item) => (
							<span data-test={`palette-inline-speed-star-${item.index + 1}`} {...item.el}>
								{starGlyph(item.status)}
							</span>
						)}
					</for>
				</span>
			</div>
		)
	},
	slider: ({ entry, toolbarId, selected, label, displayItem }) => {
		if (entry.schema.type !== 'number') return undefined
		const min = entry.schema.min ?? 0
		const max = entry.schema.max ?? 100
		const step = entry.schema.step ?? 1
		return (
			<label
				style={`display: grid; gap: 6px; min-width: 180px; padding: 8px 10px; border: 1px solid; border-radius: 10px; ${tone(selected, false)}`}
			>
				<span>{label}</span>
				<input
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
						if (container.editMode) openItemConfig(toolbarId, displayItem.entryId, 'editor')
					}}
				/>
			</label>
		)
	},
	default: ({ toolbarId, selected, label, displayItem }) => (
		<button
			type="button"
			data-palette-entry-id={displayItem.entryId}
			onClick={() => openItemConfig(toolbarId, displayItem.entryId, 'editor')}
			style={`padding: 8px 12px; border: 1px solid; border-radius: 8px; ${tone(selected, false)}`}
		>
			{label}
		</button>
	),
}

function renderEditorItem(displayItem: PaletteEditorDisplayItem, toolbarId: string) {
	const resolved = palette.resolveDisplayItem(displayItem)
	if (!resolved || resolved.kind !== 'editor') return undefined

	const selected =
		demoUi.configToolbarId === toolbarId &&
		demoUi.configItemId === displayItem.entryId &&
		demoUi.configItemKind === 'editor'
	const label = displayItem.showText === false ? displayItem.entryId : resolved.entry.label
	const shortcut = formatShortcut(editorShortcut(resolved.entry.id))
	const renderer = DEMO_EDITOR_RENDERERS[displayItem.presenter ?? defaultEditorPresenter(resolved.entry)] ?? DEMO_EDITOR_RENDERERS.default
	return (
		renderer({
			displayItem,
			entry: resolved.entry,
			toolbarId,
			selected,
			label: shortcut ? `${label} (${shortcut})` : label,
		}) ?? DEMO_EDITOR_RENDERERS.default({
			displayItem,
			entry: resolved.entry,
			toolbarId,
			selected,
			label: shortcut ? `${label} (${shortcut})` : label,
		})
	)
}

function renderItemGroup(displayItem: PaletteItemGroupDisplayItem, toolbarId: string) {
	const resolved = palette.resolveDisplayItem(displayItem)
	if (!resolved || resolved.kind !== 'item-group') return undefined

	const identity = itemIdentity(displayItem)
	const selected =
		demoUi.configToolbarId === toolbarId &&
		demoUi.configItemId === identity.id &&
		demoUi.configItemKind === identity.kind
	
	const entry = resolved.entry
	const currentOption = palette.state[displayItem.group.entryId] as string | undefined
	
	// Render as a radio-button-group with individual option buttons
	return (
		<div
			style={`display: inline-flex; align-items: center; gap: 2px; padding: 2px; border: 1px solid #475569; border-radius: 6px; background: #0f172a; ${selected ? 'border-color: #60a5fa; background: #1d4ed8;' : ''}`}
			onClick={() => {
				if (container.editMode) {
					const identity = itemIdentity(displayItem)
					openItemConfig(toolbarId, identity.id, identity.kind)
					return
				}
			}}
		>
			{displayItem.group.options.map((option, index) => {
				const isSelected = currentOption === option
				const optionLabel = entry.schema.type === 'enum' 
					? (typeof entry.schema.options[index] === 'string' 
						? entry.schema.options[index]
						: (entry.schema.options[index] as any).label || option)
					: option
				
				// Theme icons for visual presentation
				const getIcon = (opt: string) => {
					if (displayItem.group.entryId === 'ui.theme') {
						switch (opt) {
							case 'light': return '☀️'
							case 'dark': return '🌙'
							case 'system': return '💻'
							default: return '⚙️'
						}
					}
					return '⚙️'
				}
				
				return (
					<button
						style={`padding: 4px 6px; border: 1px solid #64748b; border-radius: 4px; background: ${isSelected ? '#3b82f6' : '#1e293b'}; color: #e2e8f0; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; ${!isSelected ? 'opacity: 0.7' : ''}`}
						onClick={(e) => {
							e.stopPropagation()
							if (!container.editMode) {
								palette.run(`${displayItem.group.entryId}:set:${option}`)
							}
						}}
					>
						<span>{getIcon(option)}</span>
						<span if={displayItem.showText !== false}>{optionLabel}</span>
					</button>
				)
			})}
		</div>
	)
}

function starGlyph(status: StarStatus) {
	return status === 'after' || status === 'zero' ? '▷' : '▶'
}

function isDemoDisabled(displayItem: PaletteIntentDisplayItem, resolved: DemoResolvedDisplayItem) {
	if (resolved.intent.mode === 'stash' && palette.runtime[resolved.intent.id] !== undefined) {
		return false
	}
	return computeDisabledState(displayItem, resolved.intent, resolved.entry, palette.state)
}

function commandLabel(match: PaletteMatch) {
	return match.kind === 'intent' ? (match.intent.label ?? match.entry.label) : match.entry.label
}

function commandMeta(match: PaletteMatch) {
	return match.kind === 'intent'
		? `${match.intent.mode} • ${match.intent.id}${
				match.intent.binding ? ` • ${formatShortcut(match.intent.binding)}` : ''
			}`
		: `entry • ${match.entry.id}${
				editorShortcut(match.entry.id) ? ` • ${formatShortcut(editorShortcut(match.entry.id))}` : ''
			}`
}

function addCandidateLabel(candidate: PaletteAddItemCandidate) {
	if (candidate.kind === 'intent') {
		return candidate.intent.label ?? candidate.entry.label
	}
	return `${candidate.entry.label} editor`
}

function addCandidateMeta(candidate: PaletteAddItemCandidate) {
	if (candidate.kind === 'intent') {
		return candidate.intent.binding
			? `${candidate.intent.id} • ${formatShortcut(candidate.intent.binding)}`
			: candidate.intent.id
	}
	return `entry • ${candidate.entry.id} • ${defaultEditorPresenter(candidate.entry)}${
		editorShortcut(candidate.entry.id) ? ` • ${formatShortcut(editorShortcut(candidate.entry.id))}` : ''
	}`
}

function setCommandInput(event: Event) {
	if (event.currentTarget instanceof HTMLInputElement) {
		commandBox.input.value = event.currentTarget.value
	}
}

function onCommandInputKeydown(event: KeyboardEvent) {
	if (!(event.currentTarget instanceof HTMLInputElement)) return
	if (event.key === 'Backspace') {
		if (event.currentTarget.value.length > 0) return
		const removed = commandBox.categories.removeLast()
		if (removed) {
			event.preventDefault()
		}
		return
	}
	if (event.key === 'ArrowLeft' && event.currentTarget.value.length === 0) {
		const chipButtons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[data-command-chip]')
		const last = chipButtons?.[chipButtons.length - 1]
		if (last) {
			last.focus()
			event.preventDefault()
		}
	}
}

function focusAdjacentChip(target: HTMLButtonElement, offset: number) {
	const chipButtons = target.parentElement?.querySelectorAll<HTMLButtonElement>('[data-command-chip]')
	if (!chipButtons) return
	const index = Array.from(chipButtons).findIndex((entry) => entry === target)
	const next = chipButtons[index + offset]
	if (next) {
		next.focus()
		return
	}
	const input = target.parentElement?.querySelector<HTMLInputElement>('[data-test="palette-command-input"]')
	input?.focus()
}

function onCommandChipKeydown(event: KeyboardEvent, category: string) {
	if (!(event.currentTarget instanceof HTMLButtonElement)) return
	if (event.key === 'ArrowLeft') {
		focusAdjacentChip(event.currentTarget, -1)
		event.preventDefault()
		return
	}
	if (event.key === 'ArrowRight') {
		focusAdjacentChip(event.currentTarget, 1)
		event.preventDefault()
		return
	}
	if (event.key === 'Backspace' || event.key === 'Delete') {
		commandBox.categories.toggle(category)
		const chipButtons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[data-command-chip]')
		const next = chipButtons?.[Math.max(0, (chipButtons?.length ?? 1) - 2)]
		if (next) {
			next.focus()
		} else {
			const input = event.currentTarget.parentElement?.querySelector<HTMLInputElement>('[data-test="palette-command-input"]')
			input?.focus()
		}
		event.preventDefault()
	}
}

function runMatch(match: PaletteMatch) {
	if (match.kind === 'intent') {
		commandBox.execute(match.intent.id)
		return
	}
	commandBox.input.value = match.entry.label
}

function setAddQuery(event: Event) {
	if (event.currentTarget instanceof HTMLInputElement) {
		demoUi.addQuery = event.currentTarget.value
	}
}

function openAddPopup(region: PaletteContainerRegion, toolbarId?: string) {
	let targetToolbarId = toolbarId
	if (!targetToolbarId) {
		const createdSurface = container.createSurface(region, 'toolbar', `${region} toolbar`)
		targetToolbarId = createdSurface.id
	}
	demoUi.addRegion = region
	demoUi.addToolbarId = targetToolbarId
	demoUi.addQuery = ''
}

function createToolbarAt(region: PaletteContainerRegion, index: number) {
	const createdSurface = container.createSurface(region, 'toolbar', `${region} toolbar`)
	container.moveSurface(createdSurface.id, region, index)
	openAddPopup(region, createdSurface.id)
}

function startToolbarMove(toolbarId: string) {
	demoUi.movingToolbarId = toolbarId
	closeAddPopup()
}

function stopToolbarMove() {
	demoUi.movingToolbarId = undefined
}

function startToolbarDrag(toolbarId: string) {
	demoUi.draggingToolbarId = toolbarId
}

function stopToolbarDrag() {
	demoUi.draggingToolbarId = undefined
}

function startItemDrag(toolbarId: string, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	demoUi.draggingItemToolbarId = toolbarId
	demoUi.draggingItemId = itemId
	demoUi.draggingItemKind = itemKind
}

function stopItemDrag() {
	demoUi.draggingItemToolbarId = undefined
	demoUi.draggingItemId = undefined
	demoUi.draggingItemKind = undefined
}

function placeToolbarAt(region: PaletteContainerRegion, index: number) {
	if (demoUi.draggingToolbarId) {
		moveToolbarSurface(demoUi.draggingToolbarId, region, index)
		stopToolbarDrag()
		return
	}
	if (demoUi.movingToolbarId) {
		moveToolbarSurface(demoUi.movingToolbarId, region, index)
		stopToolbarMove()
		return
	}
	createToolbarAt(region, index)
}

function closeAddPopup() {
	demoUi.addRegion = undefined
	demoUi.addToolbarId = undefined
	demoUi.addQuery = ''
}

function openItemConfig(toolbarId: string, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	stopItemDrag()
	demoUi.configToolbarId = toolbarId
	demoUi.configItemId = itemId
	demoUi.configItemKind = itemKind
}

function closeItemConfig() {
	stopItemDrag()
	demoUi.configToolbarId = undefined
	demoUi.configItemId = undefined
	demoUi.configItemKind = undefined
}

function addCandidateToToolbar(candidate: PaletteAddItemCandidate) {
	if (!demoUi.addToolbarId || toolbarContainsItem(demoUi.addToolbarId, candidate)) return
	if (candidate.kind === 'intent') {
		customization.addToToolbar(demoUi.addToolbarId, {
			kind: 'intent',
			intentId: candidate.intent.id,
			presenter: getDefaultDisplayPresenter(candidate.intent, candidate.entry),
			showText: true,
		})
		closeAddPopup()
		return
	}

	if (candidate.kind === 'item-group') {
		customization.addToToolbar(demoUi.addToolbarId, {
			kind: 'item-group',
			group: candidate.group,
		})
		closeAddPopup()
		return
	}

	customization.addToToolbar(demoUi.addToolbarId, {
		kind: 'editor',
		entryId: candidate.entry.id,
		presenter: defaultEditorPresenter(candidate.entry),
		showText: true,
	})
	closeAddPopup()
}

function filteredAddCandidates() {
	const toolbarId = demoUi.addToolbarId
	return addItem.search(demoUi.addQuery, {
		exclude: toolbarId ? toolbarDisplayItems(toolbarId) : [],
	})
}

function moveToolbarItem(toolbarId: string, itemId: string, itemKind: PaletteDisplayItem['kind'], offset: number) {
	const items = toolbarDisplayItems(toolbarId)
	const currentIndex = items.findIndex((displayItem) => {
		const identity = itemIdentity(displayItem)
		return identity.id === itemId && identity.kind === itemKind
	})
	const nextIndex = currentIndex + offset
	if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return
	customization.moveWithinToolbar(toolbarId, itemId, itemKind, nextIndex)
}

function placeDraggedItem(toolbarId: string, index: number) {
	if (!demoUi.draggingItemToolbarId || !demoUi.draggingItemId || !demoUi.draggingItemKind) return
	if (demoUi.draggingItemToolbarId === toolbarId) {
		customization.moveWithinToolbar(toolbarId, demoUi.draggingItemId, demoUi.draggingItemKind, index)
		stopItemDrag()
		return
	}
	customization.moveToToolbar(
		demoUi.draggingItemToolbarId,
		demoUi.draggingItemId,
		demoUi.draggingItemKind,
		toolbarId,
		index
	)
	stopItemDrag()
}

function cycleToolbarPresenter(toolbarId: string, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	const item = toolbarDisplayItems(toolbarId).find((displayItem) => {
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
	customization.setPresenter(toolbarId, itemId, itemKind, next)
}

function removeToolbarItem(toolbarId: string, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	customization.removeFromToolbar(toolbarId, itemId, itemKind)
	if (
		demoUi.configToolbarId === toolbarId &&
		demoUi.configItemId === itemId &&
		demoUi.configItemKind === itemKind
	) {
		closeItemConfig()
	}
}

function toolbarMoveTargets(toolbarId: string) {
	return container.surfaces
		.filter((surface) => surface.type === 'toolbar' && surface.id !== toolbarId && surface.visible)
		.map((surface) => ({
			id: surface.id,
			label: `${surface.label ?? surface.id} • ${surface.region}`,
		}))
}

function moveToolbarItemToToolbar(
	toolbarId: string,
	itemId: string,
	itemKind: PaletteDisplayItem['kind'],
	targetToolbarId: string
) {
	customization.moveToToolbar(toolbarId, itemId, itemKind, targetToolbarId)
	if (
		demoUi.configToolbarId === toolbarId &&
		demoUi.configItemId === itemId &&
		demoUi.configItemKind === itemKind
	) {
		demoUi.configToolbarId = targetToolbarId
	}
}

function moveToolbarSurface(toolbarId: string, targetRegion: PaletteContainerRegion, targetIndex?: number) {
	container.moveSurface(toolbarId, targetRegion, targetIndex)
	if (demoUi.addToolbarId === toolbarId) {
		demoUi.addRegion = targetRegion
	}
	if (demoUi.movingToolbarId === toolbarId) {
		demoUi.movingToolbarId = undefined
	}
	if (demoUi.draggingToolbarId === toolbarId) {
		demoUi.draggingToolbarId = undefined
	}
}

function moveToolbarSurfaceWithinRegion(toolbarId: string, offset: number) {
	const position = toolbarSurfacePosition(toolbarId)
	if (!position) return
	const surfaces = container.getSurfacesInRegion(position.region).filter((surface) => surface.type === 'toolbar')
	const nextIndex = position.index + offset
	if (nextIndex < 0 || nextIndex >= surfaces.length) return
	moveToolbarSurface(toolbarId, position.region, nextIndex)
}

function renderToolbarSurface(toolbarId: string) {
	const toolbar = demoToolbar(toolbarId)
	const position = toolbarSurfacePosition(toolbarId)
	const moving = demoUi.movingToolbarId === toolbarId
	const dragging = demoUi.draggingToolbarId === toolbarId
	const isFirst = !position || position.index <= 0
	const regionToolbars = position
		? container.getSurfacesInRegion(position.region).filter((surface) => surface.type === 'toolbar')
		: []
	const isLast = !position || position.index >= regionToolbars.length - 1

	return (
		<div
			onMousedown={() => {
				if (container.editMode) startToolbarDrag(toolbarId)
			}}
			style={`display: grid; gap: 8px; min-width: 0; flex: 1 1 auto; opacity: ${moving || dragging ? '0.6' : '1'};`}
		>
			<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
				<strong>{container.surfaces.find((surface) => surface.id === toolbarId)?.label ?? toolbarId}</strong>
				<div style="display: flex; gap: 6px; flex-wrap: wrap;">
					<button if={container.editMode} onClick={() => openAddPopup(position?.region ?? 'top', toolbarId)}>+</button>
					<button if={container.editMode} onClick={() => (moving ? stopToolbarMove() : startToolbarMove(toolbarId))}>
						{moving ? 'Cancel move' : 'Move'}
					</button>
					<button if={container.editMode} onClick={() => moveToolbarSurfaceWithinRegion(toolbarId, -1)} disabled={isFirst}>←</button>
					<button if={container.editMode} onClick={() => moveToolbarSurfaceWithinRegion(toolbarId, 1)} disabled={isLast}>→</button>
					<button if={container.editMode && position?.region !== 'top'} onClick={() => moveToolbarSurface(toolbarId, 'top')}>Top</button>
					<button if={container.editMode && position?.region !== 'left'} onClick={() => moveToolbarSurface(toolbarId, 'left')}>Left</button>
					<button if={container.editMode && position?.region !== 'right'} onClick={() => moveToolbarSurface(toolbarId, 'right')}>Right</button>
					<button if={container.editMode && position?.region !== 'bottom'} onClick={() => moveToolbarSurface(toolbarId, 'bottom')}>Bottom</button>
				</div>
			</div>
			<div style="display: flex; flex-wrap: wrap; gap: 8px;">
				{renderToolbarItemInsertionPoint(toolbarId, 0)}
				<for each={toolbar.items}>
					{(displayItem) => {
						const identity = itemIdentity(displayItem)
						const currentIndex = toolbar.items.findIndex((entry) => {
							const entryIdentity = itemIdentity(entry)
							return entryIdentity.id === identity.id && entryIdentity.kind === identity.kind
						})
						let content: PounceElement | undefined
						if (isEditorDisplayItem(displayItem)) {
							content = renderEditorItem(displayItem, toolbarId)
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
											openItemConfig(toolbarId, displayItem.intentId, 'intent')
											return
										}
										palette.run(resolved.intent.id)
									},
								})
							}
						} else if (isItemGroupDisplayItem(displayItem)) {
							content = renderItemGroup(displayItem, toolbarId)
						}
						if (!content) return undefined
						return (
							<>
								<div
									onMousedown={() => {
										if (container.editMode) startItemDrag(toolbarId, identity.id, identity.kind)
									}}
									style={`display: contents; opacity: ${
										demoUi.draggingItemToolbarId === toolbarId &&
										demoUi.draggingItemId === identity.id &&
										demoUi.draggingItemKind === identity.kind
											? '0.6'
											: '1'
									};`}
								>
									{content}
								</div>
								{renderToolbarItemInsertionPoint(toolbarId, currentIndex + 1)}
							</>
						)
					}}
				</for>
			</div>
		</div>
	)
}

function renderToolbarInsertionPoints(region: PaletteContainerRegion) {
	if (!container.editMode) return undefined
	const insertionPoints = container.getInsertionPointsInRegion(region)
	const vertical = region === 'left' || region === 'right'
	const label = demoUi.draggingToolbarId || demoUi.movingToolbarId ? 'Place toolbar' : '+ toolbar'
	return (
		<div
			style={`display: flex; flex-direction: ${vertical ? 'column' : 'row'}; flex-wrap: ${
				vertical ? 'nowrap' : 'wrap'
			}; gap: 8px; align-items: stretch;`}
		>
			<for each={insertionPoints}>
				{(point) => (
					<button
						onMouseup={() => {
							placeToolbarAt(region, point.index)
						}}
						onClick={() => {
							if (demoUi.draggingToolbarId || demoUi.movingToolbarId) return
							placeToolbarAt(region, point.index)
						}}
						style={`padding: ${vertical ? '10px 8px' : '8px 12px'}; border: 1px dashed #475569; border-radius: 10px; background: #0b1220; color: #94a3b8;`}
					>
						{label}
					</button>
				)}
			</for>
		</div>
	)
}

function renderToolbarItemInsertionPoint(toolbarId: string, index: number) {
	if (!container.editMode || !demoUi.draggingItemToolbarId || !demoUi.draggingItemId || !demoUi.draggingItemKind) {
		return undefined
	}
	return (
		<button
			onMouseup={() => placeDraggedItem(toolbarId, index)}
			onClick={() => {
				if (!demoUi.draggingItemToolbarId || !demoUi.draggingItemId || !demoUi.draggingItemKind) return
				placeDraggedItem(toolbarId, index)
			}}
			style="padding: 8px 12px; border: 1px dashed #60a5fa; border-radius: 10px; background: #0b1220; color: #bfdbfe;"
		>
			Place item
		</button>
	)
}

function toggleEditMode() {
	if (container.editMode) {
		container.exitEditMode()
		closeAddPopup()
		closeItemConfig()
		stopToolbarMove()
		stopToolbarDrag()
		demoUi.handleExpanded = false
		return
	}
	container.enterEditMode()
}

function commandSurfaceLabel(region: PaletteContainerRegion) {
	return region === 'top' ? 'Top region' : region === 'bottom' ? 'Bottom region' : `${region} rail`
}

function renderRegionShell(region: PaletteContainerRegion) {
	const surfaces = container.getSurfacesInRegion(region)
	const visible = region === 'top' || container.editMode || surfaces.length > 0
	if (!visible) return undefined
	return (
		<div style={REGION_LAYOUT[region]}>
			<div style={regionShellStyle(region)}>
				<strong if={region !== 'top'}>{commandSurfaceLabel(region)}</strong>
				{renderToolbarInsertionPoints(region)}
				<for each={surfaces}>
					{(surface) => {
						if (!surface.visible || surface.type !== 'toolbar') return undefined
						return renderToolbarSurface(surface.id)
					}}
				</for>
			</div>
		</div>
	)
}

function configuredToolbarItem() {
	if (!demoUi.configToolbarId || !demoUi.configItemId || !demoUi.configItemKind) return undefined
	const item = toolbarDisplayItems(demoUi.configToolbarId).find((displayItem) => {
		const identity = itemIdentity(displayItem)
		return identity.id === demoUi.configItemId && identity.kind === demoUi.configItemKind
	})
	if (!item) return undefined
	const resolved = palette.resolveDisplayItem(item)
	if (!resolved) return undefined
	return { item, resolved }
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
	const configured = configuredToolbarItem()
	if (!configured || !demoUi.configItemId || !demoUi.configItemKind || !demoUi.configToolbarId) return undefined
	const summary = presenterSummary(demoUi.configToolbarId, demoUi.configItemId, demoUi.configItemKind)
	if (configured.resolved.kind === 'intent' && configured.resolved.intent.binding) {
		const binding = formatShortcut(configured.resolved.intent.binding)
		return summary ? `${summary} • ${binding}` : binding
	}
	return summary ?? `${demoUi.configItemKind} • ${demoUi.configItemId}`
}

function presenterSummary(toolbarId: string, itemId: string, itemKind: PaletteDisplayItem['kind']) {
	const displayItem = toolbarDisplayItems(toolbarId).find((entry) => {
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

export default function PaletteDemo() {
	return (
		<div
			data-test="palette-demo"
			use={bindDemoShortcuts}
			style="position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-rows: auto minmax(0, 1fr) auto; gap: 12px; height: calc(100vh - 40px); max-height: calc(100vh - 40px); min-height: 680px; padding: 16px; border-radius: 18px; background: #0f172a; color: #e2e8f0; overflow: hidden; box-sizing: border-box;"
		>
			<button
				data-test="palette-edit-toggle"
				onMouseenter={() => (demoUi.handleExpanded = true)}
				onMouseleave={() => {
					if (!container.editMode) demoUi.handleExpanded = false
				}}
				onClick={toggleEditMode}
				style={`position: absolute; top: 10px; left: 10px; z-index: 4; width: ${container.editMode || demoUi.handleExpanded ? '76px' : '18px'}; height: ${container.editMode || demoUi.handleExpanded ? '36px' : '18px'}; border: 1px solid ${container.editMode ? '#60a5fa' : '#334155'}; border-radius: 12px; background: ${container.editMode ? '#1d4ed8' : '#111827'}; color: #e2e8f0; cursor: pointer; overflow: hidden; transition: width 120ms ease, height 120ms ease, background 120ms ease;`}
			>
				{container.editMode ? 'Done' : demoUi.handleExpanded ? 'Edit' : '✎'}
			</button>

			<for each={REGION_ORDER}>
				{(region) => renderRegionShell(region)}
			</for>

			<div style="grid-column: 2; grid-row: 2; min-width: 0; min-height: 0; overflow: auto; padding: 8px; border-radius: 16px; background: #111827; border: 1px solid #1f2937;">
				<div style="display: grid; gap: 16px; min-height: max-content;">
					<div>
						<h2 style="margin: 0 0 8px;">Palette Demo</h2>
						<p style="margin: 0; color: #94a3b8;">
							The root `palette-demo` node is now the toolbared container. The center content
							scrolls independently while toolbars live on the shell.
						</p>
						<div if={container.editMode} style="margin-top: 10px; padding: 10px 12px; border-radius: 10px; background: #172554; color: #bfdbfe;">
							Edit mode is active. Use the `+` actions on the container regions and click a toolbar
							item to configure it inline.
						</div>
					</div>

					<div>
						<h3 style="margin: 0 0 10px;">Input Box</h3>
						<div style="padding: 14px; border-radius: 10px; background: #334155;">
							<div style="display: grid; gap: 8px; padding: 10px 12px; border-radius: 8px; border: 1px solid #475569; background: #0f172a;">
								<div if={commandBox.categories.active.length > 0} style="display: flex; flex-wrap: wrap; gap: 8px;">
									<for each={commandBox.categories.active}>
										{(category) => (
											<button
												data-command-chip={category}
												onClick={() => commandBox.categories.toggle(category)}
												onKeydown={(event) => onCommandChipKeydown(event, category)}
												style={`padding: 4px 8px; border: 1px solid; border-radius: 999px; ${tone(true, false)}`}
											>
												#{category} ×
											</button>
										)}
									</for>
								</div>
								<input
									data-test="palette-command-input"
									value={commandBox.input.value}
									placeholder={commandBox.input.placeholder}
									onInput={setCommandInput}
									onKeydown={onCommandInputKeydown}
									style="width: 100%; padding: 0; border: 0; background: transparent; color: #e2e8f0;"
								/>
							</div>
							<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
								<for each={commandBox.categories.available}>
									{(category) => {
										const active = commandBox.categories.active.includes(category)
										return (
											<button onClick={() => commandBox.categories.toggle(category)} style={`padding: 6px 10px; border: 1px solid; border-radius: 999px; ${tone(active, false)}`}>
												#{category}
											</button>
										)
									}}
								</for>
							</div>
							<div style="margin-top: 10px; color: #94a3b8; font-size: 12px;">
								Type category tokens to promote chips, keep free text for the remaining query, and
								use visible shortcut hints to discover faster command paths.
							</div>
							<div style="display: grid; gap: 8px; margin-top: 12px;">
								<for each={commandBox.results.slice(0, 6)}>
									{(match) => {
										const resultIndex = commandBox.results.findIndex((entry) => entry === match)
										const selected = commandBox.selection.index === resultIndex
										return (
											<button
												data-test={`palette-command-result-${resultIndex}`}
												onMouseenter={() => commandBox.selection.set(resultIndex)}
												onClick={() => runMatch(match)}
												style={`padding: 10px 12px; border: 1px solid; border-radius: 8px; text-align: left; ${tone(selected, false)}`}
											>
												<div>{commandLabel(match)}</div>
												<div style="color: #94a3b8; font-size: 12px;">{commandMeta(match)}</div>
											</button>
										)
									}}
								</for>
							</div>
						</div>
					</div>

					<div>
						<h3 style="margin: 0 0 10px;">Presenter Dictionaries</h3>
						<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
							<for each={FAMILY_ORDER}>
								{(family) => (
									<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
										<strong>{family}</strong>
										<div style="color: #94a3b8;">{presenterNames(family)}</div>
									</div>
								)}
							</for>
						</div>
					</div>

					<div>
						<h3 style="margin: 0 0 10px;">Numeric Control</h3>
						<div style="padding: 14px; border-radius: 10px; background: #334155;">
							<div style="margin-bottom: 8px; color: #94a3b8;">
								`game.speed` can be paused via stash and edited directly through the headless
								stars model rendered with play-arrow glyphs.
							</div>
							<div data-test="palette-speed-stars" {...speedStars.container} style="display: flex; gap: 6px; font-size: 2rem; color: #facc15;">
								<for each={speedStars.starItems}>
									{(item) => (
										<span data-test={`palette-speed-star-${item.index + 1}`} {...item.el}>
											{starGlyph(item.status)}
										</span>
									)}
								</for>
							</div>
							<div style="margin-top: 8px; color: #94a3b8;">Selected speed: {String(palette.state['game.speed'])}</div>
						</div>
					</div>

					<div>
						<h3 style="margin: 0 0 10px;">Live State</h3>
						<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px;">
							<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
								<strong>Boolean checkbutton</strong>
								<div style="color: #94a3b8;">ui.notifications = {String(palette.state['ui.notifications'])}</div>
							</div>
							<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
								<strong>Enum radiobutton group</strong>
								<div style="color: #94a3b8;">ui.theme = {String(palette.state['ui.theme'])}</div>
							</div>
							<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
								<strong>Enum flip button</strong>
								<div style="color: #94a3b8;">ui.layout = {String(palette.state['ui.layout'])}</div>
							</div>
							<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
								<strong>Numeric step</strong>
								<div style="color: #94a3b8;">editor.fontSize = {String(palette.state['editor.fontSize'])}</div>
							</div>
							<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
								<strong>Numeric stash</strong>
								<div style="color: #94a3b8;">game.speed = {String(palette.state['game.speed'])}</div>
							</div>
						</div>
					</div>

					<div>
						<h3 style="margin: 0 0 10px;">Reactive Objects</h3>
						<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 8px;">
							<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
								<strong>state</strong>
								<pre style="margin: 8px 0 0; color: #cbd5e1; white-space: pre-wrap;">{JSON.stringify(palette.state, null, 2)}</pre>
							</div>
							<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
								<strong>runtime</strong>
								<pre style="margin: 8px 0 0; color: #cbd5e1; white-space: pre-wrap;">{JSON.stringify(palette.runtime, null, 2)}</pre>
							</div>
							<div style="padding: 10px 12px; border-radius: 8px; background: #334155;">
								<strong>display</strong>
								<pre style="margin: 8px 0 0; color: #cbd5e1; white-space: pre-wrap;">{JSON.stringify(palette.display, null, 2)}</pre>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div if={demoUi.addToolbarId !== undefined} style="position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; background: rgba(2, 6, 23, 0.72);">
				<div style="width: min(640px, calc(100% - 32px)); max-height: min(70vh, 640px); overflow: auto; padding: 16px; border-radius: 16px; background: #0f172a; border: 1px solid #334155; box-shadow: 0 16px 60px rgba(0, 0, 0, 0.45);">
					<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
						<div>
							<strong>Add item</strong>
							<div style="color: #94a3b8;">Region: {demoUi.addRegion} · Toolbar: {demoUi.addToolbarId}</div>
						</div>
						<button onClick={closeAddPopup}>Close</button>
					</div>
					<input
						data-test="palette-add-popup-input"
						value={demoUi.addQuery}
						placeholder="Search intents or entry editors…"
						onInput={setAddQuery}
						style="width: 100%; margin-top: 12px; padding: 10px 12px; border-radius: 8px; border: 1px solid #475569; background: #111827; color: #e2e8f0;"
					/>
					<div style="display: grid; gap: 8px; margin-top: 12px;">
						<for each={filteredAddCandidates().slice(0, 12)}>
							{(candidate) => {
								return (
									<button
										onClick={() => addCandidateToToolbar(candidate)}
										style="padding: 10px 12px; border: 1px solid #475569; border-radius: 10px; background: #111827; color: #e2e8f0; text-align: left;"
									>
										<div>{addCandidateLabel(candidate)}</div>
										<div style="color: #94a3b8; font-size: 12px;">{addCandidateMeta(candidate)}</div>
									</button>
								)
							}}
						</for>
					</div>
				</div>
			</div>

			<div if={configuredToolbarItem() !== undefined} style="position: absolute; right: 16px; bottom: 16px; z-index: 5; width: min(320px, calc(100% - 32px)); padding: 14px; border-radius: 14px; background: #0f172a; border: 1px solid #475569; box-shadow: 0 16px 60px rgba(0, 0, 0, 0.45);">
				{(() => {
					const configured = configuredToolbarItem()
					if (!configured || !demoUi.configToolbarId || !demoUi.configItemId || !demoUi.configItemKind) return undefined
					const items = toolbarDisplayItems(demoUi.configToolbarId)
					const index = items.findIndex((displayItem) => {
						const identity = itemIdentity(displayItem)
						return identity.id === demoUi.configItemId && identity.kind === demoUi.configItemKind
					})
					const moveTargets = toolbarMoveTargets(demoUi.configToolbarId)
					const isFirst = index <= 0
					const isLast = index >= items.length - 1
					return (
						<div style="display: grid; gap: 10px;">
							<div style="display: flex; justify-content: space-between; gap: 12px; align-items: center;">
								<strong>{configuredItemLabel()}</strong>
								<button onClick={closeItemConfig}>Close</button>
							</div>
							<div style="color: #94a3b8; font-size: 12px;">{demoUi.configItemId}</div>
							<div style="color: #94a3b8; font-size: 12px;">{configuredItemMeta()}</div>
							<div style="display: flex; gap: 8px; flex-wrap: wrap;">
								<button onClick={() => moveToolbarItem(demoUi.configToolbarId!, demoUi.configItemId!, demoUi.configItemKind!, -1)} disabled={isFirst}>←</button>
								<button onClick={() => moveToolbarItem(demoUi.configToolbarId!, demoUi.configItemId!, demoUi.configItemKind!, 1)} disabled={isLast}>→</button>
								<button onClick={() => cycleToolbarPresenter(demoUi.configToolbarId!, demoUi.configItemId!, demoUi.configItemKind!)}>Presenter</button>
								<button onClick={() => removeToolbarItem(demoUi.configToolbarId!, demoUi.configItemId!, demoUi.configItemKind!)}>Remove</button>
							</div>
							<div if={moveTargets.length > 0} style="display: grid; gap: 6px;">
								<strong style="font-size: 12px; color: #cbd5e1;">Move to toolbar</strong>
								<div style="display: flex; gap: 8px; flex-wrap: wrap;">
									<for each={moveTargets}>
										{(target) => (
											<button
												onClick={() =>
													moveToolbarItemToToolbar(
														demoUi.configToolbarId!,
														demoUi.configItemId!,
														demoUi.configItemKind!,
														target.id
													)
												}
											>
												{target.label}
											</button>
										)}
									</for>
								</div>
							</div>
						</div>
					)
				})()}
			</div>
		</div>
	)
}
