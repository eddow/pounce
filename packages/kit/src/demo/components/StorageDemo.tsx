import { componentStyle } from '../../css'
import { stored } from '../../dom/storage'

componentStyle.css`
	.sd-section { margin-bottom: 32px; }
	.sd-section h2 { font-size: 16px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px; }
	.sd-card {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		background: #1a2035;
		border-radius: 8px;
		margin-bottom: 8px;
		overflow: hidden;
	}
	.sd-content { padding: 16px 20px; }
	.sd-code {
		padding: 16px 20px;
		background: #0d1117;
		border-left: 1px solid #1e2535;
		font-family: monospace;
		font-size: 12px;
		color: #64748b;
		display: flex;
		align-items: center;
	}
	.sd-label { font-size: 11px; color: #475569; margin-bottom: 8px; font-family: monospace; text-transform: uppercase; letter-spacing: .04em; }
	.sd-row { display: flex; align-items: center; gap: 8px; }
	.sd-val { font-size: 22px; font-weight: 700; color: #7dd3fc; font-family: monospace; min-width: 40px; }
	.sd-input {
		background: #1a2035;
		border: 1px solid #2d3748;
		border-radius: 4px;
		color: #e2e8f0;
		padding: 6px 10px;
		font-size: 14px;
		width: 180px;
	}
	.sd-btn {
		padding: 5px 12px;
		border-radius: 5px;
		border: 1px solid #2d3748;
		background: #0d1117;
		color: #94a3b8;
		cursor: pointer;
		font-size: 13px;
	}
	.sd-btn:hover { border-color: #3b82f6; color: #7dd3fc; }
	.sd-hint { font-size: 12px; color: #475569; margin-top: 12px; font-style: italic; }
`

const prefs = stored({
	visits: 0,
	name: 'world',
	counter: 0,
})

export default function StorageDemo() {
	function onMount() {
		prefs.visits = prefs.visits + 1
	}
	function increment() {
		prefs.counter = prefs.counter + 1
	}
	function decrement() {
		prefs.counter = prefs.counter - 1
	}
	function reset() {
		prefs.counter = 0
	}

	return (
		<section class="sd-section" use={onMount}>
			<h2>localStorage — stored()</h2>
			<p style="font-size:13px;color:#94a3b8;margin:0 0 16px">
				<code style="color:#7dd3fc">stored(&#123; key: default &#125;)</code> returns a reactive
				object persisted to <code style="color:#7dd3fc">localStorage</code>. Reload — values
				survive. Two tabs — they sync.
			</p>

			<div class="sd-card">
				<div class="sd-content">
					<div class="sd-label">visits</div>
					<div class="sd-row">
						<span class="sd-val">{prefs.visits}</span>
						<span style="font-size:12px;color:#475569">auto-incremented on mount</span>
					</div>
				</div>
				<div class="sd-code">prefs.visits</div>
			</div>

			<div class="sd-card">
				<div class="sd-content">
					<div class="sd-label">name</div>
					<div class="sd-row">
						<input
							class="sd-input"
							type="text"
							value={prefs.name}
							update:value={(v: string) => {
								prefs.name = v
							}}
						/>
						<span style="font-size:14px;color:#94a3b8">
							Hello, <strong style="color:#7dd3fc">{prefs.name}</strong>!
						</span>
					</div>
				</div>
				<div class="sd-code">prefs.name</div>
			</div>

			<div class="sd-card">
				<div class="sd-content">
					<div class="sd-label">counter</div>
					<div class="sd-row">
						<button class="sd-btn" onClick={decrement}>
							−
						</button>
						<span class="sd-val">{prefs.counter}</span>
						<button class="sd-btn" onClick={increment}>
							+
						</button>
						<button class="sd-btn" onClick={reset}>
							Reset
						</button>
					</div>
				</div>
				<div class="sd-code">prefs.counter</div>
			</div>

			<p class="sd-hint">Reload to verify persistence · open two tabs to see inter-tab sync</p>
		</section>
	)
}
