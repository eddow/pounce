import { biDi, reactive } from 'mutts'
import { type PointerState } from '../directives/pointer'

export default function DebugActions() {
	// --- Resize State ---
	const resizeSize = reactive({ width: 300, height: 200 })

	// --- Scroll State ---
	const xScroll = reactive({ value: 0, max: 0 })
	const yScroll = reactive({ value: 0, max: 0 })
	const bindX = (el: HTMLInputElement) => {
		const provide = biDi(
			(v) => (el.value = String(v)),
			() => xScroll.value,
			(v) => (xScroll.value = Number(v))
		)
		el.addEventListener('input', () => provide(Number(el.value)))
	}
	const bindY = (el: HTMLInputElement) => {
		const provide = biDi(
			(v) => (el.value = String(v)),
			() => yScroll.value,
			(v) => (yScroll.value = Number(v))
		)
		el.addEventListener('input', () => provide(Number(el.value)))
	}

	// --- Intersect State ---
	const intersectState = reactive({ isIntersecting: false, ratio: 0 })
	// We'll use a local variable for the intersection handler
	const onIntersectChange = (entry: IntersectionObserverEntry) => {
		intersectState.isIntersecting = entry.isIntersecting
		intersectState.ratio = entry.intersectionRatio
	}

	// --- Pointer State ---
	const pointerVal = reactive<{ value: PointerState | undefined }>({ value: undefined })

	return (
		<div style="padding: 20px; display: flex; flex-direction: column; gap: 4rem;">
			<h1>Directives Debug</h1>

			{/* Resize Section */}
			<section>
				<h2>Resize</h2>
				<div style="display: flex; gap: 10px; margin-bottom: 20px;">
					<label>
						Width:{' '}
						<input
							type="number"
							value={resizeSize.width}
							onInput={(e) => (resizeSize.width = Number((e.target as any).value))}
						/>
					</label>
					<label>
						Height:{' '}
						<input
							type="number"
							value={resizeSize.height}
							onInput={(e) => (resizeSize.height = Number((e.target as any).value))}
						/>
					</label>
				</div>
				<div
					style="border: 2px solid var(--pico-primary); overflow: auto; resize: both; display: flex; align-items: center; justify-content: center; min-width: 50px; min-height: 50px;"
					use:resize={resizeSize}
				>
					{resizeSize.width} x {resizeSize.height}
				</div>
			</section>

			{/* Scroll Section */}
			<section>
				<h2>Scroll</h2>
				<div style="display: flex; gap: 20px; align-items: start;">
					<div
						id="scroll-container"
						style="width: 300px; height: 200px; border: 2px solid var(--pico-primary); overflow: auto;"
						use:scroll={{ x: xScroll, y: yScroll }}
					>
						<div style="width: 600px; height: 400px; background: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee), linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee); background-position: 0 0, 10px 10px; background-size: 20px 20px;">
							<div style="padding: 20px;">Scroll me!</div>
						</div>
					</div>
					<div>
						<label>
							X: <input type="range" min={0} max={xScroll.max} use={bindX} />{' '}
							<span>
								{Math.round(xScroll.value)} / {xScroll.max}
							</span>
						</label>
						<label>
							Y: <input type="range" min={0} max={yScroll.max} use={bindY} />{' '}
							<span>
								{Math.round(yScroll.value)} / {yScroll.max}
							</span>
						</label>
					</div>
				</div>
			</section>

			{/* Intersect Section */}
			<section>
				<h2>Intersect</h2>
				<div style="display: flex; gap: 2rem; align-items: start;">
					<div style="border: 1px solid gray; height: 150px; overflow: auto; width: 200px;">
						<div style="height: 400px; display: flex; flex-direction: column; justify-content: space-between; align-items: center;">
							<div>Top Spacer</div>
							<div
								style={{
									width: '100px',
									height: '100px',
									background: intersectState.isIntersecting ? 'var(--pico-primary)' : 'gray',
									transition: 'background 0.3s',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: 'white',
								}}
								use:intersect={{
									onChange: onIntersectChange,
									threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
								}}
							>
								Target
							</div>
							<div>Bottom Spacer</div>
						</div>
					</div>
					<div>
						<p>
							<strong>Intersection Ratio:</strong> {Math.round(intersectState.ratio * 100)}%
						</p>
						<p>
							<strong>Is Intersecting:</strong> {intersectState.isIntersecting ? 'Yes' : 'No'}
						</p>
						<p>Scroll the box to the left.</p>
					</div>
				</div>
			</section>

			{/* Pointer Section */}
			<section>
				<h2>Pointer</h2>
				<div
					style="width: 100%; height: 300px; background: #f9f9f9; border: 2px dashed var(--pico-secondary); position: relative; overflow: hidden; touch-action: none;"
					use:pointer={pointerVal}
				>
					<div style="position: absolute; top: 10px; left: 10px; pointer-events: none;">
						<pre if={pointerVal.value}>
							x: {Math.round(pointerVal.value?.x ?? 0)}
							{'\n'}
							y: {Math.round(pointerVal.value?.y ?? 0)}
							{'\n'}
							buttons: {pointerVal.value?.buttons ?? 0}
						</pre>
						<em else>Move pointer here...</em>
					</div>

					{/* Crosshair */}
					<fragment if={pointerVal.value}>
						<div
							style={{
								position: 'absolute',
								left: 0,
								top: `${pointerVal.value?.y}px`,
								width: '100%',
								height: '1px',
								background: 'red',
								pointerEvents: 'none',
							}}
						/>
						<div
							style={{
								position: 'absolute',
								left: `${pointerVal.value?.x}px`,
								top: 0,
								width: '1px',
								height: '100%',
								background: 'red',
								pointerEvents: 'none',
							}}
						/>
					</fragment>
				</div>
			</section>
		</div>
	)
}
