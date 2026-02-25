import { Number, Date as IntlDate, Plural } from '../../../src/intl'
import { reactive } from 'mutts'

export default function IntlTests() {
	const state = reactive({
		count: 0,
		price: 1234.56,
		date: new Date('2024-02-25T12:00:00Z')
	})

	return (
		<div data-testid="intl-view">
			<h1>Intl Tests</h1>
			<div class="controls">
				<button data-action="inc-count" onClick={() => state.count++}>Inc Count</button>
				<button data-action="set-price" onClick={() => state.price = 99.99}>Set Price</button>
			</div>

			<p>Number: <span data-testid="intl-number">
				<Number value={state.price} style="currency" currency="USD" />
			</span></p>

			<p>Date: <span data-testid="intl-date">
				<IntlDate value={state.date} dateStyle="medium" />
			</span></p>

			<p>Plural: <span data-testid="intl-plural">
				<Plural value={state.count} one={`${state.count} item`} other={`${state.count} items`} />
			</span></p>
		</div>
	)
}
