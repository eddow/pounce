import { type ElementPassthroughProps, Icon, type IconProps } from '@sursaut/ui'
import { type ChipProps, chipModel } from '@sursaut/ui/models'
import type { PicoVariantProps } from '../factory'

export type BadgeProps = PicoVariantProps &
	IconProps &
	ElementPassthroughProps<'span'> & {
		tag?: string
		children?: JSX.Children
	}

export type PillProps = PicoVariantProps &
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
			tag={props.tag ?? 'mark'}
			{...props.el}
			class={props.el?.class ? ['sursaut-badge', props.el.class] : 'sursaut-badge'}
			data-variant={props.variant}
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
			tag={props.tag ?? 'mark'}
			{...props.el}
			class={props.el?.class ? ['sursaut-pill', props.el.class] : 'sursaut-pill'}
			data-variant={props.variant}
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
		<dynamic
			if={model.isVisible}
			tag={model.tag}
			{...props.el}
			class={props.el?.class ? ['chip', props.el.class] : 'chip'}
		>
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
