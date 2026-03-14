import { type Children, document, type Env, SursautElement } from '@sursaut/core'
import { link, type ScopedCallback } from 'mutts'
import { mountHead } from './platform/shared.js'

export { mountHeadContent } from './head-mount.js'

export type HeadProps = {
	children?: Children
}

export function useHead(content: Children, env?: Env): ScopedCallback {
	return mountHead(content, env)
}

export function Head(props: HeadProps, env: Env) {
	return new SursautElement(
		() => {
			const anchor = document.createComment('sursaut-head')
			return link(anchor, mountHead(props.children, env))
		},
		'Head',
		undefined,
		true,
		true
	)
}
