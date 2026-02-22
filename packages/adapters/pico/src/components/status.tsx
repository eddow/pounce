import { type ElementPassthroughProps, Icon, type IconProps, type VariantProps } from '@pounce/ui'
import { type ChipProps, chipModel } from '@pounce/ui/models'

export type BadgeProps = VariantProps &
	IconProps &
	ElementPassthroughProps<'span'> & {
		tag?: string
		children?: JSX.Children
	}

export type PillProps = VariantProps &
	IconProps &
	ElementPassthroughProps<'span'> & {
		tag?: string
		trailingIcon?: string | JSX.Element
		children?: JSX.Children
	}

export type { ChipProps }

export function Badge(props: BadgeProps) {
	return (
		<dynamic
			tag={props.tag ?? 'span'}
			class={`badge${props.variant ? ` badge-${props.variant}` : ''}`}
			{...props.el}
		>
			{props.icon &&
				(typeof props.icon === 'string' ? <Icon name={props.icon} size="0.875em" /> : props.icon)}
			{props.children}
		</dynamic>
	)
}

export function Pill(props: PillProps) {
	return (
		<dynamic
			tag={props.tag ?? 'span'}
			class={`pill${props.variant ? ` pill-${props.variant}` : ''}`}
			{...props.el}
		>
			{props.icon &&
				(typeof props.icon === 'string' ? <Icon name={props.icon} size="0.875em" /> : props.icon)}
			{props.children}
			{props.trailingIcon &&
				(typeof props.trailingIcon === 'string' ? (
					<Icon name={props.trailingIcon} size="0.875em" />
				) : (
					props.trailingIcon
				))}
		</dynamic>
	)
}

export function Chip(props: ChipProps) {
	const model = chipModel(props)
	return (
		<dynamic if={model.isVisible} tag={model.tag} class="chip" {...props.el}>
			{props.children}
			<button
				if={model.dismissible}
				onClick={model.dismiss}
				aria-label={model.dismissLabel}
				style="background:none;border:none;cursor:pointer;padding:0 0.25em;line-height:1"
			>
				×
			</button>
		</dynamic>
	)
}
