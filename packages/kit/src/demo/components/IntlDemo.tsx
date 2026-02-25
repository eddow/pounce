import { reactive } from 'mutts'
import { DisplayProvider } from '../../components'
import { componentStyle } from '../../css'
import {
	DisplayNames,
	Date as IntlDate,
	List as IntlList,
	Number as IntlNumber,
	type IntlPluralCases,
	Plural,
	RelativeTime,
} from '../../intl'

componentStyle.css`
	.id-section { margin-bottom: 32px; }
	.id-section h2 { font-size: 16px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px; }
	.id-locale-bar {
		display: flex;
		gap: 8px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}
	.id-locale-btn {
		padding: 5px 12px;
		border-radius: 5px;
		border: 1px solid #2d3748;
		background: #0d1117;
		color: #94a3b8;
		cursor: pointer;
		font-size: 13px;
	}
	.id-locale-btn:hover { border-color: #3b82f6; color: #7dd3fc; }
	.id-locale-btn.active { background: #1e3a5f; border-color: #3b82f6; color: #7dd3fc; }
	.id-rows { display: flex; flex-direction: column; gap: 6px; }
	.id-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		background: #1a2035;
		border-radius: 6px;
		overflow: hidden;
	}
	.id-content { padding: 10px 14px; display: flex; align-items: center; }
	.id-out { font-size: 16px; color: #7dd3fc; font-weight: 600; }
	.id-key {
		padding: 10px 14px;
		background: #0d1117;
		border-left: 1px solid #1e2535;
		font-family: monospace;
		font-size: 11px;
		color: #475569;
		display: flex;
		align-items: center;
	}
	.id-slider-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
	.id-slider-row input[type=range] { flex: 1; }
	.id-slider-val { font-size: 14px; color: #f59e0b; font-family: monospace; min-width: 30px; }
`

const LOCALES = ['en-US', 'fr-FR', 'ar-EG', 'ja-JP']

const state = reactive({
	locale: 'en-US',
	count: 3,
})

const fixedDate = new globalThis.Date('2023-06-15T10:30:00Z')
const counts: Record<string, IntlPluralCases> = {
	'en-US': {
		one: 'one item',
		other: (n) => `${n} items`,
	},
	'fr-FR': {
		one: (n) => `${n} truc`,
		other: (n) => `${n} trucs`,
	},
	'ar-EG': {
		zero: 'لا شيء',
		one: 'شيء واحد',
		two: 'شيئان', // 'two' is a specific category in Arabic
		few: (n) => `${n} أشياء`, // 3 to 10
		many: (n) => `${n} شيئًا`, // 11 to 99
		other: (n) => `${n} شيء`, // 100+ and decimals
	},
	'ja-JP': {
		// Japanese is a "root" plural language.
		// Intl.PluralRules('ja-JP').select(n) ALWAYS returns 'other'.
		other: (n) => (n === 1 ? '一つ' : n === 2 ? '二つ' : `${n} つ`),
	},
}
export default function IntlDemo() {
	function setLocale(l: string) {
		state.locale = l
	}

	return (
		<DisplayProvider locale={state.locale}>
			<section class="id-section">
				<h2>Intl Components</h2>
				<p style="font-size:13px;color:#94a3b8;margin:0 0 16px">
					All 6 Intl components — output updates reactively when locale changes.
				</p>

				<div class="id-locale-bar">
					<for each={LOCALES}>
						{(l) => (
							<button
								class={`id-locale-btn${state.locale === l ? ' active' : ''}`}
								onClick={() => setLocale(l)}
							>
								{l}
							</button>
						)}
					</for>
				</div>

				<div class="id-slider-row">
					<span style="font-size:12px;color:#64748b;font-family:monospace;min-width:100px">
						count (Plural):
					</span>
					<input
						type="range"
						min="0"
						max="10"
						value={String(state.count)}
						update:value={(v: string) => {
							state.count = globalThis.Number(v)
						}}
					/>
					<span class="id-slider-val">{state.count}</span>
				</div>

				<div class="id-rows">
					<div class="id-row">
						<div class="id-content">
							<span class="id-out">
								<IntlNumber value={1234567.89} style="currency" currency="EUR" />
							</span>
						</div>
						<div class="id-key">
							&lt;Number value={1234567.89} style="currency" currency="EUR" /&gt;
						</div>
					</div>
					<div class="id-row">
						<div class="id-content">
							<span class="id-out">
								<IntlNumber value={0.874} style="percent" />
							</span>
						</div>
						<div class="id-key">&lt;Number value={0.874} style="percent" /&gt;</div>
					</div>
					<div class="id-row">
						<div class="id-content">
							<span class="id-out">
								<IntlDate value={fixedDate} dateStyle="long" />
							</span>
						</div>
						<div class="id-key">&lt;Date value={String(fixedDate)} dateStyle="long" /&gt;</div>
					</div>
					<div class="id-row">
						<div class="id-content">
							<span class="id-out">
								<RelativeTime value={-3} unit="day" />
							</span>
						</div>
						<div class="id-key">&lt;RelativeTime value={-3} unit="day" /&gt;</div>
					</div>
					<div class="id-row">
						<div class="id-content">
							<span class="id-out">
								<IntlList value={['apples', 'bananas', 'cherries']} />
							</span>
						</div>
						<div class="id-key">&lt;List value={['apples', 'bananas', 'cherries']} /&gt;</div>
					</div>
					<div class="id-row">
						<div class="id-content">
							<span class="id-out">
								<Plural value={state.count} {...counts[state.locale]} />
							</span>
						</div>
						<div class="id-key">
							&lt;Plural value={'{count}'} {'{...counts[state.locale]}'} /&gt;
						</div>
					</div>
					<div class="id-row">
						<div class="id-content">
							<span class="id-out">
								<DisplayNames value="US" type="region" />
							</span>
						</div>
						<div class="id-key">&lt;DisplayNames value="US" type="region" /&gt;</div>
					</div>
				</div>
			</section>
		</DisplayProvider>
	)
}
