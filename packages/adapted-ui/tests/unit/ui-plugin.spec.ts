import { describe, expect, it } from 'vitest'
import { pounceUIPlugin } from '../../vite-plugin-pounce-ui'

describe('pounceUIPlugin', () => {
	it('wraps css tagged templates in pounce.components layer', async () => {
		const plugin = pounceUIPlugin()
		type TransformHook = NonNullable<typeof plugin.transform>
		type TransformHandler = TransformHook extends { handler: infer Handler }
			? Handler
			: TransformHook
		type TransformContext = ThisParameterType<
			TransformHandler extends (...args: unknown[]) => unknown ? TransformHandler : never
		>
		const transform = typeof plugin.transform === 'function'
			? plugin.transform
			: plugin.transform?.handler
		const source = "const style = css`color: red;`"
		const context = {} as TransformContext
		const result = await transform?.call(context, source, '/proj/src/button.ts')

		expect(result).not.toBeNull()
		if (result && typeof result !== 'string') {
			expect(result.code).toContain('@layer pounce.components')
		}
	})

	it('throws on forbidden --pico-* variables', async () => {
		const plugin = pounceUIPlugin()
		type TransformHook = NonNullable<typeof plugin.transform>
		type TransformHandler = TransformHook extends { handler: infer Handler }
			? Handler
			: TransformHook
		type TransformContext = ThisParameterType<
			TransformHandler extends (...args: unknown[]) => unknown ? TransformHandler : never
		>
		const transform = typeof plugin.transform === 'function'
			? plugin.transform
			: plugin.transform?.handler
		const source = "const style = css`color: var(--pico-primary);`"

		const context = {} as TransformContext
		await expect(async () => {
			await transform?.call(context, source, '/proj/src/button.ts')
		}).rejects.toThrow('Forbidden variables')
	})
})
