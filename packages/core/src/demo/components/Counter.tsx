/**
 * Counter Web Component using inline JSX templating (functional standard)
 */

import { effect, watch } from 'mutts'
import './Counter.scss'
import { defaults } from '../../lib'

export default function CounterWebComponent(props: {
	count: number
	onCountIncremented?: (newCount: number) => void
	onCountDecremented?: (newCount: number) => void
	onCountReset?: () => void
	onCountChanged?: (newCount: number, oldCount: number) => void
	maxValue?: number
	minValue?: number
	step?: number
	disabled?: boolean
	showSlider?: boolean
	showInput?: boolean
	label?: string
}) {
	const vm = defaults(props, {
		maxValue: 100,
		minValue: 0,
		step: 1,
		disabled: false,
		showSlider: true,
		showInput: true,
		label: 'Counter Component (JSX)',
	})

	effect.named('Counter')(() => {
		console.log('🎯 Counter component mounted!')
		return () => {
			console.log('👋 Counter component unmounted!', { finalCount: vm.count })
		}
	})
	watch(
		() => vm.count,
		(v, o) => vm.onCountChanged?.(v, o!)
	)

	function increment() {
		vm.count = vm.count + 1
		vm.onCountIncremented?.(vm.count)
	}

	function decrement() {
		vm.count = vm.count - 1
		vm.onCountDecremented?.(vm.count)
	}

	function reset() {
		vm.count = 0
		vm.onCountReset?.()
	}

	const counterTextStyle = () => {
		const normalized = Math.max(0, Math.min(100, vm.count))
		const red = Math.round(255 * (1 - normalized / 100))
		const green = Math.round(255 * (normalized / 100))
		return `color: rgb(${red}, ${green}, 0); transition: color 0.3s ease;`
	}

	return (
		<>
			<h2>{vm.label}</h2>
			<div class="count-display">
				Count:{' '}
				<span class="counter-text" style={counterTextStyle()}>
					{vm.count}
				</span>
			</div>
			<div class="message">
				{vm.count === 0 ? 'Click the button to increment!' : `Current count: ${vm.count}`}
			</div>
			<div if={vm.showSlider} class="slider-container">
				<label class="slider-label" htmlFor="count-slider">
					Set Count: {vm.count}
				</label>
				<input
					type="range"
					id="count-slider"
					class="slider"
					min={vm.minValue}
					max={vm.maxValue}
					step={vm.step}
					value={vm.count}
					update:value={(v: number) => {
						vm.count = v
					}}
					disabled={vm.disabled || vm.maxValue === vm.minValue}
				/>
			</div>
			<div if={vm.showInput} class="input-container">
				<label class="input-label" htmlFor="count-input">
					Direct Input:
				</label>
				<input
					type="number"
					id="count-input"
					class="count-input"
					min={vm.minValue}
					max={vm.maxValue}
					step={vm.step}
					value={vm.count}
					update:value={(v: number) => {
						vm.count = v
					}}
					disabled={vm.disabled || vm.maxValue === vm.minValue}
				/>
			</div>
			<div class="controls">
				<button
					class="decrement"
					disabled={vm.disabled || vm.count <= vm.minValue}
					onClick={decrement}
				>
					-
				</button>
				<button class="reset" disabled={vm.disabled || vm.count === vm.minValue} onClick={reset}>
					Reset
				</button>
				<button
					class="increment"
					disabled={vm.disabled || vm.count >= vm.maxValue}
					onClick={increment}
				>
					+
				</button>
			</div>
		</>
	)
}
