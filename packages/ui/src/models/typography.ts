// TODO: to review
// TODO: Hungry dog
import type { VariantProps } from '../shared/types'

// ── Heading ──────────────────────────────────────────────────────────────────

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6
export type HeadingAlign = 'start' | 'center' | 'end'

export type HeadingProps = VariantProps & {
	/** Heading level 1–6. @default 2 */
	level?: HeadingLevel
	/** Override the rendered element tag. Defaults to `h{level}`. */
	tag?: string
	/** Text alignment. @default 'start' */
	align?: HeadingAlign
	children?: JSX.Children
}

export type HeadingModel = {
	/** Resolved heading level clamped to 1–6 */
	readonly level: HeadingLevel
	/** Resolved element tag */
	readonly tag: string
	/** Resolved text alignment */
	readonly align: HeadingAlign
}

/**
 * Headless heading logic.
 *
 * @example
 * ```tsx
 * const Heading = (props: HeadingProps) => {
 *   const model = headingModel(props)
 *   return (
 *     <dynamic tag={model.tag} class={`heading heading-${model.level} align-${model.align}`}>
 *       {props.children}
 *     </dynamic>
 *   )
 * }
 * ```
 */
export function headingModel(props: HeadingProps): HeadingModel {
	const model: HeadingModel = {
		get level() {
			return Math.min(6, Math.max(1, props.level ?? 2)) as HeadingLevel
		},
		get tag() {
			return props.tag ?? `h${model.level}`
		},
		get align() {
			return props.align ?? 'start'
		},
	}
	return model
}

// ── Text ─────────────────────────────────────────────────────────────────────

export type TextSize = 'sm' | 'md' | 'lg'

export type TextProps = VariantProps & {
	/** Dynamic element tag. @default 'p' */
	tag?: string
	/** Text size. @default 'md' */
	size?: TextSize
	/** When true, renders in muted/secondary color. */
	muted?: boolean
	children?: JSX.Children
}

export type TextModel = {
	/** Resolved element tag */
	readonly tag: string
	/** Resolved text size */
	readonly size: TextSize
	/** Whether the text is muted */
	readonly muted: boolean
}

/**
 * Headless text logic.
 *
 * @example
 * ```tsx
 * const Text = (props: TextProps) => {
 *   const model = textModel(props)
 *   return (
 *     <dynamic tag={model.tag} class={`text text-${model.size}${model.muted ? ' text-muted' : ''}`}>
 *       {props.children}
 *     </dynamic>
 *   )
 * }
 * ```
 */
export function textModel(props: TextProps): TextModel {
	const model: TextModel = {
		get tag() {
			return props.tag ?? 'p'
		},
		get size() {
			return props.size ?? 'md'
		},
		get muted() {
			return props.muted ?? false
		},
	}
	return model
}

// ── Link ─────────────────────────────────────────────────────────────────────

export type LinkProps = VariantProps & {
	href?: string
	/** Whether to show underline decoration. @default true */
	underline?: boolean
	children?: JSX.Children
}

export type LinkModel = {
	/** Whether underline is shown */
	readonly underline: boolean
}

/**
 * Headless link logic.
 *
 * The adapter renders an `<a>` element (or `@pounce/kit`'s `A` for SPA routing).
 * Variant and underline are the only behavioral concerns — everything else is
 * passed through via `props`.
 *
 * @example
 * ```tsx
 * const Link = (props: LinkProps) => {
 *   const model = linkModel(props)
 *   return (
 *     <A href={props.href} class={`link${model.underline ? '' : ' no-underline'}`}>
 *       {props.children}
 *     </A>
 *   )
 * }
 * ```
 */
export function linkModel(props: LinkProps): LinkModel {
	const model: LinkModel = {
		get underline() {
			return props.underline ?? true
		},
	}
	return model
}
