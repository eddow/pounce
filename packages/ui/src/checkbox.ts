import { isString, PounceElement } from '@pounce/core'
import { isObject } from 'mutts'
import type {
	CheckedProps,
	DisableableProps,
	ElementPassthroughProps,
	VariantProps,
} from './shared/types'

// TODO: both for checkbox and radio: allow 3-state? (radio: impeach set checked=false)
// ── Shared prop base ────────────────────────────────────────────────────────

type ControlBaseProps = VariantProps &
	DisableableProps &
	CheckedProps &
	ElementPassthroughProps<'input'> & {
		label?: JSX.Element | string
		description?: JSX.Element | string
		name?: string
		children?: JSX.Element | string
	}

// ── Per-control props ───────────────────────────────────────────────────────

export type CheckboxProps = ControlBaseProps & {
	checked?: boolean
}

export type RadioProps<Value = unknown> = ControlBaseProps & {
	value?: Value
	/**
	 * Two-way binding variable for the radio group.
	 * `checked` is derived from `group === value`.
	 * On selection, `group` is written back to `value` (via Pounce's ReactiveProp setter).
	 */
	group?: Value
}

export type SwitchProps = ControlBaseProps & {
	checked?: boolean
	/**
	 * Label position relative to the track — 'start' or 'end' (default 'end').
	 * Adapter maps start/end to physical left/right based on document direction (RTL/LTR).
	 */
	labelPosition?: 'start' | 'end'
}

// ── State types ─────────────────────────────────────────────────────────────

export type ControlState = {
	/** The resolved label text (from label prop or children) */
	readonly labelText: JSX.Element | string | undefined
	/** The resolved label element attributes (when label is an object) */
	readonly labelAttrs: Record<string, unknown>
}

export type RadioState = ControlState & {
	/** Derived checked state from group/value or explicit checked prop */
	readonly checked: boolean
}

export type SwitchState = ControlState & {
	/** Resolved label position — 'start' or 'end' (default 'end') */
	readonly labelPosition: 'start' | 'end'
	/** role="switch" for the input element */
	readonly role: 'switch'
	/** aria-checked value for the input element */
	readonly ariaChecked: boolean | undefined
}

// ── Shared label resolution ─────────────────────────────────────────────────

function resolveLabel(props: ControlBaseProps): ControlState {
	return {
		get labelAttrs() {
			return isObject(props.label) && !(props.label instanceof PounceElement)
				? (props.label as Record<string, unknown>)
				: {}
		},
		get labelText() {
			return isString(props.label) || props.label instanceof PounceElement
				? props.label
				: props.children
		},
	}
}

// ── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Headless checkbox logic.
 *
 * @example
 * ```tsx
 * const Checkbox = (props: CheckboxProps) => {
 *   const state = useCheckbox(props)
 *   return (
 *     <label {...state.labelAttrs}>
 *       <input type="checkbox" checked={props.checked} onChange={props.onChange} />
 *       <span>{state.labelText}</span>
 *       {props.description && <small>{props.description}</small>}
 *     </label>
 *   )
 * }
 * ```
 */
export function useCheckbox(props: CheckboxProps): ControlState {
	return resolveLabel(props)
}

/**
 * Headless radio logic.
 *
 * Derives `isChecked` from `group === value` when group binding is used.
 * `select()` writes `value` back to `group` via Pounce's props proxy setter.
 *
 * @example
 * ```tsx
 * const Radio = (props: RadioProps) => {
 *   const state = useRadio(props)
 *   return (
 *     <label {...state.labelAttrs}>
 *       <input type="radio" checked={state.isChecked} onChange={state.select} />
 *       <span>{state.labelText}</span>
 *     </label>
 *   )
 * }
 * ```
 */
export function useRadio(props: RadioProps): RadioState {
	return {
		...resolveLabel(props),
		get checked() {
			return props.group === props.value
		},
		set checked(v) {
			if (v) props.group = props.value
			else props.group = undefined
		},
	}
}

/**
 * Headless switch logic.
 *
 * Extends checkbox with role="switch", aria-checked, and labelPosition.
 * The adapter maps labelPosition 'start'/'end' to physical left/right
 * based on document direction (RTL/LTR).
 *
 * @example
 * ```tsx
 * const Switch = (props: SwitchProps) => {
 *   const state = useSwitch(props)
 *   return (
 *     <label class={state.labelPosition === 'start' ? 'label-start' : ''}>
 *       <input type="checkbox" role={state.role} aria-checked={state.ariaChecked} />
 *       <span>{state.labelText}</span>
 *     </label>
 *   )
 * }
 * ```
 */
export function useSwitch(props: SwitchProps): SwitchState {
	return {
		...resolveLabel(props),
		get labelPosition() {
			return props.labelPosition ?? 'end'
		},
		get role(): 'switch' {
			return 'switch'
		},
		get ariaChecked() {
			return props.checked
		},
	}
}
