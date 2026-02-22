import {
	type MultiselectItemState,
	type MultiselectProps,
	multiselectModel,
} from '@pounce/ui/models'

export type MultiselectAdapterProps<T> = MultiselectProps<T> & {
	label?: JSX.Children
	children?: JSX.Children
}

export function Multiselect<T>(props: MultiselectAdapterProps<T>) {
	const model = multiselectModel(props)
	return (
		<details use:mount={model.onMount} {...model.details}>
			<summary {...model.summary}>{props.label ?? props.children}</summary>
			<ul style="list-style:none;padding:0.5rem;margin:0">
				<for each={model.items}>
					{(item: MultiselectItemState<T>) =>
						item.rendered !== false && (
							<li
								aria-selected={item.checked}
								onClick={item.toggle}
								style="cursor:pointer;padding:0.25rem 0.5rem"
							>
								{item.rendered}
							</li>
						)
					}
				</for>
			</ul>
		</details>
	)
}
