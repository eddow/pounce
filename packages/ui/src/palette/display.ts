import type { PaletteModel } from './model'
import type {
	PaletteDisplayConfiguration,
	PaletteDisplayItem,
	PaletteDisplayPresenterFamily,
	PaletteEntryDefinition,
	PaletteIntent,
	PaletteResolvedDisplayItem,
	PaletteToolbarDefinition,
	PaletteToolbarId,
} from './types'

// Internal mutable version of display configuration for reactive updates
interface MutablePaletteDisplayConfiguration {
	toolbars: PaletteToolbarDefinition[]
	statusbar?: PaletteDisplayItem[]
}

export interface PaletteToolbarModel {
	readonly items: readonly PaletteResolvedDisplayItem[]
}

export interface PaletteStatusbarModel {
	readonly items: readonly PaletteResolvedDisplayItem[]
}

export interface PaletteDisplayCustomizationModel {
	addToToolbar(toolbarId: PaletteToolbarId, item: PaletteDisplayItem): void
	addToStatusbar(item: PaletteDisplayItem): void
	removeFromToolbar(
		toolbarId: PaletteToolbarId,
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group'
	): void
	removeFromStatusbar(itemId: string, kind: 'intent' | 'editor' | 'item-group'): void
	moveWithinToolbar(
		toolbarId: PaletteToolbarId,
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group',
		nextIndex: number
	): void
	moveToToolbar(
		toolbarId: PaletteToolbarId,
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group',
		targetToolbarId: PaletteToolbarId,
		targetIndex?: number
	): void
	setPresenter(
		toolbarId: PaletteToolbarId,
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group',
		presenter?: string
	): void
}

export function paletteToolbarModel(props: {
	palette: PaletteModel
	toolbar: PaletteToolbarDefinition
}): PaletteToolbarModel {
	const { palette, toolbar } = props

	const items = toolbar.items
		.map((item) => palette.resolveDisplayItem(item))
		.filter((item): item is PaletteResolvedDisplayItem => item !== undefined)

	return { items }
}

export function paletteStatusbarModel(props: { palette: PaletteModel }): PaletteStatusbarModel {
	const { palette } = props

	const items = (palette.display.statusbar ?? [])
		.map((item) => palette.resolveDisplayItem(item))
		.filter((item): item is PaletteResolvedDisplayItem => item !== undefined)

	return { items }
}

export function paletteDisplayCustomizationModel(props: {
	palette: PaletteModel
}): PaletteDisplayCustomizationModel {
	const { palette } = props

	function getItemId(item: PaletteDisplayItem): string {
		switch (item.kind) {
			case 'intent':
				return item.intentId
			case 'editor':
				return item.entryId
			case 'item-group': {
				// Include options in identity to distinguish different subsets of the same entry
				const optionsHash =
					item.group.kind === 'enum-options' ? [...item.group.options].sort().join('|') : ''
				return `group:${item.group.entryId}:${item.group.kind}:${optionsHash}`
			}
		}
	}

	function getItemIdentifier(item: PaletteDisplayItem): {
		id: string
		kind: 'intent' | 'editor' | 'item-group'
	} {
		switch (item.kind) {
			case 'intent':
				return { id: item.intentId, kind: 'intent' }
			case 'editor':
				return { id: item.entryId, kind: 'editor' }
			case 'item-group': {
				// Include options in identity to distinguish different subsets of the same entry
				const optionsHash =
					item.group.kind === 'enum-options' ? [...item.group.options].sort().join('|') : ''
				return {
					id: `group:${item.group.entryId}:${item.group.kind}:${optionsHash}`,
					kind: 'item-group',
				}
			}
		}
	}

	function findToolbar(toolbarId: PaletteToolbarId): PaletteToolbarDefinition {
		const toolbar = palette.display.toolbars.find(
			(t: PaletteToolbarDefinition) => t.id === toolbarId
		)
		if (!toolbar) {
			throw new Error(`Toolbar '${toolbarId}' not found`)
		}
		return toolbar
	}

	function findItemIndex(
		items: readonly PaletteDisplayItem[],
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group'
	): number {
		return items.findIndex((item: PaletteDisplayItem) => {
			const itemIdentifier = getItemIdentifier(item)
			return itemIdentifier.id === itemId && itemIdentifier.kind === kind
		})
	}

	function addToToolbar(toolbarId: PaletteToolbarId, item: PaletteDisplayItem): void {
		const toolbar = findToolbar(toolbarId)

		const itemId = getItemId(item)
		const existingIndex = toolbar.items.findIndex(
			(i: PaletteDisplayItem) => getItemId(i) === itemId
		)
		if (existingIndex >= 0) {
			const updatedItems = [...toolbar.items]
			updatedItems[existingIndex] = item
			updateToolbar(toolbarId, { ...toolbar, items: updatedItems })
			return
		}

		updateToolbar(toolbarId, {
			...toolbar,
			items: [...toolbar.items, item],
		})
	}

	function addToStatusbar(item: PaletteDisplayItem): void {
		const currentStatusbar = palette.display.statusbar ?? []
		const itemId = getItemId(item)
		const existingIndex = currentStatusbar.findIndex(
			(i: PaletteDisplayItem) => getItemId(i) === itemId
		)
		if (existingIndex >= 0) {
			const updatedStatusbar = [...currentStatusbar]
			updatedStatusbar[existingIndex] = item
			updateDisplay({ ...palette.display, statusbar: updatedStatusbar })
			return
		}

		updateDisplay({ ...palette.display, statusbar: [...currentStatusbar, item] })
	}

	function removeFromToolbar(
		toolbarId: PaletteToolbarId,
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group'
	): void {
		const toolbar = findToolbar(toolbarId)

		const updatedItems = toolbar.items.filter((item: PaletteDisplayItem) => {
			const itemIdentifier = getItemIdentifier(item)
			return !(itemIdentifier.id === itemId && itemIdentifier.kind === kind)
		})
		updateToolbar(toolbarId, { ...toolbar, items: updatedItems })
	}

	function removeFromStatusbar(itemId: string, kind: 'intent' | 'editor' | 'item-group'): void {
		const currentStatusbar = palette.display.statusbar ?? []
		const updatedStatusbar = currentStatusbar.filter((item: PaletteDisplayItem) => {
			const itemIdentifier = getItemIdentifier(item)
			return !(itemIdentifier.id === itemId && itemIdentifier.kind === kind)
		})
		updateDisplay({ ...palette.display, statusbar: updatedStatusbar })
	}

	function moveWithinToolbar(
		toolbarId: PaletteToolbarId,
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group',
		nextIndex: number
	): void {
		const toolbar = findToolbar(toolbarId)

		const currentIndex = findItemIndex(toolbar.items, itemId, kind)
		if (currentIndex < 0) {
			throw new Error(`Item '${itemId}' (${kind}) not found in toolbar '${toolbarId}'`)
		}

		if (nextIndex < 0 || nextIndex >= toolbar.items.length) {
			throw new Error(
				`Invalid target index ${nextIndex} for toolbar '${toolbarId}' with ${toolbar.items.length} items`
			)
		}

		const updatedItems = [...toolbar.items]
		const [movedItem] = updatedItems.splice(currentIndex, 1)
		updatedItems.splice(nextIndex, 0, movedItem)

		updateToolbar(toolbarId, { ...toolbar, items: updatedItems })
	}

	function moveToToolbar(
		toolbarId: PaletteToolbarId,
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group',
		targetToolbarId: PaletteToolbarId,
		targetIndex?: number
	): void {
		if (toolbarId === targetToolbarId) {
			if (targetIndex === undefined) return
			moveWithinToolbar(toolbarId, itemId, kind, targetIndex)
			return
		}

		const sourceToolbar = findToolbar(toolbarId)
		const targetToolbar = findToolbar(targetToolbarId)
		const currentIndex = findItemIndex(sourceToolbar.items, itemId, kind)
		if (currentIndex < 0) {
			throw new Error(`Item '${itemId}' (${kind}) not found in toolbar '${toolbarId}'`)
		}

		const item = sourceToolbar.items[currentIndex]
		const sourceItems = [...sourceToolbar.items]
		sourceItems.splice(currentIndex, 1)

		const targetItems = [...targetToolbar.items]
		const normalizedIndex = Math.min(
			Math.max(targetIndex ?? targetItems.length, 0),
			targetItems.length
		)
		targetItems.splice(normalizedIndex, 0, item)

		updateToolbar(toolbarId, { ...sourceToolbar, items: sourceItems })
		updateToolbar(targetToolbarId, { ...targetToolbar, items: targetItems })
	}

	function setPresenter(
		toolbarId: PaletteToolbarId,
		itemId: string,
		kind: 'intent' | 'editor' | 'item-group',
		presenter?: string
	): void {
		const toolbar = findToolbar(toolbarId)

		const itemIndex = findItemIndex(toolbar.items, itemId, kind)
		if (itemIndex < 0) {
			throw new Error(`Item '${itemId}' (${kind}) not found in toolbar '${toolbarId}'`)
		}

		const currentItem = toolbar.items[itemIndex]
		const updatedItems = [...toolbar.items]

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

		updateToolbar(toolbarId, { ...toolbar, items: updatedItems })
	}

	function updateToolbar(
		toolbarId: PaletteToolbarId,
		updatedToolbar: PaletteToolbarDefinition
	): void {
		const updatedToolbars = palette.display.toolbars.map((toolbar: PaletteToolbarDefinition) =>
			toolbar.id === toolbarId ? updatedToolbar : toolbar
		)
		updateDisplay({ ...palette.display, toolbars: updatedToolbars })
	}

	function updateDisplay(updatedDisplay: PaletteDisplayConfiguration): void {
		const mutableDisplay = palette.display as MutablePaletteDisplayConfiguration
		if (updatedDisplay.toolbars) {
			mutableDisplay.toolbars = [...updatedDisplay.toolbars]
		}
		if (updatedDisplay.statusbar !== undefined) {
			mutableDisplay.statusbar = [...updatedDisplay.statusbar]
		}
	}

	return {
		addToToolbar,
		addToStatusbar,
		removeFromToolbar,
		removeFromStatusbar,
		moveWithinToolbar,
		moveToToolbar,
		setPresenter,
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
