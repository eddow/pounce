import { compose } from '@pounce/core'
import { componentStyle } from '@pounce/kit/dom'
import { getAdapter } from '../adapter/registry'
import { asVariant, getVariantTrait } from '../shared/variants'

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
	const state = compose({ max: 100, variant: 'primary' }, props)
	const variantTrait = getVariantTrait(state.variant)
	const baseTrait = { classes: [adapter.classes?.base || 'pounce-progress'] }
	const isIndeterminate = () => state.value === undefined || state.value === null

	return (
		<progress
			{...state.el}
			traits={[baseTrait, variantTrait].filter((t): t is import('@pounce/core').Trait => !!t)}
			value={isIndeterminate() ? undefined : state.value}
			max={state.max}
			role="progressbar"
			aria-valuenow={isIndeterminate() ? undefined : state.value}
			aria-valuemin={0}
			aria-valuemax={state.max}
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
