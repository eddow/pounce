import { type ComboboxProps, comboboxModel, type SelectProps, selectModel } from '@pounce/ui'

export function Select(props: SelectProps) {
	const model = selectModel(props)
	return (
		<select {...model.select} {...props.el} style={props.fullWidth ? 'width:100%' : undefined}>
			{model.options}
		</select>
	)
}

export function Combobox(props: ComboboxProps) {
	const model = comboboxModel(props)
	return (
		<div style="display:flex;flex-direction:column;gap:0.25rem">
			<input type="text" {...model.input} {...props.el} />
			{model.dataList}
		</div>
	)
}
