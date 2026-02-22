import { document } from '../shared'
import { PounceElement } from './pounce-element'

/**
 * Default dev-mode error boundary fallback.
 * Renders a visible error panel in the DOM so unhandled throws don't produce a blank screen.
 * Only used when pounceOptions.devCatch is true (dev mode, not prod/test).
 */
export function devCatchElement(error: unknown, retry?: () => void): PounceElement {
	return new PounceElement(() => {
		const panel = document.createElement('div')
		panel.setAttribute(
			'style',
			[
				'display:flex',
				'flex-direction:column',
				'gap:8px',
				'padding:12px 16px',
				'margin:8px 0',
				'background:#1a0000',
				'border:1.5px solid #c00',
				'border-radius:6px',
				'font-family:monospace',
				'font-size:13px',
				'color:#ff6b6b',
			].join(';')
		)

		const title = document.createElement('strong')
		title.textContent = '[pounce] Unhandled render error'
		title.setAttribute('style', 'font-size:14px;color:#ff4444')

		const msg = document.createElement('pre')
		msg.setAttribute('style', 'margin:0;white-space:pre-wrap;word-break:break-word;color:#ffaaaa')
		msg.textContent =
			error instanceof Error
				? `${error.name}: ${error.message}${error.stack ? `\n${error.stack.split('\n').slice(1).join('\n')}` : ''}`
				: String(error)

		panel.appendChild(title)
		panel.appendChild(msg)

		if (retry) {
			const btn = document.createElement('button')
			btn.textContent = 'Retry'
			btn.setAttribute(
				'style',
				'align-self:flex-start;padding:4px 10px;background:#400;border:1px solid #c00;border-radius:4px;color:#ff6b6b;cursor:pointer;font-family:monospace'
			)
			btn.addEventListener('click', retry)
			panel.appendChild(btn)
		}

		return panel
	}, 'dev-catch')
}
