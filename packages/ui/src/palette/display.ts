import { effect, reactive } from 'mutts'
import type { PaletteModel } from './model'
import type {
	PaletteContainerConfiguration,
	PaletteContainerRegion,
	PaletteContainerToolbarStack,
	PaletteDisplayConfiguration,
	PaletteDisplayItem,
	PaletteDisplayItemKind,
	PaletteDisplayPresenterFamily,
	PaletteEntryDefinition,
	PaletteIntent,
	PaletteResolvedDisplayItem,
	PaletteToolbar,
	PaletteToolbarTrack,
} from './types'

interface MutablePaletteContainerConfiguration {
	toolbarStack: PaletteContainerToolbarStack
	editMode: boolean
	parkedToolbars?: readonly PaletteToolbar[]
}

interface MutablePaletteDisplayConfiguration {
	container?: MutablePaletteContainerConfiguration
}

function flattenToolbarStack(
	toolbarStack: PaletteContainerConfiguration['toolbarStack']
): PaletteToolbar[] {
	return [
		...toolbarStack.top.flatMap((track) => track.slots.map((slot) => slot.toolbar)),
		...toolbarStack.right.flatMap((track) => track.slots.map((slot) => slot.toolbar)),
		...toolbarStack.bottom.flatMap((track) => track.slots.map((slot) => slot.toolbar)),
		...toolbarStack.left.flatMap((track) => track.slots.map((slot) => slot.toolbar)),
	]
}

function findToolbarInStack(
	toolbarStack: PaletteContainerConfiguration['toolbarStack'],
	toolbar: PaletteToolbar
): PaletteToolbar | undefined {
	return flattenToolbarStack(toolbarStack).find((entry) => entry === toolbar)
}

function updateToolbarInStack(
	toolbarStack: PaletteContainerConfiguration['toolbarStack'],
	toolbar: PaletteToolbar,
	updatedToolbar: PaletteToolbar
): PaletteContainerConfiguration['toolbarStack'] {
	const regions: PaletteContainerRegion[] = ['top', 'right', 'bottom', 'left']
	const nextStack = {
		top: toolbarStack.top.map((track) => ({
			slots: track.slots.map((slot) => ({ toolbar: slot.toolbar, space: slot.space })),
		})),
		right: toolbarStack.right.map((track) => ({
			slots: track.slots.map((slot) => ({ toolbar: slot.toolbar, space: slot.space })),
		})),
		bottom: toolbarStack.bottom.map((track) => ({
			slots: track.slots.map((slot) => ({
				toolbar: slot.toolbar,
				space: slot.space,
			})),
		})),
		left: toolbarStack.left.map((track) => ({
			slots: track.slots.map((slot) => ({ toolbar: slot.toolbar, space: slot.space })),
		})),
	}
	for (const region of regions) {
		for (let track = 0; track < nextStack[region].length; track += 1) {
			const index = nextStack[region][track].slots.findIndex((slot) => slot.toolbar === toolbar)
			if (index < 0) continue
			nextStack[region][track].slots[index] = {
				toolbar: updatedToolbar,
				space: nextStack[region][track].slots[index].space,
			}
			return nextStack
		}
	}
	return nextStack
}

function emptyToolbarTrack(): PaletteToolbarTrack {
	return {
		slots: [],
	}
}

function emptyToolbarStack(): PaletteContainerToolbarStack {
	return {
		top: [emptyToolbarTrack()],
		right: [emptyToolbarTrack()],
		bottom: [emptyToolbarTrack()],
		left: [emptyToolbarTrack()],
	}
}

function findToolbar(palette: PaletteModel, toolbar: PaletteToolbar): PaletteToolbar {
	const toolbarStack = palette.display.container?.toolbarStack
	const parkedToolbars = palette.display.container?.parkedToolbars ?? []
	const currentToolbar = toolbarStack ? findToolbarInStack(toolbarStack, toolbar) : undefined
	const parkedToolbar = parkedToolbars.find((entry) => entry === toolbar)
	if (parkedToolbar) return parkedToolbar
	return currentToolbar ?? toolbar
}

function updateToolbarInParkedToolbars(
	parkedToolbars: readonly PaletteToolbar[],
	toolbar: PaletteToolbar,
	updatedToolbar: PaletteToolbar
): readonly PaletteToolbar[] {
	return parkedToolbars.map((entry) => (entry === toolbar ? updatedToolbar : entry))
}

export interface PaletteToolbarModel {
	readonly items: readonly PaletteResolvedDisplayItem[]
}

export interface PaletteDisplayCustomizationModel {
	addToToolbar(toolbar: PaletteToolbar, item: PaletteDisplayItem, index?: number): void
	removeFromToolbar(toolbar: PaletteToolbar, item: PaletteDisplayItem): void
	moveWithinToolbar(toolbar: PaletteToolbar, item: PaletteDisplayItem, nextIndex: number): void
	moveToToolbar(
		sourceToolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		targetToolbar: PaletteToolbar,
		targetIndex?: number
	): void
	setPresenter(toolbar: PaletteToolbar, item: PaletteDisplayItem, presenter?: string): void
}

export type PaletteSurfaceAxis = 'horizontal' | 'vertical'

export type PaletteSurfaceContext = {
	readonly axis: PaletteSurfaceAxis
	readonly region?: PaletteContainerRegion
}

export type PaletteDisplayItemIdentity = {
	readonly id: string
	readonly kind: PaletteDisplayItemKind
}

export type PaletteConfiguredItemTarget = {
	readonly toolbar: PaletteToolbar
	readonly item: PaletteDisplayItem
	readonly identity: PaletteDisplayItemIdentity
}

export type PaletteConfiguratorPresenterChoice = {
	readonly id: string
	readonly label: string
	readonly selected: boolean
}

export type PaletteConfiguratorMoveTarget = {
	readonly toolbar: PaletteToolbar
	readonly label: string
}

export type PaletteItemConfiguratorDescriptor = {
	readonly target: PaletteConfiguredItemTarget
	readonly resolved: PaletteResolvedDisplayItem
	readonly surface: PaletteSurfaceContext
	readonly title: string
	readonly subtitle?: string
	readonly preferredRenderMode?: 'anchored' | 'panel' | 'host-choice'
	readonly presenterChoices: readonly PaletteConfiguratorPresenterChoice[]
	readonly moveTargets: readonly PaletteConfiguratorMoveTarget[]
	readonly canMoveBackward: boolean
	readonly canMoveForward: boolean
	readonly removable: boolean
}

export interface PaletteItemConfiguratorModel {
	readonly current: PaletteItemConfiguratorDescriptor | undefined
	open(target: PaletteConfiguredItemTarget, surface: PaletteSurfaceContext): void
	close(): void
	clear(): void
	setPresenter(presenter: string | undefined): void
	moveBackward(): void
	moveForward(): void
	moveToToolbar(toolbar: PaletteToolbar): void
	remove(): void
}

type PaletteItemConfiguratorState = {
	target: PaletteConfiguredItemTarget | undefined
	surface: PaletteSurfaceContext | undefined
}

type PaletteItemConfiguratorDescriptorResolverProps = {
	readonly palette: PaletteModel
	readonly target: PaletteConfiguredItemTarget
	readonly resolved: PaletteResolvedDisplayItem
	readonly surface: PaletteSurfaceContext
}

export type PaletteItemConfiguratorDescriptorResolvers = {
	readonly getTitle: (props: PaletteItemConfiguratorDescriptorResolverProps) => string
	readonly getSubtitle?: (
		props: PaletteItemConfiguratorDescriptorResolverProps
	) => string | undefined
	readonly getPresenterChoices: (
		props: PaletteItemConfiguratorDescriptorResolverProps
	) => readonly PaletteConfiguratorPresenterChoice[]
	readonly getMoveTargets?: (
		props: PaletteItemConfiguratorDescriptorResolverProps
	) => readonly PaletteConfiguratorMoveTarget[]
	readonly getPreferredRenderMode?: (
		props: PaletteItemConfiguratorDescriptorResolverProps
	) => 'anchored' | 'panel' | 'host-choice' | undefined
}

export function getPaletteDisplayItemIdentity(
	item: PaletteDisplayItem
): PaletteDisplayItemIdentity {
	switch (item.kind) {
		case 'intent':
			return { id: item.intentId, kind: 'intent' }
		case 'editor':
			return { id: item.entryId, kind: 'editor' }
		case 'item-group': {
			const optionsHash =
				item.group.kind === 'enum-options' ? [...item.group.options].sort().join('|') : ''
			return {
				id: `group:${item.group.entryId}:${item.group.kind}:${optionsHash}`,
				kind: 'item-group',
			}
		}
	}
}

export function paletteItemConfiguratorModel(props: {
	palette: PaletteModel
	customization: PaletteDisplayCustomizationModel
	resolvers: PaletteItemConfiguratorDescriptorResolvers
}): PaletteItemConfiguratorModel {
	const { palette, customization, resolvers } = props
	const state = reactive<PaletteItemConfiguratorState>({
		target: undefined,
		surface: undefined,
	})

	function findCurrentToolbar(target: PaletteConfiguredItemTarget): PaletteToolbar {
		return findToolbar(palette, target.toolbar)
	}

	function findCurrentItem(target: PaletteConfiguredItemTarget): PaletteDisplayItem | undefined {
		const toolbar = findCurrentToolbar(target)
		return toolbar.items.find((item) => {
			const identity = getPaletteDisplayItemIdentity(item)
			return identity.id === target.identity.id && identity.kind === target.identity.kind
		})
	}

	function currentDescriptor(): PaletteItemConfiguratorDescriptor | undefined {
		const target = state.target
		const surface = state.surface
		if (!target || !surface) return undefined
		const toolbar = findCurrentToolbar(target)
		const item = findCurrentItem(target)
		if (!item) return undefined
		const resolved = palette.resolveDisplayItem(item)
		if (!resolved) return undefined
		const nextTarget: PaletteConfiguredItemTarget = {
			toolbar,
			item,
			identity: getPaletteDisplayItemIdentity(item),
		}
		const resolverProps: PaletteItemConfiguratorDescriptorResolverProps = {
			palette,
			target: nextTarget,
			resolved,
			surface,
		}
		const items = toolbar.items
		const index = items.findIndex((entry) => {
			const identity = getPaletteDisplayItemIdentity(entry)
			return identity.id === nextTarget.identity.id && identity.kind === nextTarget.identity.kind
		})
		return {
			target: nextTarget,
			resolved,
			surface,
			title: resolvers.getTitle(resolverProps),
			subtitle: resolvers.getSubtitle?.(resolverProps),
			preferredRenderMode: resolvers.getPreferredRenderMode?.(resolverProps),
			presenterChoices: resolvers.getPresenterChoices(resolverProps),
			moveTargets: resolvers.getMoveTargets?.(resolverProps) ?? [],
			canMoveBackward: index > 0,
			canMoveForward: index >= 0 && index < items.length - 1,
			removable: true,
		}
	}

	function requireCurrent(): PaletteItemConfiguratorDescriptor {
		const current = currentDescriptor()
		if (!current) {
			throw new Error('No configured palette item')
		}
		return current
	}

	function currentIndex(current: PaletteItemConfiguratorDescriptor): number {
		return current.target.toolbar.items.findIndex((entry) => {
			const identity = getPaletteDisplayItemIdentity(entry)
			return (
				identity.id === current.target.identity.id && identity.kind === current.target.identity.kind
			)
		})
	}

	return {
		get current() {
			return currentDescriptor()
		},
		open(target: PaletteConfiguredItemTarget, surface: PaletteSurfaceContext) {
			state.target = target
			state.surface = surface
		},
		close() {
			state.target = undefined
			state.surface = undefined
		},
		clear() {
			state.target = undefined
			state.surface = undefined
		},
		setPresenter(presenter: string | undefined) {
			const current = requireCurrent()
			customization.setPresenter(current.target.toolbar, current.target.item, presenter)
		},
		moveBackward() {
			const current = requireCurrent()
			const index = currentIndex(current)
			if (index <= 0) return
			customization.moveWithinToolbar(current.target.toolbar, current.target.item, index - 1)
		},
		moveForward() {
			const current = requireCurrent()
			const index = currentIndex(current)
			if (index < 0 || index >= current.target.toolbar.items.length - 1) return
			customization.moveWithinToolbar(current.target.toolbar, current.target.item, index + 1)
		},
		moveToToolbar(toolbar: PaletteToolbar) {
			const current = requireCurrent()
			customization.moveToToolbar(current.target.toolbar, current.target.item, toolbar)
			state.target = {
				toolbar,
				item: current.target.item,
				identity: current.target.identity,
			}
		},
		remove() {
			const current = requireCurrent()
			customization.removeFromToolbar(current.target.toolbar, current.target.item)
			state.target = undefined
			state.surface = undefined
		},
	}
}

export function paletteToolbarModel(props: {
	palette: PaletteModel
	toolbar: PaletteToolbar
}): PaletteToolbarModel {
	const { palette, toolbar } = props

	const state = reactive<{ items: readonly PaletteResolvedDisplayItem[] }>({ items: [] })

	effect`paletteToolbarModel.items`(() => {
		const currentToolbar = findToolbar(palette, toolbar)
		state.items = currentToolbar.items
			.map((item: PaletteToolbar['items'][number]) => palette.resolveDisplayItem(item))
			.filter(
				(item: PaletteResolvedDisplayItem | undefined): item is PaletteResolvedDisplayItem =>
					item !== undefined
			)
	})

	return {
		get items() {
			return state.items
		},
	}
}

export function paletteDisplayCustomizationModel(props: {
	palette: PaletteModel
	container?: { removeToolbar(toolbar: PaletteToolbar): void }
}): PaletteDisplayCustomizationModel {
	const { palette, container } = props

	function getItemIdentity(item: PaletteDisplayItem): {
		id: string
		kind: 'intent' | 'editor' | 'item-group'
	} {
		switch (item.kind) {
			case 'intent':
				return { id: item.intentId, kind: 'intent' }
			case 'editor':
				return { id: item.entryId, kind: 'editor' }
			case 'item-group': {
				const optionsHash =
					item.group.kind === 'enum-options' ? [...item.group.options].sort().join('|') : ''
				return {
					id: `group:${item.group.entryId}:${item.group.kind}:${optionsHash}`,
					kind: 'item-group',
				}
			}
		}
	}

	function findItemIndex(items: readonly PaletteDisplayItem[], item: PaletteDisplayItem): number {
		const { id: itemId, kind } = getItemIdentity(item)
		return items.findIndex((item: PaletteDisplayItem) => {
			const itemIdentity = getItemIdentity(item)
			return itemIdentity.id === itemId && itemIdentity.kind === kind
		})
	}

	function matchesItem(currentItem: PaletteDisplayItem, targetItem: PaletteDisplayItem): boolean {
		const currentIdentity = getItemIdentity(currentItem)
		const targetIdentity = getItemIdentity(targetItem)
		return currentIdentity.id === targetIdentity.id && currentIdentity.kind === targetIdentity.kind
	}

	function removeItems(
		items: readonly PaletteDisplayItem[],
		targetItem: PaletteDisplayItem
	): PaletteDisplayItem[] {
		return items.filter((item) => !matchesItem(item, targetItem))
	}

	function addItemToToolbar(
		toolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		index?: number
	): void {
		const currentToolbar = findToolbar(palette, toolbar)
		const { id: itemId } = getItemIdentity(item)
		const existingIndex = currentToolbar.items.findIndex(
			(i: PaletteDisplayItem) => getItemIdentity(i).id === itemId
		)
		if (existingIndex >= 0) {
			const updatedItems = [...currentToolbar.items]
			updatedItems[existingIndex] = item
			updateToolbar(currentToolbar, { ...currentToolbar, items: updatedItems })
			return
		}

		const updatedItems = [...currentToolbar.items]
		if (index !== undefined) {
			updatedItems.splice(index, 0, item)
		} else {
			updatedItems.push(item)
		}

		updateToolbar(currentToolbar, {
			...currentToolbar,
			items: updatedItems,
		})
	}

	function removeToolbarItem(toolbar: PaletteToolbar, item: PaletteDisplayItem): void {
		const currentToolbar = findToolbar(palette, toolbar)
		const updatedItems = removeItems(currentToolbar.items, item)

		if (updatedItems.length === 0 && container) {
			container.removeToolbar(currentToolbar)
			return
		}

		updateToolbar(currentToolbar, { ...currentToolbar, items: updatedItems })
	}

	function moveItemWithinToolbar(
		toolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		nextIndex: number
	): void {
		const currentToolbar = findToolbar(palette, toolbar)
		const currentIndex = findItemIndex(currentToolbar.items, item)
		const { id: itemId, kind } = getItemIdentity(item)
		if (currentIndex < 0) {
			throw new Error(`Item '${itemId}' (${kind}) not found in toolbar`)
		}

		if (nextIndex < 0 || nextIndex > currentToolbar.items.length) {
			throw new Error(
				`Invalid target index ${nextIndex} for toolbar with ${currentToolbar.items.length} items`
			)
		}

		const updatedItems = [...currentToolbar.items]
		const [movedItem] = updatedItems.splice(currentIndex, 1)
		const normalizedIndex = Math.min(Math.max(nextIndex, 0), updatedItems.length)
		updatedItems.splice(normalizedIndex, 0, movedItem)

		updateToolbar(currentToolbar, { ...currentToolbar, items: updatedItems })
	}

	function moveToToolbar(
		sourceToolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		targetToolbar: PaletteToolbar,
		targetIndex?: number
	): void {
		const currentSourceToolbar = findToolbar(palette, sourceToolbar)
		const currentTargetToolbar = findToolbar(palette, targetToolbar)
		if (currentSourceToolbar === currentTargetToolbar) {
			if (targetIndex === undefined) return
			moveItemWithinToolbar(currentSourceToolbar, item, targetIndex)
			return
		}

		moveItemBetweenToolbars(currentSourceToolbar, item, currentTargetToolbar, targetIndex)
	}

	function moveItemBetweenToolbars(
		sourceToolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		targetToolbar: PaletteToolbar,
		targetIndex?: number
	): void {
		const currentIndex = findItemIndex(sourceToolbar.items, item)
		const { id: itemId, kind } = getItemIdentity(item)
		if (currentIndex < 0) {
			throw new Error(`Item '${itemId}' (${kind}) not found in toolbar`)
		}

		const movedItem = sourceToolbar.items[currentIndex]
		const sourceItems = [...sourceToolbar.items]
		sourceItems.splice(currentIndex, 1)

		const targetItems = [...targetToolbar.items]
		const normalizedIndex = Math.min(
			Math.max(targetIndex ?? targetItems.length, 0),
			targetItems.length
		)
		targetItems.splice(normalizedIndex, 0, movedItem)

		if (sourceItems.length === 0 && container) {
			container.removeToolbar(sourceToolbar)
		} else {
			updateToolbar(sourceToolbar, { ...sourceToolbar, items: sourceItems })
		}
		updateToolbar(targetToolbar, { ...targetToolbar, items: targetItems })
	}

	function setToolbarItemPresenter(
		toolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		presenter?: string
	): void {
		const currentToolbar = findToolbar(palette, toolbar)
		const itemIndex = findItemIndex(currentToolbar.items, item)
		const { id: itemId, kind } = getItemIdentity(item)
		if (itemIndex < 0) {
			throw new Error(`Item '${itemId}' (${kind}) not found in toolbar`)
		}

		const currentItem = currentToolbar.items[itemIndex]
		const updatedItems = [...currentToolbar.items]

		if (currentItem.kind === 'item-group') {
			// For item-groups, presenter lives under group.presenter
			const { group, ...baseItem } = currentItem
			const { presenter: _groupPresenter, ...baseGroup } = group
			const updatedGroup =
				presenter === undefined
					? baseGroup
					: { ...baseGroup, presenter: presenter as 'radio-group' | 'segmented' }
			updatedItems[itemIndex] = { ...baseItem, group: updatedGroup }
		} else {
			// For atomic items, presenter is at the top level
			const { presenter: _presenter, ...baseItem } = currentItem
			updatedItems[itemIndex] = presenter === undefined ? baseItem : { ...baseItem, presenter }
		}

		updateToolbar(currentToolbar, { ...currentToolbar, items: updatedItems })
	}

	function updateToolbar(toolbar: PaletteToolbar, updatedToolbar: PaletteToolbar): void {
		const toolbarStack = palette.display.container?.toolbarStack ?? emptyToolbarStack()
		const parkedToolbars = palette.display.container?.parkedToolbars ?? []
		updateDisplay({
			...palette.display,
			container: {
				...(palette.display.container ?? {
					toolbarStack,
					editMode: false,
					parkedToolbars: [],
				}),
				toolbarStack: updateToolbarInStack(toolbarStack, toolbar, updatedToolbar),
				parkedToolbars: updateToolbarInParkedToolbars(parkedToolbars, toolbar, updatedToolbar),
			},
		})
	}

	function updateDisplay(updatedDisplay: PaletteDisplayConfiguration): void {
		const mutableDisplay = palette.display as MutablePaletteDisplayConfiguration
		if (updatedDisplay.container) {
			mutableDisplay.container = {
				...updatedDisplay.container,
				toolbarStack: {
					top: updatedDisplay.container.toolbarStack.top.map((track) => ({
						slots: track.slots.map((slot) => ({
							toolbar: slot.toolbar,
							space: slot.space,
						})),
					})),
					right: updatedDisplay.container.toolbarStack.right.map((track) => ({
						slots: track.slots.map((slot) => ({
							toolbar: slot.toolbar,
							space: slot.space,
						})),
					})),
					bottom: updatedDisplay.container.toolbarStack.bottom.map((track) => ({
						slots: track.slots.map((slot) => ({
							toolbar: slot.toolbar,
							space: slot.space,
						})),
					})),
					left: updatedDisplay.container.toolbarStack.left.map((track) => ({
						slots: track.slots.map((slot) => ({
							toolbar: slot.toolbar,
							space: slot.space,
						})),
					})),
				},
				parkedToolbars: [...(updatedDisplay.container.parkedToolbars ?? [])],
			}
		}
	}

	return {
		addToToolbar: addItemToToolbar,
		removeFromToolbar: removeToolbarItem,
		moveWithinToolbar: moveItemWithinToolbar,
		moveToToolbar,
		setPresenter: setToolbarItemPresenter,
	}
}

// TODO: Please....
export function getDisplayPresenterFamily(
	intent: PaletteIntent,
	entry: PaletteEntryDefinition
): PaletteDisplayPresenterFamily {
	void intent
	switch (entry.schema.type) {
		case 'action':
			return 'action'
		case 'status':
			return 'status'
		case 'boolean':
			return 'boolean'
		case 'number':
			return 'number'
		case 'enum':
			return 'enum'
	}
}

export function getDefaultDisplayPresenter(
	intent: PaletteIntent,
	entry: PaletteEntryDefinition
): string {
	if (intent.mode === 'set' && entry.schema.type === 'enum') {
		return 'radio'
	}

	if ((intent.mode === 'toggle' || intent.mode === 'set') && entry.schema.type === 'boolean') {
		return 'toggle'
	}

	if (intent.mode === 'flip' && entry.schema.type === 'enum') {
		return 'flip'
	}

	if (intent.mode === 'step' && entry.schema.type === 'number') {
		return 'step'
	}

	if (intent.mode === 'stash' && entry.schema.type === 'number') {
		return 'stash'
	}

	if (entry.schema.type === 'status') {
		return 'default'
	}

	return 'button'
}

// Helper function to compute the effective checked state
export function computeCheckedState(
	item: PaletteDisplayItem,
	intent: PaletteIntent,
	entry: PaletteEntryDefinition,
	state: Record<string, unknown>
): boolean {
	if (item.checked !== undefined) {
		return item.checked
	}

	switch (intent.mode) {
		case 'set':
			return state[entry.id] === intent.value

		case 'toggle':
			return Boolean(state[entry.id])

		case 'stash':
			return state[entry.id] === intent.value

		case 'flip':
			return state[entry.id] === intent.values[0]

		default:
			return false
	}
}

export function computeDisabledState(
	item: PaletteDisplayItem,
	intent: PaletteIntent,
	entry: PaletteEntryDefinition,
	state: Record<string, unknown>
): boolean {
	if (item.disabled !== undefined) {
		return item.disabled
	}

	switch (intent.mode) {
		case 'stash':
			return state[entry.id] === intent.value

		case 'set':
			return state[entry.id] === intent.value

		case 'toggle':
			return false

		case 'step':
			if (entry.schema.type === 'number') {
				const currentValue = state[entry.id] as number
				const step = intent.step ?? entry.schema.step ?? 1
				if (step > 0) {
					return entry.schema.max !== undefined && currentValue >= entry.schema.max
				}
				return entry.schema.min !== undefined && currentValue <= entry.schema.min
			}
			return false

		case 'flip':
			return false

		default:
			return false
	}
}
