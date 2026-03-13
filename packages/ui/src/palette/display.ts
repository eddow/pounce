import { effect, reactive } from 'mutts'
import type { PaletteModel } from './model'
import type {
	PaletteContainerConfiguration,
	PaletteContainerRegion,
	PaletteContainerToolbarStack,
	PaletteDisplayConfiguration,
	PaletteDisplayItem,
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
}

interface MutablePaletteDisplayConfiguration {
	container?: MutablePaletteContainerConfiguration
}

function flattenToolbarStack(
	toolbarStack: PaletteContainerConfiguration['toolbarStack']
): PaletteToolbar[] {
	return [
		...toolbarStack.top.slots.map((slot) => slot.toolbar),
		...toolbarStack.right.slots.map((slot) => slot.toolbar),
		...toolbarStack.bottom.slots.map((slot) => slot.toolbar),
		...toolbarStack.left.slots.map((slot) => slot.toolbar),
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
		top: {
			slots: toolbarStack.top.slots.map((slot) => ({ toolbar: slot.toolbar, space: slot.space })),
		},
		right: {
			slots: toolbarStack.right.slots.map((slot) => ({ toolbar: slot.toolbar, space: slot.space })),
		},
		bottom: {
			slots: toolbarStack.bottom.slots.map((slot) => ({
				toolbar: slot.toolbar,
				space: slot.space,
			})),
		},
		left: {
			slots: toolbarStack.left.slots.map((slot) => ({ toolbar: slot.toolbar, space: slot.space })),
		},
	}
	for (const region of regions) {
		const index = nextStack[region].slots.findIndex((slot) => slot.toolbar === toolbar)
		if (index < 0) continue
		nextStack[region].slots[index] = {
			toolbar: updatedToolbar,
			space: nextStack[region].slots[index].space,
		}
		return nextStack
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
		top: emptyToolbarTrack(),
		right: emptyToolbarTrack(),
		bottom: emptyToolbarTrack(),
		left: emptyToolbarTrack(),
	}
}

function findToolbar(palette: PaletteModel, toolbar: PaletteToolbar): PaletteToolbar {
	const toolbarStack = palette.display.container?.toolbarStack
	const currentToolbar = toolbarStack ? findToolbarInStack(toolbarStack, toolbar) : undefined
	return currentToolbar ?? toolbar
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
		updateDisplay({
			...palette.display,
			container: {
				...(palette.display.container ?? {
					toolbarStack,
					editMode: false,
				}),
				toolbarStack: updateToolbarInStack(toolbarStack, toolbar, updatedToolbar),
			},
		})
	}

	function updateDisplay(updatedDisplay: PaletteDisplayConfiguration): void {
		const mutableDisplay = palette.display as MutablePaletteDisplayConfiguration
		if (updatedDisplay.container) {
			mutableDisplay.container = {
				...updatedDisplay.container,
				toolbarStack: {
					top: {
						slots: updatedDisplay.container.toolbarStack.top.slots.map((slot) => ({
							toolbar: slot.toolbar,
							space: slot.space,
						})),
					},
					right: {
						slots: updatedDisplay.container.toolbarStack.right.slots.map((slot) => ({
							toolbar: slot.toolbar,
							space: slot.space,
						})),
					},
					bottom: {
						slots: updatedDisplay.container.toolbarStack.bottom.slots.map((slot) => ({
							toolbar: slot.toolbar,
							space: slot.space,
						})),
					},
					left: {
						slots: updatedDisplay.container.toolbarStack.left.slots.map((slot) => ({
							toolbar: slot.toolbar,
							space: slot.space,
						})),
					},
				},
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
