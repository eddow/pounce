import { componentStyle } from '../../css'
import { client } from '../../platform/shared'

componentStyle.css`
	.cs-section { margin-bottom: 32px; }
	.cs-section h2 { font-size: 16px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px; }
	.cs-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.cs-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #1a2035;
		border-radius: 6px;
		padding: 8px 12px;
		font-size: 13px;
	}
	.cs-key { color: #64748b; font-family: monospace; }
	.cs-val { color: #7dd3fc; font-family: monospace; font-weight: 600; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.cs-hint { font-size: 12px; color: #475569; margin-top: 12px; font-style: italic; }
`

export default function ClientState() {
	return (
		<section class="cs-section">
			<h2>Client State</h2>
			<p style="font-size:13px;color:#94a3b8;margin:0 0 16px">
				All values below are reactive — they update in real time as browser state changes.
			</p>
			<div class="cs-grid">
				<div class="cs-row">
					<span class="cs-key">url.pathname</span>
					<span class="cs-val">{client.url.pathname}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">url.search</span>
					<span class="cs-val">{client.url.search || '—'}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">url.hash</span>
					<span class="cs-val">{client.url.hash || '—'}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">viewport</span>
					<span class="cs-val">
						{client.viewport.width} × {client.viewport.height}
					</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">language</span>
					<span class="cs-val">{client.language}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">timezone</span>
					<span class="cs-val">{client.timezone}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">direction</span>
					<span class="cs-val">{client.direction}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">devicePixelRatio</span>
					<span class="cs-val">{client.devicePixelRatio}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">online</span>
					<span class="cs-val">{client.online ? 'yes' : 'no'}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">prefersDark</span>
					<span class="cs-val">{client.prefersDark ? 'yes' : 'no'}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">focused</span>
					<span class="cs-val">{client.focused ? 'yes' : 'no'}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">visibilityState</span>
					<span class="cs-val">{client.visibilityState}</span>
				</div>
				<div class="cs-row">
					<span class="cs-key">history.length</span>
					<span class="cs-val">{client.history.length}</span>
				</div>
			</div>
			<p class="cs-hint">Try: resize the window · go offline · switch tabs · change OS dark mode</p>
		</section>
	)
}
