import { compose } from '@pounce/core'
import { css } from '../lib/css'
import 'pure-glyf/icons'
import { onInject, sheet } from 'pure-glyf'

// Inject pure-glyf styles (initial + reactive)
// We use the @pounce/pico css injection mechanism instead of pure-glyf's mount()
css`${sheet}`
onInject((newCss: string) => css`${newCss}`)

css`
.pp-icon-btn {
	--pp-icon-btn-size: 2rem;
	min-width: 0;
	width: var(--pp-icon-btn-size);
	height: var(--pp-icon-btn-size);
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}
.pp-icon-btn .pure-glyf-icon {
	width: 1.125rem;
	height: 1.125rem;
}
`
export type IconProps = {
	el?: JSX.BaseHTMLAttributes<HTMLSpanElement>
	/** specific class name from pure-glyf (e.g. TablerOutlineHome) */
	icon: string
	/** CSS size like "1em", "24px"; defaults to "1em" */
	size?: string
	/** If true, aligns icon with text baseline; defaults to true */
	inline?: boolean
	/** Optional title for accessibility */
	title?: string
}

/**
 * Simple Icon component using pure-glyf.
 */
export const Icon = (props: IconProps) => {
	const state = compose({ size: '1em', inline: true }, props)

	return (
		<span
			{...state.el}
			class={['pounce-icon', props.icon, state.el?.class]}
			title={props.title}
			style={[
				{
					width: props.size,
					height: props.size,
					verticalAlign: state.inline ? 'middle' : undefined,
				},
				state.el?.style,
			]}
		/>
	)
}
