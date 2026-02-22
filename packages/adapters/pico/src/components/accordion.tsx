import { defaults } from '@pounce/core'
import { type AccordionEnv, type AccordionProps, accordionModel } from '@pounce/ui/models'

/**
 * PicoCSS Accordion component
 *
 * Uses native `<details>`/`<summary>` elements.
 * For exclusive/multi-open groups, wrap with `<AccordionGroup>`.
 *
 * @example
 * ```tsx
 * <Accordion open={isOpen} onToggle={setIsOpen} summary="Click me">
 *   Content inside
 * </Accordion>
 *
 * <AccordionGroup>
 *   <Accordion summary="Item 1">Content 1</Accordion>
 *   <Accordion summary="Item 2">Content 2</Accordion>
 * </AccordionGroup>
 * ```
 */
export type AccordionGroupProps = {
	/** If true, multiple accordions can be open simultaneously. Default: false (single-open). */
	opened?: Set<HTMLDetailsElement> | HTMLDetailsElement | null
	children?: JSX.Children
}

export function AccordionGroup(props: AccordionGroupProps, env: AccordionEnv) {
	const p = defaults(props, {
		opened: null,
	})
	Object.defineProperty(env, 'accordionGroup', {
		get: () => p.opened,
		set(v) {
			p.opened = v
		},
	})
	return props.children
}

export function Accordion(props: AccordionProps, env: AccordionEnv) {
	const model = accordionModel(props, env)

	return (
		<details use:mount={model.onMount} {...model.details} {...props.el}>
			<summary>{props.summary}</summary>
			{props.children}
		</details>
	)
}
