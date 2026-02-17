import { defaults } from '@pounce/core'
import { componentStyle } from '@pounce/kit'
import { getAdapter } from '../adapter/registry'
import { asVariant, variantProps } from '../shared/variants'

componentStyle.sass`
.pounce-progress
	width: 100%
	height: 0.5rem
	appearance: none
	border: none
	border-radius: var(--pounce-border-radius, 0.5rem)
	overflow: hidden
	background-color: var(--pounce-progress-bg, var(--pounce-bg-muted, rgba(0, 0, 0, 0.1)))

	&::-webkit-progress-bar
		background-color: var(--pounce-progress-bg, var(--pounce-bg-muted, rgba(0, 0, 0, 0.1)))
		border-radius: var(--pounce-border-radius, 0.5rem)

	&::-webkit-progress-value
		background-color: var(--pounce-progress-fill, var(--pounce-primary, currentColor))
		border-radius: var(--pounce-border-radius, 0.5rem)
		transition: width 0.3s ease

	&::-moz-progress-bar
		background-color: var(--pounce-progress-fill, var(--pounce-primary, currentColor))
		border-radius: var(--pounce-border-radius, 0.5rem)

	&:indeterminate
		&::-webkit-progress-bar
			background: linear-gradient(90deg, transparent 25%, var(--pounce-progress-fill, var(--pounce-primary, currentColor)) 50%, transparent 75%)
			background-size: 200% 100%
			animation: pounce-progress-indeterminate 1.5s linear infinite

		&::-moz-progress-bar
			background: linear-gradient(90deg, transparent 25%, var(--pounce-progress-fill, var(--pounce-primary, currentColor)) 50%, transparent 75%)
			background-size: 200% 100%
			animation: pounce-progress-indeterminate 1.5s linear infinite

@keyframes pounce-progress-indeterminate
	0%
		background-position: 200% 0
	100%
		background-position: -200% 0
`

export type ProgressProps = {
	value?: number
	max?: number
	variant?: string
	el?: JSX.GlobalHTMLAttributes
}

const ProgressBase = (props: ProgressProps) => {
	const adapter = getAdapter('Progress')
	const p = defaults(props, { max: 100 })
	const isIndeterminate = () => props.value === undefined || props.value === null

	return (
		<progress
			{...variantProps(props.variant)}
			{...props.el}
			class={adapter.classes?.base || 'pounce-progress'}
			value={isIndeterminate() ? undefined : props.value}
			max={p.max}
			role="progressbar"
			aria-valuenow={isIndeterminate() ? undefined : props.value}
			aria-valuemin={0}
			aria-valuemax={p.max}
		/>
	)
}

/**
 * Thin wrapper around native `<progress>` with variant support.
 *
 * Omit `value` for indeterminate mode.
 *
 * @example
 * ```tsx
 * <Progress value={75} />
 * <Progress />                    // indeterminate
 * <Progress.danger value={30} />  // coloured variant
 * ```
 *
 * Adapter key: `Progress` (BaseAdaptation)
 */
export const Progress = asVariant(ProgressBase)
