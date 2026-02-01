# Dockview

A dockable panel system built on [dockview-core](https://dockview.io/) with reactive bindings for Pounce.

## Basic Usage

```tsx
import { Dockview } from '@pounce/pico'

const widgets = {
	myPanel: (props, scope) => <div>Panel content</div>,
}

<Dockview widgets={widgets} />
```

## Widgets (Content Components)

Widgets render the main content of each panel. They receive reactive props and a specialized scope.

```tsx
export type DockviewWidgetProps<Params = Record<string, any>, Context = Record<string, any>> = {
	title: string
	size: { width: number; height: number }
	params: Params
	context: Context
}

export interface DockviewWidgetScope {
	dockviewApi?: DockviewApi
	panelApi?: DockviewPanelApi
}

const myWidget = (props: DockviewWidgetProps, { panelApi }: DockviewWidgetScope) => {
	return (
		<div style="padding: 1rem;">
			<h3>{props.title}</h3>
			<p>Size: {props.size.width} x {props.size.height}</p>
			<p>Params: {JSON.stringify(props.params)}</p>
			<button onClick={() => panelApi.close()}>Close Me</button>
		</div>
	)
}

<Dockview widgets={{ myPanel: myWidget }} />
```

## Tabs

Custom tab components share parameters with their panel widget. If no custom tab is provided, a `DefaultTab` with a title and close button is used.

```tsx
const tabWidget = (props: DockviewWidgetProps, { panelApi }: DockviewWidgetScope) => (
	<div style="display: flex; gap: .25rem; align-items: center;">
		<span>{props.title}</span>
		<button onClick={() => props.params.clicks++}>+1 ({props.params.clicks})</button>
		<button onClick={() => panelApi.close()}>&times;</button>
	</div>
)

<Dockview
	widgets={{ myPanel: myWidget }}
	tabs={{ custom: tabWidget }}
/>
```

## Header Actions

Custom components for group header areas (left, right, prefix).

```tsx
export type DockviewHeaderActionProps = {
	group: DockviewGroupPanel
}

const headerAction = ({ group }: DockviewHeaderActionProps) => (
	<div style="padding: 0 4px; font-size: 0.8rem;">
		{group.panels.length} panels
	</div>
)

<Dockview
	widgets={widgets}
	headerRight={headerAction}
/>
```

## Layout Persistence

The `layout` prop enables bidirectional layout synchronization.

### Restore Layout on Initialization

```tsx
const savedLayout = { /* serialized layout from api.toJSON() */ }

<Dockview
	widgets={widgets}
	layout={savedLayout}
/>
```

### Automatic Layout Updates

The `layout` prop automatically updates when the dockview layout changes:

```tsx
const state = reactive({ layout: undefined as SerializedDockview | undefined })

<Dockview
	widgets={widgets}
	layout={state.layout}
/>

// Save layout when it changes
effect(() => {
	if (state.layout) {
		localStorage.setItem('dockview-layout', JSON.stringify(state.layout))
	}
})
```

## API Access

Access the `DockviewApi` to programmatically control panels.

```tsx
const state = reactive({ api: undefined as DockviewApi | undefined })

<Dockview
	widgets={widgets}
	api={state.api}
/>

// After mount, state.api is set
effect(() => {
	if (state.api) {
		state.api.addPanel({
			id: 'panel-1',
			component: 'myPanel',
			title: 'New Panel',
		})
	}
})
```

## Bidirectional Sync

### Title Sync

Panel titles sync bidirectionally between `props.title` and the dockview API.

```tsx
const widget = (props: DockviewWidgetProps) => {
	// Update title via props (forward sync)
	const updateTitle = () => {
		props.title = 'New Title'
	}

	// Title also updates when changed via API (reverse sync)
	// panelApi.setTitle('New Title')
	return (
		<div>
			<h3>{props.title}</h3>
			<button onClick={updateTitle}>Change Title</button>
		</div>
	)
}
```

### Params Sync

Panel parameters sync bidirectionally.

```tsx
const widget = (props: DockviewWidgetProps) => {
	// Update params via props
	const updateParams = () => {
		props.params = { ...props.params, count: (props.params?.count || 0) + 1 }
	}

	return (
		<div>
			<p>Count: {props.params?.count || 0}</p>
			<button onClick={updateParams}>Increment</button>
		</div>
	)
}
```

## Props

- `widgets: Record<string, DockviewWidget<any>>` - Content component registry.
- `tabs?: Record<string, DockviewWidget<any>>` - Tab component registry.
- `headerLeft?: DockviewHeaderAction` - Left header action component.
- `headerRight?: DockviewHeaderAction` - Right header action component.
- `headerPrefix?: DockviewHeaderAction` - Prefix header action component.
- `api?: DockviewApi` - Optional API reference (set after mount).
- `layout?: SerializedDockview` - Serialized layout for restoration (auto-updates).
- `theme?: RelativeTheme` - Theme configuration (supports light/dark switching).
- `options?: FreeDockviewOptions` - dockview-core configuration options.
- `el?: JSX.GlobalHTMLAttributes` - Element attributes for the container.

## Notes

- **Reactivity**: Widget props are reactive; changes sync with the dockview API automatically.
- **Scope**: Widgets and tabs receive `panelApi` in their scope for local control.
- **Theme**: Supports `DockviewTheme` or an object `{ light: DockviewTheme, dark: DockviewTheme }` for automatic switching.
