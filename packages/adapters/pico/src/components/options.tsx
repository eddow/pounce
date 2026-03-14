import {
	type ComboboxProps,
	comboboxModel,
	type MultiselectItemState,
	type MultiselectProps,
	multiselectModel,
	type SelectProps,
	selectModel,
} from '@sursaut/ui/models'

export function Select(props: SelectProps) {
	const model = selectModel(props)
	return (
		<select {...props.el} {...model.select} style={props.fullWidth ? 'width:100%' : undefined}>
			{model.options}
		</select>
	)
}

export function Combobox(props: ComboboxProps) {
	const model = comboboxModel(props)
	const {
		options: _,
		el: __,
		variant: ___,
		valid: ____,
		validationMessage: _____,
		disabled: ______,
		...inputProps
	} = props
	return (
		<div style="display:flex;flex-direction:column;gap:0.25rem">
			<input type="text" {...inputProps} {...props.el} {...model.input} />
			{model.dataList}
		</div>
	)
}

export type MultiselectAdapterProps<T> = MultiselectProps<T> & { label?: JSX.Children }

const defaultRenderItem = <T,>(item: T, checked: boolean) => (
	<span style="display:flex;gap:0.5rem;align-items:center">
		<span style={`opacity:${checked ? 1 : 0}`}>✓</span>
		<span>{String(item)}</span>
	</span>
)

export function Multiselect<T>(props: MultiselectAdapterProps<T>) {
	const modelProps: MultiselectProps<T> = {
		get items() {
			return props.items
		},
		get value() {
			return props.value
		},
		get equals() {
			return props.equals
		},
		get onChange() {
			return props.onChange
		},
		get closeOnSelect() {
			return props.closeOnSelect
		},
		get variant() {
			return props.variant
		},
		get renderItem() {
			return props.renderItem ?? defaultRenderItem
		},
	}
	const model = multiselectModel(modelProps)
	return (
		<details use:mount={model.onMount} {...model.details}>
			<summary {...model.summary}>{props.label}</summary>
			<ul style="list-style:none;padding:0.5rem;margin:0">
				<for each={model.items}>
					{(item: MultiselectItemState<T>) =>
						item.render() !== false && (
							<li {...item.el} style="cursor:pointer;padding:0.25rem 0.5rem">
								{item.render()}
							</li>
						)
					}
				</for>
			</ul>
		</details>
	)
}
