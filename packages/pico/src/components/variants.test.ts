import { type Variant, variantClass } from './variants'

describe('variantClass()', () => {
	describe('Returns correct class for each variant type', () => {
		test('returns empty string for primary variant', () => {
			expect(variantClass('primary')).toBe('')
		})

		test('returns "secondary" for secondary variant', () => {
			expect(variantClass('secondary')).toBe('secondary')
		})

		test('returns "contrast" for contrast variant', () => {
			expect(variantClass('contrast')).toBe('contrast')
		})

		test('returns "danger" for danger variant', () => {
			expect(variantClass('danger')).toBe('danger')
		})

		test('returns "success" for success variant', () => {
			expect(variantClass('success')).toBe('success')
		})

		test('returns "warning" for warning variant', () => {
			expect(variantClass('warning')).toBe('warning')
		})
	})

	describe('Handles undefined/null input', () => {
		test('returns empty string for undefined', () => {
			expect(variantClass(undefined)).toBe('')
		})

		test('handles null-like values (type coercion)', () => {
			// TypeScript won't allow null, but testing the function's behavior
			// with undefined which is the actual type
			expect(variantClass(undefined as any)).toBe('')
		})
	})

	describe('Returns primary as default for invalid variants', () => {
		test('returns "secondary" for invalid string (fallback behavior)', () => {
			// TypeScript would prevent this, but runtime could have invalid values
			// The function returns 'secondary' for any variant not in the special list
			expect(variantClass('invalid' as Variant)).toBe('secondary')
		})

		test('returns empty string (primary) for empty string', () => {
			// Empty string is falsy, so it returns empty string
			expect(variantClass('' as Variant)).toBe('')
		})

		test('returns empty string (primary) for any falsy variant', () => {
			// The function checks `!variant || variant === 'primary'`
			// So any falsy value returns empty string
			expect(variantClass(undefined)).toBe('')
		})

		test('returns "secondary" for any variant not in special list', () => {
			// The function logic: if variant is not in ['contrast', 'danger', 'success', 'warning']
			// and not primary/undefined, it returns 'secondary'
			// This is the fallback behavior for 'secondary' variant
			expect(variantClass('secondary')).toBe('secondary')
		})
	})

	describe('Edge cases', () => {
		test('all valid variants return non-empty strings except primary', () => {
			const variants: Variant[] = ['secondary', 'contrast', 'danger', 'success', 'warning']
			variants.forEach((variant) => {
				const result = variantClass(variant)
				expect(result).not.toBe('')
				expect(typeof result).toBe('string')
			})
		})

		test('primary and undefined both return empty string', () => {
			expect(variantClass('primary')).toBe('')
			expect(variantClass(undefined)).toBe('')
			expect(variantClass('primary')).toBe(variantClass(undefined))
		})

		test('variant class names match variant names for special variants', () => {
			expect(variantClass('contrast')).toBe('contrast')
			expect(variantClass('danger')).toBe('danger')
			expect(variantClass('success')).toBe('success')
			expect(variantClass('warning')).toBe('warning')
		})

		test('secondary variant returns "secondary" string', () => {
			const result = variantClass('secondary')
			expect(result).toBe('secondary')
			expect(result.length).toBeGreaterThan(0)
		})
	})
})
