import { rootEnv } from '@sursaut/core'
import type { ArrangedOrientation } from '../shared/types'
import { arranged } from '../shared/utils'
import {
	isEditableTool,
	isRunTool,
	PaletteError,
	paletteTool,
	resolvePaletteEditor,
} from './palette'
import type { Palette, PaletteBorder, PaletteScope, PaletteToolbar, PaletteTrack } from './types'

function clampUnit(value: number): number {
	return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false
	if (target.isContentEditable) return true
	if (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement
	)
		return true
	return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function actualTrackSpaceAt(track: PaletteTrack, index: number): number {
	let remaining = 1
	for (let cursor = 0; cursor < track.length; cursor += 1) {
		const actualSpace = remaining * clampUnit(track[cursor]?.space ?? 0)
		if (cursor === index) return actualSpace
		remaining -= actualSpace
	}
	return index === track.length ? Math.max(remaining, 0) : 0
}

Object.assign(rootEnv, {
	paletteRoot(element: HTMLElement, palette: Palette): (() => void) | undefined {
		if (!element.hasAttribute('tabindex')) {
			element.tabIndex = 0
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return
			if (isEditableTarget(event.target)) return
			const toolId = palette.keys.resolve(event)
			if (!toolId) return
			event.preventDefault()
			event.stopPropagation()
			const tool = paletteTool(palette, toolId)
			if (isRunTool(tool)) {
				if (tool.can) tool.run()
			} else if (isEditableTool(tool) && tool.type === 'boolean') tool.value = !tool.value
			else throw new PaletteError(`Palette binding "${toolId}" did not resolve to a runnable tool`)
		}

		element.addEventListener('keydown', onKeyDown)
		return () => {
			element.removeEventListener('keydown', onKeyDown)
		}
	},
})

export function Toolbar(
	props: {
		toolbar: PaletteToolbar
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
	},
	scope: PaletteScope
) {
	const { palette } = scope
	if (!palette) throw new Error('No palette to expose')
	const o = arranged(scope, { density: 'compact' })
	return (
		<div {...props.el} class={['toolbar', o.class, props.el?.class]}>
			<for each={props.toolbar.items}>
				{(item) => {
					const tool = paletteTool(palette, item.tool)
					const spec = resolvePaletteEditor(palette, item, tool)
					if (spec) {
						const Editor = spec.editor
						return <Editor item={item} tool={tool} scope={scope} flags={spec.flags ?? {}} />
					}
					if (palette.editor) return palette.editor(item, tool, scope)
					throw new PaletteError(`No editor available for palette tool "${item.tool}"`)
				}}
			</for>
		</div>
	)
}

export function TrackSpace(props: { space: number }) {
	return (
		<div
			class="toolbar-track-space"
			style={{ flexBasis: `${props.space * 100}%`, flexGrow: `${Math.max(props.space, 0.0001)}` }}
		/>
	)
}

export function ToolbarTrack(
	props: {
		track: PaletteTrack
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
	},
	_scope: PaletteScope
) {
	return (
		<div {...props.el} class="toolbar-track">
			<TrackSpace space={actualTrackSpaceAt(props.track, 0)} />
			<for each={props.track}>
				{(item) => {
					const index = props.track.indexOf(item)
					return (
						<>
							<div class="toolbar-track-slot">
								<Toolbar toolbar={item.toolbar} direction={props.direction} el={props.toolbar} />
							</div>
							<TrackSpace space={actualTrackSpaceAt(props.track, index + 1)} />
						</>
					)
				}}
			</for>
		</div>
	)
}

export function ToolbarBorder(
	props: {
		border: PaletteBorder
		inverse?: boolean
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
		track?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
	},
	scope: PaletteScope
) {
	arranged(scope, { orientation: props.direction })
	const list = props.inverse ? props.border.toReversed() : props.border
	return (
		<div
			{...props.el}
			class={['toolbar-border', `palette-${props.direction}`]}
			use:toolbarsContainer={props.direction}
		>
			<for each={list}>
				{(item) => (
					<ToolbarTrack
						track={item}
						direction={props.direction}
						el={props.track}
						toolbar={props.toolbar}
					/>
				)}
			</for>
		</div>
	)
}

export function Parking(
	props: {
		toolbars: readonly PaletteToolbar[]
		direction: ArrangedOrientation
		el?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
	},
	scope: PaletteScope
) {
	arranged(scope, { orientation: props.direction })
	return (
		<div
			{...props.el}
			class={['palette-parking', `palette-${props.direction}`]}
			use:toolbarsContainer={props.direction}
		>
			<for each={props.toolbars}>
				{(toolbar) => <Toolbar toolbar={toolbar} direction={props.direction} el={props.toolbar} />}
			</for>
		</div>
	)
}

export interface IdeConfig {
	top?: PaletteBorder
	right?: PaletteBorder
	bottom?: PaletteBorder
	left?: PaletteBorder
}

export function Ide(
	props: {
		palette: Palette
		config: IdeConfig
		el?: JSX.IntrinsicElements['div']
		center?: JSX.IntrinsicElements['div']
		border?: JSX.IntrinsicElements['div']
		track?: JSX.IntrinsicElements['div']
		toolbar?: JSX.IntrinsicElements['div']
		parkingEl?: JSX.IntrinsicElements['div']
		children?: JSX.Children
	},
	scope: Record<string, unknown>
) {
	scope.palette = props.palette
	return (
		<div {...props.el} class="palette-ide" use:paletteRoot={props.palette}>
			<ToolbarBorder
				if={props.config.top !== undefined}
				border={props.config.top ?? []}
				direction="horizontal"
				el={props.border}
				track={props.track}
				toolbar={props.toolbar}
			/>
			<div class="palette-ide-middle">
				<ToolbarBorder
					if={props.config.left !== undefined}
					border={props.config.left ?? []}
					direction="vertical"
					el={props.border}
					track={props.track}
					toolbar={props.toolbar}
				/>
				<div {...props.center} class="palette-ide-center">
					{props.children}
				</div>
				<ToolbarBorder
					if={props.config.right !== undefined}
					border={props.config.right ?? []}
					inverse={true}
					direction="vertical"
					el={props.border}
					track={props.track}
					toolbar={props.toolbar}
				/>
			</div>
			<ToolbarBorder
				if={props.config.bottom !== undefined}
				border={props.config.bottom ?? []}
				inverse={true}
				direction="horizontal"
				el={props.border}
				track={props.track}
				toolbar={props.toolbar}
			/>
		</div>
	)
}
