import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { bindApp, document } from '@pounce/core'
import { perf } from '../../src/perf'
import { Button } from '../../src/components/button'
import { setAdapter, resetAdapter } from '../../src/adapter/registry'
import { vanillaAdapter } from '../../src/adapter/vanilla'

describe('UI Performance Tests', () => {
	let container: HTMLElement
	let unmount: (() => void) | undefined

	beforeEach(() => {
		perf?.clearMarks()
		perf?.clearMeasures()
		setAdapter(vanillaAdapter)
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		unmount?.()
		container.remove()
		perf?.clearMarks()
		perf?.clearMeasures()
		resetAdapter()
	})

	const render = (element: JSX.Element) => {
		unmount = bindApp(element, container)
	}

	describe('Button Performance', () => {
		it('should track click performance', async () => {
			let clickCount = 0
			const onClick = () => { clickCount++; /* Simulate work */ }
			
			// Render button with click handler
			render(<Button onClick={onClick}>Test Button</Button>)
			
			const button = container.querySelector('button')
			expect(button).toBeTruthy()
			
			// Click the button
			button?.click()
			
			// Check performance measures were recorded
			const measures = perf?.getEntriesByName('button:click') || []
			expect(measures).toHaveLength(1)
			expect(measures[0].duration).toBeGreaterThan(0)
			
			// Click should be fast (< 10ms for simple handler)
			expect(measures[0].duration).toBeLessThan(10)
		})

		it('should handle rapid clicks efficiently', () => {
			const onClick = () => { /* Minimal work */ }
			
			// Render button
			render(<Button onClick={onClick}>Rapid Click Test</Button>)
			
			const button = container.querySelector('button')
			expect(button).toBeTruthy()
			
			// Rapid clicks
			for (let i = 0; i < 100; i++) {
				button?.click()
			}
			
			const measures = perf?.getEntriesByName('button:click') || []
			expect(measures).toHaveLength(100)
			
			// Average should still be fast
			const avgDuration = measures.reduce((sum, m) => sum + m.duration, 0) / measures.length
			expect(avgDuration).toBeLessThan(5)
		})
	})

	describe('Performance Benchmarks', () => {
		it('establish baseline performance metrics', () => {
			const results: Record<string, number> = {}
			
			// Button click baseline
			render(<Button onClick={() => {}}>Baseline Test</Button>)
			
			const button = container.querySelector('button')
			expect(button).toBeTruthy()
			
			button?.click()
			const buttonMeasures = perf?.getEntriesByName('button:click') || []
			results['buttonClick'] = buttonMeasures[0]?.duration || 0
			
			// Log results for manual review
			console.log('Performance Baselines:', results)
			
			// These are loose bounds - adjust based on actual measurements
			expect(results.buttonClick).toBeLessThan(10)
		})
	})
})
