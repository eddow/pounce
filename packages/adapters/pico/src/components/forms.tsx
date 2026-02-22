import { type ComboboxProps, comboboxModel, type SelectProps } from '@pounce/ui/models'

export function Select(props: SelectProps) {
	const { fullWidth, variant, children, ...rest } = props
	return (
		<select {...rest} style={fullWidth ? 'width:100%' : undefined}>
			{children}
		</select>
	)
}

export function Combobox(props: ComboboxProps) {
	const model = comboboxModel(props)
	return (
		<div style="display:flex;flex-direction:column;gap:0.25rem">
			<input
				type="text"
				disabled={props.disabled}
				placeholder={props.placeholder}
				{...model.input}
			/>
			{model.dataList}
		</div>
	)
}
