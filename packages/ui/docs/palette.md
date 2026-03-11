# Palette

The palette module is a headless command, search, and toolbar-customization system exported from the `@pounce/ui/palette` subpath.

It gives you:

- a registry of palette entries
- derived and explicit intents
- reactive state and runtime storage
- search across commands and entries
- command-box behavior
- add-item behavior for toolbar customization
- display and container customization models

It does **not** render any UI by itself.

Your app or adapter owns:

- markup
- icons
- presenter dictionaries
- styling
- keyboard wiring beyond the headless models

## Import path

```ts
import {
	createPaletteModel,
	paletteCommandBoxModel,
	paletteAddItemModel,
	paletteToolbarModel,
	paletteStatusbarModel,
	paletteDisplayCustomizationModel,
	paletteContainerModel,
	type PaletteEntryDefinition,
	type PaletteIntent,
	type PaletteDisplayItem,
} from '@pounce/ui/palette'
```

Use the palette subpath, not the root `@pounce/ui` entry.

## Core idea

The palette is built around three layers:

1. **Entries**
   - the things your application exposes
   - examples: `ui.theme`, `editor.fontSize`, `file.save`

2. **Intents**
   - executable commands that target entries
   - examples: `ui.theme:set:dark`, `editor.fontSize:step:up`, `file.save:run`

3. **Display items**
   - toolbar/statusbar items that point to either:
     - an intent
     - an entry editor

The palette model owns the reactive data. Your UI resolves that data into buttons, toggles, sliders, chips, command results, and editor widgets.

## `createPaletteModel()`

This is the root state container.

```ts
const palette = createPaletteModel({
	definitions: [
		{ id: 'ui.theme', label: 'Theme', schema: { type: 'enum', options: ['light', 'dark'] } },
		{ id: 'ui.sidebar', label: 'Sidebar', schema: { type: 'boolean' } },
		{ id: 'editor.fontSize', label: 'Font Size', schema: { type: 'number', min: 10, max: 20, step: 1 } },
		{
			id: 'file.save',
			label: 'Save',
			schema: {
				type: 'action',
				run: (palette) => {
					console.log('save', palette.state)
				},
			},
		},
	],
})
```

### Main fields

- `palette.registry`
  - registered entry definitions

- `palette.intents`
  - explicit intents plus derivation

- `palette.state`
  - reactive entry values

- `palette.runtime`
  - reactive internal runtime storage used by palette mechanics such as `stash`

- `palette.display`
  - reactive toolbar, statusbar, and container configuration

- `palette.search`
  - reactive query and results

### Main methods

- `palette.run(intentId)`
  - resolves and executes an intent

- `palette.derive(entryId)`
  - derives intents for one entry

- `palette.resolveEntry(entryId)`
  - returns an entry definition

- `palette.resolveIntent(intentId)`
  - resolves either a registered or lazily derived intent together with its target entry

- `palette.resolveDisplayItem(item)`
  - resolves a display item into a concrete intent+entry pair or editor+entry pair

## Entry definitions

Each palette entry is a definition with an id, label, optional metadata, and a schema.

```ts
type PaletteEntryDefinition = {
	id: string
	label: string
	description?: string
	icon?: string | PounceElement
	categories?: readonly string[]
	schema: PaletteEntrySchema
}
```

### Supported schema types

#### `action`

Runs imperative behavior.

```ts
{
	id: 'file.save',
	label: 'Save File',
	schema: {
		type: 'action',
		run: (palette, intent) => {
			return saveCurrentDocument()
		},
	},
}
```

Derived intent:

- `file.save:run`

#### `boolean`

Owns a boolean-like setting in `palette.state[entry.id]`.

```ts
{
	id: 'ui.sidebar',
	label: 'Sidebar',
	categories: ['ui'],
	schema: { type: 'boolean' },
}
```

Derived intents:

- `ui.sidebar:set:true`
- `ui.sidebar:set:false`
- `ui.sidebar:toggle`

#### `enum`

Owns a finite string choice.

```ts
{
	id: 'ui.theme',
	label: 'Theme',
	categories: ['ui', 'appearance'],
	schema: {
		type: 'enum',
		options: [
			{ value: 'light', label: 'Light' },
			{ value: 'dark', label: 'Dark', categories: ['dim'] },
		],
	},
}
```

Derived intents:

- one `set` intent per option
- option categories are merged with entry categories

Examples:

- `ui.theme:set:light`
- `ui.theme:set:dark`

#### `number`

Owns a numeric value with relative commands and absolute presets.

```ts
{
	id: 'editor.fontSize',
	label: 'Font Size',
	categories: ['editor'],
	schema: { type: 'number', min: 10, max: 20, step: 1 },
}
```

Derived intents include:

- directional step commands
  - `editor.fontSize:step:up`
  - `editor.fontSize:step:down`

- stash presets derived from range values
  - min
  - max
  - zero when it is in range
  - midpoint when the range is wide enough

Examples:

- `editor.fontSize:stash:10`
- `editor.fontSize:stash:20`
- `game.speed:stash:0`

`stash` intents also carry fallback behavior used when restoring is not possible.

Numeric derived intents do not currently add their own extra category metadata. Category filtering and search still work through the target entry's categories.

#### `status`

Read-only status entry.

```ts
{
	id: 'sync.state',
	label: 'Sync State',
	schema: {
		type: 'status',
		read: (palette) => palette.runtime.syncState,
	},
}
```

Status entries do not derive executable intents.

## Explicit intents

You can register intents in addition to the derived ones.

```ts
const palette = createPaletteModel({
	definitions,
	intents: [
		{
			id: 'file.save:quick',
			targetId: 'file.save',
			mode: 'run',
			label: 'Quick Save',
			binding: 'Ctrl+S',
		},
	],
})
```

Use explicit intents when:

- the default derivation is not enough
- you need custom labels or descriptions
- you want custom bindings
- you want multiple commands targeting the same entry

## Execution semantics

Execution is centralized through `palette.run(intentId)` and `executePaletteIntent()`.

### Built-in behavior by intent mode

- `run`
  - calls the target action entry's `run()` function

- `set`
  - writes `intent.value` into `palette.state[entry.id]`

- `toggle`
  - writes the boolean negation of the current state value

- `step`
  - increments or decrements the current numeric value
  - clamps to `min` and `max` when the entry is numeric

- `flip`
  - toggles between two values

- `stash`
  - first activation stores the current value in `palette.runtime[intent.id]` and applies the stash value
  - second activation restores the stashed value
  - if there is no stashed value, fallback behavior is used

This keeps all command execution in one place even when the UI renders the same intent in different ways.

## Search

The palette model includes a search model:

```ts
palette.search.search({
	text: 'dark',
	categories: ['ui'],
})

const results = palette.search.results
```

Search behavior:

- matches both explicit and derived intents
- falls back to entry results when no intent for that entry has already matched
- searches across labels, ids, descriptions, and categories
- supports category filtering for both entry and intent metadata

Result shape:

- `{ kind: 'intent', intent, entry }`
- `{ kind: 'entry', entry }`

## `paletteCommandBoxModel()`

This model wraps `palette.search` with command-input behavior.

```ts
const commandBox = paletteCommandBoxModel({
	palette,
	placeholder: 'Search commands and settings…',
})
```

It exposes:

- `input.value`
- `input.placeholder`
- `input.clear()`
- `query`
- `results`
- `categories.available`
- `categories.active`
- `categories.toggle(category)`
- `categories.removeLast()`
- `categories.clear()`
- `selection.index`
- `selection.item`
- `selection.next()`
- `selection.previous()`
- `selection.clear()`
- `execute(intentId?)`

### Category chips

The command-box model supports two category flows:

- **manual categories**
  - toggled from UI chips

- **typed categories**
  - recognized tokens inside the input text are promoted into active categories

Example:

```ts
commandBox.input.value = 'ui dark'
```

If `ui` is a known category, the model treats it as a category filter and keeps `dark` as free text.

`categories.clear()` currently clears manual category selections only. To remove typed categories, clear or rewrite the input text.

### Keyboard behavior

The model gives you the state needed to implement:

- arrow-key result navigation
- chip removal
- enter-to-run for selected intents

It does not install DOM listeners for you.

## Display configuration

`palette.display` is the reactive configuration that describes how the palette should surface commands and editors.

```ts
const palette = createPaletteModel({
	definitions,
	display: {
		toolbars: [
			{
				id: 'main',
				items: [
					{ kind: 'intent', intentId: 'ui.theme:set:dark', presenter: 'radio', showText: true },
					{ kind: 'editor', entryId: 'editor.fontSize', presenter: 'slider', showText: true },
				],
			},
		],
		statusbar: [{ kind: 'intent', intentId: 'file.save:quick' }],
	},
})
```

### Display item kinds

#### Intent display items

```ts
{ kind: 'intent', intentId: 'ui.theme:set:dark', presenter: 'radio' }
```

Use these when the surface should trigger a command.

#### Editor display items

```ts
{ kind: 'editor', entryId: 'editor.fontSize', presenter: 'slider' }
```

Use these when the surface should render a richer entry-bound editor.

#### Item-group display items

```ts
{ 
	kind: 'item-group',
	group: {
		kind: 'enum-options',
		entryId: 'ui.theme',
		options: ['light', 'dark'],
		presenter: 'radio-group',
	}
}
```

Use these when a toolbar-like surface should present multiple related options as a cohesive grouped control. Item-groups currently target enum entries and resolve to derived intents internally.

**Key distinction**: Surfaces own placement and shell behavior, while item-groups own grouped presentation of semantic content.

### Presenter selection

The palette core only stores presenter keys as strings.

Helpers exported from the module:

- `getDisplayPresenterFamily(intent, entry)`
- `getDefaultDisplayPresenter(intent, entry)`
- `computeCheckedState(item, intent, entry, state)`
- `computeDisabledState(item, intent, entry, state)`

Atomic display items store presenter keys on `item.presenter`.

Item-groups store grouped presenter keys on `item.group.presenter`, for example `radio-group` or `segmented`.

Your consuming UI maps presenter keys such as `toggle`, `radio`, `step`, `stash`, `slider`, `radio-group`, or `segmented` to real components or markup.

## Toolbar and statusbar models

### `paletteToolbarModel()`

Resolves one toolbar definition into concrete display items.

```ts
const toolbar = palette.display.toolbars[0]
const toolbarModel = paletteToolbarModel({ palette, toolbar })
```

`toolbarModel.items` contains resolved display items ready for rendering.

### `paletteStatusbarModel()`

Resolves the configured statusbar items.

```ts
const statusbar = paletteStatusbarModel({ palette })
```

## `paletteDisplayCustomizationModel()`

This model mutates `palette.display` for editor/customization UIs.

```ts
const customization = paletteDisplayCustomizationModel({ palette })
```

Main operations:

- `addToToolbar(toolbarId, item)`
- `addToStatusbar(item)`
- `removeFromToolbar(toolbarId, itemId, kind)`
- `removeFromStatusbar(itemId, kind)`
- `moveWithinToolbar(toolbarId, itemId, kind, nextIndex)`
- `moveToToolbar(toolbarId, itemId, kind, targetToolbarId, targetIndex?)`
- `setPresenter(toolbarId, itemId, kind, presenter?)`

These operations support atomic items (`intent`, `editor`) and composite items (`item-group`) in toolbar/statusbar display customization flows.

`moveToToolbar()` is specifically a toolbar-to-toolbar content move, not a generic cross-surface content migration API for every container surface type.

This is the right model to use when you build:

- toolbar editors
- item configuration popovers
- move/reorder UI
- saveable user customization flows

## `paletteAddItemModel()`

This model powers an “add item” picker for toolbar customization.

```ts
const addItem = paletteAddItemModel({ palette })
```

It exposes:

- `all`
  - every addable candidate

- `search(query, { exclude })`
  - text search over candidates, optionally excluding items already present on a surface

- `matchesDisplayItem(displayItem, candidate)`
  - helper for de-duplication logic

Candidate kinds:

- `{ kind: 'intent', intent, entry }`
- `{ kind: 'editor', entry }`
- `{ kind: 'item-group', entry, group }`

For enum entries, grouped candidates are generated with a deterministic first-slice strategy:

- 2 options
  - a single natural pair
- 3+ options with `light` and `dark`
  - a curated `light | dark` pair
  - a full-set grouped candidate
- 3+ options without `light` and `dark`
  - a full-set grouped candidate

Candidate order is:

- registered intents
- derived intents
- editors
- item-groups

By default, editor candidates are created for:

- enum entries
- number entries

You can override that behavior:

```ts
const addItem = paletteAddItemModel({
	palette,
	canEditEntry: (entry) => entry.schema.type !== 'status',
})
```

## `paletteContainerModel()`

This model manages palette-capable regions around arbitrary content using **surfaces** as the primary structural concept.

```ts
const container = paletteContainerModel({ palette })
```

It exposes:

- `editMode`
- `surfaces` - the container surfaces (toolbar, command, settings, status)
- `dropTargets`
- `insertionPoints`
- `enterEditMode()`
- `exitEditMode()`
- `createSurface(region, type, label?)`
- `removeSurface(surfaceId)`
- `moveSurface(surfaceId, targetRegion, targetIndex?)`
- `renameSurface(surfaceId, label)`
- `showSurface(surfaceId)`
- `hideSurface(surfaceId)`
- `getSurfacesInRegion(region)`
- `getInsertionPointsInRegion(region)`

### Surface-based container concepts

- **region**
  - one of `top`, `right`, `bottom`, `left`
  - where surfaces are placed in the container layout

- **surface**
  - the primary container abstraction for palette-hosted blocks
  - types include `toolbar`, `command`, `settings`, `status`
  - owns placement, visibility, ordering, and shell behavior

- **toolbar surface**
  - a surface whose id is also used as a toolbar id in `palette.display.toolbars`
  - links container layout to toolbar content

### Surface types

The palette defines four core surface types:

- **`toolbar`**
  - hosts configurable toolbar items
  - linked to a toolbar definition in `palette.display.toolbars`
  - supports add/remove/reorder of display items

- **`command`**
  - hosts command palette or command-box functionality
  - typically a single surface per container
  - focuses on search and command execution

- **`settings`**
  - hosts settings and configuration UI
  - typically contains editors for complex entries
  - emphasizes detailed control over quick actions

- **`status`**
  - hosts status information and read-only displays
  - shows system state, notifications, or progress
  - emphasizes monitoring over interaction

### Surface shell metadata

Each surface includes layout-oriented shell metadata:

```ts
type PaletteContainerSurface = {
	readonly id: string           // unique surface identifier
	readonly type: PaletteSurfaceType  // toolbar | command | settings | status
	readonly region: PaletteContainerRegion  // top | right | bottom | left
	readonly visible: boolean      // whether the surface is shown
	readonly position?: number     // ordering within its region
	readonly label?: string        // user-facing surface name
}
```

This metadata supports:
- **Placement** - `region` and `position` for layout
- **Visibility** - `visible` for show/hide behavior
- **Identity** - `id` and `label` for user interaction
- **Ordering** - `position` for drag-and-drop reordering

### Surface responsibilities: layout vs presentation

Surfaces are **layout-oriented** containers, not presentation controllers:

**Surface responsibilities (layout):**
- Where a palette block lives (region, position)
- Whether the block is visible or hidden
- Shell-level drag handle behavior
- Surface labeling and chrome
- Ordering among perimeter blocks

**NOT surface responsibilities (presentation):**
- How individual items render within the surface
- Grouped display strategies (e.g., enum → radio group)
- Presenter selection for specific items
- Item-level styling or behavior

This separation allows:
- The same entry to appear differently across surfaces
- Flexible presentation strategies without layout complexity
- Clear boundaries between container management and content rendering

Helper:

- `resolveContainerSurface(surface, palette)`
  - links a surface back to its toolbar definition when applicable

## Minimal usage example

```ts
import {
	createPaletteModel,
	paletteCommandBoxModel,
	paletteToolbarModel,
	paletteDisplayCustomizationModel,
} from '@pounce/ui/palette'

const palette = createPaletteModel({
	definitions: [
		{ id: 'ui.theme', label: 'Theme', schema: { type: 'enum', options: ['light', 'dark'] } },
		{ id: 'ui.sidebar', label: 'Sidebar', schema: { type: 'boolean' } },
	],
	intents: [
		{ id: 'ui.sidebar:focus', targetId: 'ui.sidebar', mode: 'run', label: 'Focus Sidebar Toggle' },
	],
	display: {
		toolbars: [
			{
				id: 'main',
				items: [
					{ kind: 'intent', intentId: 'ui.theme:set:light', presenter: 'radio', showText: true },
					{ kind: 'intent', intentId: 'ui.theme:set:dark', presenter: 'radio', showText: true },
				],
			},
		],
	},
})

const commandBox = paletteCommandBoxModel({ palette })
const customization = paletteDisplayCustomizationModel({ palette })
const toolbarModel = paletteToolbarModel({ palette, toolbar: palette.display.toolbars[0] })

commandBox.input.value = 'dark'
const first = commandBox.results[0]
if (first?.kind === 'intent') {
	palette.run(first.intent.id)
}

customization.addToToolbar('main', {
	kind: 'editor',
	entryId: 'ui.theme',
	presenter: 'select',
	showText: true,
})

## Grouped display example

Instead of manually authoring individual intent items, you can use item-groups for cleaner enum presentation:

```ts
import { createPaletteModel, paletteDisplayCustomizationModel } from '@pounce/ui/palette'

const palette = createPaletteModel({
	definitions: [
		{ 
			id: 'ui.theme', 
			label: 'Theme', 
			schema: { type: 'enum', options: ['light', 'dark', 'system'] } 
		},
	],
	display: {
		toolbars: [
			{
				id: 'main',
				items: [
					// Grouped presentation: enum subset -> radio-button-group
					{
						kind: 'item-group',
						group: {
							kind: 'enum-options',
							entryId: 'ui.theme',
							options: ['light', 'dark'], // curated subset
							presenter: 'radio-group',
						}
					},
				],
			},
			{
				id: 'settings',
				items: [],
			},
		],
	},
})

// The item-group resolves to derived intents internally
// but presents as a cohesive radio-button-group control
const customization = paletteDisplayCustomizationModel({ palette })

// You can still add the same entry differently elsewhere
customization.addToToolbar('settings', {
	kind: 'editor',
	entryId: 'ui.theme',
	presenter: 'select',
	showText: true,
})
```

**Benefits of item-groups:**
- Cleaner toolbar configuration (1 item vs 3+ individual intents)
- Curated subsets (e.g., light/dark pair, excluding system option)
- Consistent grouped presentation (radio-group, segmented, etc.)
- Same semantic content can appear differently across surfaces

## Notes

- The palette API is **headless**. It is meant to be consumed by app-level or adapter-level rendering.
- `palette.display` and `palette.display.container` are reactive configuration, not component instances.
- Search returns intent results first, then unmatched entry results.
- The command-box model reuses the same underlying search model as the palette itself.
- Presenter keys are just strings. The consuming UI decides what `radio`, `toggle`, `stash`, `slider`, or `stars` actually render.
- Item-group presenter keys such as `radio-group` and `segmented` are also UI-owned. The palette core resolves grouped entries to derived intents but does not ship a concrete grouped widget.
- The palette module is exported from `@pounce/ui/palette`, not from the root `@pounce/ui` entry.
