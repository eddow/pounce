import { effect, reactive } from 'mutts'
import type { PaletteModel } from './model'
import { getEnumSelectorKey, normalizeEnumSelector } from './selector'
import type {
	PaletteDisplayItem,
	PaletteEntry,
	PaletteIntent,
	PaletteResolvedDisplayItem,
	PaletteToolbar,
} from './types'

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

export function paletteToolbarModel(props: {
	palette: PaletteModel
	toolbar: PaletteToolbar
}): PaletteToolbarModel {
	const { palette, toolbar } = props

	const state = reactive<{ items: readonly PaletteResolvedDisplayItem[] }>({ items: [] })

	effect`paletteToolbarModel.items`(() => {
		state.items = toolbar.items
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
	container?: { removeToolbar(toolbar: PaletteToolbar): void }
}): PaletteDisplayCustomizationModel {
	const { container } = props
	function describeItem(item: PaletteDisplayItem): string {
		switch (item.kind) {
			case 'intent':
				return `intent '${item.intentId}'`
			case 'editor':
				return `editor '${item.entryId}' (${getEnumSelectorKey(normalizeEnumSelector(item.selector))})`
		}
	}

	function addItemToToolbar(
		toolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		index?: number
	): void {
		if (index !== undefined) toolbar.items.splice(index, 0, item)
		else toolbar.items.push(item)
	}

	function removeToolbarItem(toolbar: PaletteToolbar, item: PaletteDisplayItem): void {
		const itemIndex = toolbar.items.indexOf(item)
		if (itemIndex < 0) {
			throw new Error(`${describeItem(item)} not found in toolbar`)
		}
		toolbar.items.splice(itemIndex, 1)

		if (toolbar.items.length === 0 && container) container.removeToolbar(toolbar)
	}

	function moveItemWithinToolbar(
		toolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		nextIndex: number
	): void {
		const currentIndex = toolbar.items.indexOf(item)
		if (currentIndex < 0) {
			throw new Error(`${describeItem(item)} not found in toolbar`)
		}

		if (nextIndex < 0 || nextIndex > toolbar.items.length) {
			throw new Error(
				`Invalid target index ${nextIndex} for toolbar with ${toolbar.items.length} items`
			)
		}

		const [movedItem] = toolbar.items.splice(currentIndex, 1)
		const normalizedIndex = Math.min(Math.max(nextIndex, 0), toolbar.items.length)
		toolbar.items.splice(normalizedIndex, 0, movedItem)
	}

	function moveToToolbar(
		sourceToolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		targetToolbar: PaletteToolbar,
		targetIndex?: number
	): void {
		if (sourceToolbar === targetToolbar) {
			if (targetIndex === undefined) return
			moveItemWithinToolbar(sourceToolbar, item, targetIndex)
			return
		}

		const currentIndex = sourceToolbar.items.indexOf(item)
		if (currentIndex < 0) {
			throw new Error(`${describeItem(item)} not found in toolbar`)
		}

		const movedItem = sourceToolbar.items[currentIndex]
		sourceToolbar.items.splice(currentIndex, 1)
		const normalizedIndex = Math.min(
			Math.max(targetIndex ?? targetToolbar.items.length, 0),
			targetToolbar.items.length
		)
		targetToolbar.items.splice(normalizedIndex, 0, movedItem)

		if (sourceToolbar.items.length === 0 && container) {
			container.removeToolbar(sourceToolbar)
		}
	}

	function setToolbarItemPresenter(
		toolbar: PaletteToolbar,
		item: PaletteDisplayItem,
		presenter?: string
	): void {
		const itemIndex = toolbar.items.indexOf(item)
		if (itemIndex < 0) {
			throw new Error(`${describeItem(item)} not found in toolbar`)
		}

		const currentItem = toolbar.items[itemIndex]
		if (presenter === undefined) {
			delete currentItem.presenter
			return
		}
		currentItem.presenter = presenter
	}

	return {
		addToToolbar: addItemToToolbar,
		removeFromToolbar: removeToolbarItem,
		moveWithinToolbar: moveItemWithinToolbar,
		moveToToolbar,
		setPresenter: setToolbarItemPresenter,
	}
}

export function getDefaultDisplayPresenter(intent: PaletteIntent, entry: PaletteEntry): string {
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
	entry: PaletteEntry,
	palette: PaletteModel
): boolean {
	if (item.checked !== undefined) {
		return item.checked
	}

	const value = entry.schema.type === 'action' ? undefined : entry.schema.get(palette)

	switch (intent.mode) {
		case 'set':
			return value === intent.value

		case 'toggle':
			return Boolean(value)

		case 'stash':
			return value === intent.value

		case 'flip':
			return value === intent.values[0]

		default:
			return false
	}
}

export function computeDisabledState(
	item: PaletteDisplayItem,
	intent: PaletteIntent,
	entry: PaletteEntry,
	palette: PaletteModel
): boolean {
	if (item.disabled !== undefined) {
		return item.disabled
	}

	const value = entry.schema.type === 'action' ? undefined : entry.schema.get(palette)

	switch (intent.mode) {
		case 'stash':
			return value === intent.value

		case 'set':
			return value === intent.value

		case 'toggle':
			return false

		case 'step':
			if (entry.schema.type === 'number') {
				const currentValue = entry.schema.get(palette)
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
